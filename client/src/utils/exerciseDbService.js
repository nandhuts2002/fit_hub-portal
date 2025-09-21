import axios from 'axios';

const EX_KEY = process.env.REACT_APP_EXDB_KEY;
const EX_HOST = process.env.REACT_APP_EXDB_HOST || 'exercisedb.p.rapidapi.com';
const EX_URL = process.env.REACT_APP_EXDB_URL || `https://${EX_HOST}`;

const baseHeaders = () => ({
  'X-RapidAPI-Key': EX_KEY,
  'X-RapidAPI-Host': EX_HOST,
});

function assertKey() {
  if (!EX_KEY) {
    throw new Error('Missing ExerciseDB key. Set REACT_APP_EXDB_KEY in client/.env and restart the dev server.');
  }
}

export async function listBodyParts({ limit = 200, offset = 0 } = {}) {
  assertKey();
  const url = `${EX_URL}/exercises/bodyPartList`;
  const { data } = await axios.get(url, { headers: baseHeaders(), params: { limit, offset } });
  return data;
}

export async function searchExercises(query, { limit = 24, offset = 0 } = {}) {
  assertKey();
  const url = `${EX_URL}/exercises/name/${encodeURIComponent(query)}`;
  const { data } = await axios.get(url, { headers: baseHeaders(), params: { limit, offset } });
  return data;
}

export async function getByBodyPart(bodyPart, { limit = 24, offset = 0 } = {}) {
  assertKey();
  const url = `${EX_URL}/exercises/bodyPart/${encodeURIComponent(bodyPart)}`;
  const { data } = await axios.get(url, { headers: baseHeaders(), params: { limit, offset } });
  return data;
}

export async function getByEquipment(equipment, { limit = 24, offset = 0 } = {}) {
  assertKey();
  const url = `${EX_URL}/exercises/equipment/${encodeURIComponent(equipment)}`;
  const { data } = await axios.get(url, { headers: baseHeaders(), params: { limit, offset } });
  return data;
}

export async function getByTarget(target, { limit = 24, offset = 0 } = {}) {
  assertKey();
  const url = `${EX_URL}/exercises/target/${encodeURIComponent(target)}`;
  const { data } = await axios.get(url, { headers: baseHeaders(), params: { limit, offset } });
  return data;
}

export async function getExercise(id) {
  assertKey();
  const url = `${EX_URL}/exercises/exercise/${encodeURIComponent(id)}`;
  const { data } = await axios.get(url, { headers: baseHeaders() });
  return data;
}

// Utility to map an exercise into a concise card shape
export function mapToCard(x) {
  const id = x.id;
  const gif = x.gifUrl || (id ? `https://d205bpvrqc9yn1.cloudfront.net/${id}.gif` : undefined);
  return {
    id,
    name: x.name,
    bodyPart: x.bodyPart,
    target: x.target,
    equipment: x.equipment,
    gifUrl: gif,
    secondaryMuscles: x.secondaryMuscles,
    instructions: x.instructions,
  };
}
