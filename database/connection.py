import os
import pymysql
import pymysql.cursors

# database connection settings
MYSQL_HOST = os.environ.get('MYSQL_HOST', 'localhost')
MYSQL_PORT = int(os.environ.get('MYSQL_PORT', 3306))
MYSQL_USER = os.environ.get('MYSQL_USER', 'roamly_user')
MYSQL_PASSWORD = os.environ.get('MYSQL_PASSWORD', 'roamly_password')
MYSQL_DB = os.environ.get('MYSQL_DB', 'roamly_db')
MYSQL_CONNECT_TIMEOUT = int(os.environ.get('MYSQL_CONNECT_TIMEOUT', 3))

# candidate connection credentials
CREDENTIAL_PAIRS = [
    (MYSQL_USER, MYSQL_PASSWORD),
    ('roamly_user', 'roamly_password'),
    ('root', 'root_password'),
    ('root', 'password'),
    ('root', '')
]

# ensure database exists
def ensure_database_exists():
    for user, pwd in CREDENTIAL_PAIRS:
        try:
            conn = pymysql.connect(
                host=MYSQL_HOST,
                port=MYSQL_PORT,
                user=user,
                password=pwd,
                connect_timeout=MYSQL_CONNECT_TIMEOUT,
                autocommit=True
            )
            with conn.cursor() as cursor:
                cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{MYSQL_DB}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
            conn.close()
            return user, pwd
        except Exception:
            continue
    return MYSQL_USER, MYSQL_PASSWORD

# get db connection
def get_db_connection():
    valid_user, valid_pwd = ensure_database_exists()
    
    # try primary credentials
    try:
        conn = pymysql.connect(
            host=MYSQL_HOST,
            port=MYSQL_PORT,
            user=valid_user,
            password=valid_pwd,
            database=MYSQL_DB,
            cursorclass=pymysql.cursors.DictCursor,
            connect_timeout=MYSQL_CONNECT_TIMEOUT,
            autocommit=True
        )
        return conn
    except Exception:
        # fallback through candidate pairs
        for user, pwd in CREDENTIAL_PAIRS:
            try:
                conn = pymysql.connect(
                    host=MYSQL_HOST,
                    port=MYSQL_PORT,
                    user=user,
                    password=pwd,
                    database=MYSQL_DB,
                    cursorclass=pymysql.cursors.DictCursor,
                    connect_timeout=MYSQL_CONNECT_TIMEOUT,
                    autocommit=True
                )
                return conn
            except Exception:
                continue
        raise
