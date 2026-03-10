import React, { useEffect, useRef } from 'react';

interface Dot {
  x: number;
  y: number;
  r: number;
  g: number;
  b: number;
  baseAlpha: number;
  time: number;
  speed: number;
  isGreen: boolean;
  enabled: boolean;
}

export const DigitalGridBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const dots: Dot[] = [];
    const spacing = 6; // Higher resolution
    const dotSize = 4; // Smaller squares; lots of empty background remains

    const getGreenColor = () => {
      return { r: 50, g: 205, b: 50 };
    };

    const initDots = () => {
      dots.length = 0;
      const cols = Math.floor(window.innerWidth / spacing);
      const rows = Math.floor(window.innerHeight / spacing);

      for (let i = 0; i <= cols; i++) {
        for (let j = 0; j <= rows; j++) {
          const enabled = Math.random() < 0.4;
          const isGreen = enabled && Math.random() < 0.15;
          const color = isGreen ? getGreenColor() : { r: 255, g: 255, b: 255 };

          dots.push({
            x: i * spacing, // Strict grid alignment
            y: j * spacing,
            r: color.r,
            g: color.g,
            b: color.b,
            baseAlpha: enabled ? Math.random() * 0.02 + 0.005 : 0,
            time: Math.random() * Math.PI * 2,
            speed: Math.random() * 0.012 + 0.004,
            isGreen,
            enabled,
          });
        }
      }
    };

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;

      // Disable anti-aliasing for crisp pixel edges
      ctx.imageSmoothingEnabled = false;

      initDots();
    };

    const render = () => {
      // Clear with dark Trae background
      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

      dots.forEach((dot) => {
        if (!dot.enabled) return;
        dot.time += dot.speed;

        // Sine wave breathing effect
        // Allow greens to be slightly brighter when they pulse
        const pulse = Math.sin(dot.time);
        const currentAlpha = dot.baseAlpha + pulse * 0.12;

        // Clamp alpha to avoid invisibility or too bright
        // Keep the scene mostly dark (roughly 60% background visible)
        // Green dots can go up to 0.35, white up to 0.2
        const maxAlpha = dot.isGreen ? 0.35 : 0.2;
        const alpha = Math.max(0.006, Math.min(maxAlpha, currentAlpha));

        ctx.fillStyle = `rgba(${dot.r}, ${dot.g}, ${dot.b}, ${alpha})`;

        // Draw exact square for pixel style
        ctx.fillRect(Math.floor(dot.x), Math.floor(dot.y), dotSize, dotSize);
      });

      animationFrameId = requestAnimationFrame(render);
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    render();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 z-[-10] bg-zinc-950" />;
};
