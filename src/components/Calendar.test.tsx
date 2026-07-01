import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { Plus } from './Calendar.tsx';

describe('Plus component', () => {
  it('should render an svg element with correct default props', () => {
    const html = renderToStaticMarkup(<Plus />);
    assert.match(html, /<svg[^>]*>/);
    assert.match(html, /width="24"/);
    assert.match(html, /height="24"/);
    assert.match(html, /viewBox="0 0 24 24"/);
    assert.match(html, /fill="none"/);
    assert.match(html, /stroke="currentColor"/);
    assert.match(html, /stroke-width="2"/);
    assert.match(html, /stroke-linecap="round"/);
    assert.match(html, /stroke-linejoin="round"/);

    // Check paths
    assert.match(html, /<path d="M5 12h14"><\/path>/);
    assert.match(html, /<path d="M12 5v14"><\/path>/);
  });

  it('should accept and apply a className', () => {
    const html = renderToStaticMarkup(<Plus className="test-class" />);
    assert.match(html, /class="test-class"/);
  });
});
