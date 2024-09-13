from openai import OpenAI
from opensearchpy import OpenSearch
from db import DBHandler
from config import CONFIG
from flask import Flask, request, jsonify
from sklearn.metrics.pairwise import cosine_similarity
from flask_cors import CORS
import pymysql
import numpy as np
import json
from flask_socketio import SocketIO, send, emit, join_room, leave_room
from summary import sumamrize_prompt
import time
from sineps_handler import (
    classify_category,
    filter_extraction,
    filters_to_opensearch_conditions,
)
import pickle
import cohere

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

cohere_client = cohere.Client(api_key=CONFIG["cohere_api_key"])
openai_client = OpenAI(api_key=CONFIG["openai_api_key"])
opensearch_client = OpenSearch(
    hosts=[{"host": CONFIG["opensearch"]["host"], "port": 443}],
    use_ssl=True,
    http_auth=(CONFIG["opensearch"]["id"], CONFIG["opensearch"]["password"]),
)


@app.route("/search", methods=["POST"])
def search():
    query = request.json["query"]
    category = classify_category(query)
    filters = filter_extraction(query)
    query_embedding = cohere_client.embed(
        model="embed-multilingual-v3.0",
        texts=[query],
        input_type="search_query",
    ).embeddings[0]
    query = {
        "must": [
            {
                "knn": {
                    "embedding": {
                        "vector": query_embedding,
                        "k": 200,
                    }
                }
            }
        ]
    }
    conditions = []
    if category:
        conditions.append({"term": {"event_type": category}})
    if filters["date"]:
        conditions.append(
            filters_to_opensearch_conditions(filters["date"], "judgement_date")
        )
        filters["date"] = filters["date"].to_dict()
    if filters["court"]:
        conditions.append(filters_to_opensearch_conditions(filters["court"], "court"))
        filters["court"] = filters["court"].to_dict()
    if conditions:
        query["filter"] = {"bool": {"must": conditions}}

    search_query = {
        "size": 30,
        "query": {"bool": query},
    }
    response = opensearch_client.search(
        index=CONFIG["opensearch"]["index"], body=search_query, timeout=600
    )
    results = []
    unique_case_ids = set()
    for hit in response["hits"]["hits"]:
        if hit["_source"]["case_id"] not in unique_case_ids:
            results.append(
                {
                    "score": hit["_score"],
                    "case_id": hit["_source"]["case_id"],
                    "name": hit["_source"]["name"],
                }
            )
            unique_case_ids.add(hit["_source"]["case_id"])
    return (
        jsonify(
            {
                "results": results,
                "category": category,
                "filters": filters,
            }
        ),
        200,
    )


@app.route("/preview_sentences", methods=["POST"])
def preview_sentences():
    query = request.json["query"]
    query_embedding = cohere_client.embed(
        model="embed-multilingual-v3.0",
        texts=[query],
        input_type="search_query",
    ).embeddings[0]
    query_embedding = np.array(query_embedding, dtype=np.float32)
    query_embedding = query_embedding.reshape(1, -1)

    case_id_list = request.json["case_id_list"]
    conn = DBHandler.inst().create_conn()
    try:
        with conn.cursor(pymysql.cursors.DictCursor) as cursor:
            cursor.execute(
                (
                    "SELECT * FROM sentence_embeddings WHERE case_id IN (%s)"
                    % ",".join(["%s"] * len(case_id_list))
                ),
                case_id_list,
            )
            rows = cursor.fetchall()
    finally:
        conn.close()
    sentences_per_case = []
    for case_id in case_id_list:
        raw_sentences = []
        embeddings = []
        for row in rows:
            if row["case_id"] == case_id:
                embedding = pickle.loads(row["embedding"])
                embeddings.append(embedding)
                raw_sentences.append(row)
        embeddings = np.stack(embeddings)
        similarities = cosine_similarity(query_embedding, embeddings)[0]
        indices = np.argsort(similarities)[::-1]
        sentences = []
        for idx in indices[:5]:
            sentences.append(
                {
                    "start_offset": raw_sentences[idx]["st_offset"],
                    "end_offset": raw_sentences[idx]["ed_offset"],
                    "key": raw_sentences[idx]["content_key"],
                    "score": float(similarities[idx]),
                    "sentence": raw_sentences[idx]["text"],
                }
            )
        sentences_per_case.append(sentences)

    print(json.dumps(sentences_per_case, indent=2, ensure_ascii=False))

    return jsonify(sentences_per_case), 200


@app.route("/cases", methods=["POST"])
def cases():
    case_id_list = request.json["case_id_list"]
    conn = DBHandler.inst().create_conn()
    try:
        with conn.cursor(pymysql.cursors.DictCursor) as cursor:
            query = "SELECT * FROM legal_cases WHERE id IN (%s)" % ",".join(
                ["%s"] * len(case_id_list)
            )
            cursor.execute(query, case_id_list)
            rows = cursor.fetchall()
    finally:
        conn.close()

    # Create a dictionary to map case_id to its corresponding row
    case_dict = {row["id"]: row for row in rows}

    # Reorder the results to match the input case_id_list
    ordered_results = [
        case_dict[case_id] for case_id in case_id_list if case_id in case_dict
    ]

    return jsonify(ordered_results), 200


@socketio.on("connect", namespace="/summary")
def handle_connect():
    print("Client connected")
    print(request.args.get("id"))
    join_room(request.args.get("id"))


@socketio.on("message", namespace="/summary")
def handle_message(data):
    print(data)
    case_id = data.get("case_id")
    room_id = request.args.get("id")
    try:
        completion = openai_client.chat.completions.create(
            model="gpt-4o",
            messages=sumamrize_prompt(case_id),
            stream=True,
        )

        for chunk in completion:
            if len(chunk.choices) > 0:
                streamed_text = chunk.choices[0].delta.content
                if streamed_text is not None:
                    emit(
                        "message",
                        {"t": "d", "d": streamed_text},
                        namespace="/summary",
                        room=room_id,
                    )
        emit("message", {"t": "finish"}, namespace="/summary", room=room_id)

    except Exception as e:
        emit("message", {"error": str(e)}, namespace="/summary", room=room_id)


@socketio.on("disconnect", namespace="/summary")
def handle_disconnect():
    print("Client disconnected")
    leave_room(request.args.get("user_id"))


if __name__ == "__main__":
    socketio.run(app, host="0.0.0.0", debug=True, port=5001)
