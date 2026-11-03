export interface Goal {
  id: string;
  ownerUid: string;
  collaborators: string[];
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  ownerUid: string;
  goalId: string;
  goalName: string;
  amount: number;
  date: string;
  contributor: 'Me' | 'Them';
  type: 'deposit' | 'withdrawal';
  createdAt: string;
  notes?: string;
}

export interface DateMemory {
  photoURL?: string;
  rating: number; // 1 to 5 stars
  recapNote: string;
  completedAt: string;
  tags?: string[];
  highlights?: string;
}

export interface Event {
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
  completed?: boolean;
  createdAt: string;
  // Romance & couple experience extensions
  isMystery?: boolean;
  mysteryRevealed?: boolean;
  mysteryClue?: string;
  memory?: DateMemory;
}

export interface BucketListItem {
  id: string;
  title: string;
  category: string;
  estimatedBudget: number;
  notes?: string;
  season?: 'Spring' | 'Summer' | 'Autumn' | 'Winter' | 'Any';
  addedBy: string;
  createdAt: string;
}

export interface RelationshipData {
  partnerUid?: string;
  partnerName?: string;
  partnerEmail?: string;
  partnerPhoto?: string;
  anniversaryDate?: string;
  relationshipStartDate?: string;
  customMilestones?: {
    id: string;
    title: string;
    date: string;
  }[];
}
