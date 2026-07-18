import { useEffect, useRef } from 'react';
import { asciiArtWorks } from '@/data/asciiArt';

import naruto1 from '@/assets/ascii_art/naruto_1.txt?raw';
import naruto2 from '@/assets/ascii_art/naruto_2.txt?raw';
import naruto3 from '@/assets/ascii_art/naruto_3.txt?raw';
import narutoFan1 from '@/assets/ascii_art/naruto_fan_1.txt?raw';
import narutoFan2 from '@/assets/ascii_art/naruto_fan_2.txt?raw';

const asciiMap: Record<string, string> = {
  'naruto_1.txt': naruto1,
  'naruto_2.txt': naruto2,
  'naruto_3.txt': naruto3,
  'naruto_fan_1.txt': narutoFan1,
  'naruto_fan_2.txt': narutoFan2,
};

const SCROLL_SPEED = 3;

const AsciiBackground = () => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const animate = () => {
      if (wrapperRef.current) {
        wrapperRef.current.scrollLeft += SCROLL_SPEED;
        const maxScroll = wrapperRef.current.scrollWidth - wrapperRef.current.clientWidth;
        if (wrapperRef.current.scrollLeft >= maxScroll) {
          wrapperRef.current.scrollLeft = 0;
        }
      }
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const artItems = [...asciiArtWorks, ...asciiArtWorks];

  return (
    <div className="ascii-bg-container">
      <div ref={wrapperRef} className="ascii-scroll-wrapper">
        <div className="ascii-scroll-track">
          {artItems.map((work, i) => (
            <div key={`${work.id}-${i}`} className="ascii-scroll-item">
              <pre className="ascii-bg-art">{asciiMap[work.file]}</pre>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AsciiBackground;
