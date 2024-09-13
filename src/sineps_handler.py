import sineps.filter_extractor
from config import CONFIG
import sineps
from datetime import datetime

sineps_client = sineps.Client(CONFIG["sineps_api_key"])


def classify_category(query):
    routes = [
        {
            "name": "criminal",
            "description": "Assign queries to this route when they asks about criminal cases",
            "utterances": [
                "강도죄에 대한 최근 대법원 판례는 어떤 것이 있나요?",
                "특정범죄 가중처벌 등에 관한 법률 위반 사례 판례를 검색해 주세요.",
                "횡령죄 성립 요건에 대한 판례",
                "공무집행방해죄 판례 중 집행의 정당성에 대한 기준이 명시된 사례가 있나요?",
                "사기죄의 고의성 판단 기준",
                "교통사고로 인한 과실치사 사건에서 양형 기준이 제시된 판례는 무엇인가요?",
                "음주운전으로 인한 형사 처벌",
                "형법 제307조 명예훼손죄에 관한 판례 중 위법성 조각사유가 인정된 사례",
                "형사 사건의 공소시효가 인정된 판례를 검색해 주세요",
                "특정 경제범죄 가중처벌법 위반으로 인한 판결",
            ],
        },
        {
            "name": "civil",
            "description": "Assign queries to this route when they asks about civil cases",
            "utterances": [
                "매매계약 해제 사유에 대한 대법원 판례",
                "임대차 계약 해지에 대한 판례를 찾아주세요.",
                "손해배상 책임이 인정된 사례",
                "부동산 소유권 이전 등기 청구",
                "채무불이행으로 인한 계약 해제 사례 판례를 검색해 주세요.",
                "불법행위로 인한 손해배상 청구 소송 판례",
                "공사대금 지급 청구 소송",
                "부동산 경매 과정에서 발생한 소송 사례",
            ],
        },
        {
            "name": "family",
            "description": "Assign queries to this route when they asks about family cases",
            "utterances": [
                "이혼 소송에서 위자료 청구가 인정된 판례를 찾아 주세요.",
                "친권자 변경을 다룬 대법원 판례",
                "부양 의무",
                "자녀 양육비 산정 기준",
                "재혼 후 친권 변경 사례 판례",
                "상속 분쟁에서 유류분 반환 청구 소송 판례",
                "이혼 시 재산 분할 기준이 명시된 판례",
                "입양 무효 소송에 대한 판례를 검색",
                "성년후견인 선임과 관련된 판례를 찾아 주세요.",
                "사망한 배우자의 빚에 대한 상속 포기 사례",
            ],
        },
        {
            "name": "general administartion",
            "description": "Assign queries to this route when they asks about general administartion cases",
            "utterances": [
                "행정처분 취소 소송에서 법원이 인정한 사유",
                "건축허가 취소에 관한 대법원 판례가 있나요?",
                "국가배상 청구 소송 판례를 검색",
                "징계처분 취소를 다룬 판례",
                "행정심판에서 인정된 무효사유에 대한 판례",
                "도시계획 변경으로 인한 손실보상 청구",
                "환경영향평가와 관련된 행정소송",
                "행정지도에 따른 공권력 행사에 대한 판례가 있나요?",
                "공무원 채용 취소에 대한 행정소송",
                "과징금 부과 처분이 취소된 사례",
            ],
        },
        {
            "name": "tax",
            "description": "Assign queries to this route when they asks about tax cases",
            "utterances": [
                "소득세 부과 처분 취소",
                "부가가치세 환급에 대한 대법원 판례가 있나요?",
                "법인세 부과와 관련된 판례를 검색해 주세요.",
                "상속세와 증여세 과세에 대한 판례",
                "세무조사 결과에 따른 추가 세금 부과가 취소된 사례",
                "명의신탁과 관련된 세무 사건",
                "해외소득에 대한 과세",
                "양도소득세 부과 처분이 취소된 판례가 있나요?",
                "취득세 감면에 대한 판례를 확인할 수 있을까요?",
            ],
        },
    ]
    response = sineps_client.exec_intent_router(
        query=query, routes=routes, allow_none=True
    )
    if len(response.result.routes) == 0:
        return None
    if response.result.routes[0].name == "criminal":
        return "형사"
    elif response.result.routes[0].name == "civil":
        return "민사"
    elif response.result.routes[0].name == "family":
        return "가사"
    elif response.result.routes[0].name == "general administartion":
        return "일반행정"
    elif response.result.routes[0].name == "tax":
        return "세무"


def filter_extraction(query):
    fields = [
        {
            "name": "date",
            "description": "Date the judgement was handed down",
            "type": "date",
        },
        {
            "name": "court",
            "description": "Court that handed down the judgement",
            "type": "string",
            "values": [
                "대법원",
                "서울고등법원",
                "서울지방법원",
                "대구고등법원",
                "대구지방법원",
                "부산고등법원",
                "부산지방법원",
                "광주고등법원",
                "광주지방법원",
            ],
        },
    ]
    filters = dict()
    for field in fields:
        response = sineps_client.exec_filter_extractor(query=query, field=field)
        if response.result and response.result.value.startswith("$"):
            response.result.value = sineps.filter_extractor.calculate_date(
                current_date=datetime.now(), expression=response.result.value
            )
        filters[field["name"]] = response.result
    return filters


def filters_to_opensearch_conditions(filter, field_name):
    if filter.type == "ConjunctedFilter":
        if filter.operator == "AND":
            return {
                "must": [
                    filters_to_opensearch_conditions(subfilter, field_name)
                    for subfilter in filter.filters
                ]
            }
        elif filter.operator == "OR":
            return {
                "should": [
                    filters_to_opensearch_conditions(subfilter, field_name)
                    for subfilter in filter.filters
                ]
            }
    elif filter.type == "Filter":
        if filter.operator == "<":
            return {"range": {field_name: {"lt": filter.value}}}
        elif filter.operator == ">":
            return {"range": {field_name: {"gt": filter.value}}}
        elif filter.operator == "<=":
            return {"range": {field_name: {"lte": filter.value}}}
        elif filter.operator == ">=":
            return {"range": {field_name: {"gte": filter.value}}}
        elif filter.operator == "=":
            return {"term": {field_name: filter.value}}
        elif filter.operator == "!=":
            return {"term": {field_name: filter.value}}


if __name__ == "__main__":
    classify_category("폭력 사건에서 흉기로 인정되는 기준은?")
    filters = filter_extraction(
        "폭력 사건에서 흉기로 인정되는 기준에 대한 3년 이내 판례"
    )
    print(filters)
