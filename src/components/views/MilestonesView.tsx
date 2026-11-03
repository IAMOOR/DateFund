import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Heart,
  Calendar,
  Flame,
  Award,
  Sparkles,
  ChevronLeft,
  CheckCircle2,
  Clock,
  Plus,
  Edit2
} from 'lucide-react';
import { Event } from '../../types';
import { formatDateShort } from '../../utils/formatters';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { StatusBadge } from '../ui/StatusBadge';
import { hapticSuccess, hapticLight } from '../../utils/haptics';

interface MilestonesViewProps {
  startDate?: string;
  onUpdateStartDate: (date: string) => Promise<void>;
  events: Event[];
  onBack: () => void;
  onPlanDate: () => void;
}

export default function MilestonesView({
  startDate = '2024-02-14',
  onUpdateStartDate,
  events,
  onBack,
  onPlanDate,
}: MilestonesViewProps) {
  const [isEditingDate, setIsEditingDate] = useState(false);
  const [newDate, setNewDate] = useState(startDate);
  const [isSaving, setIsSaving] = useState(false);

  // Calculate Days Together
  const start = new Date(startDate);
  const today = new Date();
  const diffTime = Math.max(0, today.getTime() - start.getTime());
  const daysTogether = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const yearsTogether = (daysTogether / 365.25).toFixed(1);

  // Calculate Milestone Countdowns
  const allMilestones = [
    { title: '100 Days Together', targetDays: 100, icon: '💯' },
    { title: '6 Months of Love', targetDays: 182, icon: '✨' },
    { title: '1 Year Anniversary', targetDays: 365, icon: '🥂' },
    { title: '500 Days Together', targetDays: 500, icon: '🌟' },
    { title: '2 Years Anniversary', targetDays: 730, icon: '💍' },
    { title: '1,000 Days Milestone', targetDays: 1000, icon: '🏆' },
    { title: '3 Years Anniversary', targetDays: 1095, icon: '🌹' },
    { title: '5 Years Milestone', targetDays: 1826, icon: '👑' },
  ].map(m => {
    const remaining = m.targetDays - daysTogether;
    return {
      ...m,
      remaining,
      achieved: remaining <= 0,
      achievedDate: remaining <= 0 
        ? new Date(start.getTime() + m.targetDays * 86400000).toLocaleDateString('en-ZA', { month: 'short', day: 'numeric', year: 'numeric' })
        : null
    };
  });

  const upcomingMilestones = allMilestones.filter(m => !m.achieved);
  const achievedMilestones = allMilestones.filter(m => m.achieved);

  // Calculate Date Night Streak
  const completedEvents = events.filter(e => e.completed);
  const streakMonths = (() => {
    if (completedEvents.length === 0) return 0;
    const monthsSet = new Set(
      completedEvents.map(e => {
        const d = new Date(e.date);
        return `${d.getFullYear()}-${d.getMonth() + 1}`;
      })
    );
    return monthsSet.size;
  })();

  const handleSaveDate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDate) return;
    setIsSaving(true);
    try {
      await onUpdateStartDate(newDate);
      hapticSuccess();
      setIsEditingDate(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant/10 pb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 -ml-2 rounded-full hover:bg-surface-container-high transition-colors text-outline hover:text-on-surface"
            aria-label="Back to dashboard"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-secondary" />
              <h1 className="text-2xl sm:text-3xl font-serif text-on-surface">Milestones & Anniversaries</h1>
            </div>
            <p className="text-xs text-outline/80 mt-0.5">
              Celebrating every chapter and step in your shared love story
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="md"
          icon={<Edit2 className="w-3.5 h-3.5" />}
          onClick={() => { hapticLight(); setIsEditingDate(true); }}
        >
          Change Anniversary Date
        </Button>
      </div>

      {/* Hero Love Story Banner */}
      <div className="relative overflow-hidden p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-primary/15 via-surface-container-high to-secondary/10 border border-primary/20 shadow-sm">
        <div className="absolute top-0 right-0 -mr-12 -mt-12 w-48 h-48 bg-primary/20 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-primary/20 text-primary rounded-2xl border border-primary/25 backdrop-blur-md shrink-0">
              <Heart className="w-8 h-8 fill-primary" />
            </div>
            <div>
              <span className="text-xs uppercase tracking-wider font-semibold text-outline block">Our Journey</span>
              <h2 className="font-serif text-3xl sm:text-4xl text-on-surface font-bold">
                {daysTogether.toLocaleString()}{' '}
                <span className="text-xl sm:text-2xl font-sans font-normal text-primary">Days of Love</span>
              </h2>
              <p className="text-xs text-outline/90 mt-1">
                Together since {new Date(startDate).toLocaleDateString('en-ZA', { month: 'long', day: 'numeric', year: 'numeric' })} (~{yearsTogether} years)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Date Night Streak Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card variant="high" padding="md" className="flex flex-col justify-between gap-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-secondary/15 text-secondary rounded-xl shrink-0">
                <Flame className="w-6 h-6 fill-secondary" />
              </div>
              <div>
                <span className="text-xs uppercase tracking-wider font-semibold text-outline block">Date Night Streak</span>
                <p className="text-sm font-semibold text-secondary">Consecutive Months</p>
              </div>
            </div>

            {streakMonths > 0 ? (
              <StatusBadge variant="success" pulse>
                Active Streak
              </StatusBadge>
            ) : (
              <StatusBadge variant="neutral">
                Start your streak
              </StatusBadge>
            )}
          </div>

          <div className="pt-3 border-t border-outline-variant/10">
            <div className="flex items-baseline gap-2">
              <h3 className="font-serif text-3xl font-bold text-on-surface">
                {streakMonths}
              </h3>
              <span className="text-sm text-outline font-medium">
                {streakMonths === 1 ? 'Month with dates' : 'Months with dates'}
              </span>
            </div>
            <p className="text-xs text-outline/80 mt-1.5 leading-relaxed">
              {streakMonths > 0
                ? 'Couples that plan and complete at least one date night each month stay deeply connected.'
                : 'Mark your planned dates as completed in the Planner to begin your monthly couple streak!'}
            </p>
          </div>

          {streakMonths === 0 && (
            <Button variant="primary" size="sm" onClick={onPlanDate}>
              Plan Date Night
            </Button>
          )}
        </Card>

        {/* Milestone Quick Summary */}
        <Card variant="high" padding="md" className="flex flex-col justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-primary/10 text-primary rounded-xl shrink-0">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <span className="text-xs uppercase tracking-wider font-semibold text-outline block">Next Milestone</span>
              <p className="text-sm font-bold text-on-surface">
                {upcomingMilestones[0] ? upcomingMilestones[0].title : 'All Milestones Achieved!'}
              </p>
            </div>
          </div>

          {upcomingMilestones[0] && (
            <div className="pt-2 border-t border-outline-variant/10">
              <div className="flex items-baseline gap-2">
                <h3 className="font-serif text-3xl font-bold text-primary">
                  {upcomingMilestones[0].remaining}
                </h3>
                <span className="text-xs text-outline font-semibold uppercase tracking-wider">Days to go</span>
              </div>
              <p className="text-xs text-outline/80 mt-1">
                Target date: {new Date(start.getTime() + upcomingMilestones[0].targetDays * 86400000).toLocaleDateString('en-ZA', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          )}
        </Card>
      </div>

      {/* Separated: Upcoming Milestones */}
      <div className="space-y-3">
        <h3 className="font-serif text-xl font-bold text-on-surface flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" />
          Upcoming Milestones
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {upcomingMilestones.map((m, idx) => (
            <Card key={idx} variant="default" padding="sm" className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-2xl shrink-0" role="img" aria-label={m.title}>{m.icon}</span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-on-surface truncate">{m.title}</p>
                  <p className="text-[11px] text-outline">Target: {m.targetDays} days</p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="font-serif font-bold text-primary text-base block">{m.remaining}d</span>
                <span className="text-[10px] text-outline">remaining</span>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Separated: Achieved Milestones */}
      {achievedMilestones.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-outline-variant/10">
          <h3 className="font-serif text-xl font-bold text-on-surface flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-secondary" />
            Achieved Milestones ({achievedMilestones.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {achievedMilestones.map((m, idx) => (
              <Card key={idx} variant="flat" padding="sm" className="flex items-center justify-between gap-3 bg-secondary/5 border-secondary/20">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-2xl shrink-0" role="img" aria-label={m.title}>{m.icon}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-on-surface truncate">{m.title}</p>
                    <p className="text-[11px] text-secondary font-medium">Achieved on {m.achievedDate}</p>
                  </div>
                </div>
                <CheckCircle2 className="w-5 h-5 text-secondary shrink-0" />
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Change Anniversary Modal */}
      <Modal
        isOpen={isEditingDate}
        onClose={() => setIsEditingDate(false)}
        title="Update Anniversary Date"
        description="Set the date you and your partner began your love story"
      >
        <form onSubmit={handleSaveDate} className="space-y-4 pt-2">
          <Input
            label="Anniversary / Start Date"
            type="date"
            required
            value={newDate}
            onChange={e => setNewDate(e.target.value)}
            helperText="This calculates your days together, milestones, and annual retrospectives"
          />

          <div className="flex justify-end gap-2.5 pt-3">
            <Button variant="ghost" size="md" onClick={() => setIsEditingDate(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="md" type="submit" isLoading={isSaving}>
              Save Anniversary
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
