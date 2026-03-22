import { useState, useRef, useEffect, useCallback, type KeyboardEvent } from 'react';
import { apiPost } from '../utils/api';
import LoadingDots from '../components/LoadingDots';

interface LLMAskResponse {
  question: string;
  answer: string;
  context_used: string;
  model: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  context_used?: string;
  model?: string;
}

export default function Assistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSubmit = useCallback(async () => {
    if (!input.trim() || loading) return;

    const question = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: question }]);
    setLoading(true);

    try {
      const res = await apiPost<LLMAskResponse>('/llm/ask', { question });

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: res.answer,
          context_used: res.context_used,
          model: res.model,
        },
      ]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Request failed';
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Could not reach the LLM (${msg}). Is the backend running on port 8000?`,
        },
      ]);
    }

    setLoading(false);
  }, [input, loading]);

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSubmit();
    }
  };

  return (
    <div>
      <h1>Assistant</h1>

      <div className="terminal-card" style={{ marginBottom: '12px' }}>
        <h2 style={{ fontSize: '0.85rem', marginBottom: '8px' }}>[ Disaster chatbot ]</h2>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', lineHeight: 1.5, margin: 0 }}>
          Connected to your local model via{' '}
          <code style={{ color: 'var(--terminal-green-dim)' }}>POST /llm/ask</code>
          . Ask preparedness and safety questions; answers may use RAG context when available.
        </p>
      </div>

      <div
        className="terminal-card"
        style={{
          minHeight: '220px',
          maxHeight: 'min(50vh, 420px)',
          overflowY: 'auto',
          marginBottom: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        {messages.length === 0 && !loading && (
          <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', margin: 0 }}>
            No messages yet. Try: &quot;What should I do during a flood?&quot;
          </p>
        )}

        {messages.map((m, i) => (
          <div
            key={`${i}-${m.role}-${m.content.slice(0, 24)}`}
            style={{
              alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '92%',
            }}
          >
            <div
              style={{
                fontSize: '0.65rem',
                color: 'var(--text-dim)',
                textTransform: 'uppercase',
                marginBottom: '4px',
                letterSpacing: '0.05em',
              }}
            >
              {m.role === 'user' ? 'You' : 'LLM'}
            </div>
            <div
              style={{
                padding: '10px 12px',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--border)',
                background:
                  m.role === 'user' ? 'var(--bg-secondary)' : 'rgba(0, 255, 136, 0.06)',
                fontSize: '0.85rem',
                lineHeight: 1.5,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                fontFamily: m.role === 'assistant' ? 'var(--font-body)' : 'inherit',
              }}
            >
              {m.content}
            </div>
            {m.role === 'assistant' && (m.model || m.context_used) && (
              <div
                style={{
                  marginTop: '6px',
                  fontSize: '0.65rem',
                  color: 'var(--text-dim)',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                {m.model && <span>model: {m.model}</span>}
                {m.model && m.context_used && <span> · </span>}
                {m.context_used && <span>context: {m.context_used}</span>}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div style={{ alignSelf: 'flex-start' }}>
            <div
              style={{
                fontSize: '0.65rem',
                color: 'var(--text-dim)',
                textTransform: 'uppercase',
                marginBottom: '4px',
              }}
            >
              LLM
            </div>
            <div
              style={{
                padding: '10px 12px',
                borderRadius: 'var(--radius)',
                border: '1px dashed var(--border-bright)',
                fontSize: '0.85rem',
              }}
            >
              <LoadingDots />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="terminal-card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <input
          className="terminal-input"
          type="text"
          placeholder="Ask a question…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          disabled={loading}
          style={{ width: '100%', boxSizing: 'border-box' }}
        />
        <button
          type="button"
          className="btn-terminal"
          onClick={() => void handleSubmit()}
          disabled={loading || !input.trim()}
        >
          Send
        </button>
      </div>
    </div>
  );
}
