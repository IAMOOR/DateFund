import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Camera,
  Star,
  Heart,
  Calendar,
  MapPin,
  ChevronLeft,
  Plus,
  Image as ImageIcon,
  Edit2,
  Sparkles,
  Search,
  Filter
} from 'lucide-react';
import { Event, DateMemory } from '../../types';
import { formatDateShort } from '../../utils/formatters';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { hapticSuccess, hapticLight } from '../../utils/haptics';

interface ScrapbookViewProps {
  completedEvents: Event[];
  onBack: () => void;
  onSaveMemory: (eventId: string, memory: DateMemory) => Promise<void>;
  onPlanNewDate: () => void;
}

const MEMORY_PRESETS = [
  { label: 'Candlelit Dinner', url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80' },
  { label: 'Sunset Beach Walk', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80' },
  { label: 'Stargazing Picnic', url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80' },
  { label: 'Mountain Getaway', url: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=800&q=80' },
  { label: 'Coffee & Books', url: 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?auto=format&fit=crop&w=800&q=80' },
  { label: 'Wine Vineyard Tour', url: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&q=80' },
];

export default function ScrapbookView({
  completedEvents,
  onBack,
  onSaveMemory,
  onPlanNewDate,
}: ScrapbookViewProps) {
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [photoURL, setPhotoURL] = useState('');
  const [rating, setRating] = useState(5);
  const [recapNote, setRecapNote] = useState('');
  const [highlights, setHighlights] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [ratingFilter, setRatingFilter] = useState<number | 'all'>('all');

  const memoriesCount = completedEvents.filter(e => e.memory).length;

  const filteredEvents = completedEvents.filter(e => {
    if (ratingFilter !== 'all') {
      const r = e.memory?.rating || 0;
      if (r < ratingFilter) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = e.title.toLowerCase().includes(q);
      const matchLoc = e.location?.toLowerCase().includes(q);
      const matchNote = e.memory?.recapNote?.toLowerCase().includes(q);
      return matchTitle || matchLoc || matchNote;
    }
    return true;
  });

  const handleStartEdit = (event: Event) => {
    hapticLight();
    setEditingEvent(event);
    setPhotoURL(event.memory?.photoURL || '');
    setRating(event.memory?.rating || 5);
    setRecapNote(event.memory?.recapNote || '');
    setHighlights(event.memory?.highlights || '');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent) return;

    setIsSaving(true);
    try {
      await onSaveMemory(editingEvent.id, {
        photoURL: photoURL.trim() || undefined,
        rating,
        recapNote: recapNote.trim() || 'A cherished memory together.',
        highlights: highlights.trim() || undefined,
        completedAt: editingEvent.memory?.completedAt || new Date().toISOString(),
      });
      hapticSuccess();
      setEditingEvent(null);
    } finally {
      setIsSaving(false);
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
            <div className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-primary" />
              <h1 className="text-2xl sm:text-3xl font-serif text-on-surface">Couple Scrapbook</h1>
            </div>
            <p className="text-xs text-outline/80 mt-0.5">
              Your photo gallery of completed date nights & shared memories
            </p>
          </div>
        </div>

        <Button
          variant="secondary"
          size="md"
          icon={<Plus className="w-4 h-4" />}
          onClick={onPlanNewDate}
        >
          Plan Next Date
        </Button>
      </div>

      {/* Only show search and rating filters if there are memories */}
      {memoriesCount > 0 && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-outline absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search memories, venues, notes..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full min-h-[40px] bg-surface-container border border-outline-variant/25 rounded-xl pl-9 pr-4 text-xs text-on-surface outline-none focus:border-primary"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-outline shrink-0">Filter:</span>
            <button
              onClick={() => setRatingFilter('all')}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
                ratingFilter === 'all'
                  ? 'bg-primary text-on-primary-fixed border-primary'
                  : 'bg-surface-container text-outline border-outline-variant/20'
              }`}
            >
              All
            </button>
            {[5, 4, 3].map(stars => (
              <button
                key={stars}
                onClick={() => setRatingFilter(stars)}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all border flex items-center gap-1 ${
                  ratingFilter === stars
                    ? 'bg-primary text-on-primary-fixed border-primary'
                    : 'bg-surface-container text-outline border-outline-variant/20'
                }`}
              >
                <span>{stars}+</span>
                <Star className="w-3 h-3 fill-current" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Grid of Memories & Completed Dates */}
      {completedEvents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredEvents.map(event => {
            const hasMemory = Boolean(event.memory);
            const memory = event.memory;

            return (
              <Card
                key={event.id}
                variant="high"
                padding="none"
                className="overflow-hidden flex flex-col justify-between group hover:border-primary/30 transition-all shadow-sm hover:shadow-md"
              >
                {/* Photo or Placeholder Banner */}
                <div className="relative h-48 bg-surface-container-highest overflow-hidden">
                  {memory?.photoURL ? (
                    <img
                      src={memory.photoURL}
                      alt={event.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-gradient-to-br from-primary/10 via-surface-container to-secondary/10">
                      <Camera className="w-8 h-8 text-outline/50 mb-2" />
                      <p className="text-xs font-medium text-outline">No photo saved yet</p>
                      <button
                        onClick={() => handleStartEdit(event)}
                        className="mt-2 text-[11px] font-semibold text-primary hover:underline cursor-pointer"
                      >
                        Add Photo & Recap
                      </button>
                    </div>
                  )}

                  {/* Rating Badge */}
                  {memory?.rating && (
                    <div className="absolute top-3 right-3 bg-background/80 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 flex items-center gap-1 text-xs font-bold text-amber-400 shadow-xs">
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      <span>{memory.rating}.0</span>
                    </div>
                  )}

                  <div className="absolute bottom-2 left-3 bg-background/80 backdrop-blur-md px-2.5 py-0.5 rounded-md text-[11px] font-medium text-on-surface">
                    {formatDateShort(event.date)}
                  </div>
                </div>

                {/* Details */}
                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="font-serif text-xl font-bold text-on-surface leading-tight">
                      {event.title}
                    </h3>

                    {event.location && (
                      <p className="text-xs text-outline flex items-center gap-1.5 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-secondary shrink-0" />
                        <span className="truncate">{event.location}</span>
                      </p>
                    )}

                    {memory?.recapNote ? (
                      <p className="text-xs text-on-surface/90 italic leading-relaxed mt-2.5 bg-surface-container/60 p-2.5 rounded-xl border border-outline-variant/10">
                        "{memory.recapNote}"
                      </p>
                    ) : (
                      <p className="text-xs text-outline/70 mt-2">
                        {event.description || 'Marked as completed date.'}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-outline-variant/10 flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-secondary">
                      {hasMemory ? 'Memory Recorded ✨' : 'Needs Recap'}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      icon={<Edit2 className="w-3.5 h-3.5" />}
                      onClick={() => handleStartEdit(event)}
                    >
                      {hasMemory ? 'Edit Memory' : 'Add Recap'}
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 px-4 border border-dashed border-outline-variant/20 rounded-3xl bg-surface-container-low/40 max-w-xl mx-auto">
          <Camera className="w-12 h-12 text-primary/40 mx-auto mb-3" />
          <h3 className="font-serif text-xl text-on-surface font-semibold">Your Scrapbook Awaits</h3>
          <p className="text-xs text-outline max-w-md mx-auto mt-2 leading-relaxed">
            When you complete date nights in your Planner, they automatically arrive here ready for photos, ratings, and romantic notes to look back on forever.
          </p>
          <div className="mt-6 flex justify-center">
            <Button variant="primary" size="md" icon={<Plus className="w-4 h-4" />} onClick={onPlanNewDate}>
              Plan a Date Night
            </Button>
          </div>
        </div>
      )}

      {/* Edit Memory Modal */}
      <Modal
        isOpen={Boolean(editingEvent)}
        onClose={() => setEditingEvent(null)}
        title={`Recap: ${editingEvent?.title || 'Date Memory'}`}
        description="Preserve photos, ratings, and thoughts from your outing"
      >
        {editingEvent && (
          <form onSubmit={handleSave} className="space-y-4 pt-2">
            {/* Rating Stars */}
            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-semibold uppercase tracking-wider text-outline">
                How magical was this date?
              </label>
              <div className="flex items-center gap-2 pt-1">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => { hapticLight(); setRating(star); }}
                    className="p-1 rounded-lg text-outline hover:text-amber-400 transition-colors"
                  >
                    <Star
                      className={`w-7 h-7 ${
                        star <= rating ? 'fill-amber-400 text-amber-400' : 'text-outline/40'
                      }`}
                    />
                  </button>
                ))}
                <span className="text-xs font-bold text-on-surface ml-2">{rating}.0 / 5.0</span>
              </div>
            </div>

            {/* Recap Note */}
            <div className="space-y-1.5 text-left">
              <label htmlFor="recap-note" className="block text-xs font-semibold uppercase tracking-wider text-outline">
                Memory Recap & Sweet Moments
              </label>
              <textarea
                id="recap-note"
                rows={3}
                placeholder="What was the highlight? What did you laugh about? What made this date unforgettable?"
                value={recapNote}
                onChange={e => setRecapNote(e.target.value)}
                className="w-full bg-surface-container border border-outline-variant/30 rounded-xl p-3 text-sm text-on-surface outline-none focus:border-primary resize-none"
              />
            </div>

            {/* Photo URL or Presets */}
            <div className="space-y-2 text-left">
              <Input
                label="Photo URL (Optional)"
                placeholder="https://..."
                value={photoURL}
                onChange={e => setPhotoURL(e.target.value)}
                helperText="Paste an image link or pick a romantic memory backdrop below"
              />

              <div className="pt-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-outline block mb-2">
                  Or pick a romantic backdrop:
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {MEMORY_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setPhotoURL(preset.url)}
                      className={`relative h-14 rounded-lg overflow-hidden border text-left cursor-pointer transition-all ${
                        photoURL === preset.url ? 'border-primary ring-2 ring-primary/30' : 'border-outline-variant/20 opacity-80 hover:opacity-100'
                      }`}
                    >
                      <img src={preset.url} alt={preset.label} className="w-full h-full object-cover" />
                      <span className="absolute inset-0 bg-background/60 flex items-center justify-center text-[10px] font-bold text-white text-center p-1 leading-tight">
                        {preset.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-4">
              <Button variant="ghost" size="md" onClick={() => setEditingEvent(null)}>
                Cancel
              </Button>
              <Button variant="primary" size="md" type="submit" isLoading={isSaving}>
                Save Memory
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
