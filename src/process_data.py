from db import DBHandler
from opensearchpy import OpenSearch, helpers
from opensearchpy.helpers.errors import BulkIndexError
from config import CONFIG
import json
import asyncio
import time
import pymysql
import kss
import tiktoken
import pickle
import cohere


tokenizer = tiktoken.encoding_for_model("gpt-3.5-turbo")


def count_token(text):
    return len(tokenizer.encode(text))


def split_without_removing(text, delimiter):
    tokens = text.split(delimiter)
    results = []
    for i in range(len(tokens)):
        if i == len(tokens) - 1:
            results.append(tokens[i])
        else:
            results.append(tokens[i] + delimiter)
    return results


def _split_by_heuristic(text):
    sentences = [text]
    new_sentences = []
    for sentence in sentences:
        if count_token(sentence) > 200:
            new_sentences += split_without_removing(sentence, "하여")
        else:
            new_sentences.append(sentence)
    return sentences


def opensearch_bulk_insert(org_rows):
    client = OpenSearch(
        hosts=[{"host": CONFIG["opensearch"]["host"], "port": 443}],
        use_ssl=True,
        http_auth=(CONFIG["opensearch"]["id"], CONFIG["opensearch"]["password"]),
    )
    for i in range(0, len(org_rows), 300):
        st = i
        ed = min(i + 300, len(org_rows))
        rows = org_rows[st:ed]
        while True:
            try:
                actions = [
                    {"_index": CONFIG["opensearch"]["index"], "_source": row}
                    for row in rows
                ]
                helpers.bulk(client, actions)
                break
            except BulkIndexError as e:
                print(e)
                rows = []
                for i in range(len(e.errors)):
                    rows.append(e.errors[i]["index"]["data"])
                time.sleep(60)
                continue
            except Exception as e:
                print(e)
                time.sleep(60)
                continue
            time.sleep(1)


def sentence_split(text):
    raw_sentences = kss.split_sentences(text, strip=False)
    raw_sentences = sum(
        [split_without_removing(sentence, "\n") for sentence in raw_sentences], start=[]
    )
    sentences = []
    for sentence in raw_sentences:
        if sentence == "":
            continue
        len_sentence = count_token(sentence)
        if len_sentence < 100:
            sentences.append(sentence)
        else:
            sliced_sentences = split_without_removing(sentence, ",")
            for sliced_sentence in sliced_sentences:
                if count_token(sliced_sentence) > 200:
                    splitted_sentences = _split_by_heuristic(sliced_sentence)
                    sentences += splitted_sentences
                else:
                    sentences.append(sliced_sentence)
    return sentences


def generate_sentence_embedding_rows(contents_json, case_id):
    results = []
    cohere_client = cohere.Client(CONFIG["cohere_api_key"])

    for key in contents_json:
        value = contents_json[key]
        if not value or len(value) < 15:
            continue
        sentences = sentence_split(value)
        offset = 0
        for sentence in sentences:
            if not sentence or len(sentence) < 15:
                offset += len(sentence)
                continue
            results.append(
                [
                    key,
                    offset,
                    offset + len(sentence),
                    None,  # embedding
                    sentence,
                    case_id,
                ]
            )
            offset += len(sentence)

    for i in range(0, len(results), 96):
        batch = results[i : i + 96]
        embeddings_response = cohere_client.embed(
            model="embed-multilingual-v3.0",
            texts=[result[4] for result in batch],
            input_type="search_document",
        )
        for idx, embedding_data in enumerate(embeddings_response.embeddings):
            results[i + idx][3] = pickle.dumps(embedding_data)
    return [
        (key, st_offset, ed_offset, embedding, sentence, case_id)
        for key, st_offset, ed_offset, embedding, sentence, case_id in results
    ]


