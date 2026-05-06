import { supabase } from './supabaseClient';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  mode?: 'general' | 'booking_assistant';
}

interface ChatResponse {
  text?: string;
  error?: string;
}

export async function sendChatMessage(
  messages: ChatMessage[],
  mode: 'general' | 'booking_assistant' = 'general'
): Promise<ChatResponse> {
  try {
    const { data, error } = await supabase.functions.invoke<ChatResponse>(
      'gemini-chat',
      {
        body: { messages, mode } as ChatRequest,
      }
    );

    if (error) {
      console.error('[GeminiClient] Edge function error:', error);
      return { error: 'Error al comunicarse con el asistente IA.' };
    }

    return data as ChatResponse;
  } catch (err) {
    console.error('[GeminiClient] Unexpected error:', err);
    return { error: 'Error inesperado. Intenta de nuevo.' };
  }
}
