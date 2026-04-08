import type { ProfileOut } from "../types/profile.types";
import type { UserOut } from "../types/auth.types";


const TOKEN_KEY = "lp_token";
const USER_KEY = "lp_user";
const PROFILE_KEY = "lp_profile";

function safeParse<T>(raw: string | null): T | null {
    if (!raw) return null;
    try {
        return JSON.parse(raw) as T;
    } catch {
        return null;
    }
}

export const storage = {
    // ----------------
    // Token
    // ----------------
    setToken(token: string) {
        localStorage.setItem(TOKEN_KEY, token);
    },
    getToken(): string | null {
        return localStorage.getItem(TOKEN_KEY);
    },
    clearToken() {
        localStorage.removeItem(TOKEN_KEY);
    },

    // ----------------
    // User
    // ----------------
    setUser(user: UserOut) {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
    },
    getUser(): UserOut | null {
        return safeParse<UserOut>(localStorage.getItem(USER_KEY));
    },
    clearUser() {
        localStorage.removeItem(USER_KEY);
    },

    // ----------------
    // Profile
    // ----------------
    setProfile(profile: ProfileOut) {
        localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    },
    getProfile(): ProfileOut | null {
        return safeParse<ProfileOut>(localStorage.getItem(PROFILE_KEY));
    },
    clearProfile() {
        localStorage.removeItem(PROFILE_KEY);
    },

    // ----------------
    // Convenience
    // ----------------
    isLoggedIn(): boolean {
        return Boolean(this.getToken());
    },

    clearAll() {
        this.clearToken();
        this.clearUser();
        this.clearProfile();
    },
};
