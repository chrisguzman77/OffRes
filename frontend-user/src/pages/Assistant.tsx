import { useState, useRef, useEffect } from 'react';
import { apiPost } from '../utils/api';
import LoadingDots from '../components/LoadingDots';

export default function Assistant() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

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
      const res = await apiPost('/llm/ask', { question });

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: res.answer, context: res.context_used },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Error: ${err.message}` },
      ]);
    }

    setLoading(false);
  };

  return <div><h1>Assistant</h1></div>;
}
