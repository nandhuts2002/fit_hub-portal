from models import users_collection
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# Get all trainers
trainers = list(users_collection.find({'role': 'trainer'}))

print(f"Number of trainers: {len(trainers)}")

for trainer in trainers:
    print(f"- {trainer.get('firstName', '')} {trainer.get('lastName', '')} ({trainer.get('email')})")