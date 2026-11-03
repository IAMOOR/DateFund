import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';
import { TrendingUp, AlertCircle, CheckCircle2, Sparkles, BarChart2 } from 'lucide-react';
import { Goal, Transaction } from '../../types';
import { formatRand, calculateGoalPace } from '../../utils/formatters';

interface GoalPaceChartProps {
  goal: Goal;
  transactions: Transaction[];
  className?: string;
}

interface WeekDataPoint {
  weekKey: string;
  weekLabel: string;
  rangeLabel: string;
  contributed: number;
  required: number;
  isCurrentWeek: boolean;
  metTarget: boolean;
}

export const GoalPaceChart: React.FC<GoalPaceChartProps> = ({
  goal,
  transactions,
  className = ''
}) => {
  const [weeksToShow, setWeeksToShow] = useState<4 | 6>(5 as any); // default 5 weeks

  // Filter transactions for this goal and deposits only
  const goalTransactions = useMemo(() => {
    return transactions.filter(
      (tx) => tx.goalId === goal.id && tx.type === 'deposit'
    );
  }, [transactions, goal.id]);

  // Compute required weekly savings from calculateGoalPace
  const pace = useMemo(() => {
    return calculateGoalPace(
      goal.targetAmount,
      goal.currentAmount,
      goal.deadline
    );
  }, [goal.targetAmount, goal.currentAmount, goal.deadline]);

  // Generate week-by-week aggregated data
  const chartData = useMemo<WeekDataPoint[]>(() => {
    const points: WeekDataPoint[] = [];
    const count = 5; // 5 rolling 7-day windows ending today
    const now = new Date();
    now.setHours(23, 59, 59, 999);

    const requiredWeekly = pace.isComplete ? 0 : pace.requiredWeekly;

    for (let i = count - 1; i >= 0; i--) {
      // Each week interval: [end - 7d, end]
      const end = new Date(now);
      end.setDate(now.getDate() - (i * 7));
      end.setHours(23, 59, 59, 999);

      const start = new Date(end);
      start.setDate(end.getDate() - 6);
      start.setHours(0, 0, 0, 0);

      const isCurrentWeek = i === 0;

      // Filter transactions inside this week window
      const weekTxs = goalTransactions.filter((tx) => {
        const txDate = new Date(tx.date || tx.createdAt);
        return txDate >= start && txDate <= end;
      });

      const totalContributed = weekTxs.reduce((sum, tx) => sum + (tx.amount || 0), 0);

      // Labels
      let weekLabel = '';
      if (isCurrentWeek) {
        weekLabel = 'This Wk';
      } else if (i === 1) {
        weekLabel = 'Last Wk';
      } else {
        weekLabel = `${i}w Ago`;
      }

      const startFmt = start.toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' });
      const endFmt = end.toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' });

      points.push({
        weekKey: `wk-${i}`,
        weekLabel,
        rangeLabel: `${startFmt} - ${endFmt}`,
        contributed: Math.round(totalContributed * 100) / 100,
        required: requiredWeekly,
        isCurrentWeek,
        metTarget: totalContributed >= requiredWeekly && requiredWeekly > 0
      });
    }

    return points;
  }, [goalTransactions, pace.requiredWeekly, pace.isComplete]);

  // Current week progress
  const currentWeekPoint = chartData[chartData.length - 1];
  const thisWeekContributed = currentWeekPoint?.contributed || 0;
  const thisWeekRequired = currentWeekPoint?.required || 0;
  const isThisWeekOnTrack = thisWeekContributed >= thisWeekRequired && thisWeekRequired > 0;
  const shortfall = Math.max(0, thisWeekRequired - thisWeekContributed);

  // Maximum value for nice Y-axis headroom
  const maxVal = useMemo(() => {
    const highest = Math.max(
      ...chartData.map((d) => Math.max(d.contributed, d.required)),
      100
    );
    return Math.ceil(highest * 1.15);
  }, [chartData]);

  return (
    <div className={`p-4 sm:p-5 rounded-2xl bg-surface-container-high/40 border border-outline-variant/15 space-y-4 ${className}`}>
      {/* Header & Status Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <BarChart2 className="w-4 h-4" />
          </div>
          <div>
            <h5 className="text-xs sm:text-sm font-semibold text-on-surface">Weekly Contributions vs Required Pace</h5>
            <p className="text-[11px] text-outline">
              Target pace: <strong className="text-on-surface font-semibold">{formatRand(pace.requiredWeekly)}</strong>/week
            </p>
          </div>
        </div>

        {/* Current week status badge */}
        <div>
          {pace.isComplete ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-secondary/15 text-secondary border border-secondary/20">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Fully Funded
            </span>
          ) : isThisWeekOnTrack ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-secondary/15 text-secondary border border-secondary/20">
              <Sparkles className="w-3.5 h-3.5" />
              On Track This Week
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/25">
              <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
              {shortfall > 0 ? `Need ${formatRand(shortfall)} more` : 'Behind Weekly Pace'}
            </span>
          )}
        </div>
      </div>

      {/* Recharts Bar Chart */}
      <div className="h-[210px] w-full min-w-0 pt-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 12, right: 8, left: -18, bottom: 0 }}
            barGap={4}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="currentColor"
              className="text-outline-variant/15"
            />
            <XAxis
              dataKey="weekLabel"
              tickLine={false}
              axisLine={{ stroke: 'currentColor', className: 'text-outline-variant/20' }}
              tick={{ fontSize: 11, fill: 'currentColor', className: 'text-outline/80' }}
            />
            <YAxis
              domain={[0, maxVal]}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 10, fill: 'currentColor', className: 'text-outline/70' }}
              tickFormatter={(v) => (v >= 1000 ? `R${(v / 1000).toFixed(0)}k` : `R${v}`)}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: 'currentColor', className: 'text-outline-variant/10' }}
            />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ paddingBottom: '6px', fontSize: '11px' }}
            />
            {/* Reference Line for Required Target Pace */}
            {pace.requiredWeekly > 0 && (
              <ReferenceLine
                y={pace.requiredWeekly}
                stroke="#d97706"
                strokeDasharray="4 4"
                strokeWidth={1.5}
              />
            )}
            {/* Actual Weekly Contributions Bar */}
            <Bar
              dataKey="contributed"
              name="Weekly Contributions"
              fill="#b32656"
              radius={[4, 4, 0, 0]}
              maxBarSize={28}
            />
            {/* Required Weekly Savings Bar */}
            <Bar
              dataKey="required"
              name="Required Weekly Savings"
              fill="#f4978e"
              radius={[4, 4, 0, 0]}
              maxBarSize={28}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Footer Insight */}
      <div className="flex flex-wrap items-center justify-between text-[11px] text-outline/80 pt-1 border-t border-outline-variant/10 gap-2">
        <span>
          5-week trend • {pace.weeksRemaining > 0 ? `${pace.weeksRemaining} weeks remaining` : 'Deadline passed'}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-0.5 bg-amber-500 rounded-full" />
          <span>Dashed line: Target pace ({formatRand(pace.requiredWeekly)}/wk)</span>
        </span>
      </div>
    </div>
  );
};

