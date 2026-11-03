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
import { ChevronLeft, ChevronRight, Clock, MapPin, Plus, Calendar as CalendarIcon, CheckCircle2 } from 'lucide-react';
import { Event } from '../types';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { MoodBadge } from './ui/MoodBadge';
import { getMoodConfig } from '../utils/moods';

interface CalendarProps {
  events: Event[];
  userId?: string;
  onAddEvent: (date: string) => void;
  onEditEvent: (event: Event) => void;
}

export default function Calendar({ events, userId, onAddEvent, onEditEvent }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth));
    const end = endOfWeek(endOfMonth(currentMonth));
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const getEventsForDay = (day: Date) => {
    return events.filter(event => {
      try {
        return isSameDay(parseISO(event.date), day);
      } catch {
        return false;
      }
    });
  };

  const selectedDayEvents = useMemo(() => {
    return getEventsForDay(selectedDate);
  }, [selectedDate, events]);

  return (
    <div className="space-y-4">
      <div className="bg-surface-container-low rounded-3xl border border-outline-variant/15 overflow-hidden shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-outline-variant/10 bg-surface-container">
          <h3 className="text-xl sm:text-2xl font-serif text-on-surface">
            {format(currentMonth, 'MMMM yyyy')}
          </h3>
          <div className="flex items-center gap-1.5">
            <button 
              onClick={prevMonth}
              aria-label="Previous month"
              className="p-2 hover:bg-surface-container-highest rounded-full transition-colors text-outline min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button 
              onClick={() => {
                const today = new Date();
                setCurrentMonth(today);
                setSelectedDate(today);
              }}
              className="px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-primary hover:bg-primary/10 rounded-full transition-colors min-h-[36px]"
            >
              Today
            </button>
            <button 
              onClick={nextMonth}
              aria-label="Next month"
              className="p-2 hover:bg-surface-container-highest rounded-full transition-colors text-outline min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Weekdays */}
        <div className="grid grid-cols-7 border-b border-outline-variant/10 bg-surface-container/60">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="py-2.5 text-center text-[10px] sm:text-xs uppercase tracking-wider font-semibold text-outline">
              {day}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7">
          {days.map((day, i) => {
            const dayEvents = getEventsForDay(day);
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isSelected = isSameDay(day, selectedDate);
            const fullDateLabel = format(day, 'EEEE, d MMMM yyyy');
            
            return (
              <div 
                key={day.toISOString()}
                role="button"
                tabIndex={0}
                aria-label={`${fullDateLabel}, ${dayEvents.length} event${dayEvents.length === 1 ? '' : 's'}`}
                aria-selected={isSelected}
                onClick={() => setSelectedDate(day)}
                onKeyDown={e => e.key === 'Enter' && setSelectedDate(day)}
                className={`min-h-[64px] sm:min-h-[96px] p-1.5 sm:p-2 border-r border-b border-outline-variant/10 transition-colors group relative cursor-pointer
                  ${!isCurrentMonth ? 'bg-surface-container-lowest/20 opacity-50' : 'bg-surface-container-low'}
                  ${isSelected ? 'ring-2 ring-inset ring-primary bg-primary/5' : 'hover:bg-surface-container-high/40'}
                  ${i % 7 === 6 ? 'border-r-0' : ''}
                `}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className={`text-[11px] sm:text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full transition-colors
                    ${isToday(day) ? 'bg-primary text-on-primary-fixed' : isSelected ? 'bg-secondary text-on-secondary' : isCurrentMonth ? 'text-on-surface' : 'text-outline'}
                  `}>
                    {format(day, 'd')}
                  </span>
                  
                  {dayEvents.length > 0 && (
                    <span className="w-2 h-2 rounded-full bg-primary shrink-0 sm:hidden" />
                  )}
                </div>

                {/* Desktop/Tablet Event Pills */}
                <div className="hidden sm:block space-y-1 overflow-y-auto max-h-[60px] no-scrollbar">
                  {dayEvents.map(event => (
                    <button
                      key={event.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditEvent(event);
                      }}
                      className="w-full text-left px-1.5 py-0.5 rounded-md bg-primary/10 hover:bg-primary/20 transition-colors border-l-2 border-primary truncate flex items-center gap-1"
                    >
                      {event.mood && (
                        <span className="text-[10px] shrink-0" title={`Mood: ${event.mood}`}>
                          {getMoodConfig(event.mood).emoji}
                        </span>
                      )}
                      <span className="text-[10px] font-bold text-primary truncate block leading-tight">
                        {event.title}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Mobile Micro Dots */}
                <div className="sm:hidden flex gap-0.5 flex-wrap justify-center mt-1">
                  {dayEvents.slice(0, 3).map((event, idx) => (
                    <div
                      key={idx}
                      className={`w-1.5 h-1.5 rounded-full ${event.mood ? getMoodConfig(event.mood).dotColor : 'bg-primary'}`}
                      title={event.mood ? `Mood: ${event.mood}` : event.title}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Day Agenda Drawer */}
      <Card variant="high" padding="md" className="space-y-3">
        <div className="flex items-center justify-between border-b border-outline-variant/10 pb-3">
          <div>
            <h4 className="font-serif text-lg font-bold text-on-surface">
              {format(selectedDate, 'EEEE, d MMMM yyyy')}
            </h4>
            <span className="text-xs text-outline">
              {selectedDayEvents.length} scheduled couple date{selectedDayEvents.length === 1 ? '' : 's'}
            </span>
          </div>

          <Button
            variant="primary"
            size="sm"
            icon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => onAddEvent(format(selectedDate, 'yyyy-MM-dd'))}
          >
            Plan Date on this Day
          </Button>
        </div>

        {selectedDayEvents.length > 0 ? (
          <div className="space-y-2 pt-1">
            {selectedDayEvents.map(event => (
              <div
                key={event.id}
                onClick={() => onEditEvent(event)}
                className="p-3.5 rounded-2xl bg-surface-container border border-outline-variant/15 hover:border-primary/40 transition-all cursor-pointer flex items-center justify-between gap-3"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h5 className="font-serif text-base font-bold text-on-surface truncate">{event.title}</h5>
                    {event.mood && <MoodBadge mood={event.mood} variant="compact" />}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-outline">
                    {event.time && (
                      <span className="flex items-center gap-1 text-primary font-medium">
                        <Clock className="w-3.5 h-3.5" /> {event.time}
                      </span>
                    )}
                    {event.location && (
                      <span className="flex items-center gap-1 truncate max-w-[200px]">
                        <MapPin className="w-3.5 h-3.5 text-secondary" /> {event.location}
                      </span>
                    )}
                  </div>
                </div>

                <Button variant="outline" size="sm" onClick={() => onEditEvent(event)}>
                  Details
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-outline italic py-2">
            No dates scheduled for this day. Click above to plan a romantic dinner, getaway, or surprise outing.
          </p>
        )}
      </Card>
    </div>
  );
}
