from models import tutorials_collection
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# Get all tutorials
tutorials = list(tutorials_collection.find({}))

print(f"Number of tutorials: {len(tutorials)}")

for tutorial in tutorials:
    print(f"- {tutorial.get('title', '')} by {tutorial.get('trainer_name', 'Unknown')} ({tutorial.get('trainer_email', 'Unknown')})")