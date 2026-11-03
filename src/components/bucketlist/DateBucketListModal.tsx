import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bookmark, Plus, Calendar, PiggyBank, Sparkles, X, Heart, Compass, Check } from 'lucide-react';
import { BucketListItem } from '../../types';
import { hapticLight, hapticSuccess } from '../../utils/haptics';

interface DateBucketListModalProps {
  isOpen: boolean;
  onClose: () => void;
  bucketList: BucketListItem[];
  onAddBucketItem: (item: Omit<BucketListItem, 'id' | 'createdAt'>) => Promise<void>;
  onPlanDateFromBucket: (item: BucketListItem) => void;
  onSaveGoalFromBucket: (item: BucketListItem) => void;
  onRemoveBucketItem: (id: string) => Promise<void>;
}

const DEFAULT_CURATED_IDEAS = [
  {
    title: 'Hot Air Balloon Champagne Sunrise',
    category: 'Adventure',
    estimatedBudget: 3200,
    season: 'Summer' as const,
    notes: 'Floating gently over the countryside at dawn with warm mimosas.',
  },
  {
    title: 'Pottery & Red Wine Wheel Class',
    category: 'Creative',
    estimatedBudget: 850,
    season: 'Autumn' as const,
    notes: 'Ghost-movie vibes shaping clay bowls together while sipping Pinotage.',
  },
  {
    title: 'Stargazing Picnic with Vintage Blankets',
    category: 'Cozy',
    estimatedBudget: 450,
    season: 'Spring' as const,
    notes: 'Pack artisanal cheeses, chocolate truffles, and a star map app.',
  },
  {
    title: 'Secluded Mountain Cabin Weekend',
    category: 'Travel',
    estimatedBudget: 4500,
    season: 'Winter' as const,
    notes: 'Wood-burning fireplace, hot tub, no cell reception, pure togetherness.',
  },
  {
    title: 'Sunset Catamaran Harbor Cruise',
    category: 'Romantic Dinners',
    estimatedBudget: 1200,
    season: 'Summer' as const,
    notes: 'Sailing along the coast watching the golden hour melt into city lights.',
  },
];

