from db import DBHandler
import pymysql
import json
from config import CONFIG
from openai import OpenAI


def sumamrize_prompt(case_id):
    conn = DBHandler.inst().create_conn()
    try:
        with conn.cursor(pymysql.cursors.DictCursor) as cursor:
            cursor.execute("SELECT * FROM legal_cases WHERE id = %s", (case_id,))
            case = cursor.fetchone()
            if case is None:
                raise Exception("Case not found")
    except Exception as e:
        raise e
    finally:
        conn.close()
    contents = json.loads(case["contents_json"])
    case_str = ""
    for key, value in contents.items():
        if value:
            case_str += f'\n[{key}]\n"""\n{value}\n"""\n\n'
    messages = [
        {
            "role": "system",
            "content": """당신은 판결문을 요약해야 한다.
요약은 판결문의 핵심을 간결하게 하라. 지엽적인 정보들은 빼고, 사실관계과 결론, 그리고 적용된 법리를 간결하게 작성하라.
일목요연하게 구조화하여 Markdown으로 출력하라.
""",
        }
    ]
    inst_messages = messages + [
        {
            "role": "user",
            "content": f"""
# 판례 
{case_str}

# Instruction 
위 판례를 Markdown으로 일목요연하게 요약하라.
소제목들은 ## 부터 시작하여 작성하고, 문장에서 핵심적인 키워드를 Markdown 문법을 통해 bold체로 강조하라.
"-"을 사용하여 개조식으로 작성하라. 개조식에 맞게 음슴체로 작성하라.
최대한 간결하게 작성하고, 판례 제목은 작성하지 말라.
다음 내용들을 포함하라.

1. 판결의 요지를 간결하게 작성하라. 판례가 어떤 쟁점을 다루어 판단을 내린 것인지 작성하라.
아래는 예시이다:
\"\"\"
    - 측정거부가 일시적인 것에 불과한 경우, '도로교통법 제148조의2 제1항 제2호'에서 말하는 '경찰공무원의 측정에 응하지 아니한 경우'에 해당하는지 여부: 소극
    - 음주측정불응죄에서 운전자의 측정불응의사 판단 방법
\"\"\"
2. 결론과 이유를 작성하라. 판례가 쟁점에 대해 어떤 결론을 내렸는지 작성하라. 또한, 판례가 어떻게 법리를 적용하여 결론이 나왔는지 작성하라.
아래는 예시이다:
\"\"\"
    - 도로교통법 제148조의2 제1항 제2호의 목적: 안전 도모 및 입증과 처벌의 용이성 확보(음주측정 강제X)
    - 음주측정불응죄가 성립하기 위해 객관적으로 명백한 음주측정 거부 의사 요
    - 따라서 계소적 반복적이지 않은 일시적인 거부 의사 표명은 본죄의 음주측정 거부에 해당하지 않음
\"\"\"
3. 사실관계를 간략하게 요약하여 작성하라.

나의 커리어에 아주 중요한 작업이므로 나의 Instruction에 따라 정확하게 작성하라.

```markdown\n
""",
        }
    ]
    return inst_messages


if __name__ == "__main__":
    openai_client = OpenAI(api_key=CONFIG["openai_api_key"])
    case_id = 5918
    prompt = sumamrize_prompt(case_id)
    completion = openai_client.chat.completions.create(
        model="gpt-4",
        messages=prompt,
    )

    print("Summary:")
    print(completion.choices[0].message.content)
