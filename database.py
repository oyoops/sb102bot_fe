
import psycopg2
import os


def connect_to_database():
    conn = None
    try:
        conn = psycopg2.connect(
            host=os.environ.get('DB_HOST'),
            port=os.environ.get('DB_PORT'),
            dbname=os.environ.get('DB_NAME'),
            user=os.environ.get('DB_USER'),
            password=os.environ.get('DB_PASSWORD'))
        print("Connected to the database!")
    except Exception as e:
        print("Unable to connect to the database.")
        print(e)
    return conn

# Additional database related functions can be added here
