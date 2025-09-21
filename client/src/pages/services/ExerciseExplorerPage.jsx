import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { listBodyParts, searchExercises, getByBodyPart, mapToCard } from '../../utils/exerciseDbService';

export default function ExerciseExplorerPage() {
  const theme = (typeof window !== 'undefined' && localStorage.getItem('user_theme')) || 'light';
  const isDark = theme === 'dark';
  const apiBase = process.env.REACT_APP_API_BASE_URL || process.env.REACT_APP_API_URL || 'http://localhost:5000';

  const [q, setQ] = useState('');
  const [bodyParts, setBodyParts] = useState([]);
  const [bodyPart, setBodyPart] = useState('all');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const boot = async () => {
      try {
        const bp = await listBodyParts();
        setBodyParts(['all', ...bp]);
      } catch (e) {
        setError(e?.message || 'Failed to load body parts');
      }
    };
    boot();
  }, []);

  const onSearch = async (e) => {
    e?.preventDefault?.();
    setError('');
    setLoading(true);
    try {
      let data;
      if (q.trim()) {
        data = await searchExercises(q.trim());
      } else if (bodyPart && bodyPart !== 'all') {
        data = await getByBodyPart(bodyPart);
      } else {
        data = await getByBodyPart('chest');
      }
      setItems((data || []).map(mapToCard));
    } catch (e) {
      setError(e?.message || 'Failed to fetch exercises');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    onSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cards = useMemo(() => items, [items]);

  // Local helper component to load GIFs with multiple fallbacks
  const ImageWithFallback = ({ id, gifUrl, alt }) => {
    const sources = useMemo(() => {
      const list = [];
      if (id) {
        // 1) ImageKit mirror frequently used in ExerciseDB tutorials
        list.push(`https://ik.imagekit.io/exercisedb/${id}.gif`);
        // 2) Local proxy (Flask)
        list.push(`${apiBase}/proxy/exercise-gif/${id}.gif`);
        // 3) Direct cloudfront
        list.push(`https://d205bpvrqc9yn1.cloudfront.net/${id}.gif`);
      }
      // 4) Whatever came from API
      if (gifUrl) list.push(gifUrl);
      return list;
    }, [id, gifUrl]);

    const [idx, setIdx] = useState(0);
    const src = sources[idx];

    if (!src) {
      return <div className={`${isDark ? 'bg-gray-800' : 'bg-gray-100'} w-full h-48 grid place-items-center text-3xl`}>🏋️</div>;
    }

    return (
      <img
        src={src}
        alt={alt}
        className="w-full h-48 object-cover"
        loading="lazy"
        onError={() => setIdx((i) => (i + 1 < sources.length ? i + 1 : i))}
      />
    );
  };

  return (
    <div className={isDark ? 'bg-gray-950 min-h-screen' : 'bg-gray-50 min-h-screen'}>
      <header className={(isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200') + ' sticky top-0 z-20 border-b'}>
        <div className="max-w-7xl mx-auto px-6 py-5">
          <h1 className={(isDark ? 'text-white' : 'text-gray-900') + ' text-2xl md:text-3xl font-bold'}>Exercise Explorer</h1>
          <p className={(isDark ? 'text-gray-300' : 'text-gray-600') + ' mt-1'}>Search by name or filter by body part. Powered by ExerciseDB (RapidAPI).</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <form onSubmit={onSearch} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by exercise name (e.g., push up)"
            className={`w-full px-4 py-3 rounded-xl border ${isDark ? 'bg-gray-900 border-gray-800 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'}`}
          />
          <select
            value={bodyPart}
            onChange={(e) => setBodyPart(e.target.value)}
            className={`w-full px-4 py-3 rounded-xl border ${isDark ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
          >
            {bodyParts.map((bp) => (
              <option key={bp} value={bp}>{bp}</option>
            ))}
          </select>
          <motion.button type="submit" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className={`px-5 py-3 rounded-xl font-semibold shadow-md ${isDark ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}>
            {loading ? 'Searching…' : 'Search'}
          </motion.button>
        </form>

        {error && (
          <div className={`mb-6 p-4 rounded-xl border ${isDark ? 'bg-red-900/40 border-red-700 text-red-100' : 'bg-red-50 border-red-200 text-red-700'}`}>{error}</div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {cards.map((c, idx) => (
            <motion.div key={c.id || idx} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.25, delay: idx * 0.03 }} className={`${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} rounded-2xl border shadow-sm overflow-hidden`}>
              <ImageWithFallback id={c.id} gifUrl={c.gifUrl} alt={c.name} />
              <div className="p-4">
                <div className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{c.name}</div>
                <div className={`text-xs mt-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{c.bodyPart} • {c.target}</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {c.equipment && <span className={`text-[10px] px-2 py-0.5 rounded-full ${isDark ? 'bg-gray-800 text-gray-200' : 'bg-gray-100 text-gray-700'}`}>{c.equipment}</span>}
                </div>
                {Array.isArray(c.instructions) && c.instructions.length > 0 && (
                  <details className={`mt-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    <summary className="cursor-pointer text-xs">Instructions</summary>
                    <ul className="text-xs list-disc ml-4 mt-1 space-y-1">
                      {c.instructions.slice(0, 6).map((t, i) => <li key={i}>{t}</li>)}
                    </ul>
                  </details>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
}
