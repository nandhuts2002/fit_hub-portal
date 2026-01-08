import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, MessageSquarePlus, Send, Users } from 'lucide-react';
import { messengerApi } from '../../utils/communityExtendedApi';
import { getCommunitySocket } from '../../utils/communityService';

const formatTime = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatDate = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const MessengerPanel = ({ userEmail, targetChatUser }) => {
  console.log('[MESSENGER] Component mounted with userEmail:', userEmail, 'targetChatUser:', targetChatUser);
  const [threads, setThreads] = useState([]);
  const [selectedThreadId, setSelectedThreadId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [showComposer, setShowComposer] = useState(false);
  const [newThreadName, setNewThreadName] = useState('');
  const [newThreadMembers, setNewThreadMembers] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [error, setError] = useState('');
  const [questNotice, setQuestNotice] = useState('');
  const messagesEndRef = useRef(null);

  const selectedThread = useMemo(
    () => threads.find((thread) => thread.id === selectedThreadId),
    [threads, selectedThreadId]
  );

  const scrollMessagesToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    scrollMessagesToBottom();
  }, [messages, scrollMessagesToBottom]);

  const loadThreads = useCallback(async () => {
    if (!userEmail) return;
    setLoadingThreads(true);
    setError('');
    console.log('[MESSENGER] Loading threads for user:', userEmail);
    try {
      const response = await messengerApi.getThreads();
      console.log('[MESSENGER] getThreads response:', response);
      if (response.ok) {
        setThreads(response.data);
        console.log('[MESSENGER] Loaded threads:', response.data);
        if (!selectedThreadId && response.data.length) {
          setSelectedThreadId(response.data[0].id);
        }
      } else {
        console.error('[MESSENGER] Error loading threads:', response.error);
        setError(response.error || 'Unable to fetch conversations');
      }
    } catch (err) {
      console.error('[MESSENGER] Exception loading threads:', err);
      setError(err.message || 'Unable to fetch conversations');
    } finally {
      setLoadingThreads(false);
    }
  }, [userEmail, selectedThreadId]);

  const loadMessages = useCallback(async (threadId) => {
    if (!threadId) return;
    setLoadingMessages(true);
    setError('');
    try {
      const response = await messengerApi.getMessages(threadId, 100);
      if (response.ok) {
        setMessages(response.data);
      } else {
        setError(response.error || 'Unable to fetch messages');
      }
    } catch (err) {
      setError(err.message || 'Unable to fetch messages');
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    console.log('[MESSENGER] useEffect triggered - userEmail:', userEmail);
    if (userEmail) {
      loadThreads();
    } else {
      console.warn('[MESSENGER] userEmail is empty, not loading threads');
    }
  }, [userEmail, loadThreads]);

  // Handle target chat user (start chat from post)
  useEffect(() => {
    if (targetChatUser && threads.length > 0 && !loadingThreads) {
      // Check if we already have a DM with this user
      const existingThread = threads.find(t =>
        t.type === 'direct' &&
        t.members.some(m => m.toLowerCase() === targetChatUser.toLowerCase())
      );

      if (existingThread) {
        setSelectedThreadId(existingThread.id);
      } else {
        // Prepare to create a new thread
        setShowComposer(true);
        setNewThreadMembers(targetChatUser);
        // Optional: Auto-submit or just let user confirm
      }
    }
  }, [targetChatUser, threads, loadingThreads]);

  // Socket.IO Real-time updates
  useEffect(() => {
    const socket = getCommunitySocket();
    if (!socket) return;

    if (!socket.connected) {
      socket.connect();
    }

    const onNewMessage = (data) => {
      // data: { threadId, message }
      const { threadId, message } = data;

      // 1. Update threads list (move to top, update preview)
      setThreads(prev => {
        const idx = prev.findIndex(t => t.id === threadId);
        if (idx === -1) {
          // New thread we don't know about yet? Refresh threads
          loadThreads();
          return prev;
        }

        const updatedThread = {
          ...prev[idx],
          last_message_at: message.created_at,
          lastMessage: message,
          lastMessagePreview: message.content
        };

        const newThreads = [...prev];
        newThreads.splice(idx, 1);
        newThreads.unshift(updatedThread);
        return newThreads;
      });

      // 2. If this is the active thread, append message
      if (selectedThreadId === threadId) {
        setMessages(prev => {
          // Avoid duplicates if we sent it ourselves and it came back via socket
          if (prev.some(m => m.id === message.id)) return prev;
          return [...prev, message];
        });
      }
    };

    socket.on('messenger:new_message', onNewMessage);

    return () => {
      socket.off('messenger:new_message', onNewMessage);
    };
  }, [selectedThreadId, loadThreads]);

  useEffect(() => {
    if (selectedThreadId) {
      loadMessages(selectedThreadId);
    } else {
      setMessages([]);
    }
  }, [selectedThreadId, loadMessages]);

  const handleCreateThread = async (event) => {
    event.preventDefault();
    if (!newThreadMembers.trim()) {
      setError('Add at least one teammate email.');
      return;
    }

    const members = newThreadMembers
      .split(',')
      .map((member) => member.trim().toLowerCase())
      .filter((member) => member && member !== userEmail);

    if (!members.length) {
      setError('Add at least one teammate email that is not you.');
      return;
    }

    setError('');

    try {
      const response = await messengerApi.createThread({
        name: newThreadName.trim(),
        members
      });
      if (response.ok) {
        const newThread = response.data;
        setThreads((prev) => [newThread, ...prev]);
        setSelectedThreadId(newThread.id);
        setShowComposer(false);
        setNewThreadName('');
        setNewThreadMembers('');
        setQuestNotice('New group unlocked! Keep the streak by checking in daily.');
      } else {
        setError(response.error || 'Unable to start a conversation');
      }
    } catch (err) {
      setError(err.message || 'Unable to start a conversation');
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedThreadId) return;

    try {
      const response = await messengerApi.sendMessage(selectedThreadId, {
        content: newMessage.trim()
      });
      if (response.ok) {
        setNewMessage('');
        setMessages((prev) => [...prev, response.data]);
        loadThreads(); // refresh thread previews
      } else {
        setError(response.error || 'Unable to send message');
      }
    } catch (err) {
      setError(err.message || 'Unable to send message');
    }
  };

  const renderThread = (thread) => {
    const isActive = thread.id === selectedThreadId;
    return (
      <button
        key={thread.id}
        onClick={() => setSelectedThreadId(thread.id)}
        className={`w-full text-left px-4 py-3 rounded-xl transition ${isActive ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'
          }`}
      >
        <div className="flex items-center justify-between">
          <p className="font-semibold text-gray-900 truncate">{thread.name}</p>
          <span className="text-xs text-gray-500">{formatDate(thread.last_message_at)}</span>
        </div>
        <p className="text-sm text-gray-600 mt-1 h-10 overflow-hidden">
          {thread.lastMessage?.previewText || thread.lastMessagePreview || 'No messages yet'}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          {thread.members.length} {thread.members.length === 1 ? 'member' : 'members'}
        </p>
      </button>
    );
  };

  const renderMessage = (message) => {
    const isMine = message.senderEmail === userEmail;
    return (
      <div
        key={message.id}
        className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
      >
        <div
          className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-sm ${isMine ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white text-gray-900 rounded-bl-none'
            }`}
        >
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm font-semibold">{isMine ? 'You' : message.senderName}</p>
            <span className={`text-xs ${isMine ? 'text-blue-100' : 'text-gray-400'}`}>
              {formatTime(message.created_at)}
            </span>
          </div>
          {message.content && (
            <p className="text-sm mt-2 whitespace-pre-line break-words">{message.content}</p>
          )}
          {!message.content && message.hasAttachment && (
            <p className="text-sm mt-2 italic opacity-80">Shared an attachment</p>
          )}
          {Array.isArray(message.attachments) && message.attachments.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {message.attachments.map((item, index) => (
                <span
                  key={index}
                  className={`text-xs px-3 py-1 rounded-full ${isMine ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'
                    }`}
                >
                  {item.label || 'Attachment'}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {questNotice && (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-2xl shadow-lg flex items-center justify-between">
          <div>
            <p className="font-semibold">Squad unlocked</p>
            <p className="text-sm opacity-90">{questNotice}</p>
          </div>
          <button
            className="text-sm font-semibold underline"
            onClick={() => setQuestNotice('')}
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-lg font-semibold text-gray-900">Conversations</p>
              <p className="text-sm text-gray-500">Start a huddle or drop a DM</p>
            </div>
            <button
              onClick={() => setShowComposer(!showComposer)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition"
            >
              <MessageSquarePlus className="w-4 h-4" />
              New chat
            </button>
          </div>

          {showComposer && (
            <form onSubmit={handleCreateThread} className="mb-6 space-y-3 bg-blue-50/60 p-3 rounded-xl">
              <input
                type="text"
                value={newThreadName}
                onChange={(e) => setNewThreadName(e.target.value)}
                placeholder="Name your group (optional)"
                className="w-full px-3 py-2 rounded-lg border border-blue-200 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
              />
              <textarea
                value={newThreadMembers}
                onChange={(e) => setNewThreadMembers(e.target.value)}
                placeholder="Add teammates by email, separated by commas"
                rows={2}
                className="w-full px-3 py-2 rounded-lg border border-blue-200 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowComposer(false);
                    setNewThreadName('');
                    setNewThreadMembers('');
                  }}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700"
                >
                  Start chat
                </button>
              </div>
            </form>
          )}

          <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {loadingThreads ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
              </div>
            ) : threads.length ? (
              threads.map(renderThread)
            ) : (
              <div className="text-center text-gray-500 py-10 px-4 border-2 border-dashed border-gray-200 rounded-2xl">
                <Users className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="font-semibold">No conversations yet</p>
                <p className="text-sm">Launch the first chat to get the energy flowing.</p>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col">
          {selectedThread ? (
            <>
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-xl font-semibold text-gray-900">{selectedThread.name}</p>
                  <p className="text-sm text-gray-500">
                    {selectedThread.members.length} teammates ·{' '}
                    {selectedThread.lastMessage?.senderName
                      ? `Last by ${selectedThread.lastMessage.senderName}`
                      : 'Say hello!'}
                  </p>
                </div>
                <div className="text-xs text-gray-400 uppercase tracking-wide">
                  {selectedThread.type === 'group' ? 'GROUP HUDDLE' : 'DIRECT CHAT'}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4 bg-gray-50 custom-scrollbar">
                {loadingMessages ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                  </div>
                ) : messages.length ? (
                  <>
                    {messages.map(renderMessage)}
                    <div ref={messagesEndRef} />
                  </>
                ) : (
                  <div className="text-center text-gray-500 py-12 px-4">
                    <p className="font-semibold">No messages yet</p>
                    <p className="text-sm mt-2">Kick things off with a quick check-in.</p>
                  </div>
                )}
              </div>

              <div className="border-t border-gray-100 p-4">
                <div className="flex items-end gap-3">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Send motivation, plans, or a quick status..."
                    rows={2}
                    className="flex-1 resize-none rounded-2xl border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    className="p-4 rounded-2xl bg-blue-600 text-white shadow-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center flex-col gap-4 text-gray-500 p-8">
              <Users className="w-12 h-12 text-gray-400" />
              <p className="text-lg font-semibold text-gray-700">Select a conversation</p>
              <p className="text-sm text-center">
                Pick a thread from the left, or start a new one to rally your crew.
              </p>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl border border-red-100">
          {error}
        </div>
      )}
    </div>
  );
};

export default MessengerPanel;

