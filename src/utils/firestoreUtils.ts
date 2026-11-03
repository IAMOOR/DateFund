import type { Goal, Transaction, Event, BucketListItem } from '../types';

/**
 * Maps a Firestore document snapshot to a domain Goal entity.
 * Uses the Firestore canonical snapshot ID as the single source of truth,
 * guaranteeing that any forged `id` field stored inside document data cannot
 * override the canonical document path identity.
 */
export function mapGoalDoc(docSnap: { id: string; data: () => Record<string, any> }): Goal {
  const data = docSnap.data() || {};
  return {
    ...data,
    id: docSnap.id, // Canonical: snapshot ID strictly overrides any data.id
    ownerUid: data.ownerUid || '',
    collaborators: Array.isArray(data.collaborators) ? data.collaborators : [],
    name: data.name || '',
    targetAmount: Number(data.targetAmount) || 0,
    currentAmount: Number(data.currentAmount) || 0,
    deadline: data.deadline || '',
    createdAt: data.createdAt || new Date().toISOString(),
  };
}

/**
 * Maps a Firestore document snapshot to a domain Transaction entity.
 * Canonical snapshot ID strictly overrides stored data.id.
 */
export function mapTransactionDoc(docSnap: { id: string; data: () => Record<string, any> }): Transaction {
  const data = docSnap.data() || {};
  return {
    ...data,
    id: docSnap.id, // Canonical: snapshot ID strictly overrides any data.id
    ownerUid: data.ownerUid || '',
    goalId: data.goalId || '',
    goalName: data.goalName || '',
    amount: Number(data.amount) || 0,
    date: data.date || '',
    contributor: data.contributor === 'Them' ? 'Them' : 'Me',
    type: data.type === 'withdrawal' ? 'withdrawal' : 'deposit',
    notes: data.notes,
    createdAt: data.createdAt || new Date().toISOString(),
  };
}

/**
 * Maps a Firestore document snapshot to a domain Event entity.
 * Canonical snapshot ID strictly overrides stored data.id.
 */
export function mapEventDoc(docSnap: { id: string; data: () => Record<string, any> }): Event {
  const data = docSnap.data() || {};
  return {
    ...data,
    id: docSnap.id, // Canonical: snapshot ID strictly overrides any data.id
    ownerUid: data.ownerUid || '',
    title: data.title || '',
    description: data.description,
    date: data.date || '',
    time: data.time,
    location: data.location,
    goalId: data.goalId,
    reminder: Boolean(data.reminder),
    reminderMinutes: Number(data.reminderMinutes) || 15,
    reminderSent: Boolean(data.reminderSent),
    tags: Array.isArray(data.tags) ? data.tags : [],
    mood: data.mood || 'Romantic',
    isMystery: Boolean(data.isMystery),
    mysteryRevealed: Boolean(data.mysteryRevealed),
    mysteryClue: data.mysteryClue,
    collaborators: Array.isArray(data.collaborators) ? data.collaborators : [],
    rsvps: typeof data.rsvps === 'object' && data.rsvps !== null ? data.rsvps : {},
    completed: Boolean(data.completed),
    memory: data.memory,
    createdAt: data.createdAt || new Date().toISOString(),
  };
}

/**
 * Maps a Firestore document snapshot to a domain BucketListItem entity.
 * Canonical snapshot ID strictly overrides stored data.id.
 */
export function mapBucketItemDoc(docSnap: { id: string; data: () => Record<string, any> }): BucketListItem {
  const data = docSnap.data() || {};
  return {
    ...data,
    id: docSnap.id, // Canonical: snapshot ID strictly overrides any data.id
    title: data.title || '',
    category: data.category || '',
    estimatedBudget: Number(data.estimatedBudget) || 0,
    notes: data.notes,
    season: data.season,
    addedBy: data.addedBy,
    createdAt: data.createdAt || new Date().toISOString(),
  };
}
