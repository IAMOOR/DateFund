/**
 * DateFund South African Rand & Date Formatting Utilities
 * Standardized across the entire application for 100% consistency.
 */

/**
 * Format any numeric value or numeric string to South African Rand (e.g. "R 1,250.00").
 * Safely handles undefined, null, zero, and negative values.
 */
export function formatRand(amount: number | string | undefined | null): string {
  if (amount === undefined || amount === null) return 'R 0.00';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return 'R 0.00';
  
  const isNegative = num < 0;
  const absNum = Math.abs(num);
  const formatted = absNum.toLocaleString('en-ZA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  return `${isNegative ? '-' : ''}R ${formatted}`;
}

/**
 * Format date string (YYYY-MM-DD or ISO) into human friendly short date (e.g. "24 Oct 2026").
 */
export function formatDateShort(dateStr: string | undefined | null): string {
  if (!dateStr) return 'No date';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

/**
 * Format date string into medium date with weekday (e.g. "Sat, 24 Oct").
 */
export function formatDateWithDay(dateStr: string | undefined | null): string {
  if (!dateStr) return 'No date';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short' });
  } catch {
    return dateStr;
  }
}

/**
 * Safe goal pace analysis:
 * Prevents NaN, infinite loops, and handles missing/past deadlines gracefully.
 */
export interface GoalPaceResult {
  daysRemaining: number;
  weeksRemaining: number;
  remainingAmount: number;
  requiredWeekly: number;
  currentWeeklyRate: number;
  percentComplete: number;
  isOverdue: boolean;
  isComplete: boolean;
  isBehindPace: boolean;
  statusText: string;
}

export function calculateGoalPace(
  targetAmount: number,
  currentAmount: number,
  deadline: string,
  recentDepositsAmount: number = 0,
  recentDaysWindow: number = 30
): GoalPaceResult {
  const safeTarget = Math.max(0, targetAmount || 0);
  const safeCurrent = Math.max(0, currentAmount || 0);
  const remainingAmount = Math.max(0, safeTarget - safeCurrent);
  const percentComplete = safeTarget > 0 ? Math.min(100, Math.round((safeCurrent / safeTarget) * 100)) : 100;
  
  if (safeCurrent >= safeTarget && safeTarget > 0) {
    return {
      daysRemaining: 0,
      weeksRemaining: 0,
      remainingAmount: 0,
      requiredWeekly: 0,
      currentWeeklyRate: 0,
      percentComplete: 100,
      isOverdue: false,
      isComplete: true,
      isBehindPace: false,
      statusText: 'Goal Achieved! 🎉'
    };
  }

  if (!deadline) {
    return {
      daysRemaining: 0,
      weeksRemaining: 0,
      remainingAmount,
      requiredWeekly: 0,
      currentWeeklyRate: 0,
      percentComplete,
      isOverdue: false,
      isComplete: false,
      isBehindPace: false,
      statusText: 'No deadline set'
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const targetDate = new Date(deadline);
  targetDate.setHours(0, 0, 0, 0);

  const diffTime = targetDate.getTime() - today.getTime();
  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const isOverdue = daysRemaining < 0;

  if (isOverdue) {
    return {
      daysRemaining,
      weeksRemaining: 0,
      remainingAmount,
      requiredWeekly: remainingAmount,
      currentWeeklyRate: 0,
      percentComplete,
      isOverdue: true,
      isComplete: false,
      isBehindPace: true,
      statusText: `Past deadline by ${Math.abs(daysRemaining)} day${Math.abs(daysRemaining) === 1 ? '' : 's'}`
    };
  }

  const weeksRemaining = Math.max(1, Math.ceil(daysRemaining / 7));
  const requiredWeekly = Math.ceil(remainingAmount / weeksRemaining);

  const currentWeeklyRate = recentDaysWindow > 0 
    ? (recentDepositsAmount / recentDaysWindow) * 7 
    : 0;

  const isBehindPace = remainingAmount > 0 && currentWeeklyRate < (requiredWeekly * 0.85);

  return {
    daysRemaining,
    weeksRemaining,
    remainingAmount,
    requiredWeekly,
    currentWeeklyRate,
    percentComplete,
    isOverdue: false,
    isComplete: false,
    isBehindPace,
    statusText: isBehindPace ? 'Savings rate behind schedule' : 'On track to meet goal'
  };
}
