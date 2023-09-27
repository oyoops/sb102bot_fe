
import psycopg2

def connect_to_database():
    conn = None
    try:
        conn = psycopg2.connect(
            host="45.82.75.6",
            port="5432",
            dbname="sb102bot_db",
            user="postgres",
            password=os.environ.get('DATABASE_PASSWORD')  # Placeholder for the password
        )
        print("Connected to the database!")
    except Exception as e:
        print("Unable to connect to the database.")
        print(e)
    return conn

# Additional database related functions can be added here
