from pymongo import MongoClient
from dotenv import load_dotenv
import os

load_dotenv()

client = MongoClient(os.getenv('MONGO_URI'))
db = client['fithub']

users_collection = db['users']  # ✅ This is what gets imported in auth.py
