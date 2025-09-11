'use client';

import { useState } from 'react';

export default function Page() {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleSend() {
    setIsLoading(true);
    setResponse('');
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });

    const reader = res.body?.getReader();
    const decoder = new TextDecoder();
    let done = false;

    while (!done) {
      const { value, done: doneReading } = await reader!.read();
      done = doneReading;
      const chunkValue = decoder.decode(value);
      setResponse((prev) => prev + chunkValue);
    }
    setIsLoading(false);
  }

  return (
    <div className="p-5">
      <h1 className="text-2xl font-bold mb-4">Vercel AI Gateway Chat</h1>
      <div className="flex gap-2 mb-4">
        <input
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder="Type your prompt..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded"
        />
        <button
          onClick={handleSend}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-400"
        >
          {isLoading ? 'Sending...' : 'Send'}
        </button>
      </div>
      <div className="mt-5">
        <strong>Response:</strong>
        <div className="mt-2 p-3 bg-gray-100 rounded whitespace-pre-wrap">{response}</div>
      </div>
    </div>
  );
}
