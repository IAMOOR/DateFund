/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
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
  HeartOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import CalendarComponent from './components/Calendar';
import { GoogleGenAI, Type } from "@google/genai";
import { 
  auth, 
  db, 
  googleProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
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
  handleFirestoreError, 
  OperationType,
  User
} from './firebase';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.error("GEMINI_API_KEY is missing! Please set it in your environment variables.");
}
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY || '' });

const AVATAR_ME = "https://lh3.googleusercontent.com/aida-public/AB6AXuCI9vqhcwkWHop2yys08rGQQzat2sxu6ZZ3ccAEl78y0LKuYkxl0rz8HC0zEFQzI66P1lWxRJK7p3w3hMX8kAgaXbDc6-lQdwO2632Ap8j_6uqVs7g49OXnVw66TwJyMrPxt3pNM38_HucD5mPSALugnsLnP1oPZQ_5IuIRAb7vUA21Px47ew9NdZDGBaSwvimDqCRNrR1sRpL01CjplTZXcfHvsTAbgMCx0BIbdwfRDTDvCgfQF8-1TwnwlPnAf8jsgoVTnmk23FE";
const AVATAR_THEM = "https://lh3.googleusercontent.com/aida-public/AB6AXuAtSrWZ1IwuPWyeSCMCaLnRPy3BkUAKSiMvfJhcK9E5rJP3vovDVSODIg8sP4Q3rADR1gaNrhe9UaQ_fq10mqBujTlzOtTWG87Fjp-671jT35crUY5spPerfxObhMTtP5snzeDplyp5ipu1WEMDbPKY5LvyNyGpi50vqZozS-yyRrPWAEFBzxsvzB8RmfWhB32HTc59fVsigig_oA3WGXBjy8kbIbHtoszMYp8v5EGHeRMtOcujZIs-eXfLHtd_0oFxNPPFmGhziq8";
const AVATAR_NAV = "https://lh3.googleusercontent.com/aida-public/AB6AXuA20UXs9pIK-DCOsonkEu1jFsmy1lA1Ber-Qz_WRjRxv1kDJtFW3kCgu2-LPm16-MT53WL_17D3m4fm0TiD60AvSvEy9llEaq89YxnqlcGysbofDKyx_S814mqMekZlxDC2r5enku9HhhAckS1Scibd1xRf-BcE2NiTJzVd-awYAxPjaM7JWoLSOIL8WkNEGvgBVF1m4-fr4wco6N8AVlK_FhBOfikhacdvnJY4GAgnCmP1Qkqsj55mCtOFoy8MT2CfI9E3SvGDgpM";

interface Goal {
  id: string;
  ownerUid: string;
  collaborators: string[];
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  createdAt: string;
}

interface Transaction {
  id: string;
  ownerUid: string;
  goalId: string;
  goalName: string;
  amount: number;
  date: string;
  contributor: 'Me' | 'Them';
  type: 'deposit' | 'withdrawal';
  createdAt: string;
}

interface Event {
  id: string;
  ownerUid: string;
  title: string;
  description?: string;
  date: string;
  time?: string;
  location?: string;
  goalId?: string;
  reminder?: boolean;
  reminderMinutes?: number;
  reminderSent?: boolean;
  tags?: string[];
  collaborators: string[];
  rsvps?: { [userId: string]: 'Going' | 'Maybe' | 'Not Going' };
  createdAt: string;
}

interface DiscoverIdea {
  title: string;
  source: string;
  summary: string;
  imageSearchTerm?: string;
}

interface MapPlace {
  name: string;
  address: string;
  rating: number | string;
  description: string;
}

