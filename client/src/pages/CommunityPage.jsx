import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import SessionManager from '../utils/sessionManager';
import { listPosts, createPost, likePost, unlikePost, listComments, addComment, uploadImage, deletePost, getCommunitySocket, sendTyping, listTrending, listByHashtag, listCollections, createCollection, addPostToCollection, listStories, createStory, reportPost } from '../utils/communityService';

function useThemeToggle() {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') root.classList.add('dark'); else root.classList.remove('dark');
    localStorage.setItem('theme', theme);
  }, [theme]);
  return { theme, setTheme };
}

function useAvatarUploader() {
  const [busy, setBusy] = useState(false);
  const inputRef = useRef(null);
  const pick = () => inputRef.current?.click();
  const onChange = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      setBusy(true);
      const url = await uploadImage(f);
      SessionManager.setAvatar(url);
    } catch (e) {
      alert(e?.message || 'Failed to update profile photo');
    } finally {
      setBusy(false);
      try { e.target.value = ''; } catch {}
    }
  };
  const Input = () => (
    <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onChange} />
  );
  return { pick, busy, Input };
}

function Avatar({ name = 'U', url = '', size = 10 }) {
  const [errored, setErrored] = useState(false);
  const letter = (name || 'U')[0]?.toUpperCase() || 'U';
  const wh = `w-${size} h-${size}`;
  const toAbsoluteUrl = (u) => {
    if (!u) return '';
    if (/^https?:\/\//i.test(u)) return u;
    const base = process.env.REACT_APP_API_BASE_URL || process.env.REACT_APP_API_URL || '';
    return base ? `${base}${u}` : u;
  };
  const src = toAbsoluteUrl(url);
  if (src && !errored) return <img src={src} alt={name} onError={() => setErrored(true)} className={`${wh} rounded-full object-cover`}/>;
  return (
    <div className={`${wh} rounded-full bg-gradient-to-br from-orange-500 to-amber-500 text-white grid place-items-center font-semibold`}>
      {letter}
    </div>
  );
}

function StoriesBar({ onOpenViewer }) {
  const user = SessionManager.getCurrentUser() || {};
  const [stories, setStories] = useState([]);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);

  const reload = async () => {
    try {
      const data = await listStories();
      // Ensure own story (if any) at the front
      const mine = data.filter(s => String(s.user?.email||'').toLowerCase() === String(user?.email||'').toLowerCase());
      const others = data.filter(s => String(s.user?.email||'').toLowerCase() !== String(user?.email||'').toLowerCase());
      setStories([ ...mine, ...others ]);
    } catch {}
  };

  useEffect(() => { reload(); }, []);

  const onPick = () => inputRef.current?.click();
  const onChange = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      setUploading(true);
      await createStory({ file: f, user: { name: user?.name || user?.email || 'Member', email: user?.email || '', avatar: user?.avatar || '' } });
      await reload();
    } catch (err) {
      alert(err?.message || 'Failed to upload story');
    } finally {
      setUploading(false);
      try { e.target.value = ''; } catch {}
    }
  };

  // Group stories by user for Instagram-like behavior
  const groups = React.useMemo(() => {
    const map = new Map();
    stories.forEach(s => {
      const key = String(s.user?.email || s.user?.name || '');
      if (!map.has(key)) map.set(key, { user: s.user || {}, items: [] });
      map.get(key).items.push(s);
    });
    // sort items by created_at ascending
    const arr = Array.from(map.values()).map(g => ({
      user: g.user,
      items: (g.items || []).sort((a,b)=> (a.created_at||0) - (b.created_at||0))
    }));
    return arr;
  }, [stories]);

  const getViewedSet = () => {
    try { return new Set(JSON.parse(localStorage.getItem('fithub:stories:viewed')||'[]')); } catch { return new Set(); }
  };
  const isGroupFullyViewed = (g) => {
    const viewed = getViewedSet();
    return (g.items||[]).every(it => viewed.has(it.id));
  };

  const circle = (g, idx) => (
    <button key={idx} onClick={()=> onOpenViewer?.(groups, idx, 0)} className="flex flex-col items-center w-16 select-none cursor-pointer flex-none">
      <div className={`p-[2px] rounded-full ${isGroupFullyViewed(g) ? 'bg-gray-300' : 'bg-gradient-to-tr from-pink-500 via-purple-500 to-yellow-400'}`}>
        <div className="w-14 h-14 rounded-full bg-white overflow-hidden">
          {g.user?.avatar ? (
            <img src={g.user.avatar} alt={g.user?.name || 'Story'} className="w-full h-full object-cover rounded-full" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 grid place-items-center text-gray-600 font-semibold text-lg rounded-full">
              {(g.user?.name || g.user?.email || 'U')?.[0]?.toUpperCase()}
            </div>
          )}
        </div>
      </div>
      <div className="text-[10px] text-gray-700 mt-1 truncate w-14 text-center font-medium">{g.user?.name || g.user?.email?.split('@')[0] || 'User'}</div>
    </button>
  );

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-3 overflow-x-auto no-scrollbar mb-4">
      <div className="flex items-center gap-4 min-w-max">
        {/* Your story uploader */}
        <button onClick={onPick} className="flex flex-col items-center w-16 flex-none">
          <div className="p-[2px] rounded-full bg-gray-300">
            <div className="w-14 h-14 rounded-full bg-gray-100 grid place-items-center text-gray-600">{uploading ? '…' : '+'}</div>
          </div>
          <div className="text-[10px] text-gray-700 mt-1 truncate w-14 text-center font-medium">Add</div>
        </button>
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onChange} />

        {/* Stories list (grouped by user) */}
        {groups.map((g, idx) => circle(g, idx))}

      </div>
    </div>
  );
}

