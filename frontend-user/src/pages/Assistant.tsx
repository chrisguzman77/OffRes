import { useState, useRef, useEffect, useCallback, type KeyboardEvent } from 'react';
import { apiPost } from '../utils/api';
import LoadingDots from '../components/LoadingDots';
import KioskScreenKeyboard from '../components/KioskScreenKeyboard';
import { blurActiveElement } from '../utils/keyboardFocus';

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

const bubbleRadius = 'var(--radius-lg)';

export default function Assistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showOsk, setShowOsk] = useState(false);
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
    setShowOsk(false);
    blurActiveElement();
  }, [input, loading]);

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSubmit();
    }
  };

  const openEmbeddedKeyboard = () => {
    queueMicrotask(() => setShowOsk(true));
  };

  return (
    <div>
      <h1 className="page-title-mobile-only">
        Ask anything <span className="text-highlight">offline</span>
      </h1>
      <p className="page-subtitle" style={{ color: 'var(--text-muted)', fontSize: '1rem', marginBottom: '20px', maxWidth: '50ch' }}>
        Safety and preparedness answers from the model on this device — no cloud required.
      </p>

      {/* Input at top so the on-screen keyboard (bottom) does not cover what you type */}
      <div
        className="terminal-card assistant-input-sticky"
        style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}
      >
        <div style={{ display: 'flex', gap: '10px', alignItems: 'stretch' }}>
          <input
            className="terminal-input touch-keyboard-field"
            style={{ flex: 1, minWidth: 0, boxSizing: 'border-box' }}
            type="text"
            inputMode="text"
            enterKeyHint="send"
            autoComplete="off"
            autoCorrect="off"
            placeholder="Ask a question…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onPointerDown={openEmbeddedKeyboard}
            onKeyDown={onKeyDown}
            disabled={loading}
          />
          <button
            type="button"
            className="btn-terminal btn-terminal--secondary btn-terminal--inline"
            style={{ minWidth: '52px', paddingLeft: '12px', paddingRight: '12px' }}
            onClick={openEmbeddedKeyboard}
            disabled={loading}
            aria-label="Show on-screen keyboard"
            title="Show keyboard"
          >
            ⌨
          </button>
        </div>
        <button
          type="button"
          className="btn-terminal"
          onClick={() => void handleSubmit()}
          disabled={loading || !input.trim()}
        >
          Send
        </button>
      </div>

      <div className="assistant-layout-wide">
        <div>
          <div className="terminal-card feature-card--sky" style={{ marginBottom: '16px' }}>
            <h2>Disaster chatbot</h2>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', lineHeight: 1.55, margin: 0 }}>
              Connected via <span className="code-inline">POST /llm/ask</span>. RAG may add local context when
              available.
            </p>
          </div>
        </div>

        <div>
          <div
            className="terminal-card"
            style={{
              minHeight: '200px',
              maxHeight: 'min(52vh, 480px)',
              overflowY: 'auto',
              marginBottom: '0',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            {messages.length === 0 && !loading && (
              <p style={{ fontSize: '0.95rem', color: 'var(--text-dim)', margin: 0 }}>
                No messages yet. Try: &quot;What should I do during a flood?&quot;
              </p>
            )}

            {messages.map((m, i) => (
              <div
                key={`${i}-${m.role}-${m.content.slice(0, 24)}`}
                style={{
                  alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '94%',
                }}
              >
                <div
                  style={{
                    fontSize: '0.68rem',
                    color: 'var(--text-dim)',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    marginBottom: '6px',
                    letterSpacing: '0.06em',
                  }}
                >
                  {m.role === 'user' ? 'You' : 'Assistant'}
                </div>
                <div
                  style={{
                    padding: '14px 16px',
                    borderRadius: bubbleRadius,
                    border: '1px solid var(--border)',
                    background: m.role === 'user' ? 'var(--surface-elevated)' : 'var(--accent-teal-muted)',
                    fontSize: '0.92rem',
                    lineHeight: 1.55,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    fontFamily: 'var(--font-body)',
                    color: 'var(--text-body)',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  {m.content}
                </div>
                {m.role === 'assistant' && (m.model || m.context_used) && (
                  <div
                    style={{
                      marginTop: '8px',
                      fontSize: '0.68rem',
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
                    fontSize: '0.68rem',
                    color: 'var(--text-dim)',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    marginBottom: '6px',
                    letterSpacing: '0.06em',
                  }}
                >
                  Assistant
                </div>
                <div
                  style={{
                    padding: '14px 16px',
                    borderRadius: bubbleRadius,
                    border: '2px dashed var(--border-bright)',
                    fontSize: '0.92rem',
                    background: 'var(--surface-elevated)',
                  }}
                >
                  <LoadingDots />
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        </div>
      </div>

      {showOsk && (
        <KioskScreenKeyboard
          value={input}
          onChange={setInput}
          mode="text"
          onClose={() => {
            setShowOsk(false);
            blurActiveElement();
          }}
        />
      )}
    </div>
  );
}
