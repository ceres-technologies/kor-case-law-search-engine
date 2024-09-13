from openai import OpenAI
from opensearchpy import OpenSearch
from config import CONFIG
from db import DBHandler
import numpy as np
from scipy.spatial.distance import cosine
import pickle

import cohere


def find_matching_sentences(query_embedding, case_id):
    conn = DBHandler.inst().create_conn()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "SELECT embedding, text FROM sentence_embeddings WHERE case_id = %s",
                (case_id,),
            )
            rows = cursor.fetchall()
    finally:
        conn.close()

    # Convert embeddings to numpy arrays for efficient computation
    embeddings = np.array([pickle.loads(row[0]) for row in rows])
    texts = [row[1] for row in rows]

    # Compute cosine similarities
    similarities = [1 - cosine(query_embedding, emb) for emb in embeddings]

    # Sort by similarity (descending order) and get top 5
    top_indices = np.argsort(similarities)[-5:][::-1]

    results = []
    for idx in top_indices:
        results.append(
            {
                "similarity": similarities[idx],
                "text": texts[idx],
            }
        )

    # Print results
    for i, result in enumerate(results, 1):
        print(f"        Matching sentence {i} Similarity: {result['similarity']:.4f}:")
        print(f"        Text: {result['text']}")

    return results


def search(query, openai_client, opensearch_client):
    cohere_client = cohere.Client(CONFIG["cohere_api_key"])
    query_embedding = cohere_client.embed(
        model="embed-multilingual-v3.0",
        texts=[query],
        input_type="search_query",
    ).embeddings[0]
    search_query = {
        "size": 10,
        "query": {
            "knn": {
                "embedding": {
                    "vector": query_embedding,
                    "k": 10,
                }
            }
        },
    }

    response = opensearch_client.search(
        index=CONFIG["opensearch"]["index"], body=search_query, timeout=120
    )
    found_ids = []
    for hit in response["hits"]["hits"]:
        if hit["_source"]["case_id"] not in found_ids:
            print(
                f"ID: {hit['_id']}, Court: {hit['_source']['court']}, Name: {hit['_source']['name']}"
            )
            print(hit["_source"]["snippet"])
            find_matching_sentences(query_embedding, hit["_source"]["case_id"])
            print()
            found_ids.append(hit["_source"]["case_id"])


if __name__ == "__main__":
    query = input("Search Query: ")
    print(query)
    openai_client = OpenAI(api_key=CONFIG["openai_api_key"])
    opensearch_client = OpenSearch(
        hosts=[{"host": CONFIG["opensearch"]["host"], "port": 443}],
        use_ssl=True,
        http_auth=(CONFIG["opensearch"]["id"], CONFIG["opensearch"]["password"]),
    )
    search(query, openai_client, opensearch_client)