export default function DateBucketListModal({
  isOpen,
  onClose,
  bucketList,
  onAddBucketItem,
  onPlanDateFromBucket,
  onSaveGoalFromBucket,
  onRemoveBucketItem,
}: DateBucketListModalProps) {
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [customTitle, setCustomTitle] = useState('');
  const [customBudget, setCustomBudget] = useState('800');
  const [customCategory, setCustomCategory] = useState('Romantic Dinners');
  const [customSeason, setCustomSeason] = useState<'Spring' | 'Summer' | 'Autumn' | 'Winter' | 'Any'>('Any');
  const [customNotes, setCustomNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  // Combine user items with defaults if user has none
  const allItems: BucketListItem[] = bucketList.length > 0
    ? bucketList
    : DEFAULT_CURATED_IDEAS.map((item, idx) => ({
        id: `curated-${idx}`,
        ...item,
        addedBy: 'DateFund Concierge',
        createdAt: new Date().toISOString(),
      }));

  const filteredItems = allItems.filter(item => {
    if (categoryFilter === 'All') return true;
    return item.category === categoryFilter;
  });

  const handleCreateCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle.trim()) return;
    setIsSubmitting(true);
    try {
      await onAddBucketItem({
        title: customTitle.trim(),
        category: customCategory,
        estimatedBudget: parseFloat(customBudget) || 0,
        season: customSeason,
        notes: customNotes.trim(),
        addedBy: 'Us',
      });
      hapticSuccess();
      setCustomTitle('');
      setCustomNotes('');
      setIsAddingCustom(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[125] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-background/85 backdrop-blur-md"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-4xl bg-surface-container rounded-[2.5rem] border border-outline-variant/15 shadow-2xl p-6 sm:p-10 z-10 max-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-6 border-b border-outline-variant/10">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 text-primary rounded-2xl">
              <Bookmark className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-serif text-on-surface">Shared Date Wishlist</h2>
              <p className="text-xs uppercase tracking-widest font-semibold text-outline/70">
                Someday Bucket List & Future Outings
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { hapticLight(); setIsAddingCustom(true); }}
              className="bg-primary text-on-primary-fixed px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" /> Add Dream
            </button>
            <button
              onClick={onClose}
              className="p-2.5 rounded-full hover:bg-surface-container-highest transition-colors text-outline"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Categories Bar */}
        <div className="flex gap-2 py-4 overflow-x-auto no-scrollbar items-center border-b border-outline-variant/5">
          <span className="text-[10px] uppercase tracking-widest font-bold text-outline mr-1">Vibe:</span>
          {['All', 'Adventure', 'Cozy', 'Creative', 'Romantic Dinners', 'Travel'].map(cat => (
            <button
              key={cat}
              onClick={() => { hapticLight(); setCategoryFilter(cat); }}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                categoryFilter === cat
                  ? 'bg-primary text-on-primary-fixed shadow-sm'
                  : 'bg-surface-container-high text-outline hover:text-on-surface'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto no-scrollbar py-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredItems.map(item => (
              <motion.div
                key={item.id}
                whileHover={{ y: -3 }}
                className="bg-surface-container-low p-5 rounded-2xl border border-outline-variant/10 shadow-sm flex flex-col justify-between space-y-4 group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] uppercase tracking-widest font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                      {item.category}
                    </span>
                    <span className="text-sm font-serif font-bold text-secondary">
                      R {item.estimatedBudget.toLocaleString()}
                    </span>
                  </div>

                  <h4 className="font-serif text-xl text-on-surface mt-2.5">{item.title}</h4>
                  {item.notes && (
                    <p className="text-xs text-outline/80 mt-1 line-clamp-2 leading-relaxed">
                      {item.notes}
                    </p>
                  )}
                  {item.season && item.season !== 'Any' && (
                    <span className="text-[10px] text-outline/60 mt-2 block font-medium">
                      Best in: {item.season}
                    </span>
                  )}
                </div>

                {/* 1-Click Plan Date or Plant Goal Buttons */}
                <div className="flex gap-2 pt-2 border-t border-outline-variant/10">
                  <button
                    onClick={() => {
                      hapticLight();
                      onPlanDateFromBucket(item);
                      onClose();
                    }}
                    className="flex-1 bg-primary text-on-primary-fixed py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
                  >
                    <Calendar className="w-3.5 h-3.5" /> Plan Date
                  </button>
                  <button
                    onClick={() => {
                      hapticLight();
                      onSaveGoalFromBucket(item);
                      onClose();
                    }}
                    className="flex-1 bg-surface-container-high hover:bg-surface-container-highest text-on-surface py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 border border-outline-variant/20 active:scale-95 transition-all"
                  >
                    <PiggyBank className="w-3.5 h-3.5 text-primary" /> Plant Goal
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Add Custom Item Modal / Sheet */}
        <AnimatePresence>
          {isAddingCustom && (
            <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsAddingCustom(false)}
                className="fixed inset-0 bg-black/80 backdrop-blur-sm"
              />
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="relative w-full max-w-lg bg-surface-container rounded-3xl p-6 sm:p-8 shadow-2xl border border-primary/20 z-10"
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-serif text-on-surface">Add to Date Wishlist</h3>
                  <button onClick={() => setIsAddingCustom(false)} className="p-2 text-outline">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleCreateCustom} className="space-y-4 text-left">
                  <div>
                    <label className="text-xs uppercase tracking-widest font-bold text-outline block mb-1">
                      Date Idea Title
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Helicopter tour, Sushi making night..."
                      value={customTitle}
                      onChange={e => setCustomTitle(e.target.value)}
                      className="w-full bg-surface-container-high/60 border border-outline-variant/30 rounded-xl p-3 text-sm text-on-surface outline-none focus:border-primary"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs uppercase tracking-widest font-bold text-outline block mb-1">
                        Category
                      </label>
                      <select
                        value={customCategory}
                        onChange={e => setCustomCategory(e.target.value)}
                        className="w-full bg-surface-container-high/60 border border-outline-variant/30 rounded-xl p-3 text-xs text-on-surface outline-none focus:border-primary"
                      >
                        <option value="Romantic Dinners">Romantic Dinners</option>
                        <option value="Adventure">Adventure</option>
                        <option value="Cozy">Cozy</option>
                        <option value="Creative">Creative</option>
                        <option value="Travel">Travel</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs uppercase tracking-widest font-bold text-outline block mb-1">
                        Budget (R)
                      </label>
                      <input
                        type="number"
                        value={customBudget}
                        onChange={e => setCustomBudget(e.target.value)}
                        className="w-full bg-surface-container-high/60 border border-outline-variant/30 rounded-xl p-3 text-xs text-on-surface outline-none focus:border-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs uppercase tracking-widest font-bold text-outline block mb-1">
                      Romantic Notes / Details
                    </label>
                    <textarea
                      rows={2}
                      placeholder="What makes this date special?"
                      value={customNotes}
                      onChange={e => setCustomNotes(e.target.value)}
                      className="w-full bg-surface-container-high/60 border border-outline-variant/30 rounded-xl p-3 text-xs text-on-surface outline-none focus:border-primary resize-none"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsAddingCustom(false)}
                      className="flex-1 py-3 rounded-full text-xs font-bold text-outline hover:bg-white/5"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || !customTitle.trim()}
                      className="flex-[2] bg-primary text-on-primary-fixed py-3 rounded-full text-xs font-bold uppercase tracking-wider shadow-md hover:shadow-lg disabled:opacity-50"
                    >
                      {isSubmitting ? 'Saving...' : 'Add to Wishlist'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
