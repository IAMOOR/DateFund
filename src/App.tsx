/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Menu, 
  Plus, 
  Share2, 
  Settings, 
  Utensils, 
  PiggyBank, 
  Home, 
  Compass, 
  Map as MapIcon, 
  Calendar, 
  History,
  X,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  Circle,
  Trash2,
  LogOut,
  Search,
  MapPin,
  Bell,
  Clock,
  Plane,
  Palette,
  LayoutGrid,
  List,
  ArrowUpDown,
  Sparkles,
  Wand2,
  Loader2,
  Monitor,
  Sun,
  Moon,
  HeartOff,
  Camera,
  Bookmark,
  Award,
  Lock,
  Unlock,
  Flame,
  Star,
  Trophy,
  HeartHandshake,
  QrCode,
  UserPlus,
  MoreVertical,
  Pencil,
  Check,
  AlertTriangle,
  TrendingUp,
  Eye,
  EyeOff,
  ChevronLeft,
  Target,
  MessageCircleHeart
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import CalendarComponent from './components/Calendar';
import DateScrapbookModal from './components/scrapbook/DateScrapbookModal';
import AnniversaryTracker from './components/milestones/AnniversaryTracker';
import MysteryDateRevealModal from './components/mystery/MysteryDateRevealModal';
import YearInLoveModal from './components/wrapped/YearInLoveModal';
import PartnerInviteModal from './components/invite/PartnerInviteModal';
import WhoTreatsSplitterModal from './components/splitter/WhoTreatsSplitterModal';
import DateBucketListModal from './components/bucketlist/DateBucketListModal';
import RomanticTipsModal from './components/modals/RomanticTipsModal';
import GoogleDateMap from './components/maps/GoogleDateMap';
import WishlistView from './components/views/WishlistView';
import ScrapbookView from './components/views/ScrapbookView';
import MilestonesView from './components/views/MilestonesView';
import RelationshipSettingsView from './components/views/RelationshipSettingsView';
import HistoryView from './components/views/HistoryView';
import DiscoverView from './components/views/DiscoverView';
import DreamsView from './components/views/DreamsView';
import PartnerChatView from './components/views/PartnerChatView';
import RecordContributionModal from './components/modals/RecordContributionModal';
import AdjustGoalPlanModal from './components/modals/AdjustGoalPlanModal';
import { GoalPaceChart } from './components/goals/GoalPaceChart';
import { formatRand, formatDateShort, calculateGoalPace } from './utils/formatters';
import {
  Goal,
  Transaction,
  Event,
  DateMemory,
  BucketListItem,
  RelationshipData,
  DateMood,
  PartnerMessage,
  PartnerMessageType,
  SharedSpotPayload,
  DatePollPayload,
  DepositCelebrationPayload,
  MessageReplyReference
} from './types';
import { DATE_MOODS, getMoodConfig } from './utils/moods';
import { MoodBadge } from './components/ui/MoodBadge';
import { SA_PROVINCES, getNearestProvince } from './utils/provinces';
import { hapticLight, hapticMedium, hapticSuccess, hapticCelebration } from './utils/haptics';
import { scheduleDateReminder, requestNotificationPermissions, cancelAllScheduledReminders } from './utils/notifications';
import { setupStatusBar } from './utils/statusBar';
import { App as CapacitorApp } from '@capacitor/app';
import { getCachedAI, setCachedAI, clearUserAICache } from './utils/aiCache';
import { suggestDateIdea, getSoloEncouragement, getSoloDateIdea } from './utils/aiClient';
import { mapGoalDoc, mapTransactionDoc, mapEventDoc, mapBucketItemDoc, mapMessageDoc } from './utils/firestoreUtils';
import confetti from 'canvas-confetti';
import { 
  auth, 
  db, 
  googleProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInAnonymously,
  sendPasswordResetEmail,
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  deleteDoc,
  deleteField,
  handleFirestoreError, 
  OperationType,
  User
} from './firebase';

const AVATAR_ME = "https://lh3.googleusercontent.com/aida-public/AB6AXuCI9vqhcwkWHop2yys08rGQQzat2sxu6ZZ3ccAEl78y0LKuYkxl0rz8HC0zEFQzI66P1lWxRJK7p3w3hMX8kAgaXbDc6-lQdwO2632Ap8j_6uqVs7g49OXnVw66TwJyMrPxt3pNM38_HucD5mPSALugnsLnP1oPZQ_5IuIRAb7vUA21Px47ew9NdZDGBaSwvimDqCRNrR1sRpL01CjplTZXcfHvsTAbgMCx0BIbdwfRDTDvCgfQF8-1TwnwlPnAf8jsgoVTnmk23FE";
const AVATAR_THEM = "https://lh3.googleusercontent.com/aida-public/AB6AXuAtSrWZ1IwuPWyeSCMCaLnRPy3BkUAKSiMvfJhcK9E5rJP3vovDVSODIg8sP4Q3rADR1gaNrhe9UaQ_fq10mqBujTlzOtTWG87Fjp-671jT35crUY5spPerfxObhMTtP5snzeDplyp5ipu1WEMDbPKY5LvyNyGpi50vqZozS-yyRrPWAEFBzxsvzB8RmfWhB32HTc59fVsigig_oA3WGXBjy8kbIbHtoszMYp8v5EGHeRMtOcujZIs-eXfLHtd_0oFxNPPFmGhziq8";
const AVATAR_NAV = "https://lh3.googleusercontent.com/aida-public/AB6AXuA20UXs9pIK-DCOsonkEu1jFsmy1lA1Ber-Qz_WRjRxv1kDJtFW3kCgu2-LPm16-MT53WL_17D3m4fm0TiD60AvSvEy9llEaq89YxnqlcGysbofDKyx_S814mqMekZlxDC2r5enku9HhhAckS1Scibd1xRf-BcE2NiTJzVd-awYAxPjaM7JWoLSOIL8WkNEGvgBVF1m4-fr4wco6N8AVlK_FhBOfikhacdvnJY4GAgnCmP1Qkqsj55mCtOFoy8MT2CfI9E3SvGDgpM";

type View = 'home' | 'history' | 'discover' | 'map' | 'planner' | 'chat' | 'wishlist' | 'scrapbook' | 'milestones' | 'relationship' | 'dreams';

interface GoalPaceAnalysis {
  isCompleted: boolean;
  isOverdue: boolean;
  daysRemaining: number;
  weeksRemaining: number;
  remainingAmount: number;
  requiredWeekly: number;
  currentWeeklyRate: number;
  isBehindPace: boolean;
  suggestedWeekly: number;
  weeklyShortfall: number;
  paceStatus: 'completed' | 'overdue' | 'lagging' | 'on-track';
}

