import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from './App';
import { signOut, onAuthStateChanged } from './firebase';

vi.mock('./firebase', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual as any,
    auth: {},
    signOut: vi.fn(),
    onAuthStateChanged: vi.fn(),
    db: {},
    doc: vi.fn().mockReturnValue({}),
    collection: vi.fn().mockReturnValue({}),
    query: vi.fn().mockReturnValue({}),
    where: vi.fn().mockReturnValue({}),
    onSnapshot: vi.fn().mockReturnValue(vi.fn()), // return a mock unsubscribe function
    handleFirestoreError: vi.fn(),
    getDocs: vi.fn().mockResolvedValue({ docs: [] }),
    getDoc: vi.fn().mockResolvedValue({ exists: () => false }),
  };
});

vi.mock('@google/genai', () => {
  class MockGoogleGenAI {
    constructor() {}
  }
  return {
    GoogleGenAI: MockGoogleGenAI,
    Type: {}
  };
});

describe('App Logout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('logs error when logout fails', async () => {
    // Mock user is signed in to show the main app
    (onAuthStateChanged as any).mockImplementation((auth: any, callback: any) => {
      callback({ uid: '123', email: 'test@test.com' });
      return () => {};
    });

    const mockError = new Error('Firebase logout error');
    (signOut as any).mockRejectedValue(mockError);

    render(<App />);

    const logoutButton = await screen.findByTitle('Logout');
    fireEvent.click(logoutButton);

    await waitFor(() => {
      expect(signOut).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalledWith('Logout failed', mockError);
    });
  });
});
