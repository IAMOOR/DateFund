import React from 'react';
import { DateMood } from '../../types';
import { getMoodConfig } from '../../utils/moods';

interface MoodBadgeProps {
  mood?: DateMood | string;
  size?: 'sm' | 'md';
  variant?: 'badge' | 'subtle' | 'compact';
  className?: string;
}

export const MoodBadge: React.FC<MoodBadgeProps> = ({
  mood,
  size = 'sm',
  variant = 'badge',
  className = '',
}) => {
  if (!mood) return null;
  const config = getMoodConfig(mood);

  if (variant === 'compact') {
    return (
      <span
        title={`Mood: ${config.label}`}
        aria-label={`Date Mood: ${config.label}`}
        className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${config.badgeClass} ${className}`}
      >
        <span>{config.emoji}</span>
        <span className="text-[11px] font-medium">{config.label}</span>
      </span>
    );
  }

  const sizeClasses =
    size === 'sm' ? 'text-[11px] px-2.5 py-0.5 gap-1.5' : 'text-xs px-3 py-1 gap-2';

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full shadow-2xs transition-all ${config.badgeClass} ${sizeClasses} ${className}`}
      title={`Mood: ${config.label}`}
    >
      <span className="shrink-0">{config.emoji}</span>
      <span>{config.label}</span>
    </span>
  );
};

export default MoodBadge;
