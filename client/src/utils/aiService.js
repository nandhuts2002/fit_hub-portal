class AIService {
  constructor() {
    this.apiBase = process.env.REACT_APP_API_BASE_URL || process.env.REACT_APP_API_URL || 'http://localhost:5000';
  }

  async chat(message, context = {}) {
    const res = await fetch(`${this.apiBase}/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, context }),
    });
    if (!res.ok) throw new Error((await res.json().catch(()=>({}))).error || 'Chat failed');
    return res.json();
  }
}

export default new AIService();











