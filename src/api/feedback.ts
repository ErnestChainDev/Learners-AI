import { storage } from "../utils/storage";

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

export type FeedbackType = "recommendation" | "chat" | "course" | "quiz" | "profile";

export type FeedbackIn = {
    type: FeedbackType;
    reference_id: number;
    rating: number;
    comment: string;
};

export type FeedbackOut = {
    id: number;
    user_id: number;
    type: FeedbackType;
    reference_id: number;
    rating: number;
    comment: string;
};

export type FeedbackStatsOut = {
    type: FeedbackType;
    count: number;
    avg_rating: number;
};

function getAuthHeaders(): HeadersInit {
    const token = storage.getToken();

    return {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
}

async function handleResponse<T>(res: Response): Promise<T> {
    const contentType = res.headers.get("content-type") || "";
    let data: unknown = null;

    if (contentType.includes("application/json")) {
        try {
        data = await res.json();
        } catch {
        data = null;
        }
    } else {
        try {
        data = await res.text();
        } catch {
        data = null;
        }
    }

    if (!res.ok) {
        if (typeof data === "object" && data !== null && "detail" in data) {
        const detail = (data as { detail?: unknown }).detail;
        if (typeof detail === "string" && detail.trim()) {
            throw new Error(detail);
        }
        }

        if (typeof data === "string" && data.trim()) {
        throw new Error(data);
        }

        throw new Error("Request failed");
    }

    return data as T;
}

export const feedbackApi = {
    async submit(payload: FeedbackIn): Promise<FeedbackOut> {
        const res = await fetch(`${API_BASE}/feedback/`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
        });

        return handleResponse<FeedbackOut>(res);
    },

    async getStats(): Promise<FeedbackStatsOut[]> {
        const res = await fetch(`${API_BASE}/feedback/stats`, {
        method: "GET",
        headers: getAuthHeaders(),
        });

        return handleResponse<FeedbackStatsOut[]>(res);
    },
};