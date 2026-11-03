import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Star, Camera, Heart, Calendar, MapPin, Sparkles, Plus, Image as ImageIcon } from 'lucide-react';
import { Event, DateMemory } from '../../types';
import { hapticSuccess, hapticLight } from '../../utils/haptics';

interface DateScrapbookModalProps {
  isOpen: boolean;
  onClose: () => void;
  completedEvents: Event[];
  onSaveMemory: (eventId: string, memory: DateMemory) => Promise<void>;
  onPlanNewDate: () => void;
}

const MEMORY_PRESET_PHOTOS = [
  { label: 'Candlelit Dinner', url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80' },
  { label: 'Sunset Walk', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80' },
  { label: 'Stargazing Picnic', url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80' },
  { label: 'Weekend Getaway', url: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=800&q=80' },
  { label: 'Cozy Coffee', url: 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?auto=format&fit=crop&w=800&q=80' },
  { label: 'Wine & Vineyard', url: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&q=80' },
];

export default function DateScrapbookModal({
  isOpen,
  onClose,
  completedEvents,
  onSaveMemory,
  onPlanNewDate,
}: DateScrapbookModalProps) {
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [editingMemory, setEditingMemory] = useState<{
    eventId: string;
    photoURL: string;
    rating: number;
    recapNote: string;
    highlights: string;
  } | null>(null);
  const [ratingFilter, setRatingFilter] = useState<number | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const memoriesWithEvents = completedEvents.filter(e => {
    if (ratingFilter !== 'all') {
      const r = e.memory?.rating || 0;
      if (r < ratingFilter) return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = e.title.toLowerCase().includes(q);
      const matchLoc = e.location?.toLowerCase().includes(q);
      const matchNote = e.memory?.recapNote?.toLowerCase().includes(q);
      return matchTitle || matchLoc || matchNote;
    }
    return true;
  });

  const handleStartEditMemory = (event: Event) => {
    hapticLight();
    setEditingMemory({
      eventId: event.id,
      photoURL: event.memory?.photoURL || MEMORY_PRESET_PHOTOS[0].url,
      rating: event.memory?.rating || 5,
      recapNote: event.memory?.recapNote || '',
      highlights: event.memory?.highlights || '',
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMemory) return;
    setIsSaving(true);
    try {
      await onSaveMemory(editingMemory.eventId, {
        photoURL: editingMemory.photoURL,
        rating: editingMemory.rating,
        recapNote: editingMemory.recapNote,
        completedAt: new Date().toISOString(),
        highlights: editingMemory.highlights,
      });
      hapticSuccess();
      setEditingMemory(null);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
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
              <Camera className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-serif text-on-surface">Couple Scrapbook & Memories</h2>
              <p className="text-xs uppercase tracking-widest font-semibold text-outline/70">
                A Nostalgic Journal of Dates You've Cherished
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 rounded-full hover:bg-surface-container-highest transition-colors text-outline"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Filters and Controls */}
        <div className="flex flex-col sm:flex-row gap-3 py-4 items-center justify-between">
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1">
            <span className="text-[10px] uppercase tracking-widest font-bold text-outline">Filter:</span>
            <button
              onClick={() => { hapticLight(); setRatingFilter('all'); }}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                ratingFilter === 'all'
                  ? 'bg-primary text-on-primary-fixed shadow-sm'
                  : 'bg-surface-container-high text-outline hover:text-on-surface'
              }`}
            >
              All Memories ({completedEvents.length})
            </button>
            <button
              onClick={() => { hapticLight(); setRatingFilter(5); }}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                ratingFilter === 5
                  ? 'bg-secondary text-on-secondary shadow-sm'
                  : 'bg-surface-container-high text-outline hover:text-on-surface'
              }`}
            >
              <Star className="w-3 h-3 fill-current" /> 5-Star Only
            </button>
          </div>

          <div className="w-full sm:w-64">
            <input
              type="text"
              placeholder="Search memories..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-surface-container-high/60 border border-outline-variant/20 rounded-full px-4 py-2 text-xs outline-none focus:border-primary text-on-surface"
            />
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto no-scrollbar py-2 space-y-6">
          {memoriesWithEvents.length === 0 ? (
            <div className="text-center py-16 px-4 bg-surface-container-low/50 rounded-3xl border border-dashed border-outline-variant/30">
              <Heart className="w-12 h-12 text-primary/40 mx-auto mb-4 animate-pulse" />
              <h3 className="font-serif text-2xl mb-2">No Memories Logged Yet</h3>
              <p className="text-sm text-outline max-w-md mx-auto mb-6">
                When you mark dates as completed in your Planner, they become eternal keepsakes here in your Scrapbook!
              </p>
              <button
                onClick={() => {
                  onClose();
                  onPlanNewDate();
                }}
                className="bg-primary text-on-primary-fixed px-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest shadow-md hover:shadow-lg transition-all"
              >
                Plan a Date Now
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {memoriesWithEvents.map(event => {
                const mem = event.memory;
                const photo = mem?.photoURL || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80';
                const rating = mem?.rating || 5;

                return (
                  <motion.div
                    key={event.id}
                    whileHover={{ y: -6, rotate: 0.5 }}
                    className="bg-surface-container-lowest rounded-3xl p-4 shadow-xl border border-outline-variant/15 flex flex-col group transition-all"
                  >
                    {/* Polaroid Photo Frame */}
                    <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-surface-container-highest mb-4 shadow-inner">
                      <img
                        src={photo}
                        alt={event.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full flex items-center gap-1 text-secondary text-xs font-bold">
                        <Star className="w-3.5 h-3.5 fill-secondary" />
                        <span>{rating}</span>
                      </div>
                      <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[10px] text-white/90 font-medium">
                        {event.date}
                      </div>
                    </div>

                    {/* Recap & Notes */}
                    <div className="space-y-2 flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="font-serif text-xl text-on-surface line-clamp-1">{event.title}</h4>
                        {event.location && (
                          <p className="text-[11px] text-outline flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-primary/70 shrink-0" />
                            <span className="truncate">{event.location}</span>
                          </p>
                        )}
                        {mem?.recapNote ? (
                          <p className="text-xs text-on-surface/80 italic mt-2.5 font-serif line-clamp-3 bg-surface-container/60 p-3 rounded-xl border border-outline-variant/10">
                            "{mem.recapNote}"
                          </p>
                        ) : (
                          <p className="text-xs text-outline/50 italic mt-2">No recap note written yet.</p>
                        )}
                      </div>

                      <div className="pt-4 border-t border-outline-variant/10 flex items-center justify-between">
                        <div className="flex gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3.5 h-3.5 ${
                                i < rating ? 'text-secondary fill-secondary' : 'text-outline-variant/40'
                              }`}
                            />
                          ))}
                        </div>

                        <button
                          onClick={() => handleStartEditMemory(event)}
                          className="text-[10px] uppercase tracking-wider font-bold text-primary hover:text-primary-container px-3 py-1 rounded-lg bg-primary/10 transition-colors"
                        >
                          {mem ? 'Edit Memory' : '+ Add Memory'}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>

      {/* Edit Memory Modal Sheet */}
      <AnimatePresence>
        {editingMemory && (
          <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingMemory(null)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-surface-container rounded-3xl p-6 sm:p-8 shadow-2xl border border-primary/20 z-10 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-2xl font-serif text-on-surface">Capture Date Memory</h3>
                  <p className="text-xs text-outline">Save a photo, romantic recap, and rating for this date.</p>
                </div>
                <button
                  onClick={() => setEditingMemory(null)}
                  className="p-2 hover:bg-white/5 rounded-full text-outline"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-6">
                {/* Photo Preview & Custom URL */}
                <div className="space-y-3">
                  <label className="text-xs uppercase tracking-widest font-bold text-outline">Memory Photo</label>
                  <div className="h-44 w-full rounded-2xl overflow-hidden bg-surface-container-high relative border border-outline-variant/20 shadow-inner">
                    <img
                      src={editingMemory.photoURL}
                      alt="Memory preview"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  <input
                    type="url"
                    placeholder="Enter custom image URL (or pick a preset below)..."
                    value={editingMemory.photoURL}
                    onChange={e => setEditingMemory({ ...editingMemory, photoURL: e.target.value })}
                    className="w-full bg-surface-container-high/60 border border-outline-variant/30 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-primary text-on-surface"
                  />

                  {/* Preset Photos */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-outline/70">
                      Romantic Photo Presets:
                    </span>
                    <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                      {MEMORY_PRESET_PHOTOS.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            hapticLight();
                            setEditingMemory({ ...editingMemory, photoURL: preset.url });
                          }}
                          className={`px-3 py-1.5 rounded-full text-[10px] font-bold whitespace-nowrap transition-all border ${
                            editingMemory.photoURL === preset.url
                              ? 'bg-primary text-on-primary-fixed border-primary'
                              : 'bg-surface-container-high/80 text-outline border-outline-variant/20'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Rating (1 - 5 stars) */}
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-widest font-bold text-outline">Date Rating</label>
                  <div className="flex items-center gap-3 bg-surface-container-low p-3 rounded-2xl border border-outline-variant/10">
                    {Array.from({ length: 5 }).map((_, idx) => {
                      const starVal = idx + 1;
                      const isFilled = starVal <= editingMemory.rating;
                      return (
                        <button
                          key={starVal}
                          type="button"
                          onClick={() => {
                            hapticLight();
                            setEditingMemory({ ...editingMemory, rating: starVal });
                          }}
                          className="p-1 hover:scale-125 transition-transform"
                        >
                          <Star
                            className={`w-7 h-7 transition-colors ${
                              isFilled ? 'text-secondary fill-secondary' : 'text-outline/30'
                            }`}
                          />
                        </button>
                      );
                    })}
                    <span className="ml-auto text-xs font-serif text-secondary font-bold">
                      {editingMemory.rating === 5 ? 'Pure Magic! 💖' : `${editingMemory.rating} / 5 Stars`}
                    </span>
                  </div>
                </div>

                {/* Romantic Recap Note */}
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-widest font-bold text-outline">
                    Recap Note / Best Moments
                  </label>
                  <textarea
                    rows={3}
                    placeholder="e.g., Best dessert in town! We talked until midnight under the city lights..."
                    value={editingMemory.recapNote}
                    onChange={e => setEditingMemory({ ...editingMemory, recapNote: e.target.value })}
                    className="w-full bg-surface-container-high/60 border border-outline-variant/30 rounded-2xl p-4 text-sm font-serif outline-none focus:border-primary text-on-surface resize-none shadow-inner"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingMemory(null)}
                    className="flex-1 py-3.5 rounded-full font-bold text-xs uppercase tracking-wider text-outline hover:bg-white/5 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex-[2] bg-primary text-on-primary-fixed py-3.5 rounded-full font-bold text-xs uppercase tracking-wider shadow-lg shadow-primary/20 hover:shadow-primary/30 active:scale-95 transition-all"
                  >
                    {isSaving ? 'Preserving Memory...' : 'Save to Scrapbook'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
