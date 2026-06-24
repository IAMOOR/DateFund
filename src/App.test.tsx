import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, beforeEach, it, expect } from 'vitest';
import App from './App';
import * as firebaseLib from 'firebase/firestore';
import { handleFirestoreError, OperationType } from './firebase';

// Mock dependencies
vi.mock('firebase/firestore', async () => {
  const actual = await vi.importActual('firebase/firestore');
  return {
    ...actual,
    setDoc: vi.fn(),
    doc: vi.fn(),
    getFirestore: vi.fn(() => ({})),
    collection: vi.fn(),
    onSnapshot: vi.fn(() => vi.fn()),
    query: vi.fn(),
    where: vi.fn(),
    getDocs: vi.fn(() => ({ docs: [] })),
    writeBatch: vi.fn(() => ({ commit: vi.fn(), update: vi.fn(), set: vi.fn() }))
  };
});

vi.mock('./firebase', async () => {
  const actual = await vi.importActual('./firebase');
  return {
    ...actual,
    auth: {
      currentUser: { uid: 'test-uid', email: 'test@example.com' },
      onAuthStateChanged: vi.fn((callback) => {
        callback({ uid: 'test-uid', email: 'test@example.com' });
        return vi.fn();
      }),
    },
    db: {},
    handleFirestoreError: vi.fn(),
    OperationType: actual.OperationType
  };
});

// Mock @google/genai
vi.mock('@google/genai', () => ({
  GoogleGenAI: class MockGoogleGenAI {
    models = {
      generateContent: vi.fn()
    };
  }
}));

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should capture error when adding a goal fails', async () => {
    // Setup mock to throw error
    const mockError = new Error('Firestore error');
    (firebaseLib.setDoc as any).mockRejectedValueOnce(mockError);

    render(<App />);

    // Click on New Goal button
    await waitFor(() => {
      expect(screen.getByText('New Goal')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('New Goal'));

    // The modal should open. Find inputs
    await waitFor(() => {
      const nameInput = screen.getByPlaceholderText(/e\.g\. Weekend in Cape Town/i);
      expect(nameInput).toBeInTheDocument();

      fireEvent.change(nameInput, { target: { value: 'New Test Goal' } });

      const targetInput = screen.getByPlaceholderText(/0\.00/i);
      fireEvent.change(targetInput, { target: { value: '1000' } });

      // Add deadline
      const deadlineInputs = document.querySelectorAll('input[type="date"]');
      if (deadlineInputs.length > 0) {
        fireEvent.change(deadlineInputs[0], { target: { value: '2025-12-31' } });
      }

      // Submit the form
      const submitBtn = screen.getByRole('button', { name: /Create Goal/i });
      fireEvent.click(submitBtn);
    });

    // Wait for the mock to be called and handleFirestoreError to be triggered
    await waitFor(() => {
      expect(firebaseLib.setDoc).toHaveBeenCalled();
      expect(handleFirestoreError).toHaveBeenCalledWith(
        mockError,
        OperationType.CREATE,
        expect.stringMatching(/^goals\//)
      );
    });
  });
});
