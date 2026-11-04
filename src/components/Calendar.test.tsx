import test from 'node:test';
import assert from 'node:assert';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import Calendar from './Calendar';
import { format } from 'date-fns';

test('Calendar renders current month and year', () => {
  const html = renderToStaticMarkup(
    <Calendar events={[]} onAddEvent={() => {}} onEditEvent={() => {}} />
  );

  const currentMonthYear = format(new Date(), 'MMMM yyyy');
  assert.ok(html.includes(currentMonthYear), `Expected HTML to include "${currentMonthYear}"`);
  assert.ok(html.includes('Sun'), 'Expected HTML to include weekday "Sun"');
});

test('Calendar renders events correctly', () => {
  const today = new Date();
  const dateString = format(today, 'yyyy-MM-dd');

  const events = [
    {
      id: '1',
      ownerUid: 'user1',
      title: 'Important Meeting',
      date: dateString,
      collaborators: [],
      createdAt: dateString,
      time: '14:00',
      tags: ['work', 'urgent'],
    }
  ];

  const html = renderToStaticMarkup(
    <Calendar events={events} onAddEvent={() => {}} onEditEvent={() => {}} />
  );

  assert.ok(html.includes('Important Meeting'), 'Expected HTML to include event title');
  assert.ok(html.includes('14:00'), 'Expected HTML to include event time');
});

test('Calendar renders RSVP status correctly', () => {
  const today = new Date();
  const dateString = format(today, 'yyyy-MM-dd');

  const events = [
    {
      id: '2',
      ownerUid: 'user2',
      title: 'Party',
      date: dateString,
      collaborators: [],
      createdAt: dateString,
      rsvps: {
        'test-user': 'Going' as const
      }
    }
  ];

  const html = renderToStaticMarkup(
    <Calendar events={events} userId="test-user" onAddEvent={() => {}} onEditEvent={() => {}} />
  );

  assert.ok(html.includes('Party'), 'Expected HTML to include event title');
  assert.ok(html.includes('bg-secondary'), 'Expected HTML to include "bg-secondary" for Going RSVP');
});

test('Calendar highlights today', () => {
  const html = renderToStaticMarkup(
    <Calendar events={[]} onAddEvent={() => {}} onEditEvent={() => {}} />
  );

  assert.ok(html.includes('bg-primary text-on-primary-fixed'), 'Expected HTML to highlight today');
});
