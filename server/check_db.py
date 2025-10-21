from pymongo import MongoClient
import os
from dotenv import load_dotenv
import json

load_dotenv()
client = MongoClient(os.getenv('MONGO_URI'))
db = client['fithub']

challenges = list(db.challenges_collection.find({}, {'_id': 0}))
print(f'\n=== Total challenges in DB: {len(challenges)} ===\n')

for i, c in enumerate(challenges, 1):
    print(f'{i}. {c.get("name")}')
    print(f'   ID: {c.get("id")}')
    print(f'   Participants: {c.get("participants", [])}')
    print(f'   Goal: {c.get("goalValue")} {c.get("goalType")}')
    print()
