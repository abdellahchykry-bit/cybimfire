"use client";

import { useState, useEffect } from 'react';

const Clock = () => {
  const [time, setTime] = useState('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }));
    };

    updateClock(); // Set initial time
    const timerId = setInterval(updateClock, 1000);

    return () => clearInterval(timerId);
  }, []);

  return (
    <div className="text-4xl font-headline text-primary tabular-nums">
      {time || '00:00'}
    </div>
  );
};

export default Clock;
