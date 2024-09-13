from db import DBHandler
from opensearchpy import OpenSearch
from config import CONFIG


def create_index():
    client = OpenSearch(
        hosts=[{"host": CONFIG["opensearch"]["host"], "port": 443}],
        use_ssl=True,
        http_auth=(CONFIG["opensearch"]["id"], CONFIG["opensearch"]["password"]),
    )

    index_body = {
        "settings": {
            "index": {"number_of_shards": 1, "number_of_replicas": 2},
            "index.knn": True,
            "analysis": {
                "tokenizer": {"seunjeon": {"type": "seunjeon_tokenizer"}},
                "analyzer": {
                    "my_analyzer": {"type": "custom", "tokenizer": "seunjeon"}
                },
            },
        },
        "mappings": {
            "properties": {
                "case_id": {"type": "keyword"},
                "court": {"type": "text"},
                "embedding": {"type": "knn_vector", "dimension": 1024},
                "content_key": {"type": "keyword"},
                "start_offset": {"type": "integer"},
                "end_offset": {"type": "integer"},
                "event_type": {"type": "text"},
                "judgement": {"type": "text"},
                "judgement_date": {"type": "date", "format": "yyyy-MM-dd"},
                "judgement_type": {"type": "text"},
                "snippet": {"type": "text"},
                "name": {"type": "text"},
            }
        },
    }
    index_name = CONFIG["opensearch"]["index"]
    if not client.indices.exists(index_name):
        response = client.indices.create(index=index_name, body=index_body)
        print(f"Index {index_name} created:", response)
    else:
        print(f"Index {index_name} already exists. Deleting it...")
        client.indices.delete(index=index_name)
        print(f"Index {index_name} deleted. Recreating...")
        response = client.indices.create(index=index_name, body=index_body)
        print(f"Index {index_name} recreated:", response)


if __name__ == "__main__":
    DBHandler.inst().create_database()
    DBHandler.inst().create_table()
    create_index()
