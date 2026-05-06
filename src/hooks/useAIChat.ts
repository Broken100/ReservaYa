import { useState, useCallback, useRef, useEffect } from 'react';
import { sendChatMessage } from '../lib/geminiClient';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export function useAIChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: '¡Hola! Soy tu asistente virtual de ReservaYa. ¿En qué puedo ayudarte?' },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      containerRef.current?.scrollTo({ top: containerRef.current.scrollHeight, behavior: 'smooth' });
    }, 100);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;
    setError(null);

    const userMsg: ChatMessage = { role: 'user', content: content.trim() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const result = await sendChatMessage([...messages, userMsg], 'general');
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
  }, [messages]);

  return { messages, loading, error, sendMessage, containerRef };
}
