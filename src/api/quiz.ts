// src/api/quiz.ts
import { storage } from "../utils/storage";
import type {
  AttemptProgressOut,
  AttemptStartOut,
  SaveAnswerIn,
  SubmitQuizOut,
  QuestionOut,
} from "../types/quiz.types";

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

function getUid(): number | null {
  const u = storage.getUser();
  return u ? u.id : null;
}

async function safeJson(res: Response): Promise<unknown> {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return { _raw: text };
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const token = storage.getToken();
  const uid = getUid();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (uid != null) headers["X-User-ID"] = String(uid);

  const res = await fetch(`${API_BASE}/quiz${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await safeJson(res);

  if (!res.ok) {
    const d = data as { detail?: string; message?: string; _raw?: string } | null;
    throw new Error(d?.detail || d?.message || d?._raw || `Request failed (${res.status})`);
  }

  return data as T;
}

export const quizApi = {
  startAttempt(limit = 40) {
    return request<AttemptStartOut>("POST", `/attempts/start?limit=${limit}`);
  },

  getAttemptQuestions(attemptId: number) {
    return request<QuestionOut[]>("GET", `/attempts/${attemptId}/questions`);
  },

  getAttemptProgress(attemptId: number) {
    return request<AttemptProgressOut>("GET", `/attempts/${attemptId}/progress`);
  },

  saveAnswer(attemptId: number, payload: SaveAnswerIn) {
    return request("PUT", `/attempts/${attemptId}/answers`, payload);
  },

  submitAttempt(attemptId: number, answers: SaveAnswerIn[]) {
    return request<SubmitQuizOut>("POST", `/attempts/${attemptId}/submit`, { answers });
  },

  cancelAttempt(attemptId: number) {
    return request<{ attempt_id: number; status: "cancelled"; message: string }>(
      "POST",
      `/attempts/${attemptId}/cancel`
    );
  },
};