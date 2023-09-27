
from http.server import BaseHTTPRequestHandler
import json
from geocoding import reverseGeocode
from database import connect_to_database

class handler(BaseHTTPRequestHandler):
    def send_cors_headers(self):
        """Set headers for Cross-Origin Resource Sharing (CORS)"""
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')

    def do_OPTIONS(self):
        """Respond to an OPTIONS request."""
        self.send_response(204)
        self.send_cors_headers()
        self.end_headers()
    
    def do_GET(self):
        # Handle the GET request here, maybe return a basic message or form
        self.send_response(200)
        self.send_cors_headers()
        self.send_header('Content-type', 'text/plain')
        self.end_headers()
        self.wfile.write(str("Send a POST request with an address to analyze an address.").encode())

    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        input_data_str = post_data.decode("utf-8")
        input_data = json.loads(input_data_str)
        userInputAddress = input_data.get('address', '')
        print(f"User input address: {userInputAddress}")
        # More processing logic here...

# Main server code can be added here


    def get_county_info(self, county_name):
        conn = connect_to_database()
        if not conn:
            return {"error": "Failed to connect to the database."}
        
        try:
            cur = conn.cursor()
            
            # Fetch data from florida_counties table
            cur.execute("SELECT * FROM florida_counties WHERE county_name = %s", (county_name,))
            county_data = cur.fetchone()
            
            # Fetch data from county_amis, county_max_incomes, and county_max_rents tables
            cur.execute("SELECT * FROM county_amis WHERE county_name = %s", (county_name,))
            amis_data = cur.fetchone()
            
            cur.execute("SELECT * FROM county_max_incomes WHERE county_name = %s", (county_name,))
            max_incomes_data = cur.fetchone()

            cur.execute("SELECT * FROM county_max_rents WHERE county_name = %s", (county_name,))
            max_rents_data = cur.fetchone()
            
            return {
                "county_data": county_data,
                "amis_data": amis_data,
                "max_incomes_data": max_incomes_data,
                "max_rents_data": max_rents_data
            }
        except Exception as e:
            print(e)
            return {"error": "Error fetching data from the database."}
        finally:
            conn.close()

    def handle_county_info_endpoint(self, county_name):
        data = self.get_county_info(county_name)
        self.send_response(200)
        self.send_cors_headers()
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())



def get_nearby_parcels(self, lat, lng, radius=1000):  # Default radius set to 1000 meters
    conn = connect_to_database()
    if not conn:
        return {"error": "Failed to connect to the database."}

    try:
        cur = conn.cursor()

        # Using ST_DWithin and ST_SetSRID to fetch parcels within the specified radius
        query = f'''
        SELECT parcelno, county_name 
        FROM parcels_master 
        WHERE ST_DWithin(geom, ST_SetSRID(ST_MakePoint({lng}, {lat}), 4326), {radius});
        '''
        cur.execute(query)
        parcels = cur.fetchall()

        return {"parcels": parcels}
    except Exception as e:
        print(e)
        return {"error": "Error fetching nearby parcels from the database."}
    finally:
        conn.close()

def handle_nearby_parcels_endpoint(self, lat, lng):
    data = self.get_nearby_parcels(lat, lng)
    self.send_response(200)
    self.send_cors_headers()
    self.send_header('Content-type', 'application/json')
    self.end_headers()
    self.wfile.write(json.dumps(data).encode())



def get_parcel_info(self, lat, lng):
    conn = connect_to_database()
    if not conn:
        return {"error": "Failed to connect to the database."}

    try:
        cur = conn.cursor()

        # Using ST_DWithin and ST_SetSRID to fetch the closest parcel to the specified point
        query = f'''
        SELECT parcelno, county_name 
        FROM parcels_master 
        WHERE ST_DWithin(geom, ST_SetSRID(ST_MakePoint({lng}, {lat}), 4326), 10)  # 10 meters threshold
        LIMIT 1;
        '''
        cur.execute(query)
        parcel = cur.fetchone()

        return {"parcel": parcel}
    except Exception as e:
        print(e)
        return {"error": "Error fetching parcel information from the database."}
    finally:
        conn.close()

def handle_parcel_info_endpoint(self, lat, lng):
    data = self.get_parcel_info(lat, lng)
    self.send_response(200)
    self.send_cors_headers()
    self.send_header('Content-type', 'application/json')
    self.end_headers()
    self.wfile.write(json.dumps(data).encode())

