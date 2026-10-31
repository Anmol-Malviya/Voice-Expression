import apiClient from '@/lib/api-client';
import { Message, CandidateReply } from '@/types';

export interface AIResponsePayload {
  suggested_response: string;
  alternative_suggestions: string[];
  intent_classification: string;
  confidence: number;
  explanation?: string;
  rationale?: string;
  is_proposal: boolean;
  requires_confirmation: boolean;
  inference_id: string;
  candidates: CandidateReply[];
  needs_clarification: boolean;
  signals_used: string[];
  created_at: string;
}

export interface AISuggestionPayload {
  original_text: string;
  suggested_response: string;
  alternative_suggestions: string[];
  intent: string;
  confidence: number;
  candidates: CandidateReply[];
  is_proposal: boolean;
  requires_confirmation: boolean;
  inference_id: string;
  explanation?: string;
}

class MessageService {
  async getMessages(conversationId: string): Promise<Message[]> {
    try {
      const response = await apiClient.get<any>(`/conversations/${conversationId}/messages`);
      const items = Array.isArray(response.data)
        ? response.data
        : (response.data?.items || response.data?.data || []);

      if (items && items.length > 0) {
        return items.map((m: any) => ({
          id: m.id || m._id,
          conversation_id: m.conversation_id || conversationId,
          sender: m.sender || 'user',
          content: m.content || m.text || '',
          timestamp: m.timestamp || (m.created_at ? m.created_at.substring(11, 19) : '12:00:00'),
          type: m.type || m.message_type || 'text',
          fusedSignals: m.fusedSignals || (m.metadata && m.metadata.fusedSignals) || undefined,
          isSpoken: m.isSpoken || m.message_type === 'tts_spoken' || m.type === 'tts_spoken',
          audioUrl: m.audio_url || undefined,
        }));
      }
    } catch {}

    // Fallback demonstration messages if empty
    return [
      {
        id: 'msg_init_1',
        conversation_id: conversationId,
        sender: 'partner',
        content: 'Hello! How are you feeling today?',
        timestamp: '11:15:02',
        type: 'speech_transcription',
      },
      {
        id: 'msg_init_2',
        conversation_id: conversationId,
        sender: 'user',
        content: 'I am doing well, thank you.',
        timestamp: '11:15:30',
        type: 'tts_spoken',
        isSpoken: true,
      },
    ];
  }

  async sendMessage(conversationId: string, content: string, type: Message['type'] = 'text'): Promise<Message> {
    const newMessage: Message = {
      id: 'msg_' + Date.now(),
      conversation_id: conversationId,
      sender: 'user',
      content,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      type,
    };

    try {
      const response = await apiClient.post<any>('/messages', {
        conversation_id: conversationId,
        content,
        text: content,
        sender: 'user',
        type,
        message_type: type,
      });
      const data = response.data?.data || response.data;
      if (data && (data.id || data._id)) {
        newMessage.id = data.id || data._id;
      }
    } catch {}

    return newMessage;
  }

  /**
   * Real OpenAI / Assistive AI response API call.
   * Calls POST /api/v1/ai/respond with conversation context.
   */
  async getAIResponse(params: {
    conversationId: string;
    userMessage: string;
    conversationContext?: any[];
    language?: string;
    gesture?: string;
    lipActive?: boolean;
  }): Promise<AIResponsePayload> {
    const response = await apiClient.post<AIResponsePayload>('/ai/respond', {
      conversation_id: params.conversationId,
      user_message: params.userMessage,
      partner_text: params.userMessage,
      conversation_context: params.conversationContext,
      preferred_language: params.language || 'en',
      gesture: params.gesture,
      lip_active: params.lipActive ?? false,
    });
    return response.data;
  }

  /**
   * Real AI Suggestion API call for rough text/shorthand (e.g. 'I water').
   * Calls POST /api/v1/ai/suggest.
   */
  async getAISuggestions(params: {
    text: string;
    conversationId?: string;
    language?: string;
  }): Promise<AISuggestionPayload> {
    const response = await apiClient.post<AISuggestionPayload>('/ai/suggest', {
      text: params.text,
      conversation_id: params.conversationId,
      language: params.language || 'en',
    });
    return response.data;
  }

