"use client";

import { useState, useEffect } from 'react';

const Clock = () => {
  const [time, setTime] = useState('');
  const [date, setDate] = useState('');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const updateClock = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }));
      setDate(now.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
    };

    updateClock();
    const timerId = setInterval(updateClock, 1000);

    return () => clearInterval(timerId);
  }, []);

  if (!isClient) {
    return (
        <div className="text-right">
            <div className="text-4xl font-headline text-primary tabular-nums">
                00:00:00
            </div>
            <div className="text-sm text-muted-foreground">
                &nbsp;
            </div>
        </div>
    )
  }

  return (
    <div className="text-right">
      <div className="text-4xl font-headline text-primary tabular-nums">
        {time}
      </div>
      <div className="text-sm text-muted-foreground">
        {date}
      </div>
    </div>
  );
};

export default Clock;
