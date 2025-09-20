/**
 * downloadGifs.js
 * Fetches all exercises from ExerciseDB API and downloads their GIFs
 */

const fs = require('fs');
const fetch = require('node-fetch');
const path = require('path');

// Replace with your RapidAPI key
const RAPIDAPI_KEY = '3c3c712535mshc8767affa28c1d3p19b724jsn63fe287b7400';

// Output folder in your React public directory
const OUTPUT_FOLDER = path.join(__dirname, '../../public/assets/gifs');

// Ensure folder exists
if (!fs.existsSync(OUTPUT_FOLDER)) fs.mkdirSync(OUTPUT_FOLDER, { recursive: true });

(async () => {
  try {
    console.log('Fetching all exercises from ExerciseDB API...');
    const res = await fetch('https://exercisedb.p.rapidapi.com/exercises', {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'exercisedb.p.rapidapi.com'
      }
    });

    const exercises = await res.json();
    console.log(`Fetched ${exercises.length} exercises.`);

    for (const exercise of exercises) {
      if (!exercise.gifUrl) continue;

      const fileName = exercise.name.toLowerCase().replace(/\s+/g, '-') + '.gif';
      const filePath = path.join(OUTPUT_FOLDER, fileName);

      try {
        const gifRes = await fetch(exercise.gifUrl);
        if (!gifRes.ok) throw new Error(`Failed to fetch GIF`);

        const buffer = await gifRes.arrayBuffer();
        fs.writeFileSync(filePath, Buffer.from(buffer));
        console.log(`Downloaded: ${fileName}`);
      } catch (err) {
        console.log(`Error downloading ${exercise.name}: ${err.message}`);
      }

      // Optional: delay to avoid hitting rate limits
      await new Promise(r => setTimeout(r, 100));
    }

    console.log('✅ All GIFs downloaded successfully!');
  } catch (err) {
    console.error('Error fetching exercises:', err.message);
  }
})();
