"use client";
import React, { useState, useEffect, useRef } from 'react';

interface ScrambleTextProps {
  text: string;
  className?: string;
  hoverTrigger?: boolean;
}

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&';

const ScrambleText: React.FC<ScrambleTextProps> = ({ text, className = '', hoverTrigger = false }) => {
  const [displayText, setDisplayText] = useState(text);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [isHovering, setIsHovering] = useState(false);

  const scramble = () => {
    let iteration = 0;
    
    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      setDisplayText(prev => 
        text
          .split('')
          .map((letter, index) => {
            if (index < iteration) {
              return text[index];
            }
            return CHARS[Math.floor(Math.random() * CHARS.length)];
          })
          .join('')
      );

      if (iteration >= text.length) {
        if (intervalRef.current) clearInterval(intervalRef.current);
      }

      iteration += 1 / 3;
    }, 30);
  };

  useEffect(() => {
    if (!hoverTrigger) {
      scramble();
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleMouseEnter = () => {
    if (hoverTrigger) {
      setIsHovering(true);
      scramble();
    }
  };

  return (
    <span 
      className={className} 
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setIsHovering(false)}
    >
      {displayText}
    </span>
  );
};

export default ScrambleText;