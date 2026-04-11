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
  Palette
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  auth, 
  db, 
  googleProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
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
import { GoogleGenAI } from "@google/genai";

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
  reminder?: boolean;
  reminderSent?: boolean;
  createdAt: string;
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
  const [isJoinGoalModalOpen, setIsJoinGoalModalOpen] = useState(false);
  const [joinGoalId, setJoinGoalId] = useState('');
  const [newGoal, setNewGoal] = useState({ name: '', target: '', deadline: '' });
  const [fundData, setFundData] = useState({ goalId: '', amount: '', contributor: 'Me' as 'Me' | 'Them' });
  const [newEvent, setNewEvent] = useState({ title: '', description: '', date: '', time: '', location: '', reminder: false });
  const [profileData, setProfileData] = useState({ displayName: '', photoURL: '' });
  const [location, setLocation] = useState<{ lat: number, lng: number } | null>(null);
  
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
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
        // Remind 15 minutes before or if it's already started but within 1 hour
        const reminderTime = new Date(eventDateTime.getTime() - 15 * 60000);
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
              body: `Event at ${event.time || 'today'}! ${event.location ? `at ${event.location}` : ''}`,
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
    const fixOldGoals = async () => {
      try {
        const q = query(collection(db, 'goals'), where('ownerUid', '==', user.uid));
        const snap = await getDocs(q);
        for (const docSnap of snap.docs) {
          const data = docSnap.data();
          if (!data.collaborators) {
            await setDoc(doc(db, 'goals', docSnap.id), {
              ...data,
              collaborators: [user.uid]
            }, { merge: true });
          }
        }
      } catch (err) {
        // Silent fail for migration
        console.debug("Migration check skipped or failed", err);
      }
    };
    fixOldGoals();

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

    const eventsQuery = query(collection(db, 'events'), where('ownerUid', '==', user.uid));
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
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed", error);
      setAuthError("Google sign-in failed. Please try again.");
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
      reminder: newEvent.reminder,
      createdAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'events', eventId), event);
      setNewEvent({ title: '', description: '', date: '', time: '', location: '', reminder: false });
      setIsEventModalOpen(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `events/${eventId}`);
    }
  };

  const deleteGoal = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'goals', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `goals/${id}`);
    }
  };

  const deleteEvent = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'events', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `events/${id}`);
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

              <button 
                type="submit"
                disabled={isAuthenticating}
                className="w-full bg-primary text-on-primary-fixed py-4 rounded-full font-bold mt-4 active:scale-95 transition-transform disabled:opacity-50"
              >
                {isAuthenticating ? 'Processing...' : (authMode === 'signin' ? 'Sign In' : 'Sign Up')}
              </button>
            </form>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-outline-variant/20"></div>
              </div>
              <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-bold">
                <span className="bg-surface-container px-4 text-outline">Or continue with</span>
              </div>
            </div>

            <button 
              onClick={handleLogin}
              className="w-full bg-surface-container-high text-on-surface py-4 rounded-full font-bold flex items-center justify-center gap-3 hover:bg-surface-container-highest transition-colors border border-outline-variant/10"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
              Google
            </button>

            <p className="mt-8 text-center text-sm text-outline">
              {authMode === 'signin' ? "Don't have an account?" : "Already have an account?"}{' '}
              <button 
                onClick={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')}
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
          <Menu className="text-primary w-6 h-6 cursor-pointer" onClick={() => setToast("Menu coming soon!")} />
          <h1 className="text-2xl font-serif text-primary cursor-pointer" onClick={() => setView('home')}>DateFund</h1>
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
              <section className="mb-12 space-y-2">
                <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-outline">Total Balance</span>
                <div className="flex items-baseline gap-2 flex-wrap">
                  <h2 className="text-5xl font-serif text-on-surface">R {totalBalance.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</h2>
                  <span className="text-secondary font-medium text-sm">+ R 120.00 this week</span>
                </div>
              </section>

              {/* Current Primary Goal */}
              {goals.length > 0 && (
                <motion.div 
                  layoutId={goals[0].id}
                  className="relative overflow-hidden bg-surface-container rounded-2xl p-8 mb-10 group"
                >
                  <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/10 rounded-full blur-3xl transition-transform group-hover:scale-150 duration-700"></div>
                  <div className="flex justify-between items-end mb-6 relative z-10">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase tracking-widest font-bold text-outline">Primary Dream</span>
                        <span className="text-[8px] bg-surface-container-highest px-2 py-0.5 rounded text-outline font-mono">ID: {goals[0].id}</span>
                      </div>
                      <h3 className="text-2xl font-serif">{goals[0].name}</h3>
                    </div>
                    <div className="bg-secondary-container/20 text-secondary px-3 py-1 rounded-full text-xs font-bold">
                      R {goals[0].targetAmount.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div className="relative h-4 w-full bg-surface-container-high rounded-full overflow-hidden mb-3">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((goals[0].currentAmount / goals[0].targetAmount) * 100, 100)}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="absolute top-0 left-0 h-full bg-gradient-to-r from-secondary to-primary progress-glow rounded-full"
                    />
                  </div>
                  <div className="flex justify-between text-[10px] uppercase tracking-widest font-bold text-outline/60">
                    <span>{((goals[0].currentAmount / goals[0].targetAmount) * 100).toFixed(1)}% Saved</span>
                    <span>R {Math.max(0, goals[0].targetAmount - goals[0].currentAmount).toLocaleString('en-ZA', { minimumFractionDigits: 2 })} To Go</span>
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
                  {goals.slice(1).map((goal) => (
                    <motion.div 
                      key={goal.id}
                      layoutId={goal.id}
                      className="bg-surface-container-low rounded-2xl p-5 flex items-center justify-between group hover:bg-surface-container transition-colors"
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
                          className="p-2 text-outline hover:text-error transition-colors opacity-0 group-hover:opacity-100"
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
                <button 
                  onClick={() => setIsFundModalOpen(true)}
                  className="w-full bg-gradient-to-br from-primary to-primary-container text-on-primary-fixed py-5 rounded-full font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-lg shadow-primary/10"
                >
                  <Plus className="w-5 h-5" />
                  Add Funds
                </button>
                <div className="flex gap-4">
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      setToast("Link copied to clipboard!");
                    }}
                    className="flex-1 bg-surface-container-high text-on-surface py-4 rounded-full font-bold text-sm hover:bg-surface-container-highest transition-colors flex items-center justify-center gap-2"
                  >
                    <Share2 className="w-4 h-4" />
                    Invite
                  </button>
                  <button 
                    onClick={() => setIsJoinGoalModalOpen(true)}
                    className="flex-1 bg-surface-container-high text-on-surface py-4 rounded-full font-bold text-sm hover:bg-surface-container-highest transition-colors flex items-center justify-center gap-2"
                  >
                    <PiggyBank className="w-4 h-4" />
                    Join Goal
                  </button>
                  <button 
                    onClick={() => setIsGoalModalOpen(true)}
                    className="flex-1 bg-surface-container-high text-on-surface py-4 rounded-full font-bold text-sm hover:bg-surface-container-highest transition-colors flex items-center justify-center gap-2"
                  >
                    <Settings className="w-4 h-4" />
                    Manage
                  </button>
                </div>
              </div>

              {/* Recent History */}
              <section className="mt-16">
                <div className="flex justify-between items-center mb-6">
                  <h4 className="font-serif text-xl">Recent Blooms</h4>
                  <button onClick={() => setView('history')} className="text-secondary text-xs uppercase tracking-widest font-bold">View All</button>
                </div>
                <div className="space-y-6">
                  {transactions.slice(0, 3).map((t) => (
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
                {transactions.map((t) => (
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
                  <p className="text-outline text-sm">Schedule your next romantic escape.</p>
                </div>
                <button 
                  onClick={() => setIsEventModalOpen(true)}
                  className="bg-primary text-on-primary-fixed p-3 rounded-full shadow-lg active:scale-90 transition-transform"
                >
                  <Plus className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                {events.length > 0 ? (
                  events.map((event) => (
                    <div key={event.id} className="bg-surface-container-low rounded-2xl p-6 border border-outline-variant/10 relative group">
                      <button 
                        onClick={() => deleteEvent(event.id)}
                        className="absolute top-4 right-4 p-2 text-outline hover:text-error transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <div className="flex gap-4">
                        <div className="flex flex-col items-center justify-center bg-primary/10 rounded-xl px-4 py-2 h-fit">
                          <span className="text-[10px] uppercase font-bold text-primary">
                            {new Date(event.date).toLocaleDateString('en-ZA', { month: 'short' })}
                          </span>
                          <span className="text-2xl font-serif text-primary">
                            {new Date(event.date).toLocaleDateString('en-ZA', { day: 'numeric' })}
                          </span>
                        </div>
                        <div className="space-y-2 flex-1">
                          <h3 className="text-xl font-serif">{event.title}</h3>
                          {event.description && <p className="text-on-surface/70 text-sm">{event.description}</p>}
                          <div className="flex flex-wrap gap-4 pt-2">
                            {event.time && (
                              <div className="flex items-center gap-1 text-[10px] uppercase tracking-widest font-bold text-outline">
                                <Clock className="w-3 h-3" /> {event.time}
                              </div>
                            )}
                            {event.location && (
                              <div className="flex items-center gap-1 text-[10px] uppercase tracking-widest font-bold text-outline">
                                <MapPin className="w-3 h-3" /> {event.location}
                              </div>
                            )}
                            {event.reminder && (
                              <div className="flex items-center gap-1 text-[10px] uppercase tracking-widest font-bold text-secondary">
                                <Bell className="w-3 h-3" /> Reminder Set
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-20 text-center border-2 border-dashed border-outline-variant/20 rounded-3xl space-y-4">
                    <div className="w-16 h-16 rounded-full bg-surface-container mx-auto flex items-center justify-center">
                      <Calendar className="w-8 h-8 text-outline/30" />
                    </div>
                    <p className="text-outline italic">No dates planned yet. Start dreaming together.</p>
                    <button 
                      onClick={() => setIsEventModalOpen(true)}
                      className="text-primary font-bold uppercase tracking-widest text-xs"
                    >
                      Add First Event
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

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
                <h3 className="text-2xl font-serif">Plan an Event</h3>
                <button onClick={() => setIsEventModalOpen(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <form onSubmit={handleAddEvent} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-outline">Title</label>
                  <input 
                    autoFocus
                    type="text" 
                    placeholder="e.g. Candlelit Dinner"
                    className="w-full bg-transparent border-b-2 border-outline-variant/30 py-2 focus:border-primary outline-none transition-colors font-serif text-xl"
                    value={newEvent.title}
                    onChange={e => setNewEvent({...newEvent, title: e.target.value})}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-outline">Description</label>
                  <textarea 
                    placeholder="Details about the date..."
                    className="w-full bg-transparent border-b-2 border-outline-variant/30 py-2 focus:border-primary outline-none transition-colors font-sans text-sm resize-none h-20"
                    value={newEvent.description}
                    onChange={e => setNewEvent({...newEvent, description: e.target.value})}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-outline">Date</label>
                    <input 
                      type="date" 
                      className="w-full bg-transparent border-b-2 border-outline-variant/30 py-2 focus:border-primary outline-none transition-colors font-sans text-sm"
                      value={newEvent.date}
                      onChange={e => setNewEvent({...newEvent, date: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-outline">Time</label>
                    <input 
                      type="time" 
                      className="w-full bg-transparent border-b-2 border-outline-variant/30 py-2 focus:border-primary outline-none transition-colors font-sans text-sm"
                      value={newEvent.time}
                      onChange={e => setNewEvent({...newEvent, time: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-outline">Location</label>
                  <input 
                    type="text" 
                    placeholder="Where to?"
                    className="w-full bg-transparent border-b-2 border-outline-variant/30 py-2 focus:border-primary outline-none transition-colors font-sans text-sm"
                    value={newEvent.location}
                    onChange={e => setNewEvent({...newEvent, location: e.target.value})}
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button 
                    type="button"
                    onClick={() => setNewEvent({...newEvent, reminder: !newEvent.reminder})}
                    className={`w-10 h-6 rounded-full transition-colors relative ${newEvent.reminder ? 'bg-primary' : 'bg-outline-variant/30'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${newEvent.reminder ? 'left-5' : 'left-1'}`} />
                  </button>
                  <span className="text-xs font-bold uppercase tracking-widest text-outline">Set Reminder</span>
                </div>

                <button 
                  type="submit"
                  className="w-full bg-primary text-on-primary-fixed py-4 rounded-full font-bold mt-4 active:scale-95 transition-transform"
                >
                  Schedule Event
                </button>
              </form>
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
                    className="w-full bg-transparent border-b-2 border-outline-variant/30 py-2 focus:border-primary outline-none transition-colors font-mono text-xl"
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
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-4 pt-2 bg-surface/60 backdrop-blur-md rounded-t-2xl md:hidden">
        <NavItem icon={<Home className="w-6 h-6" fill={view === 'home' ? "currentColor" : "none"} />} label="Home" active={view === 'home'} onClick={() => setView('home')} />
        <NavItem icon={<Compass className="w-6 h-6" />} label="Discover" active={view === 'discover'} onClick={() => setView('discover')} />
        <NavItem icon={<MapIcon className="w-6 h-6" />} label="Map" active={view === 'map'} onClick={() => setView('map')} />
        <NavItem icon={<Calendar className="w-6 h-6" />} label="Planner" active={view === 'planner'} onClick={() => setView('planner')} />
        <NavItem icon={<History className="w-6 h-6" />} label="History" active={view === 'history'} onClick={() => setView('history')} />
      </nav>

      {/* Floating Action Button */}
      <button 
        onClick={() => setIsFundModalOpen(true)}
        className="fixed bottom-24 right-6 w-14 h-14 bg-primary-container text-on-primary-container rounded-full flex items-center justify-center shadow-2xl active:scale-90 transition-transform z-40 md:bottom-10"
      >
        <Plus className="w-8 h-8" />
      </button>
    </div>
  );
}

function MapView({ location }: { location: { lat: number, lng: number } | null }) {
  const [queryStr, setQueryStr] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const searchPlaces = async (searchQuery?: string) => {
    const finalQuery = searchQuery || queryStr;
    if (!finalQuery && !location) return;
    setLoading(true);
    try {
      const prompt = location 
        ? `Find romantic date spots or places related to "${finalQuery || 'romantic spots'}" near coordinates ${location.lat}, ${location.lng}. Return a JSON array of objects with name, address, rating, and description.`
        : `Find romantic date spots or places related to "${finalQuery}" in South Africa. Return a JSON array of objects with name, address, rating, and description.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: { 
          tools: [{ googleMaps: {} }],
          responseMimeType: "application/json" 
        }
      });
      const data = JSON.parse(response.text);
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
          className="w-full bg-surface-container rounded-full py-4 px-12 outline-none focus:ring-2 ring-primary/20 transition-all font-serif"
          value={queryStr}
          onChange={e => setQueryStr(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && searchPlaces()}
        />
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-outline" />
        <button 
          onClick={searchPlaces}
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary text-on-primary-fixed px-4 py-2 rounded-full text-xs font-bold"
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
          <div key={i} className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/10 hover:border-primary/20 transition-all">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-serif text-xl">{place.name}</h3>
              <span className="text-secondary font-bold text-sm">★ {place.rating}</span>
            </div>
            <p className="text-outline text-xs flex items-center gap-1 mb-4">
              <MapPin className="w-3 h-3" /> {place.address}
            </p>
            <p className="text-on-surface/80 text-sm leading-relaxed">{place.description}</p>
          </div>
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
  const [results, setResults] = useState<any[]>([]);
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
            className="w-full bg-surface-container rounded-full py-5 px-14 outline-none focus:ring-2 ring-primary/20 transition-all font-serif text-lg shadow-lg"
            value={queryStr}
            onChange={e => setQueryStr(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && discoverIdeas()}
          />
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-outline" />
          <button 
            onClick={() => discoverIdeas()}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-primary text-on-primary-fixed px-6 py-2.5 rounded-full text-sm font-bold shadow-md active:scale-95 transition-transform"
          >
            Explore
          </button>
        </div>

        {/* AI Suggestions */}
        {suggestions.length > 0 && (
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-[10px] uppercase tracking-widest font-bold text-outline mr-2">AI Suggestions:</span>
            {suggestions.map((s, i) => (
              <button 
                key={i}
                onClick={() => {
                  setQueryStr(s);
                  discoverIdeas(s);
                }}
                className="text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-full hover:bg-primary/20 transition-colors border border-primary/20"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Quick Filters */}
        <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
          {quickFilters.map((filter, i) => (
            <button 
              key={i}
              onClick={() => {
                setQueryStr(filter.label);
                discoverIdeas(filter.label);
              }}
              className="flex items-center gap-2 whitespace-nowrap bg-surface-container-high px-4 py-2 rounded-full text-xs font-bold text-on-surface hover:bg-surface-container-highest transition-colors border border-outline-variant/10"
            >
              {filter.icon}
              {filter.label}
            </button>
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

function DiscoverCard({ idea }: { idea: any, key?: any }) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const generateImage = async () => {
      setIsGenerating(true);
      try {
        const response = await ai.models.generateImages({
          model: 'imagen-4.0-generate-001',
          prompt: `A high-quality, professional editorial photograph of: ${idea.title}. ${idea.summary}. Style: Romantic, elegant, cinematic lighting, high resolution.`,
          config: {
            numberOfImages: 1,
            outputMimeType: 'image/jpeg',
            aspectRatio: '16:9',
          },
        });

        if (response.generatedImages?.[0]?.image?.imageBytes) {
          const base64 = response.generatedImages[0].image.imageBytes;
          setImageUrl(`data:image/jpeg;base64,${base64}`);
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
    <div className="bg-surface-container-low overflow-hidden rounded-3xl border border-outline-variant/10 flex flex-col">
      <div className="h-48 w-full relative bg-surface-container-highest">
        {(isGenerating && !imageUrl) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            <span className="text-[8px] uppercase tracking-widest font-bold text-outline">Painting your dream...</span>
          </div>
        )}
        {imageUrl && (
          <motion.img 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
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
          <a 
            href={`https://www.google.com/search?q=${encodeURIComponent(idea.title + ' ' + idea.source)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary text-xs font-bold uppercase tracking-widest hover:underline"
          >
            Read More
          </a>
        </div>
      </div>
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
    <div className="bg-surface-container-low rounded-2xl p-6 flex items-center justify-between group hover:bg-surface-container transition-colors">
      <div className="flex items-center gap-4">
        <div className={`h-14 w-14 rounded-full overflow-hidden border-2 ${isActive ? 'border-primary/20' : 'border-outline-variant/20'}`}>
          <img className="w-full h-full object-cover" src={avatar} alt={name} referrerPolicy="no-referrer" />
        </div>
        <div>
          <span className="text-[10px] uppercase tracking-widest font-bold text-outline">Contributor</span>
          <p className="font-serif text-lg">{name}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-bold text-on-surface">{amount}</p>
        <span className={`text-[10px] ${isActive ? 'text-secondary' : 'text-outline'}`}>{status}</span>
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
    <div className="flex items-center justify-between bg-surface/20 p-2 rounded-xl">
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-full ${iconBg} flex items-center justify-center overflow-hidden`}>
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
    </div>
  );
}

function NavItem({ icon, label, active = false, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center justify-center p-2 transition-all active:scale-90 ${
        active 
          ? 'bg-gradient-to-br from-primary to-primary-container text-background rounded-full h-12 w-12' 
          : 'text-on-surface/70 hover:text-primary'
      }`}
    >
      {icon}
      {!active && <span className="font-sans text-[10px] uppercase tracking-widest font-bold mt-1">{label}</span>}
    </button>
  );
}
