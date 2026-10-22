import { describe, it } from 'node:test';
import assert from 'node:assert';
import { calculatePasswordStrength, getStrengthColor, getStrengthLabel } from './password.js';

describe('Password Utility Functions', () => {
  describe('calculatePasswordStrength', () => {
    it('returns 0 for an empty string', () => {
      assert.strictEqual(calculatePasswordStrength(''), 0);
    });

    it('adds 1 for length >= 8', () => {
      assert.strictEqual(calculatePasswordStrength('abcdefgh'), 2); // lowercase + length
    });

    it('adds 1 for uppercase letter', () => {
      assert.strictEqual(calculatePasswordStrength('A'), 1);
    });

    it('adds 1 for lowercase letter', () => {
      assert.strictEqual(calculatePasswordStrength('a'), 1);
    });

    it('adds 1 for number', () => {
      assert.strictEqual(calculatePasswordStrength('1'), 1);
    });

    it('adds 1 for special character', () => {
      assert.strictEqual(calculatePasswordStrength('!'), 1);
    });

    it('calculates maximum strength (5) for a strong password', () => {
      assert.strictEqual(calculatePasswordStrength('StrongPass1!'), 5);
    });
  });

  describe('getStrengthColor', () => {
    it('returns "bg-error" for score <= 2', () => {
      assert.strictEqual(getStrengthColor(0), 'bg-error');
      assert.strictEqual(getStrengthColor(1), 'bg-error');
      assert.strictEqual(getStrengthColor(2), 'bg-error');
    });

    it('returns "bg-secondary" for score <= 4', () => {
      assert.strictEqual(getStrengthColor(3), 'bg-secondary');
      assert.strictEqual(getStrengthColor(4), 'bg-secondary');
    });

    it('returns "bg-primary" for score > 4', () => {
      assert.strictEqual(getStrengthColor(5), 'bg-primary');
    });
  });

  describe('getStrengthLabel', () => {
    it('returns empty string if password is empty', () => {
      assert.strictEqual(getStrengthLabel('', 5), '');
    });

    it('returns "Weak" for score <= 2', () => {
      assert.strictEqual(getStrengthLabel('a', 1), 'Weak');
      assert.strictEqual(getStrengthLabel('ab', 2), 'Weak');
    });

    it('returns "Fair" for score <= 4', () => {
      assert.strictEqual(getStrengthLabel('abc', 3), 'Fair');
      assert.strictEqual(getStrengthLabel('abcd', 4), 'Fair');
    });

    it('returns "Strong" for score > 4', () => {
      assert.strictEqual(getStrengthLabel('abcde', 5), 'Strong');
    });
  });
});
