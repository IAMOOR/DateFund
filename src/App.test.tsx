import { test, describe, after } from "node:test";
import assert from "node:assert";
import { getStrengthLabel } from "./App.tsx";
import { db } from "./firebase.ts";
import { terminate } from "firebase/firestore";

describe("getStrengthLabel", () => {
  after(async () => {
    try {
      await terminate(db);
    } catch (e) {
      // ignore
    }
  });

  test("returns empty string when password is not provided or empty", () => {
    assert.strictEqual(getStrengthLabel(0, ""), "");
    assert.strictEqual(getStrengthLabel(5, undefined), "");
  });

  test("returns 'Weak' when score is 2 or less", () => {
    assert.strictEqual(getStrengthLabel(0, "a"), "Weak");
    assert.strictEqual(getStrengthLabel(1, "a"), "Weak");
    assert.strictEqual(getStrengthLabel(2, "a"), "Weak");
  });

  test("returns 'Fair' when score is between 3 and 4", () => {
    assert.strictEqual(getStrengthLabel(3, "a"), "Fair");
    assert.strictEqual(getStrengthLabel(4, "a"), "Fair");
  });

  test("returns 'Strong' when score is greater than 4", () => {
    assert.strictEqual(getStrengthLabel(5, "a"), "Strong");
    assert.strictEqual(getStrengthLabel(6, "a"), "Strong");
    assert.strictEqual(getStrengthLabel(100, "a"), "Strong");
  });
});
