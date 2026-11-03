import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, MapPin, Clock, Calendar, Lock, Unlock, X, Heart, Eye } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Event } from '../../types';
import { hapticCelebration, hapticLight } from '../../utils/haptics';

interface MysteryDateRevealModalProps {
  event: Event | null;
  isOpen: boolean;
  onClose: () => void;
  onReveal: (eventId: string) => Promise<void>;
  isCreator: boolean;
}

export default function MysteryDateRevealModal({
  event,
  isOpen,
  onClose,
  onReveal,
  isCreator,
}: MysteryDateRevealModalProps) {
  const [isRevealed, setIsRevealed] = useState(false);
  const [scratchProgress, setScratchProgress] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawing = useRef(false);

  useEffect(() => {
    if (event?.mysteryRevealed) {
      setIsRevealed(true);
      setScratchProgress(100);
    } else {
      setIsRevealed(false);
      setScratchProgress(0);
    }
  }, [event]);

  // Setup interactive scratch-off canvas if not yet revealed
  useEffect(() => {
    if (!isOpen || isRevealed || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Draw luxurious golden romantic foil cover
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#d97706');
    grad.addColorStop(0.5, '#f59e0b');
    grad.addColorStop(1, '#b45309');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Decorative pattern & label
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    for (let i = 0; i < width; i += 20) {
      ctx.fillRect(i, 0, 10, height);
    }

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('✨ Scratch Here to Reveal Your Date ✨', width / 2, height / 2);
  }, [isOpen, isRevealed]);

  if (!isOpen || !event) return null;

  const triggerReveal = async () => {
    setIsRevealed(true);
    setScratchProgress(100);
    hapticCelebration();
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#e11d48', '#fb7185', '#f59e0b', '#fbbf24', '#ffffff'],
    });
    await onReveal(event.id);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isDrawing.current = true;
    scratch(e);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current) return;
    scratch(e);
  };

  const handlePointerUp = () => {
    isDrawing.current = false;
  };

  const scratch = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 28, 0, Math.PI * 2);
    ctx.fill();

    setScratchProgress(prev => {
      const next = prev + 5;
      if (next >= 60 && !isRevealed) {
        triggerReveal();
      }
      return next;
    });
  };

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-background/90 backdrop-blur-md"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 30 }}
        className="relative w-full max-w-lg bg-surface-container rounded-[2.5rem] border border-secondary/30 shadow-2xl p-6 sm:p-8 z-10 text-center overflow-hidden"
      >
        {/* Glow ambient background */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-secondary/15 rounded-full blur-3xl pointer-events-none" />

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-surface-container-highest transition-colors text-outline"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Header Icon */}
        <div className="w-16 h-16 rounded-full bg-secondary/15 text-secondary flex items-center justify-center mx-auto mb-4 border border-secondary/30 shadow-lg">
          {isRevealed ? <Sparkles className="w-8 h-8 animate-spin" /> : <Lock className="w-8 h-8" />}
        </div>

        <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-secondary">
          {isRevealed ? 'Secret Revealed!' : 'Mystery Date Night'}
        </span>
        <h3 className="text-2xl sm:text-3xl font-serif text-on-surface mt-1 mb-2">
          {isRevealed ? event.title : 'A Surprise Planned with Love'}
        </h3>
        <p className="text-xs text-outline mb-6 max-w-sm mx-auto">
          {isRevealed
            ? 'Here are your date night details! Enjoy every second together.'
            : 'Details are sealed until revealed. Scratch off the golden card or unlock the seal!'}
        </p>

        {/* Date & Time pill */}
        <div className="inline-flex items-center gap-4 bg-surface-container-low px-4 py-2 rounded-full border border-outline-variant/15 text-xs text-on-surface font-medium mb-6">
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-primary" /> {event.date}
          </span>
          {event.time && (
            <span className="flex items-center gap-1.5 border-l border-outline-variant/30 pl-4">
              <Clock className="w-3.5 h-3.5 text-secondary" /> {event.time}
            </span>
          )}
        </div>

        {/* Scratch-off or Revealed Content Card */}
        <div className="relative min-h-[160px] rounded-2xl overflow-hidden bg-surface-container-lowest border border-outline-variant/15 p-6 mb-6 flex flex-col justify-center items-center shadow-inner">
          <AnimatePresence>
            {!isRevealed ? (
              <div className="w-full h-full flex flex-col items-center justify-center">
                <canvas
                  ref={canvasRef}
                  width={380}
                  height={140}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  className="rounded-xl w-full h-[140px] cursor-pointer touch-none shadow-md"
                />
                <p className="text-[10px] text-outline mt-2 italic">Tip: Rub your mouse or finger across the gold bar!</p>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-4 text-left w-full"
              >
                <div>
                  <span className="text-[9px] uppercase tracking-widest font-bold text-outline">Date Destination</span>
                  <p className="font-serif text-2xl text-primary font-medium">{event.title}</p>
                </div>

                {event.location && (
                  <div className="flex items-start gap-2 text-xs text-on-surface">
                    <MapPin className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                    <span>{event.location}</span>
                  </div>
                )}

                {event.description && (
                  <div className="bg-surface-container-low p-3 rounded-xl border border-outline-variant/10 text-xs text-on-surface/90 italic">
                    "{event.description}"
                  </div>
                )}

                {event.mysteryClue && (
                  <div className="text-[11px] text-secondary font-medium">
                    💌 Partner Clue: {event.mysteryClue}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          {!isRevealed ? (
            <button
              onClick={triggerReveal}
              className="w-full bg-gradient-to-r from-secondary to-primary text-white py-3.5 rounded-full font-bold text-xs uppercase tracking-widest shadow-lg shadow-secondary/20 hover:shadow-secondary/30 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Unlock className="w-4 h-4" />
              Break Seal & Reveal Secret
            </button>
          ) : (
            <button
              onClick={onClose}
              className="w-full bg-primary text-on-primary-fixed py-3.5 rounded-full font-bold text-xs uppercase tracking-widest shadow-md hover:shadow-lg active:scale-95 transition-all"
            >
              Ready For Date Night! ❤️
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
