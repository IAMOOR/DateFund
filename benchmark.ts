import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, parseISO, format } from 'date-fns';

interface Event {
  id: string;
  date: string;
}

const events: Event[] = [];
for (let i = 0; i < 5000; i++) {
  const d = new Date(2023, 5, Math.floor(Math.random() * 30) + 1);
  events.push({ id: String(i), date: d.toISOString() });
}

const currentMonth = new Date(2023, 5, 1);
const start = startOfWeek(startOfMonth(currentMonth));
const end = endOfWeek(endOfMonth(currentMonth));
const days = eachDayOfInterval({ start, end });

console.time('Original');
for (let j = 0; j < 100; j++) {
  const getEventsForDay = (day: Date) => {
    return events.filter(event => isSameDay(parseISO(event.date), day));
  };
  days.forEach(day => {
    getEventsForDay(day);
  });
}
console.timeEnd('Original');

console.time('Optimized');
for (let j = 0; j < 100; j++) {
  const eventsByDay = events.reduce((acc, event) => {
    const dayString = format(parseISO(event.date), 'yyyy-MM-dd');
    if (!acc[dayString]) acc[dayString] = [];
    acc[dayString].push(event);
    return acc;
  }, {} as Record<string, Event[]>);

  days.forEach(day => {
    const dayString = format(day, 'yyyy-MM-dd');
    const dayEvents = eventsByDay[dayString] || [];
  });
}
console.timeEnd('Optimized');
