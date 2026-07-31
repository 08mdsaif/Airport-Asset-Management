import { useState, useRef, useEffect } from 'react';
import { Bot, Send, Sparkles } from 'lucide-react';
import api from '../../api/axios';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const ChatAssistant = () => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hi! I'm AAI Assist. Ask me about assets, complaints, or maintenance procedures." },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMessage: Message = { role: 'user', content: input.trim() };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);

    try {
      const { data } = await api.post('/ai/chat', {
        message: userMessage.content,
        history: nextMessages.slice(-8),
      });
      setMessages((prev) => [...prev, { role: 'assistant', content: data.data.reply }]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I ran into an issue reaching the AI service. Please try again.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card flex h-[520px] flex-col p-4">
      <div className="mb-3 flex items-center gap-2">
        <Sparkles size={18} className="text-primary-500" />
        <h3 className="font-semibold text-sm">AAI Assist (AI Chat Assistant)</h3>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto pr-1">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] rounded-xl px-3 py-2 text-sm whitespace-pre-wrap ${
                m.role === 'user'
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100'
              }`}
            >
              {m.role === 'assistant' && <Bot size={14} className="mb-1 inline-block mr-1" />}
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="rounded-xl bg-gray-100 dark:bg-gray-700 px-3 py-2 text-sm text-gray-400">Thinking...</div>
          </div>
        )}
      </div>

      <div className="mt-3 flex gap-2">
        <input
          className="input-field"
          placeholder="Ask a question..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
        />
        <button onClick={send} disabled={loading} className="btn-primary px-3">
          <Send size={16} />
        </button>
      </div>
    </div>
  );
};

export default ChatAssistant;
