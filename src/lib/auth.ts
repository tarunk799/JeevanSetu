import * as admin from "firebase-admin";
import { NextRequest } from "next/server";
import { logger } from "@/lib/logger";

/** Initialize Firebase Admin SDK using Application Default Credentials (ADC).
 *  On Cloud Run this is auto-detected; locally you can set
 *  GOOGLE_APPLICATION_CREDENTIALS to a service-account key file. */
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

interface AuthResult {
  authenticated: boolean;
  uid: string | null;
}

/**
 * Verify the Firebase ID token from the `Authorization: Bearer <token>` header.
 *
 * - Returns `{ authenticated: true, uid }` when the token is valid.
 * - Returns `{ authenticated: false, uid: null }` when the token is missing,
 *   malformed, expired, or otherwise invalid.
 * - **Never throws** — all errors are caught and logged internally.
 *
 * Use this for routes that *should* be protected. The caller decides whether
 * to block or merely warn when `authenticated` is `false`.
 */
export async function verifyAuth(request: NextRequest): Promise<AuthResult> {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      logger.warn("Auth: missing or malformed Authorization header");
      return { authenticated: false, uid: null };
    }

    const token = authHeader.split("Bearer ")[1];
    if (!token) {
      logger.warn("Auth: empty bearer token");
      return { authenticated: false, uid: null };
    }

    const decoded = await admin.auth().verifyIdToken(token);
    return { authenticated: true, uid: decoded.uid };
  } catch (error) {
    logger.warn("Auth: token verification failed", {
      error: error instanceof Error ? error.message : "Unknown",
    });
    return { authenticated: false, uid: null };
  }
}

/**
 * Optionally verify the Firebase ID token — identical to {@link verifyAuth}
 * but intended for endpoints that work with **or** without authentication.
 *
 * - If a valid token is present, returns `{ authenticated: true, uid }`.
 * - If no token is present or verification fails, returns
 *   `{ authenticated: false, uid: null }` **silently** (no warning log).
 * - **Never throws.**
 */
export async function optionalAuth(request: NextRequest): Promise<AuthResult> {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return { authenticated: false, uid: null };
    }

    const token = authHeader.split("Bearer ")[1];
    if (!token) {
      return { authenticated: false, uid: null };
    }

    const decoded = await admin.auth().verifyIdToken(token);
    return { authenticated: true, uid: decoded.uid };
  } catch {
    return { authenticated: false, uid: null };
  }
}
