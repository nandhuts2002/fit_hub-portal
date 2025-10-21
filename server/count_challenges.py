from pymongo import MongoClient
import os
from dotenv import load_dotenv
import time

load_dotenv()
client = MongoClient(os.getenv('MONGO_URI'))
db = client['fithub']

now = int(time.time() * 1000)
all_challenges = list(db.challenges_collection.find({}))
active_challenges = list(db.challenges_collection.find({'endDate': {'$gte': now}}))

print(f'Total challenges in DB: {len(all_challenges)}')
print(f'Active challenges (endDate >= now): {len(active_challenges)}\n')

print('All challenges:')
for c in all_challenges:
    print(f'  - {c.get("name")} (ID: {c.get("id")[:8]}...)')

print('\nActive challenges (what API returns):')
for c in active_challenges:
    print(f'  - {c.get("name")} (ID: {c.get("id")[:8]}...)')
