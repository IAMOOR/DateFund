import test, { describe } from 'node:test';
import assert from 'node:assert';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { format } from 'date-fns';
import Calendar from './Calendar';

describe('Calendar', () => {
  const defaultProps = {
    events: [],
    onAddEvent: () => {},
    onEditEvent: () => {},
  };

  test('renders events for the current day correctly', () => {
    const today = new Date();
    // Use format to get local timezone date string to prevent flaky UTC tests
    const todayFormatted = format(today, 'yyyy-MM-dd');
    const props = {
      ...defaultProps,
      events: [
        {
          id: 'event-1',
          ownerUid: 'user-1',
          title: 'Meeting with Team',
          date: todayFormatted,
          collaborators: [],
          createdAt: new Date().toISOString(),
        }
      ]
    };

    const html = renderToStaticMarkup(<Calendar {...props} />);

    // Check that the event is rendered within the correct day block.
    // The rendered structure includes the day number and then the event title.
    const dayNumber = format(today, 'd');
    const expectedPattern = new RegExp(`${dayNumber}</span>.*?Meeting with Team`);
    assert.match(html.replace(/\n/g, ''), expectedPattern);
  });

  test('does not render events for a different day (outside visible grid)', () => {
    const today = new Date();
    // Adding 2 months ensures the date falls completely outside the calendar's visible 6-week grid
    const futureDate = new Date(today);
    futureDate.setMonth(today.getMonth() + 2);
    const futureDateFormatted = format(futureDate, 'yyyy-MM-dd');

    const props = {
      ...defaultProps,
      events: [
        {
          id: 'event-2',
          ownerUid: 'user-1',
          title: 'Future Event',
          date: futureDateFormatted,
          collaborators: [],
          createdAt: new Date().toISOString(),
        }
      ]
    };

    const html = renderToStaticMarkup(<Calendar {...props} />);
    // "Future Event" should not be rendered if the calendar initially displays current month
    assert.doesNotMatch(html, /Future Event/);
  });

  test('handles edge case: malformed date string gracefully', () => {
    const props = {
      ...defaultProps,
      events: [
        {
          id: 'event-3',
          ownerUid: 'user-1',
          title: 'Malformed Date Event',
          date: 'not-a-valid-date',
          collaborators: [],
          createdAt: new Date().toISOString(),
        }
      ]
    };

    // Component should not crash, parseISO handles invalid strings by returning Invalid Date,
    // isSameDay returns false if one is Invalid Date.
    const html = renderToStaticMarkup(<Calendar {...props} />);
    assert.doesNotMatch(html, /Malformed Date Event/);
  });
});
