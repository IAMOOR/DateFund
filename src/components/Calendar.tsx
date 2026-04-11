import React, { useState, useMemo } from 'react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays, 
  eachDayOfInterval,
  isToday,
  parseISO
} from 'date-fns';
import { ChevronLeft, ChevronRight, Clock, MapPin, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Event {
  id: string;
  ownerUid: string;
  title: string;
  description?: string;
  date: string;
  time?: string;
  location?: string;
  reminder?: boolean;
  reminderMinutes?: number;
  reminderSent?: boolean;
  tags?: string[];
  collaborators: string[];
  rsvps?: { [userId: string]: 'Going' | 'Maybe' | 'Not Going' };
  createdAt: string;
}

interface CalendarProps {
  events: Event[];
  userId?: string;
  onAddEvent: (date: string) => void;
  onEditEvent: (event: Event) => void;
}

export default function Calendar({ events, userId, onAddEvent, onEditEvent }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth));
    const end = endOfWeek(endOfMonth(currentMonth));
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, -1)); // Wait, subMonths takes positive number to subtract
  const prevMonthFixed = () => setCurrentMonth(subMonths(currentMonth, 1));

  const getEventsForDay = (day: Date) => {
    return events.filter(event => isSameDay(parseISO(event.date), day));
  };

  return (
    <div className="bg-surface-container-low rounded-3xl border border-outline-variant/10 overflow-hidden shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-outline-variant/10 bg-surface-container">
        <h3 className="text-2xl font-serif capitalize">
          {format(currentMonth, 'MMMM yyyy')}
        </h3>
        <div className="flex gap-2">
          <button 
            onClick={prevMonthFixed}
            className="p-2 hover:bg-surface-container-highest rounded-full transition-colors text-outline"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setCurrentMonth(new Date())}
            className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-primary hover:bg-primary/10 rounded-full transition-colors"
          >
            Today
          </button>
          <button 
            onClick={nextMonth}
            className="p-2 hover:bg-surface-container-highest rounded-full transition-colors text-outline"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Weekdays */}
      <div className="grid grid-cols-7 border-b border-outline-variant/10 bg-surface-container/50">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="py-3 text-center text-[10px] uppercase tracking-widest font-bold text-outline/60">
            {day}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7">
        {days.map((day, i) => {
          const dayEvents = getEventsForDay(day);
          const isCurrentMonth = isSameMonth(day, currentMonth);
          
          return (
            <div 
              key={day.toString()}
              className={`min-h-[120px] p-2 border-r border-b border-outline-variant/10 transition-colors group relative
                ${!isCurrentMonth ? 'bg-surface-container-lowest/30' : 'bg-surface-container-low'}
                ${i % 7 === 6 ? 'border-r-0' : ''}
              `}
            >
              <div className="flex justify-between items-start mb-1">
                <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full transition-colors
                  ${isToday(day) ? 'bg-primary text-on-primary-fixed' : isCurrentMonth ? 'text-on-surface' : 'text-outline/40'}
                `}>
                  {format(day, 'd')}
                </span>
                <button 
                  onClick={() => onAddEvent(format(day, 'yyyy-MM-dd'))}
                  className="p-1 opacity-0 group-hover:opacity-100 hover:bg-primary/10 rounded-md transition-all text-primary"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>

              <div className="space-y-1 overflow-y-auto max-h-[80px] no-scrollbar">
                {dayEvents.map(event => (
                  <button
                    key={event.id}
                    onClick={() => onEditEvent(event)}
                    className="w-full text-left px-2 py-1 rounded-md bg-primary/10 hover:bg-primary/20 transition-colors border-l-2 border-primary group/event"
                  >
                    <div className="text-[10px] font-bold truncate text-primary leading-tight flex items-center gap-1">
                      {event.title}
                      {userId && event.rsvps?.[userId] && (
                        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          event.rsvps[userId] === 'Going' ? 'bg-secondary' : 
                          event.rsvps[userId] === 'Maybe' ? 'bg-primary' : 'bg-error'
                        }`} />
                      )}
                    </div>
                    {event.tags && event.tags.length > 0 && (
                      <div className="flex gap-0.5 mt-0.5">
                        {event.tags.slice(0, 3).map((_, idx) => (
                          <div key={idx} className="w-1 h-1 rounded-full bg-primary" />
                        ))}
                      </div>
                    )}
                    {event.time && (
                      <div className="text-[8px] text-outline/70 flex items-center gap-0.5">
                        <Clock className="w-2 h-2" /> {event.time}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Plus({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M5 12h14"/><path d="M12 5v14"/></svg>
  );
}
