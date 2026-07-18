/**
 * Auth Service
 *
 * Handles all user authentication business logic:
 *   - registerUser()   — create account, hash password, issue token
 *   - loginUser()      — verify credentials, update lastLogin, issue token
 *   - getUserByEmail() — internal lookup used by future middleware/OAuth
 *   - getUserById()    — internal lookup by Mongoose ObjectId
 *
 * Rules enforced here:
 *   - Passwords are ALWAYS hashed with bcrypt before storage.
 *   - Password hashes are NEVER returned to callers.
 *   - All functions return ServiceResult<T> — never throw to the caller.
 */
import bcrypt from "bcrypt";
import { OAuth2Client } from "google-auth-library";
import User from "../models/User.js";
import { generateAccessToken } from "../utils/jwtUtils.js";
// ─── Constants ───────────────────────────────────────────────────────────────
/** bcrypt work factor — high enough to be secure, low enough to be fast. */
const SALT_ROUNDS = 12;
const oauth2Client = new OAuth2Client();
// ─── Helpers ─────────────────────────────────────────────────────────────────
/**
 * Strips the password hash and converts the Mongoose document to a plain
 * SafeUser object suitable for inclusion in any API response.
 */
function toSafeUser(user) {
    return {
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        avatar: user.avatar ?? null,
        provider: user.provider,
        role: user.role,
        isVerified: user.isVerified,
        isActive: user.isActive,
        lastLogin: user.lastLogin ?? null,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
    };
}
// ─── Service Functions ────────────────────────────────────────────────────────
/**
 * Register a new local user.
 *
 * Steps:
 *  1. Check for duplicate email.
 *  2. Hash the plain-text password with bcrypt.
 *  3. Persist the new user.
 *  4. Issue an access token.
 *  5. Return safe user + token (no password hash).
 *
 * @param input - Validated register payload (name, email, password).
 * @returns ServiceResult with user + token on success, or an error descriptor.
 */
export async function registerUser(input) {
    try {
        // 1. Duplicate check
        const existing = await User.findOne({ email: input.email }).lean();
        if (existing) {
            return {
                success: false,
                error: "An account with this email already exists.",
                statusCode: 409,
            };
        }
        // 2. Hash password
        const hashedPassword = await bcrypt.hash(input.password, SALT_ROUNDS);
        // 3. Persist
        const user = await User.create({
            name: input.name,
            email: input.email,
            password: hashedPassword,
            provider: "local",
        });
        // 4. Issue token
        const accessToken = generateAccessToken({
            sub: user._id.toString(),
            email: user.email,
            provider: "local",
        });
        // 5. Return — never expose the hash
        return {
            success: true,
            data: {
                user: toSafeUser(user),
                accessToken,
            },
        };
    }
    catch (err) {
        console.error("[AuthService] registerUser error:", err);
        return {
            success: false,
            error: "Registration failed. Please try again later.",
            statusCode: 500,
        };
    }
}
/**
 * Authenticate a local user with email + password.
 *
 * Steps:
 *  1. Find user by email — explicitly select the password field (it's hidden by default).
 *  2. Verify the user is active.
 *  3. Compare the supplied password against the bcrypt hash.
 *  4. Update lastLogin timestamp.
 *  5. Issue an access token.
 *  6. Return safe user + token (no password hash).
 *
 * Deliberately vague error messages for email/password failures to prevent
 * user-enumeration attacks.
 *
 * @param input - Validated login payload (email, password).
 * @returns ServiceResult with user + token on success, or an error descriptor.
 */
export async function loginUser(input) {
    try {
        // 1. Find user — must explicitly select password because field has `select: false`
        const user = await User.findOne({ email: input.email }).select("+password");
        // Vague message intentional — prevents user enumeration
        if (!user) {
            return {
                success: false,
                error: "Invalid email or password.",
                statusCode: 401,
            };
        }
        // 2. Account active check
        if (!user.isActive) {
            return {
                success: false,
                error: "Your account has been deactivated. Please contact support.",
                statusCode: 403,
            };
        }
        // 3. Password comparison
        if (!user.password) {
            // OAuth-only account — no local password set
            return {
                success: false,
                error: "This account uses a different login method.",
                statusCode: 401,
            };
        }
        const passwordMatch = await bcrypt.compare(input.password, user.password);
        if (!passwordMatch) {
            return {
                success: false,
                error: "Invalid email or password.",
                statusCode: 401,
            };
        }
        // 4. Update lastLogin (non-blocking — don't fail login if this errors)
        user.lastLogin = new Date();
        await user.save().catch((err) => console.warn("[AuthService] Failed to update lastLogin:", err));
        // 5. Issue token
        const accessToken = generateAccessToken({
            sub: user._id.toString(),
            email: user.email,
            provider: user.provider,
        });
        // 6. Return — never expose the hash
        return {
            success: true,
            data: {
                user: toSafeUser(user),
                accessToken,
            },
        };
    }
    catch (err) {
        console.error("[AuthService] loginUser error:", err);
        return {
            success: false,
            error: "Login failed. Please try again later.",
            statusCode: 500,
        };
    }
}
/**
 * Look up a user by email address.
 *
 * Used internally by future auth middleware and OAuth handlers.
 * Password hash is NOT selected — use `.select("+password")` at call-site
 * if you need to compare credentials.
 *
 * @param email - Email to search for (case-insensitive via schema lowercase).
 * @returns The Mongoose document, or null if not found.
 */
