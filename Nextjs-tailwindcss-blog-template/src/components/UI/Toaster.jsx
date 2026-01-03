'use client';
import React, { useEffect, useState } from 'react';

export default function Toaster({ messages = [] }) {
  const [list, setList] = useState(messages);

  useEffect(() => setList(messages), [messages]);

  return (
    <div className="fixed right-4 top-4 z-50 flex flex-col gap-2">
      {list.map((m) => (
        <div key={m.id} className={`max-w-sm px-4 py-2 rounded shadow transform transition-all duration-300 ${m.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-green-50 border-green-200 text-green-800'}`}>
          <div className="flex items-start gap-3">
            <div className="flex-1 text-sm font-medium">{m.title}</div>
            <div className="text-xs opacity-70">{m.time}</div>
          </div>
          {m.body && <div className="text-xs mt-1 opacity-90">{m.body}</div>}
        </div>
      ))}
    </div>
  );
}