// Accessible & Romantic Custom Tooltip for Recharts
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;

  const dataPoint: WeekDataPoint = payload[0]?.payload;
  const contributed = dataPoint?.contributed || 0;
  const required = dataPoint?.required || 0;
  const diff = contributed - required;

  return (
    <div className="p-3 rounded-xl bg-surface-container border border-outline-variant/20 shadow-xl text-xs space-y-1.5 min-w-[170px] backdrop-blur-md">
      <div className="flex items-center justify-between font-bold text-on-surface border-b border-outline-variant/10 pb-1">
        <span>{dataPoint?.weekLabel}</span>
        <span className="text-[10px] text-outline font-normal">{dataPoint?.rangeLabel}</span>
      </div>

      <div className="space-y-1 pt-0.5">
        <div className="flex justify-between items-center text-primary font-medium">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-primary" />
            Contributed:
          </span>
          <span className="font-bold">{formatRand(contributed)}</span>
        </div>

        <div className="flex justify-between items-center text-[#f4978e] dark:text-[#f8a89f] font-medium">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#f4978e]" />
            Required:
          </span>
          <span className="font-bold">{formatRand(required)}</span>
        </div>

        <div className="flex justify-between items-center pt-1 border-t border-outline-variant/10 text-[11px]">
          <span className="text-outline">Difference:</span>
          <span
            className={`font-semibold ${
              diff >= 0 ? 'text-secondary' : 'text-amber-600 dark:text-amber-400'
            }`}
          >
            {diff >= 0 ? `+${formatRand(diff)}` : `-${formatRand(Math.abs(diff))}`}
          </span>
        </div>
      </div>
    </div>
  );
};

export default GoalPaceChart;
