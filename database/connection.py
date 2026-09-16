import os
import re
import socket
import sqlite3
import pymysql
import pymysql.cursors
from config import Config

class SQLiteDictCursor:
    """Compatibility cursor wrapper for SQLite to behave like PyMySQL DictCursor with %s formatting."""
    def __init__(self, cursor):
        self.cursor = cursor

    def execute(self, sql, params=None):
        if params is not None:
            # Replace %s with ? for SQLite parameters
            converted_sql = re.sub(r'%s', '?', sql)
            return self.cursor.execute(converted_sql, params)
        return self.cursor.execute(sql)

    def fetchone(self):
        row = self.cursor.fetchone()
        return dict(row) if row is not None else None

    def fetchall(self):
        rows = self.cursor.fetchall()
        return [dict(r) for r in rows]

    def close(self):
        self.cursor.close()

    @property
    def lastrowid(self):
        return self.cursor.lastrowid

    @property
    def rowcount(self):
        return self.cursor.rowcount

class SQLiteConnectionWrapper:
    """Wrapper for sqlite3.Connection to provide cursor method with DictCursor emulation."""
    def __init__(self, conn):
        self.conn = conn

    def cursor(self, *args, **kwargs):
        return SQLiteDictCursor(self.conn.cursor())

    def commit(self):
        self.conn.commit()

    def rollback(self):
        self.conn.rollback()

    def close(self):
        self.conn.close()

_cached_credentials = None
_use_sqlite_fallback = False

def is_mysql_port_open(host, port, timeout=0.3):
    """Quick socket check to avoid hanging on connection attempts if MySQL daemon is not running."""
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(timeout)
        result = sock.connect_ex((host, port))
        sock.close()
        return result == 0
    except Exception:
        return False

def get_db_connection():
    """Retrieve an active database connection (MySQL if available, SQLite auto-fallback)."""
    global _cached_credentials, _use_sqlite_fallback

    if not _use_sqlite_fallback and is_mysql_port_open(Config.MYSQL_HOST, Config.MYSQL_PORT):
        candidate_pairs = [
            (Config.MYSQL_USER, Config.MYSQL_PASSWORD),
            ('roamly_user', 'roamly_password'),
            ('root', 'root_password'),
            ('root', 'password'),
            ('root', '')
        ]
        
        if _cached_credentials:
            u, p = _cached_credentials
            try:
                conn = pymysql.connect(
                    host=Config.MYSQL_HOST,
                    port=Config.MYSQL_PORT,
                    user=u,
                    password=p,
                    database=Config.MYSQL_DB,
                    cursorclass=pymysql.cursors.DictCursor,
                    connect_timeout=Config.MYSQL_CONNECT_TIMEOUT,
                    autocommit=True
                )
                return conn
            except Exception:
                _cached_credentials = None

        for u, p in candidate_pairs:
            try:
                admin_conn = pymysql.connect(
                    host=Config.MYSQL_HOST,
                    port=Config.MYSQL_PORT,
                    user=u,
                    password=p,
                    connect_timeout=Config.MYSQL_CONNECT_TIMEOUT,
                    autocommit=True
                )
                with admin_conn.cursor() as cur:
                    cur.execute(f"CREATE DATABASE IF NOT EXISTS `{Config.MYSQL_DB}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
                admin_conn.close()

                conn = pymysql.connect(
                    host=Config.MYSQL_HOST,
                    port=Config.MYSQL_PORT,
                    user=u,
                    password=p,
                    database=Config.MYSQL_DB,
                    cursorclass=pymysql.cursors.DictCursor,
                    connect_timeout=Config.MYSQL_CONNECT_TIMEOUT,
                    autocommit=True
                )
                _cached_credentials = (u, p)
                return conn
            except Exception:
                continue

    # Fallback to SQLite
    _use_sqlite_fallback = True
    sqlite_path = Config.SQLITE_DB_PATH
    conn = sqlite3.connect(sqlite_path)
    conn.row_factory = sqlite3.Row
    return SQLiteConnectionWrapper(conn)
