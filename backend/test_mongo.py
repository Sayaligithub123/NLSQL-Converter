import os
import sys
from pymongo import MongoClient
from dotenv import load_dotenv

# Load backend .env
load_dotenv(".env")

uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
db_name = os.getenv("MONGODB_DB_NAME", "nlsql_db")

print("=" * 60)
print("🔍 Testing MongoDB Connection...")
print(f"Database Name: {db_name}")

# Mask password for display
import re
masked_uri = re.sub(r'(://[^:]+:)([^@]+)(@)', r'\1****\3', uri)
print(f"Target URI:    {masked_uri}")
print("=" * 60)

try:
    client = MongoClient(uri, serverSelectionTimeoutMS=6000, connectTimeoutMS=6000)
    # Ping database
    result = client.admin.command('ping')
    print("✅ SUCCESS: Successfully connected to your MongoDB!")
    print(f"Ping Response: {result}")
    
    # Check default or target database
    db = client[db_name]
    collections = db.list_collection_names()
    print(f"Database '{db_name}' collections: {collections if collections else '[] (empty, ready for data)'}")
    
    user_count = db["users"].count_documents({})
    print(f"Current registered users: {user_count}")
    print("=" * 60)
    print("🚀 You are all set! Your backend will use this MongoDB database.")

except Exception as err:
    print("❌ FAILED TO CONNECT:")
    print(str(err))
    print("\n💡 Troubleshooting Tips:")
    if "mongodb+srv" in uri:
        print("1. Network Access / IP Whitelist: In MongoDB Atlas -> 'Network Access', make sure 0.0.0.0/0 (allow access from anywhere) is enabled.")
        print("2. Database User: Check your username and password in Atlas -> 'Database Access'.")
        print("3. Special Characters: If your password contains special characters like @, #, $, URL-encode them (e.g. @ becomes %40).")
    else:
        print("1. If using localhost: Make sure mongod service is running locally (`mongod` or Start MongoDB Windows Service).")
    print("=" * 60)
