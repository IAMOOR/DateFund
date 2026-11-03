import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  Plus,
  Search,
  Filter,
  Sparkles,
  CheckCircle2,
  Archive,
  TrendingUp,
  AlertTriangle,
  Calendar,
  Pencil,
  Trash2,
  ArchiveRestore,
  MoreVertical,
  PiggyBank,
  Target,
  Coins,
  Check,
  RotateCcw
} from 'lucide-react';
import { Goal, Transaction } from '../../types';
import { formatRand, formatDateShort, calculateGoalPace } from '../../utils/formatters';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { StatusBadge } from '../ui/StatusBadge';
import { hapticLight, hapticMedium } from '../../utils/haptics';

interface DreamsViewProps {
  goals: Goal[];
  transactions: Transaction[];
  onBack: () => void;
  onNewDream: () => void;
  onRecordContribution: (goal: Goal) => void;
  onAdjustGoal: (goal: Goal) => void;
  onEditGoal: (goal: Goal) => void;
  onArchiveGoal: (goalId: string) => void;
  onUnarchiveGoal: (goalId: string) => void;
  onDeleteGoal: (goalId: string) => void;
}

type GoalFilter = 'in-progress' | 'completed' | 'archived' | 'all';
type GoalSort = 'deadline-asc' | 'deadline-desc' | 'progress-desc' | 'target-desc';

