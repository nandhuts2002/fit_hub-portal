import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  predictCaloriesByName,
  predictCaloriesByFeatures,
  searchFoods,
  calculateMealTotalCalories,
  FOOD_CATEGORIES,
} from '../../utils/calorieMLService';

/* ─── styles (all inline to avoid Tailwind arbitrary-value issues) ───────── */
const S = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
    color: '#fff',
    fontFamily: 'Inter, system-ui, sans-serif',
  },
  header: {
    position: 'sticky', top: 0, zIndex: 30,
    background: 'rgba(255,255,255,0.05)',
    backdropFilter: 'blur(12px)',
    borderBottom: '1px solid rgba(255,255,255,0.10)',
  },
  headerInner: {
    maxWidth: 900, margin: '0 auto', padding: '16px 24px',
    display: 'flex', alignItems: 'center', gap: 16,
  },
  backBtn: {
    background: 'none', border: 'none', color: 'rgba(255,255,255,0.55)',
    cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', gap: 6,
  },
  aiBadge: {
    marginLeft: 'auto', fontSize: 10, fontWeight: 700,
    letterSpacing: '0.1em', textTransform: 'uppercase',
    background: 'linear-gradient(90deg, #34d399, #14b8a6)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
  },
  main: { maxWidth: 900, margin: '0 auto', padding: '32px 24px' },
  card: {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 20, padding: 24,
    backdropFilter: 'blur(10px)',
    marginBottom: 20,
  },
  input: {
    width: '100%', padding: '12px 18px', boxSizing: 'border-box',
    background: 'rgba(255,255,255,0.10)',
    border: '1px solid rgba(255,255,255,0.20)',
    borderRadius: 12, color: '#fff', fontSize: 15, outline: 'none',
  },
  btnGreen: {
    width: '100%', padding: '13px 0',
    background: 'linear-gradient(90deg, #10b981, #14b8a6)',
    border: 'none', borderRadius: 12, color: '#fff',
    fontWeight: 700, fontSize: 15, cursor: 'pointer',
    boxShadow: '0 8px 24px rgba(16,185,129,0.30)',
    transition: 'opacity .15s',
  },
  btnPurple: {
    width: '100%', padding: '13px 0',
    background: 'linear-gradient(90deg, #8b5cf6, #7c3aed)',
    border: 'none', borderRadius: 12, color: '#fff',
    fontWeight: 700, fontSize: 15, cursor: 'pointer',
    boxShadow: '0 8px 24px rgba(139,92,246,0.30)',
  },
  btnOrange: {
    width: '100%', padding: '13px 0',
    background: 'linear-gradient(90deg, #f97316, #ec4899)',
    border: 'none', borderRadius: 12, color: '#fff',
    fontWeight: 700, fontSize: 15, cursor: 'pointer',
    boxShadow: '0 8px 24px rgba(249,115,22,0.30)',
  },
  error: {
    background: 'rgba(239,68,68,0.12)',
    border: '1px solid rgba(239,68,68,0.30)',
    color: '#fca5a5', fontSize: 13, padding: '12px 16px', borderRadius: 12,
  },
  resultCard: (from, to, borderColor) => ({
    background: `linear-gradient(135deg, ${from}, ${to})`,
    border: `1px solid ${borderColor}`,
    borderRadius: 20, padding: 24, marginBottom: 16,
    backdropFilter: 'blur(10px)',
  }),
  chip: (bg, color) => ({
    display: 'inline-flex', alignItems: 'center',
    padding: '3px 10px', borderRadius: 999,
    background: bg, color: color,
    fontSize: 11, fontWeight: 700, marginRight: 6, marginBottom: 6,
  }),
};

const MACRO_META = {
  protein:       { label: 'Protein',  bar: '#3b82f6', chip: ['rgba(59,130,246,0.2)', '#93c5fd'] },
  fat:           { label: 'Fat',      bar: '#f59e0b', chip: ['rgba(245,158,11,0.2)', '#fcd34d'] },
  carbohydrates: { label: 'Carbs',    bar: '#10b981', chip: ['rgba(16,185,129,0.2)', '#6ee7b7'] },
  fiber:         { label: 'Fiber',    bar: '#8b5cf6', chip: ['rgba(139,92,246,0.2)', '#c4b5fd'] },
  sugar:         { label: 'Sugar',    bar: '#ec4899', chip: ['rgba(236,72,153,0.2)', '#f9a8d4'] },
};

