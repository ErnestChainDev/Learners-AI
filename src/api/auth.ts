import type { AuthWithProfileOut, LoginIn, RegisterIn, VerifyOut } from "../types/auth.types";

export type ForgotPasswordIn = {email: string;};

export type ResetPasswordIn = {
    email: string;
    token: string;
    new_password: string;
};

export type GenericMsgOut = {detail: string;};


const BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

export type FetchError = { status: number; message: string };

async function safeJson(res: Response) {
    const text = await res.text();
    try {
        return text ? JSON.parse(text) : null;
    } catch {
        return text || null;
    }
}

function toError(status: number, data: unknown): FetchError {
    let msg = "Request failed";

    if (typeof data === "string" && data) {
        msg = data;
    } else if (data && typeof data === "object") {
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
    if (!res.ok) throw toError(res.status, data);
    return data as T;
}

export const authApi = {
    register(payload: RegisterIn) {
        return request<AuthWithProfileOut>("/auth/register", {
        method: "POST",
        body: JSON.stringify(payload),
        });
    },

    login(payload: LoginIn) {
        return request<AuthWithProfileOut>("/auth/login", {
        method: "POST",
        body: JSON.stringify(payload),
        });
    },

    verify(token: string) {
        return request<VerifyOut>("/auth/verify", {
        method: "POST",
        body: JSON.stringify({ token }),
        });
    },

    googleLogin(returnTo: string = "/home") {
        const url = `${BASE_URL}/auth/google/login?return_to=${encodeURIComponent(returnTo)}`;
        window.location.assign(url);
    },

    forgotPassword(payload: ForgotPasswordIn) {
        return request<GenericMsgOut>("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify(payload),
        });
    },

    resetPassword(payload: ResetPasswordIn) {
        return request<GenericMsgOut>("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify(payload),
        });
    },
};