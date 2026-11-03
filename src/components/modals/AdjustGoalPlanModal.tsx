import React, { useState } from 'react';
import { Calendar, Target, Archive, AlertTriangle, ArrowRight, Check } from 'lucide-react';
import { Goal } from '../../types';
import { formatRand, calculateGoalPace } from '../../utils/formatters';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { hapticSuccess } from '../../utils/haptics';

interface AdjustGoalPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal: Goal | null;
  onSaveAdjustedGoal: (updatedGoal: Goal) => Promise<void>;
  onArchiveGoal?: (goalId: string) => Promise<void>;
}

export default function AdjustGoalPlanModal({
  isOpen,
  onClose,
  goal,
  onSaveAdjustedGoal,
  onArchiveGoal,
}: AdjustGoalPlanModalProps) {
  if (!goal) return null;

  const [deadline, setDeadline] = useState(goal.deadline || '');
  const [targetAmount, setTargetAmount] = useState(goal.targetAmount.toString());
  const [goalName, setGoalName] = useState(goal.name);
  const [isSaving, setIsSaving] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);

  const pace = calculateGoalPace(parseFloat(targetAmount) || goal.targetAmount, goal.currentAmount, deadline);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedTarget = parseFloat(targetAmount);
    if (isNaN(parsedTarget) || parsedTarget <= 0 || !deadline) return;

    setIsSaving(true);
    try {
      await onSaveAdjustedGoal({
        ...goal,
        name: goalName.trim() || goal.name,
        targetAmount: parsedTarget,
        deadline,
      });
      hapticSuccess();
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const handleArchive = async () => {
    if (!onArchiveGoal) return;
    setIsArchiving(true);
    try {
      await onArchiveGoal(goal.id);
      hapticSuccess();
      onClose();
    } finally {
      setIsArchiving(false);
    }
  };

  // Quick deadline adjustments
  const addMonthsToDeadline = (months: number) => {
    const base = new Date();
    base.setMonth(base.getMonth() + months);
    setDeadline(base.toISOString().split('T')[0]);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Adjust Savings Plan"
      description={`Update schedule or targets for ${goal.name}`}
    >
      <form onSubmit={handleSave} className="space-y-4 pt-1">
        {pace.isOverdue && (
          <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-semibold">Goal Target Date Passed</strong>
              <span>
                Extend your deadline to establish a realistic weekly contribution plan that you and your partner can achieve.
              </span>
            </div>
          </div>
        )}

        <Input
          label="Goal Name"
          value={goalName}
          onChange={e => setGoalName(e.target.value)}
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Target Amount (ZAR)"
            type="number"
            min="1"
            step="100"
            required
            value={targetAmount}
            onChange={e => setTargetAmount(e.target.value)}
          />

          <Input
            label="New Target Deadline"
            type="date"
            required
            value={deadline}
            onChange={e => setDeadline(e.target.value)}
          />
        </div>

        {/* Quick Deadline Extensions */}
        <div className="space-y-1 text-left">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-outline block">
            Quick extend deadline:
          </span>
          <div className="flex gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => addMonthsToDeadline(1)}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/20 text-on-surface transition-colors cursor-pointer"
            >
              +1 Month
            </button>
            <button
              type="button"
              onClick={() => addMonthsToDeadline(3)}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/20 text-on-surface transition-colors cursor-pointer"
            >
              +3 Months
            </button>
            <button
              type="button"
              onClick={() => addMonthsToDeadline(6)}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/20 text-on-surface transition-colors cursor-pointer"
            >
              +6 Months
            </button>
          </div>
        </div>

        {/* Live Plan Calculation Preview */}
        <div className="p-3.5 rounded-2xl bg-surface-container border border-outline-variant/15 text-xs space-y-2">
          <div className="flex justify-between items-center text-outline">
            <span>Remaining to save:</span>
            <span className="font-serif font-bold text-on-surface text-sm">{formatRand(pace.remainingAmount)}</span>
          </div>
          <div className="flex justify-between items-center text-outline">
            <span>Weeks remaining:</span>
            <span className="font-semibold text-on-surface">{pace.weeksRemaining} week{pace.weeksRemaining === 1 ? '' : 's'}</span>
          </div>
          <div className="flex justify-between items-center text-outline pt-1 border-t border-outline-variant/10">
            <span className="font-semibold text-on-surface">Suggested weekly couple savings:</span>
            <span className="font-serif font-bold text-primary text-base">{formatRand(pace.requiredWeekly)}/wk</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-outline-variant/10">
          {onArchiveGoal && (
            <Button
              variant="ghost"
              size="sm"
              className="text-rose-600 hover:bg-rose-500/10"
              icon={<Archive className="w-3.5 h-3.5" />}
              isLoading={isArchiving}
              onClick={handleArchive}
            >
              Archive Goal
            </Button>
          )}

          <div className="flex gap-2 ml-auto">
            <Button variant="ghost" size="md" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" size="md" type="submit" isLoading={isSaving}>
              Save Plan
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
