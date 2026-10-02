import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Headphones, Sparkles, User as UserIcon, Loader2, ArrowRight, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../lib/api';
import type { ChatMessage, Page } from '../types';

interface LiveChatWidgetProps {
  onNavigate?: (page: Page) => void;
}

export const LiveChatWidget: React.FC<LiveChatWidgetProps> = ({ onNavigate }) => {
  const { user, openAuthModal } = useAuth();
  const { warning, error: toastError } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const chatScrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatPopupRef = useRef<HTMLDivElement>(null);
  const lastMsgIdRef = useRef<number>(0);
  const recentSendTimesRef = useRef<number[]>([]);
  const lastSentContentRef = useRef<{ text: string; time: number }>({ text: '', time: 0 });

  // Đếm ngược cooldown chống gửi dồn dập
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Thông báo trạng thái đóng/mở chat cho các floating widget khác phối hợp vị trí
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('camerahub_chat_state', { detail: { isOpen } }));
  }, [isOpen]);

  // Close chat window when clicking outside or pressing Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (chatPopupRef.current && !chatPopupRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

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
    return scrollHeight - scrollTop - clientHeight < 100;
  };

  const loadMessages = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      if (!silent || lastMsgIdRef.current === 0) {
        const data = await api.getUserChatMessages();
        const items = data || [];
        setMessages(items);
        if (items.length > 0) {
          lastMsgIdRef.current = Math.max(...items.map((m) => m.id));
        }
      } else {
        // Incremental polling using after_id to save 90%+ bandwidth
        const newItems = await api.getUserChatMessages(lastMsgIdRef.current);
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
      console.error('Lỗi tải tin nhắn chat:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // When user opens popup, fetch messages and focus input
  useEffect(() => {
    if (isOpen) {
      lastMsgIdRef.current = 0;
      loadMessages();
      setTimeout(() => {
        scrollToBottom(false);
        inputRef.current?.focus({ preventScroll: true });
      }, 150);
    }
  }, [isOpen, user]);

  // Polling every 3 seconds while popup is open (Lab 07 requirement)
  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      loadMessages(true);
    }, 3000);

    return () => clearInterval(interval);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && isNearBottom()) {
      scrollToBottom(true);
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const content = inputValue.trim();
    if (!content || sending) return;

    // 1. Kiểm tra Cooldown Timer
    if (cooldown > 0) {
      warning(`Vui lòng đợi ${cooldown} giây trước khi gửi tiếp nhé!`, 'Gửi quá nhanh');
      return;
    }

    const now = Date.now();

    // 2. Chống gửi dồn dập (Burst limit: Tối đa 5 tin trong 30 giây -> khóa 15s)
    recentSendTimesRef.current = recentSendTimesRef.current.filter((t) => now - t < 30000);
    if (recentSendTimesRef.current.length >= 5) {
      setCooldown(15);
      warning('Bạn đang gửi tin nhắn quá nhanh. Vui lòng tạm nghỉ 15 giây để chuyên viên kịp xử lý nhé!', 'Tạm khóa gửi tin');
      return;
    }

    // 3. Chống gửi trùng lặp nội dung liên tiếp trong 30 giây
    if (
      lastSentContentRef.current.text.toLowerCase() === content.toLowerCase() &&
      now - lastSentContentRef.current.time < 30000
    ) {
      warning('Bạn vừa gửi nội dung này rồi. Vui lòng không gửi lặp lại và chờ chuyên viên phản hồi nhé!', 'Nội dung trùng lặp');
      return;
    }

    // 4. Giới hạn độ dài nội dung (tối đa 500 ký tự)
    if (content.length > 500) {
      warning('Tin nhắn quá dài (tối đa 500 ký tự). Vui lòng rút ngắn nội dung.', 'Tin nhắn quá dài');
      return;
    }

    setSending(true);
    try {
      const newMsg = await api.sendUserChatMessage(content);
      setInputValue('');
      setMessages((prev) => [...prev, newMsg]);
      if (newMsg.id > lastMsgIdRef.current) {
        lastMsgIdRef.current = newMsg.id;
      }

      // Cập nhật lịch sử gửi tin chống spam & khởi động cooldown 3 giây
      recentSendTimesRef.current.push(now);
      lastSentContentRef.current = { text: content, time: now };
      setCooldown(3);

      setTimeout(() => scrollToBottom(true), 50);
    } catch (err: any) {
      console.error('Lỗi gửi tin nhắn:', err);
      const errMsg = err?.message || 'Không thể gửi tin nhắn. Vui lòng thử lại sau.';
      if (err?.status === 429 || err?.status === 422) {
        warning(errMsg, 'Lưu ý gửi tin');
      } else {
        toastError(errMsg, 'Lỗi gửi tin');
      }
    } finally {
      setSending(false);
      setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 50);
    }
  };

  return (
    <div className={`fixed bottom-6 ${isOpen ? 'right-4 sm:right-6' : 'right-0'} z-50 select-none print:hidden`}>
      {/* 1. Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-2.5 pl-3.5 pr-5 py-3 bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 text-white font-bold text-sm rounded-l-full shadow-lg hover:shadow-2xl transition-transform duration-300 ease-out active:scale-95 cursor-pointer translate-x-[calc(100%-54px)] hover:translate-x-0"
          aria-label="Mở live chat hỗ trợ"
          title="Mở hỗ trợ trực tuyến 24/7"
        >
          <span className="relative flex h-3 w-3 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400"></span>
          </span>
          <MessageSquare size={19} className="group-hover:rotate-6 transition-transform shrink-0" />
          <span className="whitespace-nowrap">Hỗ trợ trực tuyến</span>
        </button>
      )}

      {/* 2. Chat Window Popup */}
      {isOpen && (
        <div
          ref={chatPopupRef}
          className="w-[360px] sm:w-[390px] h-[520px] max-h-[85vh] bg-white rounded-3xl shadow-2xl border border-cream-200 flex flex-col overflow-hidden animate-scale-up"
        >
          {/* Header */}
          <div className="px-5 py-4 bg-gradient-to-r from-ink-900 to-ink-800 text-white flex items-center justify-between shrink-0 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-2xl bg-accent-500/20 border border-accent-400/40 text-accent-400 flex items-center justify-center font-bold">
                  <Headphones size={20} />
                </div>
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-ink-900 rounded-full"></span>
              </div>
              <div>
                <h4 className="font-bold text-sm leading-tight flex items-center gap-1.5">
                  <span>Hỗ Trợ Khách Hàng</span>
                  <Sparkles size={13} className="text-amber-400" />
                </h4>
                <p className="text-[11px] text-ink-300 mt-0.5">Trực tuyến 24/7 • CameraHub</p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Đóng chat"
            >
              <X size={16} />
            </button>
          </div>

          {/* Thanh thông báo cam kết phản hồi */}
          <div className="px-3.5 py-2.5 bg-gradient-to-r from-amber-50 to-orange-50/70 border-b border-amber-200/80 flex items-center gap-2.5 text-ink-700 shrink-0 shadow-2xs">
            <div className="w-5 h-5 rounded-full bg-amber-500/15 flex items-center justify-center shrink-0">
              <Clock size={12} className="text-amber-600 animate-pulse" />
            </div>
            <p className="text-[11px] leading-tight text-amber-900/90 font-medium">
              Chuyên viên thường phản hồi sau <span className="font-bold text-amber-950 underline decoration-amber-400 decoration-1">3 - 5 phút</span>. Vui lòng đợi hoặc để lại SĐT/Mã đơn nhé!
            </p>
          </div>

          {/* Body / Messages */}
          <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-cream-50/60">
            {loading && messages.length === 0 ? (
              // Loading state
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-ink-400">
                <Loader2 size={24} className="animate-spin text-accent-500 mb-2" />
                <span className="text-xs">Đang kết nối lịch sử trò chuyện...</span>
              </div>
            ) : messages.length === 0 ? (
              // Empty conversation
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-accent-50 text-accent-600 flex items-center justify-center">
                  <MessageSquare size={22} />
                </div>
                <div>
                  <p className="font-bold text-xs text-ink-800">
                    Xin chào {user ? user.fullName : 'quý khách'}!
                  </p>
                  <p className="text-[11px] text-ink-500 mt-1">
                    Bạn cần tư vấn dòng máy ảnh, ống kính hay theo dõi tình trạng đơn hàng? Hãy gửi tin nhắn bên dưới nhé!
                  </p>
                </div>
              </div>
            ) : (
              // Messages list
              messages.map((msg) => {
                const isMe = user
                  ? String(msg.sender_id) === String(user.id)
                  : msg.sender?.role !== 'admin' && String(msg.sender?.id || '') !== '1';
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-end gap-1.5 max-w-[85%]">
                      {!isMe && (
                        <div className="w-6 h-6 rounded-full bg-ink-800 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mb-1">
                          Ad
                        </div>
                      )}
                      <div
                        className={`px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed shadow-2xs ${
                          isMe
                            ? 'bg-accent-500 text-white rounded-br-xs font-medium'
                            : 'bg-white border border-cream-200 text-ink-800 rounded-bl-xs font-normal'
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                      </div>
                    </div>
                    <span className="text-[10px] text-ink-400 mt-0.5 px-1">
                      {msg.created_at
                        ? new Date(msg.created_at).toLocaleTimeString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : ''}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer / Input */}
          {!user && (
            <div className="px-3.5 py-1.5 bg-cream-100/90 border-t border-cream-200 text-[11px] text-ink-600 flex items-center justify-between shrink-0">
              <span className="truncate">💡 Đang chat với tư cách Khách vãng lai</span>
              <button
                type="button"
                onClick={() => openAuthModal()}
                className="text-accent-600 hover:text-accent-700 font-bold underline cursor-pointer shrink-0 ml-2"
              >
                Đăng nhập
              </button>
            </div>
          )}
          <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-cream-200 flex items-center gap-2 shrink-0">
              <div className="relative flex-1">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={cooldown > 0 ? `Vui lòng đợi ${cooldown}s...` : 'Nhập tin nhắn tư vấn...'}
                  maxLength={500}
                  disabled={sending}
                  className="w-full pl-4 pr-16 py-2.5 bg-cream-50 border border-cream-200 rounded-2xl text-xs text-ink-900 focus:outline-none focus:border-accent-500 focus:bg-white transition-all disabled:opacity-70"
                />
                {inputValue.length > 400 && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-amber-600 select-none pointer-events-none">
                    {inputValue.length}/500
                  </span>
                )}
              </div>
              <button
                type="submit"
                disabled={!inputValue.trim() || sending || cooldown > 0}
                className="w-9 h-9 rounded-2xl bg-accent-500 hover:bg-accent-600 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center transition-all cursor-pointer shrink-0 shadow-2xs active:scale-95"
                title={cooldown > 0 ? `Vui lòng đợi ${cooldown} giây` : 'Gửi tin nhắn'}
              >
                {sending ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : cooldown > 0 ? (
                  <span className="text-[11px] font-bold">{cooldown}s</span>
                ) : (
                  <Send size={15} />
                )}
              </button>
            </form>
        </div>
      )}
    </div>
  );
};
