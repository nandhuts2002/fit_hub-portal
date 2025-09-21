import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { generateWorkoutPlan, buildPromptPayload } from '../utils/aiWorkoutService';

const experiences = ['beginner', 'intermediate', 'advanced'];

export default function AIWorkoutPlanner({ theme = 'dark' }) {
  const [form, setForm] = useState({
    goal: '',
    experience: 'beginner',
    daysPerWeek: 3,
    durationMinutes: 45,
    equipment: '',
    injuries: '',
    preferences: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [cooldownUntil, setCooldownUntil] = useState(0);

  const isDark = theme === 'dark';

  // Derived remaining cooldown in seconds
  const [cooldownLeft, setCooldownLeft] = useState(0);
  useEffect(() => {
    if (!cooldownUntil) return;
    const id = setInterval(() => {
      const left = Math.max(0, Math.ceil((cooldownUntil - Date.now()) / 1000));
      setCooldownLeft(left);
      if (left <= 0) clearInterval(id);
    }, 250);
    return () => clearInterval(id);
  }, [cooldownUntil]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (Date.now() < cooldownUntil) {
      setError(`Please wait ${Math.max(1, cooldownLeft)}s before trying again (to avoid rate-limit).`);
      return;
    }
    setError('');
    setResult(null);
    setLoading(true);
    try {
      // Determine which payload shape to use based on endpoint
      const apiUrl = process.env.REACT_APP_RAPIDAPI_URL || '';
      const isGeneratePlan = apiUrl.toLowerCase().includes('generateworkoutplan');

      let payload;
      let options = {};
      if (isGeneratePlan) {
        // Structured JSON as per provider's sample
        payload = {
          goal: String(form.goal || '').trim(),
          fitness_level: (form.experience || 'beginner').charAt(0).toUpperCase() + (form.experience || 'beginner').slice(1),
          preferences: (form.preferences || '')
            ? form.preferences.split(',').map(s => s.trim()).filter(Boolean)
            : [],
          health_conditions: (form.injuries || '') ? [String(form.injuries).trim()] : ['None'],
          schedule: {
            days_per_week: Number(form.daysPerWeek) || 3,
            session_duration: Number(form.durationMinutes) || 45,
          },
          plan_duration_weeks: 4,
          lang: 'en',
        };
        options = {
          params: { noqueue: 1 },
          headers: { 'Content-Type': 'application/json' },
        };
      } else {
        // Fallback to prompt-style payload
        payload = buildPromptPayload({
          goal: form.goal,
          experience: form.experience,
          daysPerWeek: Number(form.daysPerWeek),
          durationMinutes: Number(form.durationMinutes),
          equipment: form.equipment
            ? form.equipment.split(',').map((s) => s.trim()).filter(Boolean)
            : [],
          injuries: form.injuries,
          preferences: form.preferences,
        });
      }

      const resp = await generateWorkoutPlan(payload, options);
      if (!resp.ok) {
        // Handle RapidAPI rate limiting specifically
        if (resp.status === 429) {
          setCooldownUntil(Date.now() + 15000); // 15s cooldown
          throw new Error('Rate limit reached. Please try again in ~15 seconds.');
        }
        throw new Error(resp.error || 'Failed to generate plan');
      }
      setResult(resp.data);
      // Small cooldown to avoid accidental rapid re-submits
      setCooldownUntil(Date.now() + 5000);
    } catch (err) {
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const pretty = useMemo(() => {
    if (!result) return '';
    try {
      return JSON.stringify(result, null, 2);
    } catch {
      return String(result);
    }
  }, [result]);

  // Pretty weekday names helper, aligned to Monday start
  const WEEKDAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

  // Normalize provider responses into a common { days: [{ title, focus?, exercises: [...] }] } shape
  const getNormalizedDays = (data) => {
    if (!data) return null;
    // 1) Handle sample: { result: { exercises: [ { day, exercises:[...] }, ... ] } }
    const r = data.result || data.data?.result;
    if (r && Array.isArray(r.exercises)) {
      return r.exercises.map((d) => ({
        title: d.day || d.name || d.title,
        focus: d.focus,
        exercises: Array.isArray(d.exercises) ? d.exercises.map((ex) => ({
          name: ex.name || ex.exercise || ex.title,
          sets: ex.sets || ex.num_sets,
          reps: ex.repetitions || ex.reps || ex.rep_range,
          duration: ex.duration || ex.time || ex.minutes,
          rest: ex.rest || ex.rest_time,
          equipment: ex.equipment || ex.equipment_needed || ex.required_equipment,
        })) : [],
      }));
    }

    // 2) Generic keys
    const tryKeys = [
      data.plan,
      data.weekly_plan,
      data.weeklyPlan,
      data.data?.plan,
      data.data?.weekly_plan,
    ];
    const found = tryKeys.find((k) => k);
    if (!found) return null;
    const plan = found;
    let days = Array.isArray(plan) ? plan : (plan.days || plan.week || Object.values(plan));
    if (!Array.isArray(days)) return null;
    return days.map((d, i) => ({
      title: d.title || d.name || d.day || `Day ${i + 1}`,
      focus: d.focus,
      exercises: Array.isArray(d.exercises || d.workouts || d.items || d.activities)
        ? (d.exercises || d.workouts || d.items || d.activities).map((ex) => ({
            name: ex.name || ex.exercise || ex.title,
            sets: ex.sets || ex.num_sets,
            reps: ex.reps || ex.repetitions || ex.rep_range,
            duration: ex.duration || ex.time || ex.minutes,
            rest: ex.rest || ex.rest_time,
            equipment: ex.equipment || ex.equipment_needed || ex.required_equipment,
          }))
        : [],
    }));
  };

  // Try to format a weekly plan nicely if present
  const renderFormattedPlan = (data) => {
    if (!data) return null;
    let days = getNormalizedDays(data);
    if (!days || days.length === 0) return null;

    // If the API returns fewer items than requested daysPerWeek, we still render what we have.
    // Derive display day names based on index.
    const baseNames = Array.from({ length: days.length }, (_, i) => WEEKDAYS[(i * Math.ceil(7 / Math.max(1, Number(form.daysPerWeek)))) % 7]);

    return (
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {days.map((day, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.25, delay: idx * 0.05 }}
            className={`${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} rounded-2xl border shadow-sm overflow-hidden`}
          >
            <div className="h-1.5 bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600" />
            <div className="p-5">
              <div className="flex items-center justify-between mb-2">
                <div className={`text-sm font-semibold ${isDark ? 'text-orange-300' : 'text-orange-700'}`}>
                  {day?.title || baseNames[idx] || `Day ${idx + 1}`}
                </div>
                {day?.focus && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${isDark ? 'bg-gray-800 text-gray-200' : 'bg-gray-100 text-gray-700'}`}>{day.focus}</span>
                )}
              </div>
              {Array.isArray(day?.exercises) ? (
                <ul className={`space-y-2 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                  {day.exercises.map((ex, i) => (
                    <li key={i} className={`${isDark ? 'bg-gray-800' : 'bg-gray-50'} rounded-xl px-3 py-2`}> 
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-sm font-semibold">{ex.name || `Exercise ${i + 1}`}</div>
                          <div className="text-[11px] opacity-80 mt-0.5">
                            {ex.sets ? `${ex.sets} sets` : ''}
                            {ex.reps ? ` • ${ex.reps} reps` : ''}
                            {ex.duration ? ` • ${ex.duration} mins` : ''}
                            {ex.rest ? ` • rest ${ex.rest}` : ''}
                          </div>
                        </div>
                        {ex.equipment && (
                          <span className={`shrink-0 text-[10px] px-2 py-0.5 rounded-full ${isDark ? 'bg-gray-700 text-gray-200' : 'bg-white text-gray-700 border border-gray-200'}`}>
                            {Array.isArray(ex.equipment) ? ex.equipment.join(', ') : ex.equipment}
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className={`${isDark ? 'text-gray-300' : 'text-gray-700'} text-sm`}>{day?.description || 'No exercise details provided.'}</div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    );
  };

  const extractDays = (data) => getNormalizedDays(data);

  const handleCopyJson = async () => {
    try {
      await navigator.clipboard.writeText(pretty);
      setError('');
    } catch (e) {
      setError('Failed to copy to clipboard');
    }
  };

  const handleDownloadPdf = () => {
    try {
      const days = extractDays(result);
      const title = 'AI Workout Plan';
      const html = `<!doctype html>
      <html><head><meta charset="utf-8" />
      <title>${title}</title>
      <style>
        body { font-family: Arial, Helvetica, sans-serif; margin: 24px; color: #111; }
        h1 { font-size: 20px; margin: 0 0 16px; }
        .day { border: 1px solid #e5e7eb; border-radius: 12px; padding: 12px 14px; margin: 10px 0; }
        .title { font-weight: 700; font-size: 14px; color: #d97706; margin-bottom: 6px; }
        .ex { background: #fafafa; border-radius: 8px; padding: 8px; margin: 6px 0; }
        .ex-name { font-weight: 600; font-size: 12px; }
        .meta { font-size: 11px; color: #374151; }
        pre { white-space: pre-wrap; font-size: 11px; background: #fafafa; padding: 12px; border-radius: 8px; }
      </style></head>
      <body>
        <h1>${title}</h1>
        ${days ? days.map((d, i) => `
          <div class="day">
            <div class="title">${d?.title || d?.name || `Day ${i + 1}`}</div>
            ${Array.isArray(d?.exercises) ? d.exercises.map((ex, j) => `
              <div class="ex">
                <div class="ex-name">${ex.name || ex.exercise || `Exercise ${j + 1}`}</div>
                <div class="meta">
                  ${ex.sets ? `${ex.sets} sets` : ''}
                  ${ex.reps ? ` • ${ex.reps} reps` : ''}
                  ${ex.duration ? ` • ${ex.duration} mins` : ''}
                  ${ex.rest ? ` • rest ${ex.rest}` : ''}
                </div>
              </div>
            `).join('') : `<div class="meta">${d?.description || 'No details provided.'}</div>`}
          </div>
        `).join('') : `<pre>${pretty.replace(/[&<>]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]))}</pre>`}
        <script>window.onload = () => { window.print(); setTimeout(()=>window.close(), 300); };</script>
      </body></html>`;
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const w = window.open(url, '_blank');
      if (!w) alert('Please allow popups to download the PDF');
    } catch (e) {
      setError('Failed to generate PDF');
    }
  };

  return (
    <section className={`relative overflow-hidden rounded-3xl ${isDark ? 'bg-gradient-to-br from-gray-900 via-gray-950 to-black' : 'bg-gradient-to-br from-orange-50 via-rose-50 to-purple-50'} border ${isDark ? 'border-gray-800' : 'border-gray-200'} shadow-xl`}>
      {/* Decorative gradient orbs */}
      <div className="pointer-events-none absolute -top-24 -right-24 w-72 h-72 rounded-full blur-3xl opacity-30 bg-gradient-to-br from-orange-500/40 via-pink-500/30 to-purple-600/30" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 w-72 h-72 rounded-full blur-3xl opacity-30 bg-gradient-to-br from-purple-600/30 via-pink-500/30 to-orange-500/40" />

      <div className="relative p-6 md:p-10">
        {/* Heading */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/70 backdrop-blur border border-white/60 shadow-sm">
            <span>🧠</span>
            <span className="text-xs font-semibold text-gray-700">AI Workout Planner</span>
          </div>
          <h3 className={`mt-3 text-2xl md:text-3xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>Plan your week like a pro</h3>
          <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'} mt-1`}>Describe your goal and constraints. We’ll craft a structured weekly plan.</p>
        </motion.div>

        {/* Glass form card */}
        <motion.form onSubmit={onSubmit} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className={`rounded-2xl ${isDark ? 'bg-white/5' : 'bg-white/80'} backdrop-blur border ${isDark ? 'border-white/10' : 'border-white/60'} shadow-lg p-5 md:p-7`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div className="md:col-span-2">
              <label className={`block text-sm font-semibold mb-1 ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>Primary goal</label>
              <input
                type="text"
                name="goal"
                required
                value={form.goal}
                onChange={onChange}
                placeholder="e.g., build muscle, lose fat, improve endurance"
                className={`w-full px-4 py-3 rounded-xl border shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500/60 ${isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500'}`}
              />
            </div>

            <div>
              <label className={`block text-sm font-semibold mb-1 ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>Experience</label>
              <select
                name="experience"
                value={form.experience}
                onChange={onChange}
                className={`w-full px-4 py-3 rounded-xl border shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500/60 ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'}`}
              >
                {experiences.map((ex) => (
                  <option key={ex} value={ex}>{ex}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={`block text-sm font-semibold mb-1 ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>Days per week</label>
              <input
                type="number"
                min={1}
                max={7}
                name="daysPerWeek"
                value={form.daysPerWeek}
                onChange={onChange}
                className={`w-full px-4 py-3 rounded-xl border shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500/60 ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'}`}
              />
            </div>

            <div>
              <label className={`block text-sm font-semibold mb-1 ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>Session duration (minutes)</label>
              <input
                type="number"
                min={15}
                max={180}
                step={5}
                name="durationMinutes"
                value={form.durationMinutes}
                onChange={onChange}
                className={`w-full px-4 py-3 rounded-xl border shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500/60 ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'}`}
              />
            </div>

            <div className="md:col-span-2">
              <label className={`block text-sm font-semibold mb-1 ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>
                Equipment available (comma-separated)
              </label>
              <input
                type="text"
                name="equipment"
                value={form.equipment}
                onChange={onChange}
                placeholder="e.g., dumbbells, bench, pull-up bar"
                className={`w-full px-4 py-3 rounded-xl border shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500/60 ${isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500'}`}
              />
            </div>

            <div className="md:col-span-2">
              <label className={`block text-sm font-semibold mb-1 ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>Injuries / limitations</label>
              <input
                type="text"
                name="injuries"
                value={form.injuries}
                onChange={onChange}
                placeholder="e.g., knee pain, avoid overhead pressing"
                className={`w-full px-4 py-3 rounded-xl border shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500/60 ${isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500'}`}
              />
            </div>

            <div className="md:col-span-2">
              <label className={`block text-sm font-semibold mb-1 ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>Preferences</label>
              <textarea
                rows={3}
                name="preferences"
                value={form.preferences}
                onChange={onChange}
                placeholder="e.g., push-pull-legs split, prefer HIIT over steady cardio"
                className={`w-full px-4 py-3 rounded-xl border shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500/60 ${isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500'}`}
              />
            </div>

            <div className="md:col-span-2 flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                type="submit"
                disabled={loading || Date.now() < cooldownUntil}
                className={`px-5 py-3 rounded-xl font-semibold shadow-md border ${isDark ? 'border-orange-400/40' : 'border-orange-300'} ${loading || Date.now() < cooldownUntil ? 'cursor-not-allowed' : ''} ${isDark ? 'bg-orange-600 hover:bg-orange-700 text-white' : 'bg-orange-600 hover:bg-orange-700 text-white'} focus:outline-none focus:ring-2 focus:ring-orange-500/60`}
              >
                {loading ? 'Generating plan...' : (Date.now() < cooldownUntil ? `Please wait ${cooldownLeft}s` : 'Generate Plan')}
              </motion.button>
              <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Requires RapidAPI key set in environment variables.</span>
            </div>
          </div>
        </motion.form>

        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`mt-6 p-4 rounded-xl border ${isDark ? 'bg-red-900/40 border-red-700 text-red-100' : 'bg-red-50 border-red-200 text-red-700'}`}>
            {error}
          </motion.div>
        )}

        {/* Results */}
        {result && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="mt-8">
            <div className="flex items-center justify-between mb-3">
              <h4 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Your Plan</h4>
              <div className="flex items-center gap-2">
                <button onClick={handleCopyJson} type="button" className={`${isDark ? 'bg-white/10 text-white hover:bg-white/15' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'} text-xs px-3 py-1.5 rounded-lg border ${isDark ? 'border-white/20' : 'border-gray-200'} transition`}>
                  Copy JSON
                </button>
                <button onClick={handleDownloadPdf} type="button" className={`bg-orange-600 hover:bg-orange-700 text-white text-xs px-3 py-1.5 rounded-lg shadow`}>Download PDF</button>
              </div>
            </div>
            {/* Compact summary */}
            <div className={`mb-4 rounded-xl border px-4 py-3 ${isDark ? 'bg-white/5 border-white/10 text-gray-200' : 'bg-white border-gray-200 text-gray-800'} shadow-sm`}> 
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <span className="inline-flex items-center gap-1"><strong>Goal:</strong> {String(form.goal || '').trim() || '—'}</span>
                <span className="inline-flex items-center gap-1"><strong>Days/Week:</strong> {form.daysPerWeek}</span>
                <span className="inline-flex items-center gap-1"><strong>Session:</strong> {form.durationMinutes} mins</span>
                {form.equipment && <span className="inline-flex items-center gap-1"><strong>Equipment:</strong> {form.equipment}</span>}
              </div>
            </div>
            {renderFormattedPlan(result) || (
              <div className={`p-4 rounded-xl border overflow-auto ${isDark ? 'bg-gray-950 border-gray-800' : 'bg-white border-gray-200 shadow-sm'}`}>
                <pre className={`text-sm whitespace-pre-wrap ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{pretty}</pre>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </section>
  );
}
