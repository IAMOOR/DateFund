import { DateMood } from '../types';

export interface MoodConfig {
  id: DateMood;
  label: string;
  emoji: string;
  color: string;
  badgeClass: string;
  activeClass: string;
  dotColor: string;
}

export const DATE_MOODS: MoodConfig[] = [
  {
    id: 'Romantic',
    label: 'Romantic',
    emoji: '🌹',
    color: '#b32656',
    badgeClass: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30',
    activeClass: 'bg-rose-500/20 border-rose-500 text-rose-700 dark:text-rose-300',
    dotColor: 'bg-rose-500',
  },
  {
    id: 'Adventurous',
    label: 'Adventurous',
    emoji: '🌲',
    color: '#10b981',
    badgeClass: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30',
    activeClass: 'bg-emerald-500/20 border-emerald-500 text-emerald-700 dark:text-emerald-300',
    dotColor: 'bg-emerald-500',
  },
  {
    id: 'Cozy',
    label: 'Cozy',
    emoji: '☕',
    color: '#f59e0b',
    badgeClass: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30',
    activeClass: 'bg-amber-500/20 border-amber-500 text-amber-700 dark:text-amber-300',
    dotColor: 'bg-amber-500',
  },
  {
    id: 'Playful',
    label: 'Playful',
    emoji: '🎉',
    color: '#a855f7',
    badgeClass: 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30',
    activeClass: 'bg-purple-500/20 border-purple-500 text-purple-700 dark:text-purple-300',
    dotColor: 'bg-purple-500',
  },
  {
    id: 'Luxurious',
    label: 'Luxurious',
    emoji: '✨',
    color: '#eab308',
    badgeClass: 'bg-yellow-500/15 text-yellow-800 dark:text-yellow-300 border border-yellow-500/30',
    activeClass: 'bg-yellow-500/20 border-yellow-500 text-yellow-800 dark:text-yellow-300',
    dotColor: 'bg-yellow-500',
  },
  {
    id: 'Relaxed',
    label: 'Relaxed',
    emoji: '🌊',
    color: '#0ea5e9',
    badgeClass: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/30',
    activeClass: 'bg-sky-500/20 border-sky-500 text-sky-700 dark:text-sky-300',
    dotColor: 'bg-sky-500',
  },
];

export function getMoodConfig(mood?: DateMood | string): MoodConfig {
  if (!mood) return DATE_MOODS[0];
  const found = DATE_MOODS.find((m) => m.id.toLowerCase() === mood.toLowerCase());
  return found || DATE_MOODS[0];
}