export const DreamsView: React.FC<DreamsViewProps> = ({
  goals,
  transactions,
  onBack,
  onNewDream,
  onRecordContribution,
  onAdjustGoal,
  onEditGoal,
  onArchiveGoal,
  onUnarchiveGoal,
  onDeleteGoal,
}) => {
  const [filter, setFilter] = useState<GoalFilter>('in-progress');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<GoalSort>('deadline-asc');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [goalToDelete, setGoalToDelete] = useState<Goal | null>(null);

  // Group goals into categories
  const activeGoals = useMemo(() => goals.filter((g) => !g.archived), [goals]);
  const archivedGoals = useMemo(() => goals.filter((g) => !!g.archived), [goals]);

  const inProgressGoals = useMemo(() => {
    return activeGoals.filter((g) => g.currentAmount < g.targetAmount);
  }, [activeGoals]);

  const completedGoals = useMemo(() => {
    return activeGoals.filter((g) => g.currentAmount >= g.targetAmount);
  }, [activeGoals]);

  // Aggregate stats across active goals
  const stats = useMemo(() => {
    const totalTarget = activeGoals.reduce((sum, g) => sum + (g.targetAmount || 0), 0);
    const totalSaved = activeGoals.reduce((sum, g) => sum + (g.currentAmount || 0), 0);
    const overallProgress = totalTarget > 0 ? Math.min(100, Math.round((totalSaved / totalTarget) * 100)) : 0;
    return {
      totalTarget,
      totalSaved,
      overallProgress,
      activeCount: inProgressGoals.length,
      completedCount: completedGoals.length,
      archivedCount: archivedGoals.length,
      totalCount: goals.length,
    };
  }, [activeGoals, inProgressGoals, completedGoals, archivedGoals, goals]);

  // Filtered and sorted goals list
  const filteredGoals = useMemo(() => {
    let list: Goal[] = [];

    switch (filter) {
      case 'in-progress':
        list = inProgressGoals;
        break;
      case 'completed':
        list = completedGoals;
        break;
      case 'archived':
        list = archivedGoals;
        break;
      case 'all':
      default:
        list = goals;
        break;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((g) => g.name.toLowerCase().includes(q));
    }

    // Sort
    return [...list].sort((a, b) => {
      if (sortOption === 'deadline-asc') {
        return new Date(a.deadline || '').getTime() - new Date(b.deadline || '').getTime();
      }
      if (sortOption === 'deadline-desc') {
        return new Date(b.deadline || '').getTime() - new Date(a.deadline || '').getTime();
      }
      if (sortOption === 'progress-desc') {
        const progA = a.targetAmount > 0 ? a.currentAmount / a.targetAmount : 0;
        const progB = b.targetAmount > 0 ? b.currentAmount / b.targetAmount : 0;
        return progB - progA;
      }
      if (sortOption === 'target-desc') {
        return b.targetAmount - a.targetAmount;
      }
      return 0;
    });
  }, [filter, inProgressGoals, completedGoals, archivedGoals, goals, searchQuery, sortOption]);

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* Top Bar Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-outline-variant/10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              hapticLight();
              onBack();
            }}
            className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-outline hover:text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer border border-outline-variant/15 shrink-0"
            aria-label="Back to home"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-on-surface">Our Dreams</h2>
            <p className="text-xs sm:text-sm text-outline">
              Shared savings goals, trips, and romance milestones
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            onClick={() => {
              hapticMedium();
              onNewDream();
            }}
            size="sm"
            className="shadow-md shadow-primary/20"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Plant New Dream
          </Button>
        </div>
      </div>

      {/* Aggregate Financial Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card variant="flat" padding="md" className="space-y-1">
          <div className="flex items-center gap-2 text-outline text-xs font-medium">
            <Coins className="w-4 h-4 text-primary" />
            <span>Total Saved</span>
          </div>
          <p className="text-lg sm:text-2xl font-serif font-bold text-on-surface">
            {formatRand(stats.totalSaved)}
          </p>
          <p className="text-[11px] text-outline/80">Across active goals</p>
        </Card>

        <Card variant="flat" padding="md" className="space-y-1">
          <div className="flex items-center gap-2 text-outline text-xs font-medium">
            <Target className="w-4 h-4 text-secondary" />
            <span>Target Fund</span>
          </div>
          <p className="text-lg sm:text-2xl font-serif font-bold text-on-surface">
            {formatRand(stats.totalTarget)}
          </p>
          <p className="text-[11px] text-outline/80">Combined goal target</p>
        </Card>

        <Card variant="flat" padding="md" className="space-y-1">
          <div className="flex items-center gap-2 text-outline text-xs font-medium">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Overall Progress</span>
          </div>
          <p className="text-lg sm:text-2xl font-serif font-bold text-primary">
            {stats.overallProgress}%
          </p>
          <div className="h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden mt-1">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${stats.overallProgress}%` }}
            />
          </div>
        </Card>

        <Card variant="flat" padding="md" className="space-y-1">
          <div className="flex items-center gap-2 text-outline text-xs font-medium">
            <PiggyBank className="w-4 h-4 text-primary" />
            <span>Goals Status</span>
          </div>
          <p className="text-lg sm:text-2xl font-serif font-bold text-on-surface">
            {stats.activeCount} <span className="text-xs font-normal text-outline">Active</span> /{' '}
            {stats.completedCount} <span className="text-xs font-normal text-secondary">Done</span>
          </p>
          <p className="text-[11px] text-outline/80">
            {stats.archivedCount > 0 ? `${stats.archivedCount} in archive` : 'No archived goals'}
          </p>
        </Card>
      </div>

      {/* Filter Tabs & Search Controls */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-1">
        {/* Quick Filter Buttons */}
        <div className="flex items-center gap-1.5 bg-surface-container p-1 rounded-xl border border-outline-variant/15 overflow-x-auto no-scrollbar">
          <button
            onClick={() => {
              hapticLight();
              setFilter('in-progress');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              filter === 'in-progress'
                ? 'bg-primary text-on-primary-fixed shadow-xs'
                : 'text-outline hover:text-on-surface'
            }`}
          >
            <span>In Progress</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                filter === 'in-progress' ? 'bg-white/20 text-white' : 'bg-surface-container-high text-outline'
              }`}
            >
              {inProgressGoals.length}
            </span>
          </button>

          <button
            onClick={() => {
              hapticLight();
              setFilter('completed');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              filter === 'completed'
                ? 'bg-primary text-on-primary-fixed shadow-xs'
                : 'text-outline hover:text-on-surface'
            }`}
          >
            <span>Completed</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                filter === 'completed' ? 'bg-white/20 text-white' : 'bg-surface-container-high text-outline'
              }`}
            >
              {completedGoals.length}
            </span>
          </button>

          <button
            onClick={() => {
              hapticLight();
              setFilter('archived');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              filter === 'archived'
                ? 'bg-primary text-on-primary-fixed shadow-xs'
                : 'text-outline hover:text-on-surface'
            }`}
          >
            <span>Archived</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                filter === 'archived' ? 'bg-white/20 text-white' : 'bg-surface-container-high text-outline'
              }`}
            >
              {archivedGoals.length}
            </span>
          </button>

          <button
            onClick={() => {
              hapticLight();
              setFilter('all');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              filter === 'all'
                ? 'bg-primary text-on-primary-fixed shadow-xs'
                : 'text-outline hover:text-on-surface'
            }`}
          >
            <span>All Goals</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                filter === 'all' ? 'bg-white/20 text-white' : 'bg-surface-container-high text-outline'
              }`}
            >
              {goals.length}
            </span>
          </button>
        </div>

        {/* Search & Sort Controls */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 md:w-56">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-outline/60" />
            <input
              type="text"
              placeholder="Search dream name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface-container pl-8 pr-3 py-1.5 rounded-xl border border-outline-variant/15 text-xs text-on-surface placeholder:text-outline/50 outline-none focus:border-primary transition-all"
            />
          </div>

          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value as GoalSort)}
            className="bg-surface-container px-3 py-1.5 rounded-xl border border-outline-variant/15 text-xs text-on-surface outline-none cursor-pointer hover:bg-surface-container-high transition-colors"
            aria-label="Sort goals"
          >
            <option value="deadline-asc">Deadline (Soonest)</option>
            <option value="deadline-desc">Deadline (Latest)</option>
            <option value="progress-desc">Progress (%)</option>
            <option value="target-desc">Target (Highest)</option>
          </select>
        </div>
      </div>

      {/* Grid of Goals */}
      {filteredGoals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredGoals.map((goal) => {
            const pace = calculateGoalPace(
              goal.targetAmount,
              goal.currentAmount,
              goal.deadline
            );
            const percent = goal.targetAmount > 0
              ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100))
              : 100;
            const isCompleted = goal.currentAmount >= goal.targetAmount;
            const isArchived = !!goal.archived;
            const isOverdue = pace.isOverdue && !isCompleted;

            // Bar color
            let progressBg = 'bg-primary';
            if (isArchived) {
              progressBg = 'bg-outline/50';
            } else if (isCompleted) {
              progressBg = 'bg-secondary';
            } else if (isOverdue) {
              progressBg = 'bg-error';
            } else if (pace.isBehindPace) {
              progressBg = 'bg-gradient-to-r from-amber-500 via-amber-400 to-orange-500';
            }

            return (
              <Card
                key={goal.id}
                variant="high"
                padding="lg"
                className={`flex flex-col justify-between group transition-all space-y-4 relative ${
                  isArchived
                    ? 'opacity-80 border-dashed border-outline-variant/30'
                    : isOverdue
                    ? 'border-error/30'
                    : pace.isBehindPace
                    ? 'border-amber-500/30'
                    : 'border-outline-variant/15'
                }`}
              >
                {/* Header: Status Pill & Menu */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {isArchived ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-outline bg-surface-container-highest px-2.5 py-0.5 rounded-full">
                          <Archive className="w-3 h-3" /> Archived
                        </span>
                      ) : isCompleted ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-secondary bg-secondary/15 px-2.5 py-0.5 rounded-full border border-secondary/20">
                          <CheckCircle2 className="w-3 h-3" /> Goal Achieved
                        </span>
                      ) : isOverdue ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-error bg-error/15 px-2.5 py-0.5 rounded-full border border-error/20">
                          <AlertTriangle className="w-3 h-3" /> Overdue
                        </span>
                      ) : pace.isBehindPace ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 rounded-full">
                          <TrendingUp className="w-3 h-3 text-amber-500" /> Need {formatRand(pace.requiredWeekly)}/wk
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
                          <Sparkles className="w-3 h-3" /> In Progress
                        </span>
                      )}

                      {!isArchived && !isCompleted && pace.daysRemaining > 0 && (
                        <span className="text-[11px] text-outline font-medium">
                          {pace.daysRemaining}d remaining
                        </span>
                      )}
                    </div>

                    {/* Context Menu Button */}
                    <div className="relative">
                      <button
                        onClick={() => setActiveMenuId(activeMenuId === goal.id ? null : goal.id)}
                        className="w-8 h-8 rounded-lg hover:bg-surface-container-high flex items-center justify-center text-outline hover:text-on-surface transition-colors cursor-pointer"
                        aria-label="Goal actions"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {/* Dropdown Menu */}
                      {activeMenuId === goal.id && (
                        <div className="absolute right-0 top-full mt-1 w-44 bg-surface-container rounded-xl shadow-xl border border-outline-variant/20 py-1.5 z-30 animate-in fade-in zoom-in-95 duration-150">
                          {!isArchived && (
                            <>
                              <button
                                onClick={() => {
                                  setActiveMenuId(null);
                                  onRecordContribution(goal);
                                }}
                                className="w-full text-left px-3.5 py-2 text-xs font-medium text-on-surface hover:bg-surface-container-high flex items-center gap-2 cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5 text-primary" />
                                <span>Record contribution</span>
                              </button>
                              <button
                                onClick={() => {
                                  setActiveMenuId(null);
                                  onAdjustGoal(goal);
                                }}
                                className="w-full text-left px-3.5 py-2 text-xs font-medium text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 flex items-center gap-2 cursor-pointer"
                              >
                                <TrendingUp className="w-3.5 h-3.5" />
                                <span>Adjust savings plan</span>
                              </button>
                              <button
                                onClick={() => {
                                  setActiveMenuId(null);
                                  onEditGoal(goal);
                                }}
                                className="w-full text-left px-3.5 py-2 text-xs font-medium text-on-surface hover:bg-surface-container-high flex items-center gap-2 cursor-pointer"
                              >
                                <Pencil className="w-3.5 h-3.5 text-outline" />
                                <span>Edit goal details</span>
                              </button>
                              <button
                                onClick={() => {
                                  setActiveMenuId(null);
                                  onArchiveGoal(goal.id);
                                }}
                                className="w-full text-left px-3.5 py-2 text-xs font-medium text-outline hover:text-on-surface hover:bg-surface-container-high flex items-center gap-2 cursor-pointer"
                              >
                                <Archive className="w-3.5 h-3.5" />
                                <span>Archive goal</span>
                              </button>
                            </>
                          )}

                          {isArchived && (
                            <button
                              onClick={() => {
                                setActiveMenuId(null);
                                onUnarchiveGoal(goal.id);
                              }}
                              className="w-full text-left px-3.5 py-2 text-xs font-medium text-secondary hover:bg-secondary/10 flex items-center gap-2 cursor-pointer"
                            >
                              <ArchiveRestore className="w-3.5 h-3.5" />
                              <span>Restore to active</span>
                            </button>
                          )}

                          <div className="my-1 border-t border-outline-variant/10" />

                          <button
                            onClick={() => {
                              setActiveMenuId(null);
                              setGoalToDelete(goal);
                            }}
                            className="w-full text-left px-3.5 py-2 text-xs font-medium text-error hover:bg-error/10 flex items-center gap-2 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete permanently</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Goal Name & Target Date */}
                  <div>
                    <h4 className="text-xl font-serif font-bold text-on-surface group-hover:text-primary transition-colors line-clamp-1">
                      {goal.name}
                    </h4>
                    <p className="text-xs text-outline flex items-center gap-1.5 mt-0.5">
                      <Calendar className="w-3.5 h-3.5 text-primary/70 shrink-0" />
                      <span>Target Date: {formatDateShort(goal.deadline)}</span>
                    </p>
                  </div>
                </div>

                {/* Progress Bar & Amounts */}
                <div className="space-y-2 pt-1">
                  <div className="flex justify-between items-baseline text-xs sm:text-sm">
                    <span className="font-semibold text-on-surface">
                      {formatRand(goal.currentAmount)}
                      <span className="font-normal text-outline/80 ml-1">
                        of {formatRand(goal.targetAmount)}
                      </span>
                    </span>
                    <span
                      className={`font-bold ${
                        isCompleted
                          ? 'text-secondary'
                          : pace.isBehindPace
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-primary'
                      }`}
                    >
                      {percent}%
                    </span>
                  </div>

                  <div className="h-2 w-full bg-surface-container-highest/60 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${progressBg}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  <div className="flex justify-between items-center text-[11px] text-outline/80 pt-0.5">
                    <span>
                      {isCompleted
                        ? '100% achieved'
                        : `${formatRand(Math.max(0, goal.targetAmount - goal.currentAmount))} remaining`}
                    </span>
                    {!isArchived && !isCompleted && pace.requiredWeekly > 0 && (
                      <span className="font-medium text-on-surface/90">
                        {formatRand(pace.requiredWeekly)}/wk needed
                      </span>
                    )}
                  </div>
                </div>

                {/* Primary Card Actions */}
                <div className="pt-2 border-t border-outline-variant/10 flex items-center justify-between gap-2">
                  {!isArchived && !isCompleted ? (
                    <>
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => {
                          hapticMedium();
                          onRecordContribution(goal);
                        }}
                        className="flex-1"
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        Record
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          hapticLight();
                          onAdjustGoal(goal);
                        }}
                      >
                        Adjust
                      </Button>
                    </>
                  ) : isArchived ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        hapticLight();
                        onUnarchiveGoal(goal.id);
                      }}
                      className="w-full text-secondary hover:text-secondary"
                    >
                      <ArchiveRestore className="w-3.5 h-3.5 mr-1.5" />
                      Restore Goal
                    </Button>
                  ) : (
                    <div className="w-full flex items-center justify-between text-xs text-secondary font-semibold py-1">
                      <span className="flex items-center gap-1.5">
                        <Check className="w-4 h-4" /> Ready for your celebration date!
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onEditGoal(goal)}
                        className="text-xs"
                      >
                        Edit
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-16 px-4 bg-surface-container-low rounded-3xl border border-dashed border-outline-variant/20 space-y-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto text-primary">
            {filter === 'completed' ? (
              <CheckCircle2 className="w-8 h-8 opacity-60" />
            ) : filter === 'archived' ? (
              <Archive className="w-8 h-8 opacity-60" />
            ) : (
              <PiggyBank className="w-8 h-8 opacity-60" />
            )}
          </div>
          <div className="space-y-1 max-w-sm mx-auto">
            <h4 className="text-lg font-serif font-bold text-on-surface">
              {filter === 'completed'
                ? 'No completed dreams yet'
                : filter === 'archived'
                ? 'No archived goals'
                : filter === 'in-progress'
                ? 'No dreams in progress'
                : 'No dreams found'}
            </h4>
            <p className="text-xs text-outline leading-relaxed">
              {filter === 'completed'
                ? 'Keep contributing toward your active goals. Every rand brings you closer to crossing off your next milestone!'
                : filter === 'archived'
                ? 'When you adjust or retire a goal without deleting it, it will be preserved safely right here.'
                : filter === 'in-progress'
                ? 'All your dreams have been achieved! Plant a brand new dream to start your next shared savings adventure.'
                : searchQuery
                ? `No dreams match "${searchQuery}". Try a different keyword.`
                : 'Plant your first dream goal to begin saving jointly for candlelit dinners, trips, and romance.'}
            </p>
          </div>
          <Button
            onClick={() => {
              hapticMedium();
              onNewDream();
            }}
            size="sm"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Plant a Dream
          </Button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {goalToDelete && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm bg-surface-container rounded-2xl p-6 border border-outline-variant/20 shadow-2xl space-y-4"
          >
            <div className="w-12 h-12 rounded-full bg-error/15 text-error flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h4 className="text-lg font-serif font-bold text-on-surface">Delete Dream?</h4>
              <p className="text-xs text-outline leading-relaxed">
                Are you sure you want to delete <strong className="text-on-surface font-semibold">"{goalToDelete.name}"</strong>? This will remove the goal from your couple fund.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setGoalToDelete(null)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                className="flex-1"
                onClick={() => {
                  onDeleteGoal(goalToDelete.id);
                  setGoalToDelete(null);
                }}
              >
                Delete
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default DreamsView;
