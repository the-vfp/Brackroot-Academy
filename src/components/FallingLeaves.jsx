import { useEffect, useRef } from 'react';

export default function FallingLeaves() {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    const leafChars = ['\u{1F342}', '\u{1F341}', '\u{1F343}', '\u{1FAB6}'];

    for (let i = 0; i < 12; i++) {
      const leaf = document.createElement('div');
      leaf.className = 'leaf';
      leaf.textContent = leafChars[Math.floor(Math.random() * leafChars.length)];
      leaf.style.left = Math.random() * 100 + '%';
      leaf.style.animationDuration = (8 + Math.random() * 12) + 's';
      leaf.style.animationDelay = (Math.random() * 15) + 's';
      leaf.style.fontSize = (14 + Math.random() * 10) + 'px';
      container.appendChild(leaf);
    }

    return () => { container.innerHTML = ''; };
  }, []);

  return <div className="leaves-container" ref={containerRef} />;
}
