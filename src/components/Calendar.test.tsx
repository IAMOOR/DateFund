import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Calendar from './Calendar';
import { format } from 'date-fns';

describe('Calendar Component', () => {
  const mockOnAddEvent = vi.fn();
  const mockOnEditEvent = vi.fn();
  const mockUserId = 'test-user-id';

  it('renders the current month and year in the header', () => {
    render(
      <Calendar
        events={[]}
        userId={mockUserId}
        onAddEvent={mockOnAddEvent}
        onEditEvent={mockOnEditEvent}
      />
    );

    const currentMonthYear = format(new Date(), 'MMMM yyyy');
    expect(screen.getByText(currentMonthYear)).toBeInTheDocument();
  });

  it('renders all weekdays', () => {
    render(
      <Calendar
        events={[]}
        userId={mockUserId}
        onAddEvent={mockOnAddEvent}
        onEditEvent={mockOnEditEvent}
      />
    );

    ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach(day => {
      expect(screen.getByText(day)).toBeInTheDocument();
    });
  });

  it('renders today with the primary background class', () => {
    render(
      <Calendar
        events={[]}
        userId={mockUserId}
        onAddEvent={mockOnAddEvent}
        onEditEvent={mockOnEditEvent}
      />
    );

    const today = format(new Date(), 'd');
    const todayElement = screen.getByText(today);
    expect(todayElement).toHaveClass('bg-primary');
  });
});
