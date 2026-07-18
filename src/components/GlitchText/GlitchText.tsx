import { useEffect, useState, useMemo } from 'react';

const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%^&*()_+-=[]{}|;:,.<>?/~`';

const GlitchText = () => {
  const [activeCells, setActiveCells] = useState<Set<string>>(new Set());
  
  const grid = useMemo(() => {
    const rows = 12;
    const cols = 30;
    const result = [];
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        result.push({ x, y });
      }
    }
    return result;
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveCells(prev => {
        const newSet = new Set(prev);
        const randomIndex = Math.floor(Math.random() * grid.length);
        const key = `${grid[randomIndex].x}-${grid[randomIndex].y}`;
        
        if (newSet.has(key)) {
          newSet.delete(key);
        } else {
          newSet.add(key);
        }
        
        if (newSet.size > 15) {
          const keys = Array.from(newSet);
          newSet.delete(keys[Math.floor(Math.random() * keys.length)]);
        }
        
        return newSet;
      });
    }, 80);

    return () => clearInterval(interval);
  }, [grid]);

  return (
    <div className="glitch-container">
      <div className="glitch-grid">
        {grid.map(({ x, y }) => {
          const key = `${x}-${y}`;
          const isActive = activeCells.has(key);
          return (
            <span
              key={key}
              className={`glitch-cell ${isActive ? 'glitch-active' : ''}`}
              style={{ 
                gridColumn: x + 1, 
                gridRow: y + 1 
              }}
            >
              {isActive ? chars[Math.floor(Math.random() * chars.length)] : '.'}
            </span>
          );
        })}
      </div>
    </div>
  );
};

export default GlitchText;
