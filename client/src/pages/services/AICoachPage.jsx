import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPaperPlane, FaPaperclip } from 'react-icons/fa';
import aiService from '../../utils/aiService';
import SessionManager from '../../utils/sessionManager';

function AICoachPage() {
  const [messages, setMessages] = useState([
    { id: 'm1', role: 'assistant', content: 'Hey! I’m your FitHub coach. Ask me anything about workouts, yoga, diet, recovery, sleep, or gear.' , ts: Date.now() }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  // quick suggestion chips
  const suggestions = [
    'Beginner yoga routine',
    'Full-body workout plan',
    'High-protein vegetarian meals',
    'Lower back pain stretches',
    'Weight loss weekly schedule',
  ];

  // fitness-only guard
  const isFitnessTopic = (text) => {
    const t = (text || '').toLowerCase();
    const allow = [
      'workout','training','exercise','gym','yoga','pose','asana','diet','meal','protein','calorie','nutrition','sleep','recovery','stretch','mobility','injury','pain','cardio','strength','hypertrophy','supplement','water','hydration','wellness','health','steps','running','walk','cycle','squat','deadlift','pushup','plank'
    ];
    return allow.some(k => t.includes(k));
  };

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function handleSend(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    const userMsg = { id: 'u'+Date.now(), role: 'user', content: text, ts: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    try {
      let reply;
      if (!isFitnessTopic(text)) {
        reply = "I can help only with fitness and health topics like workouts, yoga, diet, recovery, sleep, injuries, and equipment.";
      } else {
        // call backend if available
        const res = await aiService.chat(text, { topic: 'yoga_fitness' });
        reply = res?.reply || 'Here are some fitness pointers to get started.';
      }
      const botMsg = { id: 'a'+Date.now(), role: 'assistant', content: reply, ts: Date.now() };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      setMessages((prev) => [...prev, { id: 'e'+Date.now(), role: 'assistant', content: 'Sorry, I could not process that right now.', ts: Date.now() }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900">
      <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col min-h-screen">
        {/* Hero + Suggestions */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900/60 to-black/60 border border-white/10 shadow-2xl mb-6">
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-emerald-500/20 blur-3xl rounded-full" />
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-cyan-400/20 blur-3xl rounded-full" />
          <div className="relative p-6 sm:p-8 flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="flex-1 text-left">
              <div className="text-3xl font-extrabold tracking-tight text-white mb-2">Hi {SessionManager.getCurrentUser()?.firstName || 'Athlete'}!</div>
              <div className="text-gray-300">What do you want to chat about today?</div>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                {suggestions.map((s) => (
                  <button key={s} onClick={() => setInput(s)} className="text-left px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-200">
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="w-full md:w-64">
              <div className="p-4 rounded-2xl bg-black/40 border border-white/10 text-gray-300">
                Fitness-only mode is enabled. I’ll refuse non-fitness topics.
              </div>
            </div>
          </div>
        </div>

        {/* Chat Panel */}
        <div className="rounded-2xl bg-black/60 border border-white/10 shadow-2xl flex flex-col flex-1">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.role==='user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`${m.role==='user' ? 'bg-emerald-500/20 text-emerald-200 border-emerald-500/30' : 'bg-white/5 text-gray-200 border-white/10'} max-w-[80%] rounded-2xl px-4 py-3 border shadow-md`}> 
                  <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>
                  <div className="mt-1 text-[10px] opacity-60">{new Date(m.ts).toLocaleTimeString()}</div>
              </div>
            </div>
          ))}
          {loading && (
              <div className="flex items-center gap-2 text-gray-300">
                <span className="inline-flex w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                Bot is typing...
            </div>
          )}
          <div ref={endRef} />
        </div>
          {/* Composer */}
          <form onSubmit={handleSend} className="border-t border-white/10 p-3">
            <div className="flex items-end gap-2">
              <button type="button" className="p-3 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10" title="Attach"><FaPaperclip /></button>
              <div className="flex-1">
                <textarea value={input} onChange={e=>setInput(e.target.value)} rows={1} placeholder="What is on your mind?" className="w-full resize-none px-4 py-3 rounded-xl bg-gray-800/80 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <button type="submit" disabled={!input.trim() || loading} className="p-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"><FaPaperPlane /></button>
            </div>
        </form>
        </div>

        <p className="mt-3 text-xs text-gray-400">General guidance only. For medical concerns, consult a professional.</p>
      </div>
    </div>
  );
}

export default AICoachPage;











