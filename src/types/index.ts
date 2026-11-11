export interface Goal {
  id: string;
  ownerUid: string;
  collaborators: string[];
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  createdAt: string;
  archived?: boolean;
  archivedAt?: string;
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
  collaborators?: string[];
}

export interface DateMemory {
  photoURL?: string;
  rating: number; // 1 to 5 stars
  recapNote: string;
  completedAt: string;
  tags?: string[];
  highlights?: string;
}

export type DateMood = 'Romantic' | 'Adventurous' | 'Cozy' | 'Playful' | 'Luxurious' | 'Relaxed';

export interface DateChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface DateItineraryStop {
  time: string;
  activity: string;
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
  estimatedBudget?: number;
  dressCode?: string;
  checklist?: DateChecklistItem[];
  itinerary?: DateItineraryStop[];
  reminder?: boolean;
  reminderMinutes?: number;
  reminderSent?: boolean;
  tags?: string[];
  mood?: DateMood;
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

export interface RomanticTip {
  id?: string;
  title: string;
  category: string;
  timeEstimate: string;
  description: string;
  steps: string[];
  conversationStarter: string;
}

export type PartnerMessageType =
  | 'text'
  | 'date_invite'
  | 'goal_nudge'
  | 'love_note'
  | 'spot_share'
  | 'date_poll'
  | 'deposit_celebration';

export interface SharedSpotPayload {
  id?: string;
  name: string;
  category: string;
  location: string;
  province?: string;
  estimatedBudget?: number;
  rating?: number;
  photoUrl?: string;
  summary?: string;
  mood?: DateMood;
  lat?: number;
  lng?: number;
}

export interface DatePollOption {
  id: string;
  label: string;
  subtitle?: string;
}

export interface DatePollPayload {
  question: string;
  options: DatePollOption[];
}

export interface DepositCelebrationPayload {
  goalId: string;
  goalName: string;
  amount: number;
  newCurrentAmount: number;
  targetAmount: number;
  contributor?: string;
}

export interface MessageReplyReference {
  messageId: string;
  senderName: string;
  previewText: string;
  messageType: PartnerMessageType;
}

export interface PartnerMessage {
  id: string;
  senderUid: string;
  senderName: string;
  senderPhoto?: string;
  participants: string[];
  text: string;
  messageType: PartnerMessageType;
  linkedGoalId?: string;
  linkedGoalName?: string;
  linkedEventId?: string;
  linkedEventTitle?: string;
  linkedSpot?: SharedSpotPayload;
  pollData?: DatePollPayload;
  pollVotes?: { [userId: string]: string };
  spotVotes?: { [userId: string]: 'up' | 'down' };
  rsvpStatus?: { [userId: string]: 'going' | 'reschedule' };
  depositData?: DepositCelebrationPayload;
  replyTo?: MessageReplyReference;
  isPinned?: boolean;
  reactions?: { [userId: string]: string };
  readBy?: string[];
  createdAt: string;
}



