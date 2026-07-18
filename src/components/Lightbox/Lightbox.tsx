import { useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import './lightbox.css';

interface LightboxProps {
  images: string[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

const swipeConfidenceThreshold = 10000;
const swipePower = (offset: number, velocity: number) => Math.abs(offset) * velocity;

const Lightbox = ({ images, currentIndex, onClose, onNavigate }: LightboxProps) => {
  const goNext = useCallback(() => {
    if (currentIndex < images.length - 1) onNavigate(currentIndex + 1);
  }, [currentIndex, images.length, onNavigate]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) onNavigate(currentIndex - 1);
  }, [currentIndex, onNavigate]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape': onClose(); break;
        case 'ArrowRight': goNext(); break;
        case 'ArrowLeft': goPrev(); break;
      }
    };
    window.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [onClose, goNext, goPrev]);

  return (
    <AnimatePresence>
      <motion.div
        className="lightbox-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
      >
        {/* 关闭按钮 */}
        <motion.button
          className="lightbox-close"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 400, damping: 25 }}
          onClick={onClose}
        >
          <X size={22} />
        </motion.button>

        {/* 左箭头 */}
        {currentIndex > 0 && (
          <motion.button
            className="lightbox-arrow lightbox-arrow-left"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            onClick={(e) => { e.stopPropagation(); goPrev(); }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <ChevronLeft size={28} />
          </motion.button>
        )}

        {/* 右箭头 */}
        {currentIndex < images.length - 1 && (
          <motion.button
            className="lightbox-arrow lightbox-arrow-right"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            onClick={(e) => { e.stopPropagation(); goNext(); }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <ChevronRight size={28} />
          </motion.button>
        )}

        {/* 图片容器 */}
        <div className="lightbox-image-container" onClick={(e) => e.stopPropagation()}>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              className="lightbox-image-wrapper"
              initial={{ opacity: 0, scale: 0.8, x: 0 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.9, x: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28, mass: 0.8 }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={{ left: 0.15, right: 0.15 }}
              onDragEnd={(_, { offset, velocity }) => {
                const swipe = swipePower(offset.x, velocity.x);
                if (swipe < -swipeConfidenceThreshold && currentIndex < images.length - 1) {
                  onNavigate(currentIndex + 1);
                } else if (swipe > swipeConfidenceThreshold && currentIndex > 0) {
                  onNavigate(currentIndex - 1);
                }
              }}
            >
              <img
                src={images[currentIndex]}
                alt={`photo ${currentIndex + 1}`}
                className="lightbox-image"
                draggable={false}
              />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* 底部指示器 */}
        <motion.div
          className="lightbox-footer"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ delay: 0.15, type: 'spring', stiffness: 400, damping: 25 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="lightbox-dots">
            {images.map((_, i) => (
              <button
                key={i}
                className={`lightbox-dot ${i === currentIndex ? 'active' : ''}`}
                onClick={() => onNavigate(i)}
              />
            ))}
          </div>
          <span className="lightbox-counter">
            {currentIndex + 1} / {images.length}
          </span>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default Lightbox;
