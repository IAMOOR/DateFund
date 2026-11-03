import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Calendar, Flame, Sparkles, Award, Plus, Trash2, Clock, X } from 'lucide-react';
import { Event } from '../../types';
import { hapticLight, hapticSuccess } from '../../utils/haptics';

interface AnniversaryTrackerProps {
  startDate?: string;
  onUpdateStartDate: (date: string) => Promise<void>;
  events: Event[];
  isOpen?: boolean;
  onClose?: () => void;
  isWidget?: boolean;
}

export default function AnniversaryTracker({
  startDate = '2024-02-14',
  onUpdateStartDate,
  events,
  isOpen,
  onClose,
  isWidget = false,
}: AnniversaryTrackerProps) {
  const [isEditingDate, setIsEditingDate] = useState(false);
  const [newDate, setNewDate] = useState(startDate);

  // Calculate Days Together
  const start = new Date(startDate);
  const today = new Date();
  const diffTime = Math.max(0, today.getTime() - start.getTime());
  const daysTogether = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const yearsTogether = (daysTogether / 365.25).toFixed(1);

  // Calculate Milestone Countdowns
  const upcomingMilestones = [
    { title: '100 Days Together', targetDays: 100 },
    { title: '6 Months of Love', targetDays: 182 },
    { title: '1 Year Anniversary', targetDays: 365 },
    { title: '2 Years Anniversary', targetDays: 730 },
    { title: '3 Years Anniversary', targetDays: 1095 },
    { title: '5 Years Milestone', targetDays: 1826 },
  ].map(m => {
    const remaining = m.targetDays - daysTogether;
    return {
      ...m,
      remaining,
      achieved: remaining <= 0,
    };
  }).filter(m => !m.achieved || m.targetDays === 365).slice(0, 3);

  // Calculate Date Night Streak (consecutive months with completed dates)
  const streakMonths = (() => {
    const completedEvents = events.filter(e => e.completed);
    if (completedEvents.length === 0) return 0;

    const monthsSet = new Set(
      completedEvents.map(e => {
        const d = new Date(e.date);
        return `${d.getFullYear()}-${d.getMonth() + 1}`;
      })
    );
    return Math.max(1, monthsSet.size);
  })();

  const handleSaveDate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDate) return;
    await onUpdateStartDate(newDate);
    hapticSuccess();
    setIsEditingDate(false);
  };

  const cardContent = (
    <div className="space-y-6">
      {/* Top Banner: Days Together */}
      <div className="relative overflow-hidden p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-primary/15 via-surface-container-high to-secondary/10 border border-primary/20 shadow-xs">
        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-40 h-40 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="p-3 bg-primary/20 text-primary rounded-xl border border-primary/20 backdrop-blur-md shrink-0">
              <Heart className="w-6 h-6 fill-primary" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-outline block">Our Love Story</span>
              <h3 className="font-serif text-2xl sm:text-3xl text-on-surface font-bold truncate">
                {daysTogether.toLocaleString()} <span className="text-lg sm:text-xl font-sans font-normal text-primary">Days</span>
              </h3>
              <p className="text-xs text-outline/80 mt-0.5 truncate">
                Since {new Date(startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} (~{yearsTogether} yrs)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <button
              onClick={() => { hapticLight(); setIsEditingDate(!isEditingDate); }}
              className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-surface-container-highest/80 hover:bg-surface-container-highest border border-outline-variant/20 transition-all text-on-surface cursor-pointer min-h-[36px]"
            >
              {isEditingDate ? 'Cancel' : 'Change Date'}
            </button>
          </div>
        </div>

        {/* Edit Date Form */}
        <AnimatePresence>
          {isEditingDate && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handleSaveDate}
              className="mt-4 pt-3 border-t border-outline-variant/15 flex flex-wrap gap-2.5 items-center"
            >
              <label className="text-xs font-semibold uppercase tracking-wider text-outline">Anniversary Date:</label>
              <input
                type="date"
                value={newDate}
                onChange={e => setNewDate(e.target.value)}
                className="bg-surface-container border border-outline-variant/30 rounded-xl px-3.5 py-1.5 text-sm text-on-surface outline-none focus:border-primary min-h-[40px]"
              />
              <button
                type="submit"
                className="bg-primary text-on-primary-fixed px-4 py-1.5 rounded-xl text-xs font-semibold shadow-xs cursor-pointer min-h-[40px]"
              >
                Save
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>

      {/* Grid: Streak & Countdowns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3">
        {/* Date Night Streak */}
        <div className="p-4 sm:p-5 rounded-2xl bg-surface-container-low border border-outline-variant/10 shadow-xs flex flex-col justify-between gap-3 relative overflow-hidden">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-2.5 bg-secondary/15 text-secondary rounded-xl shrink-0">
                <Flame className="w-5 h-5 fill-secondary" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-outline block truncate">Date Streak</span>
                <p className="text-xs font-semibold text-secondary truncate">Monthly Rhythm</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 bg-secondary/10 text-secondary rounded-full border border-secondary/20 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
              Active
            </span>
          </div>

          <div className="pt-2.5 border-t border-outline-variant/10">
            <div className="flex items-baseline justify-between gap-2">
              <h4 className="font-serif text-2xl font-bold text-on-surface">
                {streakMonths} <span className="text-sm font-sans font-normal text-outline">{streakMonths === 1 ? 'Month' : 'Months'}</span>
              </h4>
              <span className="text-[10px] text-outline/80 font-medium whitespace-nowrap">Coupled up</span>
            </div>
            <p className="text-[11px] text-outline/70 mt-0.5">Consecutive months with date nights</p>
          </div>
        </div>

        {/* Milestone Countdowns */}
        <div className="p-4 sm:p-5 rounded-2xl bg-surface-container-low border border-outline-variant/10 shadow-xs flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="p-2.5 bg-primary/10 text-primary rounded-xl shrink-0">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <span className="text-xs uppercase tracking-wider font-semibold text-outline truncate">Next Milestones</span>
            </div>
          </div>

          <div className="pt-2.5 border-t border-outline-variant/10">
            {upcomingMilestones.length > 0 ? (
              <div className="space-y-1.5">
                {upcomingMilestones.slice(0, 2).map((m, idx) => (
                  <div key={idx} className="flex items-center justify-between py-0.5 gap-2 text-xs">
                    <span className="font-medium text-on-surface truncate">{m.title}</span>
                    <span className="font-serif font-bold text-primary whitespace-nowrap">
                      {m.remaining > 0 ? `${m.remaining}d` : 'Achieved! 🎉'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-outline italic">Milestones achieved!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  if (isWidget) {
    return cardContent;
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-background/85 backdrop-blur-md"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-2xl bg-surface-container rounded-[2.5rem] border border-outline-variant/15 shadow-2xl p-6 sm:p-10 z-10 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between pb-6 border-b border-outline-variant/10 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 text-primary rounded-2xl">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-serif text-on-surface">Milestones & Anniversaries</h2>
              <p className="text-xs uppercase tracking-widest font-semibold text-outline/70">
                Tracking Every Day of Your Love Story
              </p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2.5 rounded-full hover:bg-surface-container-highest transition-colors text-outline"
            >
              <X className="w-6 h-6" />
            </button>
          )}
        </div>

        {cardContent}
      </motion.div>
    </div>
  );
}
