import React, { useEffect, useState } from 'react';

export default function CustomCursor() {
  const [pos, setPos] = useState({ x: -100, y: -100 });
  const [lerpPos, setLerpPos] = useState({ x: -100, y: -100 });
  const [hovering, setHovering] = useState(false);

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      setPos({ x: e.clientX, y: e.clientY });
    };
    
    const handleOver = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('button, a, select, [role="button"]');
      setHovering(!!target);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseover', handleOver);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseover', handleOver);
    };
  }, []);

  useEffect(() => {
    let frame: number;
    const animate = () => {
      setLerpPos(prev => ({
        x: prev.x + (pos.x - prev.x) * 0.15,
        y: prev.y + (pos.y - prev.y) * 0.15
      }));
      frame = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(frame);
  }, [pos]);

  return (
    <div
      className="fixed pointer-events-none z-[9999] rounded-full transition-all duration-300 ease-out flex items-center justify-center"
      style={{
        left: lerpPos.x,
        top: lerpPos.y,
        width: hovering ? 44 : 20,
        height: hovering ? 44 : 20,
        background: 'radial-gradient(circle, rgba(0,200,255,0.8) 0%, transparent 70%)',
        transform: 'translate(-50%, -50%)',
        opacity: hovering ? 0.6 : 1,
        mixBlendMode: 'screen'
      }}
    />
  );
}
