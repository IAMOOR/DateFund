import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Utensils, RotateCcw, Percent, X, Check, Heart, UserCheck, Edit3 } from 'lucide-react';
import { Event } from '../../types';
import { formatRand } from '../../utils/formatters';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { hapticLight, hapticSuccess } from '../../utils/haptics';

interface WhoTreatsSplitterModalProps {
  isOpen: boolean;
  onClose: () => void;
  events?: Event[];
  lastTreatedBy?: 'Me' | 'Them';
  onUpdateTreatTurn?: (treatedBy: 'Me' | 'Them', note?: string) => void;
}

export default function WhoTreatsSplitterModal({
  isOpen,
  onClose,
  events = [],
  lastTreatedBy: initialLastTreated = 'Them',
  onUpdateTreatTurn,
}: WhoTreatsSplitterModalProps) {
  const [mode, setMode] = useState<'turn' | 'split' | 'ratio'>('turn');
  const [billAmount, setBillAmount] = useState('650');
  const [customRatio, setCustomRatio] = useState(50); // Percent for 'Me'
  const [lastTreatedBy, setLastTreatedBy] = useState<'Me' | 'Them'>(initialLastTreated);
  const [overrideReason, setOverrideReason] = useState('');
  const [isEditingTurn, setIsEditingTurn] = useState(false);

  if (!isOpen) return null;

  // The one who treats next is the partner opposite to the one who treated last
  const whoTreatsNext = lastTreatedBy === 'Me' ? 'Them' : 'Me';

  // Split calculation with safe positive amounts
  const parsedBill = Math.max(0, parseFloat(billAmount) || 0);
  const split50 = parsedBill / 2;
  const meRatioAmount = (parsedBill * customRatio) / 100;
  const themRatioAmount = (parsedBill * (100 - customRatio)) / 100;

  const handleToggleTurn = (newTurn: 'Me' | 'Them') => {
    hapticSuccess();
    setLastTreatedBy(newTurn === 'Me' ? 'Them' : 'Me');
    if (onUpdateTreatTurn) {
      onUpdateTreatTurn(newTurn === 'Me' ? 'Them' : 'Me', overrideReason || 'Manual turn update');
    }
    setIsEditingTurn(false);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Who Treats Next? & Bill Splitter"
      description="Keep score of date night turns without awkward money talk"
    >
      <div className="space-y-5 pt-1 text-center">
        {/* Tab Selector */}
        <div className="grid grid-cols-3 p-1 bg-surface-container-high rounded-2xl">
          <button
            type="button"
            onClick={() => { hapticLight(); setMode('turn'); }}
            className={`py-2 rounded-xl text-xs font-bold transition-all ${
              mode === 'turn'
                ? 'bg-primary text-on-primary-fixed shadow-xs'
                : 'text-outline hover:text-on-surface'
            }`}
          >
            Treat Turn
          </button>
          <button
            type="button"
            onClick={() => { hapticLight(); setMode('split'); }}
            className={`py-2 rounded-xl text-xs font-bold transition-all ${
              mode === 'split'
                ? 'bg-primary text-on-primary-fixed shadow-xs'
                : 'text-outline hover:text-on-surface'
            }`}
          >
            50 / 50 Split
          </button>
          <button
            type="button"
            onClick={() => { hapticLight(); setMode('ratio'); }}
            className={`py-2 rounded-xl text-xs font-bold transition-all ${
              mode === 'ratio'
                ? 'bg-primary text-on-primary-fixed shadow-xs'
                : 'text-outline hover:text-on-surface'
            }`}
          >
            Custom Split
          </button>
        </div>

        {/* Tab 1: Treat Rotator */}
        {mode === 'turn' && (
          <div className="space-y-4">
            <div className="relative p-6 rounded-3xl bg-surface-container-high/60 border border-outline-variant/15 flex flex-col items-center justify-center">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-outline mb-1">
                Next Date Night Bill:
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-primary flex items-center gap-2">
                <Utensils className="w-7 h-7 text-secondary" />
                {whoTreatsNext === 'Me' ? "It's My Turn to Treat! 🍷" : "It's Their Turn to Treat! 🥂"}
              </h2>
              <p className="text-xs text-outline/80 mt-2 max-w-sm">
                Based on your recorded couple outings. {lastTreatedBy === 'Me' ? 'You treated on the last date.' : 'Your partner treated on the last date.'}
              </p>
            </div>

            {/* Manual Override Option */}
            <div className="p-3.5 rounded-2xl bg-surface-container border border-outline-variant/15 text-left space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-on-surface flex items-center gap-1.5">
                  <RotateCcw className="w-3.5 h-3.5 text-secondary" />
                  Override Turn
                </span>
                <button
                  type="button"
                  onClick={() => setIsEditingTurn(!isEditingTurn)}
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  {isEditingTurn ? 'Cancel' : 'Change Turn'}
                </button>
              </div>

              {isEditingTurn && (
                <div className="pt-2 border-t border-outline-variant/10 space-y-3">
                  <p className="text-[11px] text-outline">
                    Did someone treat for a birthday, anniversary, or spontaneous surprise? Select whose turn it actually is:
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant={whoTreatsNext === 'Me' ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => handleToggleTurn('Me')}
                    >
                      Set to Me
                    </Button>
                    <Button
                      variant={whoTreatsNext === 'Them' ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => handleToggleTurn('Them')}
                    >
                      Set to Partner
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: 50/50 Split */}
        {mode === 'split' && (
          <div className="space-y-4">
            <Input
              label="Total Bill (ZAR)"
              type="number"
              min="0"
              step="10"
              value={billAmount}
              onChange={e => setBillAmount(e.target.value)}
              placeholder="e.g. 650.00"
            />

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-4 rounded-2xl bg-surface-container border border-outline-variant/15 space-y-1">
                <span className="text-[10px] uppercase font-bold text-primary tracking-wider block">My Half (50%)</span>
                <p className="font-serif text-2xl font-bold text-on-surface">{formatRand(split50)}</p>
              </div>
              <div className="p-4 rounded-2xl bg-surface-container border border-outline-variant/15 space-y-1">
                <span className="text-[10px] uppercase font-bold text-secondary tracking-wider block">Their Half (50%)</span>
                <p className="font-serif text-2xl font-bold text-on-surface">{formatRand(split50)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Custom Ratio Split */}
        {mode === 'ratio' && (
          <div className="space-y-4">
            <Input
              label="Total Bill (ZAR)"
              type="number"
              min="0"
              step="10"
              value={billAmount}
              onChange={e => setBillAmount(e.target.value)}
              placeholder="e.g. 850.00"
            />

            <div className="space-y-2 text-left pt-1">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-primary">Me: {customRatio}% ({formatRand(meRatioAmount)})</span>
                <span className="text-secondary">Them: {100 - customRatio}% ({formatRand(themRatioAmount)})</span>
              </div>
              <input
                type="range"
                min="10"
                max="90"
                step="5"
                value={customRatio}
                onChange={e => setCustomRatio(parseInt(e.target.value, 10))}
                className="w-full accent-primary cursor-pointer h-2 bg-surface-container rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-outline">
                <span>10% / 90%</span>
                <span>50% / 50%</span>
                <span>90% / 10%</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-4 rounded-2xl bg-surface-container border border-outline-variant/15 space-y-1 text-center">
                <span className="text-[10px] uppercase font-bold text-primary tracking-wider block">Me</span>
                <p className="font-serif text-2xl font-bold text-on-surface">{formatRand(meRatioAmount)}</p>
              </div>
              <div className="p-4 rounded-2xl bg-surface-container border border-outline-variant/15 space-y-1 text-center">
                <span className="text-[10px] uppercase font-bold text-secondary tracking-wider block">Them</span>
                <p className="font-serif text-2xl font-bold text-on-surface">{formatRand(themRatioAmount)}</p>
              </div>
            </div>
          </div>
        )}

        <div className="pt-3 border-t border-outline-variant/10 flex justify-end">
          <Button variant="ghost" size="md" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </Modal>
  );
}
