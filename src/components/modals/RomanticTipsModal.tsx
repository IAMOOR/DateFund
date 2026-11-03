/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Sparkles, 
  RefreshCw, 
  Clock, 
  MessageCircleHeart, 
  Copy, 
  Check, 
  Heart, 
  CheckCircle2, 
  HelpCircle,
  Lightbulb,
  ArrowRight
} from 'lucide-react';
import { DateMood, RomanticTip } from '../../types';
import { fetchRomanticTips } from '../../utils/aiClient';
import { DATE_MOODS, getMoodConfig } from '../../utils/moods';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { MoodBadge } from '../ui/MoodBadge';
import { hapticLight, hapticSuccess } from '../../utils/haptics';

interface RomanticTipsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMood?: DateMood;
  onApplyQuestion?: (question: string) => void;
}

export default function RomanticTipsModal({
  isOpen,
  onClose,
  initialMood = 'Romantic',
  onApplyQuestion,
}: RomanticTipsModalProps) {
  const [selectedMood, setSelectedMood] = useState<DateMood>(initialMood);
  const [tips, setTips] = useState<RomanticTip[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (initialMood) {
      setSelectedMood(initialMood);
    }
  }, [initialMood]);

  const loadTips = async (mood: DateMood, force: boolean = false) => {
    setLoading(true);
    try {
      const data = await fetchRomanticTips(mood, force);
      setTips(data);
    } catch (err) {
      console.warn("Failed to load romantic tips:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadTips(selectedMood);
    }
  }, [isOpen, selectedMood]);

  const handleCopyQuestion = (text: string, index: number) => {
    hapticSuccess();
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => {
      setCopiedIndex(null);
    }, 2000);
  };

  const currentMoodConfig = getMoodConfig(selectedMood);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-background/85 backdrop-blur-md"
      />

      {/* Modal Dialog */}
      <motion.div
        initial={{ y: "100%", opacity: 0.5 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        className="relative w-full max-w-2xl bg-surface-container rounded-t-3xl sm:rounded-3xl shadow-2xl border border-outline-variant/15 flex flex-col max-h-[92vh] sm:max-h-[85vh] overflow-hidden"
      >
        {/* Sticky Header */}
        <div className="p-5 sm:p-6 border-b border-outline-variant/10 bg-surface-container/95 backdrop-blur-md flex items-start justify-between gap-4">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-secondary uppercase tracking-widest bg-secondary/10 px-2.5 py-0.5 rounded-full">
                <Sparkles className="w-3 h-3 text-secondary" /> Gemini Couples Coach
              </span>
              <MoodBadge mood={selectedMood} size="sm" />
            </div>
            <h3 className="text-2xl sm:text-3xl font-serif text-on-surface">
              Romantic Tips & Connection Exercises
            </h3>
            <p className="text-xs text-outline/80">
              3 actionable relationship exercises tailored for your <strong className="text-on-surface">{selectedMood.toLowerCase()}</strong> date
            </p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => {
                hapticLight();
                loadTips(selectedMood, true);
              }}
              disabled={loading}
              title="Regenerate Tips"
              aria-label="Regenerate Tips"
              className="p-2.5 rounded-full hover:bg-surface-container-high transition-colors text-outline hover:text-primary min-h-[44px] min-w-[44px] flex items-center justify-center disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-primary' : ''}`} />
            </button>
            <button
              onClick={onClose}
              title="Close modal"
              aria-label="Close modal"
              className="p-2.5 rounded-full hover:bg-surface-container-high transition-colors text-outline hover:text-on-surface min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mood Selector Tabs */}
        <div className="px-5 sm:px-6 py-2.5 bg-surface-container-low border-b border-outline-variant/10 flex gap-1.5 overflow-x-auto no-scrollbar items-center">
          <span className="text-[10px] uppercase font-bold text-outline shrink-0 tracking-wider mr-1">
            Switch Vibe:
          </span>
          {DATE_MOODS.map(m => {
            const isSelected = selectedMood === m.id;
            return (
              <button
                key={m.id}
                onClick={() => {
                  hapticLight();
                  setSelectedMood(m.id);
                }}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border shrink-0 cursor-pointer ${
                  isSelected
                    ? `${m.activeClass} font-bold shadow-xs ring-1 ring-primary/30`
                    : 'bg-surface-container text-outline border-outline-variant/20 hover:text-on-surface'
                }`}
              >
                <span>{m.emoji}</span>
                <span>{m.label}</span>
              </button>
            );
          })}
        </div>

        {/* Scrollable Exercises Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-outline font-medium">
                Gemini is tailoring 3 {selectedMood.toLowerCase()} communication exercises...
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {tips.map((tip, index) => (
                <Card
                  key={index}
                  variant="high"
                  padding="md"
                  className="space-y-3.5 relative overflow-hidden border-outline-variant/20 hover:border-primary/40 transition-colors"
                >
                  {/* Top exercise info row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="w-6 h-6 rounded-full bg-primary/10 text-primary font-serif font-bold text-xs flex items-center justify-center shrink-0">
                          {index + 1}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-secondary bg-secondary/10 px-2 py-0.5 rounded-md">
                          {tip.category}
                        </span>
                        <span className="text-[11px] font-semibold text-outline flex items-center gap-1">
                          <Clock className="w-3 h-3 text-outline" /> {tip.timeEstimate}
                        </span>
                      </div>
                      <h4 className="font-serif text-lg sm:text-xl font-bold text-on-surface">
                        {tip.title}
                      </h4>
                    </div>
                  </div>

                  {/* Why it works description */}
                  <p className="text-xs sm:text-sm text-on-surface/85 leading-relaxed">
                    {tip.description}
                  </p>

                  {/* Actionable Steps Checklist */}
                  {tip.steps && tip.steps.length > 0 && (
                    <div className="space-y-2 pt-1">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-outline block">
                        Action Steps for Tonight:
                      </span>
                      <ul className="space-y-1.5">
                        {tip.steps.map((step, sIdx) => (
                          <li key={sIdx} className="flex items-start gap-2 text-xs text-on-surface/90">
                            <span className="w-4 h-4 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                              {sIdx + 1}
                            </span>
                            <span className="leading-normal">{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Conversation Starter Highlight Box */}
                  {tip.conversationStarter && (
                    <div className="mt-3 p-3.5 rounded-2xl bg-surface-container-high/70 border border-secondary/20 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-secondary flex items-center gap-1.5">
                          <MessageCircleHeart className="w-3.5 h-3.5 text-secondary" /> Conversation Starter
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyQuestion(tip.conversationStarter, index)}
                          className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          {copiedIndex === index ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-500" />
                              <span className="text-emerald-500">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy Question</span>
                            </>
                          )}
                        </button>
                      </div>
                      <p className="font-serif italic text-sm text-on-surface font-medium leading-relaxed">
                        "{tip.conversationStarter}"
                      </p>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-outline-variant/10 bg-surface-container/95 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[11px] text-outline text-center sm:text-left">
            💡 <em>Tip: Pick one exercise per date night so you can stay fully present and unhurried.</em>
          </p>
          <Button
            variant="primary"
            size="md"
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            Got it, Let's Date!
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
