import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import Calendar from '../src/components/Calendar';
import { Event } from '../src/types';

describe('Calendar Component Tests', () => {
  it('renders the Calendar header, navigation, and plan date button correctly', () => {
    const mockEvents: Event[] = [
      {
        id: 'event-1',
        title: 'Dinner at Sunset',
        date: new Date().toISOString(),
        location: 'Rooftop Lounge',
        time: '19:00',
        mood: 'Romantic',
        collaborators: ['user-1'],
        rsvps: { 'user-1': 'Going' },
        goalId: '',
        ownerUid: 'user-1',
        createdAt: new Date().toISOString()
      }
    ];

    const html = renderToStaticMarkup(
      <Calendar
        events={mockEvents}
        userId="user-1"
        onAddEvent={() => {}}
        onEditEvent={() => {}}
      />
    );

    // Verify button text
    expect(html).toContain('Plan Date on this Day');
    // Verify lucide icon SVG is rendered
    expect(html).toContain('lucide-plus');
    // Verify event details
    expect(html).toContain('Dinner at Sunset');
    expect(html).toContain('Rooftop Lounge');
  });

  it('renders empty day message when no events exist for selected date', () => {
    const html = renderToStaticMarkup(
      <Calendar
        events={[]}
        userId="user-1"
        onAddEvent={() => {}}
        onEditEvent={() => {}}
      />
    );

    expect(html).toContain('No dates scheduled for this day');
    expect(html).toContain('Plan Date on this Day');
    expect(html).toContain('lucide-plus');
  });
});
