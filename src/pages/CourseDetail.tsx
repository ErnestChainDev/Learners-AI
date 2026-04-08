import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import introProgramming from "../assets/intro-programming.webp";
import webDevelopment from "../assets/WebDevelopment.png";
import DBM from "../assets/DBM.png";
import DSA from "../assets/DSA.jpg";
import NB from "../assets/NB.png";
import EDTECH from "../assets/EDTECH.png";
import { storage } from "../utils/storage";
import type { JSX } from "react";

type LessonItem = {
  title: string;
  content: string;
};

type Course = {
  id: number;
  code: string;
  title: string;
  description: string;
  program: "BSCS" | "BSIT" | "BSIS" | "BTVTED";
  level: string;
  tags: string;
  lessons: LessonItem[];
};

type SaveProgressPayload = {
  course_id: number;
  lesson_index: number;
  lesson_title: string;
  status: "in_progress" | "completed";
};

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

const COURSE_IMAGES: Record<string, string> = {
  CS101: introProgramming,
  IT201: webDevelopment,
  IS202: DBM,
  CS301: DSA,
  IT305: NB,
  TVE101: EDTECH,
};

function getCourseImage(code: string): string {
  return COURSE_IMAGES[code] ?? introProgramming;
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

async function safeJson(res: Response): Promise<unknown> {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return text || null;
  }
}

function extractErrorMessage(data: unknown, fallback: string): string {
  if (typeof data === "string" && data.trim()) return data;
  if (isObject(data) && typeof data.detail === "string") return data.detail;
  if (isObject(data) && typeof data.message === "string") return data.message;
  return fallback;
}

export default function CourseDetail(): JSX.Element {
  const { id } = useParams();
  const navigate = useNavigate();

  const apiBase = useMemo(() => API_BASE, []);

  const [course, setCourse] = useState<Course | null>(null);
  const [lessonIndex, setLessonIndex] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [savingProgress, setSavingProgress] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const fetchCourse = useCallback(
    async (signal?: AbortSignal) => {
      if (!apiBase) {
        setError("Missing VITE_API_BASE_URL.");
        setLoading(false);
        return;
      }

      const token = storage.getToken();
      if (!token) {
        setError("You are not logged in.");
        setLoading(false);
        return;
      }

      if (!id) {
        setError("Missing course ID.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const res = await fetch(`${apiBase}/courses/${id}`, {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
          signal,
        });

        const data = await safeJson(res);

        if (!res.ok) {
          throw new Error(
            extractErrorMessage(data, `Failed to load course (${res.status})`)
          );
        }

        setCourse(data as Course);
      } catch (e: unknown) {
        if (signal?.aborted) return;
        setError(e instanceof Error ? e.message : "Failed to load course");
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [apiBase, id]
  );

  useEffect(() => {
    const ctrl = new AbortController();
    void fetchCourse(ctrl.signal);
    return () => ctrl.abort();
  }, [fetchCourse]);

  const activeLesson = course?.lessons?.[lessonIndex] ?? null;
  const isLastLesson =
    course !== null && lessonIndex >= course.lessons.length - 1;
  const courseImage = course ? getCourseImage(course.code) : introProgramming;

  const saveProgress = useCallback(
    async (payload: SaveProgressPayload) => {
      if (!apiBase) return;

      const token = storage.getToken();
      if (!token) return;

      try {
        setSavingProgress(true);

        await fetch(`${apiBase}/courses/progress`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
      } finally {
        setSavingProgress(false);
      }
    },
    [apiBase]
  );

  useEffect(() => {
    if (!course || !activeLesson) return;

    void saveProgress({
      course_id: course.id,
      lesson_index: lessonIndex,
      lesson_title: activeLesson.title,
      status: isLastLesson ? "completed" : "in_progress",
    });
  }, [course, activeLesson, lessonIndex, isLastLesson, saveProgress]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFFDF5]">
        <p className="text-sm font-medium">Loading course...</p>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-[#FFFDF5] p-6">
        <div className="mx-auto max-w-6xl">
          <button
            onClick={() => navigate("/courses")}
            className="mb-6 rounded-full border-2 border-black bg-white px-5 py-2 font-bold shadow-[4px_4px_0px_#1E293B] transition hover:-translate-x-0.5 hover:-translate-y-0.5"
          >
            ← Back
          </button>
          <p className="text-red-600">{error || "Course not found."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFDF5] px-6 py-12">
      <div className="mx-auto max-w-6xl">
        <button
          onClick={() => navigate("/courses")}
          className="mb-6 rounded-full border-2 border-black bg-[#8B5CF6] px-6 py-3 font-bold text-white shadow-[4px_4px_0px_#1E293B] transition hover:-translate-x-0.5 hover:-translate-y-0.5"
        >
          ← Back to Courses
        </button>

        <div className="grid gap-8 lg:grid-cols-[340px_1fr]">
          {/* Sidebar */}
          <aside className="rounded-3xl border-2 border-black bg-white p-6 shadow-[8px_8px_0px_#E2E8F0]">
            <img
              src={courseImage}
              alt={course.title}
              className="h-44 w-full rounded-2xl object-cover border-2 border-black"
            />

            <h1 className="mt-4 text-2xl font-extrabold">{course.title}</h1>

            <p className="mt-3 text-sm text-gray-600">
              {course.description}
            </p>

            <div className="mt-5 space-y-2">
              {course.lessons.map((lesson, index) => (
                <button
                  key={lesson.title}
                  onClick={() => setLessonIndex(index)}
                  className={`w-full rounded-2xl border-2 border-black px-4 py-3 text-left text-sm font-semibold transition ${
                    lessonIndex === index
                      ? "bg-[#8B5CF6] text-white"
                      : "bg-gray-100 hover:bg-yellow-200"
                  }`}
                >
                  {index + 1}. {lesson.title}
                </button>
              ))}
            </div>
          </aside>

          {/* Content */}
          <main className="rounded-3xl border-2 border-black bg-white p-8 shadow-[8px_8px_0px_#F472B6]">
            {activeLesson ? (
              <>
                <h2 className="text-3xl font-extrabold">
                  {activeLesson.title}
                </h2>

                <div className="mt-6 rounded-2xl border-2 border-black bg-gray-50 p-6">
                  <p className="whitespace-pre-line leading-8">
                    {activeLesson.content}
                  </p>
                </div>

                <div className="mt-8 flex gap-4">
                  <button
                    onClick={() =>
                      setLessonIndex((prev) => Math.max(prev - 1, 0))
                    }
                    className="rounded-full border-2 border-black px-5 py-3 font-bold shadow-[4px_4px_0px_#1E293B]"
                    disabled={lessonIndex === 0}
                  >
                    Previous
                  </button>

                  <button
                    onClick={() =>
                      !isLastLesson &&
                      setLessonIndex((prev) => prev + 1)
                    }
                    className="rounded-full bg-[#8B5CF6] px-5 py-3 font-bold text-white shadow-[4px_4px_0px_#1E293B]"
                    disabled={isLastLesson}
                  >
                    Next
                  </button>
                </div>

                {savingProgress && (
                  <p className="mt-4 text-xs text-gray-500">
                    Saving progress...
                  </p>
                )}
              </>
            ) : (
              <p>No lessons available.</p>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}