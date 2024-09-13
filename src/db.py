from config import CONFIG
import pymysql


class DBHandler:
    __instance = None

    @classmethod
    def __get_instance(cls):
        return cls.__instance

    @classmethod
    def inst(cls):
        cls.__instance = cls()
        cls.inst = cls.__get_instance
        return cls.__instance

    def __init__(self):
        self.conn = None

    def create_conn(self):
        return pymysql.connect(
            host=CONFIG["database"]["HOST"],
            port=int(CONFIG["database"]["PORT"]),
            user=CONFIG["database"]["USER"],
            password=CONFIG["database"]["PASSWORD"],
            db=CONFIG["database"]["DB_NAME"],
        )

    def create_database(self):
        self.conn = pymysql.connect(
            host=CONFIG["database"]["HOST"],
            port=int(CONFIG["database"]["PORT"]),
            user=CONFIG["database"]["USER"],
            password=CONFIG["database"]["PASSWORD"],
        )

        try:
            with self.conn.cursor() as cursor:
                cursor.execute(
                    f"CREATE DATABASE IF NOT EXISTS {CONFIG['database']['DB_NAME']}"
                )
                self.conn.commit()
        except pymysql.Error as e:
            print(f"Error creating database: {e}")
        finally:
            if self.conn:
                self.conn.close()

    def create_table(self):
        self.conn = self.create_conn()
        try:
            with self.conn.cursor() as cursor:
                cursor.execute(
                    """
                    DROP TABLE IF EXISTS legal_cases;
                    """
                )
                cursor.execute(
                    """
                    DROP TABLE IF EXISTS sentence_embeddings;
                    """
                )
                cursor.execute(
                    """
                    CREATE TABLE legal_cases (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        str_id VARCHAR(255) NOT NULL,
                        사건종류 VARCHAR(255) NOT NULL,
                        판결유형 VARCHAR(255) NOT NULL,
                        사건명 LONGTEXT NOT NULL,
                        사건번호 VARCHAR(255) NOT NULL,
                        선고일자 VARCHAR(255) NOT NULL,
                        선고 VARCHAR(255) NOT NULL,
                        법원 VARCHAR(255) NOT NULL,
                        주문 LONGTEXT NULL,
                        이유 LONGTEXT NULL,
                        청구취지 LONGTEXT NULL,
                        contents_json LONGTEXT NULL,
                        제목 LONGTEXT NOT NULL,
                        INDEX str_id (str_id)
                    );
                    """
                )
                cursor.execute(
                    """
                    CREATE TABLE sentence_embeddings (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        content_key VARCHAR(255) NOT NULL,
                        st_offset INT NOT NULL,
                        ed_offset INT NOT NULL,
                        embedding BLOB NOT NULL,
                        text LONGTEXT NOT NULL,
                        case_id INT NOT NULL,
                        INDEX case_id (case_id)
                    );
                    """
                )
                self.conn.commit()
        except pymysql.Error as e:
            print(f"Error creating table: {e}")
        finally:
            if self.conn:
                self.conn.close()

    def case_exists(self, serial_number: str):
        self.conn = self.create_conn()
        try:
            with self.conn.cursor() as cursor:
                cursor.execute(
                    "SELECT * FROM legal_cases WHERE 판례일련번호 = %s",
                    (serial_number,),
                )
                return cursor.fetchone() is not None
        finally:
            if self.conn:
                self.conn.close()
