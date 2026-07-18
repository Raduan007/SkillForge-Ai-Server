/**
 * Centralized API response helpers.
 *
 * Keeps every controller thin and guarantees that every endpoint emits the
 * same response envelope:
 *
 *   Success  → { success: true,  data: T }
 *   Error    → { success: false, error: string, details?: unknown }
 *
 * Usage:
 *   res.status(200).json(ok(result.data));
 *   res.status(400).json(fail("Validation failed", issues));
 */

import type { Response } from "express";

// ─── Envelope Types ───────────────────────────────────────────────────────────

export interface SuccessEnvelope<T> {
  success: true;
  data: T;
}

export interface ErrorEnvelope {
  success: false;
  error: string;
  details?: unknown;
}

export type ApiEnvelope<T> = SuccessEnvelope<T> | ErrorEnvelope;

// ─── Factory Helpers ─────────────────────────────────────────────────────────

/** Build a success envelope (no HTTP side-effects). */
export function ok<T>(data: T): SuccessEnvelope<T> {
  return { success: true, data };
}

/** Build an error envelope (no HTTP side-effects). */
export function fail(message: string, details?: unknown): ErrorEnvelope {
  const envelope: ErrorEnvelope = { success: false, error: message };
  if (details !== undefined) envelope.details = details;
  return envelope;
}

// ─── Response Senders ────────────────────────────────────────────────────────

/**
 * Send a standardized success JSON response.
 *
 * @param res    - Express response object.
 * @param status - HTTP status code (default: 200).
 * @param data   - Payload to embed in the `data` field.
 */
export function sendOk<T>(res: Response, status: number, data: T): void {
  res.status(status).json(ok(data));
}

/**
 * Send a standardized error JSON response.
 *
 * @param res     - Express response object.
 * @param status  - HTTP status code.
 * @param message - Human-readable error description.
 * @param details - Optional additional information (e.g., Zod issues array).
 */
export function sendFail(
  res: Response,
  status: number,
  message: string,
  details?: unknown
): void {
  res.status(status).json(fail(message, details));
}
