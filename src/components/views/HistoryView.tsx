import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  Download,
  Filter,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  Search,
  FileSpreadsheet,
  Info,
  Clock,
  UserCheck
} from 'lucide-react';
import { Transaction, Goal } from '../../types';
import { formatRand, formatDateShort } from '../../utils/formatters';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Modal } from '../ui/Modal';
import { StatusBadge } from '../ui/StatusBadge';
import { hapticSuccess, hapticLight } from '../../utils/haptics';

interface HistoryViewProps {
  transactions: Transaction[];
  goals: Goal[];
  onBack: () => void;
  onOpenRecordContribution: () => void;
  onAddCorrection?: (originalTx: Transaction, correctionNote: string) => Promise<void>;
}

export default function HistoryView({
  transactions,
  goals,
  onBack,
  onOpenRecordContribution,
  onAddCorrection,
}: HistoryViewProps) {
  const [selectedContributor, setSelectedContributor] = useState<'all' | 'Me' | 'Them'>('all');
  const [selectedGoalId, setSelectedGoalId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | '30days' | '90days' | 'thisYear'>('all');
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [correctionNote, setCorrectionNote] = useState('');
  const [isCorrecting, setIsCorrecting] = useState(false);

  // Financial Summary Breakdown
  const financialSummary = useMemo(() => {
    let totalDeposits = 0;
    let totalWithdrawals = 0;
    let meTotal = 0;
    let themTotal = 0;

    transactions.forEach(t => {
      if (t.type === 'deposit') {
        totalDeposits += t.amount;
        if (t.contributor === 'Me') meTotal += t.amount;
        else themTotal += t.amount;
      } else {
        totalWithdrawals += Math.abs(t.amount);
      }
    });

    const netAvailable = Math.max(0, totalDeposits - totalWithdrawals);
    return {
      totalDeposits,
      totalWithdrawals,
      netAvailable,
      meTotal,
      themTotal,
      count: transactions.length
    };
  }, [transactions]);

  // Filtered Transactions
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    return transactions.filter(t => {
      if (selectedContributor !== 'all' && t.contributor !== selectedContributor) return false;
      if (selectedGoalId !== 'all' && t.goalId !== selectedGoalId) return false;
      
      if (dateFilter !== 'all') {
        const txDate = new Date(t.date);
        const diffDays = (now.getTime() - txDate.getTime()) / (1000 * 60 * 60 * 24);
        if (dateFilter === '30days' && diffDays > 30) return false;
        if (dateFilter === '90days' && diffDays > 90) return false;
        if (dateFilter === 'thisYear' && txDate.getFullYear() !== now.getFullYear()) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchGoal = t.goalName.toLowerCase().includes(q);
        const matchCont = t.contributor.toLowerCase().includes(q);
        const matchAmount = t.amount.toString().includes(q);
        return matchGoal || matchCont || matchAmount;
      }

      return true;
    });
  }, [transactions, selectedContributor, selectedGoalId, dateFilter, searchQuery]);

  // Export to CSV
  const handleExportCSV = () => {
    hapticSuccess();
    const headers = ['Date', 'Goal', 'Contributor', 'Type', 'Amount (ZAR)', 'Created At'];
    const rows = filteredTransactions.map(t => [
      t.date,
      `"${t.goalName.replace(/"/g, '""')}"`,
      t.contributor,
      t.type,
      t.amount.toFixed(2),
      t.createdAt || t.date
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `DateFund_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCreateCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTx || !onAddCorrection || !correctionNote.trim()) return;

    setIsCorrecting(true);
    try {
      await onAddCorrection(selectedTx, correctionNote.trim());
      hapticSuccess();
      setSelectedTx(null);
      setCorrectionNote('');
    } finally {
      setIsCorrecting(false);
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
            <h1 className="text-2xl sm:text-3xl font-serif text-on-surface">Financial Ledger</h1>
            <p className="text-xs text-outline/80 mt-0.5">
              Complete, traceable history of couple savings contributions and date expenses
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="md"
            icon={<Download className="w-4 h-4" />}
            onClick={handleExportCSV}
          >
            Export CSV
          </Button>
          <Button
            variant="primary"
            size="md"
            icon={<Plus className="w-4 h-4" />}
            onClick={onOpenRecordContribution}
          >
            Record Contribution
          </Button>
        </div>
      </div>

      {/* Compact Financial Summary Strip (Replaces 3 oversized stacked cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card variant="high" padding="sm" className="space-y-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-outline block">
            Net Savings
          </span>
          <p className="font-serif text-xl sm:text-2xl font-bold text-primary">
            {formatRand(financialSummary.netAvailable)}
          </p>
          <span className="text-[10px] text-outline/70">Available fund</span>
        </Card>

        <Card variant="high" padding="sm" className="space-y-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-outline block">
            Total Contributed
          </span>
          <p className="font-serif text-xl sm:text-2xl font-bold text-secondary">
            {formatRand(financialSummary.totalDeposits)}
          </p>
          <span className="text-[10px] text-outline/70">All deposits</span>
        </Card>

        <Card variant="high" padding="sm" className="space-y-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-outline block">
            Spent on Dates
          </span>
          <p className="font-serif text-xl sm:text-2xl font-bold text-on-surface">
            {formatRand(financialSummary.totalWithdrawals)}
          </p>
          <span className="text-[10px] text-outline/70">Realized outings</span>
        </Card>

        <Card variant="high" padding="sm" className="space-y-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-outline block">
            Partner Ratio
          </span>
          <p className="font-serif text-xl sm:text-2xl font-bold text-on-surface">
            {financialSummary.totalDeposits > 0
              ? `${Math.round((financialSummary.meTotal / financialSummary.totalDeposits) * 100)}% / ${Math.round((financialSummary.themTotal / financialSummary.totalDeposits) * 100)}%`
              : '50% / 50%'}
          </p>
          <span className="text-[10px] text-outline/70">Me / Partner</span>
        </Card>
      </div>

      {/* Filters Strip */}
      <div className="p-4 rounded-2xl bg-surface-container border border-outline-variant/15 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-outline absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by goal, contributor, or amount..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-surface-container-high border border-outline-variant/30 rounded-xl pl-9 pr-4 py-2 text-xs text-on-surface outline-none focus:border-primary min-h-[40px]"
            />
          </div>

          {/* Goal Selector Filter */}
          <select
            value={selectedGoalId}
            onChange={e => setSelectedGoalId(e.target.value)}
            className="bg-surface-container-high border border-outline-variant/30 rounded-xl px-3 py-2 text-xs text-on-surface outline-none focus:border-primary min-h-[40px]"
          >
            <option value="all">All Savings Goals</option>
            {goals.map(g => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>

          {/* Contributor Filter */}
          <div className="flex items-center gap-1 bg-surface-container-high p-1 rounded-xl border border-outline-variant/20 shrink-0">
            <button
              onClick={() => setSelectedContributor('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedContributor === 'all' ? 'bg-primary text-on-primary-fixed' : 'text-outline hover:text-on-surface'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSelectedContributor('Me')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedContributor === 'Me' ? 'bg-primary text-on-primary-fixed' : 'text-outline hover:text-on-surface'
              }`}
            >
              Me
            </button>
            <button
              onClick={() => setSelectedContributor('Them')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedContributor === 'Them' ? 'bg-secondary text-on-secondary' : 'text-outline hover:text-on-surface'
              }`}
            >
              Them
            </button>
          </div>
        </div>

        {/* Date Presets */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pt-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-outline shrink-0 my-auto">Time:</span>
          {[
            { id: 'all', label: 'All Time' },
            { id: '30days', label: 'Last 30 Days' },
            { id: '90days', label: 'Last 90 Days' },
            { id: 'thisYear', label: 'This Year (2026)' },
          ].map(preset => (
            <button
              key={preset.id}
              onClick={() => setDateFilter(preset.id as any)}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
                dateFilter === preset.id
                  ? 'bg-surface-container-highest text-on-surface border-primary/40'
                  : 'text-outline border-outline-variant/20 hover:text-on-surface'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Transactions List */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-semibold text-outline">
            Showing <strong>{filteredTransactions.length}</strong> transactions
          </span>
          <span className="text-[11px] text-outline">Click any row for details or traceable correction</span>
        </div>

        {filteredTransactions.length > 0 ? (
          <div className="space-y-2">
            {filteredTransactions.map(t => {
              const isDeposit = t.type === 'deposit';
              return (
                <div
                  key={t.id}
                  onClick={() => setSelectedTx(t)}
                  className="p-3.5 sm:p-4 rounded-2xl bg-surface-container-low border border-outline-variant/15 hover:border-primary/30 transition-all cursor-pointer flex items-center justify-between gap-3 shadow-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isDeposit ? 'bg-secondary/15 text-secondary' : 'bg-primary/15 text-primary'
                    }`}>
                      {isDeposit ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                    </div>
                    <div className="min-w-0">
                      <p className="font-serif text-base sm:text-lg font-bold text-on-surface truncate">
                        {t.goalName}
                      </p>
                      <p className="text-xs text-outline flex items-center gap-1.5 mt-0.5">
                        <span>{formatDateShort(t.date)}</span>
                        <span>•</span>
                        <span className="font-medium text-on-surface/80">{t.contributor}</span>
                        <span>•</span>
                        <span className="capitalize">{t.type}</span>
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className={`font-serif text-base sm:text-xl font-bold ${
                      isDeposit ? 'text-secondary' : 'text-on-surface'
                    }`}>
                      {isDeposit ? '+' : '-'}{formatRand(t.amount)}
                    </p>
                    <span className="text-[10px] text-outline">Recorded</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 border border-dashed border-outline-variant/20 rounded-3xl bg-surface-container-low/40">
            <Clock className="w-10 h-10 text-outline/40 mx-auto mb-2" />
            <h3 className="font-serif text-lg font-semibold text-on-surface">No records match the filter</h3>
            <p className="text-xs text-outline max-w-sm mx-auto mt-1 mb-4">
              Try adjusting your date range or goal filters, or record a new savings contribution.
            </p>
            <Button variant="primary" size="sm" onClick={onOpenRecordContribution}>
              Record Contribution
            </Button>
          </div>
        )}
      </div>

      {/* Transaction Details & Traceable Correction Modal */}
      <Modal
        isOpen={Boolean(selectedTx)}
        onClose={() => {
          setSelectedTx(null);
          setCorrectionNote('');
        }}
        title="Transaction Details"
        description="Transparent record breakdown"
      >
        {selectedTx && (
          <div className="space-y-4 pt-1">
            <div className="p-4 rounded-2xl bg-surface-container border border-outline-variant/15 space-y-2.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-outline">Savings Goal:</span>
                <span className="font-bold text-on-surface text-sm">{selectedTx.goalName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-outline">Amount:</span>
                <span className="font-serif font-bold text-secondary text-base">{formatRand(selectedTx.amount)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-outline">Logged Contributor:</span>
                <span className="font-semibold text-on-surface">{selectedTx.contributor}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-outline">Date of Contribution:</span>
                <span className="text-on-surface">{formatDateShort(selectedTx.date)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-outline">Record Status:</span>
                <span className="text-emerald-700 dark:text-emerald-400 font-semibold">Verified in Shared Ledger</span>
              </div>
            </div>

            {/* Traceable Correction Form (Preserves ledger integrity without silent rewrites) */}
            {onAddCorrection && (
              <form onSubmit={handleCreateCorrection} className="space-y-3 pt-2 border-t border-outline-variant/10">
                <div className="space-y-1 text-left">
                  <label htmlFor="correction-note" className="block text-xs font-semibold uppercase tracking-wider text-outline">
                    Log an Audit Note / Correction Memo
                  </label>
                  <input
                    id="correction-note"
                    type="text"
                    placeholder="e.g. Offset for dinner expense, correction for typo"
                    value={correctionNote}
                    onChange={e => setCorrectionNote(e.target.value)}
                    className="w-full bg-surface-container border border-outline-variant/30 rounded-xl px-3.5 py-2 text-xs text-on-surface outline-none focus:border-primary"
                  />
                  <p className="text-[11px] text-outline mt-1">
                    Adds a traceable audit note rather than silently modifying financial history.
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="ghost" size="sm" onClick={() => setSelectedTx(null)}>
                    Close
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    type="submit"
                    disabled={!correctionNote.trim()}
                    isLoading={isCorrecting}
                  >
                    Save Audit Note
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
