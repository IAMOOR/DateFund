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
  createdAt: string;
}

export type View = 'home' | 'history' | 'discover' | 'map' | 'planner';
