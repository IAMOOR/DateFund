import test from 'node:test';
import assert from 'node:assert';
import { calculatePasswordStrength, getPasswordStrengthColor, getPasswordStrengthLabel } from './password';

test('passwordUtils', async (t) => {
  await t.test('calculatePasswordStrength calculates score correctly', () => {
    assert.strictEqual(calculatePasswordStrength(''), 0);
    assert.strictEqual(calculatePasswordStrength('short'), 1);
    assert.strictEqual(calculatePasswordStrength('longpass'), 2); // >= 8 and lowercase
    assert.strictEqual(calculatePasswordStrength('Longpass'), 3); // >= 8, upper, lower
    assert.strictEqual(calculatePasswordStrength('Longpass1'), 4); // >= 8, upper, lower, number
    assert.strictEqual(calculatePasswordStrength('Longpass1!'), 5); // >= 8, upper, lower, number, special
  });

  await t.test('getPasswordStrengthColor returns correct color', () => {
    assert.strictEqual(getPasswordStrengthColor(0), 'bg-error');
    assert.strictEqual(getPasswordStrengthColor(2), 'bg-error');
    assert.strictEqual(getPasswordStrengthColor(3), 'bg-secondary');
    assert.strictEqual(getPasswordStrengthColor(4), 'bg-secondary');
    assert.strictEqual(getPasswordStrengthColor(5), 'bg-primary');
  });

  await t.test('getPasswordStrengthLabel returns correct label', () => {
    assert.strictEqual(getPasswordStrengthLabel(5, ''), '');
    assert.strictEqual(getPasswordStrengthLabel(1, 'pwd'), 'Weak');
    assert.strictEqual(getPasswordStrengthLabel(2, 'pwd'), 'Weak');
    assert.strictEqual(getPasswordStrengthLabel(3, 'pwd'), 'Fair');
    assert.strictEqual(getPasswordStrengthLabel(4, 'pwd'), 'Fair');
    assert.strictEqual(getPasswordStrengthLabel(5, 'pwd'), 'Strong');
  });
});
