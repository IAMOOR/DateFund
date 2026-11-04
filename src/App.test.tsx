import test, { after, describe } from 'node:test';
import assert from 'node:assert';
import { HistoryItem } from './App.js';
import * as React from 'react';
import { renderToString } from 'react-dom/server';

describe('HistoryItem', () => {
  test('renders basic props correctly', () => {
    const html = renderToString(
      <HistoryItem
        title="Coffee"
        subtitle="Today"
        amount="$4.50"
        iconBg="bg-blue-500"
      />
    );
    assert.ok(html.includes('Coffee'), 'Should render title');
    assert.ok(html.includes('Today'), 'Should render subtitle');
    assert.ok(html.includes('$4.50'), 'Should render amount');
    assert.ok(html.includes('bg-blue-500'), 'Should render iconBg class');
    assert.ok(html.includes('text-on-surface'), 'Should render default amountColor');
  });

  test('renders with avatar correctly', () => {
    const avatarUrl = 'https://example.com/avatar.jpg';
    const html = renderToString(
      <HistoryItem
        title="Dinner"
        subtitle="Yesterday"
        amount="$45.00"
        iconBg="bg-red-500"
        avatar={avatarUrl}
      />
    );
    assert.ok(html.includes('img'), 'Should render img tag');
    assert.ok(html.includes(avatarUrl), 'Should render avatar url');
  });

  test('renders with icon correctly when no avatar provided', () => {
    const html = renderToString(
      <HistoryItem
        title="Lunch"
        subtitle="Monday"
        amount="$15.00"
        iconBg="bg-green-500"
        icon={<span id="test-icon">Icon</span>}
      />
    );
    assert.ok(!html.includes('img'), 'Should not render img tag');
    assert.ok(html.includes('id="test-icon"'), 'Should render icon element');
    assert.ok(html.includes('Icon'), 'Should render icon text');
  });

  test('renders custom amountColor', () => {
    const html = renderToString(
      <HistoryItem
        title="Salary"
        subtitle="Last week"
        amount="$2000.00"
        iconBg="bg-green-500"
        amountColor="text-green-500"
      />
    );
    assert.ok(html.includes('text-green-500'), 'Should render custom amountColor');
    assert.ok(!html.includes('text-on-surface'), 'Should not render default amountColor');
  });
});
