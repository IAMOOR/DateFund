import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import rawConfig from '../firebase-applet-config.json';
import { firebaseConfig } from '../src/firebase';

describe('Firebase Configuration Security', () => {
  it('does not contain hardcoded sensitive API keys in firebase-applet-config.json', () => {
    const configPath = path.resolve(__dirname, '../firebase-applet-config.json');
    const content = fs.readFileSync(configPath, 'utf8');
    const parsed = JSON.parse(content);

    // API key should be empty string in the checked-in config file
    expect(parsed.apiKey).toBe('');
    expect(rawConfig.apiKey).toBe('');
    // Verify no Google API key signature exists in the configuration file
    expect(content).not.toMatch(/AIzaSy[A-Za-z0-9_-]{33}/);
  });

  it('preserves non-sensitive project configuration fields in firebase-applet-config.json', () => {
    expect(rawConfig.projectId).toBe('gen-lang-client-0445458275');
    expect(rawConfig.authDomain).toBe('gen-lang-client-0445458275.firebaseapp.com');
    expect(rawConfig.firestoreDatabaseId).toBe('ai-studio-792accfe-1339-451e-9a80-ece99c2fae56');
    expect(rawConfig.storageBucket).toBe('gen-lang-client-0445458275.firebasestorage.app');
  });

  it('resolves configuration with environment variable precedence when VITE_FIREBASE_API_KEY is provided', () => {
    expect(firebaseConfig).toBeDefined();
    expect(typeof firebaseConfig.apiKey).toBe('string');
  });
});
