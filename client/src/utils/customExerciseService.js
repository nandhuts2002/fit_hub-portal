import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_BASE_URL || process.env.REACT_APP_API_URL || 'http://localhost:5000';

async function getCustomExercises() {
  const { data } = await axios.get(`${API_BASE}/api/custom-exercises`);
  // server returns an array directly
  return Array.isArray(data) ? data : (data?.data || []);
}

async function getCustomExercisesByBodyPart(bodyPart) {
  const { data } = await axios.get(`${API_BASE}/api/custom-exercises`, { params: { body_part: bodyPart } });
  return Array.isArray(data) ? data : (data?.data || []);
}

async function searchCustomExercises(query, opts = {}) {
  const params = { q: query };
  if (opts.bodyPart) params.bodyPart = opts.bodyPart;
  const { data } = await axios.get(`${API_BASE}/api/custom-exercises/search`, { params });
  return Array.isArray(data) ? data : (data?.data || []);
}

async function addTrainerExercise(exerciseData) {
  // Supports both JSON and FormData; send multipart when a file exists
  const hasFile = !!(exerciseData?.mediaFile || exerciseData?.gifFile);
  const hasUrl = !!(exerciseData?.mediaUrl || exerciseData?.gifUrl);
  
  if (hasFile) {
    const form = new FormData();
    form.append('name', exerciseData.name || '');
    form.append('bodyPart', exerciseData.bodyPart || '');
    form.append('target', exerciseData.target || '');
    form.append('equipment', exerciseData.equipment || '');
    form.append('instructions', JSON.stringify(exerciseData.instructions || []));
    form.append('trainerId', exerciseData.trainerId || '');
    // server accepts 'mediaFile' and legacy 'gifFile'
    const file = exerciseData.mediaFile || exerciseData.gifFile;
    if (file) {
      form.append('mediaFile', file);
      form.append('gifFile', file);
    }
    const { data } = await axios.post(`${API_BASE}/api/custom-exercises`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  } else {
    const payload = {
      name: exerciseData.name,
      bodyPart: exerciseData.bodyPart,
      target: exerciseData.target,
      equipment: exerciseData.equipment,
      instructions: exerciseData.instructions,
      trainerId: exerciseData.trainerId || '',
    };
    
    // Include URL if provided (check both fields)
    if (exerciseData.mediaUrl || exerciseData.gifUrl) {
      payload.mediaUrl = exerciseData.mediaUrl || exerciseData.gifUrl;
    }
    
    const { data } = await axios.post(`${API_BASE}/api/custom-exercises`, payload);
    return data;
  }
}

async function deleteTrainerExercise(exerciseId) {
  const { data } = await axios.delete(`${API_BASE}/api/custom-exercises/${encodeURIComponent(exerciseId)}`);
  // server returns { message } on success
  if (data?.error) throw new Error(data.error);
  return data;
}

const customExerciseService = {
  getCustomExercises,
  getCustomExercisesByBodyPart,
  searchCustomExercises,
  addTrainerExercise,
  deleteTrainerExercise,
};

export default customExerciseService;

