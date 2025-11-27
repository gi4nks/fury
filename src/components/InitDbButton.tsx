'use client';

import { useState } from 'react';

export default function InitDbButton() {
  const [isInitializing, setIsInitializing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleInit = async () => {
    setIsInitializing(true);
    setMessage(null);

    try {
      const response = await fetch('/api/init-db', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        setMessage('Database initialized successfully!');
        // Reload the page to update stats
        setTimeout(() => window.location.reload(), 1000);
      } else {
        setMessage(`Error: ${data.message}`);
      }
    } catch (error) {
      setMessage(`Error: ${(error as Error).message}`);
    } finally {
      setIsInitializing(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        onClick={handleInit}
        disabled={isInitializing}
        className="btn btn-secondary"
      >
        {isInitializing ? 'Initializing...' : 'Initialize Database'}
      </button>
      {message && (
        <p className={`text-sm ${message.includes('Error') ? 'text-error' : 'text-success'}`}>
          {message}
        </p>
      )}
    </div>
  );
}