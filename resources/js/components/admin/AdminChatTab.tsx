import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, Search, User as UserIcon, Loader2, Clock, CheckCheck, Sparkles, RefreshCw } from 'lucide-react';
import { api } from '../../lib/api';
import type { ChatUserItem, ChatMessage } from '../../types';

export const AdminChatTab: React.FC = () => {
  const [users, setUsers] = useState<ChatUserItem[]>([]);
  const [selectedUser, setSelectedUser] = useState<ChatUserItem | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastMsgIdRef = useRef<number>(0);

  const scrollToBottom = (smooth = true) => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTo({
        top: chatScrollRef.current.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto',
      });
    }
  };

  const isNearBottom = () => {
    if (!chatScrollRef.current) return true;
    const { scrollTop, scrollHeight, clientHeight } = chatScrollRef.current;
    return scrollHeight - scrollTop - clientHeight < 120;
  };

  // 1. Load users list
  const loadUsers = async (silent = false) => {
    if (!silent) setLoadingUsers(true);
    try {
      const data = await api.getAdminChatUsers();
      setUsers(data || []);
      // If no user selected yet, auto select first user
      if (!selectedUser && data && data.length > 0) {
        setSelectedUser(data[0]);
      }
    } catch (err) {
      console.error('Lỗi tải danh sách khách nhắn tin:', err);
    } finally {
      if (!silent) setLoadingUsers(false);
    }
  };

  // 2. Load conversation messages for selected user
  const loadMessages = async (userId: number, silent = false) => {
    if (!silent) setLoadingMessages(true);
    try {
      if (!silent || lastMsgIdRef.current === 0) {
        const data = await api.getAdminChatMessages(userId);
        const items = data || [];
        setMessages(items);
        if (items.length > 0) {
          lastMsgIdRef.current = Math.max(...items.map((m) => m.id));
        }
      } else {
        // Incremental polling using after_id to save 90%+ bandwidth
        const newItems = await api.getAdminChatMessages(userId, lastMsgIdRef.current);
        if (newItems && newItems.length > 0) {
          setMessages((prev) => {
            const map = new Map(prev.map((m) => [m.id, m]));
            newItems.forEach((m) => map.set(m.id, m));
            return Array.from(map.values()).sort((a, b) => a.id - b.id);
          });
          lastMsgIdRef.current = Math.max(lastMsgIdRef.current, ...newItems.map((m) => m.id));
        }
      }
    } catch (err) {
      console.error('Lỗi tải tin nhắn hội thoại:', err);
    } finally {
      if (!silent) setLoadingMessages(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadUsers();
  }, []);

  // When selected user changes, load their messages
  useEffect(() => {
    if (selectedUser) {
      lastMsgIdRef.current = 0;
      loadMessages(selectedUser.id);
      setTimeout(() => {
        scrollToBottom(false);
        inputRef.current?.focus({ preventScroll: true });
      }, 100);
    } else {
      setMessages([]);
      lastMsgIdRef.current = 0;
    }
  }, [selectedUser]);

  // Polling every 3 seconds for active conversation and user list (Lab 07 requirement)
  useEffect(() => {
    const interval = setInterval(() => {
      loadUsers(true);
      if (selectedUser) {
        loadMessages(selectedUser.id, true);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [selectedUser]);

  useEffect(() => {
    if (isNearBottom()) {
      scrollToBottom(true);
    }
  }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const content = messageInput.trim();
    if (!content || !selectedUser || sending) return;

    setSending(true);
    try {
      const newMsg = await api.sendAdminChatMessage(selectedUser.id, content);
      setMessageInput('');
      setMessages((prev) => [...prev, newMsg]);
      if (newMsg.id > lastMsgIdRef.current) {
        lastMsgIdRef.current = newMsg.id;
      }
      setTimeout(() => scrollToBottom(true), 50);
      loadUsers(true);
    } catch (err) {
      console.error('Lỗi gửi tin nhắn phản hồi:', err);
    } finally {
      setSending(false);
      setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 50);
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-2xl font-display font-bold text-ink-900 flex items-center gap-2.5">
            <span>Hỗ trợ trực tuyến & Live Chat</span>

          </h3>
          <p className="text-sm text-ink-500 mt-1">
            Trực tiếp trả lời thắc mắc, tư vấn thiết bị máy ảnh và hỗ trợ đơn hàng của khách hàng theo thời gian thực.
          </p>
        </div>

        <button
          onClick={() => {
            loadUsers();
            if (selectedUser) loadMessages(selectedUser.id);
          }}
          className="btn-secondary px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 self-start cursor-pointer"
        >
          <RefreshCw size={14} className={loadingUsers ? 'animate-spin' : ''} />
          <span>Làm mới hội thoại</span>
        </button>
      </div>

      {/* Main Chat Interface */}
      <div className="bg-white dark:bg-ink-900 rounded-3xl border border-cream-200 dark:border-ink-800 shadow-sm overflow-hidden flex flex-col md:flex-row h-[620px]">
        {/* Left Side: Users List */}
        <div className="w-full md:w-80 border-r border-cream-200 dark:border-ink-800 flex flex-col bg-cream-50/40 dark:bg-ink-950/50">
          {/* Search bar */}
          <div className="p-3 border-b border-cream-200 dark:border-ink-800 bg-white dark:bg-ink-900">
            <div className="relative">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm khách hàng theo tên, email..."
                className="w-full pl-9 pr-3 py-2 bg-cream-50 dark:bg-ink-800/80 border border-cream-200 dark:border-ink-700 rounded-xl text-xs text-ink-900 dark:text-cream-100 focus:outline-none focus:border-accent-500 focus:bg-white dark:focus:bg-ink-800 transition-all font-medium"
              />
            </div>
          </div>

          {/* User items */}
          <div className="flex-1 overflow-y-auto divide-y divide-cream-100 dark:divide-ink-800">
            {loadingUsers && users.length === 0 ? (
              <div className="p-8 text-center text-ink-400 text-xs flex flex-col items-center gap-2">
                <Loader2 size={20} className="animate-spin text-accent-500" />
                <span>Đang tải danh sách...</span>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-8 text-center text-ink-400 text-xs">
                <p className="font-semibold text-ink-700 dark:text-cream-200">Không tìm thấy khách hàng nào</p>
                <p className="mt-1 text-[11px] text-ink-400 dark:text-ink-500">Chưa có khách hàng nhắn tin hoặc không trùng khớp từ khóa tìm kiếm.</p>
              </div>
            ) : (
              filteredUsers.map((u) => {
                const isSelected = selectedUser?.id === u.id;
                return (
                  <button
                    key={u.id}
                    onClick={() => setSelectedUser(u)}
                    className={`w-full text-left p-3.5 transition-all flex items-start gap-3 cursor-pointer ${isSelected
                        ? 'bg-accent-50 dark:bg-accent-500/15 border-l-4 border-accent-500'
                        : 'hover:bg-cream-100/70 dark:hover:bg-ink-800/60 border-l-4 border-transparent'
                      }`}
                  >
                    <div className="relative shrink-0">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-ink-800 to-ink-900 text-white font-bold text-sm flex items-center justify-center shadow-2xs">
                        {u.name.substring(0, 1).toUpperCase()}
                      </div>
                      {u.unread_count && u.unread_count > 0 ? (
                        <span className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-rose-500 text-white text-[10px] font-bold rounded-full shadow-xs">
                          {u.unread_count}
                        </span>
                      ) : null}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h5 className="font-bold text-xs text-ink-900 dark:text-cream-50 truncate">{u.name}</h5>
                        {u.last_message_time && (
                          <span className="text-[10px] text-ink-400 dark:text-ink-500 shrink-0">{u.last_message_time}</span>
                        )}
                      </div>
                      <p className="text-[11px] text-ink-500 dark:text-ink-400 truncate mt-0.5">{u.email}</p>
                      {u.last_message && (
                        <p className="text-[11px] text-ink-600 dark:text-cream-300 truncate mt-1 italic font-light">
                          "{u.last_message}"
                        </p>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Conversation Area */}
        <div className="flex-1 flex flex-col bg-white dark:bg-ink-900">
          {!selectedUser ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-3 text-ink-400">
              <div className="w-16 h-16 rounded-3xl bg-cream-100 dark:bg-ink-800 flex items-center justify-center text-ink-500 dark:text-ink-400">
                <MessageSquare size={28} />
              </div>
              <div>
                <h4 className="font-bold text-sm text-ink-800 dark:text-cream-100">Chọn một khách hàng</h4>
                <p className="text-xs text-ink-500 dark:text-ink-400 mt-1 max-w-sm">
                  Chọn khách hàng ở danh sách bên trái để bắt đầu hỗ trợ và xem toàn bộ lịch sử trao đổi.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Selected User Header */}
              <div className="px-6 py-3.5 border-b border-cream-200 dark:border-ink-800 flex items-center justify-between bg-cream-50/50 dark:bg-ink-900 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-ink-900 text-white font-bold text-xs flex items-center justify-center">
                    {selectedUser.name.substring(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-ink-900 dark:text-cream-50 flex items-center gap-2">
                      <span>{selectedUser.name}</span>
                      <span className="text-[10px] text-accent-700 dark:text-accent-300 bg-accent-50 dark:bg-accent-950/60 px-2 py-0.5 rounded-full font-semibold border border-accent-200 dark:border-accent-800">
                        Khách hàng #{selectedUser.id}
                      </span>
                    </h4>
                    <p className="text-[11px] text-ink-500 dark:text-ink-400">{selectedUser.email}</p>
                  </div>
                </div>
              </div>

              {/* Messages Stream */}
              <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-cream-50/30 dark:bg-ink-950/70">
                {loadingMessages && messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-ink-400 text-xs">
                    <Loader2 size={24} className="animate-spin text-accent-500 mb-2" />
                    <span>Đang tải hội thoại...</span>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-ink-400 text-xs space-y-2">
                    <MessageSquare size={24} className="text-ink-300" />
                    <span>Chưa có tin nhắn nào được gửi giữa Quản trị viên và khách hàng này.</span>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isFromUser = String(msg.sender_id) === String(selectedUser.id);
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isFromUser ? 'items-start' : 'items-end'}`}
                      >
                        <div className="flex items-end gap-2 max-w-[75%]">
                          {isFromUser && (
                            <div className="w-7 h-7 rounded-xl bg-ink-200 dark:bg-ink-700 text-ink-800 dark:text-cream-200 text-[10px] font-bold flex items-center justify-center shrink-0 mb-1">
                              {selectedUser.name.substring(0, 1).toUpperCase()}
                            </div>
                          )}
                          <div
                            className={`p-3 rounded-2xl text-xs leading-relaxed shadow-2xs ${isFromUser
                                ? 'bg-white dark:bg-ink-800 border border-cream-200 dark:border-ink-700 text-ink-900 dark:text-cream-100 rounded-bl-xs'
                                : 'bg-accent-500 text-white rounded-br-xs font-medium'
                              }`}
                          >
                            <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-ink-400 dark:text-ink-500 mt-1 px-1">
                          <Clock size={10} />
                          <span>
                            {msg.created_at
                              ? new Date(msg.created_at).toLocaleTimeString('vi-VN', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                              : ''}
                          </span>
                          {!isFromUser && <CheckCheck size={12} className="text-emerald-500 ms-0.5" />}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Message Input Box */}
              <form onSubmit={handleSendMessage} className="p-4 bg-white dark:bg-ink-900 border-t border-cream-200 dark:border-ink-800 flex items-center gap-3 shrink-0">
                <input
                  ref={inputRef}
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder={`Phản hồi cho ${selectedUser.name}...`}
                  disabled={sending}
                  className="flex-1 px-4 py-3 bg-cream-50 dark:bg-ink-800 border border-cream-200 dark:border-ink-700 rounded-2xl text-xs text-ink-900 dark:text-cream-100 focus:outline-none focus:border-accent-500 focus:bg-white dark:focus:bg-ink-800 transition-all font-medium"
                />
                <button
                  type="submit"
                  disabled={!messageInput.trim() || sending}
                  className="btn-accent px-5 py-3 rounded-2xl text-xs font-bold flex items-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95 shadow-md"
                >
                  {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                  <span>Gửi Phản Hồi</span>
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
