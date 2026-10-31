import apiClient from '@/lib/api-client';
import { ConversationSession, ConversationSummary, CreateConversationDto } from '@/types';

const LOCAL_STORAGE_CONVERSATIONS_KEY = 'voice_conversations_cache';

const INITIAL_CONVERSATIONS: ConversationSummary[] = [
  {
    id: 'sess_101',
    title: 'Consultation with Caregiver',
    date: '31 Oct 2026',
    time: '11:15 AM',
    updated_at: '10 mins ago',
    language: 'English',
    messages_count: 8,
    last_message_preview: 'Yes, please get me some water.',
    status: 'active',
  },
  {
    id: 'sess_102',
    title: 'Lunch with Family',
    date: '30 Oct 2026',
    time: '01:30 PM',
    updated_at: 'Yesterday',
    language: 'Hinglish',
    messages_count: 14,
    last_message_preview: 'Thank you, food was very good.',
    status: 'completed',
  },
  {
    id: 'sess_103',
    title: 'Morning Therapy Session',
    date: '29 Oct 2026',
    time: '09:00 AM',
    updated_at: '2 days ago',
    language: 'English',
    messages_count: 12,
    last_message_preview: 'I am ready for the physical exercise.',
    status: 'completed',
  },
];

class ConversationService {
  private getLocalConversations(): ConversationSummary[] {
    if (typeof window === 'undefined') return INITIAL_CONVERSATIONS;
    const stored = localStorage.getItem(LOCAL_STORAGE_CONVERSATIONS_KEY);
    if (!stored) {
      localStorage.setItem(LOCAL_STORAGE_CONVERSATIONS_KEY, JSON.stringify(INITIAL_CONVERSATIONS));
      return INITIAL_CONVERSATIONS;
    }
    try {
      return JSON.parse(stored);
    } catch {
      return INITIAL_CONVERSATIONS;
    }
  }

  private setLocalConversations(convs: ConversationSummary[]): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_CONVERSATIONS_KEY, JSON.stringify(convs));
    }
  }

  async getConversations(): Promise<ConversationSummary[]> {
    try {
      const response = await apiClient.get<any>('/conversations');
      const items = Array.isArray(response.data)
        ? response.data
        : (response.data?.items || response.data?.data || []);

      if (items && items.length > 0) {
        // Format for list rendering
        return items.map((c: any) => ({
          id: c.id || c._id || c.session_id,
          title: c.title || 'Live Assistive Session',
          date: c.created_at ? c.created_at.substring(0, 10) : 'Today',
          time: c.created_at && c.created_at.length >= 16 ? c.created_at.substring(11, 16) : undefined,
          updated_at: c.updated_at || 'Just now',
          language: c.language || 'English',
          messages_count: c.messages_count || 0,
          last_message_preview: c.last_message_preview || undefined,
          status: c.status || 'active',
        }));
      }
    } catch {}
    return this.getLocalConversations();
  }

  async getConversationById(id: string): Promise<ConversationSession> {
    try {
      const response = await apiClient.get<any>(`/conversations/${id}`);
      const data = response.data?.data || response.data;
      if (data && (data.id || data._id)) {
        return {
          id: data.id || data._id,
          title: data.title || 'Live Assistive Session',
          language: data.language || 'English',
          mode: data.mode || 'live_conversation',
          created_at: data.created_at || new Date().toISOString(),
          updated_at: data.updated_at || new Date().toISOString(),
          status: data.status || 'active',
          messages_count: data.messages_count || 0,
        };
      }
    } catch {}

    const localList = this.getLocalConversations();
    const found = localList.find(c => c.id === id);
    return {
      id,
      title: found ? found.title : 'Live Conversation Session',
      language: found ? found.language : 'English',
      mode: 'live_conversation',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: 'active',
      messages_count: found ? found.messages_count : 0,
    };
  }

  async createConversation(dto: CreateConversationDto): Promise<ConversationSession> {
    try {
      const response = await apiClient.post<any>('/conversations', {
        title: dto.title || 'New Assistive Conversation',
        language: dto.language || 'en',
        mode: dto.mode || 'live_conversation',
      });
      const data = response.data?.data || response.data;
      if (data && (data.id || data._id || data.session_id)) {
        const convId = data.id || data._id || data.session_id;
        const newSummary: ConversationSummary = {
          id: convId,
          title: data.title || dto.title || 'New Assistive Conversation',
          date: 'Today',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          updated_at: 'Just now',
          language: dto.language || 'English',
          messages_count: 0,
          status: 'active',
        };
        const cur = this.getLocalConversations();
        this.setLocalConversations([newSummary, ...cur]);
        return {
          id: convId,
          title: newSummary.title,
          language: newSummary.language,
          mode: dto.mode || 'live_conversation',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          status: 'active',
          messages_count: 0,
        };
      }
    } catch {}

    const newId = 'sess_' + Date.now();
    const newSession: ConversationSession = {
      id: newId,
      title: dto.title || 'New Assistive Conversation',
      language: dto.language || 'en',
      mode: dto.mode || 'live_conversation',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: 'active',
      messages_count: 0,
    };

    const newSummary: ConversationSummary = {
      id: newId,
      title: newSession.title,
      date: 'Today',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      updated_at: 'Just now',
      language: dto.language || 'English',
      messages_count: 0,
      status: 'active',
    };

    const cur = this.getLocalConversations();
    this.setLocalConversations([newSummary, ...cur]);
    return newSession;
  }

  async deleteConversation(id: string): Promise<boolean> {
    try {
      await apiClient.delete(`/conversations/${id}`);
    } catch {}
    const cur = this.getLocalConversations();
    const filtered = cur.filter(c => c.id !== id);
    this.setLocalConversations(filtered);
    return true;
  }

  exportConversation(title: string, messages: { sender: string; text: string; time?: string }[]): void {
    const formatted = messages
      .map(m => `[${m.time || ''}] ${m.sender === 'user' ? 'Me' : 'Partner'}: ${m.text}`)
      .join('\n');
    
    const blob = new Blob([formatted], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title.replace(/[^a-zA-Z0-9_-]/g, '_')}_transcript.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }
}

export const conversationService = new ConversationService();
export default conversationService;
