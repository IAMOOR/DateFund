import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  HeartHandshake, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles, 
  Trash2, 
  Copy, 
  Check, 
  Archive, 
  RefreshCw, 
  Sun, 
  Heart, 
  X,
  Compass,
  Smile
} from 'lucide-react';
import { Goal, Transaction, Event } from '../../types';
import { hapticMedium, hapticSuccess, hapticLight } from '../../utils/haptics';

interface SoloTransitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  goals: Goal[];
  transactions: Transaction[];
  events: Event[];
  onFinalizeSoloMode: (options: {
    archiveMemories: boolean;
    seedPersonalFund: boolean;
    personalAmount: number;
  }) => Promise<void>;
}

export default function SoloTransitionModal({
  isOpen,
  onClose,
  goals,
  transactions,
  events,
  onFinalizeSoloMode
}: SoloTransitionModalProps) {
  const [step, setStep] = useState<'settlement' | 'archive_choice' | 'solo_preview' | 'completed'>('settlement');
  const [copiedReceipt, setCopiedReceipt] = useState(false);
  const [archiveMemories, setArchiveMemories] = useState(true);
  const [seedPersonalFund, setSeedPersonalFund] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  // Calculate Net contributions
  const meTotal = transactions
    .filter(t => t.contributor === 'Me')
    .reduce((acc, t) => acc + (t.type === 'deposit' ? t.amount : -t.amount), 0);

  const themTotal = transactions
    .filter(t => t.contributor === 'Them')
    .reduce((acc, t) => acc + (t.type === 'deposit' ? t.amount : -t.amount), 0);

  const totalFund = Math.max(0, meTotal + themTotal);
  const sharedGoalsCount = goals.filter(g => g.collaborators && g.collaborators.length > 1).length;
  const completedMemoriesCount = events.filter(e => e.completed && e.memory).length;

  const handleCopyReceipt = () => {
    hapticLight();
    const text = `DateFund Financial Settlement Summary:
• Total Shared Balance: R ${totalFund.toFixed(2)}
• My Net Contributions: R ${meTotal.toFixed(2)}
• Partner's Net Contributions: R ${themTotal.toFixed(2)}
• Shared Goals Settled: ${sharedGoalsCount}
Generated with DateFund on ${new Date().toLocaleDateString('en-ZA')}`;

    navigator.clipboard.writeText(text);
    setCopiedReceipt(true);
    setTimeout(() => setCopiedReceipt(false), 2500);
  };

  const handleExecuteTransition = async () => {
    setIsProcessing(true);
    hapticMedium();
    try {
      await onFinalizeSoloMode({
        archiveMemories,
        seedPersonalFund,
        personalAmount: Math.max(0, meTotal)
      });
      hapticSuccess();
      setStep('completed');
    } catch (err) {
      console.error('Failed to transition to solo mode', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[140] flex items-end sm:items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => {
          if (!isProcessing) onClose();
        }}
        className="fixed inset-0 bg-background/90 backdrop-blur-md"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-lg bg-surface-container rounded-t-[2.5rem] sm:rounded-[2.5rem] border border-outline-variant/20 shadow-2xl p-6 sm:p-8 z-10 max-h-[92vh] flex flex-col overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-outline-variant/10">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-secondary/15 text-secondary rounded-2xl">
              <Sun className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-serif text-2xl text-on-surface">Solo Journey & Settlement</h3>
              <p className="text-[11px] uppercase tracking-wider text-outline/70 font-bold">
                Transition with Respect & Clarity
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-surface-container-highest text-outline transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* STEP 1: FINANCIAL SETTLEMENT */}
        {step === 'settlement' && (
          <div className="space-y-6">
            <div className="p-4 bg-surface-container-low rounded-2xl border border-outline-variant/10 text-center">
              <span className="text-[10px] uppercase tracking-widest font-bold text-outline block mb-1">
                Shared Balance To Distribute
              </span>
              <p className="font-serif text-3xl sm:text-4xl text-primary">
                R {totalFund.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="p-4 rounded-2xl bg-secondary/10 border border-secondary/20">
                <span className="text-[10px] uppercase tracking-widest font-bold text-secondary block mb-1">
                  Your Net Share
                </span>
                <p className="font-serif text-2xl text-on-surface">
                  R {meTotal.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                </p>
                <span className="text-[10px] text-outline/70 mt-1 block">Preserved for your solo growth</span>
              </div>

              <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/15">
                <span className="text-[10px] uppercase tracking-widest font-bold text-outline block mb-1">
                  Partner's Net Share
                </span>
                <p className="font-serif text-2xl text-outline">
                  R {themTotal.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                </p>
                <span className="text-[10px] text-outline/70 mt-1 block">To be returned or settled</span>
              </div>
            </div>

            <button
              onClick={handleCopyReceipt}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-surface-container-high/60 hover:bg-surface-container-high text-xs font-bold uppercase tracking-wider text-outline hover:text-on-surface border border-outline-variant/20 transition-all"
            >
              {copiedReceipt ? (
                <>
                  <Check className="w-4 h-4 text-secondary" />
                  <span>Settlement Breakdown Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Settlement Text for Messaging</span>
                </>
              )}
            </button>

            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3.5 rounded-full font-bold text-xs uppercase tracking-wider text-outline hover:bg-white/5 transition-colors"
              >
                Keep Shared
              </button>
              <button
                type="button"
                onClick={() => {
                  hapticLight();
                  setStep('archive_choice');
                }}
                className="flex-[2] bg-primary text-on-primary-fixed py-3.5 rounded-full font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all active:scale-95"
              >
                <span>Next: Memories & Goals</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: MEMORIES & ARCHIVE CHOICE */}
        {step === 'archive_choice' && (
          <div className="space-y-6">
            <p className="text-sm text-on-surface/80 leading-relaxed">
              Decide how you'd like to handle your past scrapbook memories, photo logs, and joint goals:
            </p>

            <div className="space-y-3">
              {/* Option A: Keep in Private Vault */}
              <div
                onClick={() => {
                  hapticLight();
                  setArchiveMemories(true);
                }}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  archiveMemories
                    ? 'bg-primary/10 border-primary shadow-sm'
                    : 'bg-surface-container-low border-outline-variant/15 hover:border-outline-variant/30'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2.5 rounded-xl ${archiveMemories ? 'bg-primary text-on-primary-fixed' : 'bg-surface-container-high text-outline'}`}>
                    <Archive className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-on-surface">Preserve in Private Memory Vault</h4>
                      {archiveMemories && <Check className="w-4 h-4 text-primary" />}
                    </div>
                    <p className="text-xs text-outline/80 mt-1 leading-relaxed">
                      Safely lock your {completedMemoriesCount} past date memories and photo scrapbook in a private, read-only vault so your personal life moments aren't erased.
                    </p>
                  </div>
                </div>
              </div>

              {/* Option B: Clean Slate */}
              <div
                onClick={() => {
                  hapticLight();
                  setArchiveMemories(false);
                }}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  !archiveMemories
                    ? 'bg-error/10 border-error shadow-sm'
                    : 'bg-surface-container-low border-outline-variant/15 hover:border-outline-variant/30'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2.5 rounded-xl ${!archiveMemories ? 'bg-error text-white' : 'bg-surface-container-high text-outline'}`}>
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-on-surface">Clean Slate (Fresh Start)</h4>
                      {!archiveMemories && <Check className="w-4 h-4 text-error" />}
                    </div>
                    <p className="text-xs text-outline/80 mt-1 leading-relaxed">
                      Permanently wipe all past joint date records and completed memories for an unburdened clean start.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Checkbox: Seed Personal Self-Care Fund */}
            <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/10 flex items-center justify-between">
              <div>
                <h5 className="font-bold text-sm">Seed Self-Care Fund</h5>
                <p className="text-xs text-outline/70">
                  Transfer your R {meTotal.toFixed(2)} share into a new "Independence & Growth" goal.
                </p>
              </div>
              <input
                type="checkbox"
                checked={seedPersonalFund}
                onChange={e => setSeedPersonalFund(e.target.checked)}
                className="w-5 h-5 accent-primary rounded cursor-pointer"
              />
            </div>

            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={() => setStep('settlement')}
                className="flex-1 py-3.5 rounded-full font-bold text-xs uppercase tracking-wider text-outline hover:bg-white/5 transition-colors"
              >
                Back
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleExecuteTransition}
                className="flex-[2] bg-secondary text-on-secondary py-3.5 rounded-full font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-secondary/20 hover:shadow-secondary/30 transition-all active:scale-95 disabled:opacity-50"
              >
                {isProcessing ? (
                  <span>Transitioning...</span>
                ) : (
                  <>
                    <Sun className="w-4 h-4" />
                    <span>Enter Solo Bloom Mode</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: COMPLETED TRANSITION */}
        {step === 'completed' && (
          <div className="py-6 text-center space-y-6">
            <div className="w-20 h-20 bg-secondary/15 rounded-full flex items-center justify-center mx-auto text-secondary shadow-lg">
              <Sparkles className="w-10 h-10 animate-spin-slow" />
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl sm:text-3xl font-serif text-on-surface">Welcome to Solo Bloom</h3>
              <p className="text-sm text-outline max-w-sm mx-auto leading-relaxed">
                Your account is now personalized for your individual journey, self-love, and financial independence.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/15 text-left space-y-2 text-xs text-on-surface/90">
              <div className="flex items-center gap-2 text-secondary font-bold">
                <ShieldCheck className="w-4 h-4" />
                <span>What just happened:</span>
              </div>
              <p>• Partner link uncoupled and joint tasks archived.</p>
              {seedPersonalFund && <p>• Created your "Independence & Self-Care" fund with your saved R {meTotal.toFixed(2)}.</p>}
              {archiveMemories ? <p>• Preserved previous photo logs in your private archive.</p> : <p>• Fresh slate prepared.</p>}
              <p>• Whenever you are ready to love again, you can easily pair a new partner with one click in Settings!</p>
            </div>

            <button
              onClick={onClose}
              className="w-full bg-primary text-on-primary-fixed py-4 rounded-full font-bold text-xs uppercase tracking-wider shadow-lg shadow-primary/20 active:scale-95 transition-transform"
            >
              Start My Solo Journey
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
