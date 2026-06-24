import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import * as firebaseMod from './firebase';
import { vi, describe, beforeEach, test, expect } from "vitest";

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // Deprecated
    removeListener: vi.fn(), // Deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock intersection observer for framer-motion/react
class IntersectionObserver {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
}

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: IntersectionObserver,
})

// Mock the entire firebase module
vi.mock('./firebase', async (importOriginal) => {
  const actual = await importOriginal<typeof import("./firebase")>();
  return {
    ...actual,
    createUserWithEmailAndPassword: vi.fn(),
    signInWithEmailAndPassword: vi.fn(),
    onAuthStateChanged: vi.fn((auth, cb) => {
      // Call with null to indicate user is NOT logged in
      // This will set isAuthReady to true and user to null
      setTimeout(() => cb(null), 0);
      return vi.fn(); // Return unsubscribe function
    }),
    db: {},
    auth: {},
  };
});

// Mock @google/genai
vi.mock('@google/genai', () => {
  const GoogleGenAI = vi.fn();
  GoogleGenAI.prototype.models = {
    generateContent: vi.fn()
  };
  return {
    GoogleGenAI,
    Type: {
      STRING: 'STRING',
      ARRAY: 'ARRAY',
      OBJECT: 'OBJECT'
    }
  };
});

describe('App Authentication Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('displays correct error message when signup fails with email-already-in-use', async () => {
    const user = userEvent.setup();
    // Setup mock to fail with specific error
    const mockError = { code: 'auth/email-already-in-use' };
    vi.mocked(firebaseMod.createUserWithEmailAndPassword).mockRejectedValueOnce(mockError);

    render(<App />);

    // Wait for auth to be ready and loading spinner to disappear
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
    });

    // Switch to signup mode
    const switchToSignupBtn = screen.getByRole('button', { name: /Sign Up/i });
    await user.click(switchToSignupBtn);

    // Fill out the form
    const emailInput = screen.getByPlaceholderText('you@example.com');
    const passwordInput = screen.getByPlaceholderText('••••••••');

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123'); // must be at least 8 chars

    // Submit form
    const submitBtn = screen.getByRole('button', { name: /Sign Up/i });
    await user.click(submitBtn);

    // Assert error message is displayed
    await waitFor(() => {
      expect(screen.getByText('This email is already registered.')).toBeInTheDocument();
    });
  });

  test('displays correct error message when signin fails with invalid-credential', async () => {
    const user = userEvent.setup();
    // Setup mock to fail with specific error
    const mockError = { code: 'auth/invalid-credential' };
    vi.mocked(firebaseMod.signInWithEmailAndPassword).mockRejectedValueOnce(mockError);

    render(<App />);

    // Wait for auth to be ready
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
    });

    // Fill out the form
    const emailInput = screen.getByPlaceholderText('you@example.com');
    const passwordInput = screen.getByPlaceholderText('••••••••');

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'wrongpassword'); // validation length is 1 chars for login

    // Submit form
    const submitBtn = screen.getByRole('button', { name: /Sign In/i });
    await user.click(submitBtn);

    // Assert error message is displayed
    await waitFor(() => {
      expect(screen.getByText('Invalid email or password.')).toBeInTheDocument();
    });
  });

  test('displays correct error message when signin fails with invalid-email', async () => {
    const user = userEvent.setup();
    // Setup mock to fail with specific error
    const mockError = { code: 'auth/invalid-email' };
    vi.mocked(firebaseMod.signInWithEmailAndPassword).mockRejectedValueOnce(mockError);

    render(<App />);

    // Wait for auth to be ready
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
    });

    // Fill out the form
    const emailInput = screen.getByPlaceholderText('you@example.com');
    const passwordInput = screen.getByPlaceholderText('••••••••');

    // Using an invalid email that passes React custom validation (x@y.z)
    await user.type(emailInput, 'invalid@example.com');
    await user.type(passwordInput, 'password123');

    // Submit form
    const submitBtn = screen.getByRole('button', { name: /Sign In/i });
    await user.click(submitBtn);

    // Assert error message is displayed
    await waitFor(() => {
      expect(screen.getByText('Invalid email address.')).toBeInTheDocument();
    });
  });

  test('displays correct error message when signup fails with weak-password', async () => {
    const user = userEvent.setup();
    // Setup mock to fail with specific error
    const mockError = { code: 'auth/weak-password' };
    vi.mocked(firebaseMod.createUserWithEmailAndPassword).mockRejectedValueOnce(mockError);

    render(<App />);

    // Wait for auth to be ready
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
    });

    // Switch to signup mode
    const switchToSignupBtn = screen.getByRole('button', { name: /Sign Up/i });
    await user.click(switchToSignupBtn);

    // Fill out the form
    const emailInput = screen.getByPlaceholderText('you@example.com');
    const passwordInput = screen.getByPlaceholderText('••••••••');

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123'); // must be 8 chars for client validation

    // Submit form
    const submitBtn = screen.getByRole('button', { name: /Sign Up/i });
    await user.click(submitBtn);

    // Assert error message is displayed
    await waitFor(() => {
      expect(screen.getByText('Password is too weak.')).toBeInTheDocument();
    });
  });

  test('displays generic error message when auth fails with unknown error code', async () => {
    const user = userEvent.setup();
    // Setup mock to fail with specific error
    const mockError = { code: 'some-unknown-error' };
    vi.mocked(firebaseMod.signInWithEmailAndPassword).mockRejectedValueOnce(mockError);

    render(<App />);

    // Wait for auth to be ready
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
    });

    // Fill out the form
    const emailInput = screen.getByPlaceholderText('you@example.com');
    const passwordInput = screen.getByPlaceholderText('••••••••');

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');

    // Submit form
    const submitBtn = screen.getByRole('button', { name: /Sign In/i });
    await user.click(submitBtn);

    // Assert error message is displayed
    await waitFor(() => {
      expect(screen.getByText('Authentication failed.')).toBeInTheDocument();
    });
  });
});
