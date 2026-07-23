import { test, describe } from 'node:test';
import assert from 'node:assert';
import { getEventsForDay, Event } from './Calendar';
import { format } from 'date-fns';

describe('Calendar getEventsForDay', () => {
  const mockEvents: Event[] = [
    { id: '1', title: 'Event 1', date: '2023-10-15', ownerUid: 'user1', collaborators: [], createdAt: '2023-10-01' },
    { id: '2', title: 'Event 2', date: '2023-10-15', ownerUid: 'user1', collaborators: [], createdAt: '2023-10-01' },
    { id: '3', title: 'Event 3', date: '2023-10-16', ownerUid: 'user1', collaborators: [], createdAt: '2023-10-01' },
  ];

  test('returns events for a given day', () => {
    const day = new Date('2023-10-15T00:00:00');
    const events = getEventsForDay(mockEvents, day);
    assert.strictEqual(events.length, 2);
    assert.strictEqual(events[0].id, '1');
    assert.strictEqual(events[1].id, '2');
  });

  test('returns empty array when no events match', () => {
    const day = new Date('2023-10-17T00:00:00');
    const events = getEventsForDay(mockEvents, day);
    assert.strictEqual(events.length, 0);
  });

  test('returns empty array when given empty events list', () => {
    const day = new Date('2023-10-15T00:00:00');
    const events = getEventsForDay([], day);
    assert.strictEqual(events.length, 0);
  });
});
