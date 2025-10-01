import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import SessionManager from '../utils/sessionManager';
import { uploadAvatar, getFollowing, listComments as apiListComments, addComment as apiAddComment, likePost as apiLikePost, unlikePost as apiUnlikePost } from '../utils/communityService';
import { getProfile, getProfilePosts, follow, unfollow, updateProfile } from '../utils/profileService';

export default function ProfilePage() {
  const me = SessionManager.getCurrentUser() || {};
  const token = me?.token;
  const [search] = useSearchParams();
  const { handle, email } = useParams();
  const identifier = useMemo(() => {
    return (handle || email || search.get('user') || me.email || '').trim();
  }, [handle, email, search, me.email]);

  const [profile, setProfile] = useState(null);
  const [counts, setCounts] = useState({ posts: 0, followers: 0, following: 0 });
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const isMe = useMemo(() => String(profile?.email||'').toLowerCase() === String(me?.email||'').toLowerCase(), [profile, me]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followPending, setFollowPending] = useState(false);
  // Post viewer modal
  const [viewerOpen, setViewerOpen] = useState(false);
  const [activePost, setActivePost] = useState(null);
  const [activeComments, setActiveComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [likeBusy, setLikeBusy] = useState(false);

  // Avatar uploader
  const inputRef = useRef(null);
  const pickAvatar = () => inputRef.current?.click();
  const onAvatarChange = async (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    try {
      const url = await uploadAvatar(f, token);
      await updateProfile({ avatar: url }, token);
      try { SessionManager.setAvatar(url); } catch {}
      await loadProfile();
    } catch (err) { alert(err?.message || 'Failed to update avatar'); }
    finally { try { e.target.value = ''; } catch {} }
  };

  const loadProfile = async () => {
    if (!identifier) return;
    setLoading(true);
    try {
      const info = await getProfile(identifier);
      setProfile(info);
      setCounts(info?.counts || { posts: 0, followers: 0, following: 0 });
      // fetch follow state if viewing someone else
      try {
        const meEmail = (me?.email || '').trim().toLowerCase();
        const targetEmail = String(info?.email || '').trim().toLowerCase();
        if (meEmail && targetEmail && meEmail !== targetEmail) {
          const list = await getFollowing(meEmail);
          const isF = (list || []).map(e=>String(e).toLowerCase()).includes(targetEmail);
          setIsFollowing(isF);
        } else {
          setIsFollowing(false);
        }
      } catch {}
      try {
        if (info?.email && info?.avatar && String(info.email).toLowerCase() === String(me?.email||'').toLowerCase()) {
          SessionManager.setAvatar(info.avatar);
        }
      } catch {}
    } catch (e) { alert(e?.message || 'Failed to load profile'); }
    finally { setLoading(false); }
  };

  const loadPosts = async (p = 1, append = false) => {
    if (!identifier) return;
    try {
      const { data, total } = await getProfilePosts(identifier, p, 12);
      setTotal(total || 0);
      setPosts(prev => append ? [...prev, ...data] : data);
      setPage(p);
    } catch (e) { /* ignore */ }
  };

  useEffect(() => { loadProfile(); loadPosts(1, false); }, [identifier]);

  // Open a post with comments
  const openPost = async (post) => {
    setActivePost(post);
    setViewerOpen(true);
    try {
      const list = await apiListComments(post.id);
      setActiveComments(list || []);
    } catch { setActiveComments(post.comments || []); }
  };

  const closePost = () => {
    setViewerOpen(false);
    setActivePost(null);
    setActiveComments([]);
    setCommentText('');
  };

  const sharePost = async (post) => {
    try {
      const url = `${window.location.origin}/community-posts?id=${encodeURIComponent(post.id)}`;
      await navigator.clipboard?.writeText(url);
      alert('Post link copied');
    } catch { alert('Unable to copy link'); }
  };

  const toggleLike = async () => {
    if (!activePost || likeBusy) return;
    const meEmail = (me?.email || '').trim();
    if (!meEmail) { alert('Login required'); return; }
    setLikeBusy(true);
    const already = (activePost.likes || []).map(e=>String(e).toLowerCase()).includes(meEmail.toLowerCase());
    // optimistic update
    setActivePost(p => p ? { ...p, likes: already ? (p.likes||[]).filter(e=>String(e).toLowerCase()!==meEmail.toLowerCase()) : [ ...(p.likes||[]), meEmail ] } : p);
    try {
      if (already) await apiUnlikePost(activePost.id, meEmail); else await apiLikePost(activePost.id, meEmail);
    } catch (e) {
      // revert on error by refetching comments/likes minimal
      try { const list = await apiListComments(activePost.id); setActiveComments(list||[]); } catch {}
    } finally { setLikeBusy(false); }
  };

  const submitComment = async (e) => {
    e?.preventDefault?.();
    const text = commentText.trim();
    if (!text || !activePost) return;
    try {
      const userPayload = { name: me?.name || me?.email || 'Member', email: me?.email || '' };
      const c = await apiAddComment(activePost.id, { text, user: userPayload });
      setActiveComments(prev => [ ...(prev||[]), c ]);
      setCommentText('');
    } catch (e) { alert(e?.message || 'Failed to comment'); }
  };

  const onFollowToggle = async () => {
    if (!profile?.email) return;
    try {
      setFollowPending(true);
      if (isFollowing) {
        await unfollow(profile.email, token);
        setIsFollowing(false);
        setCounts(c => ({ ...c, followers: Math.max(0, (c.followers||0) - 1) }));
      } else {
        await follow(profile.email, token);
        setIsFollowing(true);
        setCounts(c => ({ ...c, followers: (c.followers||0) + 1 }));
      }
      // optimistic counters
    } catch (e) { alert(e?.message || 'Action failed'); }
    finally { setFollowPending(false); }
  };

  const onSaveProfile = async (e) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const payload = {
      handle: form.get('handle')?.toString(),
      displayName: form.get('displayName')?.toString(),
      bio: form.get('bio')?.toString(),
      links: (form.get('links')?.toString() || '').split(',').map(s=>s.trim()).filter(Boolean)
    };
    try {
      setSaving(true);
      await updateProfile(payload, token);
      // Keep local session in sync for header/avatar/name displays
      try {
        if (payload.displayName) {
          const u = SessionManager.getCurrentUser() || {};
          u.name = payload.displayName;
          SessionManager.setCurrentUser && SessionManager.setCurrentUser(u);
        }
      } catch {}
      setEditing(false);
      await loadProfile();
    } catch (err) { alert(err?.message || 'Failed to update'); }
    finally { setSaving(false); }
  };

  const canLoadMore = posts.length < total;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 mb-6">
          {loading ? (
            <div className="text-sm text-gray-600">Loading…</div>
          ) : profile ? (
            <div className="flex items-start gap-6">
              <div className="relative shrink-0" style={{ width: 112, height: 112 }}>
                <img src={profile.avatar} alt={profile.displayName||profile.email} className="rounded-full object-cover bg-gray-100 w-full h-full" onError={(e)=>{e.currentTarget.src='';}} />
                {isMe && (
                  <>
                    <button onClick={pickAvatar} className="absolute -bottom-1 -right-1 px-3 py-1.5 text-xs rounded-full bg-gray-900 text-white">Change</button>
                    <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onAvatarChange} />
                  </>
                )}

      {/* Post Viewer Modal */}
      {viewerOpen && activePost && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60" onClick={closePost} />
          <div className="absolute inset-0 grid place-items-center p-4" onClick={closePost}>
            <div className="w-full max-w-4xl bg-white dark:bg-gray-900 rounded-2xl shadow-xl overflow-hidden" onClick={(e)=>e.stopPropagation()}>
              <div className="grid grid-cols-1 md:grid-cols-2">
                <div className="bg-black/5 dark:bg-black/30 p-2">
                  {activePost.imageUrl ? (
                    <img src={activePost.imageUrl} alt="post" className="w-full h-[60vh] object-contain" />
                  ) : (
                    <div className="w-full h-[60vh] grid place-items-center text-gray-600 p-4">{activePost.text}</div>
                  )}
                </div>
                <div className="p-4 flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-semibold text-gray-900 dark:text-gray-100">{profile?.displayName || activePost.user?.name || 'Member'}</div>
                    <div className="flex items-center gap-2">
                      <button onClick={toggleLike} className="px-3 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-sm">
                        { (activePost.likes||[]).length } ♥
                      </button>
                      <button onClick={()=>sharePost(activePost)} className="px-3 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-sm">Share</button>
                      <button onClick={closePost} className="px-3 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-sm">Close</button>
                    </div>
                  </div>
                  {activePost.text && (
                    <div className="text-sm text-gray-800 dark:text-gray-200 mb-3">{activePost.text}</div>
                  )}
                  <div className="flex-1 overflow-y-auto border-t border-gray-100 dark:border-gray-800 pt-3 space-y-2">
                    {(activeComments||[]).map(c => (
                      <div key={c.id} className="text-sm text-gray-900 dark:text-gray-100"><span className="font-semibold mr-2">{c.user?.name || 'Member'}</span>{c.text}</div>
                    ))}
                  </div>
                  <form onSubmit={submitComment} className="mt-3 flex items-center gap-2">
                    <input value={commentText} onChange={e=>setCommentText(e.target.value)} placeholder="Add a comment..." className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent text-sm" />
                    <button className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm disabled:opacity-60" disabled={!commentText.trim()}>Post</button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="text-xl font-bold">{profile.displayName || profile.email?.split('@')[0]}</div>
                  <div className="text-gray-500">@{profile.handle || profile.email?.split('@')[0]}</div>
                  <div className="ml-auto flex items-center gap-2">
                    {isMe ? (
                      <button onClick={()=>setEditing(true)} className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700">Edit profile</button>
                    ) : (
                      <button onClick={onFollowToggle} disabled={followPending} className={`px-4 py-2 rounded-lg text-white ${isFollowing ? 'bg-gray-700 hover:bg-gray-800' : 'bg-blue-600 hover:bg-blue-700'} disabled:opacity-60`}>
                        {isFollowing ? 'Following' : 'Follow'}
                      </button>
                    )}
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-6 text-sm">
                  <div><span className="font-semibold">{counts.posts}</span> posts</div>
                  <div><span className="font-semibold">{counts.followers}</span> followers</div>
                  <div><span className="font-semibold">{counts.following}</span> following</div>
                </div>
                {profile.bio ? <div className="mt-3 text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{profile.bio}</div> : null}
                {Array.isArray(profile.links) && profile.links.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2 text-sm">
                    {profile.links.map((l, i) => (
                      <a key={i} href={/^https?:\/\//.test(l)?l:`https://${l}`} target="_blank" rel="noreferrer" className="px-3 py-1 rounded-full border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">{l}</a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-sm text-red-600">Profile not found</div>
          )}
        </div>

        {/* Tabs - only Posts for now */}
        <div className="flex items-center justify-center gap-6 mb-4">
          <div className="px-3 py-1.5 rounded-lg bg-gray-900 text-white text-xs">Posts</div>
          {/* Future: Saved, Tagged */}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
          {posts.map(p => (
            <button key={p.id} onClick={() => openPost(p)} className="relative aspect-square bg-gray-100 rounded-md overflow-hidden">
              {p.imageUrl ? (
                <img src={p.imageUrl} alt={p.text?.slice(0,40)} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full grid place-items-center text-gray-500 text-xs p-2 text-center">{p.text}</div>
              )}
            </button>
          ))}
        </div>

        {/* Load more */}
        <div className="py-8 flex items-center justify-center">
          {posts.length === 0 && !loading ? (
            <div className="text-sm text-gray-500">No posts yet</div>
          ) : canLoadMore ? (
            <button onClick={()=>loadPosts(page+1, true)} className="px-6 py-2 rounded-lg border border-gray-300 dark:border-gray-700">Load more</button>
          ) : null}
        </div>
      </div>

      {/* Edit Profile Dialog */}
      {editing && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={()=>setEditing(false)} />
          <div className="absolute inset-0 grid place-items-center p-4">
            <form onSubmit={onSaveProfile} className="w-full max-w-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 space-y-3">
              <div className="text-lg font-semibold">Edit profile</div>
              <div className="grid grid-cols-3 items-center gap-2">
                <label className="text-sm text-gray-600">Handle</label>
                <input name="handle" defaultValue={profile?.handle} className="col-span-2 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent" />
              </div>
              <div className="grid grid-cols-3 items-center gap-2">
                <label className="text-sm text-gray-600">Display name</label>
                <input name="displayName" defaultValue={profile?.displayName} className="col-span-2 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent" />
              </div>
              <div>
                <label className="text-sm text-gray-600">Bio</label>
                <textarea name="bio" defaultValue={profile?.bio} className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent" rows={4} />
              </div>
              <div>
                <label className="text-sm text-gray-600">Links (comma separated)</label>
                <input name="links" defaultValue={(profile?.links||[]).join(', ')} className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent" />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button type="button" onClick={()=>setEditing(false)} className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700">Cancel</button>
                <button disabled={saving} className="px-4 py-2 rounded-lg bg-blue-600 text-white disabled:opacity-60">{saving?'Saving…':'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