// Full-screen Instagram-like story viewer
function StoryViewer({ groups, groupIndex, itemIndex, onClose, onViewed }) {
  const [gIdx, setGIdx] = useState(groupIndex || 0);
  const [iIdx, setIIdx] = useState(itemIndex || 0);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef(null);

  const viewedKey = 'fithub:stories:viewed';
  const markViewed = (id) => {
    try {
      const list = JSON.parse(localStorage.getItem(viewedKey) || '[]');
      if (!list.includes(id)) { list.push(id); localStorage.setItem(viewedKey, JSON.stringify(list)); }
    } catch {}
    onViewed?.();
  };

  const current = (groups[gIdx] || { items: [], user: {} }).items[iIdx];

  useEffect(() => {
    if (!current) return;
    markViewed(current.id);
    setProgress(0);
    clearInterval(timerRef.current);
    const start = Date.now();
    timerRef.current = setInterval(() => {
      const p = Math.min(1, (Date.now() - start) / 5000); // 5s per story
      setProgress(p);
      if (p >= 1) next();
    }, 50);
    return () => clearInterval(timerRef.current);
  }, [gIdx, iIdx]);

  const next = () => {
    const items = (groups[gIdx] || { items: [] }).items;
    if (iIdx + 1 < items.length) setIIdx(iIdx + 1);
    else if (gIdx + 1 < groups.length) { setGIdx(gIdx + 1); setIIdx(0); }
    else onClose?.();
  };
  const prev = () => {
    if (iIdx - 1 >= 0) setIIdx(iIdx - 1);
    else if (gIdx - 1 >= 0) { const prevItems = groups[gIdx - 1].items || []; setGIdx(gIdx - 1); setIIdx(Math.max(0, prevItems.length - 1)); }
    else onClose?.();
  };

  if (!current) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90" onClick={onClose}>
      <div className="absolute inset-0 grid place-items-center">
        <div className="w-full max-w-md mx-auto relative" style={{ height: '85vh' }} onClick={(e)=>e.stopPropagation()}>
          {/* Header */}
          <div className="absolute top-2 left-2 right-2 z-10">
            <div className="flex gap-1">
              {(groups[gIdx]?.items || []).map((_, idx) => (
                <div key={idx} className="h-1 flex-1 bg-white/30 rounded overflow-hidden">
                  <div className={`h-full bg-white transition-all`} style={{ width: idx < iIdx ? '100%' : idx === iIdx ? `${Math.round(progress*100)}%` : '0%' }} />
                </div>
              ))}
            </div>
            <div className="mt-2 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <div className="rounded-full overflow-hidden" style={{ width: 28, height: 28, background: 'rgba(255,255,255,0.2)' }}>
                  {groups[gIdx]?.user?.avatar ? (
                    <img src={groups[gIdx].user.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : null}
                </div>
                <div className="text-sm font-semibold truncate max-w-[60vw]">{groups[gIdx]?.user?.name || groups[gIdx]?.user?.email || 'User'}</div>
              </div>
              <button onClick={onClose} className="px-2 py-1 rounded bg-white/20">✕</button>
            </div>
          </div>
          {/* Media */}
          <div className="relative w-full h-full">
            <img src={current.mediaUrl} alt="story" className="w-full h-full object-contain" />
            {/* Tappable areas */}
            <button onClick={prev} className="absolute inset-y-0 left-0 w-1/3"/>
            <button onClick={next} className="absolute inset-y-0 right-0 w-1/3"/>
          </div>
        </div>
      </div>
    </div>
  );
}

function timeAgo(ms) {
  if (!ms) return '';
  const diff = Date.now() - ms;
  const s = Math.floor(diff/1000); if (s < 60) return `${s}s ago`;
  const m = Math.floor(s/60); if (m < 60) return `${m}m ago`;
  const h = Math.floor(m/60); if (h < 24) return `${h}h ago`;
  const d = Math.floor(h/24); return `${d}d ago`;
}

function PostComposer({ onPosted }) {
  const [text, setText] = useState('');
  const [image, setImage] = useState('');
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);
  const user = SessionManager.getCurrentUser() || {};
  const avatar = user?.avatar;
  const { pick: pickAvatar, busy: avatarBusy, Input: AvatarInput } = useAvatarUploader();

  const doUpload = async (file) => {
    try {
      setUploading(true);
      const url = await uploadImage(file);
      setImage(url);
    } catch (e) {
      alert(e?.message || 'Image upload failed');
    } finally {
      setUploading(false);
    }
  };

  const onFileChange = (e) => {
    const f = e.target.files?.[0];
    if (f) doUpload(f);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!text.trim() && !image) return;
    try {
      const payload = {
        text: text.trim(),
        imageUrl: image,
        user: { name: user?.name || user?.firstName || user?.email || 'Member', email: user?.email || '', avatar: user?.avatar || '' }
      };
      const created = await createPost(payload);
      setText('');
      setImage('');
      onPosted?.(created);
    } catch (e) {
      alert(e?.message || 'Failed to post');
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 shadow-sm mb-4">
      <form onSubmit={submit}>
        <div className="flex items-start gap-3">
          <div className="relative group">
            <button type="button" onClick={pickAvatar} className="block">
              <Avatar name={user?.name || user?.email} url={avatar} size={8}/>
            </button>
            <div className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/30 transition-colors grid place-items-center text-[10px] text-white font-semibold">
              {avatarBusy ? 'Saving…' : 'Edit'}
            </div>
            <AvatarInput />
          </div>
          <div className="flex-1">
            <textarea
              value={text}
              onChange={(e)=>setText(e.target.value)}
              placeholder="What's on your mind?"
              rows={3}
              className="w-full resize-none border-none outline-none focus:ring-0 bg-transparent placeholder-gray-500 text-sm"
            />
            {image && (
              <div className="mt-3 relative">
                <div style={{ aspectRatio: '1 / 1' }} className="w-full max-w-xs bg-gray-50 rounded-lg overflow-hidden">
                  <img src={image} alt="preview" className="w-full h-full object-cover"/>
                </div>
                <button 
                  type="button" 
                  onClick={()=>setImage('')} 
                  className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full hover:bg-black/80"
                >
                  ✕
                </button>
              </div>
            )}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-center gap-3">
                <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
                <button 
                  type="button" 
                  onClick={()=>inputRef.current?.click()} 
                  className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {uploading ? 'Uploading…' : 'Photo'}
                </button>
                <button 
                  type="button" 
                  className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m0 0V1a1 1 0 011 1v18a1 1 0 01-1 1H6a1 1 0 01-1-1V2a1 1 0 011-1h8a1 1 0 011 1v3z" />
                  </svg>
                  Feeling
                </button>
              </div>
              <motion.button 
                whileHover={{scale:1.02}} 
                whileTap={{scale:0.98}} 
                type="submit" 
                disabled={!text.trim() && !image}
                className={`px-6 py-2 rounded-lg font-semibold text-sm ${
                  text.trim() || image 
                    ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                Share
              </motion.button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

function PostCard({ post, meEmail, onLikeToggle, onCommentAdded, onDeleted, onTyping, onHashtagClick, onSaveRequested }) {
  const navigate = useNavigate();
  const [comment, setComment] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isSomeoneTyping, setIsSomeoneTyping] = useState(false);
  const liked = useMemo(() => (post.likes || []).map(e=>String(e).toLowerCase()).includes(String(meEmail||'').toLowerCase()), [post.likes, meEmail]);
  const likeCount = (post.likes || []).length;
  const user = SessionManager.getCurrentUser() || {};
  const isOwner = String(post.user?.email||'').toLowerCase() === String(meEmail||'').toLowerCase();
  const [reporting, setReporting] = useState(false);

  const handleLike = async () => {
    try {
      await onLikeToggle(post, liked);
    } catch (e) {
      alert(e?.message || 'Like failed');
    }
  };

  const submitComment = async (e) => {
    e.preventDefault();
    const text = comment.trim();
    if (!text) return;
    try {
      const c = await addComment(post.id, { text, user: { name: user?.name || user?.firstName || user?.email || 'Member', email: user?.email || '' } });
      setComment('');
      onCommentAdded?.(post.id, c);
      onTyping?.(post.id, false);
    } catch (e) {
      alert(e?.message || 'Comment failed');
    }
  };

  useEffect(() => {
    if (!comment) { onTyping?.(post.id, false); return; }
    onTyping?.(post.id, true);
    const t = setTimeout(() => onTyping?.(post.id, false), 1200);
    return () => clearTimeout(t);
  }, [comment]);

  // Subscribe to global typing map via a custom event on post object changes
  useEffect(() => {
    // The parent updates post.__typing timestamp when typing updates arrive
    setIsSomeoneTyping(!!post.__typing && Date.now() - post.__typing < 1500);
  }, [post.__typing]);

  const handleDelete = async () => {
    if (!meEmail) { alert('Login required'); return; }
    if (!window.confirm('Delete this post?')) return;
    const token = (SessionManager.getCurrentUser() || {}).token;
    try {
      await deletePost(post.id, token);
      onDeleted?.(post.id);
      setMenuOpen(false);
    } catch (e) {
      alert(e?.message || 'Failed to delete');
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden mb-4">
      {/* Header */}
      <div className="flex items-center justify-between p-3 relative">
        <button onClick={()=>{
          const ident = post.user?.email || post.user?.name || '';
          if (!ident) return;
          navigate(`/profile?user=${encodeURIComponent(ident)}`);
        }} className="flex items-center gap-3 group text-left">
          <Avatar
            name={post.user?.name}
            url={(
              (String(post.user?.email||'').toLowerCase()===String(meEmail||'').toLowerCase()) ||
              (!post.user?.email && String(post.user?.name||'').trim().toLowerCase() === String((user?.name||user?.email)||'').trim().toLowerCase())
            ) ? (user?.avatar) : (post.user?.avatar)}
            size={8}
          />
          <div>
            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 group-hover:underline">{post.user?.name || 'Member'}</div>
            <div className="text-xs text-gray-500">{timeAgo(post.created_at)}</div>
          </div>
        </button>
        <div className="relative">
          <button onClick={()=>setMenuOpen(v=>!v)} className="p-1 hover:bg-gray-100 rounded-full">
            <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"/>
            </svg>
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-36 bg-white border border-gray-200 rounded-xl shadow-lg z-10">
              <button
                onClick={()=>{ setMenuOpen(false); const ident = post.user?.email || post.user?.name || ''; if (ident) navigate(`/profile?user=${encodeURIComponent(ident)}`); }}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-t-xl"
              >
                View profile
              </button>
              {isOwner && (
                <button onClick={handleDelete} className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50">Delete</button>
              )}
              {!isOwner && (
                <button
                  onClick={async()=>{
                    try {
                      setReporting(true);
                      await reportPost(post.id, { reason: 'Inappropriate', reporter: meEmail });
                      alert('Reported. Thank you.');
                    } catch (e) {
                      alert(e?.message || 'Failed to report');
                    } finally {
                      setReporting(false);
                      setMenuOpen(false);
                    }
                  }}
                  disabled={reporting}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  {reporting ? 'Reporting…' : 'Report'}
                </button>
              )}
              <button onClick={()=>setMenuOpen(false)} className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-b-xl">Cancel</button>
            </div>
          )}
        </div>
      </div>
      
      {/* Content */}
      {post.imageUrl && (
        <div className="relative">
          <div style={{ aspectRatio: '4 / 5' }} className="w-full bg-gray-50 overflow-hidden rounded-xl max-h-96">
            <img src={post.imageUrl} alt="post" className="w-full h-full object-cover"/>
          </div>
        </div>
      )}
      
      {/* Actions */}
      <div className="px-4 py-3">
        <div className="flex items-center gap-4 mb-3">
          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={handleLike} 
            className={`p-1 ${liked ? 'text-red-500' : 'text-gray-700'} hover:opacity-80`}
          >
            <svg className="w-6 h-6" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </motion.button>
          <button className="p-1 text-gray-700 hover:opacity-80" onClick={()=>setShowComments(v=>!v)}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </button>
          <button className="p-1 text-gray-700 hover:opacity-80" onClick={async()=>{
            try {
              const url = `${window.location.origin}/community-posts?id=${encodeURIComponent(post.id)}`;
              await navigator.clipboard?.writeText(url);
              alert('Post link copied');
            } catch { alert('Unable to copy link'); }
          }}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
            </svg>
          </button>
          <div className="ml-auto">
            <button className="p-1 text-gray-700 hover:opacity-80" onClick={()=>onSaveRequested?.(post)}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </button>
          </div>
        </div>
        
        {likeCount > 0 && (
          <div className="text-sm font-semibold text-gray-900 mb-2">
            {likeCount} {likeCount === 1 ? 'like' : 'likes'}
          </div>
        )}
        
        {post.text && (
          <div className="text-sm text-gray-900 dark:text-gray-100 mb-2">
            <span className="font-semibold mr-2">{post.user?.name || 'Member'}</span>
            {/* Hashtag linkify */}
            {(post.text || '').split(/(#[A-Za-z0-9_]+)/g).map((part, idx) => {
              if (part.startsWith('#')) {
                const tag = part.slice(1);
                return (
                  <button key={idx} onClick={()=>onHashtagClick?.(tag)} className="text-blue-600 hover:underline">{part}</button>
                );
              }
              return <span key={idx}>{part}</span>;
            })}
          </div>
        )}
        
        {(post.comments || []).length > 0 && (
          <button 
            onClick={() => setShowComments(!showComments)}
            className="text-sm text-gray-500 hover:text-gray-700 mb-2"
          >
            View all {(post.comments || []).length} comments
          </button>
        )}
        
        {(post.comments || []).slice(0, showComments ? undefined : 2).map((c)=> (
          <div key={c.id} className="text-sm text-gray-900 dark:text-gray-100 mb-1">
            <span className="font-semibold mr-2">{c.user?.name || 'Member'}</span>
            {c.text}
          </div>
        ))}
        {isSomeoneTyping && (
          <div className="text-xs text-gray-500">Someone is typing…</div>
        )}
      </div>
      
      {/* Add comment */}
      <form onSubmit={submitComment} className="px-4 pb-4 border-t border-gray-100">
        <div className="flex items-center gap-3 pt-3">
          <input 
            value={comment} 
            onChange={e=>setComment(e.target.value)} 
            placeholder="Add a comment..." 
            className="flex-1 text-sm border-none outline-none bg-transparent placeholder-gray-500"
          />
          {comment.trim() && (
            <button 
              type="submit" 
              className="text-sm font-semibold text-blue-500 hover:text-blue-700"
            >
              Post
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

export default function CommunityPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [view, setView] = useState('feed'); // feed | trending | hashtag
  const [activeTag, setActiveTag] = useState('');
  const [themeOpen, setThemeOpen] = useState(false);
  const [user, setUser] = useState(() => SessionManager.getCurrentUser() || {});
  useEffect(() => {
    const refresh = () => {
      const u = SessionManager.getCurrentUser() || {};
      setUser(u);
      // also refresh avatars inside existing posts that belong to me
      setItems(prev => prev.map(p => {
        const pe = String(p?.user?.email || '').toLowerCase();
        const me = String(u?.email || '').toLowerCase();
        const pn = String(p?.user?.name || '').trim().toLowerCase();
        const mn = String(u?.name || u?.email || '').trim().toLowerCase();
        if ((pe && pe === me) || (!pe && pn && mn && pn === mn)) {
          return { ...p, user: { ...(p.user||{}), avatar: u?.avatar } };
        }
        return p;
      }));
    };
    window.addEventListener('storage', refresh);
    window.addEventListener('fithub:session-updated', refresh);
    return () => {
      window.removeEventListener('storage', refresh);
      window.removeEventListener('fithub:session-updated', refresh);
    };
  }, []);
  const meEmail = (user?.email || '').trim();
  const { theme, setTheme } = useThemeToggle();
  const typingMapRef = useRef({});
  // Collections modal state
  const [showCollections, setShowCollections] = useState(false);
  const [collections, setCollections] = useState([]);
  const [collectionsLoading, setCollectionsLoading] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [savingPost, setSavingPost] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState('');
  // Story viewer state
  const [storyViewerOpen, setStoryViewerOpen] = useState(false);
  const [storyGroupsCache, setStoryGroupsCache] = useState([]);
  const [storyGIdx, setStoryGIdx] = useState(0);
  const [storyIIdx, setStoryIIdx] = useState(0);

  const fetchPage = async (p = 1, append = false) => {
    setLoading(true);
    setError('');
    try {
      const { data, total } = await listPosts(p, 10);
      setTotal(total || 0);
      setItems(prev => append ? [...prev, ...data] : data);
    } catch (e) {
      setError(e?.message || 'Failed to load community feed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPage(1, false); }, []);

  // Socket live updates
  useEffect(() => {
    const s = getCommunitySocket();
    // join community namespace implicitly
    s.on('connect', () => {});
    s.on('post:created', (post) => {
      setItems(prev => [post, ...prev]);
    });
    s.on('post:deleted', ({ id }) => {
      setItems(prev => prev.filter(p => p.id !== id));
    });
    s.on('post:liked', ({ postId, likes }) => {
      setItems(prev => prev.map(p => p.id === postId ? { ...p, likes } : p));
    });
    s.on('post:unliked', ({ postId, likes }) => {
      setItems(prev => prev.map(p => p.id === postId ? { ...p, likes } : p));
    });
    s.on('comment:added', ({ postId, comment }) => {
      setItems(prev => prev.map(p => p.id === postId ? { ...p, comments: [...(p.comments||[]), comment] } : p));
    });
    s.on('comment:typing', ({ postId, isTyping }) => {
      typingMapRef.current[postId] = !!isTyping;
      // trigger re-render by updating state subtly
      setItems(prev => prev.map(p => p.id === postId ? { ...p, __typing: Date.now() } : p));
    });
    return () => {
      s.off('post:created');
      s.off('post:deleted');
      s.off('post:liked');
      s.off('post:unliked');
      s.off('comment:added');
      s.off('comment:typing');
    };
  }, []);

  const onPosted = (post) => {
    setItems(prev => [post, ...prev]);
  };

  const onLikeToggle = async (post, alreadyLiked) => {
    if (!meEmail) throw new Error('Login required');
    // Optimistic update
    setItems(prev => prev.map(p => p.id === post.id ? {
      ...p,
      likes: alreadyLiked ? p.likes.filter(e => String(e).toLowerCase() !== meEmail.toLowerCase()) : [...(p.likes||[]), meEmail]
    } : p));
    try {
      if (alreadyLiked) await unlikePost(post.id, meEmail); else await likePost(post.id, meEmail);
    } catch (e) {
      // revert on error
      setItems(prev => prev.map(p => p.id === post.id ? post : p));
      throw e;
    }
  };

  const onCommentAdded = (postId, comment) => {
    setItems(prev => prev.map(p => p.id === postId ? { ...p, comments: [...(p.comments||[]), comment] } : p));
  };

  const canLoadMore = items.length < total && view === 'feed';

  const onTyping = (postId, isTyping) => {
    const u = { name: user?.name || user?.email || 'Member', email: meEmail };
    sendTyping({ postId, user: u, isTyping });
  };

  const loadTrending = async () => {
    setView('trending');
    setLoading(true);
    try {
      const data = await listTrending(20);
      setItems(data);
      setTotal(data.length);
    } catch (e) {
      setError(e?.message || 'Failed to load trending');
    } finally { setLoading(false); }
  };

  const filterByHashtag = async (tag) => {
    setView('hashtag');
    setActiveTag(tag);
    setLoading(true);
    try {
      const { data, total } = await listByHashtag(tag, 1, 20);
      setItems(data);
      setTotal(total || data.length);
    } catch (e) { setError(e?.message || 'Failed to load hashtag'); } finally { setLoading(false); }
  };

  const openSaveModal = async (post) => {
    if (!meEmail) { alert('Login required'); return; }
    setSelectedPostId(post.id);
    setShowCollections(true);
    setCollectionsLoading(true);
    try {
      const list = await listCollections(meEmail);
      setCollections(list);
    } catch (e) {
      setError(e?.message || 'Failed to load your collections');
    } finally {
      setCollectionsLoading(false);
    }
  };

  const handleCreateCollection = async () => {
    const name = newCollectionName.trim();
    if (!name) return;
    try {
      setCollectionsLoading(true);
      const created = await createCollection({ email: meEmail, name });
      setCollections((prev)=>[...prev, created]);
      setNewCollectionName('');
    } catch (e) { alert(e?.message || 'Failed to create collection'); }
    finally { setCollectionsLoading(false); }
  };

  const handleSaveToCollection = async (collectionId) => {
    if (!selectedPostId) return;
    try {
      setSavingPost(true);
      await addPostToCollection({ collectionId, postId: selectedPostId, email: meEmail });
      setShowCollections(false);
      setSelectedPostId('');
    } catch (e) { alert(e?.message || 'Failed to save'); }
    finally { setSavingPost(false); }
  };

  // Open stories viewer with grouped stories
  const openStoriesViewer = (groups, gIndex, iIndex) => {
    try {
      setStoryGroupsCache(groups || []);
      setStoryGIdx(gIndex || 0);
      setStoryIIdx(iIndex || 0);
      setStoryViewerOpen(true);
    } catch {}
  };

  // IntersectionObserver for infinite scroll
  useEffect(() => {
    if (!canLoadMore) return;
    const btn = document.getElementById('feed-load-more');
    if (!btn) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          const next = page + 1;
          setPage(next);
          fetchPage(next, true);
        }
      });
    }, { rootMargin: '200px' });
    io.observe(btn);
    return () => io.disconnect();
  }, [page, canLoadMore]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      {/* Top header */}
      <header className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-pink-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">F</span>
            </div>
            <div className="text-xl font-bold text-gray-900 dark:text-gray-100">FitHub</div>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full" onClick={()=>setThemeOpen(v=>!v)}>
                <svg className="w-6 h-6 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m8-9h1M3 12H2m15.364 6.364l-.707.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707-.707"/>
                </svg>
              </button>
              {themeOpen && (
                <div className="absolute right-0 mt-2 w-36 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-lg z-10">
                  <button onClick={()=>{setTheme('light'); setThemeOpen(false);}} className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-t-xl">Light</button>
                  <button onClick={()=>{setTheme('dark'); setThemeOpen(false);}} className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800">Dark</button>
                  <button onClick={()=>{setThemeOpen(false);}} className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-b-xl">Close</button>
                </div>
              )}
            </div>
            <button className="p-2 hover:bg-gray-100 rounded-full">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-full">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-full">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </button>
            <button onClick={()=>navigate('/profile')} title="Open profile" className="rounded-full overflow-hidden">
              <Avatar name={user?.name || user?.email} url={user?.avatar} size={8}/>
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {error && <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 mb-4">{error}</div>}

        {/* Stories bar */}
        <StoriesBar onOpenViewer={openStoriesViewer} />

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-4">
          <button onClick={()=>{setView('feed'); fetchPage(1, false);}} className={`px-3 py-1.5 rounded-lg text-sm border ${view==='feed'?'bg-blue-500 text-white border-blue-500':'bg-white dark:bg-gray-900 dark:text-gray-200 border-gray-200 dark:border-gray-800'}`}>Feed</button>
          <button onClick={loadTrending} className={`px-3 py-1.5 rounded-lg text-sm border ${view==='trending'?'bg-blue-500 text-white border-blue-500':'bg-white dark:bg-gray-900 dark:text-gray-200 border-gray-200 dark:border-gray-800'}`}>Trending</button>
          {activeTag && (
            <div className="text-xs text-gray-600 dark:text-gray-300 ml-2">#{activeTag}</div>
          )}
        </div>

        {/* Composer */}
        <PostComposer onPosted={onPosted} />

        {/* Feed cards */}
        <div className="space-y-4">
          {items.map(p => (
            <PostCard key={p.id} post={p} meEmail={meEmail} onLikeToggle={onLikeToggle} onCommentAdded={onCommentAdded} onDeleted={(id)=>setItems(prev=>prev.filter(x=>x.id!==id))} onTyping={onTyping} onHashtagClick={filterByHashtag} onSaveRequested={openSaveModal} />
          ))}
        </div>

        {/* Load more / Infinite scroll sentinel */}
        <div className="py-8 flex items-center justify-center">
          {loading ? (
            <div className="flex items-center gap-2 text-gray-600">
              <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
              <span className="text-sm">Loading…</span>
            </div>
          ) : canLoadMore ? (
            <button
              id="feed-load-more"
              onClick={() => { const next = page + 1; setPage(next); fetchPage(next, true); }}
              className="px-6 py-3 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-sm font-medium shadow-sm"
            >
              Load more posts
            </button>
          ) : (
            <div className="text-sm text-gray-500">You're all caught up! 🎉</div>
          )}
        </div>
      </div>
      {/* Story Viewer Overlay (page-level) */}
      {storyViewerOpen && (
        <StoryViewer
          groups={storyGroupsCache}
          groupIndex={storyGIdx}
          itemIndex={storyIIdx}
          onClose={()=>setStoryViewerOpen(false)}
          onViewed={()=>{ /* no-op */ }}
        />
      )}
    </div>
  );
}