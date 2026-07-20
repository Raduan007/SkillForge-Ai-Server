/**
 * JWT utility helpers.
 *
 * Provides type-safe wrappers around jsonwebtoken for generating and
 * verifying access tokens. All cryptographic configuration is sourced
 * from jwtConfig — no secrets are hardcoded here.
 *
 * Designed to be forward-compatible with Google OAuth: the TokenPayload
 * interface accepts optional OAuth-specific fields so the same tokens can
 * carry Google profile data in a future integration without breaking changes.
 */

import jwt from 'jsonwebtoken';
import { jwtConfig } from '../config/jwtConfig.js';

// ─── Types ───────────────────────────────────────────────────────────────────

/**
 * The data embedded inside an access token.
 *
 * Keep this minimal — only include what downstream middleware actually needs.
 * Optional fields are reserved for future Google OAuth integration.
 */
export interface TokenPayload {
  /** Internal user ID (MongoDB ObjectId string or equivalent). */
  sub: string;
  /** User's email address. */
  email: string;
  /** Human-readable display name. */
  name?: string;
  /**
   * OAuth provider identifier — set to "google" for Google OAuth users.
   * Omit for email/password users.
   */
  provider?: 'google' | 'local';
  /**
   * Google profile picture URL.
   * Only populated when provider === "google".
   */
  picture?: string;
  /** User's system role. */
  role?: "user" | "admin";
}

/**
 * The full decoded token including standard JWT registered claims
 * (iat, exp, etc.) merged with our custom payload.
 */
export type DecodedToken = TokenPayload & jwt.JwtPayload;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Signs a new access token with the given payload.
 *
 * @param payload - Data to embed in the token (must include `sub` and `email`).
 * @returns Signed JWT string.
 *
 * @example
 * const token = generateAccessToken({ sub: user._id.toString(), email: user.email });
 */
export function generateAccessToken(payload: TokenPayload): string {
  const { sub, ...rest } = payload;

  return jwt.sign(rest, jwtConfig.accessSecret, {
    subject: sub,
    expiresIn: jwtConfig.accessExpiresIn as jwt.SignOptions['expiresIn'],
    algorithm: 'HS256',
  });
}

/**
 * Verifies a JWT access token and returns the decoded payload.
 *
 * Throws a `JsonWebTokenError` if the token is invalid, and a
 * `TokenExpiredError` if it has expired — both are subclasses of `Error`
 * from the `jsonwebtoken` package and can be caught individually.
 *
 * @param token - Raw JWT string (typically from the Authorization header).
 * @returns The decoded payload including all registered and custom claims.
 *
 * @throws {jwt.JsonWebTokenError} Token is malformed or signature is invalid.
 * @throws {jwt.TokenExpiredError} Token has expired.
 *
 * @example
 * try {
 *   const decoded = verifyAccessToken(token);
 *   console.log(decoded.sub); // user ID
 * } catch (err) {
 *   if (err instanceof jwt.TokenExpiredError) { ... }
 * }
 */
export function verifyAccessToken(token: string): DecodedToken {
  const decoded = jwt.verify(token, jwtConfig.accessSecret, {
    algorithms: ['HS256'],
  });

  if (typeof decoded === 'string') {
    throw new jwt.JsonWebTokenError('Unexpected string payload from jwt.verify');
  }

  return decoded as DecodedToken;
}