function getGoalPaceAnalysis(goal: Goal, transactions: Transaction[]): GoalPaceAnalysis {
  const isCompleted = goal.currentAmount >= goal.targetAmount;
  const now = new Date();
  const deadlineDate = new Date(goal.deadline);
  const daysRemaining = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const isOverdue = !isCompleted && daysRemaining < 0;
  const remainingAmount = Math.max(0, goal.targetAmount - goal.currentAmount);

  // Weeks remaining until deadline (at least 1 to prevent division by zero)
  const weeksRemaining = Math.max(1, Math.ceil(daysRemaining / 7));
  const requiredWeekly = isCompleted || isOverdue ? 0 : Math.ceil(remainingAmount / weeksRemaining);

  // Compute actual weekly savings rate based on transactions
  const goalTransactions = transactions.filter(t => t.goalId === goal.id && t.type === 'deposit');
  const createdDate = goal.createdAt ? new Date(goal.createdAt) : new Date(now.getTime() - 14 * 86400000);
  const daysActive = Math.max(1, Math.ceil((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)));
  const weeksActive = Math.max(1, daysActive / 7);

  // 30-day recent velocity
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);
  const recentDeposits = goalTransactions.filter(t => new Date(t.date || t.createdAt) >= thirtyDaysAgo);
  const recentTotal = recentDeposits.reduce((sum, t) => sum + t.amount, 0);

  const currentWeeklyRate = recentDeposits.length > 0 
    ? Math.round(recentTotal / 4.2) 
    : Math.round(goal.currentAmount / weeksActive);

  // Expected progress based on time elapsed between creation and deadline
  const totalDays = Math.max(1, Math.ceil((deadlineDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)));
  const elapsedDays = Math.max(0, Math.min(totalDays, daysActive));
  const expectedFraction = totalDays > 0 ? elapsedDays / totalDays : 0;
  const actualFraction = goal.targetAmount > 0 ? goal.currentAmount / goal.targetAmount : 0;

  // Behind pace if not completed/overdue, and current weekly rate < 85% of required,
  // or actual fraction is > 10% behind expected timeline
  const isBehindPace = !isCompleted && !isOverdue && (
    (currentWeeklyRate < requiredWeekly * 0.85) || 
    (actualFraction < expectedFraction - 0.1)
  );

  const weeklyShortfall = Math.max(0, requiredWeekly - currentWeeklyRate);
  const suggestedWeekly = requiredWeekly;

  let paceStatus: 'completed' | 'overdue' | 'lagging' | 'on-track' = 'on-track';
  if (isCompleted) paceStatus = 'completed';
  else if (isOverdue) paceStatus = 'overdue';
  else if (isBehindPace) paceStatus = 'lagging';

  return {
    isCompleted,
    isOverdue,
    daysRemaining,
    weeksRemaining,
    remainingAmount,
    requiredWeekly,
    currentWeeklyRate,
    isBehindPace,
    suggestedWeekly,
    weeklyShortfall,
    paceStatus
  };
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [view, setView] = useState<View>('home');
  const [goals, setGoals] = useState<Goal[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isFundModalOpen, setIsFundModalOpen] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // New Roadmap Feature Modals & States
  const [isScrapbookModalOpen, setIsScrapbookModalOpen] = useState(false);
  const [isMilestonesModalOpen, setIsMilestonesModalOpen] = useState(false);
  const [isWrappedModalOpen, setIsWrappedModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isSplitterModalOpen, setIsSplitterModalOpen] = useState(false);
  const [isBucketListModalOpen, setIsBucketListModalOpen] = useState(false);
  const [isRomanticTipsModalOpen, setIsRomanticTipsModalOpen] = useState(false);
  const [romanticTipsMood, setRomanticTipsMood] = useState<DateMood>('Romantic');
  const [mysteryEventToReveal, setMysteryEventToReveal] = useState<Event | null>(null);
  const [bucketList, setBucketList] = useState<BucketListItem[]>([]);
  const [messages, setMessages] = useState<PartnerMessage[]>([]);
  const [isQuickChatOpen, setIsQuickChatOpen] = useState(false);
  const [focusedMapSpot, setFocusedMapSpot] = useState<SharedSpotPayload | null>(null);
  const [relationshipStartDate, setRelationshipStartDate] = useState('2024-02-14');

  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(() => {
    const saved = localStorage.getItem('datefund-theme');
    return (saved as 'light' | 'dark' | 'system') || 'system';
  });
  const [isJoinEventModalOpen, setIsJoinEventModalOpen] = useState(false);
  const [isBreakUpConfirmOpen, setIsBreakUpConfirmOpen] = useState(false);
  const [plannerMode, setPlannerMode] = useState<'list' | 'grid' | 'calendar'>('grid');
  const [plannerSort, setPlannerSort] = useState<'date' | 'time' | 'title'>('date');
  const [plannerMoodFilter, setPlannerMoodFilter] = useState<DateMood | 'all'>('all');
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [joinEventId, setJoinEventId] = useState('');
  const [newGoal, setNewGoal] = useState({ name: '', target: '', deadline: '' });
  const [fundData, setFundData] = useState({ goalId: '', amount: '', contributor: 'Me' as 'Me' | 'Them' });
  const [newEvent, setNewEvent] = useState({ 
    title: '', 
    description: '', 
    date: '', 
    time: '', 
    location: '', 
    goalId: '', 
    reminder: false, 
    reminderMinutes: 15, 
    tags: [] as string[],
    isMystery: false,
    mysteryClue: '',
    mood: 'Romantic' as DateMood
  });
  const [profileData, setProfileData] = useState({ displayName: '', photoURL: '' });
  const [customTag, setCustomTag] = useState('');
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [suggestedIdea, setSuggestedIdea] = useState<{ title: string, description: string, tags: string[] } | null>(null);
  const [isSuggestionModalOpen, setIsSuggestionModalOpen] = useState(false);
  const [location, setLocation] = useState<{ lat: number, lng: number } | null>(null);
  
  const [isRelationshipModalOpen, setIsRelationshipModalOpen] = useState(false);
  const [isBreakUpSummaryOpen, setIsBreakUpSummaryOpen] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState<string | null>(null);
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);
  const [breakUpData, setBreakUpData] = useState<{ me: number, them: number, goalsAffected: number } | null>(null);
  const [dailyAdvice, setDailyAdvice] = useState<string | null>(null);
  const [isAdviceLoading, setIsAdviceLoading] = useState(false);
  const [soloDateIdea, setSoloDateIdea] = useState<{ title: string, description: string } | null>(null);
  
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [activeReminders, setActiveReminders] = useState<Event[]>([]);
  const [historyFilter, setHistoryFilter] = useState<'all' | 'Me' | 'Them'>('all');
  const [isAvatarMenuOpen, setIsAvatarMenuOpen] = useState(false);
  const avatarMenuRef = useRef<HTMLDivElement>(null);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [activeGoalMenu, setActiveGoalMenu] = useState<string | null>(null);
  const [goalToAdjust, setGoalToAdjust] = useState<Goal | null>(null);
  const [lastTreatedBy, setLastTreatedBy] = useState<'Me' | 'Them'>('Them');
  const [showPassword, setShowPassword] = useState(false);
  const [relationshipData, setRelationshipData] = useState<RelationshipData | undefined>(undefined);

  const weeklyGrowth = useMemo(() => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return transactions
      .filter(t => t.type === 'deposit' && new Date(t.date || t.createdAt) >= oneWeekAgo)
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const nextPlannedDate = useMemo(() => {
    const now = new Date();
    const upcoming = events
      .filter(e => !e.completed && new Date(`${e.date}T${e.time || '23:59'}`) >= now)
      .sort((a, b) => new Date(`${a.date}T${a.time || '00:00'}`).getTime() - new Date(`${b.date}T${b.time || '00:00'}`).getTime());
    return upcoming[0] || null;
  }, [events]);

  const filteredTransactions = useMemo(() => {
    if (historyFilter === 'all') return transactions;
    return transactions.filter(t => t.contributor === historyFilter);
  }, [transactions, historyFilter]);

  const passwordStrength = useMemo(() => {
    if (!password) return 0;
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    return strength;
  }, [password]);

  const getStrengthColor = (score: number) => {
    if (score <= 2) return "bg-error";
    if (score <= 4) return "bg-secondary";
    return "bg-primary";
  };

  const getStrengthLabel = (score: number) => {
    if (!password) return "";
    if (score <= 2) return "Weak";
    if (score <= 4) return "Fair";
    return "Strong";
  };

  // Theme Listener & Status Bar Optimization
  useEffect(() => {
    const root = window.document.documentElement;
    localStorage.setItem('datefund-theme', theme);
    setupStatusBar(theme);
    
    const applyTheme = (t: 'light' | 'dark' | 'system') => {
      if (t === 'system') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        if (systemTheme === 'light') {
          root.classList.add('light');
        } else {
          root.classList.remove('light');
        }
      } else if (t === 'light') {
        root.classList.add('light');
      } else {
        root.classList.remove('light');
      }
    };

    applyTheme(theme);

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => {
        applyTheme('system');
        setupStatusBar('system');
      };
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);
  
  // Close Avatar Menu on Click Outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (avatarMenuRef.current && !avatarMenuRef.current.contains(event.target as Node)) {
        setIsAvatarMenuOpen(false);
      }
    };
    if (isAvatarMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isAvatarMenuOpen]);

  // Android Hardware Back Button & Native Navigation Stack
  const backHandlerRef = React.useRef({
    isBreakUpConfirmOpen,
    isBreakUpSummaryOpen,
    isRelationshipModalOpen,
    isRomanticTipsModalOpen,
    isBucketListModalOpen,
    isSplitterModalOpen,
    isInviteModalOpen,
    isWrappedModalOpen,
    isMilestonesModalOpen,
    isScrapbookModalOpen,
    isProfileModalOpen,
    isEventModalOpen,
    isFundModalOpen,
    isGoalModalOpen,
    isJoinEventModalOpen,
    isSuggestionModalOpen,
    isAvatarMenuOpen,
    isMenuOpen,
    view
  });

  useEffect(() => {
    backHandlerRef.current = {
      isBreakUpConfirmOpen,
      isBreakUpSummaryOpen,
      isRelationshipModalOpen,
      isRomanticTipsModalOpen,
      isBucketListModalOpen,
      isSplitterModalOpen,
      isInviteModalOpen,
      isWrappedModalOpen,
      isMilestonesModalOpen,
      isScrapbookModalOpen,
      isProfileModalOpen,
      isEventModalOpen,
      isFundModalOpen,
      isGoalModalOpen,
      isJoinEventModalOpen,
      isSuggestionModalOpen,
      isAvatarMenuOpen,
      isMenuOpen,
      view
    };
  }, [
    isBreakUpConfirmOpen,
    isBreakUpSummaryOpen,
    isRelationshipModalOpen,
    isRomanticTipsModalOpen,
    isBucketListModalOpen,
    isSplitterModalOpen,
    isInviteModalOpen,
    isWrappedModalOpen,
    isMilestonesModalOpen,
    isScrapbookModalOpen,
    isProfileModalOpen,
    isEventModalOpen,
    isFundModalOpen,
    isGoalModalOpen,
    isJoinEventModalOpen,
    isSuggestionModalOpen,
    isAvatarMenuOpen,
    isMenuOpen,
    view
  ]);

  const lastBackPressRef = React.useRef<number>(0);

  useEffect(() => {
    let listenerHandle: any = null;

    const setupBackListener = async () => {
      try {
        listenerHandle = await CapacitorApp.addListener('backButton', () => {
          const s = backHandlerRef.current;
          
          // 1. Close active modals from top-level to lower-level
          if (s.isBreakUpConfirmOpen) { setIsBreakUpConfirmOpen(false); return; }
          if (s.isBreakUpSummaryOpen) { setIsBreakUpSummaryOpen(false); return; }
          if (s.isRomanticTipsModalOpen) { setIsRomanticTipsModalOpen(false); return; }
          if (s.isBucketListModalOpen) { setIsBucketListModalOpen(false); return; }
          if (s.isSplitterModalOpen) { setIsSplitterModalOpen(false); return; }
          if (s.isInviteModalOpen) { setIsInviteModalOpen(false); return; }
          if (s.isWrappedModalOpen) { setIsWrappedModalOpen(false); return; }
          if (s.isMilestonesModalOpen) { setIsMilestonesModalOpen(false); return; }
          if (s.isScrapbookModalOpen) { setIsScrapbookModalOpen(false); return; }
          if (s.isProfileModalOpen) { setIsProfileModalOpen(false); return; }
          if (s.isEventModalOpen) { setIsEventModalOpen(false); return; }
          if (s.isFundModalOpen) { setIsFundModalOpen(false); return; }
          if (s.isGoalModalOpen) { setIsGoalModalOpen(false); return; }
          if (s.isJoinEventModalOpen) { setIsJoinEventModalOpen(false); return; }
          if (s.isSuggestionModalOpen) { setIsSuggestionModalOpen(false); return; }
          if (s.isRelationshipModalOpen) { setIsRelationshipModalOpen(false); return; }
          if (s.isAvatarMenuOpen) { setIsAvatarMenuOpen(false); return; }
          if (s.isMenuOpen) { setIsMenuOpen(false); return; }

          // 2. If no modal is open and not on home view, go back to home view
          if (s.view !== 'home') {
            setView('home');
            return;
          }

          // 3. Double-tap to exit on home view
          const now = Date.now();
          if (now - lastBackPressRef.current < 2000) {
            CapacitorApp.exitApp();
          } else {
            lastBackPressRef.current = now;
            setToast('Press back again to exit DateFund');
          }
        });
      } catch {
        // Graceful fallback on web
      }
    };

    setupBackListener();

    return () => {
      if (listenerHandle && typeof listenerHandle.remove === 'function') {
        listenerHandle.remove();
      }
    };
  }, []);

  // Deep Link Handling (e.g. datefund://join?eventId=... or https://datefund.app/join?...)
  useEffect(() => {
    let urlListener: any = null;
    const setupUrlListener = async () => {
      try {
        urlListener = await CapacitorApp.addListener('appUrlOpen', (event) => {
          try {
            const parsed = new URL(event.url);
            const eventId = parsed.searchParams.get('eventId') || parsed.searchParams.get('id');
            const goalId = parsed.searchParams.get('goalId');
            if (eventId) {
              setJoinEventId(eventId);
              setIsJoinEventModalOpen(true);
            } else if (goalId) {
              setFundData({ goalId, amount: '', contributor: 'Me' });
              setIsFundModalOpen(true);
            }
          } catch (e) {
            console.debug('Failed to parse deep link URL', e);
          }
        });
      } catch {
        // No-op on web
      }
    };
    setupUrlListener();
    return () => {
      if (urlListener && typeof urlListener.remove === 'function') {
        urlListener.remove();
      }
    };
  }, [goals]);

  // Auth Listener
  useEffect(() => {
    let unsubBucket: (() => void) | undefined;
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // Authenticated Firebase User
        setUser(currentUser);
        setIsDemoMode(false);
        setIsAuthReady(true);
        const userRef = doc(db, 'users', currentUser.uid);
        try {
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const data = userSnap.data();
            setUserProfile(data);
            setProfileData({
              displayName: data.displayName || '',
              photoURL: data.photoURL || ''
            });
            if (data.relationshipStartDate) {
              setRelationshipStartDate(data.relationshipStartDate);
            }
          } else {
            // Initialize profile
            const initialProfile = {
              uid: currentUser.uid,
              email: currentUser.email || 'user@datefund.app',
              displayName: currentUser.displayName || (currentUser.email ? currentUser.email.split('@')[0] : 'Partner'),
              photoURL: currentUser.photoURL || AVATAR_NAV,
              relationshipStartDate: '2024-02-14',
              createdAt: new Date().toISOString()
            };
            try {
              await setDoc(userRef, initialProfile);
            } catch (writeErr) {
              console.warn("User profile initial set notice:", writeErr);
            }
            setUserProfile(initialProfile);
            setProfileData({
              displayName: initialProfile.displayName,
              photoURL: initialProfile.photoURL
            });
          }

          // Bucket List Listener
          const bucketColl = collection(db, 'users', currentUser.uid, 'bucketList');
          unsubBucket = onSnapshot(bucketColl, (snap) => {
            const list = snap.docs.map(d => mapBucketItemDoc(d));
            setBucketList(list);
          }, () => {});
        } catch (err) {
          console.warn("User profile read notice:", err);
        }
      } else {
        // Unauthenticated - clean up private session state and scheduled timers
        cancelAllScheduledReminders();
        clearUserAICache();
        localStorage.removeItem('datefund_session_user');
        setUser(null);
        setUserProfile(null);
        setGoals([]);
        setTransactions([]);
        setEvents([]);
        setBucketList([]);
        setIsDemoMode(false);
        setIsAuthReady(true);
      }
    });
    return () => {
      unsubscribe();
      if (unsubBucket) unsubBucket();
    };
  }, []);

  // Instant Invite Link & URL Partner Auto-Join
  useEffect(() => {
    if (!user) return;
    try {
      const params = new URLSearchParams(window.location.search);
      const partnerId = params.get('partner');
      const eventId = params.get('event');
      if (partnerId && partnerId !== user.uid) {
        handleConnectPartner(partnerId);
        window.history.replaceState({}, document.title, window.location.pathname);
      }
      if (eventId) {
        setJoinEventId(eventId);
        setIsJoinEventModalOpen(true);
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } catch (e) {
      console.debug("URL param parse skipped", e);
    }
  }, [user]);

  // Geolocation Listener
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.warn("Location access unavailable, using default features.");
        }
      );
    }
  }, []);

  // Reminder Checker
  useEffect(() => {
    if (!user || events.length === 0) return;

    const checkReminders = () => {
      const now = new Date();
      const upcoming = events.filter(event => {
        if (!event.reminder || event.reminderSent) return false;
        
        const eventDateTime = new Date(`${event.date}T${event.time || '00:00'}`);
        // Remind at specified time before or if it's already started but within 1 hour
        const reminderTime = new Date(eventDateTime.getTime() - (event.reminderMinutes || 15) * 60000);
        const expiryTime = new Date(eventDateTime.getTime() + 60 * 60000);
        
        return now >= reminderTime && now < expiryTime;
      });

      if (upcoming.length > 0) {
        setActiveReminders(prev => {
          const newReminders = upcoming.filter(u => !prev.find(p => p.id === u.id));
          return [...prev, ...newReminders];
        });
        
        // Mark as sent in Firestore to avoid repeat notifications
        upcoming.forEach(async (event) => {
          try {
            await setDoc(doc(db, 'events', event.id), {
              ...event,
              reminderSent: true
            }, { merge: true });
          } catch (err) {
            console.error("Failed to update reminder status", err);
          }
        });

        // Browser Notification if possible
        if ("Notification" in window && Notification.permission === "granted") {
          upcoming.forEach(event => {
            new Notification(`DateFund Reminder: ${event.title}`, {
              body: `Date at ${event.time || 'today'}! ${event.location ? `at ${event.location}` : ''}`,
            });
          });
        }
      }
    };

    const interval = setInterval(checkReminders, 30000); // Check every 30 seconds
    checkReminders(); // Initial check
    return () => clearInterval(interval);
  }, [user, events]);

  // Request Notification Permission
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // Firestore Listeners
  useEffect(() => {
    if (!user || isDemoMode) {
      if (!isDemoMode) {
        setGoals([]);
        setTransactions([]);
        setEvents([]);
      }
      return;
    }

    // Migration: Ensure all owned goals have collaborators list
    const fixOldData = async () => {
      try {
        // Fix Goals
        const qGoals = query(collection(db, 'goals'), where('ownerUid', '==', user.uid));
        const snapGoals = await getDocs(qGoals);
        for (const docSnap of snapGoals.docs) {
          const data = docSnap.data();
          if (!data.collaborators) {
            await setDoc(doc(db, 'goals', docSnap.id), {
              ...data,
              collaborators: [user.uid]
            }, { merge: true });
          }
        }

        // Fix Events
        const qEvents = query(collection(db, 'events'), where('ownerUid', '==', user.uid));
        const snapEvents = await getDocs(qEvents);
        for (const docSnap of snapEvents.docs) {
          const data = docSnap.data();
          if (!data.collaborators) {
            await setDoc(doc(db, 'events', docSnap.id), {
              ...data,
              collaborators: [user.uid],
              rsvps: { [user.uid]: 'Going' }
            }, { merge: true });
          }
        }
      } catch (err) {
        // Silent fail for migration
        console.debug("Migration check skipped or failed", err);
      }
    };
    fixOldData();

    const goalsQuery = query(collection(db, 'goals'), where('collaborators', 'array-contains', user.uid));
    const unsubscribeGoals = onSnapshot(goalsQuery, (snapshot) => {
      const goalsList = snapshot.docs.map(doc => mapGoalDoc(doc));
      setGoals(goalsList.sort((a, b) => b.id.localeCompare(a.id)));
    }, (err) => {
      console.warn("Goals snapshot notice:", err.message);
      setGoals(prev => prev.length > 0 ? prev : [
        {
          id: 'goal_romantic_getaway',
          ownerUid: user.uid,
          collaborators: [user.uid],
          name: 'Weekend Getaway in Franschhoek',
          targetAmount: 5000,
          currentAmount: 2400,
          deadline: '2026-12-31',
          createdAt: new Date().toISOString()
        }
      ]);
    });

    const transactionsQuery = query(collection(db, 'transactions'), where('ownerUid', '==', user.uid));
    const unsubscribeTransactions = onSnapshot(transactionsQuery, (snapshot) => {
      const transactionsList = snapshot.docs.map(doc => mapTransactionDoc(doc));
      setTransactions(transactionsList.sort((a, b) => b.date.localeCompare(a.date)));
    }, (err) => {
      console.warn("Transactions snapshot notice:", err.message);
      setTransactions(prev => prev.length > 0 ? prev : [
        {
          id: 'tx_1',
          ownerUid: user.uid,
          goalId: 'goal_romantic_getaway',
          goalName: 'Weekend Getaway in Franschhoek',
          amount: 1400,
          date: new Date().toISOString().split('T')[0],
          contributor: 'Me',
          type: 'deposit',
          createdAt: new Date().toISOString()
        },
        {
          id: 'tx_2',
          ownerUid: user.uid,
          goalId: 'goal_romantic_getaway',
          goalName: 'Weekend Getaway in Franschhoek',
          amount: 1000,
          date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
          contributor: 'Them',
          type: 'deposit',
          createdAt: new Date().toISOString()
        }
      ]);
    });

    const eventsQuery = query(collection(db, 'events'), where('collaborators', 'array-contains', user.uid));
    const unsubscribeEvents = onSnapshot(eventsQuery, (snapshot) => {
      const eventsList = snapshot.docs.map(doc => mapEventDoc(doc));
      setEvents(eventsList.sort((a, b) => a.date.localeCompare(b.date)));
    }, (err) => {
      console.warn("Events snapshot notice:", err.message);
      setEvents(prev => prev.length > 0 ? prev : [
        {
          id: 'evt_1',
          ownerUid: user.uid,
          title: 'Candlelight Sunset Dinner',
          description: 'Reservation overlooking the valley',
          date: new Date().toISOString().split('T')[0],
          time: '19:30',
          location: 'Sunset Vista Restaurant',
          collaborators: [user.uid],
          rsvps: { [user.uid]: 'Going' },
          createdAt: new Date().toISOString()
        }
      ]);
    });

    const messagesQuery = query(collection(db, 'messages'), where('participants', 'array-contains', user.uid));
    const unsubscribeMessages = onSnapshot(messagesQuery, (snapshot) => {
      const msgList = snapshot.docs.map(docSnap => mapMessageDoc(docSnap));
      setMessages(msgList.sort((a, b) => a.createdAt.localeCompare(b.createdAt)));
    }, (err) => {
      console.warn("Messages snapshot notice:", err.message);
    });

    return () => {
      unsubscribeGoals();
      unsubscribeTransactions();
      unsubscribeEvents();
      unsubscribeMessages();
    };
  }, [user, isDemoMode]);

  const totalDeposits = useMemo(() => 
    transactions.filter(t => t.type === 'deposit').reduce((sum, t) => sum + t.amount, 0)
  , [transactions]);

  const totalSpending = useMemo(() => 
    transactions.filter(t => t.type === 'withdrawal').reduce((sum, t) => sum + Math.abs(t.amount), 0)
  , [transactions]);

  const totalBalance = useMemo(() => 
    Math.max(0, totalDeposits - totalSpending)
  , [totalDeposits, totalSpending]);
  
  const contributorStats = useMemo(() => {
    const stats = transactions.reduce((acc, t) => {
      if (t.type === 'deposit') {
        acc[t.contributor].total += t.amount;
        const date = new Date(t.date);
        if (!acc[t.contributor].lastDate || date > acc[t.contributor].lastDate) {
          acc[t.contributor].lastDate = date;
        }
      }
      return acc;
    }, { 
      Me: { total: 0, lastDate: null as Date | null }, 
      Them: { total: 0, lastDate: null as Date | null } 
    });
    return stats;
  }, [transactions]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleLogin = async () => {
    setAuthError('');
    setIsAuthenticating(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.warn("Google sign-in status:", error?.code || error?.message);
      if (error?.code !== 'auth/popup-closed-by-user') {
        setAuthError("Google sign-in popup was cancelled or blocked by the browser. You can also sign in with Email or Demo Couple mode below.");
      }
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setEmailError("Enter your email to reset password");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError("Please enter a valid email address");
      return;
    }

    setIsResettingPassword(true);
    setAuthError('');
    try {
      await sendPasswordResetEmail(auth, email);
      setToast("Password reset email sent! Check your inbox.");
    } catch (error: any) {
      console.warn("Reset notification:", error?.code);
      setToast("Password reset instruction initiated for " + email);
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setEmailError('');
    setPasswordError('');

    // Robust Validation
    let hasError = false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError("Email is required");
      hasError = true;
    } else if (!emailRegex.test(email)) {
      setEmailError("Please enter a valid email address");
      hasError = true;
    }

    if (!password) {
      setPasswordError("Password is required");
      hasError = true;
    } else if (authMode === 'signup' && password.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      hasError = true;
    }

    if (hasError) return;
    
    setIsAuthenticating(true);
    
    try {
      if (authMode === 'signup') {
        await createUserWithEmailAndPassword(auth, email.trim(), password);
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }
    } catch (error: any) {
      if (error?.code === 'auth/operation-not-allowed' || error?.message?.includes('OPERATION_NOT_ALLOWED')) {
        setAuthError("Email authentication is disabled in Firebase Console. Please sign in with Google or use Demo Couple mode.");
        return;
      }

      console.warn("Email auth status:", error?.code || error?.message);
      let message = "Authentication failed.";
      if (error.code === 'auth/email-already-in-use') {
        message = "This email is already registered. Please switch to 'Sign In' below.";
      } else if (error.code === 'auth/invalid-email') {
        message = "Invalid email address format.";
      } else if (error.code === 'auth/weak-password') {
        message = "Password is too weak. Please use at least 8 characters.";
      } else if (error.code === 'auth/user-not-found') {
        message = "No account found with this email. Switch to 'Sign Up' below to create one.";
      } else if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        message = "Invalid email or password. Please re-check your credentials.";
      } else if (error.code === 'auth/network-request-failed') {
        message = "Network error connecting to auth server. Please check your connection.";
      } else if (error.code === 'auth/too-many-requests') {
        message = "Too many attempts. Please wait a moment and try again.";
      } else {
        message = error.message || "Authentication failed. You can also sign in with Google or Demo Couple mode.";
      }
      setAuthError(message);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleGuestLogin = () => {
    setIsAuthenticating(true);
    setAuthError('');
    // Clear any previous reminders and user-scoped caches
    cancelAllScheduledReminders();
    if (user?.uid) {
      clearUserAICache(user.uid);
    }
    const demoUser: any = {
      uid: 'demo_guest_user',
      email: 'guest@datefund.demo',
      displayName: 'Demo Couple',
      photoURL: AVATAR_ME,
      isAnonymous: true
    };
    setIsDemoMode(true);
    setUser(demoUser);
    setUserProfile({
      uid: 'demo_guest_user',
      email: 'guest@datefund.demo',
      displayName: 'Demo Couple',
      photoURL: AVATAR_ME,
      relationshipStartDate: '2024-02-14',
      createdAt: new Date().toISOString()
    });
    setGoals([
      {
        id: 'demo_goal_1',
        ownerUid: 'demo_guest_user',
        collaborators: ['demo_guest_user'],
        name: 'Weekend Getaway in Franschhoek',
        targetAmount: 5000,
        currentAmount: 2400,
        deadline: '2026-12-31',
        createdAt: new Date().toISOString()
      }
    ]);
    setTransactions([
      {
        id: 'demo_tx_1',
        ownerUid: 'demo_guest_user',
        goalId: 'demo_goal_1',
        goalName: 'Weekend Getaway in Franschhoek',
        amount: 1400,
        date: new Date().toISOString().split('T')[0],
        contributor: 'Me',
        type: 'deposit',
        createdAt: new Date().toISOString()
      },
      {
        id: 'demo_tx_2',
        ownerUid: 'demo_guest_user',
        goalId: 'demo_goal_1',
        goalName: 'Weekend Getaway in Franschhoek',
        amount: 1000,
        date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
        contributor: 'Them',
        type: 'deposit',
        createdAt: new Date().toISOString()
      }
    ]);
    setEvents([
      {
        id: 'demo_evt_1',
        ownerUid: 'demo_guest_user',
        title: 'Candlelight Sunset Dinner',
        description: 'Reservation overlooking the valley',
        date: new Date().toISOString().split('T')[0],
        time: '19:30',
        location: 'Sunset Vista Restaurant',
        collaborators: ['demo_guest_user'],
        rsvps: { 'demo_guest_user': 'Going' },
        createdAt: new Date().toISOString(),
        mood: 'Romantic'
      }
    ]);
    const nowMs = Date.now();
    setMessages([
      {
        id: 'demo_msg_1',
        senderUid: 'demo_partner_alex',
        senderName: 'Alex',
        senderPhoto: AVATAR_THEM,
        participants: ['demo_guest_user', 'demo_partner_alex'],
        text: 'Thinking about our next date night together ❤️ Let’s do something special in Ekurhuleni this Friday!',
        messageType: 'love_note',
        isPinned: true,
        reactions: { demo_guest_user: '❤️' },
        readBy: ['demo_partner_alex', 'demo_guest_user'],
        createdAt: new Date(nowMs - 3600000 * 3).toISOString()
      },
      {
        id: 'demo_msg_2',
        senderUid: 'demo_partner_alex',
        senderName: 'Alex',
        senderPhoto: AVATAR_THEM,
        participants: ['demo_guest_user', 'demo_partner_alex'],
        text: 'Found this gorgeous lakeside spot in Benoni on Discover! What do you think?',
        messageType: 'spot_share',
        linkedSpot: {
          id: 'ek-benoni-1',
          name: 'Homestead Dam & Farrarmere Garden Café',
          category: 'Cozy · Benoni',
          location: 'Farrarmere, Benoni, Ekurhuleni',
          province: 'Ekurhuleni',
          estimatedBudget: 380,
          rating: 4.8,
          summary: 'Lakeside picnic walk along Homestead Dam followed by artisan coffee and warm pastries under the trees.',
          mood: 'Cozy',
          lat: -26.1752,
          lng: 28.3084
        },
        spotVotes: { demo_partner_alex: 'up' },
        readBy: ['demo_partner_alex', 'demo_guest_user'],
        createdAt: new Date(nowMs - 3600000 * 2).toISOString()
      },
      {
        id: 'demo_msg_3',
        senderUid: 'demo_partner_alex',
        senderName: 'Alex',
        senderPhoto: AVATAR_THEM,
        participants: ['demo_guest_user', 'demo_partner_alex'],
        text: '📊 Date Poll: Which Ekurhuleni date vibe are you feeling this weekend?',
        messageType: 'date_poll',
        pollData: {
          question: 'Which Ekurhuleni date vibe are you feeling this weekend?',
          options: [
            { id: 'opt_1', label: 'Cozy Garden Café in Benoni ☕' },
            { id: 'opt_2', label: 'Bokkie Park & Sunset Dinner in Boksburg 🌅' },
            { id: 'opt_3', label: 'Marievale Bird Sanctuary Picnic in Springs 🦩' }
          ]
        },
        pollVotes: { demo_partner_alex: 'opt_1' },
        readBy: ['demo_partner_alex'],
        createdAt: new Date(nowMs - 1800000).toISOString()
      },
      {
        id: 'demo_msg_4',
        senderUid: 'demo_partner_alex',
        senderName: 'Alex',
        senderPhoto: AVATAR_THEM,
        participants: ['demo_guest_user', 'demo_partner_alex'],
        text: 'Just added R 1,000 toward our Weekend Getaway in Franschhoek! 🥂',
        messageType: 'deposit_celebration',
        depositData: {
          goalId: 'demo_goal_1',
          goalName: 'Weekend Getaway in Franschhoek',
          amount: 1000,
          newCurrentAmount: 2400,
          targetAmount: 5000,
          contributor: 'Them'
        },
        readBy: ['demo_partner_alex'],
        createdAt: new Date(nowMs - 600000).toISOString()
      }
    ]);
    setIsAuthReady(true);
    setIsAuthenticating(false);
    setToast("Welcome to Demo Couple mode! 🥂");
  };

  const handleLogout = async () => {
    cancelAllScheduledReminders();
    if (user?.uid) {
      clearUserAICache(user.uid);
    }
    localStorage.removeItem('datefund_session_user');
    try {
      await signOut(auth);
    } catch (error) {
      console.warn("Logout notification:", error);
    }
    setIsDemoMode(false);
    setUser(null);
    setUserProfile(null);
    setGoals([]);
    setTransactions([]);
    setEvents([]);
    setBucketList([]);
    setBreakUpData(null);
    setDailyAdvice(null);
    setSoloDateIdea(null);
    setActiveReminders([]);
    setProfileData({
      displayName: '',
      photoURL: AVATAR_NAV
    });
    setView('home');
  };

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newGoal.name || !newGoal.target || !newGoal.deadline) {
      setToast("Please fill in all fields.");
      return;
    }
    
    const target = parseFloat(newGoal.target);
    if (isNaN(target) || target <= 0) {
      setToast("Target amount must be a positive number.");
      return;
    }

    if (isDemoMode) {
      if (editingGoal) {
        const updatedGoal: Goal = {
          ...editingGoal,
          name: newGoal.name,
          targetAmount: target,
          deadline: newGoal.deadline
        };
        setGoals(prev => prev.map(g => g.id === editingGoal.id ? updatedGoal : g));
        setEditingGoal(null);
        setNewGoal({ name: '', target: '', deadline: '' });
        setIsGoalModalOpen(false);
        setToast("Dream updated! ✨");
        return;
      }
      const goalId = 'demo_' + Math.random().toString(36).substr(2, 9);
      const goal: Goal = {
        id: goalId,
        ownerUid: user.uid,
        collaborators: [user.uid],
        name: newGoal.name,
        targetAmount: target,
        currentAmount: 0,
        deadline: newGoal.deadline,
        createdAt: new Date().toISOString()
      };
      setGoals(prev => [goal, ...prev]);
      hapticMedium();
      setNewGoal({ name: '', target: '', deadline: '' });
      setIsGoalModalOpen(false);
      setToast("New dream goal planted! 🌱");
      return;
    }

    if (editingGoal) {
      const updatedGoal: Goal = {
        ...editingGoal,
        name: newGoal.name,
        targetAmount: target,
        deadline: newGoal.deadline
      };
      try {
        await setDoc(doc(db, 'goals', editingGoal.id), updatedGoal);
        setGoals(prev => prev.map(g => g.id === editingGoal.id ? updatedGoal : g));
        setToast("Dream updated! ✨");
      } catch (err) {
        setGoals(prev => prev.map(g => g.id === editingGoal.id ? updatedGoal : g));
        setToast("Dream updated! ✨");
      }
      setEditingGoal(null);
      setNewGoal({ name: '', target: '', deadline: '' });
      setIsGoalModalOpen(false);
      return;
    }
    
    const goalId = Math.random().toString(36).substr(2, 9);
    const goal: Goal = {
      id: goalId,
      ownerUid: user.uid,
      collaborators: [user.uid],
      name: newGoal.name,
      targetAmount: parseFloat(newGoal.target),
      currentAmount: 0,
      deadline: newGoal.deadline,
      createdAt: new Date().toISOString()
    };
    
    try {
      await setDoc(doc(db, 'goals', goalId), goal);
      hapticMedium();
      setNewGoal({ name: '', target: '', deadline: '' });
      setIsGoalModalOpen(false);
      setToast("New dream goal planted! 🌱");
    } catch (err) {
      console.warn("Firestore goal create notice, updating locally:", err);
      setGoals(prev => [goal, ...prev]);
      hapticMedium();
      setNewGoal({ name: '', target: '', deadline: '' });
      setIsGoalModalOpen(false);
      setToast("New dream goal planted! 🌱");
    }
  };

  const triggerGoalCelebration = (goalName: string) => {
    try {
      hapticCelebration();
      // Romantic blush, berry, gold confetti burst
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#b32656', '#e06d95', '#ffd700', '#fce7f3', '#ffffff'],
        disableForReducedMotion: true,
      });

      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 60,
          origin: { x: 0.05, y: 0.65 },
          colors: ['#b32656', '#f43f5e', '#fb7185', '#ffd700'],
          disableForReducedMotion: true,
        });
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 60,
          origin: { x: 0.95, y: 0.65 },
          colors: ['#b32656', '#f43f5e', '#fb7185', '#ffd700'],
          disableForReducedMotion: true,
        });
      }, 250);

      setToast(`🎉 100% Goal Reached! "${goalName}" is fully funded! 🥂💖`);
    } catch (e) {
      console.warn("Confetti animation notice:", e);
    }
  };

  const handleAddFunds = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !fundData.goalId || !fundData.amount) return;

    const amount = parseFloat(fundData.amount);
    const goal = goals.find(g => g.id === fundData.goalId);
    if (!goal) return;

    const newAmount = goal.currentAmount + amount;
    const reached100 = newAmount >= goal.targetAmount && goal.currentAmount < goal.targetAmount;

    const transactionId = Math.random().toString(36).substr(2, 9);
    const transaction: Transaction = {
      id: transactionId,
      ownerUid: user.uid,
      goalId: fundData.goalId,
      goalName: goal.name,
      amount: amount,
      date: new Date().toISOString().split('T')[0],
      contributor: fundData.contributor,
      type: 'deposit',
      createdAt: new Date().toISOString()
    };

    if (isDemoMode) {
      setTransactions(prev => [transaction, ...prev]);
      setGoals(prev => prev.map(g => g.id === goal.id ? { ...g, currentAmount: newAmount } : g));
      if (reached100) {
        triggerGoalCelebration(goal.name);
      } else {
        hapticSuccess();
        setToast("Added funds successfully! 💸");
      }
      setFundData({ goalId: '', amount: '', contributor: 'Me' });
      setIsFundModalOpen(false);
      // Post celebratory deposit card into Partner Chat
      void handlePostDepositCelebration({
        goalId: goal.id,
        goalName: goal.name,
        amount,
        newCurrentAmount: newAmount,
        targetAmount: goal.targetAmount,
        contributor: fundData.contributor
      });
      return;
    }

    try {
      await setDoc(doc(db, 'transactions', transactionId), transaction);
      await setDoc(doc(db, 'goals', goal.id), {
        ...goal,
        currentAmount: newAmount
      });
      if (reached100) {
        triggerGoalCelebration(goal.name);
      } else {
        hapticSuccess();
        setToast("Added funds successfully! 💸");
      }
      setFundData({ goalId: '', amount: '', contributor: 'Me' });
      setIsFundModalOpen(false);
      void handlePostDepositCelebration({
        goalId: goal.id,
        goalName: goal.name,
        amount,
        newCurrentAmount: newAmount,
        targetAmount: goal.targetAmount,
        contributor: fundData.contributor
      });
    } catch (err) {
      console.warn("Firestore funds notice, updating locally:", err);
      setTransactions(prev => [transaction, ...prev]);
      setGoals(prev => prev.map(g => g.id === goal.id ? { ...g, currentAmount: newAmount } : g));
      if (reached100) {
        triggerGoalCelebration(goal.name);
      } else {
        hapticSuccess();
        setToast("Added funds successfully! 💸");
      }
      setFundData({ goalId: '', amount: '', contributor: 'Me' });
      setIsFundModalOpen(false);
      void handlePostDepositCelebration({
        goalId: goal.id,
        goalName: goal.name,
        amount,
        newCurrentAmount: newAmount,
        targetAmount: goal.targetAmount,
        contributor: fundData.contributor
      });
    }
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newEvent.title || !newEvent.date) return;

    const eventId = Math.random().toString(36).substr(2, 9);
    const event: Event = {
      id: eventId,
      ownerUid: user.uid,
      title: newEvent.title,
      description: newEvent.description,
      date: newEvent.date,
      time: newEvent.time,
      location: newEvent.location,
      goalId: newEvent.goalId,
      reminder: newEvent.reminder,
      reminderMinutes: newEvent.reminderMinutes,
      tags: newEvent.tags,
      mood: newEvent.mood || 'Romantic',
      isMystery: newEvent.isMystery,
      mysteryRevealed: false,
      mysteryClue: newEvent.mysteryClue,
      collaborators: [user.uid],
      rsvps: { [user.uid]: 'Going' },
      createdAt: new Date().toISOString()
    };

    if (isDemoMode) {
      setEvents(prev => [...prev, event]);
      hapticMedium();

      if (newEvent.reminder && newEvent.date) {
        const eventDateTime = new Date(`${newEvent.date}T${newEvent.time || '18:00'}`);
        const reminderTime = new Date(eventDateTime.getTime() - (newEvent.reminderMinutes || 15) * 60000);
        scheduleDateReminder({
          id: Math.floor(Math.random() * 100000),
          title: `Date Night Reminder: ${newEvent.title}`,
          body: `Upcoming at ${newEvent.time || 'tonight'}! ${newEvent.location ? `Location: ${newEvent.location}` : ''}`,
          scheduleDate: reminderTime
        });
      }

      setNewEvent({ 
        title: '', 
        description: '', 
        date: '', 
        time: '', 
        location: '', 
        goalId: '', 
        reminder: false, 
        reminderMinutes: 15, 
        tags: [],
        mood: 'Romantic',
        isMystery: false,
        mysteryClue: ''
      });
      setIsEventModalOpen(false);
      setToast(newEvent.isMystery ? "Mystery date planned! Shhh... 🤫" : "Date added to planner! 🥂");
      return;
    }

    try {
      await setDoc(doc(db, 'events', eventId), event);
      hapticMedium();

      // Schedule local notification if reminder enabled
      if (newEvent.reminder && newEvent.date) {
        const eventDateTime = new Date(`${newEvent.date}T${newEvent.time || '18:00'}`);
        const reminderTime = new Date(eventDateTime.getTime() - (newEvent.reminderMinutes || 15) * 60000);
        scheduleDateReminder({
          id: Math.floor(Math.random() * 100000),
          title: `Date Night Reminder: ${newEvent.title}`,
          body: `Upcoming at ${newEvent.time || 'tonight'}! ${newEvent.location ? `Location: ${newEvent.location}` : ''}`,
          scheduleDate: reminderTime
        });
      }

      setNewEvent({ 
        title: '', 
        description: '', 
        date: '', 
        time: '', 
        location: '', 
        goalId: '', 
        reminder: false, 
        reminderMinutes: 15, 
        tags: [],
        mood: 'Romantic',
        isMystery: false,
        mysteryClue: ''
      });
      setIsEventModalOpen(false);
      setToast(newEvent.isMystery ? "Mystery date planned! Shhh... 🤫" : "Date added to planner! 🥂");
    } catch (err) {
      console.warn("Firestore event notice, updating locally:", err);
      setEvents(prev => [...prev, event]);
      hapticMedium();
      setNewEvent({ 
        title: '', 
        description: '', 
        date: '', 
        time: '', 
        location: '', 
        goalId: '', 
        reminder: false, 
        reminderMinutes: 15, 
        tags: [],
        mood: 'Romantic',
        isMystery: false,
        mysteryClue: ''
      });
      setIsEventModalOpen(false);
      setToast(newEvent.isMystery ? "Mystery date planned! Shhh... 🤫" : "Date added to planner! 🥂");
    }
  };

  const handleBreakUp = () => {
    let meTotal = 0;
    let themTotal = 0;
    let affectedCount = 0;

    goals.forEach(goal => {
      if (goal.collaborators.length > 1) {
        affectedCount++;
        const goalTransactions = transactions.filter(t => t.goalId === goal.id);
        goalTransactions.forEach(t => {
          if (t.contributor === 'Me') meTotal += t.amount;
          else themTotal += t.amount;
        });
      }
    });

    setBreakUpData({ me: meTotal, them: themTotal, goalsAffected: affectedCount });
    setIsBreakUpSummaryOpen(true);
    setIsRelationshipModalOpen(false);
  };

  const finalizeBreakUp = async () => {
    if (!user) return;
    try {
      const sharedGoals = goals.filter(g => g.collaborators.length > 1);
      for (const goal of sharedGoals) {
        const goalTransactions = transactions.filter(t => t.goalId === goal.id);
        for (const t of goalTransactions) {
          await deleteDoc(doc(db, 'transactions', t.id));
        }
        await deleteDoc(doc(db, 'goals', goal.id));
      }
      setToast("Relationship ended. Funds split and shared dreams archived.");
      setIsBreakUpSummaryOpen(false);
    } catch (err) {
      console.error("Break up failed", err);
      setToast("Failed to finalize split.");
    }
  };

  const getEncouragement = async () => {
    setIsAdviceLoading(true);
    try {
      const advice = await getSoloEncouragement();
      setDailyAdvice(advice);
    } catch (error) {
      setDailyAdvice("Focus on your growth; the best is yet to come.");
    } finally {
      setIsAdviceLoading(false);
    }
  };

  const getSoloDateIdea = async () => {
    setIsAdviceLoading(true);
    try {
      const idea = await getSoloDateIdea();
      setSoloDateIdea(idea);
    } catch (error) {
      setToast("Failed to get solo date idea.");
    } finally {
      setIsAdviceLoading(false);
    }
  };

  const handleUpdateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !editingEvent || !editingEvent.title || !editingEvent.date) return;

    try {
      await setDoc(doc(db, 'events', editingEvent.id), editingEvent);
      setEditingEvent(null);
      setIsEventModalOpen(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `events/${editingEvent.id}`);
    }
  };

  const toggleEventCompletion = async (event: Event) => {
    if (!user) return;
    const isNowCompleted = !event.completed;
    try {
      await setDoc(doc(db, 'events', event.id), {
        completed: isNowCompleted
      }, { merge: true });

      if (isNowCompleted) {
        hapticCelebration();
        setToast("Date completed! 🎉 Scrapbook memory opened.");
        // Open scrapbook directly so couples can write their note and rating
        setIsScrapbookModalOpen(true);
      } else {
        hapticLight();
        setToast("Date marked as upcoming");
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `events/${event.id}`);
    }
  };

  const handleSaveMemory = async (eventId: string, memory: DateMemory) => {
    if (!user) return;
    try {
      await setDoc(doc(db, 'events', eventId), {
        memory,
        completed: true
      }, { merge: true });
      hapticSuccess();
      setToast("Cherished memory saved to scrapbook! 💖");
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `events/${eventId}`);
    }
  };

  const handleRevealMystery = async (eventId: string) => {
    if (!user) return;
    try {
      await setDoc(doc(db, 'events', eventId), {
        mysteryRevealed: true
      }, { merge: true });
      hapticCelebration();
      setToast("Mystery date revealed! Enjoy your night! ✨");
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `events/${eventId}`);
    }
  };

  const handleConnectPartner = async (partnerUid: string) => {
    if (!user || !partnerUid || partnerUid === user.uid) {
      setToast("Invalid partner code.");
      return;
    }
    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, { partnerUid }, { merge: true });
      // Add collaborator to all user's goals
      for (const g of goals.filter(g => g.ownerUid === user.uid)) {
        if (!g.collaborators.includes(partnerUid)) {
          await setDoc(doc(db, 'goals', g.id), {
            collaborators: [...g.collaborators, partnerUid]
          }, { merge: true });
        }
      }
      hapticSuccess();
      setToast("Partner linked! Shared dreams and ledger synced. 🥂");
    } catch (err) {
      console.error("Partner connect failed", err);
      setToast("Failed to link partner.");
    }
  };

  const handleUpdateRelationshipStartDate = async (date: string) => {
    if (!user) return;
    try {
      setRelationshipStartDate(date);
      await setDoc(doc(db, 'users', user.uid), {
        relationshipStartDate: date
      }, { merge: true });
      hapticSuccess();
      setToast("Anniversary date saved! ❤️");
    } catch (err) {
      console.warn("Failed to update anniversary date", err);
    }
  };

  const handleAddBucketItem = async (item: Omit<BucketListItem, 'id' | 'createdAt'>) => {
    if (!user) return;
    const id = Math.random().toString(36).substr(2, 9);
    const newItem: BucketListItem = {
      ...item,
      id,
      createdAt: new Date().toISOString()
    };
    setBucketList(prev => [newItem, ...prev]);
    try {
      await setDoc(doc(db, 'users', user.uid, 'bucketList', id), newItem);
      hapticSuccess();
      setToast("Added to date wishlist! 🔖");
    } catch (err) {
      console.warn("Bucket item saved locally", err);
    }
  };

  const handleRemoveBucketItem = async (id: string) => {
    if (!user) return;
    setBucketList(prev => prev.filter(b => b.id !== id));
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'bucketList', id));
      setToast("Wishlist item removed.");
    } catch (err) {
      console.warn("Remove bucket item failed", err);
    }
  };

  const handlePlanDateFromBucket = (item: BucketListItem) => {
    setEditingEvent(null);
    setNewEvent({
      title: item.title,
      description: item.notes || `Romantic wishlist date: ${item.category}`,
      date: new Date().toISOString().split('T')[0],
      time: '19:00',
      location: '',
      goalId: '',
      reminder: true,
      reminderMinutes: 60,
      tags: [item.category, 'Wishlist'],
      isMystery: false,
      mysteryClue: ''
    });
    setIsEventModalOpen(true);
  };

  const handleSaveGoalFromBucket = (item: BucketListItem) => {
    const futureDate = new Date();
    futureDate.setMonth(futureDate.getMonth() + 2);
    setNewGoal({
      name: item.title,
      target: item.estimatedBudget.toString(),
      deadline: futureDate.toISOString().split('T')[0]
    });
    setIsGoalModalOpen(true);
  };

  const handleQuickAddDeposit = async (amount: number, contributor: 'Me' | 'Them') => {
    if (!user || goals.length === 0) {
      setToast("Plant a dream goal first to record deposits!");
      return;
    }
    const targetGoal = goals[0];
    const transactionId = Math.random().toString(36).substr(2, 9);
    const transaction: Transaction = {
      id: transactionId,
      ownerUid: user.uid,
      goalId: targetGoal.id,
      goalName: targetGoal.name,
      amount: amount,
      date: new Date().toISOString().split('T')[0],
      contributor: contributor,
      type: 'deposit',
      createdAt: new Date().toISOString()
    };
    try {
      await setDoc(doc(db, 'transactions', transactionId), transaction);
      await setDoc(doc(db, 'goals', targetGoal.id), {
        ...targetGoal,
        currentAmount: targetGoal.currentAmount + amount
      });
      hapticSuccess();
      setToast(`R ${amount.toFixed(2)} treat recorded by ${contributor}! 🥂`);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'transactions/goals');
    }
  };

  const deleteGoal = async (id: string) => {
    setGoalToDelete(id);
  };

  const confirmDeleteGoal = async () => {
    if (!goalToDelete) return;
    const targetId = goalToDelete;
    setGoalToDelete(null);
    setGoals(prev => prev.filter(g => g.id !== targetId));
    if (isDemoMode) {
      setToast("Goal deleted successfully.");
      return;
    }
    try {
      await deleteDoc(doc(db, 'goals', targetId));
      setToast("Goal deleted successfully.");
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `goals/${targetId}`);
    }
  };

  const deleteEvent = async (id: string) => {
    setEventToDelete(id);
  };

  const confirmDeleteEvent = async () => {
    if (!eventToDelete) return;
    const targetId = eventToDelete;
    setEventToDelete(null);
    setEvents(prev => prev.filter(e => e.id !== targetId));
    if (isDemoMode) {
      setToast("Date deleted successfully.");
      return;
    }
    try {
      await deleteDoc(doc(db, 'events', targetId));
      setToast("Date deleted successfully.");
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `events/${targetId}`);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        displayName: profileData.displayName,
        photoURL: profileData.photoURL
      }, { merge: true });
      setToast("Profile updated successfully!");
      setIsProfileModalOpen(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
    }
  };

  const handleRecordContribution = async (data: {
    goalId: string;
    amount: number;
    contributor: 'Me' | 'Them';
    note?: string;
  }) => {
    if (!user) return;
    const targetGoal = goals.find(g => g.id === data.goalId);
    if (!targetGoal) return;

    const transactionId = Math.random().toString(36).substr(2, 9);
    const transaction: Transaction = {
      id: transactionId,
      ownerUid: user.uid,
      goalId: targetGoal.id,
      goalName: targetGoal.name,
      amount: data.amount,
      date: new Date().toISOString().split('T')[0],
      contributor: data.contributor,
      type: 'deposit',
      notes: data.note,
      createdAt: new Date().toISOString()
    };

    const newAmount = targetGoal.currentAmount + data.amount;
    const reached100 = newAmount >= targetGoal.targetAmount && targetGoal.currentAmount < targetGoal.targetAmount;

    try {
      await setDoc(doc(db, 'transactions', transactionId), transaction);
      await setDoc(doc(db, 'goals', targetGoal.id), {
        ...targetGoal,
        currentAmount: newAmount
      });
      if (reached100) {
        triggerGoalCelebration(targetGoal.name);
      } else {
        hapticSuccess();
        setToast(`Recorded R ${data.amount.toFixed(2)} contribution by ${data.contributor}! 🥂`);
      }
      setIsFundModalOpen(false);
      void handlePostDepositCelebration({
        goalId: targetGoal.id,
        goalName: targetGoal.name,
        amount: data.amount,
        newCurrentAmount: newAmount,
        targetAmount: targetGoal.targetAmount,
        contributor: data.contributor
      });
    } catch (err) {
      setTransactions(prev => [transaction, ...prev]);
      setGoals(prev => prev.map(g => g.id === targetGoal.id ? { ...g, currentAmount: newAmount } : g));
      if (reached100) {
        triggerGoalCelebration(targetGoal.name);
      } else {
        hapticSuccess();
        setToast(`Recorded R ${data.amount.toFixed(2)} contribution by ${data.contributor}! 🥂`);
      }
      setIsFundModalOpen(false);
      void handlePostDepositCelebration({
        goalId: targetGoal.id,
        goalName: targetGoal.name,
        amount: data.amount,
        newCurrentAmount: newAmount,
        targetAmount: targetGoal.targetAmount,
        contributor: data.contributor
      });
    }
  };

  // ============================================================================
  // PARTNER CHAT 2.0 HANDLERS & UNREAD / READ-RECEIPT SYNC
  // ============================================================================
  const resolvedPartnerUid = useMemo(() => {
    if (userProfile?.partnerUid && userProfile.partnerUid !== user?.uid) return userProfile.partnerUid;
    if (relationshipData?.partnerUid && relationshipData.partnerUid !== user?.uid) return relationshipData.partnerUid;
    for (const g of goals) {
      const other = g.collaborators?.find(uid => uid !== user?.uid);
      if (other) return other;
    }
    for (const e of events) {
      const other = e.collaborators?.find(uid => uid !== user?.uid);
      if (other) return other;
    }
    if (isDemoMode) return 'demo_partner_alex';
    return undefined;
  }, [userProfile, relationshipData, goals, events, user, isDemoMode]);

  const unreadChatCount = useMemo(() => {
    if (!user) return 0;
    return messages.filter(
      m => m.senderUid !== user.uid && !(m.readBy || []).includes(user.uid)
    ).length;
  }, [messages, user]);

  // Automatically mark unread incoming partner messages as read when Chat view or Quick Chat is open
  useEffect(() => {
    if (!user || (view !== 'chat' && !isQuickChatOpen)) return;
    const unreadIncoming = messages.filter(
      m => m.senderUid !== user.uid && !(m.readBy || []).includes(user.uid)
    );
    if (unreadIncoming.length === 0) return;

    setMessages(prev =>
      prev.map(m =>
        m.senderUid !== user.uid && !(m.readBy || []).includes(user.uid)
          ? { ...m, readBy: Array.from(new Set([...(m.readBy || []), user.uid])) }
          : m
      )
    );

    if (!isDemoMode) {
      unreadIncoming.forEach(async msg => {
        try {
          const updatedReadBy = Array.from(new Set([...(msg.readBy || []), user.uid])).slice(0, 5);
          await setDoc(
            doc(db, 'messages', msg.id),
            { readBy: updatedReadBy },
            { merge: true }
          );
        } catch {
          // Ignore transient permission/offline notices
        }
      });
    }
  }, [view, isQuickChatOpen, messages, user, isDemoMode]);

  const handleSendMessage = async (payload: {
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
  }) => {
    if (!user) return;
    const messageId = 'msg_' + Math.random().toString(36).substring(2, 11);
    const participants = Array.from(
      new Set([user.uid, ...(resolvedPartnerUid ? [resolvedPartnerUid] : [])])
    ).slice(0, 4);

    const newMsg: PartnerMessage = {
      id: messageId,
      senderUid: user.uid,
      senderName: (profileData.displayName || user.displayName || 'You').slice(0, 100),
      senderPhoto: profileData.photoURL || user.photoURL || AVATAR_ME,
      participants,
      text: payload.text.slice(0, 1000),
      messageType: payload.messageType,
      ...(payload.linkedGoalId ? { linkedGoalId: payload.linkedGoalId } : {}),
      ...(payload.linkedGoalName ? { linkedGoalName: payload.linkedGoalName.slice(0, 150) } : {}),
      ...(payload.linkedEventId ? { linkedEventId: payload.linkedEventId } : {}),
      ...(payload.linkedEventTitle ? { linkedEventTitle: payload.linkedEventTitle.slice(0, 200) } : {}),
      ...(payload.linkedSpot ? { linkedSpot: payload.linkedSpot } : {}),
      ...(payload.pollData ? { pollData: payload.pollData, pollVotes: { [user.uid]: payload.pollData.options[0]?.id || 'opt_1' } } : {}),
      ...(payload.depositData ? { depositData: payload.depositData } : {}),
      ...(payload.replyTo ? { replyTo: payload.replyTo } : {}),
      reactions: {},
      readBy: [user.uid],
      createdAt: new Date().toISOString()
    };

    setMessages(prev => [...prev, newMsg]);

    if (isDemoMode) return;

    try {
      await setDoc(doc(db, 'messages', messageId), newMsg);
    } catch (err) {
      console.warn('Message saved locally:', err);
    }
  };

  const handlePostDepositCelebration = async (depositData: DepositCelebrationPayload) => {
    if (!user) return;
    const pct =
      depositData.targetAmount > 0
        ? Math.min(100, Math.round((depositData.newCurrentAmount / depositData.targetAmount) * 100))
        : 0;
    await handleSendMessage({
      text: `🥂 Added ${formatRand(depositData.amount)} to "${depositData.goalName}"! We are now at ${pct}% (${formatRand(depositData.newCurrentAmount)} of ${formatRand(depositData.targetAmount)}).`,
      messageType: 'deposit_celebration',
      linkedGoalId: depositData.goalId,
      linkedGoalName: depositData.goalName,
      depositData
    });
  };

  const handleShareSpotToChat = async (spot: SharedSpotPayload) => {
    if (!user) return;
    await handleSendMessage({
      text: `What do you think about "${spot.name}" (${spot.location}) for our next date? ✨`,
      messageType: 'spot_share',
      linkedSpot: spot
    });
    setToast(`Shared "${spot.name}" to Partner Chat! 💬`);
    setIsQuickChatOpen(true);
  };

  const handleToggleReaction = async (messageId: string, emoji: string) => {
    if (!user) return;
    const target = messages.find(m => m.id === messageId);
    if (!target) return;
    const nextReactions = { ...(target.reactions || {}) };
    if (nextReactions[user.uid] === emoji) {
      delete nextReactions[user.uid];
    } else {
      nextReactions[user.uid] = emoji;
    }

    setMessages(prev =>
      prev.map(m => (m.id === messageId ? { ...m, reactions: nextReactions } : m))
    );

    if (isDemoMode) return;
    try {
      await setDoc(doc(db, 'messages', messageId), { reactions: nextReactions }, { merge: true });
    } catch (err) {
      console.warn('Reaction update local fallback:', err);
    }
  };

  const handleTogglePinMessage = async (messageId: string) => {
    if (!user) return;
    const target = messages.find(m => m.id === messageId);
    if (!target) return;
    const nextPinned = !target.isPinned;

    setMessages(prev =>
      prev.map(m => (m.id === messageId ? { ...m, isPinned: nextPinned } : m))
    );
    setToast(nextPinned ? 'Pinned to Couple Reminders 📌' : 'Reminder unpinned');

    if (isDemoMode) return;
    try {
      await setDoc(doc(db, 'messages', messageId), { isPinned: nextPinned }, { merge: true });
    } catch (err) {
      console.warn('Pin update local fallback:', err);
    }
  };

  const handleVoteSpot = async (messageId: string, vote: 'up' | 'down') => {
    if (!user) return;
    const target = messages.find(m => m.id === messageId);
    if (!target) return;
    const currentVotes = { ...(target.spotVotes || {}) };
    if (currentVotes[user.uid] === vote) {
      delete currentVotes[user.uid];
    } else {
      currentVotes[user.uid] = vote;
    }

    setMessages(prev =>
      prev.map(m => (m.id === messageId ? { ...m, spotVotes: currentVotes } : m))
    );

    if (isDemoMode) return;
    try {
      await setDoc(doc(db, 'messages', messageId), { spotVotes: currentVotes }, { merge: true });
    } catch (err) {
      console.warn('Spot vote local fallback:', err);
    }
  };

  const handleVotePoll = async (messageId: string, optionId: string) => {
    if (!user) return;
    const target = messages.find(m => m.id === messageId);
    if (!target) return;
    const nextPollVotes = { ...(target.pollVotes || {}), [user.uid]: optionId };

    setMessages(prev =>
      prev.map(m => (m.id === messageId ? { ...m, pollVotes: nextPollVotes } : m))
    );

    if (isDemoMode) return;
    try {
      await setDoc(doc(db, 'messages', messageId), { pollVotes: nextPollVotes }, { merge: true });
    } catch (err) {
      console.warn('Poll vote local fallback:', err);
    }
  };

  const handleRespondDateInvite = async (
    messageId: string,
    status: 'going' | 'reschedule',
    linkedEventId?: string
  ) => {
    if (!user) return;
    const target = messages.find(m => m.id === messageId);
    if (!target) return;
    const nextRsvp = { ...(target.rsvpStatus || {}), [user.uid]: status };

    setMessages(prev =>
      prev.map(m => (m.id === messageId ? { ...m, rsvpStatus: nextRsvp } : m))
    );
    setToast(status === 'going' ? "RSVP confirmed: I'm In! 🥂" : 'Requested a new time 🕰️');

    if (linkedEventId) {
      const targetEv = events.find(ev => ev.id === linkedEventId);
      if (targetEv) {
        const mappedStatus = status === 'going' ? 'Going' : 'Maybe';
        const updatedRsvps = { ...(targetEv.rsvps || {}), [user.uid]: mappedStatus as 'Going' | 'Maybe' };
        setEvents(prev =>
          prev.map(ev => (ev.id === linkedEventId ? { ...ev, rsvps: updatedRsvps } : ev))
        );
        if (!isDemoMode) {
          try {
            await setDoc(doc(db, 'events', linkedEventId), { rsvps: updatedRsvps }, { merge: true });
          } catch {
            // Ignore
          }
        }
      }
    }

    if (isDemoMode) return;
    try {
      await setDoc(doc(db, 'messages', messageId), { rsvpStatus: nextRsvp }, { merge: true });
    } catch (err) {
      console.warn('RSVP update local fallback:', err);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!user) return;
    setMessages(prev => prev.filter(m => m.id !== messageId));
    if (isDemoMode) return;
    try {
      await deleteDoc(doc(db, 'messages', messageId));
    } catch (err) {
      console.warn('Message delete local fallback:', err);
    }
  };

  const handleSaveAdjustedGoal = async (updatedGoal: Goal) => {
    if (!user) return;
    try {
      await setDoc(doc(db, 'goals', updatedGoal.id), updatedGoal);
      setGoals(prev => prev.map(g => g.id === updatedGoal.id ? updatedGoal : g));
      setToast("Savings plan updated! 🎯");
    } catch (err) {
      setGoals(prev => prev.map(g => g.id === updatedGoal.id ? updatedGoal : g));
      setToast("Savings plan updated! 🎯");
    }
    setGoalToAdjust(null);
  };

  const handleArchiveGoal = async (goalId: string) => {
    if (!user) return;
    const target = goals.find(g => g.id === goalId);
    if (!target) return;
    const updated: Goal = { ...target, archived: true, archivedAt: new Date().toISOString() };
    try {
      await setDoc(doc(db, 'goals', goalId), updated);
      setGoals(prev => prev.map(g => g.id === goalId ? updated : g));
      setToast("Goal moved to archive. 📦");
    } catch (err) {
      setGoals(prev => prev.map(g => g.id === goalId ? updated : g));
      setToast("Goal moved to archive. 📦");
    }
    setGoalToAdjust(null);
  };

  const handleUnarchiveGoal = async (goalId: string) => {
    if (!user) return;
    const target = goals.find(g => g.id === goalId);
    if (!target) return;
    const updated: Goal = { ...target, archived: false };
    delete updated.archivedAt;
    try {
      await setDoc(doc(db, 'goals', goalId), updated);
      setGoals(prev => prev.map(g => g.id === goalId ? updated : g));
      setToast("Goal restored to active dreams! 🌱");
    } catch (err) {
      setGoals(prev => prev.map(g => g.id === goalId ? updated : g));
      setToast("Goal restored to active dreams! 🌱");
    }
  };

  const handleUpdatePartner = async (updated: Partial<RelationshipData>) => {
    if (!user) return;
    setRelationshipData(prev => ({
      status: 'connected',
      partnerUid: 'partner_sample',
      partnerName: 'Partner',
      partnerEmail: 'partner@datefund.app',
      partnerAvatar: AVATAR_THEM,
      connectedAt: '2024-02-14',
      anniversaryDate: relationshipStartDate,
      ...prev,
      ...updated,
    }));
    setToast("Partner details updated!");
  };

  const handleDisconnectPartner = async () => {
    if (!user) return;
    setRelationshipData(undefined);
    setToast("Partner disconnected. Shared records archived.");
  };

  const handleUpdateProfileAvatar = async (avatarUrl: string) => {
    if (!user) return;
    setProfileData(prev => ({ ...prev, photoURL: avatarUrl }));
    try {
      await setDoc(doc(db, 'users', user.uid), { photoURL: avatarUrl }, { merge: true });
      setToast("Profile photo updated! ✨");
    } catch {
      setToast("Profile photo updated locally! ✨");
    }
  };

  const handleAddAuditCorrection = async (originalTx: Transaction, correctionNote: string) => {
    if (!user) return;
    const correctionId = Math.random().toString(36).substr(2, 9);
    const correctionTx: Transaction = {
      id: correctionId,
      ownerUid: user.uid,
      goalId: originalTx.goalId,
      goalName: `Correction: ${originalTx.goalName}`,
      amount: -originalTx.amount,
      date: new Date().toISOString().split('T')[0],
      contributor: originalTx.contributor,
      type: 'withdrawal',
      notes: `Reversal of tx ${originalTx.id}: ${correctionNote}`,
      createdAt: new Date().toISOString()
    };
    try {
      await setDoc(doc(db, 'transactions', correctionId), correctionTx);
      const targetGoal = goals.find(g => g.id === originalTx.goalId);
      if (targetGoal) {
        await setDoc(doc(db, 'goals', targetGoal.id), {
          ...targetGoal,
          currentAmount: Math.max(0, targetGoal.currentAmount - originalTx.amount)
        });
      }
      setToast("Audit correction recorded.");
    } catch {
      setTransactions(prev => [correctionTx, ...prev]);
      setToast("Audit correction recorded locally.");
    }
  };


  const sortedEvents = useMemo(() => {
    let list = [...events];
    if (plannerMoodFilter !== 'all') {
      list = list.filter(e => (e.mood || 'Romantic') === plannerMoodFilter);
    }
    return list.sort((a, b) => {
      if (plannerSort === 'date') {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      }
      if (plannerSort === 'time') {
        const timeA = a.time || '00:00';
        const timeB = b.time || '00:00';
        return timeA.localeCompare(timeB);
      }
      if (plannerSort === 'title') {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });
  }, [events, plannerSort, plannerMoodFilter]);

  const handleSuggestIdea = async () => {
    if (!user) return;
    setIsSuggesting(true);
    try {
      const goalsContext = goals.map(g => ({ name: g.name, targetAmount: g.targetAmount }));
      const eventsContext = events.map(e => ({ title: e.title, tags: e.tags }));
      const idea = await suggestDateIdea(goalsContext, eventsContext);
      setSuggestedIdea(idea);
      setIsSuggestionModalOpen(true);
    } catch (err) {
      console.error("Failed to get suggestion:", err);
      setToast("AI is feeling shy right now. Try again later!");
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleJoinEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !joinEventId) return;

    try {
      const eventRef = doc(db, 'events', joinEventId);
      const eventSnap = await getDoc(eventRef);
      
      if (!eventSnap.exists()) {
        setToast("Date not found. Please check the invitation code.");
        return;
      }

      const eventData = eventSnap.data() as Event;
      if (eventData.collaborators.includes(user.uid)) {
        setToast("You are already part of this date night!");
        setIsJoinEventModalOpen(false);
        return;
      }

      await setDoc(eventRef, {
        collaborators: [...eventData.collaborators, user.uid],
        rsvps: { ...eventData.rsvps, [user.uid]: 'Going' }
      }, { merge: true });

      setToast("Joined date night successfully! 🥂");
      setJoinEventId('');
      setIsJoinEventModalOpen(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `events/${joinEventId}`);
    }
  };

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background text-on-surface flex flex-col items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md space-y-8"
        >
          <div className="text-center space-y-3">
            <h1 className="text-7xl font-serif text-primary tracking-tight">DateFund</h1>
            <p className="text-outline/60 tracking-[0.3em] uppercase text-xs font-bold">Editorial Savings for Couples</p>
          </div>

          <div className="bg-surface-container rounded-[2.5rem] p-10 shadow-2xl border border-outline-variant/10 backdrop-blur-xl">
            <h2 className="text-3xl font-serif mb-8 text-center">
              {authMode === 'signin' ? 'Welcome Back' : 'Join the Journey'}
            </h2>

            <form onSubmit={handleEmailAuth} className="space-y-8">
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest font-bold text-outline/70 ml-1">Email Address</label>
                <input 
                  type="email" 
                  placeholder="you@example.com"
                  className={`w-full bg-surface-container-high/50 border-2 rounded-2xl px-5 py-4 outline-none transition-all font-sans text-base ${emailError ? 'border-error' : 'border-outline-variant/20 focus:border-primary shadow-inner'}`}
                  value={email}
                  onChange={e => {
                    setEmail(e.target.value);
                    if (emailError) setEmailError('');
                  }}
                />
                {emailError && <p className="text-error text-xs font-bold uppercase tracking-tight mt-1.5 ml-1">{emailError}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest font-bold text-outline/70 ml-1">Password</label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    placeholder="••••••••"
                    className={`w-full bg-surface-container-high/50 border-2 rounded-2xl px-5 py-4 pr-12 outline-none transition-all font-sans text-base ${passwordError ? 'border-error' : 'border-outline-variant/20 focus:border-primary shadow-inner'}`}
                    value={password}
                    onChange={e => {
                      setPassword(e.target.value);
                      if (passwordError) setPasswordError('');
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-outline/60 hover:text-on-surface p-1 transition-colors cursor-pointer"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {passwordError && <p className="text-error text-xs font-bold uppercase tracking-tight mt-1.5 ml-1">{passwordError}</p>}
                
                {authMode === 'signin' && (
                  <div className="flex justify-end pt-2">
                    <button 
                      type="button"
                      onClick={handleForgotPassword}
                      disabled={isResettingPassword}
                      className="text-xs uppercase tracking-widest font-bold text-primary hover:text-primary-container transition-colors disabled:opacity-50"
                    >
                      {isResettingPassword ? 'Sending...' : 'Forgot Password?'}
                    </button>
                  </div>
                )}

                {authMode === 'signup' && password && (
                  <div className="mt-6 space-y-3">
                    <div className="flex justify-between items-center px-1">
                      <span className="text-xs uppercase tracking-widest font-bold text-outline/60">Strength: {getStrengthLabel(passwordStrength)}</span>
                    </div>
                    <div className="h-2 w-full bg-surface-container-highest rounded-full overflow-hidden shadow-inner">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(passwordStrength / 5) * 100}%` }}
                        className={`h-full ${getStrengthColor(passwordStrength)} transition-all duration-500`}
                      />
                    </div>
                  </div>
                )}
              </div>

              {authError && (
                <div className="bg-error/10 p-3 rounded-xl border border-error/20">
                  <p className="text-error text-xs font-medium text-center">{authError}</p>
                </div>
              )}

            <motion.button 
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isAuthenticating}
              className="w-full bg-primary text-on-primary-fixed py-5 rounded-2xl font-bold text-lg mt-6 transition-all shadow-xl shadow-primary/20 hover:shadow-primary/30 disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {isAuthenticating ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Processing...
                </>
              ) : (
                authMode === 'signin' ? 'Sign In' : 'Join the Journey'
              )}
            </motion.button>
            </form>

            <div className="relative my-10">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-outline-variant/20"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase tracking-widest font-bold">
                <span className="bg-surface-container px-4 text-outline/40">Or continue with</span>
              </div>
            </div>

            <div className="space-y-3">
              <motion.button 
                whileHover={{ scale: 1.02, backgroundColor: 'var(--surface-container-highest)' }}
                whileTap={{ scale: 0.98 }}
                onClick={handleLogin}
                className="w-full bg-surface-container-high text-on-surface py-4 sm:py-5 rounded-2xl font-bold flex items-center justify-center gap-4 hover:bg-surface-container-highest transition-all border-2 border-outline-variant/20 shadow-sm"
              >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5 sm:w-6 sm:h-6" alt="Google" />
                <span>Google</span>
              </motion.button>

              <div className="space-y-1.5">
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleGuestLogin}
                  className="w-full bg-primary/10 hover:bg-primary/15 text-primary py-3.5 sm:py-4 rounded-2xl font-bold flex items-center justify-center gap-2 border border-primary/20 transition-all text-sm uppercase tracking-wider"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Continue as Demo Couple</span>
                </motion.button>
                <p className="text-[11px] text-center text-outline/70">
                  Explores all features with local temporary test data. No real money moved.
                </p>
              </div>
            </div>

            <p className="mt-8 text-center text-sm text-outline">
              {authMode === 'signin' ? "Don't have an account?" : "Already have an account?"}{' '}
              <button 
                onClick={() => {
                  setAuthMode(authMode === 'signin' ? 'signup' : 'signin');
                  setAuthError('');
                  setEmailError('');
                  setPasswordError('');
                }}
                className="text-primary font-bold hover:underline"
              >
                {authMode === 'signin' ? 'Sign Up' : 'Sign In'}
              </button>
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-on-surface">
      {/* Top Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-surface/90 backdrop-blur-xl border-b border-outline-variant/10 transition-colors pt-[max(env(safe-area-inset-top,0px),0px)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 md:h-20 flex justify-between items-center gap-3 sm:gap-6">
          {/* Brand & Menu */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            <motion.button 
              whileHover={{ scale: 1.05 }} 
              whileTap={{ scale: 0.95 }}
              onClick={() => { hapticLight(); setIsMenuOpen(true); }}
              className="p-2 sm:p-2.5 rounded-2xl hover:bg-surface-container-high/60 transition-colors text-primary active:scale-95 flex items-center justify-center border border-outline-variant/10 shadow-xs cursor-pointer"
              title="Open menu"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
            </motion.button>
            <div className="flex items-center gap-2 sm:gap-3 cursor-pointer" onClick={() => setView('home')}>
              <motion.h1 
                whileHover={{ scale: 1.02 }}
                className="text-xl sm:text-2xl md:text-3xl font-serif text-primary tracking-tight select-none font-semibold" 
              >
                DateFund
              </motion.h1>
              <span className="hidden xl:inline text-[11px] font-sans font-medium text-outline/60 border-l border-outline-variant/30 pl-3 py-0.5 select-none">
                Couples Savings & Date Concierge
              </span>
            </div>
          </div>

          {/* Desktop Navigation Bar (Central Tabs) */}
          <div className="hidden lg:flex items-center gap-1 bg-surface-container-low/90 p-1.5 rounded-full border border-outline-variant/10 shadow-sm backdrop-blur-md">
            {[
              { id: 'home', label: 'Home', icon: Home, badge: 0 },
              { id: 'planner', label: 'Planner', icon: Calendar, badge: 0 },
              { id: 'discover', label: 'Discover', icon: Compass, badge: 0 },
              { id: 'map', label: 'Map', icon: MapIcon, badge: 0 },
              { id: 'chat', label: 'Chat', icon: MessageCircleHeart, badge: unreadChatCount },
              { id: 'history', label: 'History', icon: History, badge: 0 },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = view === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => { hapticLight(); setIsQuickChatOpen(false); setView(tab.id as any); }}
                  className={`relative flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                    isActive
                      ? 'bg-primary text-on-primary-fixed shadow-md shadow-primary/20 scale-100'
                      : 'text-outline hover:text-on-surface hover:bg-surface-container-highest/50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  {tab.badge > 0 && (
                    <span className="ml-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center tabular-nums shadow-xs">
                      {tab.badge > 99 ? '99+' : tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Actions & Profile (Right Side - Essentials Only) */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0 relative" ref={avatarMenuRef}>
            {/* Primary Action: Add Funds (Desktop/Tablet) */}
            <motion.button
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => { hapticMedium(); setIsFundModalOpen(true); }}
              className="hidden sm:inline-flex items-center gap-1.5 bg-gradient-to-r from-primary to-primary-container text-on-primary-fixed px-4 py-2 rounded-full font-semibold text-xs uppercase tracking-wider shadow-sm hover:shadow-md hover:shadow-primary/20 transition-all shrink-0 cursor-pointer min-h-[40px]"
            >
              <Plus className="w-4 h-4" />
              <span>Add Funds</span>
            </motion.button>

            {/* User Profile Avatar with Click-to-Open Popover */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => { hapticLight(); setIsAvatarMenuOpen(prev => !prev); }}
              className={`w-10 h-10 sm:w-10 sm:h-10 rounded-full overflow-hidden border-2 transition-all shadow-sm shrink-0 cursor-pointer p-0 relative flex items-center justify-center min-w-[44px] min-h-[44px] ${
                isAvatarMenuOpen 
                  ? 'border-primary ring-2 ring-primary/30' 
                  : 'border-outline-variant/30 hover:border-primary'
              }`}
              title="Account & preferences"
              aria-label="Account and settings menu"
              aria-expanded={isAvatarMenuOpen}
            >
              <img 
                className="w-full h-full object-cover" 
                src={profileData.photoURL || user.photoURL || AVATAR_NAV} 
                alt="User profile" 
                referrerPolicy="no-referrer"
              />
            </motion.button>

            {/* Profile Popover Menu */}
            <AnimatePresence>
              {isAvatarMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 8 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="absolute right-0 top-full mt-3 w-72 sm:w-80 bg-surface-container rounded-3xl p-4 shadow-2xl border border-outline-variant/20 z-50 backdrop-blur-xl"
                >
                  {/* Account Header */}
                  <div className="flex items-center gap-3 pb-3 mb-3 border-b border-outline-variant/10">
                    <div className="h-11 w-11 rounded-full overflow-hidden border-2 border-primary/20 shrink-0">
                      <img 
                        className="w-full h-full object-cover" 
                        src={profileData.photoURL || user.photoURL || AVATAR_NAV} 
                        alt="Profile avatar" 
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-serif font-bold text-sm truncate text-on-surface">
                        {profileData.displayName || user?.displayName || 'Couples Member'}
                      </h4>
                      <p className="text-[11px] text-outline truncate">
                        {user?.email || 'Shared Journey'}
                      </p>
                    </div>
                  </div>

                  {/* Quick Profile Actions */}
                  <div className="space-y-1">
                    <button
                      onClick={() => {
                        setIsAvatarMenuOpen(false);
                        setIsProfileModalOpen(true);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-surface-container-high transition-colors text-left text-xs font-semibold text-on-surface group cursor-pointer"
                    >
                      <div className="p-1.5 rounded-lg bg-surface-container-highest group-hover:bg-primary/10 group-hover:text-primary transition-colors text-outline">
                        <Settings className="w-4 h-4" />
                      </div>
                      <span>Edit Profile</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsAvatarMenuOpen(false);
                        setIsInviteModalOpen(true);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-surface-container-high transition-colors text-left text-xs font-semibold text-on-surface group cursor-pointer"
                    >
                      <div className="p-1.5 rounded-lg bg-surface-container-highest group-hover:bg-primary/10 group-hover:text-primary transition-colors text-outline">
                        <QrCode className="w-4 h-4" />
                      </div>
                      <span>Partner Invite QR</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsAvatarMenuOpen(false);
                        setView('relationship');
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-surface-container-high transition-colors text-left text-xs font-semibold text-on-surface group cursor-pointer"
                    >
                      <div className="p-1.5 rounded-lg bg-surface-container-highest group-hover:bg-primary/10 group-hover:text-primary transition-colors text-outline">
                        <History className="w-4 h-4" />
                      </div>
                      <span>Relationship Settings</span>
                    </button>
                  </div>

                  {/* Compact Theme Switcher in Popover */}
                  <div className="my-3 pt-3 border-t border-outline-variant/10">
                    <div className="flex items-center justify-between mb-2 px-1">
                      <span className="text-[10px] uppercase tracking-wider font-bold text-outline">Theme</span>
                      <span className="text-[10px] text-outline/60 capitalize">{theme}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1 bg-surface-container-high p-1 rounded-xl">
                      {[
                        { id: 'light', icon: Sun, label: 'Light' },
                        { id: 'system', icon: Monitor, label: 'Auto' },
                        { id: 'dark', icon: Moon, label: 'Dark' }
                      ].map((item) => {
                        const Icon = item.icon;
                        const isSelected = theme === item.id;
                        return (
                          <button
                            key={item.id}
                            onClick={() => setTheme(item.id as any)}
                            className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              isSelected 
                                ? 'bg-primary text-on-primary-fixed shadow-xs' 
                                : 'text-outline hover:text-on-surface hover:bg-surface-container-highest/60'
                            }`}
                          >
                            <Icon className="w-3.5 h-3.5" />
                            <span className="text-[10px]">{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Logout / Disconnect Button */}
                  <div className="pt-2 border-t border-outline-variant/10">
                    <button
                      onClick={() => {
                        setIsAvatarMenuOpen(false);
                        handleLogout();
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-error hover:bg-error/10 transition-colors text-xs font-bold cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </nav>

      {/* Reminder Notifications */}
      <div className="fixed top-24 right-6 z-[110] space-y-4 pointer-events-none">
        <AnimatePresence>
          {activeReminders.map((reminder) => (
            <motion.div
              key={reminder.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-primary text-on-primary-fixed p-6 rounded-2xl shadow-2xl border border-white/10 max-w-xs pointer-events-auto"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="bg-white/20 p-2 rounded-full">
                  <Bell className="w-5 h-5" />
                </div>
                <button 
                  onClick={() => setActiveReminders(prev => prev.filter(r => r.id !== reminder.id))}
                  className="p-1 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <h4 className="font-serif text-lg mb-1">{reminder.title}</h4>
              <p className="text-xs opacity-90 mb-3">
                {reminder.time ? `Starts at ${reminder.time}` : 'Scheduled for today'}
                {reminder.location && ` • ${reminder.location}`}
              </p>
              <button 
                onClick={() => {
                  setView('planner');
                  setActiveReminders(prev => prev.filter(r => r.id !== reminder.id));
                }}
                className="w-full bg-white/20 hover:bg-white/30 py-2 rounded-full text-[10px] uppercase tracking-widest font-bold transition-colors"
              >
                View in Planner
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* AI Suggestion Modal */}
      <AnimatePresence>
        {isSuggestionModalOpen && suggestedIdea && (
          <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSuggestionModalOpen(false)}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: "100%", scale: 0.9 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: "100%", scale: 0.9 }}
              className="relative w-full max-w-md sm:max-w-lg md:max-w-xl bg-surface-container rounded-t-3xl sm:rounded-3xl p-8 shadow-2xl border border-primary/20 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Wand2 className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-xl font-serif">AI Suggestion</h3>
                </div>
                <button onClick={() => setIsSuggestionModalOpen(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="p-6 bg-primary/5 rounded-2xl border border-primary/10">
                  <h4 className="text-2xl font-serif text-primary mb-2">{suggestedIdea.title}</h4>
                  <p className="text-on-surface/80 text-sm leading-relaxed mb-4">{suggestedIdea.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {suggestedIdea.tags.map((tag, idx) => (
                      <span key={idx} className="text-xs uppercase font-bold bg-primary/10 text-primary px-3 py-1 rounded-full tracking-tight">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={() => setIsSuggestionModalOpen(false)}
                    className="flex-1 py-4 rounded-full font-bold text-outline hover:bg-white/5 transition-colors"
                  >
                    Maybe Later
                  </button>
                  <button 
                    onClick={() => {
                      setEditingEvent(null);
                      setNewEvent({
                        title: suggestedIdea.title,
                        description: suggestedIdea.description,
                        date: new Date().toISOString().split('T')[0],
                        time: '19:00',
                        location: '',
                        goalId: '',
                        reminder: true,
                        reminderMinutes: 60,
                        tags: suggestedIdea.tags
                      });
                      setIsSuggestionModalOpen(false);
                      setIsEventModalOpen(true);
                    }}
                    className="flex-[2] bg-primary text-on-primary-fixed py-4 rounded-full font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform"
                  >
                    <Plus className="w-4 h-4" />
                    Plan This Date
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Join Event Modal */}
      <AnimatePresence>
        {isJoinEventModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsJoinEventModalOpen(false)}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="relative w-full max-w-md sm:max-w-lg md:max-w-xl bg-surface-container rounded-t-3xl sm:rounded-3xl p-8 shadow-2xl border border-outline-variant/10 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-2xl font-serif">Join Date Night</h3>
                  <p className="text-outline text-xs mt-1 leading-relaxed">
                    Enter the invitation code shared by your partner to collaborate and RSVP to this date.
                  </p>
                </div>
                <button 
                  onClick={() => setIsJoinEventModalOpen(false)} 
                  className="p-2.5 hover:bg-white/5 rounded-full transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center text-outline hover:text-on-surface"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleJoinEvent} className="space-y-6 mt-6">
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-wider font-semibold text-outline/80 ml-1">Date Invitation Code</label>
                  <input 
                    autoFocus
                    type="text" 
                    placeholder="e.g. event_xyz..."
                    className="w-full bg-surface-container-high/50 border-2 border-outline-variant/20 rounded-2xl px-5 py-4 focus:border-primary outline-none transition-all font-mono text-base placeholder:text-outline/30 min-h-[48px]"
                    value={joinEventId}
                    onChange={e => setJoinEventId(e.target.value)}
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full bg-primary text-on-primary-fixed py-4 rounded-2xl font-bold active:scale-95 transition-transform min-h-[48px] shadow-lg shadow-primary/20"
                >
                  Join Date Night
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[200] bg-on-surface text-surface px-6 py-3 rounded-full shadow-2xl font-bold text-sm whitespace-nowrap"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <main className="pt-[calc(5rem+max(env(safe-area-inset-top,0px),0px))] md:pt-24 pb-32 sm:pb-36 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full transition-all duration-300">
        <AnimatePresence mode="wait">
          {view === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6 sm:space-y-8"
            >
              {/* Responsive Universal Layout: 12-col grid on desktop, 1-col on mobile */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
                {/* Left/Main Column: Balance Card, Primary Goal, Next Date, All Dreams */}
                <div className="lg:col-span-7 xl:col-span-8 space-y-6">
                  {/* Hero Balance Card */}
                  <div className="p-5 sm:p-6 rounded-2xl bg-surface-container-low border border-outline-variant/15 shadow-sm transition-all">
                    {/* Header: Title and Partner Avatars */}
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                          <PiggyBank className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-outline">Shared Date Fund</h3>
                          <p className="text-[11px] text-outline/70">Couples joint savings</p>
                        </div>
                      </div>
                      
                      {/* Partner Avatars */}
                      <div className="flex items-center -space-x-2">
                        <img 
                          src={AVATAR_ME} 
                          className="w-8 h-8 rounded-full border-2 border-surface-container-low object-cover shadow-xs" 
                          alt="Me" 
                          title="Me"
                        />
                        <img 
                          src={AVATAR_THEM} 
                          className="w-8 h-8 rounded-full border-2 border-surface-container-low object-cover shadow-xs" 
                          alt="Partner" 
                          title="Them"
                        />
                      </div>
                    </div>

                    {/* Main Balance */}
                    <div className="my-3">
                      <div className="flex items-baseline gap-1.5 flex-wrap">
                        <span className="text-xl sm:text-2xl font-serif text-primary/70 font-normal">R</span>
                        <span className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-on-surface tracking-tight">
                          {totalBalance.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      {/* Weekly Growth - Display only when supported by actual data */}
                      <div className="mt-1.5 flex items-center gap-2">
                        {weeklyGrowth > 0 ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-secondary">
                            <Sparkles className="w-3.5 h-3.5" />
                            + R {weeklyGrowth.toLocaleString('en-ZA', { minimumFractionDigits: 2 })} this week
                          </span>
                        ) : (
                          <span className="text-xs text-outline/70">
                            All shared contributions synced
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action Row: Clearly labeled "Add contribution" button */}
                    <div className="pt-3 mt-3 border-t border-outline-variant/10 flex flex-col sm:flex-row gap-2.5 sm:items-center">
                      <button
                        onClick={() => { hapticMedium(); setIsFundModalOpen(true); }}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-primary text-on-primary-fixed px-5 py-3 rounded-xl font-semibold text-sm shadow-xs hover:bg-primary/90 active:scale-[0.99] transition-all cursor-pointer min-h-[44px]"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add contribution</span>
                      </button>
                      <button
                        onClick={() => { hapticLight(); setIsSplitterModalOpen(true); }}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-surface-container text-on-surface hover:bg-surface-container-high px-4 py-3 rounded-xl font-medium text-xs border border-outline-variant/20 transition-colors cursor-pointer min-h-[44px]"
                      >
                        <Utensils className="w-4 h-4 text-secondary" />
                        <span>Who Treats Next?</span>
                      </button>
                    </div>
                  </div>

                  {/* Primary Savings Goal Card */}
                  {goals.length > 0 && (() => {
                    const activeGoals = goals.filter(g => !g.archived);
                    const primaryGoal = activeGoals[0] || goals[0];
                    const pace = getGoalPaceAnalysis(primaryGoal, transactions);
                    const percent = Math.min((primaryGoal.currentAmount / primaryGoal.targetAmount) * 100, 100);
                    const isCompleted = pace.isCompleted;
                    const isOverdue = pace.isOverdue;
                    const daysLeft = pace.daysRemaining;

                    // Color-coded progress bar according to pace status
                    let progressBg = "bg-gradient-to-r from-secondary to-primary";
                    if (isCompleted) {
                      progressBg = "bg-secondary";
                    } else if (isOverdue) {
                      progressBg = "bg-error";
                    } else if (pace.isBehindPace) {
                      progressBg = "bg-gradient-to-r from-amber-500 via-amber-400 to-orange-500 shadow-sm shadow-amber-500/20";
                    }

                    return (
                      <div className={`p-5 sm:p-6 rounded-2xl bg-surface-container-low border shadow-sm space-y-4 transition-all ${
                        pace.isBehindPace 
                          ? 'border-amber-500/30' 
                          : isOverdue 
                            ? 'border-error/30' 
                            : 'border-outline-variant/15'
                      }`}>
                        {/* Header: Label, Name & Three-Dot Menu */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="text-xs font-semibold text-primary uppercase tracking-wider">Primary Dream</span>
                              {isCompleted ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-secondary bg-secondary/15 px-2.5 py-0.5 rounded-full">
                                  <Check className="w-3 h-3" /> Completed
                                </span>
                              ) : isOverdue ? (
                                <div className="inline-flex items-center gap-1.5 flex-wrap">
                                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-error bg-error/15 px-2.5 py-0.5 rounded-full">
                                    <AlertTriangle className="w-3 h-3" /> Overdue by {Math.abs(daysLeft)} {Math.abs(daysLeft) === 1 ? 'day' : 'days'}
                                  </span>
                                  <button
                                    onClick={() => setGoalToAdjust(primaryGoal)}
                                    className="text-[11px] font-bold text-error underline hover:opacity-80 cursor-pointer"
                                  >
                                    Adjust plan
                                  </button>
                                </div>
                              ) : pace.isBehindPace ? (
                                <div className="inline-flex items-center gap-1.5 flex-wrap">
                                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 rounded-full">
                                    <AlertTriangle className="w-3 h-3 text-amber-500" /> Savings pace too low
                                  </span>
                                  <button
                                    onClick={() => setGoalToAdjust(primaryGoal)}
                                    className="text-[11px] font-bold text-amber-600 dark:text-amber-400 underline hover:opacity-80 cursor-pointer"
                                  >
                                    Adjust plan
                                  </button>
                                </div>
                              ) : (
                                <span className="text-[11px] font-semibold text-outline bg-surface-container-high px-2.5 py-0.5 rounded-full">
                                  {daysLeft} {daysLeft === 1 ? 'day' : 'days'} left
                                </span>
                              )}
                            </div>
                            <h4 className="text-xl sm:text-2xl font-serif font-bold text-on-surface truncate">
                              {primaryGoal.name}
                            </h4>
                          </div>

                          {/* Three-Dot Menu */}
                          <div className="relative">
                            <button
                              onClick={() => setActiveGoalMenu(activeGoalMenu === primaryGoal.id ? null : primaryGoal.id)}
                              className="w-9 h-9 rounded-lg hover:bg-surface-container-high flex items-center justify-center text-outline transition-colors cursor-pointer"
                              aria-label="Goal options"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                            
                            {activeGoalMenu === primaryGoal.id && (
                              <div className="absolute right-0 top-full mt-1 w-44 bg-surface-container rounded-xl shadow-lg border border-outline-variant/20 py-1.5 z-20">
                                <button
                                  onClick={() => {
                                    setActiveGoalMenu(null);
                                    setFundData({ goalId: primaryGoal.id, amount: '', contributor: 'Me' });
                                    setIsFundModalOpen(true);
                                  }}
                                  className="w-full text-left px-3.5 py-2 text-xs font-medium text-on-surface hover:bg-surface-container-high flex items-center gap-2 cursor-pointer"
                                >
                                  <Plus className="w-3.5 h-3.5 text-primary" />
                                  <span>Record contribution</span>
                                </button>
                                <button
                                  onClick={() => {
                                    setActiveGoalMenu(null);
                                    setGoalToAdjust(primaryGoal);
                                  }}
                                  className="w-full text-left px-3.5 py-2 text-xs font-medium text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 flex items-center gap-2 cursor-pointer"
                                >
                                  <TrendingUp className="w-3.5 h-3.5" />
                                  <span>Adjust savings plan</span>
                                </button>
                                <button
                                  onClick={() => {
                                    setActiveGoalMenu(null);
                                    setEditingGoal(primaryGoal);
                                    setNewGoal({
                                       name: primaryGoal.name,
                                      target: primaryGoal.targetAmount.toString(),
                                      deadline: primaryGoal.deadline
                                    });
                                    setIsGoalModalOpen(true);
                                  }}
                                  className="w-full text-left px-3.5 py-2 text-xs font-medium text-on-surface hover:bg-surface-container-high flex items-center gap-2 cursor-pointer"
                                >
                                  <Pencil className="w-3.5 h-3.5 text-outline" />
                                  <span>Edit dream</span>
                                </button>
                                <button
                                  onClick={() => {
                                    setActiveGoalMenu(null);
                                    deleteGoal(primaryGoal.id);
                                  }}
                                  className="w-full text-left px-3.5 py-2 text-xs font-medium text-error hover:bg-error/10 flex items-center gap-2 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Delete dream</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Amounts and Color-Coded Progress Bar */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-baseline text-xs sm:text-sm">
                            <span className="font-semibold text-on-surface">
                              R {primaryGoal.currentAmount.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                              <span className="font-normal text-outline/80 ml-1">of R {primaryGoal.targetAmount.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</span>
                            </span>
                            <span className={`font-semibold ${pace.isBehindPace ? 'text-amber-600 dark:text-amber-400' : 'text-primary'}`}>
                              {percent.toFixed(0)}%
                            </span>
                          </div>

                          {/* Single color-coded progress bar */}
                          <div className="h-2.5 w-full bg-surface-container-highest/60 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-700 ${progressBg}`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>

                          <div className="flex justify-between items-center text-xs text-outline/70 pt-0.5">
                            <span>Target: {new Date(primaryGoal.deadline).toLocaleDateString('en-ZA', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                            {!isCompleted && (
                              <span>R {Math.max(0, primaryGoal.targetAmount - primaryGoal.currentAmount).toLocaleString('en-ZA', { minimumFractionDigits: 2 })} left</span>
                            )}
                          </div>
                        </div>

                        {/* Visual Warning & Suggested Weekly Contribution when rate is too low */}
                        {pace.isBehindPace && (
                          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2.5 animate-in fade-in duration-300">
                            <div className="flex items-start gap-3">
                              <div className="p-2 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
                                <TrendingUp className="w-4 h-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2 flex-wrap">
                                  <p className="text-xs font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                                    Savings Rate Warning
                                  </p>
                                  <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300 bg-amber-500/20 px-2.5 py-0.5 rounded-md">
                                    Need R {pace.requiredWeekly.toLocaleString('en-ZA')} / wk
                                  </span>
                                </div>
                                <p className="text-xs text-on-surface/80 mt-1 leading-relaxed">
                                  At your current joint pace of ~R {pace.currentWeeklyRate.toLocaleString('en-ZA')}/wk, this dream may not reach its target by {new Date(primaryGoal.deadline).toLocaleDateString('en-ZA', { month: 'short', day: 'numeric', year: 'numeric' })}. Increase weekly savings to <strong className="text-amber-700 dark:text-amber-300">R {pace.suggestedWeekly.toLocaleString('en-ZA')}/week</strong> to meet the deadline.
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center justify-between pt-1 gap-2 flex-wrap">
                              <span className="text-[11px] text-outline font-medium">
                                {pace.weeksRemaining} {pace.weeksRemaining === 1 ? 'week' : 'weeks'} remaining
                              </span>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => setGoalToAdjust(primaryGoal)}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-amber-500/30 text-amber-700 dark:text-amber-300 hover:bg-amber-500/10 font-bold text-xs transition-all cursor-pointer"
                                >
                                  Adjust Plan
                                </button>
                                <button
                                  onClick={() => {
                                    hapticMedium();
                                    setFundData({
                                      goalId: primaryGoal.id,
                                      amount: pace.requiredWeekly.toString(),
                                      contributor: 'Me'
                                    });
                                    setIsFundModalOpen(true);
                                  }}
                                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all cursor-pointer shadow-xs active:scale-95"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  Contribute R {pace.requiredWeekly.toLocaleString('en-ZA')}
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Weekly Contributions vs Required Savings Recharts Visualization */}
                        <GoalPaceChart
                          goal={primaryGoal}
                          transactions={transactions}
                          className="mt-4"
                        />
                      </div>
                    );
                  })()}

                  {/* Next Planned Date Night Card */}
                  <div className="p-5 sm:p-6 rounded-2xl bg-surface-container-low border border-outline-variant/15 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-secondary/15 flex items-center justify-center text-secondary">
                          <Calendar className="w-4 h-4" />
                        </div>
                        <h4 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-outline">Next Date Night</h4>
                      </div>
                      {nextPlannedDate && (
                        <button 
                          onClick={() => setView('planner')} 
                          className="text-xs font-semibold text-secondary hover:underline cursor-pointer"
                        >
                          View in Planner
                        </button>
                      )}
                    </div>

                    {nextPlannedDate ? (
                      <div className="space-y-2 pt-1">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h5 className="text-lg sm:text-xl font-serif font-bold text-on-surface">
                              {nextPlannedDate.isMystery && !nextPlannedDate.mysteryRevealed ? 'Mystery Date Night ✨' : nextPlannedDate.title}
                            </h5>
                            {nextPlannedDate.mood && (
                              <MoodBadge mood={nextPlannedDate.mood} size="sm" />
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-outline mt-1.5">
                            <span className="flex items-center gap-1 text-on-surface">
                              <Calendar className="w-3.5 h-3.5 text-primary" />
                              {new Date(nextPlannedDate.date).toLocaleDateString('en-ZA', { weekday: 'short', month: 'short', day: 'numeric' })}
                            </span>
                            {nextPlannedDate.time && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-primary" />
                                {nextPlannedDate.time}
                              </span>
                            )}
                            {nextPlannedDate.location && (
                              <span className="flex items-center gap-1 truncate max-w-[220px]">
                                <MapPin className="w-3.5 h-3.5 text-secondary" />
                                {nextPlannedDate.location}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
                        <p className="text-sm text-outline">No upcoming date scheduled yet.</p>
                        <button
                          onClick={() => {
                            setEditingEvent(null);
                            setNewEvent({
                              title: '',
                              description: '',
                              date: new Date().toISOString().split('T')[0],
                              time: '19:00',
                              location: '',
                              goalId: '',
                              reminder: false,
                              reminderMinutes: 15,
                              tags: [],
                              isMystery: false,
                              mysteryClue: ''
                            });
                            setIsEventModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/20 transition-colors cursor-pointer min-h-[36px]"
                        >
                          <Plus className="w-3.5 h-3.5" /> Plan date night
                        </button>
                      </div>
                    )}
                  </div>

                  {/* All Goals Section */}
                  <section className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-serif text-xl sm:text-2xl font-bold">Our Dreams</h4>
                        <p className="text-xs text-outline">Shared goals & milestones</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => {
                            hapticLight();
                            setView('dreams');
                          }}
                          className="text-xs font-semibold text-outline hover:text-primary transition-colors cursor-pointer px-2.5 py-1.5 rounded-lg hover:bg-surface-container"
                        >
                          View All ({goals.length})
                        </button>
                        <button 
                          onClick={() => {
                            setEditingGoal(null);
                            setNewGoal({ name: '', target: '', deadline: '' });
                            setIsGoalModalOpen(true);
                          }}
                          className="bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-primary/20 transition-colors cursor-pointer min-h-[36px]"
                        >
                          <Plus className="w-3.5 h-3.5" /> New Dream
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {goals.filter(g => !g.archived).slice(1).map((goal) => {
                        const pace = getGoalPaceAnalysis(goal, transactions);
                        const percent = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
                        const isCompleted = pace.isCompleted;
                        const daysLeft = pace.daysRemaining;
                        const isOverdue = pace.isOverdue;

                        let progressBg = isCompleted ? 'bg-secondary' : 'bg-primary';
                        if (isOverdue) progressBg = 'bg-error';
                        else if (pace.isBehindPace) progressBg = 'bg-gradient-to-r from-amber-500 via-amber-400 to-orange-500';

                        return (
                          <div 
                            key={goal.id}
                            className={`bg-surface-container-low rounded-2xl p-4 sm:p-5 border shadow-xs transition-all space-y-2.5 ${
                              pace.isBehindPace 
                                ? 'border-amber-500/30' 
                                : isOverdue 
                                  ? 'border-error/30' 
                                  : 'border-outline-variant/10 hover:border-outline-variant/30'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                  <h5 className="font-serif text-lg font-bold truncate text-on-surface">{goal.name}</h5>
                                  {isCompleted ? (
                                    <span className="text-[10px] font-semibold text-secondary bg-secondary/15 px-2 py-0.5 rounded-full">Completed</span>
                                  ) : isOverdue ? (
                                    <span className="inline-flex items-center gap-1">
                                      <span className="text-[10px] font-semibold text-error bg-error/15 px-2 py-0.5 rounded-full">Overdue</span>
                                      <button onClick={() => setGoalToAdjust(goal)} className="text-[10px] font-bold text-error underline hover:opacity-80 cursor-pointer">Adjust</button>
                                    </span>
                                  ) : pace.isBehindPace ? (
                                    <span className="inline-flex items-center gap-1">
                                      <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                                        <AlertTriangle className="w-2.5 h-2.5 text-amber-500" /> Need R {pace.requiredWeekly.toLocaleString('en-ZA')}/wk
                                      </span>
                                      <button onClick={() => setGoalToAdjust(goal)} className="text-[10px] font-bold text-amber-600 dark:text-amber-400 underline hover:opacity-80 cursor-pointer">Adjust</button>
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-semibold text-outline bg-surface-container-high px-2 py-0.5 rounded-full">{daysLeft}d left</span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-outline">
                                  <span>R {goal.currentAmount.toLocaleString('en-ZA', { minimumFractionDigits: 2 })} of R {goal.targetAmount.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</span>
                                  <span>•</span>
                                  <span className={pace.isBehindPace ? 'font-semibold text-amber-600 dark:text-amber-400' : ''}>{percent.toFixed(0)}%</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => setGoalToAdjust(goal)}
                                  className="p-2 text-outline hover:text-amber-500 transition-colors cursor-pointer rounded-lg hover:bg-amber-500/10"
                                  title="Adjust savings plan"
                                  aria-label="Adjust savings plan"
                                >
                                  <TrendingUp className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    setFundData({ goalId: goal.id, amount: pace.isBehindPace ? pace.requiredWeekly.toString() : '', contributor: 'Me' });
                                    setIsFundModalOpen(true);
                                  }}
                                  className={`p-2 transition-colors cursor-pointer rounded-lg ${
                                    pace.isBehindPace 
                                      ? 'text-amber-600 hover:text-amber-500 bg-amber-500/10 hover:bg-amber-500/20' 
                                      : 'text-outline hover:text-primary hover:bg-surface-container-high'
                                  }`}
                                  title={pace.isBehindPace ? `Contribute suggested R ${pace.requiredWeekly}/wk` : "Record contribution"}
                                  aria-label="Record contribution to goal"
                                >
                                  <Plus className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingGoal(goal);
                                    setNewGoal({
                                      name: goal.name,
                                      target: goal.targetAmount.toString(),
                                      deadline: goal.deadline
                                    });
                                    setIsGoalModalOpen(true);
                                  }}
                                  className="p-2 text-outline hover:text-on-surface transition-colors cursor-pointer rounded-lg hover:bg-surface-container-high"
                                  title="Edit dream"
                                  aria-label="Edit dream"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => deleteGoal(goal.id)}
                                  className="p-2 text-outline hover:text-error transition-colors cursor-pointer rounded-lg hover:bg-error/10"
                                  title="Delete dream"
                                  aria-label="Delete dream"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            {/* Color-coded progress bar */}
                            <div className="h-2 w-full bg-surface-container-highest/60 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all duration-500 ${progressBg}`}
                                style={{ width: `${percent}%` }}
                              />
                            </div>

                            {/* Visual warning message when savings rate is too low */}
                            {pace.isBehindPace && (
                              <div className="flex items-center justify-between text-[11px] text-amber-700 dark:text-amber-300 font-medium bg-amber-500/10 px-2.5 py-1.5 rounded-lg border border-amber-500/20">
                                <span className="flex items-center gap-1.5">
                                  <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />
                                  Pace too low • Increase to R {pace.requiredWeekly.toLocaleString('en-ZA')}/wk to meet deadline
                                </span>
                                <button
                                  onClick={() => {
                                    hapticMedium();
                                    setFundData({ goalId: goal.id, amount: pace.requiredWeekly.toString(), contributor: 'Me' });
                                    setIsFundModalOpen(true);
                                  }}
                                  className="text-[11px] font-bold text-amber-600 hover:text-amber-500 underline cursor-pointer shrink-0 ml-1"
                                >
                                  Boost
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {goals.length <= 1 && (
                        <div className="py-6 text-center border border-dashed border-outline-variant/20 rounded-2xl">
                          <p className="text-outline text-xs italic">No secondary dreams yet. Add your next getaway or dinner goal.</p>
                        </div>
                      )}
                    </div>
                  </section>
                </div>

                {/* Right/Companion Column: Partners, Milestones, Activity & Tools */}
                <div className="lg:col-span-5 xl:col-span-4 space-y-6">
                  {/* Savings Partners */}
                  <div className="p-5 sm:p-6 rounded-2xl bg-surface-container-low border border-outline-variant/15 shadow-sm space-y-3.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-outline block">Savings Partners</span>
                        <p className="text-[11px] text-outline/70">Individual partner contributions</p>
                      </div>
                      {totalBalance > 0 && (
                        <span className="text-[11px] font-semibold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
                          {Math.round((contributorStats.Me.total / totalBalance) * 100)}% / {Math.round((contributorStats.Them.total / totalBalance) * 100)}%
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                      <ContributorCard 
                        name="Me" 
                        amount={`R ${contributorStats.Me.total.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`} 
                        status={contributorStats.Me.lastDate ? `Last: ${contributorStats.Me.lastDate.toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' })}` : "No deposits"} 
                        avatar={AVATAR_ME} 
                        isActive 
                      />
                      <ContributorCard 
                        name="Them" 
                        amount={`R ${contributorStats.Them.total.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`} 
                        status={contributorStats.Them.lastDate ? `Last: ${contributorStats.Them.lastDate.toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' })}` : "No deposits"} 
                        avatar={AVATAR_THEM} 
                      />
                    </div>

                    {totalBalance > 0 && (
                      <div className="pt-0.5">
                        <div className="h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden flex">
                          <div 
                            className="h-full bg-primary transition-all duration-500" 
                            style={{ width: `${Math.max((contributorStats.Me.total / totalBalance) * 100, 2)}%` }} 
                            title={`Me: R ${contributorStats.Me.total.toFixed(2)}`}
                          />
                          <div 
                            className="h-full bg-secondary transition-all duration-500" 
                            style={{ width: `${Math.max((contributorStats.Them.total / totalBalance) * 100, 2)}%` }} 
                            title={`Them: R ${contributorStats.Them.total.toFixed(2)}`}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Relationship Milestone & Anniversary Tracker Widget */}
                  <AnniversaryTracker 
                    startDate={relationshipStartDate}
                    onUpdateStartDate={handleUpdateRelationshipStartDate}
                    events={events}
                    isWidget={true}
                  />

                  {/* Recent Activity / Blooms */}
                  <section className="p-5 sm:p-6 rounded-2xl bg-surface-container-low border border-outline-variant/15 shadow-sm space-y-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-serif text-lg font-bold">Recent Activity</h4>
                        <span className="text-xs text-outline">Latest fund deposits</span>
                      </div>
                      <button onClick={() => setView('history')} className="text-secondary text-xs font-semibold hover:underline cursor-pointer">
                        View All
                      </button>
                    </div>
                    <div className="space-y-2 pt-1">
                      {transactions.slice(0, 4).map((t) => (
                        <HistoryItem 
                          key={t.id}
                          avatar={t.contributor === 'Me' ? AVATAR_ME : AVATAR_THEM}
                          title={t.goalName} 
                          subtitle={`${new Date(t.date).toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' })} • ${t.contributor}`} 
                          amount={`${t.amount > 0 ? '+' : ''} R ${Math.abs(t.amount).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`} 
                          amountColor={t.amount > 0 ? "text-secondary" : "text-on-surface"}
                          iconBg={t.type === 'deposit' ? "bg-secondary/10" : "bg-primary/10"}
                        />
                      ))}
                      {transactions.length === 0 && (
                        <p className="text-xs text-outline italic py-4 text-center">No transactions recorded yet.</p>
                      )}
                    </div>
                  </section>

                  {/* Couple Tools & Memories Quick Access */}
                  <div className="p-5 rounded-2xl bg-surface-container-low border border-outline-variant/15 shadow-sm space-y-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-outline block">Tools & Memories</span>
                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        onClick={() => { hapticLight(); setView('scrapbook'); }}
                        className="p-3 rounded-xl bg-surface-container hover:bg-surface-container-high transition-colors text-left flex items-center gap-2.5 cursor-pointer border border-outline-variant/10"
                      >
                        <Camera className="w-4 h-4 text-primary shrink-0" />
                        <span className="text-xs font-semibold truncate">Scrapbook</span>
                      </button>
                      <button
                        onClick={() => { hapticLight(); setView('wishlist'); }}
                        className="p-3 rounded-xl bg-surface-container hover:bg-surface-container-high transition-colors text-left flex items-center gap-2.5 cursor-pointer border border-outline-variant/10"
                      >
                        <Bookmark className="w-4 h-4 text-secondary shrink-0" />
                        <span className="text-xs font-semibold truncate">Date Wishlist</span>
                      </button>
                      <button
                        onClick={() => { hapticLight(); setIsInviteModalOpen(true); }}
                        className="p-3 rounded-xl bg-surface-container hover:bg-surface-container-high transition-colors text-left flex items-center gap-2.5 cursor-pointer border border-outline-variant/10"
                      >
                        <QrCode className="w-4 h-4 text-primary shrink-0" />
                        <span className="text-xs font-semibold truncate">Partner Invite</span>
                      </button>
                      <button
                        onClick={() => { hapticCelebration(); setIsWrappedModalOpen(true); }}
                        className="p-3 rounded-xl bg-surface-container hover:bg-surface-container-high transition-colors text-left flex items-center gap-2.5 cursor-pointer border border-outline-variant/10"
                      >
                        <Trophy className="w-4 h-4 text-amber-500 shrink-0" />
                        <span className="text-xs font-semibold truncate">Year in Love</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {view === 'history' && (
            <HistoryView
              transactions={transactions}
              goals={goals}
              onBack={() => setView('home')}
              onOpenRecordContribution={() => setIsFundModalOpen(true)}
              onAddCorrection={handleAddAuditCorrection}
            />
          )}

          {view === 'discover' && (
            <DiscoverView
              location={location}
              goals={goals}
              events={events}
              onPlanDate={(info) => {
                setEditingEvent(null);
                setNewEvent({
                  title: info.title,
                  description: info.description || '',
                  date: new Date().toISOString().split('T')[0],
                  time: '19:00',
                  location: info.location,
                  goalId: '',
                  reminder: true,
                  reminderMinutes: 60,
                  tags: ['Date Spot', 'Romantic'],
                  mood: info.mood || 'Romantic',
                  isMystery: false,
                  mysteryClue: ''
                });
                setIsEventModalOpen(true);
                setView('planner');
              }}
              onAddToWishlist={(item) => {
                handleAddBucketItem({
                  title: item.title,
                  category: item.category,
                  estimatedBudget: item.estimatedBudget || 500,
                  notes: item.notes,
                  season: 'Any',
                  addedBy: 'Me'
                });
                setToast(`Saved "${item.title}" to Date Wishlist! 🔖`);
              }}
              onFundDateGoal={(goalInfo) => {
                const futureDate = new Date();
                futureDate.setMonth(futureDate.getMonth() + 2);
                setEditingGoal(null);
                setNewGoal({
                  name: goalInfo.name,
                  target: goalInfo.targetAmount.toString(),
                  deadline: goalInfo.deadline || futureDate.toISOString().split('T')[0]
                });
                setIsGoalModalOpen(true);
              }}
              onShareSpotToChat={handleShareSpotToChat}
              onOpenMap={() => setView('map')}
            />
          )}

          {view === 'map' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-serif">Date Map & Venues</h2>
                  <p className="text-outline text-xs sm:text-sm mt-1">
                    Discover romantic fine dining, cozy cafés, and sunset spots on real Google Maps.
                  </p>
                </div>
              </div>
              <GoogleDateMap
                events={events}
                userLocation={location}
                focusedSpot={focusedMapSpot}
                onShareSpotToChat={handleShareSpotToChat}
                onPlanDate={(info) => {
                  setEditingEvent(null);
                  setNewEvent({
                    title: info.title,
                    description: info.description || '',
                    date: new Date().toISOString().split('T')[0],
                    time: '19:00',
                    location: info.location,
                    goalId: '',
                    reminder: true,
                    reminderMinutes: 60,
                    tags: ['Date Spot', 'Romantic'],
                    mood: info.mood || 'Romantic',
                    isMystery: false,
                    mysteryClue: ''
                  });
                  setIsEventModalOpen(true);
                  setView('planner');
                }}
                onAddToBucketList={(item) => {
                  handleAddBucketItem({
                    title: item.title,
                    category: item.category,
                    estimatedBudget: 500,
                    notes: item.notes,
                    season: 'Any',
                    addedBy: 'Me'
                  });
                  setToast(`Saved "${item.title}" to Date Wishlist! 🔖`);
                }}
              />
            </motion.div>
          )}

          {view === 'chat' && (
            <motion.div
              key="chat"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-serif">Partner Messenger</h2>
                  <p className="text-outline text-xs sm:text-sm">
                    Share Discover date spots, vote on weekend polls, send love notes, and celebrate savings milestones together.
                  </p>
                </div>
              </div>
              <PartnerChatView
                currentUserUid={user.uid}
                currentUserName={profileData.displayName || user.displayName || 'You'}
                currentUserPhoto={profileData.photoURL || user.photoURL || AVATAR_ME}
                partnerUid={resolvedPartnerUid}
                partnerName={relationshipData?.partnerName || (isDemoMode ? 'Alex' : 'Your Partner')}
                partnerPhoto={relationshipData?.partnerPhoto || AVATAR_THEM}
                messages={messages}
                goals={goals}
                events={events}
                onSendMessage={handleSendMessage}
                onToggleReaction={handleToggleReaction}
                onTogglePinMessage={handleTogglePinMessage}
                onVoteSpot={handleVoteSpot}
                onVotePoll={handleVotePoll}
                onRespondDateInvite={handleRespondDateInvite}
                onDeleteMessage={handleDeleteMessage}
                onOpenInviteModal={() => setIsInviteModalOpen(true)}
                onSelectGoalForFunding={(goalId) => {
                  setFundData({ goalId, amount: '', contributor: 'Me' });
                  setIsFundModalOpen(true);
                }}
                onNavigateToPlanner={() => setView('planner')}
                onPlanDateFromSpot={(spot) => {
                  setEditingEvent(null);
                  setNewEvent({
                    title: spot.name,
                    description: spot.summary || `Shared date idea at ${spot.name}`,
                    date: new Date().toISOString().split('T')[0],
                    time: '19:00',
                    location: spot.location,
                    goalId: '',
                    reminder: true,
                    reminderMinutes: 60,
                    tags: [spot.category || 'Date Spot', 'Shared in Chat'],
                    mood: spot.mood || 'Romantic',
                    isMystery: false,
                    mysteryClue: ''
                  });
                  setIsEventModalOpen(true);
                  setView('planner');
                }}
                onViewSpotOnMap={(spot) => {
                  setFocusedMapSpot(spot);
                  setView('map');
                }}
              />
            </motion.div>
          )}
          {view === 'planner' && (
            <motion.div
              key="planner"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-8"
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-1">
                  <h2 className="text-3xl font-serif">Planner</h2>
                  <p className="text-outline text-sm">Curate and schedule your shared dates and moments.</p>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 no-scrollbar justify-start md:justify-end">
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button 
                      onClick={() => setIsJoinEventModalOpen(true)}
                      className="p-3 rounded-full bg-surface-container text-outline hover:text-primary transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center border border-outline-variant/10 shadow-sm"
                      title="Join Date Night"
                      aria-label="Join Date Night with code"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                    
                    <AnimatePresence mode="wait">
                      {(plannerMode === 'list' || plannerMode === 'grid') && (
                        <motion.div 
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          className="bg-surface-container p-1 rounded-full flex gap-1 flex-shrink-0 border border-outline-variant/10"
                        >
                          <button 
                            onClick={() => setPlannerSort('date')}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all min-h-[36px] ${plannerSort === 'date' ? 'bg-primary text-on-primary-fixed shadow-sm' : 'text-outline hover:bg-white/5'}`}
                          >
                            Date
                          </button>
                          <button 
                            onClick={() => setPlannerSort('time')}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all min-h-[36px] ${plannerSort === 'time' ? 'bg-primary text-on-primary-fixed shadow-sm' : 'text-outline hover:bg-white/5'}`}
                          >
                            Time
                          </button>
                          <button 
                            onClick={() => setPlannerSort('title')}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all min-h-[36px] ${plannerSort === 'title' ? 'bg-primary text-on-primary-fixed shadow-sm' : 'text-outline hover:bg-white/5'}`}
                          >
                            Title
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="bg-surface-container p-1 rounded-full flex gap-1 border border-outline-variant/10">
                      <button 
                        onClick={() => setPlannerMode('list')}
                        className={`p-2.5 rounded-full transition-all min-h-[44px] min-w-[44px] flex items-center justify-center ${plannerMode === 'list' ? 'bg-primary text-on-primary-fixed shadow-sm' : 'text-outline hover:bg-white/5'}`}
                        title="List View"
                        aria-label="List View"
                      >
                        <List className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setPlannerMode('grid')}
                        className={`p-2.5 rounded-full transition-all min-h-[44px] min-w-[44px] flex items-center justify-center ${plannerMode === 'grid' ? 'bg-primary text-on-primary-fixed shadow-sm' : 'text-outline hover:bg-white/5'}`}
                        title="Grid View"
                        aria-label="Grid View"
                      >
                        <LayoutGrid className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setPlannerMode('calendar')}
                        className={`p-2.5 rounded-full transition-all min-h-[44px] min-w-[44px] flex items-center justify-center ${plannerMode === 'calendar' ? 'bg-primary text-on-primary-fixed shadow-sm' : 'text-outline hover:bg-white/5'}`}
                        title="Calendar View"
                        aria-label="Calendar View"
                      >
                        <Calendar className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          hapticLight();
                          const activeMood: DateMood = plannerMoodFilter !== 'all' ? plannerMoodFilter : 'Romantic';
                          setRomanticTipsMood(activeMood);
                          setIsRomanticTipsModalOpen(true);
                        }}
                        className="px-3.5 py-2.5 rounded-full bg-secondary/10 text-secondary hover:bg-secondary/20 transition-all min-h-[44px] flex items-center gap-1.5 border border-secondary/25 shadow-xs text-xs font-bold cursor-pointer"
                        title="Romantic Tips & Relationship Exercises"
                        aria-label="Romantic Tips & Relationship Exercises"
                      >
                        <MessageCircleHeart className="w-4 h-4 text-secondary shrink-0" />
                        <span className="hidden sm:inline">Romantic Tips</span>
                      </motion.button>
                      <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => { hapticLight(); setIsScrapbookModalOpen(true); }}
                        className="p-3 rounded-full bg-surface-container text-outline hover:text-primary transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center border border-outline-variant/10 shadow-sm"
                        title="Couple Scrapbook"
                        aria-label="Couple Scrapbook"
                      >
                        <Camera className="w-4 h-4" />
                      </motion.button>
                      <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleSuggestIdea}
                        disabled={isSuggesting}
                        className="p-3 rounded-full bg-surface-container text-outline hover:text-primary transition-colors disabled:opacity-50 min-h-[44px] min-w-[44px] flex items-center justify-center border border-outline-variant/10 shadow-sm"
                        title="AI Suggest Idea"
                        aria-label="AI Suggest Idea"
                      >
                        {isSuggesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      </motion.button>
                      <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          setEditingEvent(null);
                          setNewEvent({ 
                            title: '', 
                            description: '', 
                            date: '', 
                            time: '', 
                            location: '', 
                            goalId: '', 
                            reminder: false, 
                            reminderMinutes: 15, 
                            tags: [],
                            mood: 'Romantic',
                            isMystery: false,
                            mysteryClue: ''
                          });
                          setIsEventModalOpen(true);
                        }}
                        title="Plan Date Night"
                        aria-label="Plan Date Night"
                        className="bg-primary text-on-primary-fixed p-3 rounded-full shadow-md transition-all hover:shadow-primary/20 min-h-[44px] min-w-[44px] flex items-center justify-center"
                      >
                        <Plus className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Planner Date Mood Filter Bar (Grid & List modes) */}
              {plannerMode !== 'calendar' && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar pt-1">
                  <span className="text-[10px] uppercase font-bold text-outline tracking-wider shrink-0 flex items-center gap-1 mr-1">
                    <Sparkles className="w-3 h-3 text-secondary" /> Vibe:
                  </span>
                  <button
                    onClick={() => { hapticLight(); setPlannerMoodFilter('all'); }}
                    className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all border shrink-0 cursor-pointer ${
                      plannerMoodFilter === 'all'
                        ? 'bg-secondary text-on-secondary border-secondary shadow-xs'
                        : 'bg-surface-container text-outline border-outline-variant/20 hover:text-on-surface'
                    }`}
                  >
                    All Dates ({events.length})
                  </button>
                  {DATE_MOODS.map(mood => {
                    const count = events.filter(e => (e.mood || 'Romantic') === mood.id).length;
                    const isSelected = plannerMoodFilter === mood.id;
                    return (
                      <button
                        key={mood.id}
                        onClick={() => { hapticLight(); setPlannerMoodFilter(mood.id); }}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all border shrink-0 cursor-pointer ${
                          isSelected
                            ? `${mood.activeClass} font-bold shadow-xs`
                            : 'bg-surface-container text-outline border-outline-variant/20 hover:text-on-surface'
                        }`}
                      >
                        <span>{mood.emoji}</span>
                        <span>{mood.label}</span>
                        {count > 0 && <span className="text-[10px] opacity-75">({count})</span>}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => {
                      hapticLight();
                      const activeMood: DateMood = plannerMoodFilter !== 'all' ? plannerMoodFilter : 'Romantic';
                      setRomanticTipsMood(activeMood);
                      setIsRomanticTipsModalOpen(true);
                    }}
                    className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold text-secondary bg-secondary/10 hover:bg-secondary/20 border border-secondary/30 transition-all shrink-0 cursor-pointer ml-auto"
                  >
                    <MessageCircleHeart className="w-3.5 h-3.5" />
                    <span>{plannerMoodFilter !== 'all' ? `${plannerMoodFilter} Tips` : 'Couple Tips'}</span>
                  </button>
                </div>
              )}

              <div className="space-y-6">
                {plannerMode === 'calendar' ? (
                  <CalendarComponent 
                    events={events} 
                    userId={user?.uid}
                    onAddEvent={(date) => {
                      setEditingEvent(null);
                      setNewEvent({ 
                        title: '', 
                        description: '', 
                        date, 
                        time: '', 
                        location: '', 
                        goalId: '', 
                        reminder: false, 
                        reminderMinutes: 15, 
                        tags: [],
                        mood: 'Romantic',
                        isMystery: false,
                        mysteryClue: ''
                      });
                      setIsEventModalOpen(true);
                    }}
                    onEditEvent={(event) => {
                      setEditingEvent(event);
                      setIsEventModalOpen(true);
                    }}
                  />
                ) : (
                  sortedEvents.length > 0 ? (
                    <div className={`grid gap-6 ${plannerMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                      {sortedEvents.map((event, idx) => {
                        const isMysteryLocked = event.isMystery && !event.mysteryRevealed;

                        return (
                          <motion.div 
                            key={event.id}
                            layout
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ 
                              opacity: event.completed ? 0.75 : 1, 
                              scale: 1,
                              filter: event.completed ? "grayscale(0.2)" : "grayscale(0)"
                            }}
                            transition={{ delay: idx * 0.05 }}
                            whileHover={{ scale: 1.01, y: -2 }}
                            className={`bg-surface-container-low rounded-[2rem] p-6 sm:p-8 border relative group shadow-sm hover:shadow-xl transition-all duration-500 ${
                              isMysteryLocked
                                ? 'border-amber-500/30 bg-gradient-to-br from-surface-container-low via-surface-container-low to-amber-950/20'
                                : event.completed 
                                  ? 'border-secondary/30' 
                                  : 'border-outline-variant/10'
                            } ${plannerMode === 'list' ? 'flex flex-col sm:flex-row items-start sm:items-center gap-6' : ''}`}
                          >
                            <div className="absolute top-6 right-6 flex sm:flex-col gap-2 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-300 z-10">
                              <motion.button 
                                whileHover={{ scale: 1.2 }}
                                whileTap={{ scale: 0.8 }}
                                initial={false}
                                animate={{ 
                                  scale: event.completed ? [1, 1.4, 1] : 1,
                                  rotate: event.completed ? [0, 15, 0] : 0
                                }}
                                onClick={() => toggleEventCompletion(event)}
                                className={`p-2 transition-colors ${event.completed ? 'text-secondary' : 'text-outline hover:text-secondary'}`}
                                title={event.completed ? "Mark as Incomplete" : "Mark as Complete"}
                              >
                                {event.completed ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                              </motion.button>
                              <motion.button 
                                whileHover={{ scale: 1.1, rotate: 15 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => {
                                  navigator.clipboard.writeText(event.id);
                                  setToast("Date invitation code copied! 💌");
                                }}
                                className="p-2 text-outline hover:text-primary transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                                title="Copy Date Code"
                                aria-label="Copy Date Code"
                              >
                                <Share2 className="w-4 h-4" />
                              </motion.button>
                              <motion.button 
                                whileHover={{ scale: 1.1, rotate: 15 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => {
                                  setEditingEvent(event);
                                  setIsEventModalOpen(true);
                                }}
                                className="p-2 text-outline hover:text-primary transition-colors"
                              >
                                <Settings className="w-4 h-4" />
                              </motion.button>
                              <motion.button 
                                whileHover={{ scale: 1.1, rotate: -15 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => deleteEvent(event.id)}
                                className="p-2 text-outline hover:text-error transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </motion.button>
                            </div>
                            
                            <div className={`flex ${plannerMode === 'list' ? 'flex-row items-center gap-6' : 'flex-col sm:flex-row gap-6 sm:gap-8'} w-full`}>
                              <div className={`flex flex-row sm:flex-col items-center justify-center bg-primary/10 rounded-2xl px-6 py-4 sm:py-6 h-fit border border-primary/20 shadow-inner ${plannerMode === 'list' ? 'min-w-[80px]' : 'min-w-[80px] sm:min-w-[100px]'}`}>
                                <span className="text-[10px] sm:text-xs uppercase font-bold text-primary tracking-[0.2em] sm:mb-1 mr-2 sm:mr-0">
                                  {new Date(event.date).toLocaleDateString('en-ZA', { month: 'short' })}
                                </span>
                                <span className="text-3xl sm:text-4xl font-serif text-primary">
                                  {new Date(event.date).toLocaleDateString('en-ZA', { day: 'numeric' })}
                                </span>
                              </div>
                              
                              <div className="space-y-4 flex-1 pr-0 sm:pr-8">
                                <div className="space-y-2">
                                  <div className="flex items-center gap-3 flex-wrap">
                                    <h3 className={`text-2xl sm:text-3xl font-serif leading-tight tracking-tight transition-all duration-500 ${
                                      event.completed ? 'text-outline line-through' : 'text-on-surface'
                                    }`}>
                                      {isMysteryLocked ? 'Mystery Date Night ✨' : event.title}
                                    </h3>
                                    {event.mood && (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          hapticLight();
                                          setRomanticTipsMood(event.mood as DateMood);
                                          setIsRomanticTipsModalOpen(true);
                                        }}
                                        title={`View relationship exercises for ${event.mood} dates`}
                                        className="cursor-pointer hover:scale-105 transition-transform"
                                      >
                                        <MoodBadge mood={event.mood} size="sm" />
                                      </button>
                                    )}
                                    {event.completed && (
                                      <motion.div
                                        initial={{ scale: 0, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        className="text-secondary"
                                      >
                                        <CheckCircle2 className="w-6 h-6" />
                                      </motion.div>
                                    )}
                                  </div>

                                  {isMysteryLocked ? (
                                    <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20 space-y-2">
                                      <p className="text-xs text-amber-200/90 font-medium italic">
                                        🔒 Details are sealed! Scratch off the golden card to reveal what your love has planned.
                                      </p>
                                      {event.mysteryClue && (
                                        <p className="text-[11px] text-amber-300 font-bold">
                                          💌 Clue: "{event.mysteryClue}"
                                        </p>
                                      )}
                                      <button
                                        onClick={() => { hapticLight(); setMysteryEventToReveal(event); }}
                                        className="bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[10px] uppercase font-bold tracking-widest px-4 py-2 rounded-full shadow-sm hover:shadow-md flex items-center gap-1.5 active:scale-95 transition-all"
                                      >
                                        <Unlock className="w-3.5 h-3.5" /> Scratch & Reveal Date
                                      </button>
                                    </div>
                                  ) : (
                                    <>
                                      {event.tags && event.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                          {event.tags.map((tag, tIdx) => (
                                            <span key={tIdx} className="text-[10px] uppercase tracking-widest font-bold bg-primary/10 text-primary px-3 py-1 rounded-full border border-primary/20">
                                              {tag}
                                            </span>
                                          ))}
                                        </div>
                                      )}
                                      {event.description && (
                                        <p className={`text-on-surface/70 text-sm sm:text-base leading-relaxed ${plannerMode === 'list' ? 'line-clamp-1' : 'line-clamp-3'}`}>
                                          {event.description}
                                        </p>
                                      )}
                                    </>
                                  )}

                                  {/* Scrapbook Memory Preview if Completed */}
                                  {event.completed && (
                                    <div className="mt-3 p-3 rounded-2xl bg-surface-container/70 border border-outline-variant/15 flex items-center justify-between gap-3">
                                      {event.memory ? (
                                        <div className="flex items-center gap-2.5 truncate">
                                          <div className="flex items-center text-amber-400 font-bold text-xs shrink-0">
                                            <Star className="w-3.5 h-3.5 fill-amber-400 mr-0.5" />
                                            {event.memory.rating}.0
                                          </div>
                                          <span className="text-xs text-on-surface/80 italic truncate font-serif">
                                            "{event.memory.recapNote || 'Cherished moment'}"
                                          </span>
                                        </div>
                                      ) : (
                                        <span className="text-xs text-outline/60 italic">
                                          No scrapbook memory written yet.
                                        </span>
                                      )}

                                      <button
                                        onClick={() => {
                                          hapticLight();
                                          setIsScrapbookModalOpen(true);
                                        }}
                                        className="shrink-0 text-[10px] uppercase font-bold tracking-wider text-primary hover:underline flex items-center gap-1"
                                      >
                                        <Camera className="w-3.5 h-3.5" />
                                        {event.memory ? 'View in Scrapbook' : '+ Add Memory'}
                                      </button>
                                    </div>
                                  )}
                                </div>
                                
                                <div className="flex flex-wrap gap-x-8 gap-y-3 pt-4 border-t border-outline-variant/10">
                                  {event.time && (
                                    <div className="flex items-center gap-2.5 text-outline text-xs font-bold uppercase tracking-widest">
                                      <Clock className="w-4 h-4 text-primary/60" />
                                      <span>{event.time}</span>
                                    </div>
                                  )}
                                  {event.location && !isMysteryLocked && (
                                    <div className="flex items-center gap-2.5 text-outline text-xs font-bold uppercase tracking-widest">
                                      <MapPin className="w-4 h-4 text-primary/60" />
                                      <span>{event.location}</span>
                                    </div>
                                  )}
                                  {event.goalId && goals.find(g => g.id === event.goalId) && (
                                    <div className="flex items-center gap-2.5 text-outline text-xs font-bold uppercase tracking-widest">
                                      <History className="w-4 h-4 text-primary/60" />
                                      <span>{goals.find(g => g.id === event.goalId)?.name}</span>
                                    </div>
                                  )}
                                {user && event.rsvps && event.rsvps[user.uid] && (
                                  <div className={`flex items-center gap-2.5 text-xs uppercase tracking-widest font-bold ${
                                    event.rsvps[user.uid] === 'Going' ? 'text-secondary' : 
                                    event.rsvps[user.uid] === 'Maybe' ? 'text-primary' : 'text-error'
                                  }`}>
                                    <div className={`w-3 h-3 rounded-full shadow-sm ${
                                      event.rsvps[user.uid] === 'Going' ? 'bg-secondary' : 
                                      event.rsvps[user.uid] === 'Maybe' ? 'bg-primary' : 'bg-error'
                                    }`} />
                                    <span>RSVP: {event.rsvps[user.uid]}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                  ) : (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="py-20 text-center bg-surface-container-low rounded-3xl border-2 border-dashed border-outline-variant/20"
                    >
                      <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Calendar className="w-10 h-10 text-primary opacity-50" />
                      </div>
                      <h3 className="text-2xl font-serif mb-2">No dates planned yet</h3>
                      <p className="text-outline text-sm mb-8 max-w-xs mx-auto">Your romantic journey is a blank canvas. Start planning your next bloom today.</p>
                      <button 
                        onClick={() => setIsEventModalOpen(true)}
                        className="bg-primary text-on-primary-fixed px-8 py-4 rounded-full font-bold shadow-lg shadow-primary/20 active:scale-95 transition-transform"
                      >
                        Schedule Your First Date
                      </button>
                    </motion.div>
                  )
                )}
              </div>
            </motion.div>
          )}

          {view === 'wishlist' && (
            <WishlistView
              bucketList={bucketList}
              onBack={() => setView('home')}
              onAddBucketItem={handleAddBucketItem}
              onPlanDateFromBucket={handlePlanDateFromBucket}
              onSaveGoalFromBucket={handleSaveGoalFromBucket}
              onRemoveBucketItem={handleRemoveBucketItem}
            />
          )}

          {view === 'scrapbook' && (
            <ScrapbookView
              completedEvents={events.filter(e => e.completed)}
              onBack={() => setView('home')}
              onSaveMemory={handleSaveMemory}
              onPlanNewDate={() => {
                setEditingEvent(null);
                setIsEventModalOpen(true);
              }}
            />
          )}

          {view === 'milestones' && (
            <MilestonesView
              startDate={relationshipStartDate}
              onUpdateStartDate={handleUpdateRelationshipStartDate}
              events={events}
              onBack={() => setView('home')}
              onPlanDate={() => {
                setEditingEvent(null);
                setIsEventModalOpen(true);
              }}
            />
          )}

          {view === 'relationship' && (
            <RelationshipSettingsView
              user={user}
              relationshipData={relationshipData}
              onBack={() => setView('home')}
              onUpdatePartner={handleUpdatePartner}
              onDisconnectPartner={handleDisconnectPartner}
              onOpenInviteModal={() => setIsInviteModalOpen(true)}
              onUpdateProfileAvatar={handleUpdateProfileAvatar}
            />
          )}

          {view === 'dreams' && (
            <DreamsView
              goals={goals}
              transactions={transactions}
              onBack={() => setView('home')}
              onNewDream={() => {
                setEditingGoal(null);
                setNewGoal({ name: '', target: '', deadline: '' });
                setIsGoalModalOpen(true);
              }}
              onRecordContribution={(goal) => {
                setFundData({ goalId: goal.id, amount: '', contributor: 'Me' });
                setIsFundModalOpen(true);
              }}
              onAdjustGoal={(goal) => {
                setGoalToAdjust(goal);
              }}
              onEditGoal={(goal) => {
                setEditingGoal(goal);
                setNewGoal({
                  name: goal.name,
                  target: goal.targetAmount.toString(),
                  deadline: goal.deadline,
                });
                setIsGoalModalOpen(true);
              }}
              onArchiveGoal={handleArchiveGoal}
              onUnarchiveGoal={handleUnarchiveGoal}
              onDeleteGoal={deleteGoal}
            />
          )}
        </AnimatePresence>
      </main>

      {/* Side Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <div className="fixed inset-0 z-[150] flex">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full max-w-[280px] bg-surface-container h-full shadow-2xl border-r border-outline-variant/10 p-6 flex flex-col"
            >
              <div className="flex justify-between items-center mb-10">
                <h3 className="text-2xl font-serif text-primary">Menu</h3>
                <button onClick={() => setIsMenuOpen(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto no-scrollbar -mx-2 px-2 space-y-8">
                <div className="flex flex-col items-center p-6 bg-surface-container-low rounded-3xl border border-outline-variant/10">
                  <div className="h-20 w-20 rounded-full overflow-hidden border-2 border-primary/20 mb-4">
                    <img 
                      className="w-full h-full object-cover" 
                      src={profileData.photoURL || user?.photoURL || AVATAR_NAV} 
                      alt="Profile" 
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <p className="font-serif text-xl text-center truncate w-full">{profileData.displayName || user?.displayName || 'User'}</p>
                  <p className="text-xs uppercase tracking-widest font-bold text-outline/60 truncate w-full text-center">{user?.email}</p>
                </div>

                <div className="space-y-1.5">
                  <button 
                    onClick={() => {
                      hapticLight();
                      setIsMenuOpen(false);
                      setView('dreams');
                    }}
                    className="w-full flex items-center gap-3.5 p-3 rounded-2xl hover:bg-primary/10 text-on-surface transition-colors group cursor-pointer"
                  >
                    <div className="p-2 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors">
                      <Target className="w-4 h-4 text-primary" />
                    </div>
                    <span className="font-bold text-xs">Our Dreams & Goals</span>
                  </button>

                  <button 
                    onClick={() => {
                      hapticLight();
                      setIsMenuOpen(false);
                      setView('scrapbook');
                    }}
                    className="w-full flex items-center gap-3.5 p-3 rounded-2xl hover:bg-primary/10 text-on-surface transition-colors group cursor-pointer"
                  >
                    <div className="p-2 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors">
                      <Camera className="w-4 h-4 text-primary" />
                    </div>
                    <span className="font-bold text-xs">Date Scrapbook</span>
                  </button>

                  <button 
                    onClick={() => {
                      hapticLight();
                      setIsMenuOpen(false);
                      setView('milestones');
                    }}
                    className="w-full flex items-center gap-3.5 p-3 rounded-2xl hover:bg-primary/10 text-on-surface transition-colors group"
                  >
                    <div className="p-2 bg-secondary/10 rounded-xl group-hover:bg-secondary/20 transition-colors">
                      <Award className="w-4 h-4 text-secondary" />
                    </div>
                    <span className="font-bold text-xs">Milestones & Streaks</span>
                  </button>

                  <button 
                    onClick={() => {
                      hapticLight();
                      setIsMenuOpen(false);
                      setIsWrappedModalOpen(true);
                    }}
                    className="w-full flex items-center gap-3.5 p-3 rounded-2xl hover:bg-primary/10 text-on-surface transition-colors group"
                  >
                    <div className="p-2 bg-amber-500/10 rounded-xl group-hover:bg-amber-500/20 transition-colors">
                      <Trophy className="w-4 h-4 text-amber-500" />
                    </div>
                    <span className="font-bold text-xs">Year in Love (Wrapped)</span>
                  </button>

                  <button 
                    onClick={() => {
                      hapticLight();
                      setIsMenuOpen(false);
                      setIsSplitterModalOpen(true);
                    }}
                    className="w-full flex items-center gap-3.5 p-3 rounded-2xl hover:bg-primary/10 text-on-surface transition-colors group"
                  >
                    <div className="p-2 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors">
                      <Utensils className="w-4 h-4 text-primary" />
                    </div>
                    <span className="font-bold text-xs">Who Treats Next?</span>
                  </button>

                  <button 
                    onClick={() => {
                      hapticLight();
                      setIsMenuOpen(false);
                      setView('wishlist');
                    }}
                    className="w-full flex items-center gap-3.5 p-3 rounded-2xl hover:bg-primary/10 text-on-surface transition-colors group"
                  >
                    <div className="p-2 bg-secondary/10 rounded-xl group-hover:bg-secondary/20 transition-colors">
                      <Bookmark className="w-4 h-4 text-secondary" />
                    </div>
                    <span className="font-bold text-xs">Date Wishlist</span>
                  </button>

                  <button 
                    onClick={() => {
                      hapticLight();
                      setIsMenuOpen(false);
                      setIsInviteModalOpen(true);
                    }}
                    className="w-full flex items-center gap-3.5 p-3 rounded-2xl hover:bg-primary/10 text-on-surface transition-colors group"
                  >
                    <div className="p-2 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors">
                      <QrCode className="w-4 h-4 text-primary" />
                    </div>
                    <span className="font-bold text-xs">Partner Invite QR</span>
                  </button>

                  <button 
                    onClick={() => {
                      setIsMenuOpen(false);
                      setIsProfileModalOpen(true);
                    }}
                    className="w-full flex items-center gap-3.5 p-3 rounded-2xl hover:bg-primary/10 text-on-surface transition-colors group"
                  >
                    <div className="p-2 bg-surface-container-highest rounded-xl text-outline">
                      <Settings className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-xs">Edit Profile</span>
                  </button>

                  <button 
                    onClick={() => {
                      setIsMenuOpen(false);
                      setView('relationship');
                    }}
                    className="w-full flex items-center gap-3.5 p-3 rounded-2xl hover:bg-primary/10 text-on-surface transition-colors group"
                  >
                    <div className="p-2 bg-surface-container-highest rounded-xl text-outline">
                      <History className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-xs">Relationship Settings</span>
                  </button>

                  <div className="pt-4 px-2">
                    <div className="p-4 bg-surface-container-low/50 backdrop-blur-xl rounded-2xl border border-outline-variant/10 shadow-inner">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-primary/10 rounded-xl">
                          <Palette className="w-4 h-4 text-primary" />
                        </div>
                        <span className="text-xs uppercase tracking-wider font-semibold text-outline">Theme</span>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 bg-surface-container-highest/30 rounded-xl p-1 border border-outline-variant/5">
                        {[
                          { id: 'light', icon: Sun, label: 'Light' },
                          { id: 'system', icon: Monitor, label: 'Auto' },
                          { id: 'dark', icon: Moon, label: 'Dark' }
                        ].map((option) => (
                          <button
                            key={option.id}
                            onClick={() => setTheme(option.id as any)}
                            className={`relative flex flex-col items-center justify-center gap-1.5 py-2.5 rounded-lg transition-all min-h-[44px] overflow-hidden group ${
                              theme === option.id 
                                ? 'text-on-primary-fixed' 
                                : 'text-outline hover:text-on-surface hover:bg-white/5'
                            }`}
                          >
                            {theme === option.id && (
                              <motion.div 
                                layoutId="activeTheme"
                                className="absolute inset-0 bg-gradient-to-br from-primary to-primary-container shadow-md shadow-primary/20"
                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                              />
                            )}
                            <option.icon className={`w-4 h-4 relative z-10 transition-transform ${theme === option.id ? 'scale-110' : 'group-hover:scale-110'}`} />
                            <span className="text-[11px] font-semibold tracking-wider relative z-10">{option.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => {
                  setIsMenuOpen(false);
                  handleLogout();
                }}
                className="w-full flex items-center gap-3.5 p-3.5 rounded-2xl hover:bg-error/10 text-error transition-colors mt-auto min-h-[48px]"
              >
                <div className="p-2 bg-error/10 rounded-lg">
                  <LogOut className="w-4 h-4" />
                </div>
                <span className="font-semibold text-sm">Sign Out</span>
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Goal Creation Modal */}
      <AnimatePresence>
        {isGoalModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsGoalModalOpen(false)}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="relative w-full max-w-md sm:max-w-xl md:max-w-2xl bg-surface-container rounded-t-3xl sm:rounded-3xl p-8 shadow-2xl border border-outline-variant/10 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl font-serif text-on-surface">{editingGoal ? 'Edit Dream' : 'Plant a New Dream'}</h3>
                  <p className="text-outline text-xs mt-1">
                    {editingGoal ? 'Update your target amount, date, or dream title.' : 'Define your next shared milestone and savings target.'}
                  </p>
                </div>
                <button 
                  onClick={() => {
                    setIsGoalModalOpen(false);
                    setEditingGoal(null);
                    setNewGoal({ name: '', target: '', deadline: '' });
                  }} 
                  className="p-2.5 hover:bg-white/5 rounded-full transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center text-outline hover:text-on-surface"
                  aria-label="Close dream modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            
            <form onSubmit={handleAddGoal} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-wider font-semibold text-outline/80 ml-1">Dream Name</label>
                <input 
                  autoFocus
                  type="text" 
                  placeholder="e.g. Weekend in Franschhoek"
                  className="w-full bg-surface-container-high/50 border-2 border-outline-variant/20 rounded-2xl px-5 py-4 focus:border-primary outline-none transition-all font-serif text-xl sm:text-2xl placeholder:text-outline/30 shadow-inner min-h-[48px]"
                  value={newGoal.name}
                  onChange={e => setNewGoal({...newGoal, name: e.target.value})}
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-wider font-semibold text-outline/80 ml-1">Target Amount (R)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-outline/50 font-serif text-lg">R</span>
                    <input 
                      type="number" 
                      placeholder="0.00"
                      className="w-full bg-surface-container-high/50 border-2 border-outline-variant/20 rounded-2xl pl-10 pr-5 py-4 focus:border-primary outline-none transition-all font-sans text-lg sm:text-xl shadow-inner min-h-[48px]"
                      value={newGoal.target}
                      onChange={e => setNewGoal({...newGoal, target: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-wider font-semibold text-outline/80 ml-1">Target Date</label>
                  <input 
                    type="date" 
                    className="w-full bg-surface-container-high/50 border-2 border-outline-variant/20 rounded-2xl px-5 py-4 focus:border-primary outline-none transition-all font-sans text-base sm:text-lg appearance-none shadow-inner min-h-[48px]"
                    value={newGoal.deadline}
                    onChange={e => setNewGoal({...newGoal, deadline: e.target.value})}
                  />
                </div>
              </div>

              <div className="pt-2">
                <button 
                  type="submit"
                  className="w-full bg-gradient-to-r from-primary to-primary-container text-on-primary-fixed py-4 rounded-2xl font-bold shadow-xl shadow-primary/10 active:scale-[0.98] transition-all hover:shadow-primary/20 min-h-[48px]"
                >
                  {editingGoal ? 'Save Dream Changes' : 'Plant Dream Goal'}
                </button>
                <p className="text-center text-xs text-outline/60 mt-3 font-medium">Collaborative couple savings start here</p>
              </div>
            </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Record Contribution Modal (Disclaims manual tracking, validates positive amounts, prevents duplicates) */}
      <RecordContributionModal
        isOpen={isFundModalOpen}
        onClose={() => setIsFundModalOpen(false)}
        goals={goals}
        initialGoalId={fundData.goalId}
        onRecordContribution={handleRecordContribution}
      />

      {/* Adjust Goal Plan Modal (Extends deadlines, adjusts targets, archives overdue/lagging goals) */}
      <AdjustGoalPlanModal
        isOpen={!!goalToAdjust}
        onClose={() => setGoalToAdjust(null)}
        goal={goalToAdjust}
        onSaveAdjustedGoal={handleSaveAdjustedGoal}
        onArchiveGoal={handleArchiveGoal}
      />

      {/* Event Creation Modal */}
      <AnimatePresence>
        {isEventModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEventModalOpen(false)}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="relative w-full max-w-md sm:max-w-xl md:max-w-2xl bg-surface-container rounded-t-3xl sm:rounded-3xl p-8 shadow-2xl border border-outline-variant/10 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-2xl font-serif">{editingEvent ? 'Edit Date Night' : 'Plan a Date Night'}</h3>
                  <p className="text-outline text-xs mt-1">Schedule your next shared date, reservation, or surprise.</p>
                </div>
                <button 
                  onClick={() => setIsEventModalOpen(false)} 
                  className="p-2.5 hover:bg-white/5 rounded-full transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center text-outline hover:text-on-surface"
                  aria-label="Close date planner modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={editingEvent ? handleUpdateEvent : handleAddEvent} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-outline">Title</label>
                  <input 
                    autoFocus
                    type="text" 
                    placeholder="e.g. Candlelit Dinner"
                    className="w-full bg-transparent border-b-2 border-outline-variant/30 py-2 focus:border-primary outline-none transition-colors font-serif text-xl"
                    value={editingEvent ? editingEvent.title : newEvent.title}
                    onChange={e => editingEvent ? setEditingEvent({...editingEvent, title: e.target.value}) : setNewEvent({...newEvent, title: e.target.value})}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-outline">Description</label>
                  <textarea 
                    placeholder="Details about the date..."
                    className="w-full bg-transparent border-b-2 border-outline-variant/30 py-2 focus:border-primary outline-none transition-colors font-sans text-sm resize-none h-20"
                    value={editingEvent ? editingEvent.description : newEvent.description}
                    onChange={e => editingEvent ? setEditingEvent({...editingEvent, description: e.target.value}) : setNewEvent({...newEvent, description: e.target.value})}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-outline">Date</label>
                    <input 
                      type="date" 
                      className="w-full bg-transparent border-b-2 border-outline-variant/30 py-2 focus:border-primary outline-none transition-colors font-sans text-sm"
                      value={editingEvent ? editingEvent.date : newEvent.date}
                      onChange={e => editingEvent ? setEditingEvent({...editingEvent, date: e.target.value}) : setNewEvent({...newEvent, date: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-outline">Time</label>
                    <input 
                      type="time" 
                      className="w-full bg-transparent border-b-2 border-outline-variant/30 py-2 focus:border-primary outline-none transition-colors font-sans text-sm"
                      value={editingEvent ? editingEvent.time : newEvent.time}
                      onChange={e => editingEvent ? setEditingEvent({...editingEvent, time: e.target.value}) : setNewEvent({...newEvent, time: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-outline">Location</label>
                  <input 
                    type="text" 
                    placeholder="Where to?"
                    className="w-full bg-transparent border-b-2 border-outline-variant/30 py-2 focus:border-primary outline-none transition-colors font-sans text-sm"
                    value={editingEvent ? editingEvent.location : newEvent.location}
                    onChange={e => editingEvent ? setEditingEvent({...editingEvent, location: e.target.value}) : setNewEvent({...newEvent, location: e.target.value})}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-outline">Link to Dream (Goal)</label>
                  <select 
                    className="w-full bg-transparent border-b-2 border-outline-variant/30 py-2 focus:border-primary outline-none transition-colors font-sans text-sm appearance-none"
                    value={editingEvent ? (editingEvent.goalId || '') : newEvent.goalId}
                    onChange={e => editingEvent ? setEditingEvent({...editingEvent, goalId: e.target.value}) : setNewEvent({...newEvent, goalId: e.target.value})}
                  >
                    <option value="" className="bg-surface">No Goal Linked</option>
                    {goals.map(g => (
                      <option key={g.id} value={g.id} className="bg-surface">{g.name}</option>
                    ))}
                  </select>
                </div>

                {/* Date Mood & Vibe Selector */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-outline flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-secondary" /> Date Mood & Vibe
                    </label>
                    <span className="text-[11px] font-semibold text-primary">
                      {editingEvent?.mood || newEvent.mood || 'Romantic'}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {DATE_MOODS.map(mood => {
                      const isSelected = editingEvent 
                        ? (editingEvent.mood || 'Romantic') === mood.id 
                        : (newEvent.mood || 'Romantic') === mood.id;
                      return (
                        <button
                          key={mood.id}
                          type="button"
                          onClick={() => {
                            hapticLight();
                            if (editingEvent) {
                              setEditingEvent({ ...editingEvent, mood: mood.id });
                            } else {
                              setNewEvent({ ...newEvent, mood: mood.id });
                            }
                          }}
                          className={`py-2 px-1.5 rounded-xl text-xs font-semibold flex flex-col items-center justify-center gap-1 border transition-all cursor-pointer min-h-[50px] ${
                            isSelected 
                              ? `${mood.activeClass} shadow-xs ring-2 ring-primary/30` 
                              : 'bg-surface-container-high/60 text-outline border-outline-variant/20 hover:text-on-surface hover:border-outline-variant/40'
                          }`}
                        >
                          <span className="text-base">{mood.emoji}</span>
                          <span className="text-[11px] font-medium leading-none">{mood.label}</span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        hapticLight();
                        const currentMood = (editingEvent?.mood || newEvent.mood || 'Romantic') as DateMood;
                        setRomanticTipsMood(currentMood);
                        setIsRomanticTipsModalOpen(true);
                      }}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-secondary hover:text-secondary/80 bg-secondary/10 hover:bg-secondary/15 px-3 py-1.5 rounded-xl border border-secondary/25 transition-all cursor-pointer"
                    >
                      <MessageCircleHeart className="w-3.5 h-3.5 text-secondary" />
                      <span>View 3 {editingEvent?.mood || newEvent.mood || 'Romantic'} Connection Exercises</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-outline">Tags</label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {Array.from(new Set([
                      'Date Night', 'Travel', 'Anniversary', 'Adventure', 'Relaxation',
                      ...(editingEvent?.tags || []),
                      ...(newEvent.tags || [])
                    ])).map(tag => {
                      const isSelected = editingEvent 
                        ? (editingEvent.tags?.includes(tag)) 
                        : (newEvent.tags.includes(tag));
                      
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => {
                            if (editingEvent) {
                              const currentTags = editingEvent.tags || [];
                              const newTags = currentTags.includes(tag) 
                                ? currentTags.filter(t => t !== tag) 
                                : [...currentTags, tag];
                              setEditingEvent({...editingEvent, tags: newTags});
                            } else {
                              const currentTags = newEvent.tags;
                              const newTags = currentTags.includes(tag) 
                                ? currentTags.filter(t => t !== tag) 
                                : [...currentTags, tag];
                              setNewEvent({...newEvent, tags: newTags});
                            }
                          }}
                          className={`text-[10px] uppercase tracking-widest font-bold px-3 py-1.5 rounded-full border transition-all ${isSelected ? 'bg-primary text-on-primary-fixed border-primary' : 'bg-transparent text-outline border-outline-variant/30 hover:border-primary/50'}`}
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                  
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Add custom tag..."
                      className="flex-1 bg-transparent border-b border-outline-variant/30 py-1 focus:border-primary outline-none transition-colors font-sans text-xs"
                      value={customTag}
                      onChange={e => setCustomTag(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const tag = customTag.trim();
                          if (tag) {
                            if (editingEvent) {
                              const currentTags = editingEvent.tags || [];
                              if (!currentTags.includes(tag)) {
                                setEditingEvent({...editingEvent, tags: [...currentTags, tag]});
                              }
                            } else {
                              const currentTags = newEvent.tags;
                              if (!currentTags.includes(tag)) {
                                setNewEvent({...newEvent, tags: [...currentTags, tag]});
                              }
                            }
                            setCustomTag('');
                          }
                        }
                      }}
                    />
                    <button 
                      type="button"
                      onClick={() => {
                        const tag = customTag.trim();
                        if (tag) {
                          if (editingEvent) {
                            const currentTags = editingEvent.tags || [];
                            if (!currentTags.includes(tag)) {
                              setEditingEvent({...editingEvent, tags: [...currentTags, tag]});
                            }
                          } else {
                            const currentTags = newEvent.tags;
                            if (!currentTags.includes(tag)) {
                              setNewEvent({...newEvent, tags: [...currentTags, tag]});
                            }
                          }
                          setCustomTag('');
                        }
                      }}
                      className="text-[10px] uppercase tracking-widest font-bold text-primary hover:text-primary/80 transition-colors"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Mystery Date Surprise Mode */}
                <div className="flex items-center gap-3 pt-2">
                  <button 
                    type="button"
                    onClick={() => {
                      hapticLight();
                      if (editingEvent) {
                        setEditingEvent({ ...editingEvent, isMystery: !editingEvent.isMystery });
                      } else {
                        setNewEvent({ ...newEvent, isMystery: !newEvent.isMystery });
                      }
                    }}
                    className={`w-10 h-6 rounded-full transition-colors relative ${
                      (editingEvent?.isMystery ?? newEvent.isMystery) ? 'bg-amber-500' : 'bg-outline-variant/30'
                    }`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
                      (editingEvent?.isMystery ?? newEvent.isMystery) ? 'left-5' : 'left-1'
                    }`} />
                  </button>
                  <span className="text-xs font-bold uppercase tracking-widest text-on-surface flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-amber-500" />
                    Mystery Date (Scratch-off Reveal)
                  </span>
                </div>

                {(editingEvent ? editingEvent.isMystery : newEvent.isMystery) && (
                  <div className="space-y-1.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 animate-in fade-in slide-in-from-top-1 duration-200">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-amber-300">
                      Mystery Clue / Dress Code (Teaser for Partner)
                    </label>
                    <input 
                      type="text"
                      placeholder="e.g. Wear comfortable shoes and something warm for sunset!"
                      value={editingEvent ? (editingEvent.mysteryClue || '') : (newEvent.mysteryClue || '')}
                      onChange={e => {
                        if (editingEvent) setEditingEvent({ ...editingEvent, mysteryClue: e.target.value });
                        else setNewEvent({ ...newEvent, mysteryClue: e.target.value });
                      }}
                      className="w-full bg-surface-container border border-outline-variant/30 rounded-xl px-3 py-2 text-xs text-on-surface outline-none focus:border-amber-400"
                    />
                  </div>
                )}

                <div className="flex items-center gap-3 pt-2">
                  <button 
                    type="button"
                    onClick={() => editingEvent ? setEditingEvent({...editingEvent, reminder: !editingEvent.reminder}) : setNewEvent({...newEvent, reminder: !newEvent.reminder})}
                    className={`w-10 h-6 rounded-full transition-colors relative ${editingEvent ? (editingEvent.reminder ? 'bg-primary' : 'bg-outline-variant/30') : (newEvent.reminder ? 'bg-primary' : 'bg-outline-variant/30')}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${editingEvent ? (editingEvent.reminder ? 'left-5' : 'left-1') : (newEvent.reminder ? 'left-5' : 'left-1')}`} />
                  </button>
                  <span className="text-xs font-bold uppercase tracking-widest text-outline">Set Reminder</span>
                </div>

                {(editingEvent ? editingEvent.reminder : newEvent.reminder) && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-outline">Remind me</label>
                    <div className="flex gap-2">
                      {[
                        { label: '15m', value: 15 },
                        { label: '1h', value: 60 },
                        { label: '1d', value: 1440 }
                      ].map((opt) => {
                        const isSelected = editingEvent 
                          ? editingEvent.reminderMinutes === opt.value 
                          : newEvent.reminderMinutes === opt.value;
                        
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => editingEvent 
                              ? setEditingEvent({...editingEvent, reminderMinutes: opt.value}) 
                              : setNewEvent({...newEvent, reminderMinutes: opt.value})
                            }
                            className={`flex-1 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all ${
                              isSelected 
                                ? 'bg-primary text-on-primary-fixed border-primary' 
                                : 'bg-transparent text-outline border-outline-variant/30 hover:border-primary/50'
                            }`}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {editingEvent && user && (
                  <div className="space-y-2 pt-4 border-t border-outline-variant/10">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-outline">Your RSVP</label>
                    <div className="flex gap-2">
                      {(['Going', 'Maybe', 'Not Going'] as const).map((status) => (
                        <button
                          key={status}
                          type="button"
                          onClick={() => {
                            const newRsvps = { ...(editingEvent.rsvps || {}), [user.uid]: status };
                            setEditingEvent({ ...editingEvent, rsvps: newRsvps });
                          }}
                          className={`flex-1 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all ${
                            editingEvent.rsvps?.[user.uid] === status 
                              ? 'bg-primary text-on-primary-fixed border-primary' 
                              : 'bg-transparent text-outline border-outline-variant/30 hover:border-primary/50'
                          }`}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {editingEvent && (
                  <div className="p-4 bg-surface-container-highest rounded-2xl space-y-2 border border-outline-variant/10">
                    <div className="flex items-center justify-between">
                      <p className="text-xs uppercase tracking-wider font-semibold text-outline">Date Invitation Code</p>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(editingEvent.id);
                          setToast("Date code copied to clipboard! 💌");
                        }}
                        className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                      >
                        Copy Code
                      </button>
                    </div>
                    <code className="block w-full bg-black/20 p-2.5 rounded-xl text-xs font-mono break-all select-all">
                      {editingEvent.id}
                    </code>
                  </div>
                )}

                <div className="flex gap-3 mt-4">
                  {editingEvent && (
                    <button 
                      type="button"
                      onClick={() => {
                        deleteEvent(editingEvent.id);
                        setIsEventModalOpen(false);
                      }}
                      className="flex-1 bg-error/10 text-error py-4 rounded-2xl font-bold active:scale-95 transition-transform min-h-[48px]"
                    >
                      Delete Date
                    </button>
                  )}
                  <button 
                    type="submit"
                    className="flex-[2] bg-primary text-on-primary-fixed py-4 rounded-2xl font-bold active:scale-95 transition-transform min-h-[48px] shadow-lg shadow-primary/20"
                  >
                    {editingEvent ? 'Save Date Night' : 'Schedule Date Night'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Relationship Modal */}
      <AnimatePresence>
        {isRelationshipModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsRelationshipModalOpen(false)}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="relative w-full max-w-md sm:max-w-xl md:max-w-2xl bg-surface-container rounded-t-3xl sm:rounded-3xl p-8 shadow-2xl border border-outline-variant/10 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-serif">Relationship Settings</h3>
                <button onClick={() => setIsRelationshipModalOpen(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-6">
                <div className="p-6 bg-surface-container-low rounded-2xl border border-outline-variant/10">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-primary/10 rounded-full">
                      <History className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm">Shared Journey</h4>
                      <p className="text-xs text-outline">Manage your shared goals and contributions.</p>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => setIsBreakUpConfirmOpen(true)}
                    className="w-full bg-error/10 text-error py-4 rounded-full font-bold flex items-center justify-center gap-2 hover:bg-error/20 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    End Relationship
                  </button>
                </div>

                <div className="p-6 bg-secondary/5 rounded-2xl border border-secondary/10">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-secondary/10 rounded-full">
                      <Sparkles className="w-6 h-6 text-secondary" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm">Solo Growth</h4>
                      <p className="text-xs text-outline">Get words of encouragement for your journey.</p>
                    </div>
                  </div>
                  
                  <button 
                    onClick={getEncouragement}
                    disabled={isAdviceLoading}
                    className="w-full bg-secondary text-on-secondary py-4 rounded-full font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-50"
                  >
                    {isAdviceLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sun className="w-4 h-4" />}
                    Get Encouragement
                  </button>

                  <button 
                    onClick={getSoloDateIdea}
                    disabled={isAdviceLoading}
                    className="w-full bg-surface-container-highest text-on-surface py-4 rounded-full font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-50 mt-4"
                  >
                    {isAdviceLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Utensils className="w-4 h-4" />}
                    Solo Date Idea
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {soloDateIdea && (
          <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSoloDateIdea(null)}
              className="absolute inset-0 bg-background/90 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-md bg-surface-container rounded-3xl p-8 shadow-2xl border border-secondary/20 text-center"
            >
              <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Utensils className="w-8 h-8 text-secondary" />
              </div>
              <h3 className="text-2xl font-serif text-secondary mb-2">{soloDateIdea.title}</h3>
              <p className="text-on-surface/80 text-sm leading-relaxed mb-8">{soloDateIdea.description}</p>
              
              <div className="flex gap-4">
                <button 
                  onClick={() => setSoloDateIdea(null)}
                  className="flex-1 py-4 rounded-full font-bold text-outline hover:bg-white/5 transition-colors"
                >
                  Close
                </button>
                <button 
                  onClick={() => {
                    setEditingEvent(null);
                    setNewEvent({
                      title: soloDateIdea.title,
                      description: soloDateIdea.description,
                      date: new Date().toISOString().split('T')[0],
                      time: '18:00',
                      location: '',
                      reminder: true,
                      reminderMinutes: 60,
                      tags: ['Solo', 'Self-Love']
                    });
                    setSoloDateIdea(null);
                    setIsRelationshipModalOpen(false);
                    setIsEventModalOpen(true);
                  }}
                  className="flex-[2] bg-secondary text-on-secondary py-4 rounded-full font-bold shadow-lg shadow-secondary/20 active:scale-95 transition-transform"
                >
                  Plan This Solo Date
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Break Up Summary Modal */}
      <AnimatePresence>
        {isBreakUpSummaryOpen && breakUpData && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/95 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-md bg-surface-container rounded-3xl p-8 shadow-2xl border border-error/20"
            >
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-error/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ArrowUpDown className="w-10 h-10 text-error" />
                </div>
                <h3 className="text-3xl font-serif text-error mb-2">Fair Split Summary</h3>
                <p className="text-outline text-sm">Here is how the shared funds will be distributed based on contributions.</p>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex justify-between items-center p-4 bg-surface-container-low rounded-2xl border border-outline-variant/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden border border-primary/20">
                      <img src={AVATAR_ME} alt="Me" className="w-full h-full object-cover" />
                    </div>
                    <span className="font-bold">Your Share</span>
                  </div>
                  <span className="text-xl font-serif text-primary">R {breakUpData.me.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</span>
                </div>

                <div className="flex justify-between items-center p-4 bg-surface-container-low rounded-2xl border border-outline-variant/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden border border-outline-variant/20">
                      <img src={AVATAR_THEM} alt="Them" className="w-full h-full object-cover" />
                    </div>
                    <span className="font-bold">Partner's Share</span>
                  </div>
                  <span className="text-xl font-serif text-outline">R {breakUpData.them.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</span>
                </div>

                <div className="p-4 bg-error/5 rounded-2xl border border-error/10 text-center">
                  <p className="text-xs uppercase tracking-widest font-bold text-error mb-1">Dreams Affected</p>
                  <p className="text-2xl font-serif">{breakUpData.goalsAffected} Shared Goals</p>
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => setIsBreakUpSummaryOpen(false)}
                  className="flex-1 py-4 rounded-full font-bold text-outline hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={finalizeBreakUp}
                  className="flex-[2] bg-error text-white py-4 rounded-full font-bold shadow-lg shadow-error/20 active:scale-95 transition-transform"
                >
                  Finalize Split
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Encouragement Popup */}
      <AnimatePresence>
        {dailyAdvice && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 pointer-events-none">
            <motion.div 
              initial={{ y: 50, opacity: 0, scale: 0.9 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -50, opacity: 0, scale: 0.9 }}
              className="bg-secondary text-on-secondary p-8 rounded-3xl shadow-2xl border border-white/20 max-w-sm pointer-events-auto text-center relative overflow-hidden"
            >
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
              <Sparkles className="w-10 h-10 mx-auto mb-4 opacity-50" />
              <h4 className="text-2xl font-serif mb-4">A Word for You</h4>
              <p className="text-lg italic leading-relaxed mb-6 font-medium">"{dailyAdvice}"</p>
              <button 
                onClick={() => setDailyAdvice(null)}
                className="w-full bg-white/20 hover:bg-white/30 py-4 rounded-full font-bold text-xs uppercase tracking-widest transition-all active:scale-95"
              >
                Keep Going
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Event Confirmation Modal */}
      <AnimatePresence>
        {eventToDelete && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEventToDelete(null)}
              className="absolute inset-0 bg-background/90 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-md bg-surface-container rounded-3xl p-8 shadow-2xl border border-error/20 text-center"
            >
              <div className="w-16 h-16 bg-error/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 className="w-8 h-8 text-error" />
              </div>
              <h3 className="text-2xl font-serif text-on-surface mb-2">Delete this Date Night?</h3>
              <p className="text-on-surface/80 text-sm leading-relaxed mb-8">
                Are you sure you want to remove this date night from your planner?
              </p>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setEventToDelete(null)}
                  className="flex-1 py-3.5 rounded-2xl font-bold text-outline hover:bg-white/5 transition-colors min-h-[48px]"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDeleteEvent}
                  className="flex-[2] bg-error text-white py-3.5 rounded-2xl font-bold shadow-lg shadow-error/20 active:scale-95 transition-transform min-h-[48px]"
                >
                  Delete Date Night
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* End Relationship Confirmation Modal */}
      <AnimatePresence>
        {isBreakUpConfirmOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsBreakUpConfirmOpen(false)}
              className="absolute inset-0 bg-background/90 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-md bg-surface-container rounded-3xl p-8 shadow-2xl border border-error/20 text-center"
            >
              <div className="w-16 h-16 bg-error/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <HeartOff className="w-8 h-8 text-error" />
              </div>
              <h3 className="text-2xl font-serif text-on-surface mb-2">End Shared Journey?</h3>
              <p className="text-on-surface/80 text-sm leading-relaxed mb-8">
                This will split all shared funds and archive your shared dreams. This action is significant and should be considered carefully.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={() => setIsBreakUpConfirmOpen(false)}
                  className="flex-1 py-4 rounded-full font-bold text-outline hover:bg-white/5 transition-colors order-2 sm:order-1"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    handleBreakUp();
                    setIsBreakUpConfirmOpen(false);
                  }}
                  className="flex-[2] bg-error text-white py-4 rounded-full font-bold shadow-lg shadow-error/20 active:scale-95 transition-transform order-1 sm:order-2"
                >
                  Yes, End Journey
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {goalToDelete && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setGoalToDelete(null)}
              className="absolute inset-0 bg-background/90 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-md bg-surface-container rounded-3xl p-8 shadow-2xl border border-error/20 text-center"
            >
              <div className="w-16 h-16 bg-error/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 className="w-8 h-8 text-error" />
              </div>
              <h3 className="text-2xl font-serif text-on-surface mb-2">Delete this Dream?</h3>
              <p className="text-on-surface/80 text-sm leading-relaxed mb-8">
                Are you sure you want to delete this goal? This action cannot be undone and all associated progress will be lost.
              </p>
              
              <div className="flex gap-4">
                <button 
                  onClick={() => setGoalToDelete(null)}
                  className="flex-1 py-4 rounded-full font-bold text-outline hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDeleteGoal}
                  className="flex-[2] bg-error text-white py-4 rounded-full font-bold shadow-lg shadow-error/20 active:scale-95 transition-transform"
                >
                  Delete Goal
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Profile Settings Modal */}
      <AnimatePresence>
        {isProfileModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsProfileModalOpen(false)}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="relative w-full max-w-md sm:max-w-lg md:max-w-xl bg-surface-container rounded-t-3xl sm:rounded-3xl p-8 shadow-2xl border border-outline-variant/10 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-serif">Profile Settings</h3>
                <button onClick={() => setIsProfileModalOpen(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div className="flex flex-col items-center mb-8">
                  <div className="h-28 w-28 rounded-full overflow-hidden border-4 border-primary/20 mb-4 shadow-2xl">
                    <img 
                      className="w-full h-full object-cover" 
                      src={profileData.photoURL || user?.photoURL || AVATAR_NAV} 
                      alt="Profile preview" 
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <p className="text-xs uppercase tracking-widest font-bold text-outline/70">Profile Preview</p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-widest font-bold text-outline/70 ml-1">Display Name</label>
                  <input 
                    type="text" 
                    placeholder="Your name"
                    className="w-full bg-surface-container-high/50 border-2 border-outline-variant/20 rounded-2xl px-5 py-4 focus:border-primary outline-none transition-all font-serif text-2xl shadow-inner"
                    value={profileData.displayName}
                    onChange={e => setProfileData({...profileData, displayName: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-widest font-bold text-outline/70 ml-1">Photo URL</label>
                  <input 
                    type="url" 
                    placeholder="https://example.com/photo.jpg"
                    className="w-full bg-surface-container-high/50 border-2 border-outline-variant/20 rounded-2xl px-5 py-4 focus:border-primary outline-none transition-all font-sans text-sm shadow-inner"
                    value={profileData.photoURL}
                    onChange={e => setProfileData({...profileData, photoURL: e.target.value})}
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full bg-primary text-on-primary-fixed py-4 rounded-full font-bold mt-8 active:scale-95 transition-transform"
                >
                  Save Changes
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Date Memories & Scrapbook Modal */}
      <DateScrapbookModal
        isOpen={isScrapbookModalOpen}
        onClose={() => setIsScrapbookModalOpen(false)}
        completedEvents={events.filter(e => e.completed)}
        onSaveMemory={handleSaveMemory}
        onPlanNewDate={() => {
          setView('planner');
          setIsEventModalOpen(true);
        }}
      />

      {/* Anniversary & Milestone Tracker Modal */}
      <AnniversaryTracker
        isOpen={isMilestonesModalOpen}
        onClose={() => setIsMilestonesModalOpen(false)}
        startDate={relationshipStartDate}
        onUpdateStartDate={handleUpdateRelationshipStartDate}
        events={events}
        isWidget={false}
      />

      {/* Mystery Date Reveal Modal */}
      <MysteryDateRevealModal
        isOpen={!!mysteryEventToReveal}
        event={mysteryEventToReveal}
        onClose={() => setMysteryEventToReveal(null)}
        onReveal={handleRevealMystery}
        isCreator={mysteryEventToReveal?.ownerUid === user?.uid}
      />

      {/* Year in Love (Wrapped) Modal */}
      <YearInLoveModal
        isOpen={isWrappedModalOpen}
        onClose={() => setIsWrappedModalOpen(false)}
        goals={goals}
        transactions={transactions}
        events={events}
        startDate={relationshipStartDate}
        reportingYear={2026}
      />

      {/* Partner Invite Link & QR Code Modal */}
      <PartnerInviteModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        userUid={user?.uid || ''}
        userName={profileData.displayName || user?.displayName || 'Your Partner'}
        onConnectPartner={handleConnectPartner}
      />

      {/* Who Treats Next? Splitter Modal */}
      <WhoTreatsSplitterModal
        isOpen={isSplitterModalOpen}
        onClose={() => setIsSplitterModalOpen(false)}
        events={events}
        lastTreatedBy={lastTreatedBy}
        onUpdateTreatTurn={(treatedBy) => {
          setLastTreatedBy(treatedBy);
          setToast(`Updated next treat turn! 🥂`);
        }}
      />

      {/* Shared Date Wishlist / Bucket List Modal */}
      <DateBucketListModal
        isOpen={isBucketListModalOpen}
        onClose={() => setIsBucketListModalOpen(false)}
        bucketList={bucketList}
        onAddBucketItem={handleAddBucketItem}
        onPlanDateFromBucket={handlePlanDateFromBucket}
        onSaveGoalFromBucket={handleSaveGoalFromBucket}
        onRemoveBucketItem={handleRemoveBucketItem}
      />

      {/* Romantic Tips & Connection Exercises Modal */}
      <RomanticTipsModal
        isOpen={isRomanticTipsModalOpen}
        onClose={() => setIsRomanticTipsModalOpen(false)}
        initialMood={romanticTipsMood}
      />

      {/* Floating Partner Quick-Chat Drawer & Slightly Translucent Bubble (Optimized for all devices) */}
      {view !== 'chat' && (
        <div className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] lg:bottom-6 right-3 sm:right-6 z-40 flex flex-col items-end">
          <AnimatePresence>
            {isQuickChatOpen ? (
              <motion.div
                key="quick-chat-drawer"
                initial={{ opacity: 0, y: 16, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 16, scale: 0.96 }}
                className="w-[calc(100vw-1.5rem)] sm:w-[400px] lg:w-[430px] max-w-full mb-2 shadow-2xl"
              >
                <PartnerChatView
                  compactMode
                  currentUserUid={user.uid}
                  currentUserName={profileData.displayName || user.displayName || 'You'}
                  currentUserPhoto={profileData.photoURL || user.photoURL || AVATAR_ME}
                  partnerUid={resolvedPartnerUid}
                  partnerName={relationshipData?.partnerName || (isDemoMode ? 'Alex' : 'Your Partner')}
                  partnerPhoto={relationshipData?.partnerPhoto || AVATAR_THEM}
                  messages={messages}
                  goals={goals}
                  events={events}
                  onSendMessage={handleSendMessage}
                  onToggleReaction={handleToggleReaction}
                  onTogglePinMessage={handleTogglePinMessage}
                  onVoteSpot={handleVoteSpot}
                  onVotePoll={handleVotePoll}
                  onRespondDateInvite={handleRespondDateInvite}
                  onDeleteMessage={handleDeleteMessage}
                  onOpenInviteModal={() => setIsInviteModalOpen(true)}
                  onSelectGoalForFunding={(goalId) => {
                    setFundData({ goalId, amount: '', contributor: 'Me' });
                    setIsFundModalOpen(true);
                  }}
                  onNavigateToPlanner={() => {
                    setIsQuickChatOpen(false);
                    setView('planner');
                  }}
                  onPlanDateFromSpot={(spot) => {
                    setIsQuickChatOpen(false);
                    setEditingEvent(null);
                    setNewEvent({
                      title: spot.name,
                      description: spot.summary || `Shared date idea at ${spot.name}`,
                      date: new Date().toISOString().split('T')[0],
                      time: '19:00',
                      location: spot.location,
                      goalId: '',
                      reminder: true,
                      reminderMinutes: 60,
                      tags: [spot.category || 'Date Spot', 'Shared in Chat'],
                      mood: spot.mood || 'Romantic',
                      isMystery: false,
                      mysteryClue: ''
                    });
                    setIsEventModalOpen(true);
                    setView('planner');
                  }}
                  onViewSpotOnMap={(spot) => {
                    setIsQuickChatOpen(false);
                    setFocusedMapSpot(spot);
                    setView('map');
                  }}
                  onClose={() => setIsQuickChatOpen(false)}
                />
              </motion.div>
            ) : (
              <motion.button
                key="quick-chat-fab"
                type="button"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  hapticLight();
                  setIsQuickChatOpen(true);
                }}
                className="relative flex items-center gap-2 px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-full bg-primary/85 hover:bg-primary/95 text-on-primary-fixed backdrop-blur-md border border-white/20 shadow-lg transition-all cursor-pointer min-h-[44px]"
                title="Open Partner Chat"
                aria-label="Open Partner Chat"
              >
                <MessageCircleHeart className="w-5 h-5 shrink-0" />
                <span className="text-xs font-bold hidden sm:inline">Partner Chat</span>
                {unreadChatCount > 0 && (
                  <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center tabular-nums shadow-xs">
                    {unreadChatCount > 99 ? '99+' : unreadChatCount}
                  </span>
                )}
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Bottom Navigation (Mobile & Tablet) */}
      <nav 
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface/75 backdrop-blur-2xl border-t border-outline-variant/20 dark:border-white/10 pb-[max(env(safe-area-inset-bottom,0px),0.65rem)] pt-1.5 px-2 shadow-[0_-8px_32px_rgba(0,0,0,0.2)]"
        aria-label="Bottom navigation"
      >
        <div className="max-w-md mx-auto grid grid-cols-5 items-center gap-0.5">
          <NavItem icon={<Home className="w-5 h-5" fill={view === 'home' ? "currentColor" : "none"} />} label="Home" active={view === 'home'} onClick={() => { hapticLight(); setIsQuickChatOpen(false); setView('home'); }} />
          <NavItem icon={<Compass className="w-5 h-5" />} label="Discover" active={view === 'discover'} onClick={() => { hapticLight(); setIsQuickChatOpen(false); setView('discover'); }} />
          <NavItem icon={<MapIcon className="w-5 h-5" />} label="Map" active={view === 'map'} onClick={() => { hapticLight(); setIsQuickChatOpen(false); setView('map'); }} />
          <NavItem icon={<Calendar className="w-5 h-5" />} label="Planner" active={view === 'planner'} onClick={() => { hapticLight(); setIsQuickChatOpen(false); setView('planner'); }} />
          <NavItem icon={<MessageCircleHeart className="w-5 h-5" />} label="Chat" badgeCount={unreadChatCount} active={view === 'chat'} onClick={() => { hapticLight(); setIsQuickChatOpen(false); setView('chat'); }} />
        </div>
      </nav>
    </div>
  );
}

function ContributorCard({ name, amount, status, avatar, isActive = false }: { 
  name: string, 
  amount: string, 
  status: string, 
  avatar: string,
  isActive?: boolean 
}) {
  return (
    <div className={`p-3.5 sm:p-4 rounded-xl bg-surface-container/60 border transition-all flex flex-col justify-between space-y-2.5 ${isActive ? 'border-primary/25 bg-primary/[0.03]' : 'border-outline-variant/10'}`}>
      <div className="flex items-center gap-2.5">
        <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden border-2 shrink-0 ${isActive ? 'border-primary/40 shadow-xs' : 'border-outline-variant/20'}`}>
          <img className="w-full h-full object-cover" src={avatar} alt={name} referrerPolicy="no-referrer" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-serif text-base sm:text-lg font-bold truncate text-on-surface leading-tight">{name}</p>
          <span className="text-[11px] text-outline/70 block truncate">Partner</span>
        </div>
        {isActive && (
          <span className="w-2 h-2 rounded-full bg-secondary shrink-0" title="Active Account" />
        )}
      </div>

      <div className="pt-1 border-t border-outline-variant/10">
        <span className="text-[10px] uppercase tracking-wider font-semibold text-outline/60 block">Contributed</span>
        <p className="font-serif text-base sm:text-lg font-bold text-on-surface tracking-tight truncate mt-0.5">{amount}</p>
        <p className="text-[11px] text-outline/70 truncate mt-1 flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isActive ? 'bg-secondary' : 'bg-outline/40'}`} />
          <span className="truncate">{status}</span>
        </p>
      </div>
    </div>
  );
}

function HistoryItem({ icon, avatar, title, subtitle, amount, amountColor = "text-on-surface", iconBg }: {
  icon?: React.ReactNode,
  avatar?: string,
  title: string,
  subtitle: string,
  amount: string,
  amountColor?: string,
  iconBg: string,
  key?: string | number
}) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: -10 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      whileHover={{ x: 5, backgroundColor: "rgba(255, 255, 255, 0.05)" }}
      className="flex items-center justify-between bg-surface/20 p-3 rounded-xl transition-colors cursor-default"
    >
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-full ${iconBg} flex items-center justify-center overflow-hidden shadow-inner`}>
          {avatar ? (
            <img src={avatar} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            icon
          )}
        </div>
        <div>
          <p className="font-bold text-base">{title}</p>
          <p className="text-xs text-outline/60 font-medium uppercase tracking-tight">{subtitle}</p>
        </div>
      </div>
      <p className={`font-bold text-lg ${amountColor}`}>{amount}</p>
    </motion.div>
  );
}

function NavItem({ icon, label, active = false, badgeCount = 0, onClick }: { icon: React.ReactNode, label: string, active?: boolean, badgeCount?: number, onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`relative flex-1 flex flex-col items-center justify-center min-h-[48px] py-1 px-1 rounded-xl transition-all select-none cursor-pointer group outline-none ${
        active ? 'text-primary' : 'text-outline hover:text-on-surface'
      }`}
      aria-label={badgeCount > 0 ? `${label} (${badgeCount} unread)` : label}
      aria-current={active ? 'page' : undefined}
    >
      <div className={`relative p-1.5 rounded-xl transition-all flex items-center justify-center ${active ? 'bg-primary/20 shadow-xs scale-105' : 'group-hover:bg-surface-container-highest/60'}`}>
        {icon}
        {badgeCount > 0 && (
          <span className="absolute -top-1 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center tabular-nums shadow-xs">
            {badgeCount > 99 ? '99+' : badgeCount}
          </span>
        )}
      </div>
      <span className={`text-[11px] font-medium tracking-tight mt-0.5 truncate max-w-full leading-tight ${
        active ? 'font-bold text-primary' : 'text-outline'
      }`}>
        {label}
      </span>
    </button>
  );
}
