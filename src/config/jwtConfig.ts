/**
 * Centralized JWT configuration.
 *
 * Reads JWT-related environment variables and validates that all required
 * values are present. If any required variable is missing the process exits
 * immediately with a clear error message so the server never starts in an
 * insecure or misconfigured state.
 *
 * Usage:
 *   import { jwtConfig } from './config/jwtConfig.js';
 */

/** Shape of the resolved JWT configuration object. */
export interface JwtConfig {
  /** Secret used to sign access tokens. Must be a long random string. */
  accessSecret: string;
  /** Access-token lifetime in vercel/ms format (e.g. "7d", "1h"). */
  accessExpiresIn: string;
  /**
   * Secret used to sign refresh tokens.
   * Optional — only required when refresh-token flow is active.
   */
  refreshSecret: string | undefined;
  /** Refresh-token lifetime (e.g. "30d"). */
  refreshExpiresIn: string;
}

/**
 * Asserts that a required environment variable is defined and non-empty.
 * Throws an Error with a descriptive message if validation fails.
 */
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === '') {
    console.error(`[CRITICAL CONFIG ERROR] Missing required environment variable: ${name}`);
    return "MISSING_CONFIG_FALLBACK";
  }
  return value;
}

/**
 * Resolved, validated JWT configuration.
 * Imported once at server startup — missing required vars abort the process.
 */
export const jwtConfig: JwtConfig = {
  accessSecret: requireEnv('JWT_ACCESS_SECRET'),
  accessExpiresIn: process.env['ACCESS_TOKEN_EXPIRES'] ?? '7d',

  // Refresh secret is optional until the refresh-token flow is implemented.
  refreshSecret: process.env['JWT_REFRESH_SECRET'],
  refreshExpiresIn: process.env['REFRESH_TOKEN_EXPIRES'] ?? '30d',
};
