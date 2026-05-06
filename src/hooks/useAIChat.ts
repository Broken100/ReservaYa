import { useState, useCallback, useRef, useEffect } from 'react';
import { sendChatMessage } from '../lib/geminiClient';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export function useAIChat(businessName?: string, mode: 'general' | 'booking_assistant' = 'general') {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: '¡Hola! Soy tu asistente virtual de ReservaYa. ¿En qué puedo ayudarte?' },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      containerRef.current?.scrollTo({ top: containerRef.current.scrollHeight, behavior: 'smooth' });
    }, 100);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (businessName && mode === 'booking_assistant') {
      setMessages(prev => {
        if (prev.length > 1) return prev;
        return [
          { role: 'assistant', content: `¡Hola! Soy el asistente de ${businessName}. ¿Te puedo ayudar a agendar una cita o resolver dudas sobre nuestros servicios?` },
        ];
      });
    }
  }, [businessName, mode]);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;
    setError(null);

    const userMsg: ChatMessage = { role: 'user', content: content.trim() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const result = await sendChatMessage([...messagesRef.current, userMsg], mode);
      if (result.error) {
        setError(result.error);
      } else if (result.text) {
        setMessages(prev => [...prev, { role: 'assistant', content: result.text! }]);
      }
    } catch {
      setError('Error al conectar con el asistente.');
    } finally {
      setLoading(false);
    }
  }, [mode]);

  const clearChat = useCallback(() => {
    setMessages([
      { role: 'assistant', content: businessName && mode === 'booking_assistant' 
        ? `¡Hola! Soy el asistente de ${businessName}. ¿Te puedo ayudar?` 
        : '¡Hola! Soy tu asistente virtual de ReservaYa. ¿En qué puedo ayudarte?' 
      },
    ]);
    setError(null);
  }, [businessName, mode]);

  return { messages, loading, error, sendMessage, clearChat, containerRef };
}