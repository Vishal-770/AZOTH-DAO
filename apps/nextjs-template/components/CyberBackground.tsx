"use client";
import React, { useEffect, useRef } from 'react';

const CyberBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    const characters = '01ABCDEFGHIJKLMNOPQRSTUVWXYZ@#$%&';
    const fontSize = 14;
    const columns = Math.ceil(window.innerWidth / fontSize);
    const drops: number[] = new Array(columns).fill(1);

    const draw = () => {
      // Semi-transparent black to create trail effect
      ctx.fillStyle = 'rgba(5, 5, 5, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = `${fontSize}px "JetBrains Mono"`;

      for (let i = 0; i < drops.length; i++) {
        // Random character
        const text = characters.charAt(Math.floor(Math.random() * characters.length));
        
        // Random color: mostly cyan, some silver, rare white
        const randomColor = Math.random();
        if (randomColor > 0.95) {
             ctx.fillStyle = '#ffffff'; // Flash white
        } else if (randomColor > 0.8) {
             ctx.fillStyle = '#e0f2fe'; // Silver accent
        } else {
             ctx.fillStyle = '#00f5ff'; // Cyan accent
        }
        
        // Opacity variation
        ctx.globalAlpha = Math.random() * 0.5 + 0.5;

        ctx.fillText(text, i * fontSize, drops[i] * fontSize);
        ctx.globalAlpha = 1.0;

        // Reset drop to top randomly
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }

        drops[i]++;
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 z-0 opacity-30 pointer-events-none" />;
};

export default CyberBackground;