/* ─── sub-components ──────────────────────────────────────────────────────── */
function MacroBar({ keyName, value }) {
  const m = MACRO_META[keyName];
  if (!m || value == null) return null;
  const pct = Math.min(100, (value / 100) * 100);
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'rgba(255,255,255,0.55)', marginBottom: 4 }}>
        <span>{m.label}</span>
        <span style={{ color: '#fff', fontWeight: 600 }}>{value}g</span>
      </div>
      <div style={{ height: 7, background: 'rgba(255,255,255,0.10)', borderRadius: 99, overflow: 'hidden' }}>
        <motion.div
          initial={{ width: 0 }} animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          style={{ height: '100%', background: m.bar, borderRadius: 99 }}
        />
      </div>
    </div>
  );
}

function Chip({ keyName, value }) {
  const m = MACRO_META[keyName];
  if (!m || value == null) return null;
  return <span style={S.chip(...m.chip)}>{m.label}: {value}g</span>;
}

/* ─── main ────────────────────────────────────────────────────────────────── */
export default function NutritionTrackerPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('lookup');

  /* lookup */
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [lookupResult, setLookupResult] = useState(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState('');
  const debounce = useRef(null);

  const onQueryChange = useCallback(async (val) => {
    setQuery(val); setLookupError('');
    clearTimeout(debounce.current);
    if (val.length < 2) { setSuggestions([]); return; }
    debounce.current = setTimeout(async () => {
      try { setSuggestions((await searchFoods(val)).slice(0, 6)); } catch { setSuggestions([]); }
    }, 300);
  }, []);

  const doLookup = useCallback(async (name) => {
    const term = (name || query).trim();
    if (!term) return;
    setQuery(term); setSuggestions([]);
    setLookupLoading(true); setLookupError(''); setLookupResult(null);
    try { setLookupResult(await predictCaloriesByName(term)); }
    catch (e) { setLookupError(e.message); }
    finally { setLookupLoading(false); }
  }, [query]);

  /* macros */
  const [macros, setMacros] = useState({ protein:'', fat:'', carbs:'', fiber:'', sugar:'' });
  const [macroResult, setMacroResult] = useState(null);
  const [macroLoading, setMacroLoading] = useState(false);
  const [macroError, setMacroError] = useState('');

  const doMacro = useCallback(async () => {
    if (!macros.protein || !macros.fat || !macros.carbs) { setMacroError('Protein, Fat and Carbs are required.'); return; }
    setMacroLoading(true); setMacroError(''); setMacroResult(null);
    try {
      setMacroResult(await predictCaloriesByFeatures({
        protein: +macros.protein, fat: +macros.fat, carbs: +macros.carbs,
        fiber: +(macros.fiber || 0), sugar: +(macros.sugar || 0),
      }));
    } catch (e) { setMacroError(e.message); }
    finally { setMacroLoading(false); }
  }, [macros]);

  /* meal */
  const [mealItems, setMealItems] = useState(['']);
  const [mealResult, setMealResult] = useState(null);
  const [mealLoading, setMealLoading] = useState(false);
  const [mealError, setMealError] = useState('');

  const doMeal = useCallback(async () => {
    const foods = mealItems.map(f => f.trim()).filter(Boolean);
    if (!foods.length) { setMealError('Add at least one food item.'); return; }
    setMealLoading(true); setMealError(''); setMealResult(null);
    try { setMealResult(await calculateMealTotalCalories(foods)); }
    catch (e) { setMealError(e.message); }
    finally { setMealLoading(false); }
  }, [mealItems]);

  /* tab config */
  const TABS = [
    { key:'lookup', icon:'🔍', label:'Food Lookup' },
    { key:'macros', icon:'⚗️',  label:'Macro Calc' },
    { key:'meal',   icon:'🍽️', label:'Meal Builder' },
  ];

  return (
    <div style={S.page}>
      {/* ── Header ── */}
      <header style={S.header}>
        <div style={S.headerInner}>
          <button style={S.backBtn} onClick={() => navigate('/services')}>← Back</button>
          <span style={{ fontSize: 26 }}>🥗</span>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 900, letterSpacing: '-0.5px' }}>Nutrition Tracker</h1>
            <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.40)' }}>ML-powered · 247 foods · Instant results</p>
          </div>
          <span style={S.aiBadge}>AI Model ✨</span>
        </div>
      </header>

      <main style={S.main}>
        {/* ── Tab switcher ── */}
        <div style={{ display:'flex', gap: 8, padding: 6, background:'rgba(255,255,255,0.05)', borderRadius: 18, border:'1px solid rgba(255,255,255,0.10)', marginBottom: 24 }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              flex: 1, display:'flex', alignItems:'center', justifyContent:'center', gap: 6,
              padding: '10px 8px', borderRadius: 12, border:'none', cursor:'pointer', fontSize: 13, fontWeight: 700,
              transition: 'all .2s',
              background: tab === t.key ? 'linear-gradient(90deg,#10b981,#14b8a6)' : 'transparent',
              color: tab === t.key ? '#fff' : 'rgba(255,255,255,0.45)',
              boxShadow: tab === t.key ? '0 4px 16px rgba(16,185,129,0.35)' : 'none',
            }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* ══ LOOKUP ══ */}
          {tab === 'lookup' && (
            <motion.div key="lookup" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-16}}>
              <div style={S.card}>
                <h2 style={{ margin:'0 0 6px', fontSize:17, fontWeight:800 }}>🔍 Search Any Food</h2>
                <p style={{ margin:'0 0 18px', fontSize:13, color:'rgba(255,255,255,0.45)' }}>Type a name and get instant calorie + nutrition data from our ML model.</p>

                <div style={{ position:'relative', marginBottom:12 }}>
                  <input
                    style={S.input} value={query} placeholder="e.g. biryani, chicken breast, almonds…"
                    onChange={e => onQueryChange(e.target.value)}
                    onKeyDown={e => e.key==='Enter' && doLookup()}
                  />
                  <AnimatePresence>
                    {suggestions.length > 0 && (
                      <motion.ul initial={{opacity:0,y:4}} animate={{opacity:1,y:0}} exit={{opacity:0}}
                        style={{ position:'absolute', left:0, right:0, marginTop:4,
                          background:'#1e1b3a', border:'1px solid rgba(255,255,255,0.12)',
                          borderRadius:14, overflow:'hidden', boxShadow:'0 20px 40px rgba(0,0,0,0.5)',
                          zIndex:20, padding:0, listStyle:'none' }}>
                        {suggestions.map(s => (
                          <li key={s.foodName} onClick={() => doLookup(s.foodName)}
                            style={{ display:'flex', justifyContent:'space-between', padding:'10px 16px',
                              cursor:'pointer', fontSize:13, borderBottom:'1px solid rgba(255,255,255,0.06)' }}
                            onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.08)'}
                            onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                            <span style={{ textTransform:'capitalize' }}>{s.foodName}</span>
                            <span style={{ color:'#34d399', fontWeight:700 }}>{s.calories} kcal</span>
                          </li>
                        ))}
                      </motion.ul>
                    )}
                  </AnimatePresence>
                </div>

                <button style={{ ...S.btnGreen, opacity: lookupLoading || !query.trim() ? 0.5 : 1 }}
                  disabled={lookupLoading || !query.trim()} onClick={() => doLookup()}>
                  {lookupLoading ? 'Searching…' : 'Get Nutrition Info'}
                </button>

                {lookupError && <div style={{ ...S.error, marginTop:12 }}>⚠️ {lookupError}</div>}
              </div>

              <AnimatePresence>
                {lookupResult && (
                  <motion.div key="lr" initial={{opacity:0,scale:.97}} animate={{opacity:1,scale:1}}
                    style={S.resultCard('rgba(16,185,129,0.15)', 'rgba(20,184,166,0.10)', 'rgba(52,211,153,0.35)')}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:12, marginBottom:18 }}>
                      <div>
                        <h3 style={{ margin:'0 0 4px', fontSize:20, fontWeight:900, textTransform:'capitalize' }}>{lookupResult.foodName}</h3>
                        <span style={{ fontSize:11, color:'rgba(255,255,255,0.35)', background:'rgba(255,255,255,0.06)', padding:'2px 10px', borderRadius:99 }}>{lookupResult.category}</span>
                      </div>
                      <span style={{ fontSize:28, fontWeight:900, color:'#34d399' }}>🔥 {Math.round(lookupResult.calories)} <span style={{ fontSize:14, color:'rgba(255,255,255,0.40)' }}>kcal</span></span>
                    </div>

                    {['protein','fat','carbohydrates','fiber','sugar'].map(k => (
                      <MacroBar key={k} keyName={k} value={lookupResult[k]} />
                    ))}

                    <div style={{ marginTop:12 }}>
                      {['protein','fat','carbohydrates','fiber','sugar'].map(k => (
                        <Chip key={k} keyName={k} value={lookupResult[k]} />
                      ))}
                    </div>
                    <p style={{ margin:'12px 0 0', fontSize:11, color:'rgba(255,255,255,0.25)' }}>
                      Source: {lookupResult.source === 'lookup' ? 'ML database (exact)' : lookupResult.source === 'fuzzy_lookup' ? 'ML database (fuzzy)' : lookupResult.source} · per 100g
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* ══ MACROS ══ */}
          {tab === 'macros' && (
            <motion.div key="macros" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-16}}>
              <div style={S.card}>
                <h2 style={{ margin:'0 0 6px', fontSize:17, fontWeight:800 }}>⚗️ Predict from Macros</h2>
                <p style={{ margin:'0 0 20px', fontSize:13, color:'rgba(255,255,255,0.45)' }}>Enter macros (grams/100g) and the Random Forest model predicts calories.</p>

                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:14, marginBottom:18 }}>
                  {[
                    { key:'protein', label:'Protein (g) *', color:'#3b82f6' },
                    { key:'fat',     label:'Fat (g) *',     color:'#f59e0b' },
                    { key:'carbs',   label:'Carbs (g) *',   color:'#10b981' },
                    { key:'fiber',   label:'Fiber (g)',      color:'#8b5cf6' },
                    { key:'sugar',   label:'Sugar (g)',      color:'#ec4899' },
                  ].map(f => (
                    <div key={f.key}>
                      <label style={{ display:'block', fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.45)', marginBottom:6 }}>{f.label}</label>
                      <input type="number" min="0" max="600" step="0.1" placeholder="0"
                        value={macros[f.key]}
                        onChange={e => setMacros(p => ({...p, [f.key]:e.target.value}))}
                        style={{ ...S.input, border:`1px solid ${f.color}60` }}
                      />
                    </div>
                  ))}
                </div>

                <button style={{ ...S.btnPurple, opacity: macroLoading ? 0.5 : 1 }}
                  disabled={macroLoading} onClick={doMacro}>
                  {macroLoading ? 'Calculating…' : '🌲 Predict Calories'}
                </button>
                {macroError && <div style={{ ...S.error, marginTop:12 }}>⚠️ {macroError}</div>}
              </div>

              <AnimatePresence>
                {macroResult && (
                  <motion.div key="mr" initial={{opacity:0,scale:.97}} animate={{opacity:1,scale:1}}
                    style={{ ...S.resultCard('rgba(139,92,246,0.15)', 'rgba(124,58,237,0.10)', 'rgba(167,139,250,0.35)'), textAlign:'center' }}>
                    <p style={{ margin:'0 0 6px', fontSize:13, color:'rgba(255,255,255,0.45)' }}>Predicted Calories</p>
                    <p style={{ margin:'0 0 8px', fontSize:52, fontWeight:900 }}>
                      🔥 {Math.round(macroResult.predictedCalories)}
                      <span style={{ fontSize:16, fontWeight:600, color:'rgba(255,255,255,0.35)', marginLeft:6 }}>kcal</span>
                    </p>
                    <p style={{ margin:'0 0 14px', fontSize:11, color:'rgba(255,255,255,0.30)' }}>
                      {macroResult.modelUsed === 'random_forest' ? '🌲 Random Forest ML Model' : '📐 Atwater formula (fallback)'}
                    </p>
                    <div>
                      {Object.entries(macroResult.featuresUsed || {}).map(([k,v]) => v ? <Chip key={k} keyName={k} value={v} /> : null)}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* ══ MEAL ══ */}
          {tab === 'meal' && (
            <motion.div key="meal" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-16}}>
              <div style={S.card}>
                <h2 style={{ margin:'0 0 6px', fontSize:17, fontWeight:800 }}>🍽️ Build Your Meal</h2>
                <p style={{ margin:'0 0 18px', fontSize:13, color:'rgba(255,255,255,0.45)' }}>Add all foods in your meal and get the total calorie count instantly.</p>

                <div style={{ marginBottom:14 }}>
                  {mealItems.map((item, i) => (
                    <div key={i} style={{ display:'flex', gap:8, marginBottom:8 }}>
                      <input style={{ ...S.input, flex:1 }} value={item} placeholder={`Food item ${i+1}…`}
                        onChange={e => setMealItems(p => p.map((x,idx) => idx===i ? e.target.value : x))} />
                      {mealItems.length > 1 && (
                        <button onClick={() => setMealItems(p => p.filter((_,idx) => idx!==i))}
                          style={{ padding:'0 14px', background:'rgba(239,68,68,0.15)', border:'1px solid rgba(239,68,68,0.3)',
                            borderRadius:10, color:'#f87171', cursor:'pointer', fontSize:18, fontWeight:700 }}>×</button>
                      )}
                    </div>
                  ))}
                </div>

                <button onClick={() => setMealItems(p => [...p, ''])}
                  style={{ background:'none', border:'none', color:'#34d399', cursor:'pointer', fontSize:13, fontWeight:700,
                    display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
                  <span style={{ width:24, height:24, borderRadius:'50%', background:'rgba(52,211,153,0.15)',
                    display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>+</span>
                  Add another item
                </button>

                <button style={{ ...S.btnOrange, opacity: mealLoading ? 0.5 : 1 }}
                  disabled={mealLoading} onClick={doMeal}>
                  {mealLoading ? 'Calculating…' : '🍽️ Calculate Meal Calories'}
                </button>
                {mealError && <div style={{ ...S.error, marginTop:12 }}>⚠️ {mealError}</div>}
              </div>

              <AnimatePresence>
                {mealResult && (
                  <motion.div key="meal-res" initial={{opacity:0,scale:.97}} animate={{opacity:1,scale:1}}>
                    <div style={{ ...S.resultCard('rgba(249,115,22,0.15)','rgba(236,72,153,0.10)','rgba(251,146,60,0.35)'), textAlign:'center', marginBottom:14 }}>
                      <p style={{ margin:'0 0 6px', fontSize:13, color:'rgba(255,255,255,0.45)' }}>Total Meal Calories</p>
                      <p style={{ margin:0, fontSize:52, fontWeight:900 }}>
                        🔥 {mealResult.total}
                        <span style={{ fontSize:16, fontWeight:600, color:'rgba(255,255,255,0.35)', marginLeft:6 }}>kcal</span>
                      </p>
                    </div>

                    <div style={S.card}>
                      <p style={{ margin:'0 0 14px', fontSize:11, fontWeight:800, color:'rgba(255,255,255,0.30)', textTransform:'uppercase', letterSpacing:'0.1em' }}>Breakdown</p>
                      {mealResult.breakdown.map((item,i) => (
                        <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
                          padding:'12px 16px', borderRadius:12, marginBottom:8,
                          background: item.calories==null ? 'rgba(239,68,68,0.10)' : 'rgba(255,255,255,0.05)',
                          border: item.calories==null ? '1px solid rgba(239,68,68,0.25)' : '1px solid rgba(255,255,255,0.07)' }}>
                          <span style={{ textTransform:'capitalize', fontWeight:600, fontSize:14 }}>
                            {item.calories==null ? '⚠️' : '🍴'} {item.foodName}
                          </span>
                          {item.calories != null
                            ? <span style={{ color:'#fb923c', fontWeight:700, fontSize:13, background:'rgba(251,146,60,0.12)', padding:'3px 10px', borderRadius:99 }}>
                                🔥 {Math.round(item.calories)} kcal
                              </span>
                            : <span style={{ color:'#f87171', fontSize:12 }}>{item.error || 'Not found'}</span>
                          }
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Category pills ── */}
        <div style={S.card}>
          <p style={{ margin:'0 0 12px', fontSize:11, fontWeight:800, color:'rgba(255,255,255,0.25)', textTransform:'uppercase', letterSpacing:'0.1em' }}>
            Available Food Categories
          </p>
          <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
            {FOOD_CATEGORIES.map(cat => (
              <span key={cat} onClick={() => { setTab('lookup'); onQueryChange(cat.toLowerCase()); }}
                style={{ fontSize:12, padding:'5px 14px', borderRadius:999, cursor:'pointer',
                  background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.10)',
                  color:'rgba(255,255,255,0.55)', transition:'all .15s' }}
                onMouseEnter={e => { e.currentTarget.style.background='rgba(52,211,153,0.15)'; e.currentTarget.style.color='#fff'; e.currentTarget.style.borderColor='rgba(52,211,153,0.4)'; }}
                onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.06)'; e.currentTarget.style.color='rgba(255,255,255,0.55)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.10)'; }}>
                {cat}
              </span>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
