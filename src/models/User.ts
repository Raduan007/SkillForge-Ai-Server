/**
 * User Mongoose Model
 *
 * Represents a registered user in SkillForge AI.
 * Supports both local (email/password) and OAuth (Google) authentication.
 * Passwords are NEVER stored in plain-text — always bcrypt-hashed.
 */

import mongoose, { Schema, Document } from "mongoose";

// ─── Interface ───────────────────────────────────────────────────────────────

export interface IUser extends Document {
  /** Display name */
  name: string;
  /** Unique email address */
  email: string;
  /**
   * Bcrypt-hashed password.
   * Undefined for OAuth-only users (provider === "google").
   * NEVER include this field in API responses.
   */
  password?: string;
  /** URL to the user's profile picture */
  avatar?: string;
  /** Authentication provider */
  provider: "local" | "google";
  /** Application role */
  role: "user" | "admin";
  /** True once the user has verified their email address */
  isVerified: boolean;
  /** False when the account is suspended or deleted */
  isActive: boolean;
  /** Timestamp of the user's most recent successful login */
  lastLogin?: Date;
  /** Injected by Mongoose `timestamps: true` */
  createdAt: Date;
  updatedAt: Date;
}

// ─── Schema ──────────────────────────────────────────────────────────────────

const UserSchema: Schema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    password: {
      type: String,
      // Not required — OAuth users won't have one
      select: false, // NEVER returned in queries unless explicitly asked
    },

    avatar: {
      type: String,
      default: null,
    },

    provider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
      index: true,
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
      index: true,
    },

    isVerified: {
      type: Boolean,
      default: false,
      index: true,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    lastLogin: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true, // injects createdAt + updatedAt automatically
  }
);

// ─── Indexes ─────────────────────────────────────────────────────────────────

// Compound index for auth lookups: find active users by email quickly
UserSchema.index({ email: 1, isActive: 1 });

// ─── Export ──────────────────────────────────────────────────────────────────

export default mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