  /**
   * Generates candidate replies using real /ai/respond or /ai/suggest endpoint,
   * falling back to local heuristic candidates if server is offline.
   */
  async generateCandidates(context: {
    conversationId?: string;
    lastPartnerSpeech?: string;
    detectedGesture?: string;
    language?: string;
  }): Promise<CandidateReply[]> {
    try {
      const resp = await apiClient.post<any>('/ai/respond', {
        conversation_id: context.conversationId || 'active_session',
        user_message: context.lastPartnerSpeech || '',
        partner_text: context.lastPartnerSpeech || '',
        gesture: context.detectedGesture || 'none',
        preferred_language: context.language || 'en',
      });

      if (resp.data && Array.isArray(resp.data.candidates) && resp.data.candidates.length > 0) {
        return resp.data.candidates;
      }
    } catch {}

    // Contextual local fallback suggestions with confidence rankings
    const partnerText = (context.lastPartnerSpeech || '').toLowerCase();
    const gesture = context.detectedGesture || 'none';

    if (gesture === 'thumbs_up') {
      return [
        { candidate_id: 'c1', text: 'Yes, that sounds perfect.', reason: 'Fused thumbs-up gesture with conversation agreement', confidence: 0.95 },
        { candidate_id: 'c2', text: 'I agree completely.', reason: 'Affirmative gesture context', confidence: 0.89 },
        { candidate_id: 'c3', text: 'Thank you for checking with me.', reason: 'Polite acknowledgment', confidence: 0.78 },
      ];
    }

    if (gesture === 'open_palm') {
      return [
        { candidate_id: 'c1', text: 'Please wait a moment.', reason: 'Fused open-palm gesture indicates wait request', confidence: 0.94 },
        { candidate_id: 'c2', text: 'Give me a second to answer.', reason: 'Clarification pause intention', confidence: 0.86 },
      ];
    }

    if (partnerText.includes('water') || partnerText.includes('drink')) {
      return [
        { candidate_id: 'c1', text: 'Yes, please get me some water.', reason: 'Direct response to drink offer', confidence: 0.96 },
        { candidate_id: 'c2', text: 'No thank you, I am fine.', reason: 'Polite decline', confidence: 0.88 },
        { candidate_id: 'c3', text: 'Could I have warm tea instead?', reason: 'Alternative request', confidence: 0.81 },
      ];
    }

    if (partnerText.includes('how') || partnerText.includes('feeling')) {
      return [
        { candidate_id: 'c1', text: 'I am doing okay, thank you.', reason: 'Standard polite status response', confidence: 0.92 },
        { candidate_id: 'c2', text: 'I feel a bit tired today.', reason: 'Expressing fatigue', confidence: 0.85 },
        { candidate_id: 'c3', text: 'I am not feeling very well.', reason: 'Request for medical / comfort attention', confidence: 0.79 },
      ];
    }

    // Default high-probability assistive replies
    return [
      { candidate_id: 'c1', text: 'Yes, thank you.', reason: 'Polite agreement', confidence: 0.90 },
      { candidate_id: 'c2', text: 'Please give me a minute.', reason: 'Assistive response buffer', confidence: 0.84 },
      { candidate_id: 'c3', text: 'Could you please repeat that?', reason: 'Clarification request', confidence: 0.80 },
    ];
  }

  /**
   * Confirmation Gate API Call
   */
  async confirmProposal(
    sessionId: string,
    action: 'confirm' | 'edit' | 'reject',
    editedText?: string
  ): Promise<{ confirmation_id: string; status: string; confirmed_text: string | null }> {
    const res = await apiClient.post<any>(`/sessions/${sessionId}/confirmations`, {
      action,
      edited_text: editedText,
    });
    return res.data;
  }
}

export const messageService = new MessageService();
export default messageService;
