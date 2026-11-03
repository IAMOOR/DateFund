import React, { useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Heart, Trophy, Share2, Copy, Check, X, Star, Calendar, PiggyBank, Eye } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Goal, Transaction, Event } from '../../types';
import { formatRand } from '../../utils/formatters';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { hapticSuccess, hapticCelebration } from '../../utils/haptics';

interface YearInLoveModalProps {
  isOpen: boolean;
  onClose: () => void;
  goals: Goal[];
  transactions: Transaction[];
  events: Event[];
  startDate?: string;
  reportingYear?: number;
}

export default function YearInLoveModal({
  isOpen,
  onClose,
  goals,
  transactions,
  events,
  startDate = '2024-02-14',
  reportingYear = 2026,
}: YearInLoveModalProps) {
  const [copied, setCopied] = useState(false);
  const [showSharePreview, setShowSharePreview] = useState(false);

  if (!isOpen) return null;

  // Annual metrics for the specified reporting year
  const yearEvents = events.filter(e => {
    const d = new Date(e.date);
    return d.getFullYear() === reportingYear;
  });
  const completedThisYear = yearEvents.filter(e => e.completed);

  const annualSaved = transactions
    .filter(t => {
      const d = new Date(t.date);
      return t.type === 'deposit' && d.getFullYear() === reportingYear;
    })
    .reduce((sum, t) => sum + t.amount, 0);

  // Lifetime metrics
  const lifetimeCompleted = events.filter(e => e.completed);
  const lifetimeSaved = transactions
    .filter(t => t.type === 'deposit')
    .reduce((sum, t) => sum + t.amount, 0);

  // Top category: ONLY compute if there are completed dates with tags
  const categoryCounts: { [cat: string]: number } = {};
  completedThisYear.forEach(e => {
    (e.tags || []).forEach(tag => {
      categoryCounts[tag] = (categoryCounts[tag] || 0) + 1;
    });
  });
  const hasCategories = Object.keys(categoryCounts).length > 0;
  const topCategory = hasCategories
    ? Object.keys(categoryCounts).sort((a, b) => categoryCounts[b] - categoryCounts[a])[0]
    : null;

  // Days together lifetime
  const start = new Date(startDate);
  const diffDays = Math.max(0, Math.floor((Date.now() - start.getTime()) / (1000 * 60 * 60 * 24)));

  // Top memory this year
  const highestRatedEvent = [...completedThisYear].sort(
    (a, b) => (b.memory?.rating || 0) - (a.memory?.rating || 0)
  )[0];

  const shareText = `✨ Our ${reportingYear} in Love on DateFund ✨\n💰 ${formatRand(annualSaved)} Saved in ${reportingYear} (Lifetime: ${formatRand(lifetimeSaved)})\n🥂 ${completedThisYear.length} Couple Dates Completed\n${topCategory ? `🏆 Top Vibe: ${topCategory}\n` : ''}❤️ ${diffDays} Days Together!`;

  const handleShare = async () => {
    hapticCelebration();
    confetti({
      particleCount: 60,
      spread: 60,
      origin: { y: 0.5 },
    });

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Our ${reportingYear} in Love - DateFund`,
          text: shareText,
        });
        return;
      } catch {}
    }

    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {}
  };

  const hasData = completedThisYear.length > 0 || annualSaved > 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${reportingYear} Year in Love`}
      description={`Couple retrospective and annual milestones for ${reportingYear}`}
    >
      <div className="space-y-5 pt-1 text-center">
        {!hasData ? (
          <div className="py-8 px-4 rounded-2xl bg-surface-container border border-outline-variant/15 space-y-3">
            <Trophy className="w-12 h-12 text-outline/40 mx-auto" />
            <h3 className="font-serif text-lg font-bold text-on-surface">Gathering Moments for {reportingYear}</h3>
            <p className="text-xs text-outline max-w-sm mx-auto leading-relaxed">
              Complete your first couple date night or record savings contributions to unlock your personalized {reportingYear} Love Retrospective!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Retrospective Card */}
            <div className="relative overflow-hidden p-6 rounded-3xl bg-gradient-to-br from-primary/20 via-surface-container-high to-secondary/15 border border-primary/25 shadow-md">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-xs font-bold uppercase tracking-widest text-primary">Annual Highlights</span>
              </div>

              <h2 className="font-serif text-3xl font-bold text-on-surface">
                {reportingYear} Love Story
              </h2>
              <p className="text-xs text-outline/80 mt-0.5">
                {diffDays} Days Together Since {new Date(startDate).toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' })}
              </p>

              {/* Stat Grid */}
              <div className="grid grid-cols-2 gap-3 mt-5 text-left">
                <div className="p-3.5 rounded-2xl bg-surface-container/70 border border-outline-variant/15">
                  <span className="text-[10px] uppercase font-bold text-outline block">Saved in {reportingYear}</span>
                  <p className="font-serif text-xl font-bold text-primary mt-0.5">{formatRand(annualSaved)}</p>
                  <span className="text-[10px] text-outline/70">Lifetime: {formatRand(lifetimeSaved)}</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-surface-container/70 border border-outline-variant/15">
                  <span className="text-[10px] uppercase font-bold text-outline block">Dates in {reportingYear}</span>
                  <p className="font-serif text-xl font-bold text-secondary mt-0.5">{completedThisYear.length} Dates</p>
                  <span className="text-[10px] text-outline/70">Lifetime: {lifetimeCompleted.length}</span>
                </div>
              </div>

              {topCategory && (
                <div className="mt-3 p-3 rounded-2xl bg-surface-container/50 border border-outline-variant/10 flex items-center justify-between text-xs">
                  <span className="text-outline">Top Date Vibe:</span>
                  <span className="font-bold text-on-surface flex items-center gap-1">
                    <Heart className="w-3.5 h-3.5 text-primary fill-primary" /> {topCategory}
                  </span>
                </div>
              )}

              {highestRatedEvent && (
                <div className="mt-3 p-3 rounded-2xl bg-surface-container/50 border border-outline-variant/10 text-left text-xs space-y-1">
                  <span className="text-outline text-[10px] uppercase tracking-wider block font-semibold">Most Magical Date</span>
                  <p className="font-serif font-bold text-on-surface text-sm truncate">{highestRatedEvent.title}</p>
                  {highestRatedEvent.memory?.rating && (
                    <div className="flex items-center gap-1 text-amber-400 font-bold text-xs">
                      <Star className="w-3 h-3 fill-amber-400" />
                      <span>{highestRatedEvent.memory.rating}.0 / 5.0</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Share Preview Toggle */}
            <div className="space-y-2 text-left">
              <button
                type="button"
                onClick={() => setShowSharePreview(!showSharePreview)}
                className="text-xs font-semibold text-outline hover:text-on-surface flex items-center gap-1 cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                {showSharePreview ? 'Hide share preview' : 'Preview text before sharing'}
              </button>

              {showSharePreview && (
                <pre className="p-3 rounded-xl bg-surface-container-high border border-outline-variant/20 text-xs text-on-surface whitespace-pre-wrap font-mono">
                  {shareText}
                </pre>
              )}
            </div>

            <div className="pt-2 flex justify-center gap-3">
              <Button
                variant="primary"
                size="md"
                icon={copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Share2 className="w-4 h-4" />}
                onClick={handleShare}
              >
                {copied ? 'Copied to Clipboard!' : 'Share Our Year in Love'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
