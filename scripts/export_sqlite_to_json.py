"""
Exports all SQLite tables from database.db to clean JSON files in scripts/export/
Used by MongoDB importer.
"""
import os
import sqlite3
import json

base_dir = os.path.dirname(os.path.abspath(__file__))
db_path = os.path.join(base_dir, '..', 'database.db')
export_dir = os.path.join(base_dir, 'export')

os.makedirs(export_dir, exist_ok=True)

if not os.path.exists(db_path):
    print(f"No sqlite database found at {db_path}")
    exit(0)

conn = sqlite3.connect(db_path)
conn.row_factory = sqlite3.Row
cursor = conn.cursor()

cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
tables = [r['name'] for r in cursor.fetchall() if not r['name'].startswith('sqlite_')]

for tbl in tables:
    cursor.execute(f"SELECT * FROM `{tbl}`")
    rows = [dict(r) for r in cursor.fetchall()]
    out_file = os.path.join(export_dir, f"{tbl}.json")
    with open(out_file, 'w', encoding='utf-8') as f:
        json.dump(rows, f, indent=2, default=str)
    print(f"Exported {len(rows)} rows from {tbl} -> {out_file}")

conn.close()
print("All SQLite tables exported to JSON successfully!")
