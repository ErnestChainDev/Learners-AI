import type { ProfileOut } from "../types/profile.types"; // or auth.types if that's where it is
import { storage } from "../utils/storage";

const BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

export type FetchError = { status: number; message: string };

async function safeJson(res: Response): Promise<unknown> {
    const text = await res.text();
    try {
        return text ? JSON.parse(text) : null;
    } catch {
        return text || null;
    }
}

function toError(status: number, data: unknown): FetchError {
    let msg = "Request failed";

    if (typeof data === "string" && data) msg = data;
    else if (data && typeof data === "object") {
        if ("detail" in data) {
        const detail = (data as { detail?: unknown }).detail;
        if (typeof detail === "string" && detail.trim()) msg = detail;
        }
        if (msg === "Request failed" && "message" in data) {
        const message = (data as { message?: unknown }).message;
        if (typeof message === "string" && message.trim()) msg = message;
        }
    }

    return { status, message: msg };
    }

async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
        headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
        ...init,
    });

    const data = await safeJson(res);
    if (!res.ok) {
        console.error("❌ API STATUS:", res.status);
        console.error("❌ API DATA:", data);

        throw toError(res.status, data);
    }
    return data as T;
}

export const profileApi = {
    async me(token?: string): Promise<ProfileOut> {
        const t = token ?? storage.getToken();
        if (!t) throw new Error("Missing access token");

        return request<ProfileOut>("/profile/me", {
        method: "GET",
        headers: {
            Authorization: `Bearer ${t}`,
        },
        });
    },

    async saveFillUp(data: {
        name: string;
        strand: string;
        program: string;
        goals: string;
        skills: string[];
        interests: string[];
        }): Promise<ProfileOut> {
        const token = storage.getToken();
        if (!token) throw new Error("Missing access token");

        return request<ProfileOut>("/profile/me", {
            method: "PUT",
            headers: {
            Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
            full_name: data.name.trim(),              // ✅ FIXED
            strand: data.strand,
            preferred_program: data.program,   // ✅ FIXED
            career_goals: data.goals,          // ✅ FIXED
            skills: data.skills.length ? data.skills.join(", ") : "",
            interests: data.interests.length ? data.interests.join(", ") : "",
            }),
        });
    }
};