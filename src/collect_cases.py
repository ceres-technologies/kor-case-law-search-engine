from config import CONFIG
import xml.etree.ElementTree as ET
import datetime
from urllib.request import urlopen
import time
from db import DBHandler
import json


def _urlopen(url, retry=True):
    if not retry:
        return urlopen(url).read()
    while True:
        try:
            return urlopen(url).read()
        except Exception as e:
            print(e)
            time.sleep(300)


def _parse_content(판례내용: str):
    content = dict()
    판례내용 = 판례내용.strip()
    if 판례내용 == "":
        return content
    brace_st = "【"
    brace_ed = "】"
    if 판례내용.startswith("["):
        brace_st = "["
        brace_ed = "]"
    while True:
        if 판례내용[0] != brace_st:
            break
        if brace_ed not in 판례내용:
            break
        key = 판례내용[1 : 판례내용.find(brace_ed)]
        value_with_판례내용 = 판례내용[판례내용.find(brace_ed) + 1 :]
        if brace_st in value_with_판례내용:
            value = value_with_판례내용[: value_with_판례내용.find(brace_st)]
            판례내용 = value_with_판례내용[value_with_판례내용.find(brace_st) :]
            content[key] = value.strip()
        else:
            value = value_with_판례내용
            content[key] = value.strip()
            break
    content = {key.replace(" ", ""): content[key] for key in content}
    return content


def collect_case(court_name: str, serial_number: str):
    url = f"http://www.law.go.kr/DRF/lawService.do?target=prec&OC={CONFIG['law_api_id']}&type=XML&ID={serial_number}"
    raw_content = _urlopen(url)
    xtree = ET.fromstring(raw_content)
    conn = DBHandler.inst().create_conn()
    사건번호 = xtree.find("사건번호").text
    str_id = f"/{court_name}/{사건번호.split(',')[0]}"
    선고일자 = xtree.find("선고일자").text
    판시사항 = xtree.find("판시사항").text
    판시사항 = 판시사항.replace("<br/>", "\n") if 판시사항 else None
    판결요지 = xtree.find("판결요지").text
    판결요지 = 판결요지.replace("<br/>", "\n") if 판결요지 else None
    참조조문 = xtree.find("참조조문").text
    참조조문 = 참조조문.replace("<br/>", "\n") if 참조조문 else None
    참조판례 = xtree.find("참조판례").text
    참조판례 = 참조판례.replace("<br/>", "\n") if 참조판례 else None
    판례내용 = xtree.find("판례내용").text
    판례내용 = 판례내용.replace("<br/>", "\n") if 판례내용 else None
    content = _parse_content(판례내용)
    content["판시사항"] = 판시사항
    content["판결요지"] = 판결요지
    content["참조조문"] = 참조조문
    content["참조판례"] = 참조판례
    content["제목"] = (
        f"{court_name} {선고일자[:4]}. {선고일자[4:6]}. {선고일자[6:]}. {xtree.find('사건번호').text} {xtree.find('판결유형').text} [{xtree.find('사건명').text}]"
    )
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO legal_cases (str_id, 사건종류, 판결유형, 사건명, 사건번호, 선고일자, 선고, 법원, 주문, 이유, 청구취지, contents_json, 제목) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
                """,
                (
                    str_id,
                    xtree.find("사건종류명").text,
                    xtree.find("판결유형").text,
                    xtree.find("사건명").text,
                    사건번호,
                    f"{선고일자[:4]}-{선고일자[4:6]}-{선고일자[6:]}",
                    xtree.find("선고").text,
                    court_name,
                    content["주문"] if "주문" in content else None,
                    content["이유"] if "이유" in content else None,
                    content["청구취지"] if "청구취지" in content else None,
                    json.dumps(content, ensure_ascii=False),
                    content["제목"],
                ),
            )
            conn.commit()
    finally:
        conn.close()


def get_case_courtname_and_serial_numbers(date: datetime.datetime):
    base_url = f"https://www.law.go.kr/DRF/lawSearch.do?OC={CONFIG['law_api_id']}&target=prec&type=XML&date={date.strftime('%Y%m%d')}"
    response = _urlopen(base_url)
    xtree = ET.fromstring(response)
    total_cnt = int(xtree.find("totalCnt").text)
    case_courtname_and_serial_numbers = []
    for page in range(1, 2 + total_cnt // 20):
        url = f"{base_url}&page={page}"
        response = _urlopen(url)
        xtree = ET.fromstring(response)
        items = xtree[5:]
        for node in items:
            serial_number = node.find("판례일련번호").text
            court_name = node.find("법원명").text
            case_courtname_and_serial_numbers.append((court_name, serial_number))
    return case_courtname_and_serial_numbers


def collect_cases_of_date(date: datetime.datetime):
    print(
        f"Collecting cases of {date.strftime('%Y-%m-%d')}, current time: {datetime.datetime.now().strftime('%Y-%m-%d, %H:%M:%S')}"
    )
    case_courtname_and_serial_numbers = get_case_courtname_and_serial_numbers(date)
    for court_name, serial_number in case_courtname_and_serial_numbers:
        collect_case(court_name, serial_number)
    print(f"\tinserted: {len(case_courtname_and_serial_numbers)}")


def run(starting_date: datetime.datetime):
    d = starting_date
    while d < datetime.datetime.now():
        collect_cases_of_date(d)
        conn = DBHandler.inst().create_conn()
        try:
            with conn.cursor() as cursor:
                cursor.execute("SELECT COUNT(*) FROM legal_cases;")
                print(f"Total count: {cursor.fetchone()[0]}")
        finally:
            conn.close()
        d += datetime.timedelta(days=1)


if __name__ == "__main__":
    run(datetime.datetime(year=2017, month=11, day=10))