export async function getUserByEmail(email) {
    return User.findOne({ email: email.toLowerCase().trim() });
}
/**
 * Look up a user by their MongoDB ObjectId.
 *
 * Used internally by auth middleware to hydrate `req.user` from a token's
 * `sub` claim.
 *
 * @param id - MongoDB ObjectId string.
 * @returns The Mongoose document, or null if not found.
 */
export async function getUserById(id) {
    return User.findById(id);
}
/**
 * Authenticate or register a user using a Google ID token.
 *
 * Steps:
 *  1. Verify the ID token signature and audience with Google's library.
 *  2. Extract name, email, and avatar from the ticket payload.
 *  3. Search for an existing user by email:
 *     - If found: update lastLogin timestamp and save.
 *     - If not found: create a new user with provider = "google" and no password.
 *  4. Issue an access token.
 *  5. Return safe user + token (no password hash).
 *
 * @param idToken - The Google ID Token string sent from frontend.
 * @returns ServiceResult with user + token on success, or an error descriptor.
 */
export async function loginOrRegisterGoogle(idToken) {
    try {
        const clientId = process.env.GOOGLE_CLIENT_ID;
        if (!clientId) {
            console.error("[AuthService] GOOGLE_CLIENT_ID is not configured in .env");
            return {
                success: false,
                error: "Google Authentication is not configured on this server.",
                statusCode: 500,
            };
        }
        // Verify Google ID Token
        let ticket;
        try {
            ticket = await oauth2Client.verifyIdToken({
                idToken,
                audience: clientId,
            });
        }
        catch (err) {
            console.error("[AuthService] Google token verification failed:", err);
            return {
                success: false,
                error: "Invalid or expired Google token.",
                statusCode: 401,
            };
        }
        const payload = ticket.getPayload();
        if (!payload || !payload.email) {
            return {
                success: false,
                error: "Google token did not contain email information.",
                statusCode: 400,
            };
        }
        const email = payload.email.toLowerCase().trim();
        const name = payload.name || payload.given_name || "Google User";
        const avatar = payload.picture || null;
        // Check if user exists
        let user = await User.findOne({ email });
        if (user) {
            // Existing user logging in - update lastLogin
            user.lastLogin = new Date();
            if (avatar && !user.avatar) {
                user.avatar = avatar;
            }
            await user.save();
        }
        else {
            // New user registering - create new account with provider = "google"
            // Password is left undefined/empty
            user = await User.create({
                name,
                email,
                avatar,
                provider: "google",
                isVerified: payload.email_verified || false,
            });
        }
        // Generate JWT access token
        const accessToken = generateAccessToken({
            sub: user._id.toString(),
            email: user.email,
            provider: "google",
        });
        return {
            success: true,
            data: {
                user: toSafeUser(user),
                accessToken,
            },
        };
    }
    catch (err) {
        console.error("[AuthService] loginOrRegisterGoogle error:", err);
        return {
            success: false,
            error: "Google authentication failed. Please try again later.",
            statusCode: 500,
        };
    }
}
/**
 * Update the user's name and/or avatar in MongoDB.
 */
export async function updateUserProfile(userId, data) {
    try {
        const user = await User.findById(userId);
        if (!user) {
            return {
                success: false,
                error: "User not found.",
                statusCode: 404,
            };
        }
        if (data.name !== undefined) {
            user.name = data.name;
        }
        if (data.avatar !== undefined) {
            user.avatar = data.avatar;
        }
        await user.save();
        return {
            success: true,
            data: toSafeUser(user),
        };
    }
    catch (err) {
        console.error("[AuthService] updateUserProfile error:", err);
        return {
            success: false,
            error: "Failed to update profile settings.",
            statusCode: 500,
        };
    }
}
