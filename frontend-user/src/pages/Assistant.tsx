import { useState, useRef, useEffect } from 'react';
import { apiPost } from '../utils/api';
import LoadingDots from '../components/LoadingDots';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  context?: string;
}

export default function Assistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSubmit = async () => {
    if (!input.trim() || loading) return;

    const question = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: question }]);
    setLoading(true);

    try {
      const res = await apiPost<{
        answer: string;
        context_used: string;
      }>('/llm/ask', { question });

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: res.answer, context: res.context_used },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Error: ${err.message}` },
      ]);
    }

    setLoading(false);
  };

  return (
    <div>
      <h1>Assistant</h1>

      {/* Chat messages */}
      <div
        style={{
          minHeight: '300px',
          maxHeight: '55vh',
          overflowY: 'auto',
          marginBottom: '12px',
        }}
      >
        {messages.length === 0 && (
          <div className="terminal-card" style={{ textAlign: 'center' }}>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>
              Ask a question about disaster preparedness, first aid, evacuation,
              water safety, or sheltering.
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className="terminal-card"
            style={{
              borderLeft:
                msg.role === 'user'
                  ? '3px solid var(--terminal-green)'
                  : '3px solid var(--terminal-green-dark)',
            }}
          >
            <div
              style={{
                fontSize: '0.7rem',
                color: 'var(--text-dim)',
                textTransform: 'uppercase',
                marginBottom: '6px',
              }}
            >
              {msg.role === 'user' ? '> You' : '> DisasterPi'}
            </div>
            <div
              style={{
                fontSize: '0.85rem',
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap',
                color:
                  msg.role === 'user'
                    ? 'var(--terminal-green)'
                    : 'var(--text-secondary)',
              }}
            >
              {msg.content}
            </div>
            {msg.context && (
              <div
                style={{
                  fontSize: '0.7rem',
                  color: 'var(--text-dim)',
                  marginTop: '8px',
                  fontStyle: 'italic',
                }}
              >
                Sources: {msg.context}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="terminal-card">
            <LoadingDots />
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          className="terminal-input"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSubmit();
          }}
          placeholder="Ask a question..."
          disabled={loading}
          style={{ flex: 1 }}
        />
        <button
          className="btn-terminal"
          onClick={handleSubmit}
          disabled={loading || !input.trim()}
          style={{ width: 'auto', padding: '12px 20px' }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
