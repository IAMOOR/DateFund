import { test, describe } from 'node:test';
import assert from 'node:assert';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import Calendar from './Calendar.js';

describe('Calendar component', () => {
  test('renders without crashing when events array is empty', () => {
    const html = renderToStaticMarkup(
      <Calendar
        events={[]}
        userId="test-user"
        onAddEvent={() => {}}
        onEditEvent={() => {}}
      />
    );
    assert.match(html, /class=".*"/);
  });
});
