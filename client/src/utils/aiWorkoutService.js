import axios from 'axios';

/**
 * AI Workout Planner service via RapidAPI
 *
 * Env vars (Create React App):
 * - REACT_APP_RAPIDAPI_KEY
 * - REACT_APP_RAPIDAPI_HOST (e.g. "some-workout-api.p.rapidapi.com")
 * - REACT_APP_RAPIDAPI_URL (full URL, e.g. "https://some-workout-api.p.rapidapi.com/plan")
 * - REACT_APP_RAPIDAPI_METHOD (GET or POST; default POST)
 *
 * You can override via options when calling.
 */
export async function generateWorkoutPlan(payload, options = {}) {
  const {
    apiKey = process.env.REACT_APP_RAPIDAPI_KEY,
    apiHost = process.env.REACT_APP_RAPIDAPI_HOST,
    apiUrl = process.env.REACT_APP_RAPIDAPI_URL,
    method = (process.env.REACT_APP_RAPIDAPI_METHOD || 'POST').toUpperCase(),
    params = {},
    headers = {},
  } = options;

  if (!apiKey) throw new Error('Missing RapidAPI key. Set REACT_APP_RAPIDAPI_KEY');
  if (!apiHost) throw new Error('Missing RapidAPI host. Set REACT_APP_RAPIDAPI_HOST');
  if (!apiUrl) throw new Error('Missing RapidAPI URL. Set REACT_APP_RAPIDAPI_URL');

  const commonHeaders = {
    'X-RapidAPI-Key': apiKey,
    'X-RapidAPI-Host': apiHost,
    'Content-Type': 'application/json',
    ...headers,
  };

  try {
    const response = await axios({
      url: apiUrl,
      method,
      headers: commonHeaders,
      // Always include params, even for POST endpoints that expect query params
      params: { ...params },
      // Payload is optional; for form-encoded-in-query POSTs this can be empty/undefined
      data: method === 'GET' ? undefined : payload,
      timeout: 20000,
    });

    // Many RapidAPI endpoints return data within different shapes.
    // We normalize a bit but also return raw for flexibility.
    return {
      ok: true,
      data: response.data,
      raw: response,
    };
  } catch (error) {
    console.error('AI Workout Planner error:', error);
    const message = error?.response?.data?.message || error?.message || 'Unknown error';
    return {
      ok: false,
      error: message,
      status: error?.response?.status,
      raw: error?.response,
    };
  }
}

/**
 * Helper to prepare a simple prompt-style payload if the target API expects free-form text.
 */
export function buildPromptPayload({ goal, experience, daysPerWeek, durationMinutes, equipment, injuries, preferences }) {
  const lines = [];
  if (goal) lines.push(`Goal: ${goal}`);
  if (experience) lines.push(`Experience: ${experience}`);
  if (daysPerWeek) lines.push(`Days/Week: ${daysPerWeek}`);
  if (durationMinutes) lines.push(`Session Duration: ${durationMinutes} minutes`);
  if (equipment && equipment.length) lines.push(`Equipment: ${equipment.join(', ')}`);
  if (injuries) lines.push(`Injuries/Limitations: ${injuries}`);
  if (preferences) lines.push(`Preferences: ${preferences}`);
  const prompt = `Create a weekly workout plan with warm-up, main sets, and cool-down. Be specific with sets, reps, tempo, and rest.\n\n${lines.join('\n')}`;
  return { prompt };
}