def chunk_and_embed(contents):
    cohere_client = cohere.Client(CONFIG["cohere_api_key"])
    results = []

    for key in contents:
        value = contents[key]
        if not value or len(value) < 15:
            continue
        sentences = sentence_split(value)

        it = 0
        start_it = 0
        start_offset = 0
        offset = 0
        token = 0
        chunk = ""
        while it < len(sentences):
            if chunk == "" or token + count_token(sentences[it]) < CONFIG["chunk_size"]:
                token += count_token(sentences[it])
                chunk += sentences[it]
                offset += len(sentences[it])
                it += 1
            else:
                results.append(
                    {
                        "content_key": key,
                        "start_offset": start_offset,
                        "end_offset": offset,
                        "chunk": chunk,
                    }
                )
                token = 0
                chunk = ""
                overlap = 0
                while overlap < CONFIG["overlap_size"] and it - start_it > 1:
                    it -= 1
                    offset -= len(sentences[it])
                    overlap += count_token(sentences[it])
                start_it = it
                start_offset = offset
        if chunk:
            results.append(
                {
                    "content_key": key,
                    "start_offset": start_offset,
                    "end_offset": offset,
                    "chunk": chunk,
                }
            )

    # Batch processing for embeddings
    batch_size = 96
    for i in range(0, len(results), batch_size):
        batch = results[i : i + batch_size]
        embeddings_response = cohere_client.embed(
            model="embed-multilingual-v3.0",
            texts=[result["chunk"] for result in batch],
            input_type="search_document",
        )
        for j, embedding_data in enumerate(embeddings_response.embeddings):
            results[i + j]["embedding"] = embedding_data
    return results


def process_rows(rows):
    opensearch_rows = []
    for row in rows:
        # if sentence_embedding_rows is not empty, skip
        conn = DBHandler.inst().create_conn()
        try:
            with conn.cursor() as cursor:
                cursor.execute(
                    "SELECT * FROM sentence_embeddings WHERE case_id = %s", (row["id"],)
                )
                if cursor.fetchone():
                    continue
        finally:
            conn.close()
        contents_json = json.loads(row["contents_json"])

        chunks = chunk_and_embed(contents_json)
        for chunk in chunks:
            opensearch_rows.append(
                {
                    "case_id": row["id"],
                    "court": row["법원"],
                    "embedding": chunk["embedding"],
                    "content_key": chunk["content_key"],
                    "start_offset": chunk["start_offset"],
                    "end_offset": chunk["end_offset"],
                    "event_type": row["사건종류"],
                    "judgement": row["선고"],
                    "judgement_date": row["선고일자"],
                    "judgement_type": row["판결유형"],
                    "snippet": chunk["chunk"],
                    "name": row["제목"],
                }
            )
        sentence_rows = generate_sentence_embedding_rows(contents_json, row["id"])
        conn = DBHandler.inst().create_conn()
        try:
            with conn.cursor() as cursor:
                cursor.executemany(
                    "INSERT INTO sentence_embeddings (content_key, st_offset, ed_offset, embedding, text, case_id) VALUES (%s, %s, %s, %s, %s, %s)",
                    sentence_rows,
                )
                conn.commit()
        finally:
            conn.close()

    opensearch_bulk_insert(opensearch_rows)


def iterate_rows(offset_id, batch_size):
    conn = DBHandler.inst().create_conn()
    try:
        with conn.cursor(pymysql.cursors.DictCursor) as cursor:
            cursor.execute(
                "SELECT * FROM legal_cases WHERE id > %s ORDER BY id ASC LIMIT %s",
                (offset_id, batch_size),
            )
            rows = cursor.fetchall()
    finally:
        conn.close()
    return rows


def run():
    batch_size = 30
    offset_id = 0
    st_time = time.time()
    while True:
        rows = iterate_rows(offset_id, batch_size)
        if not rows:
            break
        process_rows(rows)
        offset_id = rows[-1]["id"]
        print(
            f"processed row with id of {offset_id}, time elapsed: {time.time() - st_time} sec"
        )


if __name__ == "__main__":
    run()
