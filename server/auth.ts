import type { Request, Response, NextFunction } from "express";
import { getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import fs from "fs";
import path from "path";

// Load Firebase configuration for projectId
let projectId = process.env.VITE_FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT;
try {
  const configPath = path.resolve(process.cwd(), "firebase-applet-config.json");
  if (fs.existsSync(configPath)) {
    const raw = fs.readFileSync(configPath, "utf-8");
    const parsed = JSON.parse(raw);
    if (parsed.projectId) {
      projectId = parsed.projectId;
    }
  }
} catch (e) {
  console.warn("[Auth] Notice reading firebase-applet-config.json:", e);
}

if (!getApps().length) {
  try {
    initializeApp({
      projectId: projectId || "gen-lang-client-0445458275",
    });
  } catch (err) {
    console.warn("[Auth] Firebase Admin initialization notice:", err);
  }
}

export interface AuthenticatedUser {
  uid: string;
  email?: string;
  authTime?: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

// Token verifier interface to allow testing without external network dependencies
export type TokenVerifier = (token: string) => Promise<{
  uid: string;
  email?: string;
  firebase?: { sign_in_provider?: string };
  isAnonymous?: boolean;
}>;

let customTokenVerifier: TokenVerifier | null = null;

export function setCustomTokenVerifierForTesting(verifier: TokenVerifier | null) {
  customTokenVerifier = verifier;
}

/**
 * Authentication middleware that verifies Firebase ID tokens.
 * Strictly rejects missing, expired, invalid, and anonymous/guest credentials.
 */
export async function authenticateUser(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "Authentication required. Missing Bearer token in Authorization header.",
      code: "UNAUTHENTICATED"
    });
  }

  const token = authHeader.substring(7).trim();
  if (!token) {
    return res.status(401).json({
      error: "Authentication required. Empty token provided.",
      code: "UNAUTHENTICATED"
    });
  }

  try {
    const decodedToken = customTokenVerifier
      ? await customTokenVerifier(token)
      : await getAuth().verifyIdToken(token);

    // Reject anonymous/guest credentials on all protected AI routes
    const isAnonymous =
      decodedToken.firebase?.sign_in_provider === "anonymous" ||
      Boolean((decodedToken as any).isAnonymous);

    if (isAnonymous) {
      return res.status(403).json({
        error: "Anonymous and guest accounts are not permitted on protected AI endpoints. Please sign in with a verified account.",
        code: "ANONYMOUS_NOT_ALLOWED"
      });
    }

    if (!decodedToken.uid || typeof decodedToken.uid !== "string") {
      return res.status(401).json({
        error: "Invalid authentication credentials: missing canonical user ID.",
        code: "INVALID_CREDENTIALS"
      });
    }

    // Attach verified user to request
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
    };

    next();
  } catch (err: any) {
    // Return sanitized errors without leaking tokens, credentials, or internal stack traces
    return res.status(401).json({
      error: "Invalid, expired, or revoked authentication token.",
      code: "TOKEN_VERIFICATION_FAILED"
    });
  }
}
