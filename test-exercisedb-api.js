// Test ExerciseDB API to check response structure
const fetch = require('node-fetch');

const API_KEY = '24c0a13759msh344d0010d48c37ap1768f4jsna483e3454815';
const BASE_URL = 'https://exercisedb.p.rapidapi.com';

async function testExerciseDBAPI() {
  try {
    console.log('🧪 Testing ExerciseDB API...');
    console.log('API Key:', API_KEY.substring(0, 10) + '...');
    
    const response = await fetch(`${BASE_URL}/exercises?limit=3`, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': API_KEY,
        'X-RapidAPI-Host': 'exercisedb.p.rapidapi.com',
        'Content-Type': 'application/json'
      }
    });

    console.log('Response Status:', response.status);
    console.log('Response Headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error:', errorText);
      return;
    }

    const data = await response.json();
    console.log('✅ Successfully fetched exercises:', data.length);
    
    // Print first exercise to see structure
    console.log('\n📋 Sample Exercise Object:');
    console.log(JSON.stringify(data[0], null, 2));
    
    // Check for image-related properties
    const firstExercise = data[0];
    console.log('\n🔍 Image Properties Check:');
    console.log('gifUrl:', firstExercise.gifUrl);
    console.log('imageUrl:', firstExercise.imageUrl);
    console.log('image:', firstExercise.image);
    console.log('gif:', firstExercise.gif);
    console.log('url:', firstExercise.url);
    
    // Check all properties
    console.log('\n📝 All Properties:');
    Object.keys(firstExercise).forEach(key => {
      console.log(`${key}:`, firstExercise[key]);
    });

  } catch (error) {
    console.error('❌ Error testing API:', error.message);
  }
}

testExerciseDBAPI();

