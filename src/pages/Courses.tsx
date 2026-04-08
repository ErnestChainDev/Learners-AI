import { useEffect, useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import introProgramming from "../assets/intro-programming.webp";
import webDevelopment from "../assets/webDevelopment.png";
import DBM from "../assets/DBM.png";
import DSA from "../assets/DSA.jpg";
import NB from "../assets/NB.png";
import EDTECH from "../assets/EDTECH.png";
import { storage } from "../utils/storage";

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

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

const COURSE_IMAGES: Record<string, string> = {
  CS101: introProgramming,
  IT201: webDevelopment,
  IS202: DBM,
  CS301: DSA,
  IT305: NB,
  TVE101: EDTECH,
};

function parseTags(tags: string): string[] {
  return tags
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function getCourseImage(code: string) {
  return COURSE_IMAGES[code] || introProgramming;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

async function safeJson(res: Response): Promise<unknown> {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return text || null;
  }
}

function getStringField(obj: Record<string, unknown>, key: string): string | undefined {
  const value = obj[key];
  return typeof value === "string" ? value : undefined;
}

function extractErrorMessage(data: unknown, fallback: string) {
  if (typeof data === "string" && data.trim()) return data;

  if (isObject(data)) {
    const obj = data as Record<string, unknown>;
    return getStringField(obj, "detail") ||
           getStringField(obj, "message") ||
           fallback;
  }

  return fallback;
}

function matchesQuery(course: Course, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  const searchable = [
    course.code,
    course.title,
    course.description,
    course.program,
    course.level,
    course.tags,
    ...course.lessons.map((l) => l.title),
  ]
    .join(" ")
    .toLowerCase();

  return searchable.includes(q);
}

export default function Courses() {
  const navigate = useNavigate();
  const apiBase = useMemo(() => API_BASE, []);
  const [searchParams, setSearchParams] = useSearchParams();

  const initialSearch = searchParams.get("search") || "";

  const [courses, setCourses] = useState<Course[]>([]);
  const [search, setSearch] = useState(initialSearch);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setSearch(searchParams.get("search") || "");
  }, [searchParams]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadCourses() {
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

      try {
        setLoading(true);
        setError("");

        const res = await fetch(`${apiBase}/courses/`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        });

        const data = await safeJson(res);

        if (!res.ok) {
          throw new Error(
            extractErrorMessage(data, `Failed to load courses (${res.status})`)
          );
        }

        setCourses(Array.isArray(data) ? (data as Course[]) : []);
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Failed to load courses");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void loadCourses();

    return () => controller.abort();
  }, [apiBase]);

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => matchesQuery(course, search));
  }, [courses, search]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    const next = value.trim();
    if (next) setSearchParams({ search: next });
    else setSearchParams({});
  };

  if (loading) {
    return <div className="p-10 text-center font-semibold">Loading courses...</div>;
  }

  if (error) {
    return <div className="p-10 text-center text-red-500">{error}</div>;
  }

  return (
    <>
      <style>
        {`
          .qpg-deco {
            position: absolute;
            z-index: 0;
            pointer-events: none;
          }

          .qpg-deco--circle {
            border-radius: 9999px;
          }

          .qpg-deco--triangle {
            width: 0;
            height: 0;
            border-left: 40px solid transparent;
            border-right: 40px solid transparent;
            border-bottom: 70px solid #8B5CF6;
          }

          .qpg-deco--dots {
            width: 160px;
            height: 160px;
            background-image: radial-gradient(#1E293B 2px, transparent 2px);
            background-size: 14px 14px;
            opacity: 0.35;

            position: absolute;
            bottom: 40px;
            left: 40px;

            z-index: 0;
          }

          .qpg-deco--yellow {
            width: 140px;
            height: 140px;
            background: #FBBF24;
            top: 80px;
            left: -40px;
          }

          .qpg-deco--pink {
            width: 120px;
            height: 120px;
            background: #F472B6;
            bottom: 60px;
            right: -30px;
          }

          .qpg-deco--violet {
            top: 200px;
            right: 20%;
          }

          .qpg-deco--dots-pos {
            bottom: 120px;
            left: 20%;
          }
        `}
      </style>
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden px-6 py-6"
        style={{
          backgroundColor: "#FFFDF5",
          backgroundImage:
            "radial-gradient(rgba(100,116,139,0.15) 1.5px, transparent 1.5px)",
          backgroundSize: "18px 18px",
        }}>
      {/* Background decorations */}
      <span className="qpg-deco qpg-deco--circle qpg-deco--yellow" />
      <span className="qpg-deco qpg-deco--circle qpg-deco--pink" />
      <span className="qpg-deco qpg-deco--triangle qpg-deco--violet" />
      <div className="relative z-10 mx-auto max-w-6xl">

        {/* HEADER */}
        <div className="flex flex-col gap-6 lg:flex-row lg:justify-between">
          <div>
            <h1 className="text-4xl font-extrabold text-[#1E293B]">
              Courses <span className="text-[#8B5CF6]">.</span>
            </h1>
            <p className="mt-2 text-[#64748B]">
              Explore and learn in a fun, structured way 🚀
            </p>
          </div>

          {/* SEARCH */}
          <div className="w-full max-w-md">
            <div className="flex items-center gap-2 rounded-full border-2 border-[#1E293B] bg-white px-4 py-2 shadow-[4px_4px_0px_#1E293B]">
              <Search className="w-5 h-5" />
              <input
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search courses..."
                className="w-full outline-none"
              />
              {search && (
                <button onClick={() => handleSearchChange("")}>
                  <X />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* GRID */}
        <div className="mt-10 grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
          {filteredCourses.map((course, index) => {
            const image = getCourseImage(course.code);
            const tags = parseTags(course.tags);

            const colors = ["#8B5CF6", "#F472B6", "#FBBF24", "#34D399"];
            const accent = colors[index % colors.length];

            return (
              <div
                key={course.id}
                className="rounded-2xl border-2 border-[#1E293B] bg-white p-4 transition hover:-translate-y-2 hover:-rotate-1 hover:scale-[1.02] shadow-[4px_4px_0px_#1E293B]"
              >
                <img
                  src={image}
                  className="h-48 w-full rounded-xl object-cover border-2"
                />

                <div className="mt-4">
                  <p className="text-xs font-bold" style={{ color: accent }}>
                    {course.code}
                  </p>

                  <h2 className="text-lg font-extrabold">
                    {course.title}
                  </h2>

                  <p className="mt-2 text-sm text-[#64748B]">
                    {course.description}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => handleSearchChange(tag)}
                        className="rounded-full border-2 border-[#1E293B] bg-[#F1F5F9] px-3 py-1 text-xs hover:bg-[#FBBF24]"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => navigate(`/courses/${course.id}`)}
                    className="mt-5 w-full rounded-full border-2 border-[#1E293B] bg-[#8B5CF6] py-3 font-bold text-white shadow-[4px_4px_0px_#1E293B] hover:-translate-y-1 hover:shadow-[6px_6px_0px_#1E293B]"
                  >
                    Study Now →
                  </button>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
    </> 
  );
}