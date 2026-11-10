import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  Send,
  Heart,
  Calendar,
  PiggyBank,
  UserPlus,
  CheckCheck,
  Smile,
  Trash2,
  MessageCircleHeart,
  ChevronRight,
  Sparkles,
  X,
  Search,
  Pin,
  Reply,
  ThumbsUp,
  MapPin,
  BarChart3,
  Star,
  Plus,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  PartnerMessage,
  PartnerMessageType,
  Goal,
  Event,
  SharedSpotPayload,
  DatePollPayload,
  DepositCelebrationPayload,
  MessageReplyReference,
  DateMood
} from '../../types';
import { formatRand, formatDateShort } from '../../utils/formatters';
import { hapticLight, hapticMedium, hapticSuccess } from '../../utils/haptics';
import { db, doc, setDoc, collection, query, where, onSnapshot } from '../../firebase';

export interface PartnerChatViewProps {
  currentUserUid: string;
  currentUserName: string;
  currentUserPhoto?: string;
  partnerUid?: string;
  partnerName?: string;
  partnerPhoto?: string;
  messages: PartnerMessage[];
  goals: Goal[];
  events: Event[];
  onSendMessage: (payload: {
    text: string;
    messageType: PartnerMessageType;
    linkedGoalId?: string;
    linkedGoalName?: string;
    linkedEventId?: string;
    linkedEventTitle?: string;
    linkedSpot?: SharedSpotPayload;
    pollData?: DatePollPayload;
    depositData?: DepositCelebrationPayload;
    replyTo?: MessageReplyReference;
  }) => Promise<void>;
  onToggleReaction: (messageId: string, emoji: string) => Promise<void>;
  onTogglePinMessage?: (messageId: string) => Promise<void>;
  onVoteSpot?: (messageId: string, vote: 'up' | 'down') => Promise<void>;
  onVotePoll?: (messageId: string, optionId: string) => Promise<void>;
  onRespondDateInvite?: (messageId: string, status: 'going' | 'reschedule', linkedEventId?: string) => Promise<void>;
  onDeleteMessage: (messageId: string) => Promise<void>;
  onOpenInviteModal: () => void;
  onSelectGoalForFunding?: (goalId: string) => void;
  onNavigateToPlanner?: () => void;
  onPlanDateFromSpot?: (spot: SharedSpotPayload) => void;
  onViewSpotOnMap?: (spot: SharedSpotPayload) => void;
  onClose?: () => void;
  compactMode?: boolean;
}

const QUICK_REACTIONS = ['❤️', '🥂', '🔥', '✨', '😍', '👍'];

const LOVE_NOTE_PROMPTS = [
  'Thinking about our next date night together ❤️',
  'So proud of how we are saving toward our dreams 🥂',
  'Thank you for being my favorite adventure partner ✨',
  'Let’s plan a cozy sunset dinner in Ekurhuleni this weekend 🌅'
];

const QUICK_POLL_PRESETS: Array<{ question: string; options: string[] }> = [
  {
    question: 'Which Ekurhuleni date vibe are you feeling this weekend?',
    options: [
      'Cozy Garden Café in Benoni ☕',
      'Lakeside Walk & Sunset in Boksburg 🌅',
      'Candlelit Dinner in Bedfordview / Brakpan 🍷'
    ]
  },
  {
    question: 'When should we schedule our next date night?',
    options: ['Friday Evening (19:00)', 'Saturday Sunset (17:30)', 'Sunday Brunch (10:30)']
  }
];

// Maximum age (ms) for a remote typing status to be considered active
const TYPING_EXPIRY_MS = 8000;
// Idle timeout (ms) before local typing status automatically resets to false
const LOCAL_TYPING_IDLE_MS = 2500;
// Minimum interval (ms) between consecutive Firestore typing writes while actively typing
const TYPING_THROTTLE_MS = 2000;

type ChatFilterType = 'all' | 'spot_share' | 'date_poll' | 'date_invite' | 'goal_nudge' | 'love_note' | 'pinned';

function formatTimelineDateGroup(iso: string): string {
  try {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return 'Recent';
    const now = new Date();
    const todayStr = now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);

    if (date.toDateString() === todayStr) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString('en-ZA', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  } catch {
    return 'Recent';
  }
}

