import React, { useState } from 'react';
import { PiggyBank, AlertCircle, Info, Heart } from 'lucide-react';
import { Goal } from '../../types';
import { formatRand } from '../../utils/formatters';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { hapticSuccess } from '../../utils/haptics';

interface RecordContributionModalProps {
  isOpen: boolean;
  onClose: () => void;
  goals: Goal[];
  initialGoalId?: string;
  onRecordContribution: (data: {
    goalId: string;
    amount: number;
    contributor: 'Me' | 'Them';
    note?: string;
  }) => Promise<void>;
}

export default function RecordContributionModal({
  isOpen,
  onClose,
  goals,
  initialGoalId,
  onRecordContribution,
}: RecordContributionModalProps) {
  const [goalId, setGoalId] = useState(initialGoalId || (goals[0]?.id || ''));
  const [amount, setAmount] = useState('');
  const [contributor, setContributor] = useState<'Me' | 'Them'>('Me');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Keep selected goal in sync if initialGoalId changes
  React.useEffect(() => {
    if (initialGoalId) {
      setGoalId(initialGoalId);
    } else if (goals.length > 0 && !goalId) {
      setGoalId(goals[0].id);
    }
  }, [initialGoalId, goals]);

  const selectedGoal = goals.find(g => g.id === goalId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!goalId) {
      setError('Please select a savings goal.');
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Contribution amount must be greater than R 0.00.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onRecordContribution({
        goalId,
        amount: parsedAmount,
        contributor,
        note: note.trim() || undefined,
      });
      hapticSuccess();
      setAmount('');
      setNote('');
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to record contribution. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Contribution"
      description="Log a couple contribution towards your shared savings goal"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-1">
        {/* Transparency Disclaimer */}
        <div className="p-3 rounded-xl bg-surface-container-high/80 border border-outline-variant/15 text-xs text-outline flex items-start gap-2.5">
          <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Recording a contribution updates your shared DateFund ledger and goal progress. <strong>It does not transfer real money between bank accounts.</strong>
          </p>
        </div>

        {/* Goal Selector */}
        <div className="space-y-1.5 text-left">
          <label htmlFor="contribution-goal-select" className="block text-xs font-semibold uppercase tracking-wider text-outline">
            Savings Goal <span className="text-rose-500 font-bold">*</span>
          </label>
          <select
            id="contribution-goal-select"
            value={goalId}
            onChange={e => setGoalId(e.target.value)}
            required
            className="w-full min-h-[44px] bg-surface-container border border-outline-variant/30 rounded-xl px-3.5 py-2 text-sm text-on-surface outline-none focus:border-primary"
          >
            {goals.map(g => (
              <option key={g.id} value={g.id}>
                {g.name} ({formatRand(g.currentAmount)} / {formatRand(g.targetAmount)})
              </option>
            ))}
          </select>
        </div>

        {/* Contributor Selection */}
        <div className="space-y-1.5 text-left">
          <label className="block text-xs font-semibold uppercase tracking-wider text-outline">
            Who contributed?
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setContributor('Me')}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 cursor-pointer min-h-[44px] ${
                contributor === 'Me'
                  ? 'bg-primary text-on-primary-fixed border-primary shadow-xs'
                  : 'bg-surface-container text-outline border-outline-variant/20 hover:text-on-surface'
              }`}
            >
              <Heart className="w-3.5 h-3.5 fill-current" />
              Me
            </button>
            <button
              type="button"
              onClick={() => setContributor('Them')}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 cursor-pointer min-h-[44px] ${
                contributor === 'Them'
                  ? 'bg-secondary text-on-secondary border-secondary shadow-xs'
                  : 'bg-surface-container text-outline border-outline-variant/20 hover:text-on-surface'
              }`}
            >
              <Heart className="w-3.5 h-3.5 fill-current" />
              Partner (Them)
            </button>
          </div>
        </div>

        {/* Amount Input */}
        <Input
          label="Amount (ZAR)"
          type="number"
          step="0.01"
          min="1"
          required
          placeholder="e.g. 500.00"
          value={amount}
          onChange={e => {
            setAmount(e.target.value);
            setError('');
          }}
          helperText={
            selectedGoal
              ? `Remaining for ${selectedGoal.name}: ${formatRand(Math.max(0, selectedGoal.targetAmount - selectedGoal.currentAmount))}`
              : undefined
          }
        />

        {/* Quick Amount Suggestion Chips */}
        <div className="flex gap-2 items-center overflow-x-auto pb-1 no-scrollbar">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-outline shrink-0">Quick add:</span>
          {['100', '250', '500', '1000'].map(val => (
            <button
              key={val}
              type="button"
              onClick={() => setAmount(val)}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/20 text-on-surface transition-colors cursor-pointer"
            >
              +R {val}
            </button>
          ))}
        </div>

        {/* Optional Memo */}
        <Input
          label="Memo / Occasion (Optional)"
          placeholder="e.g. Monthly salary savings, birthday bonus"
          value={note}
          onChange={e => setNote(e.target.value)}
        />

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-500 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex justify-end gap-2.5 pt-3">
          <Button variant="ghost" size="md" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" size="md" type="submit" isLoading={isSubmitting}>
            Record Contribution
          </Button>
        </div>
      </form>
    </Modal>
  );
}