type View = 'home' | 'history' | 'discover' | 'map' | 'planner';

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
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(() => {
    const saved = localStorage.getItem('datefund-theme');
    return (saved as 'light' | 'dark' | 'system') || 'system';
  });
  const [isJoinGoalModalOpen, setIsJoinGoalModalOpen] = useState(false);
  const [isJoinEventModalOpen, setIsJoinEventModalOpen] = useState(false);
  const [isBreakUpConfirmOpen, setIsBreakUpConfirmOpen] = useState(false);
  const [plannerMode, setPlannerMode] = useState<'list' | 'calendar'>('calendar');
  const [plannerSort, setPlannerSort] = useState<'date' | 'time' | 'title'>('date');
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [joinGoalId, setJoinGoalId] = useState('');
  const [joinEventId, setJoinEventId] = useState('');
  const [newGoal, setNewGoal] = useState({ name: '', target: '', deadline: '' });
  const [fundData, setFundData] = useState({ goalId: '', amount: '', contributor: 'Me' as 'Me' | 'Them' });
  const [newEvent, setNewEvent] = useState({ title: '', description: '', date: '', time: '', location: '', goalId: '', reminder: false, reminderMinutes: 15, tags: [] as string[] });
  const [profileData, setProfileData] = useState({ displayName: '', photoURL: '' });
  const [customTag, setCustomTag] = useState('');
  const [isSuggesting, setIsSuggesting] = useState(false);
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
  const [toast, setToast] = useState<string | null>(null);
  const [activeReminders, setActiveReminders] = useState<Event[]>([]);

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

  // Theme Listener
  useEffect(() => {
    const root = window.document.documentElement;
    localStorage.setItem('datefund-theme', theme);
    
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
      const handleChange = () => applyTheme('system');
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
      if (currentUser) {
        const userRef = doc(db, 'users', currentUser.uid);
        try {
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const data = userSnap.data();
            setProfileData({
              displayName: data.displayName || '',
              photoURL: data.photoURL || ''
            });
          } else {
            // Initialize profile
            const initialProfile = {
              uid: currentUser.uid,
              email: currentUser.email,
              displayName: currentUser.displayName || '',
              photoURL: currentUser.photoURL || '',
              createdAt: new Date().toISOString()
            };
            await setDoc(userRef, initialProfile);
            setProfileData({
              displayName: initialProfile.displayName,
              photoURL: initialProfile.photoURL
            });
          }
        } catch (err) {
          handleFirestoreError(err, OperationType.GET, `users/${currentUser.uid}`);
        }
      }
    });
    return () => unsubscribe();
  }, []);

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
          console.error("Error getting location:", error);
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
            new Notification(`DateFund Task Reminder: ${event.title}`, {
              body: `Task at ${event.time || 'today'}! ${event.location ? `at ${event.location}` : ''}`,
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
    if (!user) {
      setGoals([]);
      setTransactions([]);
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
      const goalsList = snapshot.docs.map(doc => ({ ...doc.data() } as Goal));
      setGoals(goalsList.sort((a, b) => b.id.localeCompare(a.id)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'goals'));

    const transactionsQuery = query(collection(db, 'transactions'), where('ownerUid', '==', user.uid));
    const unsubscribeTransactions = onSnapshot(transactionsQuery, (snapshot) => {
      const transactionsList = snapshot.docs.map(doc => ({ ...doc.data() } as Transaction));
      setTransactions(transactionsList.sort((a, b) => b.date.localeCompare(a.date)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'transactions'));

    const eventsQuery = query(collection(db, 'events'), where('collaborators', 'array-contains', user.uid));
    const unsubscribeEvents = onSnapshot(eventsQuery, (snapshot) => {
      const eventsList = snapshot.docs.map(doc => ({ ...doc.data() } as Event));
      setEvents(eventsList.sort((a, b) => a.date.localeCompare(b.date)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'events'));

    return () => {
      unsubscribeGoals();
      unsubscribeTransactions();
      unsubscribeEvents();
    };
  }, [user]);

  const totalBalance = useMemo(() => goals.reduce((acc, g) => acc + g.currentAmount, 0), [goals]);
  
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
      console.error("Login failed", error);
      if (error.code !== 'auth/popup-closed-by-user') {
        setAuthError("Google sign-in failed. Please try again.");
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
      console.error("Reset failed", error);
      let message = "Failed to send reset email.";
      if (error.code === 'auth/user-not-found') message = "No account found with this email.";
      setAuthError(message);
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
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (error: any) {
      console.error("Email auth failed", error);
      let message = "Authentication failed.";
      if (error.code === 'auth/email-already-in-use') message = "This email is already registered.";
      if (error.code === 'auth/invalid-email') message = "Invalid email address.";
      if (error.code === 'auth/weak-password') message = "Password is too weak.";
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        message = "Invalid email or password.";
      }
      setAuthError(message);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setView('home');
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newGoal.name || !newGoal.target || !newGoal.deadline) return;
    
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
      setNewGoal({ name: '', target: '', deadline: '' });
      setIsGoalModalOpen(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `goals/${goalId}`);
    }
  };

  const handleAddFunds = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !fundData.goalId || !fundData.amount) return;

    const amount = parseFloat(fundData.amount);
    const goal = goals.find(g => g.id === fundData.goalId);
    if (!goal) return;

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

    try {
      // Atomic-ish update (not a transaction but good enough for this demo)
      await setDoc(doc(db, 'transactions', transactionId), transaction);
      await setDoc(doc(db, 'goals', goal.id), {
        ...goal,
        currentAmount: goal.currentAmount + amount
      });
      setFundData({ goalId: '', amount: '', contributor: 'Me' });
      setIsFundModalOpen(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'transactions/goals');
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
      collaborators: [user.uid],
      rsvps: { [user.uid]: 'Going' },
      createdAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'events', eventId), event);
      setNewEvent({ title: '', description: '', date: '', time: '', location: '', goalId: '', reminder: false, reminderMinutes: 15, tags: [] });
      setIsEventModalOpen(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `events/${eventId}`);
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
      const prompt = "Give a short, uplifting word of encouragement or advice for someone who is focusing on their solo journey and financial independence after a breakup. Keep it under 20 words.";
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt
      });
      setDailyAdvice(response.text || "You are strong, capable, and your future is bright.");
    } catch (error) {
      setDailyAdvice("Focus on your growth; the best is yet to come.");
    } finally {
      setIsAdviceLoading(false);
    }
  };

  const getSoloDateIdea = async () => {
    setIsAdviceLoading(true);
    try {
      const prompt = "Suggest one creative and fulfilling solo date idea for someone focusing on self-love and independence. Return as JSON with 'title' and 'description'.";
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING }
            },
            required: ["title", "description"]
          }
        }
      });
      const idea = JSON.parse(response.text || '{}');
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

  const deleteGoal = async (id: string) => {
    setGoalToDelete(id);
  };

  const confirmDeleteGoal = async () => {
    if (!goalToDelete) return;
    try {
      await deleteDoc(doc(db, 'goals', goalToDelete));
      setGoalToDelete(null);
      setToast("Goal deleted successfully.");
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `goals/${goalToDelete}`);
    }
  };

  const deleteEvent = async (id: string) => {
    setEventToDelete(id);
  };

  const confirmDeleteEvent = async () => {
    if (!eventToDelete) return;
    try {
      await deleteDoc(doc(db, 'events', eventToDelete));
      setEventToDelete(null);
      setToast("Task deleted successfully.");
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `events/${eventToDelete}`);
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

  const handleJoinGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !joinGoalId) return;

    try {
      const goalRef = doc(db, 'goals', joinGoalId);
      const goalSnap = await getDoc(goalRef);
      
      if (!goalSnap.exists()) {
        setToast("Goal not found. Check the ID.");
        return;
      }

      const goalData = goalSnap.data() as Goal;
      if (goalData.collaborators.includes(user.uid)) {
        setToast("You are already a collaborator!");
        setIsJoinGoalModalOpen(false);
        return;
      }

      await setDoc(goalRef, {
        collaborators: [...goalData.collaborators, user.uid]
      }, { merge: true });

      setToast("Joined goal successfully!");
      setJoinGoalId('');
      setIsJoinGoalModalOpen(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `goals/${joinGoalId}`);
    }
  };

  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => {
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
  }, [events, plannerSort]);

  const handleSuggestIdea = async () => {
    if (!user) return;
    setIsSuggesting(true);
    try {
      const goalsContext = goals.map(g => `${g.name} (Target: R ${g.targetAmount})`).join(', ');
      const eventsContext = events.map(e => `${e.title} (${e.tags?.join(', ') || 'no tags'})`).join(', ');

      const prompt = `Based on these financial goals: [${goalsContext}] and these past/planned events: [${eventsContext}], suggest ONE creative and romantic date idea. 
      The idea should be realistic and align with the goals (e.g., if they are saving for a big trip, suggest a low-cost but high-romance local date; if they have a "Fine Dining" goal, suggest a fancy restaurant idea).
      Return the response as a JSON object with 'title', 'description', and 'tags' (array of strings).`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              tags: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["title", "description", "tags"]
          }
        }
      });

      const idea = JSON.parse(response.text);
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
        setToast("Task not found. Check the ID.");
        return;
      }

      const eventData = eventSnap.data() as Event;
      if (eventData.collaborators.includes(user.uid)) {
        setToast("You are already a collaborator!");
        setIsJoinEventModalOpen(false);
        return;
      }

      await setDoc(eventRef, {
        collaborators: [...eventData.collaborators, user.uid],
        rsvps: { ...eventData.rsvps, [user.uid]: 'Going' }
      }, { merge: true });

      setToast("Joined task successfully!");
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
          <div className="text-center space-y-2">
            <h1 className="text-6xl font-serif text-primary">DateFund</h1>
            <p className="text-outline tracking-widest uppercase text-xs font-bold">Editorial Savings for Couples</p>
          </div>

          <div className="bg-surface-container rounded-3xl p-8 shadow-2xl border border-outline-variant/10">
            <h2 className="text-2xl font-serif mb-6 text-center">
              {authMode === 'signin' ? 'Welcome Back' : 'Create Account'}
            </h2>

            <form onSubmit={handleEmailAuth} className="space-y-6">
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest font-bold text-outline">Email Address</label>
                <input 
                  type="email" 
                  placeholder="you@example.com"
                  className={`w-full bg-transparent border-b-2 py-2 outline-none transition-colors ${emailError ? 'border-error' : 'border-outline-variant/30 focus:border-primary'}`}
                  value={email}
                  onChange={e => {
                    setEmail(e.target.value);
                    if (emailError) setEmailError('');
                  }}
                />
                {emailError && <p className="text-error text-[10px] font-bold uppercase tracking-widest mt-1">{emailError}</p>}
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest font-bold text-outline">Password</label>
                <input 
                  type="password" 
                  placeholder="••••••••"
                  className={`w-full bg-transparent border-b-2 py-2 outline-none transition-colors ${passwordError ? 'border-error' : 'border-outline-variant/30 focus:border-primary'}`}
                  value={password}
                  onChange={e => {
                    setPassword(e.target.value);
                    if (passwordError) setPasswordError('');
                  }}
                />
                {passwordError && <p className="text-error text-[10px] font-bold uppercase tracking-widest mt-1">{passwordError}</p>}
                
                {authMode === 'signin' && (
                  <div className="flex justify-end pt-1">
                    <button 
                      type="button"
                      onClick={handleForgotPassword}
                      disabled={isResettingPassword}
                      className="text-[10px] uppercase tracking-widest font-bold text-primary hover:underline disabled:opacity-50"
                    >
                      {isResettingPassword ? 'Sending...' : 'Forgot Password?'}
                    </button>
                  </div>
                )}

                {authMode === 'signup' && password && (
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] uppercase tracking-widest font-bold text-outline">Strength: {getStrengthLabel(passwordStrength)}</span>
                    </div>
                    <div className="h-1 w-full bg-surface-container-highest rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(passwordStrength / 5) * 100}%` }}
                        className={`h-full ${getStrengthColor(passwordStrength)}`}
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
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isAuthenticating}
              className="w-full bg-primary text-on-primary-fixed py-4 rounded-full font-bold mt-4 transition-all disabled:opacity-50"
            >
              {isAuthenticating ? 'Processing...' : (authMode === 'signin' ? 'Sign In' : 'Sign Up')}
            </motion.button>
            </form>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-outline-variant/20"></div>
              </div>
              <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-bold">
                <span className="bg-surface-container px-4 text-outline">Or continue with</span>
              </div>
            </div>

            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleLogin}
              className="w-full bg-surface-container-high text-on-surface py-4 rounded-full font-bold flex items-center justify-center gap-3 hover:bg-surface-container-highest transition-colors border border-outline-variant/10"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
              Google
            </motion.button>

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
      <nav className="fixed top-0 w-full z-50 bg-surface/60 backdrop-blur-md flex justify-between items-center px-6 h-16">
        <div className="flex items-center gap-4">
          <motion.div whileHover={{ scale: 1.1, rotate: 5 }} whileTap={{ scale: 0.9 }}>
            <Menu className="text-primary w-6 h-6 cursor-pointer" onClick={() => setIsMenuOpen(true)} />
          </motion.div>
          <motion.h1 
            whileHover={{ scale: 1.05 }}
            className="text-2xl font-serif text-primary cursor-pointer" 
            onClick={() => setView('home')}
          >
            DateFund
          </motion.h1>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-8 text-on-surface/70 font-bold uppercase tracking-widest text-[10px]">
            <button onClick={() => setView('home')} className={`${view === 'home' ? 'text-primary' : ''} hover:bg-white/5 transition-colors px-2 py-1 rounded uppercase`}>Home</button>
            <button onClick={() => setView('discover')} className={`${view === 'discover' ? 'text-primary' : ''} hover:bg-white/5 transition-colors px-2 py-1 rounded uppercase`}>Discover</button>
            <button onClick={() => setView('map')} className={`${view === 'map' ? 'text-primary' : ''} hover:bg-white/5 transition-colors px-2 py-1 rounded uppercase`}>Map</button>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleLogout}
              className="p-2 text-outline hover:text-primary transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
            <div 
              className="h-10 w-10 rounded-full overflow-hidden border border-outline-variant/20 cursor-pointer hover:border-primary transition-colors"
              onClick={() => setIsProfileModalOpen(true)}
            >
              <img 
                className="w-full h-full object-cover" 
                src={profileData.photoURL || user.photoURL || AVATAR_NAV} 
                alt="User profile" 
                referrerPolicy="no-referrer"
              />
            </div>
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
              className="relative w-full max-w-md bg-surface-container rounded-t-3xl sm:rounded-3xl p-8 shadow-2xl border border-primary/20"
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
                      <span key={idx} className="text-[10px] uppercase font-bold bg-primary/10 text-primary px-3 py-1 rounded-full">
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
              className="relative w-full max-w-md bg-surface-container rounded-t-3xl sm:rounded-3xl p-8 shadow-2xl border border-outline-variant/10"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-serif">Join Shared Task</h3>
                <button onClick={() => setIsJoinEventModalOpen(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <p className="text-outline text-xs mb-8 leading-relaxed">
                Enter the unique Task ID shared by your partner to collaborate on planning and RSVP to the date.
              </p>
              
              <form onSubmit={handleJoinEvent} className="space-y-6">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-outline">Task ID</label>
                  <input 
                    autoFocus
                    type="text" 
                    placeholder="Paste task ID here..."
                    className="w-full bg-transparent border-b-2 border-outline-variant/30 py-2 focus:border-primary outline-none transition-colors font-mono text-sm"
                    value={joinEventId}
                    onChange={e => setJoinEventId(e.target.value)}
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full bg-primary text-on-primary-fixed py-4 rounded-full font-bold active:scale-95 transition-transform"
                >
                  Join Task
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

      <main className="pt-24 pb-32 px-6 max-w-2xl mx-auto">
        <AnimatePresence mode="wait">
          {view === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              {/* Hero Section */}
              <div className="mb-12 p-6 sm:p-10 rounded-[2rem] sm:rounded-[3rem] bg-surface-container-low/30 backdrop-blur-3xl border border-white/5 relative overflow-hidden group shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)]">
                <div className="absolute -top-32 -right-32 w-80 h-80 bg-primary/10 rounded-full blur-[100px] group-hover:bg-primary/20 transition-colors duration-1000" />
                <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-secondary/5 rounded-full blur-[80px]" />
                
                <div className="relative z-10 space-y-6 sm:space-y-8">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-primary/10 rounded-2xl border border-primary/10 backdrop-blur-md">
                        <PiggyBank className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase tracking-[0.4em] font-bold text-outline/60">Total Balance</span>
                        <span className="text-[9px] text-primary/60 font-medium italic">Shared Date Fund</span>
                      </div>
                    </div>
                    <div className="flex -space-x-4 self-end sm:self-auto">
                      <motion.img 
                        whileHover={{ y: -5, zIndex: 20 }}
                        src={AVATAR_ME} 
                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-surface-container-high object-cover shadow-lg" 
                        alt="Me" 
                      />
                      <motion.img 
                        whileHover={{ y: -5, zIndex: 20 }}
                        src={AVATAR_THEM} 
                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-surface-container-high object-cover shadow-lg" 
                        alt="Them" 
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <div className="flex items-baseline gap-2 overflow-hidden">
                      <span className="text-xl sm:text-3xl font-serif text-primary/40">R</span>
                      <h2 className="text-4xl sm:text-7xl font-serif text-on-surface tracking-tighter leading-none truncate">
                        {totalBalance.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                      </h2>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-2 text-secondary bg-secondary/10 px-4 py-1.5 rounded-full text-[10px] font-bold border border-secondary/10 backdrop-blur-md w-fit"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>+ R 120.00 this week</span>
                      </motion.div>
                      <div className="hidden sm:block h-px flex-1 bg-gradient-to-r from-outline/10 to-transparent" />
                      <span className="text-[10px] text-outline/30 font-bold uppercase tracking-[0.2em]">Active Growth</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Current Primary Goal */}
              {goals.length > 0 && (
                <motion.div 
                  layoutId={goals[0].id}
                  whileHover={{ scale: 1.01, y: -4 }}
                  className="relative overflow-hidden bg-surface-container-low/20 backdrop-blur-xl rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-10 mb-12 group shadow-xl border border-white/5 transition-all duration-500"
                >
                  <div className="absolute -top-16 -right-16 w-40 h-40 bg-primary/5 rounded-full blur-3xl transition-transform group-hover:scale-150 duration-1000"></div>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-6 mb-8 relative z-10">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-primary/60">Primary Dream</span>
                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-white/5 rounded-md border border-white/5">
                          <div className="w-1 h-1 rounded-full bg-primary/40 animate-pulse" />
                          <span className="text-[8px] text-outline/40 font-mono tracking-tighter">ID: {goals[0].id}</span>
                        </div>
                      </div>
                      <h3 className="text-2xl sm:text-3xl font-serif leading-none">{goals[0].name}</h3>
                    </div>
                    <div className="bg-secondary-container/10 text-secondary px-4 py-2 rounded-2xl text-xs font-bold border border-secondary/10 backdrop-blur-md w-fit">
                      R {goals[0].targetAmount.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div className="relative h-6 w-full bg-surface-container-high/50 rounded-full overflow-hidden mb-6 border border-outline-variant/5 group/progress">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((goals[0].currentAmount / goals[0].targetAmount) * 100, 100)}%` }}
                      transition={{ duration: 1.5, ease: [0.34, 1.56, 0.64, 1] }}
                      className="absolute top-0 left-0 h-full bg-gradient-to-r from-secondary via-primary to-primary-container progress-glow rounded-full relative overflow-hidden"
                    >
                      <motion.div 
                        animate={{ 
                          x: ['-100%', '200%'],
                        }}
                        transition={{ 
                          duration: 3, 
                          repeat: Infinity, 
                          ease: "linear" 
                        }}
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12"
                      />
                    </motion.div>
                  </div>
                  <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-6 text-[10px] uppercase tracking-[0.2em] font-bold">
                    <div className="flex flex-col gap-1">
                      <span className="text-outline/30 text-[8px]">Progress</span>
                      <div className="flex items-center gap-2">
                        <span className="text-secondary text-base sm:text-lg leading-none">{((goals[0].currentAmount / goals[0].targetAmount) * 100).toFixed(1)}%</span>
                        <span className="text-outline/40">Accomplished</span>
                      </div>
                    </div>
                    <div className="flex flex-col sm:items-end gap-1">
                      <span className="text-outline/30 text-[8px]">To Go</span>
                      <div className="flex items-center gap-2">
                        <span className="text-outline/40">Remaining:</span>
                        <span className="text-primary text-base sm:text-lg leading-none">R {Math.max(0, goals[0].targetAmount - goals[0].currentAmount).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Goals Management Section */}
              <section className="mb-12">
                <div className="flex justify-between items-center mb-6">
                  <h4 className="font-serif text-xl">Our Dreams</h4>
                  <button 
                    onClick={() => setIsGoalModalOpen(true)}
                    className="text-primary text-xs uppercase tracking-widest font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> New Goal
                  </button>
                </div>
                <div className="space-y-4">
                  {goals.slice(1).map((goal, idx) => (
                    <motion.div 
                      key={goal.id}
                      layoutId={goal.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      whileHover={{ scale: 1.02, x: 5 }}
                      className="bg-surface-container-low rounded-2xl p-5 flex items-center justify-between group hover:bg-surface-container transition-all duration-300 border border-outline-variant/5 shadow-sm hover:shadow-md"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h5 className="font-serif text-lg">{goal.name}</h5>
                          <span className="text-[8px] bg-surface-container-highest px-2 py-0.5 rounded text-outline font-mono">ID: {goal.id}</span>
                          <span className="text-[10px] text-outline uppercase tracking-widest">Until {new Date(goal.deadline).toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' })}</span>
                        </div>
                        <div className="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary/40 rounded-full" 
                            style={{ width: `${Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-4 ml-6">
                        <div className="text-right">
                          <p className="font-bold text-sm">R {goal.targetAmount.toLocaleString()}</p>
                          <p className="text-[10px] text-outline">{((goal.currentAmount / goal.targetAmount) * 100).toFixed(0)}%</p>
                        </div>
                        <button 
                          onClick={() => deleteGoal(goal.id)}
                          className="p-2 text-outline hover:text-error transition-colors sm:opacity-0 sm:group-hover:opacity-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <ChevronRight className="w-4 h-4 text-outline" />
                      </div>
                    </motion.div>
                  ))}
                  {goals.length <= 1 && (
                    <div className="py-8 text-center border-2 border-dashed border-outline-variant/20 rounded-2xl">
                      <p className="text-outline text-sm italic">No other dreams yet. Start planning your next adventure.</p>
                    </div>
                  )}
                </div>
              </section>

              {/* Contributors Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
                <ContributorCard 
                  name="Me" 
                  amount={`R ${contributorStats.Me.total.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`} 
                  status={contributorStats.Me.lastDate ? `Last: ${contributorStats.Me.lastDate.toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' })}` : "No deposits yet"} 
                  avatar={AVATAR_ME} 
                  isActive 
                />
                <ContributorCard 
                  name="Them" 
                  amount={`R ${contributorStats.Them.total.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`} 
                  status={contributorStats.Them.lastDate ? `Last: ${contributorStats.Them.lastDate.toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' })}` : "No deposits yet"} 
                  avatar={AVATAR_THEM} 
                />
              </div>

              {/* Quick Actions */}
              <div className="space-y-4">
                <motion.button 
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsFundModalOpen(true)}
                  className="w-full bg-gradient-to-br from-primary to-primary-container text-on-primary-fixed py-5 rounded-full font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/10 hover:shadow-primary/20"
                >
                  <Plus className="w-5 h-5" />
                  Add Funds
                </motion.button>
                <div className="flex gap-4">
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      setToast("Link copied to clipboard!");
                    }}
                    className="flex-1 bg-surface-container-high text-on-surface py-4 rounded-full font-bold text-sm hover:bg-surface-container-highest transition-colors flex items-center justify-center gap-2"
                  >
                    <Share2 className="w-4 h-4" />
                    Invite
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsJoinGoalModalOpen(true)}
                    className="flex-1 bg-surface-container-high text-on-surface py-4 rounded-full font-bold text-sm hover:bg-surface-container-highest transition-colors flex items-center justify-center gap-2"
                  >
                    <PiggyBank className="w-4 h-4" />
                    Join Goal
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsGoalModalOpen(true)}
                    className="flex-1 bg-surface-container-high text-on-surface py-4 rounded-full font-bold text-sm hover:bg-surface-container-highest transition-colors flex items-center justify-center gap-2"
                  >
                    <Settings className="w-4 h-4" />
                    Manage
                  </motion.button>
                </div>
              </div>

              {/* Recent History */}
              <section className="mt-16">
                <div className="flex justify-between items-center mb-6">
                  <h4 className="font-serif text-xl">Recent Blooms</h4>
                  <button onClick={() => setView('history')} className="text-secondary text-xs uppercase tracking-widest font-bold">View All</button>
                </div>
                <div className="space-y-6">
                  {transactions.slice(0, 3).map((t, idx) => (
                    <HistoryItem 
                      key={t.id}
                      avatar={t.contributor === 'Me' ? AVATAR_ME : AVATAR_THEM}
                      title={t.goalName} 
                      subtitle={`${new Date(t.date).toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' })} • From ${t.contributor}`} 
                      amount={`${t.amount > 0 ? '+' : ''} R ${Math.abs(t.amount).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`} 
                      amountColor={t.amount > 0 ? "text-secondary" : "text-on-surface"}
                      iconBg={t.type === 'deposit' ? "bg-secondary/10" : "bg-primary/10"}
                    />
                  ))}
                </div>
              </section>
            </motion.div>
          )}

          {view === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="flex items-center gap-4 mb-8">
                <button onClick={() => setView('home')} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                  <ChevronRight className="w-6 h-6 rotate-180" />
                </button>
                <h2 className="text-3xl font-serif">History</h2>
              </div>
              
              <div className="space-y-6">
                {transactions.map((t, idx) => (
                  <HistoryItem 
                    key={t.id}
                    avatar={t.contributor === 'Me' ? AVATAR_ME : AVATAR_THEM}
                    title={t.goalName} 
                    subtitle={`${new Date(t.date).toLocaleDateString('en-ZA', { month: 'long', day: 'numeric', year: 'numeric' })} • From ${t.contributor}`} 
                    amount={`${t.amount > 0 ? '+' : ''} R ${Math.abs(t.amount).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`} 
                    amountColor={t.amount > 0 ? "text-secondary" : "text-on-surface"}
                    iconBg={t.type === 'deposit' ? "bg-secondary/10" : "bg-primary/10"}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {view === 'discover' && <DiscoverView location={location} goals={goals} events={events} />}
          {view === 'map' && <MapView location={location} />}
          {view === 'planner' && (
            <motion.div
              key="planner"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-8"
            >
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <h2 className="text-3xl font-serif">Planner</h2>
                  <p className="text-outline text-sm">Schedule your next romantic task idea.</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setIsJoinEventModalOpen(true)}
                    className="p-3 rounded-full bg-surface-container text-outline hover:text-primary transition-colors"
                    title="Join Shared Task"
                  >
                    <Share2 className="w-5 h-5" />
                  </button>
                  {plannerMode === 'list' && (
                    <div className="bg-surface-container p-1 rounded-full flex gap-1">
                      <button 
                        onClick={() => setPlannerSort('date')}
                        className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${plannerSort === 'date' ? 'bg-primary text-on-primary-fixed shadow-md' : 'text-outline hover:bg-white/5'}`}
                      >
                        Date
                      </button>
                      <button 
                        onClick={() => setPlannerSort('time')}
                        className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${plannerSort === 'time' ? 'bg-primary text-on-primary-fixed shadow-md' : 'text-outline hover:bg-white/5'}`}
                      >
                        Time
                      </button>
                      <button 
                        onClick={() => setPlannerSort('title')}
                        className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${plannerSort === 'title' ? 'bg-primary text-on-primary-fixed shadow-md' : 'text-outline hover:bg-white/5'}`}
                      >
                        Title
                      </button>
                    </div>
                  )}
                  <div className="bg-surface-container p-1 rounded-full flex gap-1">
                    <button 
                      onClick={() => setPlannerMode('list')}
                      className={`p-2 rounded-full transition-all ${plannerMode === 'list' ? 'bg-primary text-on-primary-fixed shadow-md' : 'text-outline hover:bg-white/5'}`}
                    >
                      <List className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setPlannerMode('calendar')}
                      className={`p-2 rounded-full transition-all ${plannerMode === 'calendar' ? 'bg-primary text-on-primary-fixed shadow-md' : 'text-outline hover:bg-white/5'}`}
                    >
                      <LayoutGrid className="w-4 h-4" />
                    </button>
                  </div>
                  <motion.button 
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleSuggestIdea}
                    disabled={isSuggesting}
                    className="p-3 rounded-full bg-surface-container text-outline hover:text-primary transition-colors disabled:opacity-50"
                    title="AI Suggest Idea"
                  >
                    {isSuggesting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      setEditingEvent(null);
                      setNewEvent({ title: '', description: '', date: '', time: '', location: '', goalId: '', reminder: false, reminderMinutes: 15, tags: [] });
                      setIsEventModalOpen(true);
                    }}
                    title="New Task"
                    className="bg-primary text-on-primary-fixed p-3 rounded-full shadow-lg transition-all hover:shadow-primary/20"
                  >
                    <Plus className="w-6 h-6" />
                  </motion.button>
                </div>
              </div>

              <div className="space-y-6">
                {plannerMode === 'calendar' ? (
                  <CalendarComponent 
                    events={events} 
                    userId={user?.uid}
                    onAddEvent={(date) => {
                      setEditingEvent(null);
                      setNewEvent({ title: '', description: '', date, time: '', location: '', goalId: '', reminder: false, reminderMinutes: 15, tags: [] });
                      setIsEventModalOpen(true);
                    }}
                    onEditEvent={(event) => {
                      setEditingEvent(event);
                      setIsEventModalOpen(true);
                    }}
                  />
                ) : (
                  sortedEvents.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {sortedEvents.map((event, idx) => (
                        <motion.div 
                          key={event.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: idx * 0.05 }}
                          whileHover={{ scale: 1.01, y: -2 }}
                          className="bg-surface-container-low rounded-[2rem] p-6 sm:p-8 border border-outline-variant/10 relative group shadow-sm hover:shadow-xl transition-all duration-500"
                        >
                          <div className="absolute top-6 right-6 flex sm:flex-col gap-2 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-300 z-10">
                            <motion.button 
                              whileHover={{ scale: 1.1, rotate: 15 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => {
                                navigator.clipboard.writeText(event.id);
                                setToast("Task ID copied!");
                              }}
                              className="p-2 text-outline hover:text-primary transition-colors"
                              title="Copy Task ID"
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
                          <div className="flex flex-col sm:flex-row gap-6 sm:gap-8">
                            <div className="flex flex-row sm:flex-col items-center justify-center bg-primary/10 rounded-2xl px-6 py-4 sm:py-6 h-fit border border-primary/20 min-w-[80px] sm:min-w-[100px] shadow-inner">
                              <span className="text-[10px] sm:text-xs uppercase font-bold text-primary tracking-[0.2em] sm:mb-1 mr-2 sm:mr-0">
                                {new Date(event.date).toLocaleDateString('en-ZA', { month: 'short' })}
                              </span>
                              <span className="text-3xl sm:text-4xl font-serif text-primary">
                                {new Date(event.date).toLocaleDateString('en-ZA', { day: 'numeric' })}
                              </span>
                            </div>
                            <div className="space-y-4 flex-1 pr-0 sm:pr-8">
                              <div className="space-y-2">
                                <h3 className="text-2xl sm:text-3xl font-serif leading-tight tracking-tight text-on-surface">{event.title}</h3>
                                {event.tags && event.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-2">
                                    {event.tags.map((tag, idx) => (
                                      <span key={idx} className="text-[9px] uppercase tracking-widest font-bold bg-primary/10 text-primary px-3 py-1 rounded-full border border-primary/20">
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                              
                              {event.description && <p className="text-on-surface/70 text-sm sm:text-base leading-relaxed line-clamp-3">{event.description}</p>}
                              
                              <div className="flex flex-wrap gap-x-8 gap-y-3 pt-4 border-t border-outline-variant/10">
                                {event.time && (
                                  <div className="flex items-center gap-2.5 text-outline text-[10px] font-bold uppercase tracking-widest">
                                    <Clock className="w-3.5 h-3.5 text-primary/60" />
                                    <span>{event.time}</span>
                                  </div>
                                )}
                                {event.location && (
                                  <div className="flex items-center gap-2.5 text-outline text-[10px] font-bold uppercase tracking-widest">
                                    <MapPin className="w-3.5 h-3.5 text-primary/60" />
                                    <span>{event.location}</span>
                                  </div>
                                )}
                                {event.goalId && goals.find(g => g.id === event.goalId) && (
                                  <div className="flex items-center gap-2.5 text-outline text-[10px] font-bold uppercase tracking-widest">
                                    <History className="w-3.5 h-3.5 text-primary/60" />
                                    <span>{goals.find(g => g.id === event.goalId)?.name}</span>
                                  </div>
                                )}
                                {user && event.rsvps && event.rsvps[user.uid] && (
                                  <div className={`flex items-center gap-2.5 text-[10px] uppercase tracking-widest font-bold ${
                                    event.rsvps[user.uid] === 'Going' ? 'text-secondary' : 
                                    event.rsvps[user.uid] === 'Maybe' ? 'text-primary' : 'text-error'
                                  }`}>
                                    <div className={`w-2.5 h-2.5 rounded-full shadow-sm ${
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
                      ))}
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
                  <p className="font-serif text-lg text-center truncate w-full">{profileData.displayName || user?.displayName || 'User'}</p>
                  <p className="text-[10px] uppercase tracking-widest font-bold text-outline truncate w-full text-center">{user?.email}</p>
                </div>

                <div className="space-y-2">
                  <button 
                    onClick={() => {
                      setIsMenuOpen(false);
                      setIsProfileModalOpen(true);
                    }}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-primary/10 text-on-surface transition-colors group"
                  >
                    <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                      <Settings className="w-5 h-5 text-primary" />
                    </div>
                    <span className="font-bold text-sm">Edit Profile</span>
                  </button>

                  <button 
                    onClick={() => {
                      setIsMenuOpen(false);
                      setToast("Preferences coming soon!");
                    }}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-primary/10 text-on-surface transition-colors group"
                  >
                    <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                      <Palette className="w-5 h-5 text-primary" />
                    </div>
                    <span className="font-bold text-sm">Appearance</span>
                  </button>

                  <button 
                    onClick={() => {
                      setIsMenuOpen(false);
                      setIsRelationshipModalOpen(true);
                    }}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-primary/10 text-on-surface transition-colors group"
                  >
                    <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                      <History className="w-5 h-5 text-primary" />
                    </div>
                    <span className="font-bold text-sm">Relationship</span>
                  </button>

                  <div className="pt-6 px-4">
                    <div className="p-5 bg-surface-container-low/50 backdrop-blur-xl rounded-3xl border border-outline-variant/10 shadow-inner">
                      <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary/10 rounded-xl">
                            <Palette className="w-4 h-4 text-primary" />
                          </div>
                          <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-outline">Appearance</span>
                        </div>
                        <span className="text-[8px] font-mono text-outline/40 uppercase tracking-widest">v1.2</span>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 bg-surface-container-highest/30 rounded-2xl p-1.5 border border-outline-variant/5">
                        {[
                          { id: 'light', icon: Sun, label: 'Light' },
                          { id: 'system', icon: Monitor, label: 'Auto' },
                          { id: 'dark', icon: Moon, label: 'Dark' }
                        ].map((option) => (
                          <button
                            key={option.id}
                            onClick={() => setTheme(option.id as any)}
                            className={`relative flex flex-col items-center justify-center gap-2 py-3 rounded-xl transition-all duration-500 overflow-hidden group ${
                              theme === option.id 
                                ? 'text-on-primary-fixed' 
                                : 'text-outline hover:text-on-surface hover:bg-white/5'
                            }`}
                          >
                            {theme === option.id && (
                              <motion.div 
                                layoutId="activeTheme"
                                className="absolute inset-0 bg-gradient-to-br from-primary to-primary-container shadow-lg shadow-primary/20"
                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                              />
                            )}
                            <option.icon className={`w-4 h-4 relative z-10 transition-transform duration-500 ${theme === option.id ? 'scale-110' : 'group-hover:scale-110'}`} />
                            <span className="text-[9px] font-bold uppercase tracking-wider relative z-10">{option.label}</span>
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
                className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-error/10 text-error transition-colors mt-auto"
              >
                <div className="p-2 bg-error/10 rounded-lg">
                  <LogOut className="w-5 h-5" />
                </div>
                <span className="font-bold text-sm">Logout</span>
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
              className="relative w-full max-w-md bg-surface-container rounded-t-3xl sm:rounded-3xl p-8 shadow-2xl border border-outline-variant/10"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-serif">Plant a New Dream</h3>
                <button onClick={() => setIsGoalModalOpen(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <form onSubmit={handleAddGoal} className="space-y-6">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-outline">Goal Name</label>
                  <input 
                    autoFocus
                    type="text" 
                    placeholder="e.g. Weekend in Cape Town"
                    className="w-full bg-transparent border-b-2 border-outline-variant/30 py-2 focus:border-primary outline-none transition-colors font-serif text-xl placeholder:text-outline/30"
                    value={newGoal.name}
                    onChange={e => setNewGoal({...newGoal, name: e.target.value})}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-outline">Target Amount (R)</label>
                    <input 
                      type="number" 
                      placeholder="0.00"
                      className="w-full bg-transparent border-b-2 border-outline-variant/30 py-2 focus:border-primary outline-none transition-colors font-sans text-lg"
                      value={newGoal.target}
                      onChange={e => setNewGoal({...newGoal, target: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-outline">Deadline</label>
                    <input 
                      type="date" 
                      className="w-full bg-transparent border-b-2 border-outline-variant/30 py-2 focus:border-primary outline-none transition-colors font-sans text-lg appearance-none"
                      value={newGoal.deadline}
                      onChange={e => setNewGoal({...newGoal, deadline: e.target.value})}
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full bg-primary text-on-primary-fixed py-4 rounded-full font-bold mt-8 active:scale-95 transition-transform"
                >
                  Create Goal
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Funds Modal */}
      <AnimatePresence>
        {isFundModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFundModalOpen(false)}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="relative w-full max-w-md bg-surface-container rounded-t-3xl sm:rounded-3xl p-8 shadow-2xl border border-outline-variant/10"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-serif">Add Funds</h3>
                <button onClick={() => setIsFundModalOpen(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <form onSubmit={handleAddFunds} className="space-y-6">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-outline">Select Dream</label>
                  <select 
                    className="w-full bg-transparent border-b-2 border-outline-variant/30 py-2 focus:border-primary outline-none transition-colors font-serif text-xl appearance-none"
                    value={fundData.goalId}
                    onChange={e => setFundData({...fundData, goalId: e.target.value})}
                  >
                    <option value="" disabled className="bg-surface">Choose a goal...</option>
                    {goals.map(g => (
                      <option key={g.id} value={g.id} className="bg-surface">{g.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-outline">Amount (R)</label>
                  <input 
                    type="number" 
                    placeholder="0.00"
                    className="w-full bg-transparent border-b-2 border-outline-variant/30 py-2 focus:border-primary outline-none transition-colors font-sans text-3xl font-bold"
                    value={fundData.amount}
                    onChange={e => setFundData({...fundData, amount: e.target.value})}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-outline">Who is contributing?</label>
                  <div className="flex gap-4 pt-2">
                    <button 
                      type="button"
                      onClick={() => setFundData({...fundData, contributor: 'Me'})}
                      className={`flex-1 py-3 rounded-xl border-2 transition-all ${fundData.contributor === 'Me' ? 'border-primary bg-primary/10 text-primary' : 'border-outline-variant/20 text-outline'}`}
                    >
                      Me
                    </button>
                    <button 
                      type="button"
                      onClick={() => setFundData({...fundData, contributor: 'Them'})}
                      className={`flex-1 py-3 rounded-xl border-2 transition-all ${fundData.contributor === 'Them' ? 'border-primary bg-primary/10 text-primary' : 'border-outline-variant/20 text-outline'}`}
                    >
                      Them
                    </button>
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full bg-primary text-on-primary-fixed py-4 rounded-full font-bold mt-8 active:scale-95 transition-transform"
                >
                  Confirm Deposit
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
              className="relative w-full max-w-md bg-surface-container rounded-t-3xl sm:rounded-3xl p-8 shadow-2xl border border-outline-variant/10"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-serif">{editingEvent ? 'Edit Task' : 'Plan a Task'}</h3>
                <button onClick={() => setIsEventModalOpen(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                  <X className="w-6 h-6" />
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
                  <div className="p-4 bg-surface-container-highest rounded-2xl space-y-2">
                    <p className="text-[10px] uppercase tracking-widest font-bold text-outline">Share Task ID</p>
                    <code className="block w-full bg-black/20 p-2 rounded text-xs font-mono break-all select-all">
                      {editingEvent.id}
                    </code>
                  </div>
                )}

                <div className="flex gap-4 mt-4">
                  {editingEvent && (
                    <button 
                      type="button"
                      onClick={() => {
                        deleteEvent(editingEvent.id);
                        setIsEventModalOpen(false);
                      }}
                      className="flex-1 bg-error/10 text-error py-4 rounded-full font-bold active:scale-95 transition-transform"
                    >
                      Delete
                    </button>
                  )}
                  <button 
                    type="submit"
                    className="flex-[2] bg-primary text-on-primary-fixed py-4 rounded-full font-bold active:scale-95 transition-transform"
                  >
                    {editingEvent ? 'Update Task' : 'Schedule Task'}
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
              className="relative w-full max-w-md bg-surface-container rounded-t-3xl sm:rounded-3xl p-8 shadow-2xl border border-outline-variant/10"
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

      {/* Solo Date Idea Modal */}
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
                      goalId: '',
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
                  <p className="text-[10px] uppercase tracking-widest font-bold text-error">Dreams Affected</p>
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
                className="w-full bg-white/20 hover:bg-white/30 py-3 rounded-full font-bold text-xs uppercase tracking-widest transition-colors"
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
              <h3 className="text-2xl font-serif text-on-surface mb-2">Delete this Task?</h3>
              <p className="text-on-surface/80 text-sm leading-relaxed mb-8">
                Are you sure you want to delete this task? This action cannot be undone.
              </p>
              
              <div className="flex gap-4">
                <button 
                  onClick={() => setEventToDelete(null)}
                  className="flex-1 py-4 rounded-full font-bold text-outline hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDeleteEvent}
                  className="flex-[2] bg-error text-white py-4 rounded-full font-bold shadow-lg shadow-error/20 active:scale-95 transition-transform"
                >
                  Delete Task
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
              className="relative w-full max-w-md bg-surface-container rounded-t-3xl sm:rounded-3xl p-8 shadow-2xl border border-outline-variant/10"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-serif">Profile Settings</h3>
                <button onClick={() => setIsProfileModalOpen(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div className="flex flex-col items-center mb-6">
                  <div className="h-24 w-24 rounded-full overflow-hidden border-4 border-primary/20 mb-4">
                    <img 
                      className="w-full h-full object-cover" 
                      src={profileData.photoURL || user?.photoURL || AVATAR_NAV} 
                      alt="Profile preview" 
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <p className="text-[10px] uppercase tracking-widest font-bold text-outline">Profile Preview</p>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-outline">Display Name</label>
                  <input 
                    type="text" 
                    placeholder="Your name"
                    className="w-full bg-transparent border-b-2 border-outline-variant/30 py-2 focus:border-primary outline-none transition-colors font-serif text-xl"
                    value={profileData.displayName}
                    onChange={e => setProfileData({...profileData, displayName: e.target.value})}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-outline">Photo URL</label>
                  <input 
                    type="url" 
                    placeholder="https://example.com/photo.jpg"
                    className="w-full bg-transparent border-b-2 border-outline-variant/30 py-2 focus:border-primary outline-none transition-colors font-sans text-sm"
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

      {/* Join Goal Modal */}
      <AnimatePresence>
        {isJoinGoalModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsJoinGoalModalOpen(false)}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="relative w-full max-w-md bg-surface-container rounded-t-3xl sm:rounded-3xl p-8 shadow-2xl border border-outline-variant/10"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-serif">Join a Dream</h3>
                <button onClick={() => setIsJoinGoalModalOpen(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <form onSubmit={handleJoinGoal} className="space-y-6">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-outline">Goal ID</label>
                  <input 
                    autoFocus
                    type="text" 
                    placeholder="Enter the ID shared by your partner"
                    className="w-full bg-transparent text-on-surface border-b-2 border-outline-variant/30 py-2 focus:border-primary outline-none transition-colors font-mono text-xl placeholder:text-outline/30"
                    value={joinGoalId}
                    onChange={e => setJoinGoalId(e.target.value)}
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full bg-primary text-on-primary-fixed py-4 rounded-full font-bold mt-8 active:scale-95 transition-transform"
                >
                  Join Goal
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bottom Navigation (Mobile) */}
      <nav className="fixed bottom-6 left-6 right-6 z-50 flex justify-around items-center px-4 py-2 bg-surface/40 backdrop-blur-xl rounded-full border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] md:hidden">
        <NavItem icon={<Home className="w-5 h-5" fill={view === 'home' ? "currentColor" : "none"} />} label="Home" active={view === 'home'} onClick={() => setView('home')} />
        <NavItem icon={<Compass className="w-5 h-5" />} label="Discover" active={view === 'discover'} onClick={() => setView('discover')} />
        <NavItem icon={<MapIcon className="w-5 h-5" />} label="Map" active={view === 'map'} onClick={() => setView('map')} />
        <NavItem icon={<Calendar className="w-5 h-5" />} label="Planner" active={view === 'planner'} onClick={() => setView('planner')} />
        <NavItem icon={<History className="w-5 h-5" />} label="History" active={view === 'history'} onClick={() => setView('history')} />
      </nav>

      {/* Floating Action Button */}
      <motion.button 
        whileHover={{ scale: 1.1, rotate: 90 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsFundModalOpen(true)}
        className="fixed bottom-24 right-6 w-14 h-14 bg-primary-container text-on-primary-container rounded-full flex items-center justify-center shadow-2xl z-40 md:bottom-10"
      >
        <Plus className="w-8 h-8" />
      </motion.button>
    </div>
  );
}

function MapView({ location }: { location: { lat: number, lng: number } | null }) {
  const [queryStr, setQueryStr] = useState('');
  const [results, setResults] = useState<MapPlace[]>([]);
  const [loading, setLoading] = useState(false);

  const searchPlaces = async (searchQuery?: string) => {
    const finalQuery = searchQuery || queryStr;
    if (!finalQuery && !location) return;
    setLoading(true);
    try {
      const prompt = location 
        ? `Find romantic date spots or places related to "${finalQuery || 'romantic spots'}" near coordinates ${location.lat}, ${location.lng}. Return a JSON array of objects with name, address, rating, and description. Do not include any other text, only the JSON array.`
        : `Find romantic date spots or places related to "${finalQuery}" in South Africa. Return a JSON array of objects with name, address, rating, and description. Do not include any other text, only the JSON array.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: { 
          tools: [{ googleMaps: {} }]
        }
      });
      
      const text = response.text || '';
      const cleanText = text.replace(/```json\n?|```/g, '').trim();
      const data = JSON.parse(cleanText);
      setResults(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Maps search failed", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (location) {
      searchPlaces();
    }
  }, [location]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-3xl font-serif">Date Map</h2>
        <p className="text-outline text-sm">Find the perfect location for your next dream.</p>
      </div>

      <div className="relative">
        <input 
          type="text"
          placeholder="Search for romantic spots..."
          className="w-full bg-surface-container text-on-surface rounded-full py-4 pl-12 pr-28 outline-none focus:ring-2 ring-primary/20 transition-all font-serif placeholder:text-outline/50"
          value={queryStr}
          onChange={e => setQueryStr(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && searchPlaces()}
        />
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-outline" />
        <button 
          onClick={() => searchPlaces()}
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary text-on-primary-fixed px-6 py-2.5 rounded-full text-xs font-bold shadow-sm active:scale-95 transition-transform"
        >
          Search
        </button>
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      <div className="space-y-4">
        {results.map((place, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ scale: 1.01, x: 5 }}
            className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/10 hover:border-primary/20 transition-all shadow-sm hover:shadow-md cursor-default"
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-serif text-xl">{place.name}</h3>
              <span className="text-secondary font-bold text-sm">★ {place.rating}</span>
            </div>
            <p className="text-outline text-xs flex items-center gap-1 mb-4">
              <MapPin className="w-3 h-3" /> {place.address}
            </p>
            <p className="text-on-surface/80 text-sm leading-relaxed">{place.description}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

function DiscoverView({ location, goals, events }: { 
  location: { lat: number, lng: number } | null,
  goals: Goal[],
  events: Event[]
}) {
  const [queryStr, setQueryStr] = useState('');
  const [results, setResults] = useState<DiscoverIdea[]>([]);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);

  const fetchSuggestions = async () => {
    setIsSuggesting(true);
    try {
      const goalsContext = goals.length > 0 
        ? `The user is saving for: ${goals.map(g => g.name).join(', ')}.` 
        : '';
      
      const prompt = `You are a romantic date and travel expert. 
        ${goalsContext}
        Based on these goals, suggest 4 short, catchy search queries (2-4 words each) for date ideas or travel destinations.
        Return a JSON array of strings.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });
      const data = JSON.parse(response.text);
      setSuggestions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Suggestions failed", error);
    } finally {
      setIsSuggesting(false);
    }
  };

  const discoverIdeas = async (searchQuery?: string) => {
    const finalQuery = searchQuery || queryStr;
    setLoading(true);
    setSuggestions([]); // Clear suggestions when searching
    try {
      const goalsContext = goals.length > 0 
        ? `The user is saving for: ${goals.map(g => g.name).join(', ')}.` 
        : '';
      const eventsContext = events.length > 0 
        ? `The user has planned: ${events.map(e => e.title).join(', ')}.` 
        : '';

      const prompt = `You are a romantic date and travel concierge. 
        ${goalsContext} ${eventsContext}
        Based on these interests and the search "${finalQuery || 'unique date ideas'}", 
        provide 5 personalized, high-quality recommendations. 
        ${location ? `Prioritize locations near ${location.lat}, ${location.lng} if relevant.` : ''}
        Return a JSON array of objects with title, source, summary, and a descriptive imageSearchTerm for finding a relevant photo.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: { 
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json" 
        }
      });
      const data = JSON.parse(response.text);
      setResults(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Search failed", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    discoverIdeas();
    fetchSuggestions();
  }, [location]);

  const quickFilters = [
    { label: 'Romantic Dinners', icon: <Utensils className="w-3 h-3" /> },
    { label: 'Weekend Getaways', icon: <Plane className="w-3 h-3" /> },
    { label: 'Outdoor Adventures', icon: <Compass className="w-3 h-3" /> },
    { label: 'Cultural Dates', icon: <Palette className="w-3 h-3" /> }
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-3xl font-serif">Discover</h2>
        <p className="text-outline text-sm">Inspiration for your shared future.</p>
      </div>

      <div className="space-y-4">
        <div className="relative">
          <input 
            type="text"
            placeholder="What are you dreaming of?"
            className="w-full bg-surface-container text-on-surface rounded-full py-5 pl-14 pr-36 outline-none focus:ring-2 ring-primary/20 transition-all font-serif text-lg shadow-lg placeholder:text-outline/50"
            value={queryStr}
            onChange={e => setQueryStr(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && discoverIdeas()}
          />
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-outline" />
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => discoverIdeas()}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-primary text-on-primary-fixed px-8 py-3 rounded-full text-sm font-bold shadow-md"
          >
            Explore
          </motion.button>
        </div>

        {/* AI Suggestions */}
        {suggestions.length > 0 && (
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-[10px] uppercase tracking-widest font-bold text-outline mr-2">AI Suggestions:</span>
            {suggestions.map((s, i) => (
              <motion.button 
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ scale: 1.1, backgroundColor: "rgba(255, 177, 196, 0.2)" }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setQueryStr(s);
                  discoverIdeas(s);
                }}
                className="text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-full transition-colors border border-primary/20"
              >
                {s}
              </motion.button>
            ))}
          </div>
        )}

        {/* Quick Filters */}
        <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
          {quickFilters.map((filter, i) => (
            <motion.button 
              key={i}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ scale: 1.05, backgroundColor: "var(--surface-container-highest)" }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setQueryStr(filter.label);
                discoverIdeas(filter.label);
              }}
              className="flex items-center gap-2 whitespace-nowrap bg-surface-container-high px-4 py-2 rounded-full text-xs font-bold text-on-surface transition-colors border border-outline-variant/10"
            >
              {filter.icon}
              {filter.label}
            </motion.button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {results.map((idea, i) => (
          <DiscoverCard key={i} idea={idea} />
        ))}
      </div>
    </motion.div>
  );
}

function DiscoverCard({ idea }: { idea: DiscoverIdea }) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const generateImage = async () => {
      setIsGenerating(true);
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: {
            parts: [
              {
                text: `A high-quality, professional editorial photograph of: ${idea.title}. ${idea.summary}. Style: Romantic, elegant, cinematic lighting, high resolution.`,
              },
            ],
          },
          config: {
            imageConfig: {
              aspectRatio: '16:9',
            },
          },
        });

        const imagePart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
        if (imagePart?.inlineData?.data) {
          setImageUrl(`data:image/png;base64,${imagePart.inlineData.data}`);
        } else {
          throw new Error("No image data returned");
        }
      } catch (error) {
        console.error("Image generation failed", error);
        // Fallback to picsum
        setImageUrl(`https://picsum.photos/seed/${encodeURIComponent(idea.imageSearchTerm || idea.title)}/800/400`);
      } finally {
        setIsGenerating(false);
      }
    };

    generateImage();
  }, [idea.title]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -5 }}
      className="bg-surface-container-low overflow-hidden rounded-3xl border border-outline-variant/10 flex flex-col shadow-sm hover:shadow-xl transition-all duration-300 glass-highlight"
    >
      <div className="h-48 w-full relative bg-surface-container-highest overflow-hidden">
        {(isGenerating && !imageUrl) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            <span className="text-[8px] uppercase tracking-widest font-bold text-outline">Painting your dream...</span>
          </div>
        )}
        {imageUrl && (
          <motion.img 
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            src={imageUrl} 
            alt={idea.title}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-surface-container-low/80 to-transparent" />
      </div>
      <div className="p-6 space-y-4">
        <h3 className="font-serif text-2xl">{idea.title}</h3>
        <p className="text-on-surface/80 text-sm leading-relaxed">{idea.summary}</p>
        <div className="flex justify-between items-center pt-2">
          <span className="text-[10px] uppercase tracking-widest font-bold text-outline">Source: {idea.source}</span>
          <motion.a 
            whileHover={{ x: 5 }}
            href={`https://www.google.com/search?q=${encodeURIComponent(idea.title + ' ' + idea.source)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary text-xs font-bold uppercase tracking-widest hover:underline flex items-center gap-1"
          >
            Read More <ChevronRight className="w-3 h-3" />
          </motion.a>
        </div>
      </div>
    </motion.div>
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
    <motion.div 
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      className="bg-surface-container-low/40 backdrop-blur-xl rounded-[2rem] p-6 flex items-center justify-between group hover:bg-surface-container/60 transition-all duration-500 shadow-xl border border-white/5"
    >
      <div className="flex items-center gap-4">
        <motion.div 
          whileHover={{ rotate: 10, scale: 1.1 }}
          className={`h-16 w-16 rounded-2xl overflow-hidden border-2 ${isActive ? 'border-secondary/40 shadow-lg shadow-secondary/10' : 'border-outline-variant/20'}`}
        >
          <img className="w-full h-full object-cover" src={avatar} alt={name} referrerPolicy="no-referrer" />
        </motion.div>
        <div className="space-y-1">
          <span className="text-[9px] uppercase tracking-[0.3em] font-bold text-outline/40">Contributor</span>
          <p className="font-serif text-xl leading-none">{name}</p>
        </div>
      </div>
      <div className="text-right space-y-1">
        <p className="font-bold text-2xl text-on-surface tracking-tight">{amount}</p>
        <div className="flex items-center justify-end gap-2">
          <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-secondary animate-pulse' : 'bg-outline/20'}`} />
          <span className={`text-[10px] font-bold uppercase tracking-widest ${isActive ? 'text-secondary' : 'text-outline/40'}`}>{status}</span>
        </div>
      </div>
    </motion.div>
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
          <p className="font-medium text-sm">{title}</p>
          <p className="text-[10px] text-outline uppercase tracking-tighter">{subtitle}</p>
        </div>
      </div>
      <p className={`font-bold ${amountColor}`}>{amount}</p>
    </motion.div>
  );
}

function NavItem({ icon, label, active = false, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="relative flex flex-col items-center justify-center w-12 h-12 group outline-none"
    >
      {active && (
        <motion.div 
          layoutId="nav-active"
          className="absolute inset-0 bg-gradient-to-br from-primary to-primary-container rounded-full shadow-lg shadow-primary/20"
          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
        />
      )}
      <motion.div 
        animate={{ 
          scale: active ? 1.1 : 1,
          y: active ? 0 : 0
        }}
        className={`relative z-10 flex items-center justify-center ${
          active ? 'text-background' : 'text-on-surface/70 group-hover:text-primary'
        }`}
      >
        {icon}
      </motion.div>
      {!active && (
        <span className="absolute -bottom-6 font-sans text-[8px] uppercase tracking-widest font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap text-primary">
          {label}
        </span>
      )}
    </button>
  );
}