export default function PartnerChatView({
  currentUserUid,
  currentUserName,
  partnerUid,
  partnerName = 'Your Partner',
  partnerPhoto,
  messages,
  goals,
  events,
  onSendMessage,
  onToggleReaction,
  onTogglePinMessage,
  onVoteSpot,
  onVotePoll,
  onRespondDateInvite,
  onDeleteMessage,
  onOpenInviteModal,
  onSelectGoalForFunding,
  onNavigateToPlanner,
  onPlanDateFromSpot,
  onViewSpotOnMap,
  onClose,
  compactMode = false
}: PartnerChatViewProps) {
  const [text, setText] = useState('');
  const [selectedMode, setSelectedMode] = useState<PartnerMessageType>('text');
  const [selectedGoalId, setSelectedGoalId] = useState<string>('');
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [activeReactionPickerId, setActiveReactionPickerId] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [partnerAvatarBroken, setPartnerAvatarBroken] = useState(false);

  // Partner Chat 2.0 States: Search, Filter, Reply Quoting, Poll Creator, Highlighted Message
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<ChatFilterType>('all');
  const [replyingTo, setReplyingTo] = useState<PartnerMessage | null>(null);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
  const [isPollCreatorOpen, setIsPollCreatorOpen] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('Where should we go for our next date night?');
  const [pollOptions, setPollOptions] = useState<string[]>([
    'Cozy Café & Pastry Date ☕',
    'Sunset Lakeside Walk & Picnic 🌅',
    'Romantic Candlelit Dinner 🍷'
  ]);

  // Real-time Partner Typing Status state
  const [remotePartnerTyping, setRemotePartnerTyping] = useState<{
    isTyping: boolean;
    userName: string;
    updatedAt: number;
  } | null>(null);
  const [demoPartnerTyping, setDemoPartnerTyping] = useState(false);
  const [nowTick, setNowTick] = useState(() => Date.now());

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messageRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const localTypingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingWriteRef = useRef<number>(0);
  const isCurrentlyBroadcastingTypingRef = useRef<boolean>(false);

  const isDemoSession = currentUserUid === 'demo_guest_user' || !currentUserUid;

  useEffect(() => {
    setPartnerAvatarBroken(false);
  }, [partnerPhoto]);

  // Detect if partner is connected via profile partnerUid or shared goal/event collaborators
  const resolvedPartnerUid = useMemo(() => {
    if (partnerUid && partnerUid !== currentUserUid) return partnerUid;
    for (const g of goals) {
      const other = g.collaborators?.find(uid => uid !== currentUserUid);
      if (other) return other;
    }
    for (const e of events) {
      const other = e.collaborators?.find(uid => uid !== currentUserUid);
      if (other) return other;
    }
    for (const m of messages) {
      const other = m.participants?.find(uid => uid !== currentUserUid);
      if (other) return other;
    }
    return undefined;
  }, [partnerUid, goals, events, messages, currentUserUid]);

  // Periodic 1-second tick to auto-expire stale remote typing indicators
  useEffect(() => {
    if (!remotePartnerTyping?.isTyping) return;
    const interval = setInterval(() => {
      setNowTick(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [remotePartnerTyping?.isTyping]);

  // Listen to Partner's real-time typing status in Firestore (`typingStatus` collection)
  useEffect(() => {
    if (!currentUserUid || isDemoSession) {
      setRemotePartnerTyping(null);
      return;
    }

    const typingQuery = query(
      collection(db, 'typingStatus'),
      where('partnerUid', '==', currentUserUid)
    );

    const unsubscribe = onSnapshot(
      typingQuery,
      snapshot => {
        let activeTypingDoc: { isTyping: boolean; userName: string; updatedAt: number } | null = null;

        snapshot.docs.forEach(docSnap => {
          const data = docSnap.data();
          if (data && data.uid !== currentUserUid && data.isTyping) {
            const parsedTime = data.updatedAt ? new Date(data.updatedAt).getTime() : 0;
            if (!Number.isNaN(parsedTime) && Date.now() - parsedTime < TYPING_EXPIRY_MS) {
              activeTypingDoc = {
                isTyping: true,
                userName: data.userName || partnerName,
                updatedAt: parsedTime
              };
            }
          }
        });

        setRemotePartnerTyping(activeTypingDoc);
        setNowTick(Date.now());
      },
      () => {
        // Ignore permission or offline notices gracefully
      }
    );

    return () => {
      unsubscribe();
    };
  }, [currentUserUid, isDemoSession, partnerName]);

  // Compute whether partner is actively typing right now
  const isPartnerTyping = useMemo(() => {
    if (demoPartnerTyping) return true;
    if (!remotePartnerTyping?.isTyping) return false;
    return nowTick - remotePartnerTyping.updatedAt < TYPING_EXPIRY_MS;
  }, [demoPartnerTyping, remotePartnerTyping, nowTick]);

  const activeTypingPartnerName = useMemo(() => {
    if (demoPartnerTyping) return partnerName === 'Your Partner' ? 'Alex (Partner)' : partnerName;
    return remotePartnerTyping?.userName || partnerName;
  }, [demoPartnerTyping, remotePartnerTyping, partnerName]);

  // Broadcast current user's typing status to Firestore (throttled + auto-cleared)
  const broadcastTypingStatus = useCallback(
    async (typing: boolean) => {
      if (!currentUserUid || isDemoSession || !resolvedPartnerUid) return;

      const now = Date.now();
      if (
        typing &&
        isCurrentlyBroadcastingTypingRef.current &&
        now - lastTypingWriteRef.current < TYPING_THROTTLE_MS
      ) {
        return;
      }

      isCurrentlyBroadcastingTypingRef.current = typing;
      lastTypingWriteRef.current = now;

      try {
        await setDoc(doc(db, 'typingStatus', currentUserUid), {
          uid: currentUserUid,
          userName: (currentUserName || 'Partner').slice(0, 100),
          partnerUid: resolvedPartnerUid.slice(0, 128),
          isTyping: typing,
          updatedAt: new Date().toISOString()
        });
      } catch {
        // Silent ignore if offline or unlinked
      }
    },
    [currentUserUid, currentUserName, isDemoSession, resolvedPartnerUid]
  );

  // Clean up local typing timer and reset typing state on unmount
  useEffect(() => {
    return () => {
      if (localTypingTimeoutRef.current) {
        clearTimeout(localTypingTimeoutRef.current);
      }
      if (isCurrentlyBroadcastingTypingRef.current) {
        broadcastTypingStatus(false);
      }
    };
  }, [broadcastTypingStatus]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, isPartnerTyping]);

  // Pinned messages
  const pinnedMessages = useMemo(
    () => messages.filter(m => m.isPinned),
    [messages]
  );
  const latestPinnedMessage = pinnedMessages.length > 0 ? pinnedMessages[pinnedMessages.length - 1] : null;

  // Filtered messages based on search query & active filter
  const filteredMessages = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return messages.filter(msg => {
      if (activeFilter === 'pinned' && !msg.isPinned) return false;
      if (activeFilter !== 'all' && activeFilter !== 'pinned' && msg.messageType !== activeFilter) {
        return false;
      }
      if (!q) return true;
      const haystack = [
        msg.text,
        msg.senderName,
        msg.linkedGoalName,
        msg.linkedEventTitle,
        msg.linkedSpot?.name,
        msg.linkedSpot?.location,
        msg.linkedSpot?.category,
        msg.pollData?.question,
        ...(msg.pollData?.options.map(o => o.label) || []),
        msg.depositData?.goalName
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [messages, searchQuery, activeFilter]);

  // Group filtered messages by calendar day for Date-Grouped Timeline
  const groupedMessages = useMemo(() => {
    const groups: Array<{ dateLabel: string; items: PartnerMessage[] }> = [];
    for (const msg of filteredMessages) {
      const label = formatTimelineDateGroup(msg.createdAt);
      const lastGroup = groups[groups.length - 1];
      if (!lastGroup || lastGroup.dateLabel !== label) {
        groups.push({ dateLabel: label, items: [msg] });
      } else {
        lastGroup.items.push(msg);
      }
    }
    return groups;
  }, [filteredMessages]);

  const scrollToMessage = (messageId: string) => {
    const el = messageRefs.current[messageId];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightedMessageId(messageId);
      setTimeout(() => {
        setHighlightedMessageId(prev => (prev === messageId ? null : prev));
      }, 2200);
    }
  };

  const handleInputChange = (value: string) => {
    setText(value);

    if (localTypingTimeoutRef.current) {
      clearTimeout(localTypingTimeoutRef.current);
    }

    if (value.trim().length > 0) {
      broadcastTypingStatus(true);
      localTypingTimeoutRef.current = setTimeout(() => {
        broadcastTypingStatus(false);
      }, LOCAL_TYPING_IDLE_MS);
    } else {
      broadcastTypingStatus(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || isSending) return;

    if (localTypingTimeoutRef.current) {
      clearTimeout(localTypingTimeoutRef.current);
      localTypingTimeoutRef.current = null;
    }
    broadcastTypingStatus(false);

    const linkedGoal = selectedGoalId ? goals.find(g => g.id === selectedGoalId) : undefined;
    const linkedEvent = selectedEventId ? events.find(ev => ev.id === selectedEventId) : undefined;
    const replyPayload: MessageReplyReference | undefined = replyingTo
      ? {
          messageId: replyingTo.id,
          senderName: replyingTo.senderUid === currentUserUid ? 'You' : replyingTo.senderName,
          previewText: (replyingTo.linkedSpot?.name || replyingTo.pollData?.question || replyingTo.text).slice(0, 120),
          messageType: replyingTo.messageType
        }
      : undefined;

    setIsSending(true);
    hapticMedium();
    try {
      await onSendMessage({
        text: trimmed,
        messageType: selectedMode,
        linkedGoalId: linkedGoal?.id,
        linkedGoalName: linkedGoal?.name,
        linkedEventId: linkedEvent?.id,
        linkedEventTitle: linkedEvent?.title,
        replyTo: replyPayload
      });
      setText('');
      setSelectedMode('text');
      setSelectedGoalId('');
      setSelectedEventId('');
      setReplyingTo(null);
    } finally {
      setIsSending(false);
    }
  };

  const handleSendDatePoll = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanQuestion = pollQuestion.trim();
    const validOptions = pollOptions.map(o => o.trim()).filter(Boolean);
    if (!cleanQuestion || validOptions.length < 2 || isSending) return;

    setIsSending(true);
    hapticSuccess();
    try {
      const pollPayload: DatePollPayload = {
        question: cleanQuestion.slice(0, 200),
        options: validOptions.slice(0, 4).map((label, idx) => ({
          id: `opt_${idx + 1}`,
          label: label.slice(0, 120)
        }))
      };
      await onSendMessage({
        text: `📊 Date Poll: ${cleanQuestion}`,
        messageType: 'date_poll',
        pollData: pollPayload,
        replyTo: replyingTo
          ? {
              messageId: replyingTo.id,
              senderName: replyingTo.senderUid === currentUserUid ? 'You' : replyingTo.senderName,
              previewText: replyingTo.text.slice(0, 120),
              messageType: replyingTo.messageType
            }
          : undefined
      });
      setIsPollCreatorOpen(false);
      setReplyingTo(null);
    } finally {
      setIsSending(false);
    }
  };

  const handleSelectQuickLoveNote = (promptText: string) => {
    hapticLight();
    setSelectedMode('love_note');
    handleInputChange(promptText);
    inputRef.current?.focus();
  };

  const handleSelectGoalShare = (goal: Goal) => {
    hapticLight();
    setSelectedMode('goal_nudge');
    setSelectedGoalId(goal.id);
    const pct = goal.targetAmount > 0 ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100)) : 0;
    handleInputChange(
      `Let's add to our "${goal.name}" fund! We're at ${pct}% (${formatRand(goal.currentAmount)} of ${formatRand(goal.targetAmount)}).`
    );
    inputRef.current?.focus();
  };

  const handleSelectEventShare = (ev: Event) => {
    hapticLight();
    setSelectedMode('date_invite');
    setSelectedEventId(ev.id);
    handleInputChange(
      `Can't wait for our "${ev.title}" date on ${formatDateShort(ev.date)}${ev.time ? ` at ${ev.time}` : ''}${ev.location ? ` · ${ev.location}` : ''}!`
    );
    inputRef.current?.focus();
  };

  const formatTime = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const renderPartnerAvatar = (sizeClass = 'w-10 h-10', textClass = 'text-base') => {
    if (partnerPhoto && !partnerAvatarBroken) {
      return (
        <img
          src={partnerPhoto}
          alt={partnerName}
          onError={() => setPartnerAvatarBroken(true)}
          className={`${sizeClass} rounded-full object-cover border border-primary/30 shrink-0`}
          referrerPolicy="no-referrer"
        />
      );
    }
    return (
      <div
        className={`${sizeClass} rounded-full bg-primary/15 text-primary flex items-center justify-center font-serif font-bold ${textClass} border border-primary/30 shrink-0`}
      >
        {partnerName.charAt(0).toUpperCase()}
      </div>
    );
  };

  return (
    <div
      className={`flex flex-col bg-surface-container/95 backdrop-blur-xl rounded-2xl border border-outline-variant/20 shadow-xl overflow-hidden ${
        compactMode
          ? 'h-[min(500px,calc(100dvh-8.5rem-env(safe-area-inset-bottom,0px)))] sm:h-[min(540px,calc(100dvh-9rem))] lg:h-[min(580px,calc(100dvh-7rem))] min-h-[290px]'
          : 'h-[calc(100dvh-12.5rem-env(safe-area-inset-bottom,0px))] sm:h-[calc(100dvh-11.5rem)] lg:h-[min(740px,calc(100dvh-9rem))] min-h-[420px]'
      }`}
    >
      {/* Partner Messenger Header */}
      <div className="px-3.5 sm:px-5 py-2.5 sm:py-3 bg-surface-container-high/90 backdrop-blur-md border-b border-outline-variant/15 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
          <div className="relative shrink-0">
            {renderPartnerAvatar(
              compactMode ? 'w-8 h-8 sm:w-9 sm:h-9' : 'w-9 h-9 sm:w-10 sm:h-10',
              compactMode ? 'text-xs sm:text-sm' : 'text-sm sm:text-base'
            )}
            <span
              className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-surface-container transition-colors ${
                isPartnerTyping
                  ? 'bg-emerald-400'
                  : resolvedPartnerUid
                  ? 'bg-emerald-500'
                  : 'bg-amber-400'
              }`}
              title={
                isPartnerTyping
                  ? `${activeTypingPartnerName} is typing...`
                  : resolvedPartnerUid
                  ? 'Partner Linked'
                  : 'Invite Partner to Sync'
              }
            />
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="font-serif font-bold text-sm sm:text-base text-on-surface truncate">
              {compactMode ? partnerName : `${partnerName} & ${currentUserName || 'You'}`}
            </h3>

            {/* Live Header Subtitle / Real-Time Typing Indicator */}
            <AnimatePresence mode="wait">
              {isPartnerTyping ? (
                <motion.div
                  key="typing-header"
                  initial={{ opacity: 0, y: 2 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -2 }}
                  className="flex items-center gap-1.5 text-[11px] font-semibold text-primary truncate"
                  aria-live="polite"
                >
                  <span className="inline-flex items-center gap-0.5 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" />
                  </span>
                  <span className="truncate">{activeTypingPartnerName} is typing...</span>
                </motion.div>
              ) : (
                <motion.p
                  key="status-header"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-[11px] text-outline truncate"
                >
                  {resolvedPartnerUid
                    ? 'Synced · Share spots, date polls, goals & love notes'
                    : 'Invite your partner via QR to sync messages across devices'}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Search & Filter Toggle Button */}
          <button
            type="button"
            onClick={() => {
              hapticLight();
              setIsSearchOpen(prev => !prev);
            }}
            className={`min-h-[36px] min-w-[36px] p-1.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer shrink-0 ${
              isSearchOpen || searchQuery || activeFilter !== 'all'
                ? 'bg-primary text-on-primary-fixed border-primary shadow-xs'
                : 'bg-surface-container text-outline hover:text-on-surface border-outline-variant/25'
            }`}
            title="Search & filter messages"
            aria-label="Search and filter messages"
          >
            <Search className="w-3.5 h-3.5" />
          </button>

          {isDemoSession && (
            <button
              type="button"
              onClick={() => {
                hapticLight();
                setDemoPartnerTyping(prev => !prev);
              }}
              className={`min-h-[36px] px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                demoPartnerTyping
                  ? 'bg-primary text-on-primary-fixed border-primary shadow-xs'
                  : 'bg-surface-container text-outline hover:text-on-surface border-outline-variant/25'
              }`}
              title="Preview real-time partner typing indicator"
            >
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span className={compactMode ? 'hidden' : 'hidden sm:inline'}>
                {demoPartnerTyping ? 'Stop Typing' : 'Preview Typing'}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              hapticLight();
              onOpenInviteModal();
            }}
            className="min-h-[36px] px-2.5 py-1.5 rounded-xl bg-surface-container-highest hover:bg-primary/15 text-primary border border-outline-variant/25 text-xs font-bold flex items-center justify-center gap-1.5 shrink-0 transition-colors cursor-pointer whitespace-nowrap"
            title={resolvedPartnerUid ? 'Partner Synced' : 'Link Partner'}
          >
            <UserPlus className="w-3.5 h-3.5 shrink-0" />
            <span className={compactMode ? 'hidden' : 'hidden sm:inline'}>
              {resolvedPartnerUid ? 'Synced' : 'Link Partner'}
            </span>
          </button>

          {onClose && (
            <button
              type="button"
              onClick={() => {
                hapticLight();
                onClose();
              }}
              className="min-h-[36px] min-w-[36px] p-1.5 rounded-xl bg-surface-container hover:bg-surface-container-highest text-outline hover:text-on-surface border border-outline-variant/20 transition-colors cursor-pointer flex items-center justify-center shrink-0"
              title="Close chat"
              aria-label="Close chat"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Expandable Search & Category Filter Bar */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-3.5 sm:px-5 py-2.5 bg-surface-container border-b border-outline-variant/15 space-y-2 overflow-hidden shrink-0"
          >
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 text-outline absolute left-3 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search messages, shared Ekurhuleni spots, polls, or goals..."
                className="w-full bg-surface-container-high border border-outline-variant/25 focus:border-primary rounded-xl pl-8 pr-8 py-1.5 text-xs text-on-surface outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 text-outline hover:text-on-surface cursor-pointer"
                  aria-label="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {(
                [
                  { id: 'all', label: 'All' },
                  { id: 'spot_share', label: '📍 Date Spots' },
                  { id: 'date_poll', label: '📊 Polls' },
                  { id: 'date_invite', label: '📅 Invites' },
                  { id: 'goal_nudge', label: '🐷 Goals' },
                  { id: 'love_note', label: '❤️ Love Notes' },
                  { id: 'pinned', label: `📌 Pinned (${pinnedMessages.length})` }
                ] as Array<{ id: ChatFilterType; label: string }>
              ).map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    hapticLight();
                    setActiveFilter(tab.id);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-colors cursor-pointer shrink-0 border ${
                    activeFilter === tab.id
                      ? 'bg-primary text-on-primary-fixed border-primary'
                      : 'bg-surface-container-high text-outline hover:text-on-surface border-outline-variant/15'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pinned Couple Reminder Banner */}
      <AnimatePresence>
        {latestPinnedMessage && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-3.5 sm:px-5 py-2 bg-amber-500/10 border-b border-amber-500/20 flex items-center justify-between gap-2 shrink-0"
          >
            <button
              type="button"
              onClick={() => scrollToMessage(latestPinnedMessage.id)}
              className="flex items-center gap-2 min-w-0 flex-1 text-left cursor-pointer group"
            >
              <Pin className="w-3.5 h-3.5 text-amber-500 shrink-0 rotate-45" />
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500 block">
                  Pinned Couple Reminder ({pinnedMessages.length})
                </span>
                <p className="text-xs text-on-surface truncate group-hover:text-primary transition-colors">
                  {latestPinnedMessage.linkedSpot?.name
                    ? `📍 ${latestPinnedMessage.linkedSpot.name} — ${latestPinnedMessage.text}`
                    : latestPinnedMessage.text}
                </p>
              </div>
            </button>
            {onTogglePinMessage && (
              <button
                type="button"
                onClick={() => {
                  hapticLight();
                  onTogglePinMessage(latestPinnedMessage.id);
                }}
                className="p-1 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer shrink-0"
                title="Unpin reminder"
                aria-label="Unpin reminder"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages Stream (Date-Grouped Timeline) */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-4 bg-surface-container-low/50">
        {filteredMessages.length === 0 && !isPartnerTyping ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4 sm:p-6 max-w-md mx-auto space-y-3.5">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-xs">
              <MessageCircleHeart className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <div className="space-y-1">
              <h4 className="font-serif text-base sm:text-lg font-bold text-on-surface">
                {searchQuery || activeFilter !== 'all'
                  ? 'No Matching Messages Found'
                  : 'Start Your Couple Conversation'}
              </h4>
              <p className="text-xs text-outline leading-relaxed">
                {searchQuery || activeFilter !== 'all'
                  ? 'Try clearing your search filter or switching back to All messages.'
                  : 'Share a cozy date spot from Discover, launch a Friday night Date Poll, send a love note, or celebrate a shared savings goal.'}
              </p>
            </div>
            {searchQuery || activeFilter !== 'all' ? (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setActiveFilter('all');
                }}
                className="text-xs px-3.5 py-1.5 rounded-xl bg-primary text-on-primary-fixed font-bold cursor-pointer"
              >
                Reset Filters
              </button>
            ) : (
              <div className="flex flex-wrap justify-center gap-1.5 pt-1">
                {LOVE_NOTE_PROMPTS.map(prompt => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => handleSelectQuickLoveNote(prompt)}
                    className="text-xs px-3 py-1.5 rounded-xl bg-surface-container-high hover:bg-primary/10 hover:text-primary text-on-surface border border-outline-variant/20 transition-colors cursor-pointer"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          groupedMessages.map(group => (
            <div key={group.dateLabel} className="space-y-3">
              {/* Date Group Header */}
              <div className="flex items-center justify-center my-1">
                <span className="px-3 py-0.5 rounded-full bg-surface-container-highest/80 border border-outline-variant/15 text-[10px] font-semibold uppercase tracking-wider text-outline shadow-2xs">
                  {group.dateLabel}
                </span>
              </div>

              {group.items.map(msg => {
                const isMine = msg.senderUid === currentUserUid;
                const reactionEntries = Object.entries(msg.reactions || {}) as [string, string][];
                const isLoveNote = msg.messageType === 'love_note';
                const isGoalNudge = msg.messageType === 'goal_nudge';
                const isDateInvite = msg.messageType === 'date_invite';
                const isSpotShare = msg.messageType === 'spot_share' && Boolean(msg.linkedSpot);
                const isDatePoll = msg.messageType === 'date_poll' && Boolean(msg.pollData);
                const isDepositCelebration =
                  msg.messageType === 'deposit_celebration' && Boolean(msg.depositData);
                const isHighlighted = highlightedMessageId === msg.id;

                // Read receipt check: read by partner if readBy contains another UID or if demo mode on older messages
                const isReadByPartner = Boolean(
                  (msg.readBy && msg.readBy.some(uid => uid !== currentUserUid)) ||
                    (isDemoSession && isMine)
                );

                // Spot votes
                const spotVotesMap = msg.spotVotes || {};
                const mySpotVote = spotVotesMap[currentUserUid];
                const upVoteCount = Object.values(spotVotesMap).filter(v => v === 'up').length;

                // RSVP status on date_invite
                const rsvpMap = msg.rsvpStatus || {};
                const myRsvp = rsvpMap[currentUserUid];
                const goingCount = Object.values(rsvpMap).filter(v => v === 'going').length;

                return (
                  <motion.div
                    key={msg.id}
                    ref={el => {
                      messageRefs.current[msg.id] = el;
                    }}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} ${
                      isHighlighted ? 'ring-2 ring-primary/60 rounded-2xl p-1 transition-all' : ''
                    }`}
                  >
                    <div
                      className={`flex items-end gap-2 max-w-[94%] sm:max-w-[82%] lg:max-w-[75%] ${
                        isMine ? 'flex-row-reverse' : 'flex-row'
                      }`}
                    >
                      {/* Partner Avatar on incoming messages */}
                      {!isMine && renderPartnerAvatar('w-7 h-7', 'text-xs')}

                      {/* Message Bubble */}
                      <div
                        className={`relative w-fit max-w-full rounded-2xl px-3.5 py-2.5 shadow-xs border backdrop-blur-xs transition-all ${
                          isLoveNote
                            ? `bg-gradient-to-br from-rose-500/15 via-surface-container-high/90 to-amber-500/10 border-rose-400/35 text-on-surface ${
                                isMine ? 'rounded-br-sm' : 'rounded-bl-sm'
                              }`
                            : isDepositCelebration
                            ? `bg-gradient-to-br from-emerald-500/15 via-surface-container-high/95 to-amber-500/15 border-emerald-500/35 text-on-surface ${
                                isMine ? 'rounded-br-sm' : 'rounded-bl-sm'
                              }`
                            : isMine
                            ? 'bg-primary/90 text-on-primary-fixed border-primary/30 rounded-br-sm'
                            : 'bg-surface-container-high/90 text-on-surface border-outline-variant/25 rounded-bl-sm'
                        }`}
                      >
                        {/* Pinned Indicator Badge */}
                        {msg.isPinned && (
                          <div
                            className={`flex items-center gap-1 text-[10px] font-bold mb-1 ${
                              isMine && !isLoveNote && !isDepositCelebration
                                ? 'text-amber-200'
                                : 'text-amber-500'
                            }`}
                          >
                            <Pin className="w-3 h-3 rotate-45" />
                            <span>Pinned Reminder</span>
                          </div>
                        )}

                        {/* Quoted Reply Header */}
                        {msg.replyTo && (
                          <button
                            type="button"
                            onClick={() => scrollToMessage(msg.replyTo!.messageId)}
                            className={`w-full text-left mb-2 px-2.5 py-1.5 rounded-xl border-l-3 text-[11px] transition-opacity hover:opacity-90 cursor-pointer ${
                              isMine && !isLoveNote && !isDepositCelebration
                                ? 'bg-black/20 border-white/60 text-on-primary-fixed/90'
                                : 'bg-surface-container/90 border-primary text-on-surface/80'
                            }`}
                          >
                            <span className="font-bold block truncate">{msg.replyTo.senderName}</span>
                            <span className="line-clamp-1 opacity-85">{msg.replyTo.previewText}</span>
                          </button>
                        )}

                        {/* Header Kicker for Love Note */}
                        {isLoveNote && (
                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-rose-500 mb-1">
                            <Heart className="w-3.5 h-3.5 fill-current shrink-0" />
                            <span>Love Note</span>
                          </div>
                        )}

                        {/* 1. SHARED DISCOVER / MAP DATE SPOT CARD (spot_share) */}
                        {isSpotShare && msg.linkedSpot && (
                          <div
                            className={`rounded-xl overflow-hidden mb-2 border ${
                              isMine && !isLoveNote
                                ? 'bg-surface-container-high text-on-surface border-white/15'
                                : 'bg-surface-container text-on-surface border-outline-variant/20'
                            }`}
                          >
                            {msg.linkedSpot.photoUrl && (
                              <div className="h-32 w-full relative overflow-hidden bg-surface-container-highest">
                                <img
                                  src={msg.linkedSpot.photoUrl}
                                  alt={msg.linkedSpot.name}
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                  loading="lazy"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                                <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between text-white text-[11px]">
                                  <span className="font-semibold truncate">
                                    {msg.linkedSpot.category}
                                    {msg.linkedSpot.province ? ` · ${msg.linkedSpot.province}` : ''}
                                  </span>
                                  {msg.linkedSpot.rating && (
                                    <span className="inline-flex items-center gap-1 font-bold text-amber-300 shrink-0">
                                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                      {msg.linkedSpot.rating.toFixed(1)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}

                            <div className="p-3 space-y-2">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary block">
                                    Shared Date Spot
                                  </span>
                                  <h4 className="font-serif font-bold text-sm text-on-surface leading-snug">
                                    {msg.linkedSpot.name}
                                  </h4>
                                  <p className="text-[11px] text-outline flex items-center gap-1 mt-0.5">
                                    <MapPin className="w-3 h-3 text-primary shrink-0" />
                                    <span className="truncate">{msg.linkedSpot.location}</span>
                                  </p>
                                </div>
                                {msg.linkedSpot.estimatedBudget && (
                                  <span className="font-serif font-bold text-xs text-primary shrink-0 tabular-nums bg-primary/10 px-2 py-1 rounded-lg">
                                    ~{formatRand(msg.linkedSpot.estimatedBudget)}
                                  </span>
                                )}
                              </div>

                              {msg.linkedSpot.summary && (
                                <p className="text-xs text-on-surface/80 line-clamp-2 leading-relaxed">
                                  {msg.linkedSpot.summary}
                                </p>
                              )}

                              {/* Primary Actions requested by User: Vote Thumbs-Up, Add to Date Planner, View on Map */}
                              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                {onVoteSpot && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      hapticSuccess();
                                      onVoteSpot(msg.id, 'up');
                                    }}
                                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer border ${
                                      mySpotVote === 'up'
                                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                                        : 'bg-surface-container-highest text-on-surface hover:border-emerald-500/50 border-outline-variant/25'
                                    }`}
                                  >
                                    <ThumbsUp className="w-3 h-3 shrink-0" />
                                    <span>
                                      {upVoteCount > 0 ? `Love It (${upVoteCount})` : 'Vote 👍'}
                                    </span>
                                  </button>
                                )}

                                {onPlanDateFromSpot && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      hapticMedium();
                                      onPlanDateFromSpot(msg.linkedSpot!);
                                    }}
                                    className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-primary text-on-primary-fixed hover:opacity-90 flex items-center gap-1 transition-opacity cursor-pointer"
                                  >
                                    <Calendar className="w-3 h-3 shrink-0" />
                                    <span>Add to Planner</span>
                                  </button>
                                )}

                                {onViewSpotOnMap && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      hapticLight();
                                      onViewSpotOnMap(msg.linkedSpot!);
                                    }}
                                    className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-surface-container-highest text-on-surface hover:text-primary border border-outline-variant/25 flex items-center gap-1 transition-colors cursor-pointer"
                                  >
                                    <MapPin className="w-3 h-3 text-primary shrink-0" />
                                    <span>View on Map</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* 2. INTERACTIVE DATE POLL CARD (date_poll) */}
                        {isDatePoll && msg.pollData && (
                          <div
                            className={`p-3 rounded-xl mb-2 border space-y-2.5 min-w-[230px] sm:min-w-[270px] ${
                              isMine
                                ? 'bg-surface-container-high text-on-surface border-white/15'
                                : 'bg-surface-container text-on-surface border-outline-variant/20'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 text-[11px] font-bold text-primary">
                              <BarChart3 className="w-3.5 h-3.5 shrink-0" />
                              <span>Interactive Couple Date Poll</span>
                            </div>
                            <h4 className="font-serif font-bold text-sm text-on-surface leading-snug">
                              {msg.pollData.question}
                            </h4>

                            <div className="space-y-1.5">
                              {msg.pollData.options.map(opt => {
                                const votesMap = msg.pollVotes || {};
                                const totalVotes = Object.keys(votesMap).length;
                                const optionVoterUids = Object.entries(votesMap)
                                  .filter(([, chosenId]) => chosenId === opt.id)
                                  .map(([uid]) => uid);
                                const voteCount = optionVoterUids.length;
                                const pct = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
                                const isMyChoice = votesMap[currentUserUid] === opt.id;

                                return (
                                  <button
                                    key={opt.id}
                                    type="button"
                                    onClick={() => {
                                      if (onVotePoll) {
                                        hapticSuccess();
                                        onVotePoll(msg.id, opt.id);
                                      }
                                    }}
                                    className={`w-full text-left p-2 rounded-xl border relative overflow-hidden transition-all cursor-pointer ${
                                      isMyChoice
                                        ? 'border-primary bg-primary/10'
                                        : 'border-outline-variant/25 bg-surface-container-highest/60 hover:border-primary/40'
                                    }`}
                                  >
                                    <div
                                      className="absolute inset-y-0 left-0 bg-primary/15 transition-all duration-300"
                                      style={{ width: `${pct}%` }}
                                    />
                                    <div className="relative flex items-center justify-between gap-2 text-xs">
                                      <span className="font-semibold text-on-surface flex items-center gap-1.5">
                                        <span
                                          className={`w-4 h-4 rounded-full flex items-center justify-center border text-[10px] shrink-0 ${
                                            isMyChoice
                                              ? 'bg-primary text-on-primary-fixed border-primary'
                                              : 'border-outline/40'
                                          }`}
                                        >
                                          {isMyChoice && <Check className="w-2.5 h-2.5" />}
                                        </span>
                                        <span>{opt.label}</span>
                                      </span>
                                      <span className="text-[11px] font-bold text-primary shrink-0 tabular-nums">
                                        {voteCount > 0 ? `${voteCount} (${pct}%)` : 'Vote'}
                                      </span>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                            <p className="text-[10px] text-outline">
                              Tap an option to cast or change your vote in real time.
                            </p>
                          </div>
                        )}

                        {/* 3. LINKED DATE NIGHT CARD WITH RSVP VOTING (date_invite) */}
                        {isDateInvite && (
                          <div
                            className={`p-2.5 rounded-xl mb-2 border space-y-2 ${
                              isMine && !isLoveNote
                                ? 'bg-black/15 border-white/15 text-on-primary-fixed'
                                : 'bg-primary/10 border-primary/20 text-on-surface'
                            }`}
                          >
                            <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <Calendar
                                  className={`w-4 h-4 shrink-0 ${
                                    isMine && !isLoveNote ? 'text-on-primary-fixed' : 'text-primary'
                                  }`}
                                />
                                <div className="min-w-0">
                                  <span className="text-[10px] font-semibold block opacity-80">
                                    Date Night Invite {goingCount > 0 ? `· ${goingCount} Going` : ''}
                                  </span>
                                  <strong className="text-xs font-serif truncate block">
                                    {msg.linkedEventTitle || 'Planned Date Night'}
                                  </strong>
                                </div>
                              </div>
                              {onNavigateToPlanner && (
                                <button
                                  type="button"
                                  onClick={onNavigateToPlanner}
                                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 shrink-0 cursor-pointer transition-colors whitespace-nowrap ${
                                    isMine && !isLoveNote
                                      ? 'bg-black/25 hover:bg-black/35 text-on-primary-fixed'
                                      : 'bg-primary text-on-primary-fixed hover:opacity-90'
                                  }`}
                                >
                                  <span>Planner</span>
                                  <ChevronRight className="w-3 h-3" />
                                </button>
                              )}
                            </div>

                            {/* Interactive RSVP Buttons */}
                            {onRespondDateInvite && (
                              <div className="flex items-center gap-1.5 pt-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    hapticSuccess();
                                    onRespondDateInvite(msg.id, 'going', msg.linkedEventId);
                                  }}
                                  className={`flex-1 py-1 px-2 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer border ${
                                    myRsvp === 'going'
                                      ? 'bg-emerald-600 text-white border-emerald-600'
                                      : isMine && !isLoveNote
                                      ? 'bg-black/20 text-on-primary-fixed border-white/20 hover:bg-black/30'
                                      : 'bg-surface-container text-on-surface border-outline-variant/25 hover:border-emerald-500/50'
                                  }`}
                                >
                                  <span>🥂 I&apos;m In!</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    hapticLight();
                                    onRespondDateInvite(msg.id, 'reschedule', msg.linkedEventId);
                                  }}
                                  className={`flex-1 py-1 px-2 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer border ${
                                    myRsvp === 'reschedule'
                                      ? 'bg-amber-600 text-white border-amber-600'
                                      : isMine && !isLoveNote
                                      ? 'bg-black/20 text-on-primary-fixed border-white/20 hover:bg-black/30'
                                      : 'bg-surface-container text-on-surface border-outline-variant/25 hover:border-amber-500/50'
                                  }`}
                                >
                                  <span>🕰️ New Time?</span>
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {/* 4. LINKED SHARED SAVINGS GOAL CARD (goal_nudge) */}
                        {isGoalNudge && (
                          <div
                            className={`flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 p-2.5 rounded-xl mb-2 border ${
                              isMine && !isLoveNote
                                ? 'bg-black/15 border-white/15 text-on-primary-fixed'
                                : 'bg-secondary/10 border-secondary/25 text-on-surface'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <PiggyBank
                                className={`w-4 h-4 shrink-0 ${
                                  isMine && !isLoveNote ? 'text-on-primary-fixed' : 'text-secondary'
                                }`}
                              />
                              <div className="min-w-0">
                                <span className="text-[10px] font-semibold block opacity-80">
                                  Shared Savings Goal
                                </span>
                                <strong className="text-xs font-serif truncate block">
                                  {msg.linkedGoalName || 'Couple Dream Goal'}
                                </strong>
                              </div>
                            </div>
                            {onSelectGoalForFunding && msg.linkedGoalId && (
                              <button
                                type="button"
                                onClick={() => onSelectGoalForFunding(msg.linkedGoalId!)}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 shrink-0 cursor-pointer transition-colors whitespace-nowrap ${
                                  isMine && !isLoveNote
                                    ? 'bg-black/25 hover:bg-black/35 text-on-primary-fixed'
                                    : 'bg-secondary text-on-secondary hover:opacity-90'
                                }`}
                              >
                                <span>Add Funds</span>
                                <ChevronRight className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        )}

                        {/* 5. SAVINGS DEPOSIT CELEBRATION CARD (deposit_celebration) */}
                        {isDepositCelebration && msg.depositData && (
                          <div className="p-3 rounded-xl mb-2 bg-surface-container/95 border border-emerald-500/30 space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500 flex items-center gap-1">
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>Savings Milestone Added</span>
                              </span>
                              <span className="font-serif font-bold text-sm text-emerald-500 tabular-nums">
                                +{formatRand(msg.depositData.amount)}
                              </span>
                            </div>

                            <h4 className="font-serif font-bold text-sm text-on-surface">
                              {msg.depositData.goalName}
                            </h4>

                            {msg.depositData.targetAmount > 0 && (
                              <div className="space-y-1">
                                <div className="flex items-center justify-between text-[11px] text-outline tabular-nums">
                                  <span>
                                    {formatRand(msg.depositData.newCurrentAmount)} of{' '}
                                    {formatRand(msg.depositData.targetAmount)}
                                  </span>
                                  <span className="font-bold text-emerald-500">
                                    {Math.min(
                                      100,
                                      Math.round(
                                        (msg.depositData.newCurrentAmount /
                                          msg.depositData.targetAmount) *
                                          100
                                      )
                                    )}
                                    %
                                  </span>
                                </div>
                                <div className="h-2 w-full rounded-full bg-surface-container-highest overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-emerald-500 to-primary rounded-full transition-all duration-500"
                                    style={{
                                      width: `${Math.min(
                                        100,
                                        Math.round(
                                          (msg.depositData.newCurrentAmount /
                                            msg.depositData.targetAmount) *
                                            100
                                        )
                                      )}%`
                                    }}
                                  />
                                </div>
                              </div>
                            )}

                            {onSelectGoalForFunding && msg.depositData.goalId && (
                              <button
                                type="button"
                                onClick={() => onSelectGoalForFunding(msg.depositData!.goalId)}
                                className="w-full py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                              >
                                <PiggyBank className="w-3.5 h-3.5" />
                                <span>Match This Deposit 🥂</span>
                              </button>
                            )}
                          </div>
                        )}

                        {/* Message Body Text */}
                        <p
                          className={`text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words ${
                            isLoveNote ? 'font-serif text-[15px] sm:text-base italic' : ''
                          }`}
                        >
                          {msg.text}
                        </p>

                        {/* Sender, Timestamp, Read Receipt & Inline Bubble Actions Footer */}
                        <div
                          className={`mt-1.5 pt-1 flex items-center justify-between gap-2 text-[10px] tabular-nums ${
                            isMine && !isLoveNote && !isDepositCelebration
                              ? 'text-on-primary-fixed/80'
                              : 'text-outline'
                          }`}
                        >
                          <div className="flex items-center gap-1 truncate">
                            <span className="font-medium truncate">
                              {isMine ? 'You' : msg.senderName}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span>{formatTime(msg.createdAt)}</span>
                            {isMine && (
                              <span
                                className="inline-flex items-center gap-0.5 ml-0.5"
                                title={isReadByPartner ? `Seen by ${partnerName}` : 'Delivered'}
                              >
                                <CheckCheck
                                  className={`w-3.5 h-3.5 shrink-0 ${
                                    isReadByPartner ? 'text-emerald-300' : 'opacity-70'
                                  }`}
                                />
                                <span className="text-[9px] opacity-85">
                                  {isReadByPartner ? 'Seen' : 'Sent'}
                                </span>
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-0.5 shrink-0">
                            {/* Reply Action */}
                            <button
                              type="button"
                              onClick={() => {
                                hapticLight();
                                setReplyingTo(msg);
                                inputRef.current?.focus();
                              }}
                              className={`min-w-[26px] min-h-[26px] p-1 rounded-md flex items-center justify-center transition-colors cursor-pointer ${
                                isMine && !isLoveNote && !isDepositCelebration
                                  ? 'hover:bg-black/15 text-on-primary-fixed/80 hover:text-on-primary-fixed'
                                  : 'hover:bg-surface-container-highest text-outline hover:text-primary'
                              }`}
                              title="Reply to message"
                              aria-label="Reply to message"
                            >
                              <Reply className="w-3.5 h-3.5" />
                            </button>

                            {/* Pin / Unpin Action */}
                            {onTogglePinMessage && (
                              <button
                                type="button"
                                onClick={() => {
                                  hapticLight();
                                  onTogglePinMessage(msg.id);
                                }}
                                className={`min-w-[26px] min-h-[26px] p-1 rounded-md flex items-center justify-center transition-colors cursor-pointer ${
                                  msg.isPinned
                                    ? 'text-amber-400'
                                    : isMine && !isLoveNote && !isDepositCelebration
                                    ? 'hover:bg-black/15 text-on-primary-fixed/80 hover:text-on-primary-fixed'
                                    : 'hover:bg-surface-container-highest text-outline hover:text-amber-500'
                                }`}
                                title={msg.isPinned ? 'Unpin message' : 'Pin message'}
                                aria-label={msg.isPinned ? 'Unpin message' : 'Pin message'}
                              >
                                <Pin className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Emoji Reaction Picker Action */}
                            <button
                              type="button"
                              onClick={() =>
                                setActiveReactionPickerId(prev => (prev === msg.id ? null : msg.id))
                              }
                              className={`min-w-[26px] min-h-[26px] p-1 rounded-md flex items-center justify-center transition-colors cursor-pointer ${
                                isMine && !isLoveNote && !isDepositCelebration
                                  ? 'hover:bg-black/15 text-on-primary-fixed/80 hover:text-on-primary-fixed'
                                  : 'hover:bg-surface-container-highest text-outline hover:text-primary'
                              }`}
                              title="React with emoji"
                              aria-label="React with emoji"
                            >
                              <Smile className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete Action */}
                            {isMine && (
                              <button
                                type="button"
                                onClick={() => onDeleteMessage(msg.id)}
                                className={`min-w-[26px] min-h-[26px] p-1 rounded-md flex items-center justify-center transition-colors cursor-pointer ${
                                  !isLoveNote && !isDepositCelebration
                                    ? 'hover:bg-black/15 text-on-primary-fixed/80 hover:text-on-primary-fixed'
                                    : 'hover:bg-surface-container-highest text-outline hover:text-rose-500'
                                }`}
                                title="Delete message"
                                aria-label="Delete message"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Reaction Picker Popover */}
                        <AnimatePresence>
                          {activeReactionPickerId === msg.id && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.92, y: 4 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.92, y: 4 }}
                              className={`mt-1.5 bg-surface-container-highest border border-outline-variant/30 rounded-full px-2 py-1 shadow-md flex items-center justify-center gap-1.5 w-fit ${
                                isMine ? 'ml-auto' : 'mr-auto'
                              }`}
                            >
                              {QUICK_REACTIONS.map(emoji => (
                                <button
                                  key={emoji}
                                  type="button"
                                  onClick={() => {
                                    hapticSuccess();
                                    onToggleReaction(msg.id, emoji);
                                    setActiveReactionPickerId(null);
                                  }}
                                  className="min-w-[28px] min-h-[28px] flex items-center justify-center hover:scale-125 transition-transform px-1 text-sm cursor-pointer"
                                >
                                  {emoji}
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    {/* Displayed Emoji Reactions */}
                    {reactionEntries.length > 0 && (
                      <div className={`flex items-center gap-1 mt-1 ${isMine ? 'pr-1' : 'pl-9'}`}>
                        {reactionEntries.map(([uid, emoji]) => (
                          <button
                            key={uid}
                            type="button"
                            onClick={() => onToggleReaction(msg.id, emoji)}
                            className="px-2 py-0.5 rounded-full bg-surface-container-highest border border-outline-variant/25 text-xs shadow-2xs cursor-pointer hover:scale-105 transition-transform"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          ))
        )}

        {/* Real-Time Partner Typing Bubble in Stream */}
        <AnimatePresence>
          {isPartnerTyping && (
            <motion.div
              key="partner-typing-bubble"
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.96 }}
              transition={{ duration: 0.18 }}
              className="flex items-end gap-2 justify-start"
              role="status"
              aria-live="polite"
            >
              {renderPartnerAvatar('w-7 h-7', 'text-xs')}

              <div className="bg-surface-container-high/90 backdrop-blur-xs border border-primary/25 rounded-2xl rounded-bl-sm px-4 py-2.5 shadow-xs flex items-center gap-2.5">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-2 h-2 rounded-full bg-primary/80 animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" />
                </div>
                <span className="text-xs font-medium text-outline">
                  {activeTypingPartnerName} is typing...
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* Interactive Date Poll Creator Drawer */}
      <AnimatePresence>
        {isPollCreatorOpen && (
          <motion.form
            onSubmit={handleSendDatePoll}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-3.5 sm:px-4 py-3 bg-surface-container-high border-t border-outline-variant/20 space-y-2.5 overflow-hidden shrink-0"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Create Couple Date Poll</span>
              </span>
              <div className="flex items-center gap-1.5">
                {QUICK_POLL_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      hapticLight();
                      setPollQuestion(preset.question);
                      setPollOptions(preset.options);
                    }}
                    className="text-[10px] px-2 py-0.5 rounded-lg bg-surface-container text-outline hover:text-primary border border-outline-variant/20 cursor-pointer"
                  >
                    Preset {idx + 1}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setIsPollCreatorOpen(false)}
                  className="p-1 text-outline hover:text-on-surface cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <input
              type="text"
              value={pollQuestion}
              onChange={e => setPollQuestion(e.target.value)}
              placeholder="Poll question (e.g., Where should we go this Friday?)"
              className="w-full bg-surface-container border border-outline-variant/25 rounded-xl px-3 py-1.5 text-xs text-on-surface outline-none focus:border-primary"
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
              {pollOptions.map((opt, idx) => (
                <input
                  key={idx}
                  type="text"
                  value={opt}
                  onChange={e => {
                    const next = [...pollOptions];
                    next[idx] = e.target.value;
                    setPollOptions(next);
                  }}
                  placeholder={`Option ${idx + 1}`}
                  className="bg-surface-container border border-outline-variant/20 rounded-xl px-2.5 py-1.5 text-xs text-on-surface outline-none focus:border-primary"
                />
              ))}
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSending}
                className="px-3.5 py-1.5 rounded-xl bg-primary text-on-primary-fixed text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Send className="w-3 h-3" />
                <span>Send Poll to Chat</span>
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Quoted Reply Preview Banner above Composer */}
      <AnimatePresence>
        {replyingTo && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-3.5 py-1.5 bg-surface-container-high border-t border-outline-variant/20 flex items-center justify-between gap-2 shrink-0"
          >
            <div className="flex items-center gap-2 min-w-0 flex-1 text-xs">
              <Reply className="w-3.5 h-3.5 text-primary shrink-0" />
              <div className="min-w-0 flex-1 truncate">
                <span className="font-bold text-primary mr-1.5">
                  Replying to {replyingTo.senderUid === currentUserUid ? 'yourself' : replyingTo.senderName}:
                </span>
                <span className="text-outline truncate">{replyingTo.text}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setReplyingTo(null)}
              className="p-1 text-outline hover:text-on-surface cursor-pointer"
              aria-label="Cancel reply"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Couple Attachment Strip (Share Love Note, Date Poll, Goal Nudge, or Date Invite) */}
      <div className="px-3 sm:px-4 py-2 sm:py-2.5 bg-surface-container border-t border-outline-variant/15 space-y-2 shrink-0">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => {
              hapticLight();
              setSelectedMode(prev => (prev === 'love_note' ? 'text' : 'love_note'));
            }}
            className={`px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1 border shrink-0 transition-colors cursor-pointer whitespace-nowrap ${
              selectedMode === 'love_note'
                ? 'bg-rose-600 text-white border-rose-600'
                : 'bg-surface-container-high text-on-surface border-outline-variant/20 hover:border-primary/40'
            }`}
          >
            <Heart className="w-3.5 h-3.5 shrink-0" />
            <span>Love Note</span>
          </button>

          <button
            type="button"
            onClick={() => {
              hapticLight();
              setIsPollCreatorOpen(prev => !prev);
            }}
            className={`px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1 border shrink-0 transition-colors cursor-pointer whitespace-nowrap ${
              isPollCreatorOpen
                ? 'bg-primary text-on-primary-fixed border-primary'
                : 'bg-surface-container-high text-on-surface border-outline-variant/20 hover:border-primary/40'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-primary shrink-0" />
            <span>Date Poll</span>
          </button>

          {goals.slice(0, 3).map(goal => (
            <button
              key={goal.id}
              type="button"
              onClick={() => handleSelectGoalShare(goal)}
              className={`px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1 border shrink-0 transition-colors cursor-pointer whitespace-nowrap ${
                selectedMode === 'goal_nudge' && selectedGoalId === goal.id
                  ? 'bg-secondary text-on-secondary border-secondary'
                  : 'bg-surface-container-high text-outline hover:text-on-surface border-outline-variant/20'
              }`}
            >
              <PiggyBank className="w-3.5 h-3.5 text-secondary shrink-0" />
              <span className="truncate max-w-[130px] sm:max-w-[150px]">Share: {goal.name}</span>
            </button>
          ))}

          {events.slice(0, 3).map(ev => (
            <button
              key={ev.id}
              type="button"
              onClick={() => handleSelectEventShare(ev)}
              className={`px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1 border shrink-0 transition-colors cursor-pointer whitespace-nowrap ${
                selectedMode === 'date_invite' && selectedEventId === ev.id
                  ? 'bg-primary text-on-primary-fixed border-primary'
                  : 'bg-surface-container-high text-outline hover:text-on-surface border-outline-variant/20'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="truncate max-w-[130px] sm:max-w-[150px]">Date: {ev.title}</span>
            </button>
          ))}
        </div>

        {/* Message Input Form (text-base on mobile prevents iOS Safari auto-zoom on focus) */}
        <form onSubmit={handleSend} className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            maxLength={1000}
            value={text}
            onChange={e => handleInputChange(e.target.value)}
            onBlur={() => broadcastTypingStatus(false)}
            placeholder={
              replyingTo
                ? `Reply to ${replyingTo.senderUid === currentUserUid ? 'your message' : replyingTo.senderName}...`
                : selectedMode === 'love_note'
                ? 'Write a sweet love note...'
                : 'Message your partner...'
            }
            className="flex-1 min-w-0 bg-surface-container-high border border-outline-variant/30 focus:border-primary rounded-2xl px-3.5 py-2 text-base sm:text-sm text-on-surface outline-none transition-colors min-h-[44px]"
          />
          <button
            type="submit"
            disabled={!text.trim() || isSending}
            className="px-3.5 sm:px-4 py-2.5 rounded-2xl bg-primary text-on-primary-fixed font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm hover:opacity-95 disabled:opacity-50 transition-all cursor-pointer min-h-[44px] min-w-[44px] shrink-0 whitespace-nowrap"
            aria-label="Send message"
          >
            <Send className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </form>
      </div>
    </div>
  );
}
