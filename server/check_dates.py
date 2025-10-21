from pymongo import MongoClient
import os
from dotenv import load_dotenv
import time
from datetime import datetime

load_dotenv()
client = MongoClient(os.getenv('MONGO_URI'))
db = client['fithub']

now_ms = int(time.time() * 1000)
print(f'Current time (ms): {now_ms}')
print(f'Current time: {datetime.fromtimestamp(now_ms/1000)}\n')

challenges = list(db.challenges_collection.find({}))
print(f'=== Challenges ({len(challenges)}) ===\n')

for c in challenges:
    end_date_ms = c.get('endDate')
    end_date = datetime.fromtimestamp(end_date_ms/1000) if end_date_ms else None
    is_active = end_date_ms >= now_ms if end_date_ms else False
    
    print(f'Name: {c.get("name")}')
    print(f'End Date (ms): {end_date_ms}')
    print(f'End Date: {end_date}')
    print(f'Is Active (endDate >= now): {is_active}')
    print(f'Days until end: {(end_date_ms - now_ms) / (1000 * 60 * 60 * 24):.1f} days' if end_date_ms else 'N/A')
    print()
