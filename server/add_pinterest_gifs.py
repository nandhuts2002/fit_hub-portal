#!/usr/bin/env python3
"""
Utility script to add Pinterest GIF URLs to the custom exercises database.
This script helps you easily add GIF URLs from the Pinterest board.
"""

import json
import os
from datetime import datetime

# Path to the custom exercises file
CUSTOM_EXERCISES_FILE = os.path.join(os.path.dirname(__file__), 'custom_exercises.json')

def load_custom_exercises():
    """Load custom exercises from JSON file"""
    if os.path.exists(CUSTOM_EXERCISES_FILE):
        try:
            with open(CUSTOM_EXERCISES_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError):
            return []
    return []

def save_custom_exercises(exercises):
    """Save custom exercises to JSON file"""
    try:
        with open(CUSTOM_EXERCISES_FILE, 'w', encoding='utf-8') as f:
            json.dump(exercises, f, indent=2, ensure_ascii=False)
        return True
    except IOError:
        return False

def add_pinterest_gif_url(exercise_name, gif_url):
    """Add a Pinterest GIF URL to an existing exercise"""
    exercises = load_custom_exercises()
    
    # Find the exercise by name
    for exercise in exercises:
        if exercise['name'].lower() == exercise_name.lower():
            exercise['gifUrl'] = gif_url
            exercise['updatedAt'] = datetime.now().isoformat()
            
            if save_custom_exercises(exercises):
                print(f"✅ Successfully added GIF URL for '{exercise_name}'")
                return True
            else:
                print(f"❌ Failed to save GIF URL for '{exercise_name}'")
                return False
    
    print(f"❌ Exercise '{exercise_name}' not found")
    return False

def list_available_exercises():
    """List all available Pinterest exercises"""
    exercises = load_custom_exercises()
    pinterest_exercises = [ex for ex in exercises if ex.get('source') == 'pinterest']
    
    print("\n📋 Available Pinterest Exercises:")
    print("=" * 50)
    for exercise in pinterest_exercises:
        status = "✅ Has GIF" if exercise.get('gifUrl') else "❌ No GIF"
        print(f"{exercise['name']:<25} | {status}")
    
    return pinterest_exercises

def bulk_add_gif_urls(gif_mappings):
    """Add multiple GIF URLs at once"""
    exercises = load_custom_exercises()
    updated_count = 0
    
    for exercise_name, gif_url in gif_mappings.items():
        for exercise in exercises:
            if exercise['name'].lower() == exercise_name.lower() and exercise.get('source') == 'pinterest':
                exercise['gifUrl'] = gif_url
                exercise['updatedAt'] = datetime.now().isoformat()
                updated_count += 1
                print(f"✅ Updated '{exercise['name']}' with GIF URL")
                break
    
    if save_custom_exercises(exercises):
        print(f"\n🎉 Successfully updated {updated_count} exercises!")
        return True
    else:
        print("\n❌ Failed to save updates")
        return False

def main():
    """Main function to interactively add GIF URLs"""
    print("🎯 Pinterest GIF URL Manager")
    print("=" * 40)
    
    while True:
        print("\nOptions:")
        print("1. List available exercises")
        print("2. Add GIF URL for specific exercise")
        print("3. Bulk add GIF URLs")
        print("4. Exit")
        
        choice = input("\nEnter your choice (1-4): ").strip()
        
        if choice == '1':
            list_available_exercises()
            
        elif choice == '2':
            exercise_name = input("Enter exercise name: ").strip()
            gif_url = input("Enter GIF URL: ").strip()
            
            if exercise_name and gif_url:
                add_pinterest_gif_url(exercise_name, gif_url)
            else:
                print("❌ Please provide both exercise name and GIF URL")
                
        elif choice == '3':
            print("\nEnter GIF URLs in format: exercise_name:gif_url")
            print("Enter 'done' when finished")
            
            mappings = {}
            while True:
                entry = input("Enter mapping (or 'done'): ").strip()
                if entry.lower() == 'done':
                    break
                
                if ':' in entry:
                    name, url = entry.split(':', 1)
                    mappings[name.strip()] = url.strip()
                else:
                    print("❌ Invalid format. Use: exercise_name:gif_url")
            
            if mappings:
                bulk_add_gif_urls(mappings)
            else:
                print("❌ No mappings provided")
                
        elif choice == '4':
            print("👋 Goodbye!")
            break
            
        else:
            print("❌ Invalid choice. Please enter 1-4.")

if __name__ == "__main__":
    main()

