import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Card, CardContent } from './components/ui/card';

function App() {
  const [conversationId] = useState(uuidv4()); // persist per session
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<{ role: string; content: string }[]>(
    []
  );
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!prompt.trim()) return;
    const newMessage = { role: 'user', content: prompt };
    setMessages((prev) => [...prev, newMessage]);
    setPrompt('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, convesrationId: conversationId }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: data.message },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: data.error || 'Error occurred' },
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: '⚠️ Failed to connect to server.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 p-4">
      <h1 className="text-2xl font-bold text-center mb-4">🧠 LLM Chatbot</h1>

      {/* Messages */}
      <Card className="flex-1 overflow-y-auto p-4 space-y-3 mb-4">
        <CardContent className="flex flex-col space-y-3">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`p-2 rounded-lg max-w-md ${
                msg.role === 'user'
                  ? 'bg-blue-500 text-white self-end'
                  : 'bg-gray-200 text-gray-900 self-start'
              }`}
            >
              {msg.content}
            </div>
          ))}
          {loading && <div className="italic text-gray-500">Thinking...</div>}
        </CardContent>
      </Card>

      {/* Input box */}
      <div className="flex space-x-2">
        <Input
          type="text"
          placeholder="Type your message..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
        />
        <Button onClick={sendMessage} disabled={loading}>
          Send
        </Button>
      </div>
    </div>
  );
}

export default App;
