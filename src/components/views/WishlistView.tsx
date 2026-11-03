import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bookmark,
  Plus,
  Calendar,
  PiggyBank,
  Sparkles,
  Heart,
  Compass,
  Trash2,
  ChevronLeft,
  DollarSign,
  Tag
} from 'lucide-react';
import { BucketListItem } from '../../types';
import { formatRand } from '../../utils/formatters';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { hapticLight, hapticSuccess } from '../../utils/haptics';

interface WishlistViewProps {
  bucketList: BucketListItem[];
  onBack: () => void;
  onAddBucketItem: (item: Omit<BucketListItem, 'id' | 'createdAt'>) => Promise<void>;
  onPlanDateFromBucket: (item: BucketListItem) => void;
  onSaveGoalFromBucket: (item: BucketListItem) => void;
  onRemoveBucketItem: (id: string) => Promise<void>;
}

const CURATED_DATE_IDEAS = [
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

export default function WishlistView({
  bucketList,
  onBack,
  onAddBucketItem,
  onPlanDateFromBucket,
  onSaveGoalFromBucket,
  onRemoveBucketItem,
}: WishlistViewProps) {
  const [activeTab, setActiveTab] = useState<'ours' | 'curated'>('ours');
  const [isAdding, setIsAdding] = useState(false);
  const [newItem, setNewItem] = useState({
    title: '',
    category: 'Romantic Dinners',
    estimatedBudget: '',
    notes: '',
    season: 'Any' as const,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');

  const categories = ['all', 'Romantic Dinners', 'Adventure', 'Cozy', 'Travel', 'Creative', 'Wellness'];

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.title.trim()) return;

    setIsSubmitting(true);
    try {
      await onAddBucketItem({
        title: newItem.title.trim(),
        category: newItem.category,
        estimatedBudget: parseFloat(newItem.estimatedBudget) || 0,
        notes: newItem.notes.trim(),
        season: newItem.season,
        addedBy: 'Me',
      });
      hapticSuccess();
      setNewItem({
        title: '',
        category: 'Romantic Dinners',
        estimatedBudget: '',
        notes: '',
        season: 'Any',
      });
      setIsAdding(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredOurs = bucketList.filter(item => {
    if (selectedCategoryFilter === 'all') return true;
    return item.category.toLowerCase() === selectedCategoryFilter.toLowerCase();
  });

  return (
    <div className="space-y-6 pb-20">
      {/* Top Header & Navigation */}
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
            <div className="flex items-center gap-2">
              <Bookmark className="w-5 h-5 text-secondary" />
              <h1 className="text-2xl sm:text-3xl font-serif text-on-surface">Date Wishlist</h1>
            </div>
            <p className="text-xs text-outline/80 mt-0.5">
              Romantic dreams, bucket list outings, and future celebrations
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="primary"
            size="md"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setIsAdding(true)}
          >
            Add Date Idea
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-outline-variant/10 pb-3">
        <button
          onClick={() => { hapticLight(); setActiveTab('ours'); }}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all min-h-[40px] ${
            activeTab === 'ours'
              ? 'bg-secondary text-on-secondary shadow-xs'
              : 'text-outline hover:text-on-surface hover:bg-surface-container'
          }`}
        >
          Our Wishlist ({bucketList.length})
        </button>
        <button
          onClick={() => { hapticLight(); setActiveTab('curated'); }}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all min-h-[40px] flex items-center gap-1.5 ${
            activeTab === 'curated'
              ? 'bg-secondary text-on-secondary shadow-xs'
              : 'text-outline hover:text-on-surface hover:bg-surface-container'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          Curated Inspirations
        </button>
      </div>

      {/* Category Pills Filter */}
      {activeTab === 'ours' && bucketList.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
                selectedCategoryFilter === cat
                  ? 'bg-primary text-on-primary-fixed border-primary'
                  : 'bg-surface-container text-outline border-outline-variant/20 hover:text-on-surface'
              }`}
            >
              {cat === 'all' ? 'All Categories' : cat}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      {activeTab === 'ours' ? (
        filteredOurs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredOurs.map(item => (
              <Card key={item.id} variant="high" padding="md" className="flex flex-col justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-secondary px-2.5 py-0.5 rounded-md bg-secondary/10 border border-secondary/20">
                      {item.category}
                    </span>
                    <button
                      onClick={() => onRemoveBucketItem(item.id)}
                      className="p-1.5 text-outline/60 hover:text-rose-500 rounded-lg transition-colors"
                      title="Remove from wishlist"
                      aria-label={`Remove ${item.title}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <h3 className="font-serif text-xl font-bold text-on-surface leading-snug">
                    {item.title}
                  </h3>

                  {item.notes && (
                    <p className="text-xs text-on-surface/80 leading-relaxed">
                      {item.notes}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-outline-variant/10 space-y-3">
                  <div className="flex items-baseline justify-between text-xs">
                    <span className="text-outline">Estimated budget</span>
                    <span className="font-bold text-primary font-serif text-base">
                      {formatRand(item.estimatedBudget)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      icon={<Calendar className="w-3.5 h-3.5 text-secondary" />}
                      onClick={() => onPlanDateFromBucket(item)}
                    >
                      Plan Date
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      icon={<PiggyBank className="w-3.5 h-3.5 text-primary" />}
                      onClick={() => onSaveGoalFromBucket(item)}
                    >
                      Save Goal
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 px-4 border border-dashed border-outline-variant/20 rounded-3xl bg-surface-container-low/40">
            <Bookmark className="w-10 h-10 text-outline/40 mx-auto mb-3" />
            <h3 className="font-serif text-lg text-on-surface font-semibold">Your wishlist is ready for ideas</h3>
            <p className="text-xs text-outline max-w-sm mx-auto mt-1 mb-5">
              Save restaurants you want to try, weekend getaways, or adventures you dream of sharing.
            </p>
            <Button variant="primary" size="md" onClick={() => setIsAdding(true)}>
              Add First Date Idea
            </Button>
          </div>
        )
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {CURATED_DATE_IDEAS.map((item, idx) => (
            <Card key={idx} variant="default" padding="md" className="flex flex-col justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-primary px-2.5 py-0.5 rounded-md bg-primary/10 border border-primary/20">
                    {item.category}
                  </span>
                  <span className="text-[11px] text-outline">{item.season}</span>
                </div>
                <h3 className="font-serif text-lg font-bold text-on-surface">{item.title}</h3>
                <p className="text-xs text-on-surface/80 leading-relaxed">{item.notes}</p>
              </div>

              <div className="pt-3 border-t border-outline-variant/10 space-y-3">
                <div className="flex items-baseline justify-between text-xs">
                  <span className="text-outline">Estimated cost</span>
                  <span className="font-serif font-bold text-primary">{formatRand(item.estimatedBudget)}</span>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  icon={<Plus className="w-3.5 h-3.5 text-secondary" />}
                  onClick={async () => {
                    await onAddBucketItem({
                      title: item.title,
                      category: item.category,
                      estimatedBudget: item.estimatedBudget,
                      notes: item.notes,
                      season: item.season,
                      addedBy: 'Curated',
                    });
                    hapticSuccess();
                    setActiveTab('ours');
                  }}
                >
                  Save to Our Wishlist
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add Date Idea Modal */}
      <Modal
        isOpen={isAdding}
        onClose={() => setIsAdding(false)}
        title="Add Date Idea"
        description="Save an outing or experience for your couple wishlist"
      >
        <form onSubmit={handleCreate} className="space-y-4 pt-2">
          <Input
            label="Date Idea Title"
            required
            placeholder="e.g. Sunset vineyard picnic & tasting"
            value={newItem.title}
            onChange={e => setNewItem({ ...newItem, title: e.target.value })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5 text-left">
              <label htmlFor="idea-category" className="block text-xs font-semibold uppercase tracking-wider text-outline">
                Category
              </label>
              <select
                id="idea-category"
                value={newItem.category}
                onChange={e => setNewItem({ ...newItem, category: e.target.value })}
                className="w-full min-h-[44px] bg-surface-container border border-outline-variant/30 rounded-xl px-3.5 py-2 text-sm text-on-surface outline-none focus:border-primary"
              >
                <option value="Romantic Dinners">Romantic Dinners</option>
                <option value="Adventure">Adventure</option>
                <option value="Cozy">Cozy</option>
                <option value="Travel">Travel</option>
                <option value="Creative">Creative</option>
                <option value="Wellness">Wellness</option>
              </select>
            </div>

            <Input
              label="Estimated Budget (ZAR)"
              type="number"
              min="0"
              step="50"
              placeholder="e.g. 850"
              value={newItem.estimatedBudget}
              onChange={e => setNewItem({ ...newItem, estimatedBudget: e.target.value })}
            />
          </div>

          <div className="space-y-1.5 text-left">
            <label htmlFor="idea-notes" className="block text-xs font-semibold uppercase tracking-wider text-outline">
              Notes & Romantic Details
            </label>
            <textarea
              id="idea-notes"
              rows={3}
              placeholder="What makes this date special? (e.g. dress code, reservations needed, sunset time)"
              value={newItem.notes}
              onChange={e => setNewItem({ ...newItem, notes: e.target.value })}
              className="w-full bg-surface-container border border-outline-variant/30 rounded-xl p-3 text-sm text-on-surface outline-none focus:border-primary resize-none"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3">
            <Button variant="ghost" size="md" onClick={() => setIsAdding(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="md" type="submit" isLoading={isSubmitting}>
              Save to Wishlist
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
