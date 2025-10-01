class CustomExerciseService {
  constructor() {
    this.apiBase = process.env.REACT_APP_API_BASE_URL || process.env.REACT_APP_API_URL || 'http://localhost:5000';
  }

  async getCustomExercises() {
    const res = await fetch(`${this.apiBase}/api/custom-exercises`);
    if (!res.ok) throw new Error('Failed to fetch custom exercises');
    return res.json();
  }

  async getCustomExercisesByBodyPart(bodyPart) {
    const res = await fetch(`${this.apiBase}/api/custom-exercises?body_part=${encodeURIComponent(bodyPart)}`);
    if (!res.ok) throw new Error('Failed to fetch exercises by body part');
    return res.json();
  }

  async searchCustomExercises(query) {
    const res = await fetch(`${this.apiBase}/api/custom-exercises/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error('Failed to search exercises');
    return res.json();
  }

  async addTrainerExercise(exerciseData) {
    const form = new FormData();
    form.append('name', exerciseData.name);
    form.append('bodyPart', exerciseData.bodyPart);
    form.append('target', exerciseData.target);
    form.append('equipment', exerciseData.equipment);
    form.append('instructions', JSON.stringify(exerciseData.instructions));
    if (exerciseData.mediaFile) form.append('mediaFile', exerciseData.mediaFile);
    else if (exerciseData.gifFile) form.append('gifFile', exerciseData.gifFile);
    const res = await fetch(`${this.apiBase}/api/custom-exercises`, { method: 'POST', body: form });
    if (!res.ok) throw new Error((await res.json().catch(()=>({}))).error || 'Failed to add exercise');
    return res.json();
  }

  async deleteTrainerExercise(id) {
    const res = await fetch(`${this.apiBase}/api/custom-exercises/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error((await res.json().catch(()=>({}))).error || 'Failed to delete exercise');
    return res.json();
  }
}

export default new CustomExerciseService();


