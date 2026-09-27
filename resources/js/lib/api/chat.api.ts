import type { ChatMessage, ChatUserItem } from '../../types';
import { request } from './client';

export const chatApi = {
  // ==========================================
  // Lab 07: Live Chat APIs (User & Admin)
  // ==========================================
  getUserChatMessages: (afterId?: number) =>
    request<ChatMessage[]>(`/user/chat/messages${afterId ? '?after_id=' + afterId : ''}`),

  sendUserChatMessage: (message: string) =>
    request<ChatMessage>('/user/chat/send', {
      method: 'POST',
      body: JSON.stringify({ message }),
    }),

  getAdminChatUsers: () =>
    request<ChatUserItem[]>('/admin/chat/users'),

  getAdminChatUnreadCount: () =>
    request<{ unread_count: number }>('/admin/chat/unread-count?refresh=1'),

  getAdminChatMessages: (userId: number | string, afterId?: number) =>
    request<ChatMessage[]>(`/admin/chat/messages/${userId}${afterId ? '?after_id=' + afterId : ''}`),

  sendAdminChatMessage: (userId: number | string, message: string) =>
    request<ChatMessage>('/admin/chat/send', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, message }),
    }),
};
