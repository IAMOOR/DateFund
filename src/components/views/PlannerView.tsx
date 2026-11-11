import React, { useState, useMemo, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Plus,
  Share2,
  Sparkles,
  Loader2,
  Camera,
  CheckCircle2,
  Circle,
  Trash2,
  Pencil,
  List,
  LayoutGrid,
  Search,
  X,
  Unlock,
  Lock,
  Star,
  PiggyBank,
  MessageCircleHeart,
  Send,
  CheckSquare,
  Square,
  Download,
  Compass,
  Utensils,
  Bookmark,
  ChevronDown,
  ChevronUp,
  Shirt,
  Wallet
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import CalendarComponent from '../Calendar';
import {
  Event,
  Goal,
  BucketListItem,
  DateMood,
  DateChecklistItem,
  DateItineraryStop,
  SharedSpotPayload
} from '../../types';
import { DATE_MOODS } from '../../utils/moods';
import { MoodBadge } from '../ui/MoodBadge';
import { formatRand, formatDateShort } from '../../utils/formatters';
import { hapticLight, hapticMedium, hapticSuccess } from '../../utils/haptics';

export interface DateBlueprintPreset {
  id: string;
  title: string;
  region: string;
  location: string;
  description: string;
  mood: DateMood;
  estimatedBudget: number;
  dressCode: string;
  defaultTime: string;
  tags: string[];
  isMystery?: boolean;
  mysteryClue?: string;
  checklist: string[];
  itinerary: DateItineraryStop[];
}

export const DATE_BLUEPRINT_PRESETS: DateBlueprintPreset[] = [
  {
    id: 'preset_benoni_cozy',
    title: 'Lakeside Sunset & Garden Café Date',
    region: 'Benoni · Ekurhuleni',
    location: 'Homestead Dam & Farrarmere, Benoni',
    description:
      'Golden-hour stroll along Homestead Dam followed by artisan coffee, warm pastries, and dessert at a leafy Farrarmere garden café.',
    mood: 'Cozy',
    estimatedBudget: 380,
    dressCode: 'Smart Casual & Warm Layer',
    defaultTime: '16:30',
    tags: ['Ekurhuleni', 'Benoni', 'Lakeside', 'Coffee Date'],
    checklist: [
      'Pack a cozy picnic blanket for Homestead Dam',
      'Reserve a garden corner table in Farrarmere',
      'Bring camera for golden-hour lakeside photos'
    ],
    itinerary: [
      { time: '16:30', activity: 'Golden-hour walk along Homestead Dam shoreline' },
      { time: '17:45', activity: 'Cappuccinos & warm Belgian waffles in Farrarmere' },
      { time: '19:00', activity: 'Sunset reflection & couple conversation cards' }
    ]
  },
  {
    id: 'preset_boksburg_romantic',
    title: 'Bokkie Park Stroll & Candlelit Dinner',
    region: 'Boksburg · Ekurhuleni',
    location: 'Bokkie Park & Boksburg Lake Bistro, Boksburg',
    description:
      'Afternoon visit to Bokkie Park followed by an intimate candlelit dinner with wood-fired pizza and Cape red wine.',
    mood: 'Romantic',
    estimatedBudget: 680,
    dressCode: 'Evening Smart Casual',
    defaultTime: '17:00',
    tags: ['Ekurhuleni', 'Boksburg', 'Dinner Date', 'Romantic'],
    checklist: [
      'Confirm evening dinner table reservation',
      'Check sunset time over Boksburg',
      'Queue acoustic dinner drive playlist'
    ],
    itinerary: [
      { time: '17:00', activity: 'Relaxed afternoon stroll at Bokkie Park' },
      { time: '18:30', activity: 'Welcome drinks & starters by candlelight' },
      { time: '19:30', activity: 'Main course & shared tiramisu dessert' }
    ]
  },
  {
    id: 'preset_springs_active',
    title: 'Marievale Bird Sanctuary & Art Deco Brunch',
    region: 'Springs · Ekurhuleni',
    location: 'Marievale Bird Sanctuary, Springs',
    description:
      'Scenic morning wetland walk spotting flamingos at Marievale Sanctuary followed by a hearty brunch in Springs.',
    mood: 'Adventurous',
    estimatedBudget: 440,
    dressCode: 'Comfortable Outdoor / Sneakers',
    defaultTime: '08:30',
    tags: ['Ekurhuleni', 'Springs', 'Nature', 'Brunch'],
    checklist: [
      'Pack binoculars and reusable water bottles',
      'Bring sunscreen and hats for the sanctuary trail',
      'Pick a Springs café for post-walk brunch'
    ],
    itinerary: [
      { time: '08:30', activity: 'Arrive at Marievale Bird Sanctuary hides' },
      { time: '10:30', activity: 'Scenic drive & Art Deco heritage stop' },
      { time: '11:15', activity: 'Artisan brunch & fresh juices' }
    ]
  },
  {
    id: 'preset_brakpan_luxury',
    title: 'Twilight Sundowners & Fine Dining',
    region: 'Brakpan · Ekurhuleni',
    location: 'Sherwood Gardens & Carnival Precinct, Brakpan',
    description:
      'Dress up for signature craft cocktails at sunset followed by a three-course celebratory couple dinner.',
    mood: 'Luxurious',
    estimatedBudget: 950,
    dressCode: 'Cocktail / Dress to Impress',
    defaultTime: '18:30',
    tags: ['Ekurhuleni', 'Brakpan', 'Fine Dining', 'Date Night'],
    checklist: [
      'Book window or terrace table 48 hours ahead',
      'Coordinate evening outfits together',
      'Arrange safe return transport'
    ],
    itinerary: [
      { time: '18:30', activity: 'Sunset craft cocktails & canapés' },
      { time: '19:30', activity: 'Three-course chef’s dinner experience' },
      { time: '21:15', activity: 'Nightcap & dessert toast' }
    ]
  },
  {
    id: 'preset_mystery_surprise',
    title: 'Secret Scratch-Off Surprise Date Night',
    region: 'Surprise Adventure',
    location: 'Secret Location (Revealed on Date Night)',
    description:
      'A sealed mystery adventure planned for your partner—complete with a dress-code clue and scratch-off reveal card.',
    mood: 'Playful',
    estimatedBudget: 550,
    dressCode: 'Smart Casual & Comfortable Shoes',
    defaultTime: '18:00',
    tags: ['Mystery Date', 'Surprise', 'Date Night'],
    isMystery: true,
    mysteryClue: 'Wear something comfortable for a sunset walk and bring your appetite for something sweet!',
    checklist: [
      'Book secret venue without spoiling the surprise',
      'Write a playful clue for your partner',
      'Prepare a small surprise treat for the car ride'
    ],
    itinerary: [
      { time: '18:00', activity: 'Scratch off the mystery card & depart together' },
      { time: '18:45', activity: 'Surprise main activity & dinner' }
    ]
  }
];

export interface PlannerViewProps {
  events: Event[];
  goals: Goal[];
  bucketList: BucketListItem[];
  totalBalance: number;
  currentUserUid: string;
  partnerName?: string;
  plannerMode: 'list' | 'grid' | 'calendar';
  setPlannerMode: (mode: 'list' | 'grid' | 'calendar') => void;
  plannerSort: 'date' | 'time' | 'title';
  setPlannerSort: (sort: 'date' | 'time' | 'title') => void;
  plannerMoodFilter: DateMood | 'all';
  setPlannerMoodFilter: (mood: DateMood | 'all') => void;
  isSuggesting: boolean;
  onSuggestIdea: () => void;
  onOpenNewEventModal: (initialDate?: string) => void;
  onApplyBlueprintPreset: (preset: DateBlueprintPreset) => void;
  onPlanFromBucketItem: (item: BucketListItem) => void;
  onEditEvent: (event: Event) => void;
  onDeleteEvent: (eventId: string) => void;
  onToggleEventCompletion: (event: Event) => void;
  onUpdateEventRsvp: (event: Event, status: 'Going' | 'Maybe' | 'Not Going') => Promise<void>;
  onUpdateEventChecklist: (event: Event, nextChecklist: DateChecklistItem[]) => Promise<void>;
  onRevealMysteryEvent: (event: Event) => void;
  onShareEventToChat: (event: Event) => Promise<void>;
  onViewEventOnMap: (event: Event) => void;
  onSelectGoalForFunding: (goalId: string) => void;
  onOpenRomanticTips: (mood: DateMood) => void;
  onOpenScrapbook: () => void;
  onOpenJoinEventModal: () => void;
  onOpenSplitterModal: () => void;
  onCopyInviteCode: (eventId: string) => void;
}

type StatusTab = 'all' | 'upcoming' | 'completed' | 'mystery';

interface DetailedCountdown {
  daysUntil: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  label: string;
  unitLabel: string;
  isUrgent: boolean;
  isPast: boolean;
  isTonight: boolean;
  anticipationPct: number;
  anticipationMessage: string;
}

function getDetailedCountdown(dateStr: string, timeStr?: string, nowMs = Date.now()): DetailedCountdown {
  try {
    const now = new Date(nowMs);
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const [y, m, d] = dateStr.split('-').map(Number);
    const targetMidnight = new Date(y, (m || 1) - 1, d || 1);
    const daysUntil = Math.round((targetMidnight.getTime() - todayMidnight.getTime()) / 86400000);

    const [hh, mm] = (timeStr || '19:00').split(':').map(Number);
    const targetDateTime = new Date(
      y,
      (m || 1) - 1,
      d || 1,
      Number.isFinite(hh) ? hh : 19,
      Number.isFinite(mm) ? mm : 0,
      0
    );

    const diffMs = targetDateTime.getTime() - nowMs;
    const clampedMs = Math.max(0, diffMs);
    const totalSeconds = Math.floor(clampedMs / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    // Anticipation progress over a 14-day window leading up to date night
    const clampedDaysWindow = Math.min(14, Math.max(0, daysUntil));
    const anticipationPct =
      daysUntil <= 0
        ? 100
        : Math.max(12, Math.min(98, Math.round(((14 - clampedDaysWindow) / 14) * 100)));

    let label = `${daysUntil} Days Until`;
    let unitLabel = daysUntil === 1 ? 'Day Until' : 'Days Until';
    let anticipationMessage =
      'Marked on your couple calendar—something romantic to look forward to together.';

    if (daysUntil < 0) {
      label = `${Math.abs(daysUntil)}d ago`;
      unitLabel = 'Days Ago';
      anticipationMessage = 'This date date has passed—mark it complete to log your Scrapbook memory!';
    } else if (daysUntil === 0) {
      label = timeStr ? `Tonight · ${timeStr}` : 'Today · Date Night';
      unitLabel = 'Tonight!';
      anticipationMessage =
        "Tonight's the night! Dress up, savour every moment, and make a cherished memory together.";
    } else if (daysUntil === 1) {
      label = timeStr ? `1 Day Until · ${timeStr}` : '1 Day Until';
      unitLabel = 'Day Until';
      anticipationMessage =
        'Only 1 day to go! Tomorrow is date night—double-check your reservation and outfits.';
    } else if (daysUntil <= 3) {
      label = `${daysUntil} Days Until`;
      unitLabel = 'Days Until';
      anticipationMessage = `Just ${daysUntil} days left! The countdown to your next date night is officially on.`;
    } else if (daysUntil <= 7) {
      label = `${daysUntil} Days Until`;
      unitLabel = 'Days Until';
      anticipationMessage = `${daysUntil} days to go—coming up this week! Share the invite in Partner Chat to build the excitement.`;
    }

    return {
      daysUntil,
      days,
      hours,
      minutes,
      seconds,
      label,
      unitLabel,
      isUrgent: daysUntil >= 0 && daysUntil <= 7,
      isPast: daysUntil < 0,
      isTonight: daysUntil === 0,
      anticipationPct,
      anticipationMessage
    };
  } catch {
    return {
      daysUntil: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      label: dateStr,
      unitLabel: 'Days Until',
      isUrgent: false,
      isPast: false,
      isTonight: false,
      anticipationPct: 50,
      anticipationMessage: 'Get ready for your next shared date night together.'
    };
  }
}

function getCountdownLabel(dateStr: string, timeStr?: string): { label: string; isUrgent: boolean; isPast: boolean; daysUntil: number } {
  const details = getDetailedCountdown(dateStr, timeStr);
  return {
    label: details.label,
    isUrgent: details.isUrgent,
    isPast: details.isPast,
    daysUntil: details.daysUntil
  };
}

function buildGoogleCalendarUrl(event: Event): string {
  const cleanDate = (event.date || '').replace(/-/g, '');
  const startHour = event.time ? event.time.replace(':', '') + '00' : '190000';
  const endHourNum = event.time
    ? Math.min(23, (parseInt(event.time.split(':')[0], 10) || 19) + 2)
        .toString()
        .padStart(2, '0') +
      (event.time.split(':')[1] || '00') +
      '00'
    : '210000';
  const datesParam = cleanDate ? `${cleanDate}T${startHour}/${cleanDate}T${endHourNum}` : '';
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.isMystery && !event.mysteryRevealed ? 'Mystery Date Night ✨' : event.title,
    details:
      event.isMystery && !event.mysteryRevealed
        ? event.mysteryClue || 'Surprise couple date night!'
        : `${event.description || 'Planned with DateFund'}${event.dressCode ? `\nDress Code: ${event.dressCode}` : ''}`,
    location: event.isMystery && !event.mysteryRevealed ? 'Secret Location' : event.location || ''
  });
  if (datesParam) params.set('dates', datesParam);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function downloadEventIcs(event: Event) {
  const cleanDate = (event.date || new Date().toISOString().split('T')[0]).replace(/-/g, '');
  const startHour = event.time ? event.time.replace(':', '') + '00' : '190000';
  const endHour = event.time
    ? Math.min(23, (parseInt(event.time.split(':')[0], 10) || 19) + 2)
        .toString()
        .padStart(2, '0') +
      (event.time.split(':')[1] || '00') +
      '00'
    : '210000';
  const title = event.isMystery && !event.mysteryRevealed ? 'Mystery Date Night' : event.title;
  const location = event.isMystery && !event.mysteryRevealed ? 'Surprise Location' : event.location || '';
  const description = (
    event.isMystery && !event.mysteryRevealed
      ? event.mysteryClue || 'Surprise Date Night'
      : event.description || 'Scheduled on DateFund'
  ).replace(/\n/g, '\\n');

  const icsLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//DateFund//Couple Date Planner//EN',
    'BEGIN:VEVENT',
    `UID:${event.id}@datefund.app`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
    `DTSTART:${cleanDate}T${startHour}`,
    `DTEND:${cleanDate}T${endHour}`,
    `SUMMARY:${title}`,
    `LOCATION:${location}`,
    `DESCRIPTION:${description}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  const blob = new Blob([icsLines], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function PlannerView({
  events,
  goals,
  bucketList,
  totalBalance,
  currentUserUid,
  partnerName = 'Your Partner',
  plannerMode,
  setPlannerMode,
  plannerSort,
  setPlannerSort,
  plannerMoodFilter,
  setPlannerMoodFilter,
  isSuggesting,
  onSuggestIdea,
  onOpenNewEventModal,
  onApplyBlueprintPreset,
  onPlanFromBucketItem,
  onEditEvent,
  onDeleteEvent,
  onToggleEventCompletion,
  onUpdateEventRsvp,
  onUpdateEventChecklist,
  onRevealMysteryEvent,
  onShareEventToChat,
  onViewEventOnMap,
  onSelectGoalForFunding,
  onOpenRomanticTips,
  onOpenScrapbook,
  onOpenJoinEventModal,
  onOpenSplitterModal,
  onCopyInviteCode
}: PlannerViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusTab, setStatusTab] = useState<StatusTab>('all');
  const [showBlueprints, setShowBlueprints] = useState(false);
  const [expandedChecklistIds, setExpandedChecklistIds] = useState<Record<string, boolean>>({});
  const [newChecklistInputByEvent, setNewChecklistInputByEvent] = useState<Record<string, string>>({});
  const [selectedSpotlightId, setSelectedSpotlightId] = useState<string | null>(null);
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  // 1-second live tick for the 'Days Until' anticipation countdown visual
  useEffect(() => {
    const timer = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Compute Planner KPI Metrics
  const plannerMetrics = useMemo(() => {
    const upcomingEvents = events.filter(e => !e.completed);
    const completedEvents = events.filter(e => e.completed);
    const mysteryCount = events.filter(e => e.isMystery).length;

    const plannedBudgetTotal = upcomingEvents.reduce(
      (sum, e) => sum + (Number(e.estimatedBudget) || 0),
      0
    );

    let totalChecklistItems = 0;
    let completedChecklistItems = 0;
    upcomingEvents.forEach(e => {
      if (Array.isArray(e.checklist)) {
        totalChecklistItems += e.checklist.length;
        completedChecklistItems += e.checklist.filter(item => item.done).length;
      }
    });

    const ratedMemories = completedEvents.filter(e => e.memory?.rating);
    const avgRating =
      ratedMemories.length > 0
        ? (
            ratedMemories.reduce((sum, e) => sum + (e.memory?.rating || 5), 0) /
            ratedMemories.length
          ).toFixed(1)
        : null;

    // Sort upcoming dates chronologically and prioritize today/future dates for the countdown
    const sortedUpcoming = [...upcomingEvents].sort((a, b) => {
      const aTime = new Date(`${a.date}T${a.time || '23:59'}`).getTime();
      const bTime = new Date(`${b.date}T${b.time || '23:59'}`).getTime();
      return aTime - bTime;
    });

    const futureOrTodayUpcoming = sortedUpcoming.filter(
      ev => getCountdownLabel(ev.date, ev.time).daysUntil >= 0
    );
    const orderedSpotlightCandidates =
      futureOrTodayUpcoming.length > 0 ? futureOrTodayUpcoming : sortedUpcoming;

    return {
      upcomingCount: upcomingEvents.length,
      completedCount: completedEvents.length,
      mysteryCount,
      plannedBudgetTotal,
      totalChecklistItems,
      completedChecklistItems,
      avgRating,
      upcomingList: orderedSpotlightCandidates,
      nextDate: orderedSpotlightCandidates[0] || null
    };
  }, [events]);

  // Filter and sort events
  const filteredAndSortedEvents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return events
      .filter(ev => {
        if (statusTab === 'upcoming' && ev.completed) return false;
        if (statusTab === 'completed' && !ev.completed) return false;
        if (statusTab === 'mystery' && !ev.isMystery) return false;

        if (plannerMoodFilter !== 'all' && (ev.mood || 'Romantic') !== plannerMoodFilter) {
          return false;
        }

        if (!q) return true;
        const haystack = [
          ev.title,
          ev.description,
          ev.location,
          ev.dressCode,
          ev.mood,
          ...(ev.tags || [])
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return haystack.includes(q);
      })
      .sort((a, b) => {
        if (plannerSort === 'date') {
          const cmp = a.date.localeCompare(b.date);
          if (cmp !== 0) return cmp;
          return (a.time || '').localeCompare(b.time || '');
        }
        if (plannerSort === 'time') {
          return (a.time || '23:59').localeCompare(b.time || '23:59');
        }
        return a.title.localeCompare(b.title);
      });
  }, [events, statusTab, plannerMoodFilter, searchQuery, plannerSort]);

  const toggleChecklistExpand = (eventId: string) => {
    hapticLight();
    setExpandedChecklistIds(prev => ({ ...prev, [eventId]: !prev[eventId] }));
  };

  const handleToggleChecklistItem = async (event: Event, itemId: string) => {
    hapticLight();
    const current = event.checklist || [];
    const next = current.map(item => (item.id === itemId ? { ...item, done: !item.done } : item));
    await onUpdateEventChecklist(event, next);
  };

  const handleAddChecklistItem = async (event: Event) => {
    const raw = (newChecklistInputByEvent[event.id] || '').trim();
    if (!raw) return;
    hapticSuccess();
    const current = event.checklist || [];
    const nextItem: DateChecklistItem = {
      id: `chk_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      text: raw.slice(0, 120),
      done: false
    };
    setNewChecklistInputByEvent(prev => ({ ...prev, [event.id]: '' }));
    await onUpdateEventChecklist(event, [...current, nextItem]);
  };

  const handleDeleteChecklistItem = async (event: Event, itemId: string) => {
    hapticLight();
    const current = event.checklist || [];
    await onUpdateEventChecklist(
      event,
      current.filter(item => item.id !== itemId)
    );
  };

  const handleSeedDefaultChecklist = async (event: Event) => {
    hapticMedium();
    const defaults: DateChecklistItem[] = [
      { id: `chk_1_${Date.now()}`, text: 'Confirm venue reservation or opening hours', done: false },
      { id: `chk_2_${Date.now()}`, text: 'Coordinate outfits & check weather forecast', done: false },
      { id: `chk_3_${Date.now()}`, text: 'Send calendar invite & share spot in Partner Chat', done: true }
    ];
    setExpandedChecklistIds(prev => ({ ...prev, [event.id]: true }));
    await onUpdateEventChecklist(event, defaults);
  };

  return (
    <motion.div
      key="planner"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.18 }}
      className="space-y-6 pb-8"
    >
      {/* Top Workspace Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-outline-variant/15 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-outline">
            <span>Couple Itinerary</span>
            <span aria-hidden="true">·</span>
            <span>{plannerMetrics.upcomingCount} Upcoming</span>
            <span aria-hidden="true">·</span>
            <span>{plannerMetrics.completedCount} Completed</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-serif tracking-tight text-on-surface">
            Date Night Planner
          </h2>
          <p className="text-outline text-sm max-w-xl">
            Design memorable dates across Ekurhuleni and beyond, coordinate RSVPs and prep checklists, and link every outing to your shared savings goals.
          </p>
        </div>

        {/* Primary Action Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-start lg:justify-end">
          <button
            type="button"
            onClick={() => {
              hapticLight();
              setShowBlueprints(prev => !prev);
            }}
            className={`px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-colors cursor-pointer whitespace-nowrap shrink-0 min-h-[42px] ${
              showBlueprints
                ? 'bg-secondary text-on-secondary border-secondary shadow-xs'
                : 'bg-surface-container text-on-surface hover:border-secondary/50 border-outline-variant/20'
            }`}
          >
            <Compass className="w-4 h-4 text-secondary shrink-0" />
            <span>Date Blueprints ({DATE_BLUEPRINT_PRESETS.length})</span>
            {showBlueprints ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={() => {
              hapticLight();
              onOpenSplitterModal();
            }}
            className="px-3.5 py-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface border border-outline-variant/20 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 min-h-[42px]"
            title="Who Treats & Bill Splitter"
          >
            <Utensils className="w-3.5 h-3.5 text-primary shrink-0" />
            <span>Who Treats?</span>
          </button>

          <button
            type="button"
            onClick={() => {
              hapticLight();
              onOpenScrapbook();
            }}
            className="px-3.5 py-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface border border-outline-variant/20 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 min-h-[42px]"
            title="Couple Scrapbook"
          >
            <Camera className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="hidden sm:inline">Scrapbook</span>
          </button>

          <button
            type="button"
            onClick={() => {
              hapticLight();
              onOpenJoinEventModal();
            }}
            className="px-3.5 py-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface border border-outline-variant/20 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 min-h-[42px]"
            title="Join Partner's Date with Code"
          >
            <Share2 className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="hidden sm:inline">Join Code</span>
          </button>

          <button
            type="button"
            onClick={onSuggestIdea}
            disabled={isSuggesting}
            className="px-3.5 py-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface border border-outline-variant/20 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap shrink-0 min-h-[42px]"
            title="Generate a tailored date idea"
          >
            {isSuggesting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-primary shrink-0" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" />
            )}
            <span>Inspire Us</span>
          </button>

          <button
            type="button"
            onClick={() => {
              hapticMedium();
              onOpenNewEventModal();
            }}
            className="px-4 py-2.5 rounded-xl bg-primary text-on-primary-fixed text-xs font-bold flex items-center gap-1.5 shadow-sm hover:opacity-95 transition-all cursor-pointer whitespace-nowrap shrink-0 min-h-[42px]"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>Plan Date Night</span>
          </button>
        </div>
      </div>

      {/* 4-Column Couple Readiness & Budget KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-surface-container-low rounded-2xl p-4 border border-outline-variant/15">
          <span className="text-xs text-outline block">Upcoming Schedule</span>
          <div className="mt-1 flex items-baseline justify-between gap-2">
            <strong className="text-2xl font-serif text-on-surface tabular-nums">
              {plannerMetrics.upcomingCount}
            </strong>
            <span className="text-xs text-primary font-semibold truncate">
              {plannerMetrics.nextDate
                ? getCountdownLabel(plannerMetrics.nextDate.date, plannerMetrics.nextDate.time).label
                : 'None scheduled'}
            </span>
          </div>
        </div>

        <div className="bg-surface-container-low rounded-2xl p-4 border border-outline-variant/15">
          <span className="text-xs text-outline block">Planned Date Budget</span>
          <div className="mt-1 flex items-baseline justify-between gap-2">
            <strong className="text-2xl font-serif text-on-surface tabular-nums">
              {formatRand(plannerMetrics.plannedBudgetTotal)}
            </strong>
            <span className="text-xs text-outline tabular-nums truncate">
              Fund: {formatRand(totalBalance)}
            </span>
          </div>
        </div>

        <div className="bg-surface-container-low rounded-2xl p-4 border border-outline-variant/15">
          <span className="text-xs text-outline block">Date Prep Checklist</span>
          <div className="mt-1 flex items-baseline justify-between gap-2">
            <strong className="text-2xl font-serif text-on-surface tabular-nums">
              {plannerMetrics.totalChecklistItems > 0
                ? `${plannerMetrics.completedChecklistItems}/${plannerMetrics.totalChecklistItems}`
                : 'Ready'}
            </strong>
            <span className="text-xs text-outline truncate">
              {plannerMetrics.totalChecklistItems > 0
                ? `${Math.round(
                    (plannerMetrics.completedChecklistItems / plannerMetrics.totalChecklistItems) * 100
                  )}% complete`
                : 'Add tasks on any card'}
            </span>
          </div>
        </div>

        <div className="bg-surface-container-low rounded-2xl p-4 border border-outline-variant/15">
          <span className="text-xs text-outline block">Memories Logged</span>
          <div className="mt-1 flex items-baseline justify-between gap-2">
            <strong className="text-2xl font-serif text-on-surface tabular-nums">
              {plannerMetrics.completedCount}
            </strong>
            <span className="text-xs text-amber-400 font-semibold tabular-nums">
              {plannerMetrics.avgRating ? `${plannerMetrics.avgRating} ★ avg` : 'Scrapbook ready'}
            </span>
          </div>
        </div>
      </div>

      {/* Expandable Quick-Start Date Blueprints & Wishlist Drawer */}
      <AnimatePresence>
        {showBlueprints && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.16 }}
            className="bg-surface-container rounded-2xl p-5 border border-outline-variant/20 space-y-5"
          >
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="text-lg font-serif font-bold text-on-surface">
                  1-Tap Couple Date Blueprints
                </h3>
                <p className="text-xs text-outline">
                  Select a curated Ekurhuleni or surprise blueprint to pre-fill your date title, location, budget, dress code, itinerary, and prep checklist.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowBlueprints(false)}
                className="p-2 rounded-xl text-outline hover:text-on-surface cursor-pointer"
                aria-label="Close blueprints"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {DATE_BLUEPRINT_PRESETS.map(preset => (
                <div
                  key={preset.id}
                  className="bg-surface-container-low rounded-xl p-4 border border-outline-variant/15 flex flex-col justify-between gap-3 hover:border-primary/40 transition-colors"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2 text-xs text-outline">
                      <span>{preset.region}</span>
                      <span className="font-serif font-bold text-primary tabular-nums">
                        ~{formatRand(preset.estimatedBudget)}
                      </span>
                    </div>
                    <h4 className="font-serif font-bold text-base text-on-surface leading-snug">
                      {preset.title}
                    </h4>
                    <p className="text-xs text-on-surface/75 line-clamp-2 leading-relaxed">
                      {preset.description}
                    </p>
                    <div className="text-[11px] text-outline pt-1">
                      <span>{preset.mood}</span>
                      <span aria-hidden="true"> · </span>
                      <span>{preset.dressCode}</span>
                      <span aria-hidden="true"> · </span>
                      <span>{preset.checklist.length} prep steps</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      hapticSuccess();
                      onApplyBlueprintPreset(preset);
                      setShowBlueprints(false);
                    }}
                    className="w-full py-2 px-3 rounded-lg bg-primary/15 hover:bg-primary text-primary hover:text-on-primary-fixed text-xs font-bold transition-colors cursor-pointer whitespace-nowrap"
                  >
                    Use This Blueprint
                  </button>
                </div>
              ))}
            </div>

            {/* Schedule Directly from Couple Bucket List / Wishlist */}
            {bucketList.length > 0 && (
              <div className="pt-3 border-t border-outline-variant/15 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                    <Bookmark className="w-3.5 h-3.5 text-secondary" />
                    <span>Schedule from Your Couple Bucket List ({bucketList.length})</span>
                  </span>
                </div>
                <div className="flex items-center gap-2.5 overflow-x-auto pb-1 no-scrollbar">
                  {bucketList.map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        hapticMedium();
                        onPlanFromBucketItem(item);
                        setShowBlueprints(false);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-surface-container-low hover:bg-surface-container-high border border-outline-variant/20 text-left shrink-0 transition-colors cursor-pointer"
                    >
                      <span className="text-xs font-bold text-on-surface block truncate max-w-[200px]">
                        {item.title}
                      </span>
                      <span className="text-[11px] text-outline tabular-nums">
                        {item.category} · {formatRand(item.estimatedBudget)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 'Days Until' Next Upcoming Date Night Anticipation & Countdown Visual */}
      {plannerMetrics.nextDate && statusTab !== 'completed' && !searchQuery && (
        <div className="bg-surface-container-low rounded-2xl p-5 sm:p-6 border border-outline-variant/20 space-y-5">
          {(() => {
            const activeSpotlightEvent =
              plannerMetrics.upcomingList.find(e => e.id === selectedSpotlightId) ||
              plannerMetrics.nextDate!;
            const isMysteryLocked =
              Boolean(activeSpotlightEvent.isMystery && !activeSpotlightEvent.mysteryRevealed);
            const liveCountdown = getDetailedCountdown(
              activeSpotlightEvent.date,
              activeSpotlightEvent.time,
              nowMs
            );
            const linkedGoal = activeSpotlightEvent.goalId
              ? goals.find(g => g.id === activeSpotlightEvent.goalId)
              : undefined;
            const goalPct =
              linkedGoal && linkedGoal.targetAmount > 0
                ? Math.min(100, Math.round((linkedGoal.currentAmount / linkedGoal.targetAmount) * 100))
                : null;

            const checklist = activeSpotlightEvent.checklist || [];
            const checklistDone = checklist.filter(i => i.done).length;
            const checklistPct =
              checklist.length > 0 ? Math.round((checklistDone / checklist.length) * 100) : 100;
            const readinessPct =
              goalPct !== null ? Math.round((checklistPct + goalPct) / 2) : checklistPct;

            // SVG radial progress math (radius = 54, circumference = 2 * PI * 54 = 339.29)
            const radius = 54;
            const circumference = 2 * Math.PI * radius;
            const dashOffset =
              circumference - (liveCountdown.anticipationPct / 100) * circumference;

            return (
              <>
                {/* Optional Switcher when Multiple Upcoming Dates Exist */}
                {plannerMetrics.upcomingList.length > 1 && (
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-outline-variant/15">
                    <span className="text-xs font-semibold text-outline">
                      Upcoming Date Night Countdown ({plannerMetrics.upcomingList.length} scheduled)
                    </span>
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                      {plannerMetrics.upcomingList.slice(0, 4).map((ev, idx) => {
                        const isSelected = ev.id === activeSpotlightEvent.id;
                        const evCd = getCountdownLabel(ev.date, ev.time);
                        return (
                          <button
                            key={ev.id}
                            type="button"
                            onClick={() => {
                              hapticLight();
                              setSelectedSpotlightId(ev.id);
                            }}
                            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 border ${
                              isSelected
                                ? 'bg-primary text-on-primary-fixed border-primary'
                                : 'bg-surface-container text-outline hover:text-on-surface border-outline-variant/15'
                            }`}
                          >
                            <span>
                              {idx === 0 ? 'Next: ' : ''}
                              {ev.isMystery && !ev.mysteryRevealed ? 'Mystery Date ✨' : ev.title}
                            </span>
                            <span className="ml-1.5 opacity-85 tabular-nums">
                              ({evCd.daysUntil === 0 ? 'Tonight' : `${evCd.daysUntil}d`})
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6">
                  {/* Left Focal Anchor: 'Days Until' Radial Dial + Live 4-Unit Countdown */}
                  <div className="flex flex-col sm:flex-row items-center gap-5 bg-surface-container rounded-2xl p-4 sm:p-5 border border-outline-variant/15 shrink-0">
                    {/* Radial SVG 'Days Until' Visual */}
                    <div className="relative w-32 h-32 sm:w-36 sm:h-36 flex items-center justify-center shrink-0">
                      <svg
                        className="w-full h-full -rotate-90"
                        viewBox="0 0 128 128"
                        aria-hidden="true"
                      >
                        <circle
                          cx="64"
                          cy="64"
                          r={radius}
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="8"
                          className="text-outline-variant/20"
                        />
                        <circle
                          cx="64"
                          cy="64"
                          r={radius}
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="8"
                          strokeLinecap="round"
                          strokeDasharray={circumference}
                          strokeDashoffset={dashOffset}
                          className="text-primary transition-all duration-500"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-2">
                        <span className="text-4xl sm:text-5xl font-serif font-bold text-primary leading-none tabular-nums">
                          {liveCountdown.daysUntil <= 0
                            ? '0'
                            : String(liveCountdown.daysUntil).padStart(2, '0')}
                        </span>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface mt-1">
                          {liveCountdown.daysUntil === 1 ? 'Day Until' : 'Days Until'}
                        </span>
                        <span className="text-[10px] text-outline">
                          {liveCountdown.isTonight ? 'Tonight!' : 'Date Night'}
                        </span>
                      </div>
                    </div>

                    {/* Live Segmented Ticker (Days · Hrs · Min · Sec) + Anticipation Meter */}
                    <div className="space-y-3 text-center sm:text-left">
                      <div>
                        <span className="text-[11px] font-semibold text-primary block">
                          {liveCountdown.isTonight
                            ? 'Happening Tonight'
                            : `${liveCountdown.daysUntil} ${
                                liveCountdown.daysUntil === 1 ? 'Day' : 'Days'
                              } Until Your Next Date`}
                        </span>
                        <span className="text-xs text-outline">
                          {formatDateShort(activeSpotlightEvent.date)}
                          {activeSpotlightEvent.time ? ` at ${activeSpotlightEvent.time}` : ' · 19:00'}
                        </span>
                      </div>

                      {/* 4-Cell Tabular Monospace Live Ticker */}
                      <div
                        className="grid grid-cols-4 gap-1.5"
                        aria-label="Live time remaining until next date night"
                      >
                        {[
                          { value: liveCountdown.days, unit: 'DAYS' },
                          { value: liveCountdown.hours, unit: 'HRS' },
                          { value: liveCountdown.minutes, unit: 'MIN' },
                          { value: liveCountdown.seconds, unit: 'SEC' }
                        ].map(cell => (
                          <div
                            key={cell.unit}
                            className="bg-surface-container-low border border-outline-variant/20 rounded-xl px-2.5 py-1.5 text-center min-w-[50px]"
                          >
                            <span className="font-mono text-base sm:text-lg font-bold text-on-surface tabular-nums block leading-tight">
                              {String(cell.value).padStart(2, '0')}
                            </span>
                            <span className="text-[9px] font-semibold text-outline tracking-wider block">
                              {cell.unit}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Anticipation & Readiness Progress Bar */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px] text-outline tabular-nums">
                          <span>Date Night Readiness</span>
                          <span className="font-bold text-secondary">{readinessPct}% Ready</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-surface-container-highest overflow-hidden">
                          <div
                            className="h-full bg-secondary rounded-full transition-all duration-300"
                            style={{ width: `${readinessPct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Details & Actions Column */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-outline">
                        <span className="font-bold text-primary">Next Upcoming Event</span>
                        {activeSpotlightEvent.mood && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>{activeSpotlightEvent.mood} Vibe</span>
                          </>
                        )}
                        {checklist.length > 0 && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="tabular-nums">
                              {checklistDone}/{checklist.length} Prep Tasks Done
                            </span>
                          </>
                        )}
                      </div>

                      <h3 className="text-2xl sm:text-3xl font-serif font-bold text-on-surface leading-tight">
                        {isMysteryLocked
                          ? 'Mystery Date Night ✨ (Sealed)'
                          : activeSpotlightEvent.title}
                      </h3>

                      <p className="text-xs sm:text-sm text-primary/90 font-medium">
                        {liveCountdown.anticipationMessage}
                      </p>

                      {!isMysteryLocked && activeSpotlightEvent.description && (
                        <p className="text-xs sm:text-sm text-on-surface/75 max-w-2xl leading-relaxed line-clamp-2">
                          {activeSpotlightEvent.description}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-outline pt-1">
                        {activeSpotlightEvent.location && !isMysteryLocked && (
                          <span className="inline-flex items-center gap-1.5 text-on-surface/90">
                            <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                            <span>{activeSpotlightEvent.location}</span>
                          </span>
                        )}
                        {activeSpotlightEvent.dressCode && !isMysteryLocked && (
                          <span className="inline-flex items-center gap-1.5">
                            <Shirt className="w-3.5 h-3.5 text-secondary shrink-0" />
                            <span>Dress Code: {activeSpotlightEvent.dressCode}</span>
                          </span>
                        )}
                        {activeSpotlightEvent.estimatedBudget !== undefined &&
                          activeSpotlightEvent.estimatedBudget > 0 && (
                            <span className="inline-flex items-center gap-1.5 tabular-nums font-semibold text-primary">
                              <Wallet className="w-3.5 h-3.5 shrink-0" />
                              <span>Budget: ~{formatRand(activeSpotlightEvent.estimatedBudget)}</span>
                            </span>
                          )}
                        {linkedGoal && (
                          <span className="inline-flex items-center gap-1.5 tabular-nums">
                            <PiggyBank className="w-3.5 h-3.5 text-secondary shrink-0" />
                            <span>
                              Goal: {linkedGoal.name} ({goalPct}%)
                            </span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Spotlight Actions */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {isMysteryLocked ? (
                        <button
                          type="button"
                          onClick={() => onRevealMysteryEvent(activeSpotlightEvent)}
                          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                        >
                          <Unlock className="w-3.5 h-3.5" />
                          <span>Scratch & Reveal</span>
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              hapticSuccess();
                              onShareEventToChat(activeSpotlightEvent);
                            }}
                            className="px-3.5 py-2 rounded-xl bg-primary text-on-primary-fixed text-xs font-bold flex items-center gap-1.5 hover:opacity-95 transition-opacity cursor-pointer whitespace-nowrap"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>Share Countdown to Chat</span>
                          </button>

                          {activeSpotlightEvent.location && (
                            <button
                              type="button"
                              onClick={() => {
                                hapticLight();
                                onViewEventOnMap(activeSpotlightEvent);
                              }}
                              className="px-3.5 py-2 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface border border-outline-variant/20 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                            >
                              <MapPin className="w-3.5 h-3.5 text-primary" />
                              <span>View on Map</span>
                            </button>
                          )}

                          <a
                            href={buildGoogleCalendarUrl(activeSpotlightEvent)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3.5 py-2 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface border border-outline-variant/20 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                          >
                            <CalendarIcon className="w-3.5 h-3.5 text-secondary" />
                            <span>Google Calendar</span>
                          </a>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* Search, Status Filter, View Mode & Sort Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-surface-container-low p-3 rounded-2xl border border-outline-variant/15">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-outline absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search planned dates by venue, suburb (e.g. Benoni, Boksburg), dress code, or tag..."
            className="w-full bg-surface-container border border-outline-variant/20 focus:border-primary rounded-xl pl-9 pr-8 py-2 text-xs sm:text-sm text-on-surface outline-none transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface cursor-pointer"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Segmented Status Filter */}
        <div className="flex items-center gap-1 bg-surface-container p-1 rounded-xl border border-outline-variant/15 overflow-x-auto no-scrollbar">
          {(
            [
              { id: 'all', label: `All (${events.length})` },
              { id: 'upcoming', label: `Upcoming (${plannerMetrics.upcomingCount})` },
              { id: 'completed', label: `Completed (${plannerMetrics.completedCount})` },
              { id: 'mystery', label: `Mystery (${plannerMetrics.mysteryCount})` }
            ] as Array<{ id: StatusTab; label: string }>
          ).map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                hapticLight();
                setStatusTab(tab.id);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                statusTab === tab.id
                  ? 'bg-primary text-on-primary-fixed shadow-2xs'
                  : 'text-outline hover:text-on-surface'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Sort & View Switcher */}
        <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
          {plannerMode !== 'calendar' && (
            <div className="flex items-center gap-1 bg-surface-container p-1 rounded-xl border border-outline-variant/15">
              {(['date', 'time', 'title'] as const).map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setPlannerSort(s)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    plannerSort === s
                      ? 'bg-surface-container-highest text-on-surface font-bold'
                      : 'text-outline hover:text-on-surface'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center gap-1 bg-surface-container p-1 rounded-xl border border-outline-variant/15">
            <button
              type="button"
              onClick={() => setPlannerMode('grid')}
              className={`p-2 rounded-lg transition-colors cursor-pointer ${
                plannerMode === 'grid'
                  ? 'bg-primary text-on-primary-fixed'
                  : 'text-outline hover:text-on-surface'
              }`}
              title="Grid View"
              aria-label="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setPlannerMode('list')}
              className={`p-2 rounded-lg transition-colors cursor-pointer ${
                plannerMode === 'list'
                  ? 'bg-primary text-on-primary-fixed'
                  : 'text-outline hover:text-on-surface'
              }`}
              title="Timeline List View"
              aria-label="Timeline List View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setPlannerMode('calendar')}
              className={`p-2 rounded-lg transition-colors cursor-pointer ${
                plannerMode === 'calendar'
                  ? 'bg-primary text-on-primary-fixed'
                  : 'text-outline hover:text-on-surface'
              }`}
              title="Monthly Calendar View"
              aria-label="Monthly Calendar View"
            >
              <CalendarIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Mood / Vibe Filter Bar */}
      {plannerMode !== 'calendar' && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          <button
            type="button"
            onClick={() => {
              hapticLight();
              setPlannerMoodFilter('all');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors border shrink-0 cursor-pointer ${
              plannerMoodFilter === 'all'
                ? 'bg-secondary text-on-secondary border-secondary'
                : 'bg-surface-container text-outline border-outline-variant/15 hover:text-on-surface'
            }`}
          >
            All Vibes ({events.length})
          </button>
          {DATE_MOODS.map(mood => {
            const count = events.filter(e => (e.mood || 'Romantic') === mood.id).length;
            const isSelected = plannerMoodFilter === mood.id;
            return (
              <button
                key={mood.id}
                type="button"
                onClick={() => {
                  hapticLight();
                  setPlannerMoodFilter(mood.id);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors border shrink-0 cursor-pointer ${
                  isSelected
                    ? `${mood.activeClass} font-bold`
                    : 'bg-surface-container text-outline border-outline-variant/15 hover:text-on-surface'
                }`}
              >
                <span>{mood.emoji}</span>
                <span>{mood.label}</span>
                {count > 0 && <span className="text-[11px] opacity-75 tabular-nums">({count})</span>}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => {
              hapticLight();
              const activeMood: DateMood =
                plannerMoodFilter !== 'all' ? plannerMoodFilter : 'Romantic';
              onOpenRomanticTips(activeMood);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-secondary bg-secondary/10 hover:bg-secondary/20 border border-secondary/25 transition-colors shrink-0 cursor-pointer ml-auto whitespace-nowrap"
          >
            <MessageCircleHeart className="w-3.5 h-3.5" />
            <span>
              {plannerMoodFilter !== 'all' ? `${plannerMoodFilter} Date Tips` : 'Connection Prompts'}
            </span>
          </button>
        </div>
      )}

      {/* Main Content Area: Calendar or Date Cards */}
      {plannerMode === 'calendar' ? (
        <CalendarComponent
          events={events}
          userId={currentUserUid}
          onAddEvent={date => onOpenNewEventModal(date)}
          onEditEvent={event => onEditEvent(event)}
        />
      ) : filteredAndSortedEvents.length > 0 ? (
        <div
          className={`grid gap-5 ${
            plannerMode === 'grid'
              ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'
              : 'grid-cols-1'
          }`}
        >
          {filteredAndSortedEvents.map(event => {
            const isMysteryLocked = Boolean(event.isMystery && !event.mysteryRevealed);
            const countdown = getCountdownLabel(event.date, event.time);
            const linkedGoal = event.goalId ? goals.find(g => g.id === event.goalId) : undefined;
            const myRsvp = (event.rsvps && event.rsvps[currentUserUid]) || 'Going';
            const checklist = event.checklist || [];
            const doneCount = checklist.filter(i => i.done).length;
            const isChecklistOpen = Boolean(expandedChecklistIds[event.id]);

            return (
              <div
                key={event.id}
                className={`bg-surface-container-low rounded-2xl p-5 sm:p-6 border flex flex-col justify-between gap-4 transition-colors ${
                  isMysteryLocked
                    ? 'border-amber-500/35'
                    : event.completed
                    ? 'border-secondary/30 opacity-85'
                    : 'border-outline-variant/15 hover:border-outline-variant/35'
                }`}
              >
                {/* Top Row: Date Block + Kicker + Quick Icon Actions */}
                <div className="space-y-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Calendar Date Tile */}
                      <div className="flex flex-col items-center justify-center bg-primary/10 rounded-xl px-3.5 py-2 border border-primary/20 shrink-0 min-w-[60px] tabular-nums">
                        <span className="text-[10px] font-bold uppercase text-primary">
                          {new Date(event.date).toLocaleDateString('en-ZA', { month: 'short' })}
                        </span>
                        <span className="text-2xl font-serif font-bold text-primary leading-none mt-0.5">
                          {new Date(event.date).toLocaleDateString('en-ZA', { day: 'numeric' })}
                        </span>
                      </div>

                      <div className="min-w-0 space-y-1">
                        {/* Unboxed Metadata Kicker */}
                        <div className="flex flex-wrap items-center gap-1.5 text-xs text-outline tabular-nums">
                          <span
                            className={
                              event.completed
                                ? 'text-secondary font-semibold'
                                : countdown.isUrgent
                                ? 'text-primary font-semibold'
                                : 'text-outline'
                            }
                          >
                            {event.completed ? 'Completed' : countdown.label}
                          </span>
                          {event.mood && (
                            <>
                              <span aria-hidden="true">·</span>
                              <button
                                type="button"
                                onClick={() => onOpenRomanticTips(event.mood as DateMood)}
                                className="hover:text-primary transition-colors cursor-pointer"
                                title={`View ${event.mood} relationship tips`}
                              >
                                <MoodBadge mood={event.mood} variant="compact" />
                              </button>
                            </>
                          )}
                        </div>

                        <h3
                          className={`text-xl font-serif font-bold leading-snug ${
                            event.completed ? 'line-through text-outline' : 'text-on-surface'
                          }`}
                        >
                          {isMysteryLocked ? 'Mystery Date Night ✨' : event.title}
                        </h3>
                      </div>
                    </div>

                    {/* Always-Visible Top-Right Action Controls */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => onToggleEventCompletion(event)}
                        className={`p-2 rounded-lg transition-colors cursor-pointer ${
                          event.completed
                            ? 'text-secondary bg-secondary/10'
                            : 'text-outline hover:text-secondary hover:bg-surface-container'
                        }`}
                        title={event.completed ? 'Mark as Upcoming' : 'Mark Date Completed'}
                        aria-label={event.completed ? 'Mark as Upcoming' : 'Mark Date Completed'}
                      >
                        {event.completed ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          <Circle className="w-4 h-4" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => onEditEvent(event)}
                        className="p-2 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
                        title="Edit Date Details"
                        aria-label="Edit Date Details"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onDeleteEvent(event.id)}
                        className="p-2 rounded-lg text-outline hover:text-error hover:bg-surface-container transition-colors cursor-pointer"
                        title="Delete Date"
                        aria-label="Delete Date"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Mystery Locked State vs Full Date Details */}
                  {isMysteryLocked ? (
                    <div className="p-3.5 bg-amber-500/10 rounded-xl border border-amber-500/25 space-y-2">
                      <p className="text-xs text-on-surface/90">
                        Details are sealed until reveal! Scratch off the card to see what your partner planned.
                      </p>
                      {event.mysteryClue && (
                        <p className="text-xs text-amber-400 font-semibold">
                          Clue: &ldquo;{event.mysteryClue}&rdquo;
                        </p>
                      )}
                      <button
                        type="button"
                        onClick={() => onRevealMysteryEvent(event)}
                        className="px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Unlock className="w-3.5 h-3.5" />
                        <span>Scratch & Reveal Date</span>
                      </button>
                    </div>
                  ) : (
                    <>
                      {event.description && (
                        <p className="text-xs sm:text-sm text-on-surface/75 leading-relaxed line-clamp-2">
                          {event.description}
                        </p>
                      )}

                      {/* Unboxed Metadata Details Row */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-outline">
                        {event.time && (
                          <span className="inline-flex items-center gap-1 tabular-nums text-on-surface/90">
                            <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
                            <span>{event.time}</span>
                          </span>
                        )}
                        {event.location && (
                          <button
                            type="button"
                            onClick={() => onViewEventOnMap(event)}
                            className="inline-flex items-center gap-1 text-on-surface/90 hover:text-primary transition-colors cursor-pointer text-left"
                            title="View venue on Google Date Map"
                          >
                            <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                            <span className="truncate max-w-[210px] underline decoration-dotted underline-offset-2">
                              {event.location}
                            </span>
                          </button>
                        )}
                        {event.estimatedBudget !== undefined && event.estimatedBudget > 0 && (
                          <span className="inline-flex items-center gap-1 font-semibold text-primary tabular-nums">
                            <Wallet className="w-3.5 h-3.5 shrink-0" />
                            <span>~{formatRand(event.estimatedBudget)}</span>
                          </span>
                        )}
                        {event.dressCode && (
                          <span className="inline-flex items-center gap-1">
                            <Shirt className="w-3.5 h-3.5 text-secondary shrink-0" />
                            <span>{event.dressCode}</span>
                          </span>
                        )}
                      </div>

                      {/* Tags as quiet unboxed text with separators */}
                      {event.tags && event.tags.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-outline">
                          {event.tags.map((tag, idx) => (
                            <React.Fragment key={tag}>
                              {idx > 0 && <span aria-hidden="true">·</span>}
                              <span>#{tag}</span>
                            </React.Fragment>
                          ))}
                        </div>
                      )}

                      {/* Optional Multi-Stop Date Itinerary Preview */}
                      {event.itinerary && event.itinerary.length > 0 && (
                        <div className="pt-2 border-t border-outline-variant/10 space-y-1">
                          <span className="text-[11px] font-semibold text-outline block">
                            Evening Flow
                          </span>
                          <div className="space-y-1">
                            {event.itinerary.map((stop, sIdx) => (
                              <div
                                key={sIdx}
                                className="flex items-baseline gap-2 text-xs text-on-surface/85"
                              >
                                <span className="font-mono text-[11px] text-primary font-semibold tabular-nums shrink-0">
                                  {stop.time}
                                </span>
                                <span className="truncate">{stop.activity}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Linked Savings Goal Bar */}
                      {linkedGoal && (
                        <div className="p-2.5 rounded-xl bg-surface-container border border-outline-variant/15 flex items-center justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-semibold text-on-surface truncate flex items-center gap-1">
                                <PiggyBank className="w-3.5 h-3.5 text-secondary shrink-0" />
                                <span className="truncate">{linkedGoal.name}</span>
                              </span>
                              <span className="text-[11px] font-bold text-secondary tabular-nums shrink-0 ml-2">
                                {formatRand(linkedGoal.currentAmount)} / {formatRand(linkedGoal.targetAmount)}
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => onSelectGoalForFunding(linkedGoal.id)}
                            className="px-2.5 py-1 rounded-lg bg-secondary/15 hover:bg-secondary text-secondary hover:text-on-secondary text-[11px] font-bold transition-colors cursor-pointer shrink-0 whitespace-nowrap"
                          >
                            + Fund
                          </button>
                        </div>
                      )}
                    </>
                  )}

                  {/* Scrapbook Memory Preview if Completed */}
                  {event.completed && (
                    <div className="p-3 rounded-xl bg-surface-container border border-outline-variant/15 flex items-center justify-between gap-3">
                      {event.memory ? (
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="inline-flex items-center text-amber-400 font-bold text-xs tabular-nums shrink-0">
                            <Star className="w-3.5 h-3.5 fill-amber-400 mr-0.5" />
                            {event.memory.rating}.0
                          </span>
                          <span className="text-xs text-on-surface/80 italic truncate font-serif">
                            &ldquo;{event.memory.recapNote || 'Cherished couple memory'}&rdquo;
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-outline italic">
                          Add a photo & star rating in your Scrapbook
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={onOpenScrapbook}
                        className="text-xs font-bold text-primary hover:underline flex items-center gap-1 shrink-0 cursor-pointer whitespace-nowrap"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>{event.memory ? 'View Memory' : '+ Log Memory'}</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Bottom Interactive Section: RSVP Toggle + Prep Checklist + Share/Map Footer */}
                <div className="space-y-3 pt-3 border-t border-outline-variant/10">
                  {/* Interactive RSVP Status Selector & Prep Checklist Toggle */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1 bg-surface-container p-1 rounded-lg border border-outline-variant/15">
                      {(['Going', 'Maybe', 'Not Going'] as const).map(status => {
                        const active = myRsvp === status;
                        return (
                          <button
                            key={status}
                            type="button"
                            onClick={() => {
                              hapticLight();
                              onUpdateEventRsvp(event, status);
                            }}
                            className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                              active
                                ? status === 'Going'
                                  ? 'bg-emerald-600 text-white'
                                  : status === 'Maybe'
                                  ? 'bg-amber-600 text-white'
                                  : 'bg-rose-600 text-white'
                                : 'text-outline hover:text-on-surface'
                            }`}
                          >
                            {status === 'Going' ? '🥂 Going' : status}
                          </button>
                        );
                      })}
                    </div>

                    {/* Prep Checklist Toggle Button */}
                    <button
                      type="button"
                      onClick={() => toggleChecklistExpand(event.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-colors cursor-pointer whitespace-nowrap ${
                        isChecklistOpen || checklist.length > 0
                          ? 'bg-surface-container text-on-surface border-outline-variant/25'
                          : 'text-outline hover:text-on-surface border-transparent'
                      }`}
                    >
                      <CheckSquare className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span className="tabular-nums">
                        {checklist.length > 0 ? `Prep (${doneCount}/${checklist.length})` : 'Prep List'}
                      </span>
                    </button>
                  </div>

                  {/* Expandable Interactive Couple Prep Checklist */}
                  <AnimatePresence>
                    {isChecklistOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.14 }}
                        className="p-3 rounded-xl bg-surface-container border border-outline-variant/15 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-on-surface">
                            Date Night Prep Checklist
                          </span>
                          {checklist.length === 0 && (
                            <button
                              type="button"
                              onClick={() => handleSeedDefaultChecklist(event)}
                              className="text-[11px] font-semibold text-primary hover:underline cursor-pointer"
                            >
                              + Load 3 Default Steps
                            </button>
                          )}
                        </div>

                        {checklist.length > 0 && (
                          <div className="space-y-1.5">
                            {checklist.map(item => (
                              <div
                                key={item.id}
                                className="flex items-center justify-between gap-2 text-xs group"
                              >
                                <button
                                  type="button"
                                  onClick={() => handleToggleChecklistItem(event, item.id)}
                                  className="flex items-center gap-2 text-left flex-1 min-w-0 cursor-pointer"
                                >
                                  {item.done ? (
                                    <CheckSquare className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                  ) : (
                                    <Square className="w-3.5 h-3.5 text-outline shrink-0" />
                                  )}
                                  <span
                                    className={`truncate ${
                                      item.done ? 'line-through text-outline' : 'text-on-surface'
                                    }`}
                                  >
                                    {item.text}
                                  </span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteChecklistItem(event, item.id)}
                                  className="text-outline hover:text-error p-0.5 opacity-70 hover:opacity-100 cursor-pointer"
                                  aria-label="Remove checklist item"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center gap-1.5 pt-1">
                          <input
                            type="text"
                            value={newChecklistInputByEvent[event.id] || ''}
                            onChange={e =>
                              setNewChecklistInputByEvent(prev => ({
                                ...prev,
                                [event.id]: e.target.value
                              }))
                            }
                            onKeyDown={e => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddChecklistItem(event);
                              }
                            }}
                            placeholder="Add prep task (e.g. Book table, buy flowers)..."
                            className="flex-1 bg-surface-container-low border border-outline-variant/20 rounded-lg px-2.5 py-1 text-xs text-on-surface outline-none focus:border-primary"
                          />
                          <button
                            type="button"
                            onClick={() => handleAddChecklistItem(event)}
                            className="px-2.5 py-1 rounded-lg bg-primary text-on-primary-fixed text-xs font-bold cursor-pointer shrink-0"
                          >
                            Add
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Action Links Footer: Share to Partner Chat, View on Map, Export .ics, Copy Code */}
                  <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        hapticSuccess();
                        onShareEventToChat(event);
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-primary/10 hover:bg-primary text-primary hover:text-on-primary-fixed text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                      title={`Share date invite with ${partnerName} in Partner Chat`}
                    >
                      <Send className="w-3 h-3 shrink-0" />
                      <span>Share to Chat</span>
                    </button>

                    <div className="flex items-center gap-1">
                      {!isMysteryLocked && event.location && (
                        <button
                          type="button"
                          onClick={() => {
                            hapticLight();
                            onViewEventOnMap(event);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap"
                          title="Locate on Google Date Map"
                        >
                          <MapPin className="w-3 h-3 text-primary shrink-0" />
                          <span>Map</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          hapticLight();
                          downloadEventIcs(event);
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap"
                        title="Download .ics Calendar Invite"
                      >
                        <Download className="w-3 h-3 text-secondary shrink-0" />
                        <span>.ics</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onCopyInviteCode(event.id)}
                        className="p-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-outline hover:text-on-surface transition-colors cursor-pointer"
                        title="Copy Date Invite Code"
                        aria-label="Copy Date Invite Code"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State with Quick Actions */
        <div className="py-16 px-6 text-center bg-surface-container-low rounded-2xl border border-dashed border-outline-variant/25 space-y-4">
          <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
            <CalendarIcon className="w-7 h-7 text-primary" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-xl font-serif font-bold text-on-surface">
              {searchQuery || statusTab !== 'all' || plannerMoodFilter !== 'all'
                ? 'No Matching Dates Found'
                : 'Your Couple Date Calendar is Open'}
            </h3>
            <p className="text-xs sm:text-sm text-outline leading-relaxed">
              {searchQuery || statusTab !== 'all' || plannerMoodFilter !== 'all'
                ? 'Try clearing your search filter or switching back to All Dates.'
                : 'Schedule a cozy sunset date in Benoni, a lakeside dinner in Boksburg, or pick a 1-tap Date Blueprint to start planning.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
            {searchQuery || statusTab !== 'all' || plannerMoodFilter !== 'all' ? (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setStatusTab('all');
                  setPlannerMoodFilter('all');
                }}
                className="px-4 py-2.5 rounded-xl bg-primary text-on-primary-fixed text-xs font-bold cursor-pointer"
              >
                Reset Filters
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => onOpenNewEventModal()}
                  className="px-5 py-2.5 rounded-xl bg-primary text-on-primary-fixed text-xs font-bold cursor-pointer shadow-xs"
                >
                  Schedule Your First Date
                </button>
                <button
                  type="button"
                  onClick={() => setShowBlueprints(true)}
                  className="px-4 py-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface border border-outline-variant/20 text-xs font-bold cursor-pointer"
                >
                  Browse Ekurhuleni Blueprints
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}
