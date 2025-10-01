import json
import re

def remove_emojis(text):
    """Remove emojis and other non-ASCII characters from text"""
    if not text:
        return text
    # Remove emojis and other non-ASCII characters
    text = text.encode('ascii', 'ignore').decode('ascii')
    # Remove any remaining special characters
    text = re.sub(r'[^\w\s-]', ' ', text)
    # Replace multiple spaces with a single space
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def clean_exercise_names():
    # Read the exercises file
    with open('custom_exercises.json', 'r', encoding='utf-8') as f:
        exercises = json.load(f)
    
    # Clean exercise names
    for exercise in exercises:
        if 'name' in exercise:
            exercise['name'] = remove_emojis(exercise['name'])
    
    # Save the cleaned data back to the file
    with open('custom_exercises_cleaned.json', 'w', encoding='utf-8') as f:
        json.dump(exercises, f, indent=2, ensure_ascii=False)
    
    print(f"Cleaned {len(exercises)} exercises. Output saved to custom_exercises_cleaned.json")

if __name__ == "__main__":
    clean_exercise_names()
