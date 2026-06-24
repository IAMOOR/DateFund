import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App';
import * as firebase from '../firebase';

vi.mock('../firebase', () => ({
  auth: {},
  db: {},
  googleProvider: {},
  signInWithPopup: vi.fn(),
  onAuthStateChanged: vi.fn((auth, cb) => {
    cb(null); // Initial state: not logged in
    return vi.fn(); // Unsubscribe function
  }),
  testConnection: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
}));

describe('App component login tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('displays an error message when Google sign-in fails', async () => {
    // Mock signInWithPopup to reject with an error
    const mockError = new Error('Sign-in failed');
    (mockError as any).code = 'auth/network-request-failed';
    (firebase.signInWithPopup as any).mockRejectedValueOnce(mockError);

    render(<App />);

    // Wait for the login screen to render
    await waitFor(() => {
        expect(screen.getByText('Google')).toBeInTheDocument();
    });

    const googleSignInButton = screen.getByText('Google');
    fireEvent.click(googleSignInButton);

    // Wait for the error message to appear in the DOM
    await waitFor(() => {
      expect(screen.getByText('Google sign-in failed. Please try again.')).toBeInTheDocument();
    });
  });

  it('does not display an error message if the popup is closed by the user', async () => {
    // Mock signInWithPopup to reject with 'auth/popup-closed-by-user'
    const mockError = new Error('Popup closed');
    (mockError as any).code = 'auth/popup-closed-by-user';
    (firebase.signInWithPopup as any).mockRejectedValueOnce(mockError);

    render(<App />);

    // Wait for the login screen to render
    await waitFor(() => {
        expect(screen.getByText('Google')).toBeInTheDocument();
    });

    const googleSignInButton = screen.getByText('Google');
    fireEvent.click(googleSignInButton);

    // Give it a small amount of time for any state updates
    await waitFor(() => {
        expect(firebase.signInWithPopup).toHaveBeenCalled();
    });

    // Assert that the error message is NOT in the DOM
    expect(screen.queryByText('Google sign-in failed. Please try again.')).not.toBeInTheDocument();
  });
});
