import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  Search,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { storage } from "../utils/storage";

import introProgramming from "../assets/intro-programming.webp";
import webDevelopment from "../assets/webDevelopment.png";
import DBM from "../assets/DBM.png";
import DSA from "../assets/DSA.jpg";
import NB from "../assets/NB.png";
import EDTECH from "../assets/EDTECH.png";
import DashboardRightWidgets from "../components/dashboard/DashboardRightWidgets";

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

type SavedProfile = {
  full_name?: string;
};

type NotificationTab = "alerts" | "events" | "logs";

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

const COURSE_IMAGES: Record<string, string> = {
  CS101: introProgramming,
  IT201: webDevelopment,
  IS202: DBM,
  CS301: DSA,
  IT305: NB,
  TVE101: EDTECH,
};

function getCourseImage(code: string) {
  return COURSE_IMAGES[code] || introProgramming;
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

function extractErrorMessage(data: unknown, fallback: string) {
  if (typeof data === "string" && data.trim()) return data;
  if (isObject(data) && typeof data.detail === "string") return data.detail;
  if (isObject(data) && typeof data.message === "string") return data.message;
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
    ...course.lessons.map((lesson) => lesson.title),
  ]
    .join(" ")
    .toLowerCase();

  return searchable.includes(q);
}

function initials(name?: string) {
  const n = (name ?? "").trim();
  if (!n) return "U";
  const parts = n.split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] ?? "U";
  const b = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";
  return (a + b).toUpperCase();
}

function marqueeCourses<T>(items: T[]): T[] {
  if (!items.length) return [];
  return [...items, ...items];
}

export default function Dashboard() {
  const navigate = useNavigate();

  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [showSearchPanel, setShowSearchPanel] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationTab, setNotificationTab] =
    useState<NotificationTab>("alerts");
  const [notificationMessage, setNotificationMessage] = useState("");

  const searchRef = useRef<HTMLDivElement | null>(null);
  const notifRef = useRef<HTMLDivElement | null>(null);

  const profileImage = localStorage.getItem("profileImage") || "";
  const savedProfileRaw = localStorage.getItem("profile");
  let savedProfile: SavedProfile | null = null;

  try {
    savedProfile = savedProfileRaw
      ? (JSON.parse(savedProfileRaw) as SavedProfile)
      : null;
  } catch {
    savedProfile = null;
  }

  const avatarText = initials(savedProfile?.full_name);

  useEffect(() => {
    const controller = new AbortController();

    async function loadCourses() {
      if (!API_BASE) {
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

        const res = await fetch(`${API_BASE}/courses/`, {
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
      } catch (e: unknown) {
        if (controller.signal.aborted) return;
        setError(e instanceof Error ? e.message : "Failed to load courses");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadCourses();

    return () => controller.abort();
  }, []);

  useEffect(() => {
    function handleOutside(event: MouseEvent) {
      const target = event.target as Node;

      if (searchRef.current && !searchRef.current.contains(target)) {
        setShowSearchPanel(false);
      }

      if (notifRef.current && !notifRef.current.contains(target)) {
        setShowNotifications(false);
      }
    }

    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => matchesQuery(course, search));
  }, [courses, search]);

  const recommendedMarquee = useMemo(() => marqueeCourses(courses), [courses]);
  const courseList = useMemo(() => courses.slice(0, 4), [courses]);
  const continueLearning = useMemo(() => courses.slice(0, 2), [courses]);

  const openCourse = (courseId: number) => {
    navigate(`/courses/${courseId}`);
  };

  const openCoursesPage = () => {
    navigate("/courses");
  };

  const openFilteredCourses = (term: string) => {
    navigate(`/courses?search=${encodeURIComponent(term)}`);
  };

  const handleNotificationTabClick = (tab: NotificationTab) => {
    setNotificationTab(tab);
    setNotificationMessage("");
  };

  const handleNotificationAction = (action: "view_all" | "mark_all") => {
    if (action === "view_all") {
      setNotificationMessage("There are currently no notifications to display.");
      return;
    }

    setNotificationMessage("All alerts are already marked as read.");
  };

  return (
    <>
      <style>
        {`
          @keyframes dashboard-marquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }

          .group:hover .group-hover\\:paused {
            animation-play-state: paused;
          }

          /* ===== BACKGROUND DECOR ===== */
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
            width: 120px;
            height: 120px;
            background-image: radial-gradient(#1E293B 2px, transparent 2px);
            background-size: 12px 12px;
            opacity: 0.2;
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

          .qpg-deco--dots {
            bottom: 120px;
            left: 20%;
          }

          /* ===== CARD HOVER LIFT (desktop hover + mobile active) ===== */
          .card-lift {
            transition: all 300ms cubic-bezier(0.34, 1.56, 0.64, 1);
          }
          .card-lift:hover,
          .card-lift:active {
            transform: translate(-4px, -4px) rotate(-1deg) scale(1.02);
          }
          .card-lift-explore:hover,
          .card-lift-explore:active {
            transform: translate(-4px, -4px) rotate(-2deg) scale(1.03);
          }
          .card-lift-marquee:hover,
          .card-lift-marquee:active {
            transform: translate(-4px, -4px) rotate(-2deg) scale(1.05);
          }
          .btn-lift:hover,
          .btn-lift:active {
            transform: translate(-4px, -4px);
          }
        `}
      </style>

      <div className="relative min-h-full bg-[#f6f7fb] overflow-x-clip">
        {/* Background decorations — clipped so they never cause horizontal scroll */}
        <span className="qpg-deco qpg-deco--circle qpg-deco--yellow" />
        <span className="qpg-deco qpg-deco--circle qpg-deco--pink" />
        <span className="qpg-deco qpg-deco--triangle qpg-deco--violet" />
        <span className="qpg-deco qpg-deco--dots" />

        {/* ===================== NAVBAR ===================== */}
        <header className="sticky top-0 z-40 border-b border-gray-200/80 bg-white/95 px-4 py-4 shadow-sm backdrop-blur md:px-6 md:py-5">
          <div className="mx-auto w-full">
            <div className="flex flex-col gap-3 md:gap-4 xl:flex-row xl:items-center xl:justify-between">

              {/* Mobile / Tablet top row */}
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h1 className="truncate text-[20px] font-black leading-none text-black sm:text-[22px] md:hidden">
                    Learner&apos;s Portal
                  </h1>
                  <h1 className="hidden text-[26px] font-black leading-none text-black md:block xl:text-[30px]">
                    Home
                  </h1>
                </div>

                <div className="flex shrink-0 items-center gap-2 sm:gap-3 xl:hidden">
                  <div ref={notifRef} className="relative">
                    <button
                      type="button"
                      onClick={() => setShowNotifications((prev) => !prev)}
                      className="grid h-10 w-10 place-items-center rounded-full bg-white shadow-sm ring-1 ring-black/5 transition hover:-translate-y-0.5 active:-translate-y-0.5 hover:shadow-md sm:h-11 sm:w-11"
                      aria-label="Notifications"
                    >
                      <Bell className="h-4 w-4 text-gray-800 sm:h-5 sm:w-5" />
                    </button>

                    {showNotifications && (
                      <div className="absolute right-0 top-[calc(100%+10px)] z-50 w-72.5 max-w-[calc(100vw-2rem)] overflow-hidden rounded-[24px] border border-[#c94949] bg-white shadow-2xl sm:w-[320px]">
                        <div className="bg-linear-to-r from-[#8f1010] to-[#c41d1d] px-5 pb-0 pt-6 text-white">
                          <h3 className="text-[18px] font-bold">Notifications</h3>
                          <div className="mt-5 flex items-center gap-6 border-b border-white/25 text-[13px] font-semibold text-white/80">
                            {(["alerts", "events", "logs"] as NotificationTab[]).map((tab) => (
                              <button
                                key={tab}
                                type="button"
                                onClick={() => handleNotificationTabClick(tab)}
                                className={`pb-3 capitalize transition ${
                                  notificationTab === tab
                                    ? "border-b-2 border-white text-white"
                                    : "text-white/80 hover:text-white"
                                }`}
                              >
                                {tab}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="flex min-h-55 flex-col items-center justify-center px-5 py-8 text-center">
                          <h4 className="text-[21px] font-black text-[#8f1010]">
                            {notificationTab === "alerts" ? "All caught up!" : notificationTab === "events" ? "No upcoming events" : "No recent logs"}
                          </h4>
                          <p className="mt-3 text-[15px] font-semibold text-[#9b7b7b]">
                            {notificationTab === "alerts" ? "No new notifications." : notificationTab === "events" ? "There are no event updates right now." : "There are no log updates right now."}
                          </p>
                          {notificationMessage ? (
                            <p className="mt-4 rounded-full bg-[#9e1515]/10 px-4 py-2 text-sm font-semibold text-[#9e1515]">
                              {notificationMessage}
                            </p>
                          ) : null}
                        </div>

                        <div className="flex items-center justify-between border-t border-[#f0d0d0] px-5 py-4 text-[14px] font-semibold">
                          <button type="button" onClick={() => handleNotificationAction("view_all")} className="text-[#9e1515] hover:underline">View all</button>
                          <button type="button" onClick={() => handleNotificationAction("mark_all")} className="text-[#c41d1d] hover:underline">Mark all</button>
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate("/profile")}
                    className="grid h-10 w-10 place-items-center overflow-hidden rounded-full bg-[#ff4c83] shadow-sm transition hover:-translate-y-0.5 active:-translate-y-0.5 hover:shadow-md sm:h-11 sm:w-11"
                    aria-label="Open profile"
                  >
                    {profileImage ? (
                      <img src={profileImage} alt="Profile" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-xs font-black text-white sm:text-sm">{avatarText}</span>
                    )}
                  </button>
                </div>
              </div>

              {/* Search row */}
              <div className="flex w-full items-center gap-3 xl:justify-end">
                <div ref={searchRef} className="relative w-full xl:max-w-130">
                  <div className="flex h-13 items-center gap-3 rounded-full border-[2.5px] border-[#2d2d2d] bg-white px-4 shadow-sm sm:h-14 sm:px-5">
                    <Search className="h-5 w-5 shrink-0 text-black" />
                    <input
                      value={search}
                      onChange={(e) => { setSearch(e.target.value); setShowSearchPanel(true); }}
                      onFocus={() => setShowSearchPanel(true)}
                      className="w-full bg-transparent text-[15px] text-gray-900 outline-none placeholder:text-gray-500 sm:text-[16px]"
                      placeholder="Search courses, tags lessons..."
                    />
                    {search ? (
                      <button
                        type="button"
                        onClick={() => { setSearch(""); setShowSearchPanel(false); }}
                        className="rounded-full p-1 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
                        aria-label="Clear search"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    ) : null}
                  </div>

                  {showSearchPanel && (
                    <div className="absolute left-0 right-0 top-[calc(100%+10px)] z-50 rounded-[22px] border border-gray-200 bg-white p-3 shadow-2xl sm:top-[calc(100%+12px)] sm:rounded-[24px] sm:p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <h4 className="text-sm font-bold text-gray-900">Search Results</h4>
                        <button type="button" onClick={() => setShowSearchPanel(false)} className="text-xs font-semibold text-gray-500 hover:text-gray-800">Close</button>
                      </div>
                      <div className="max-h-72 space-y-2 overflow-y-auto pr-1 sm:max-h-80">
                        {filteredCourses.length > 0 ? (
                          filteredCourses.slice(0, 8).map((course) => (
                            <button
                              key={course.id}
                              type="button"
                              onClick={() => { setShowSearchPanel(false); openCourse(course.id); }}
                              className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-left transition hover:border-[#9b1717] hover:bg-[#9b1717]/5 active:border-[#9b1717] active:bg-[#9b1717]/5"
                            >
                              <div className="text-sm font-bold text-gray-900">{course.title}</div>
                              <div className="mt-1 line-clamp-2 text-xs text-gray-600">{course.description}</div>
                            </button>
                          ))
                        ) : (
                          <div className="rounded-2xl border border-dashed border-gray-200 px-4 py-5 text-sm text-gray-500">
                            No courses matched your search.
                          </div>
                        )}
                      </div>
                      <div className="mt-4 flex justify-end">
                        <button type="button" onClick={() => { setShowSearchPanel(false); openFilteredCourses(search.trim()); }} className="text-sm font-bold text-[#9b1717] hover:underline">
                          See all
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Desktop only right actions */}
                <div className="hidden items-center gap-3 xl:flex">
                  <div ref={notifRef} className="relative shrink-0">
                    <button
                      type="button"
                      onClick={() => setShowNotifications((prev) => !prev)}
                      className="grid h-14 w-14 place-items-center rounded-full bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                      aria-label="Notifications"
                    >
                      <Bell className="h-5 w-5 text-gray-800" />
                    </button>

                    {showNotifications && (
                      <div className="absolute right-0 top-[calc(100%+12px)] z-50 w-[320px] overflow-hidden rounded-[28px] border border-[#c94949] bg-white shadow-2xl md:w-105">
                        <div className="bg-linear-to-r from-[#8f1010] to-[#c41d1d] px-6 pb-0 pt-8 text-white">
                          <h3 className="text-[20px] font-bold">Notifications</h3>
                          <div className="mt-6 flex items-center gap-8 border-b border-white/25 text-[14px] font-semibold text-white/80">
                            {(["alerts", "events", "logs"] as NotificationTab[]).map((tab) => (
                              <button
                                key={tab}
                                type="button"
                                onClick={() => handleNotificationTabClick(tab)}
                                className={`pb-3 capitalize transition ${
                                  notificationTab === tab
                                    ? "border-b-2 border-white text-white"
                                    : "text-white/80 hover:text-white"
                                }`}
                              >
                                {tab}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="flex min-h-62.5 flex-col items-center justify-center px-6 py-10 text-center">
                          <h4 className="text-[24px] font-black text-[#8f1010]">
                            {notificationTab === "alerts" ? "All caught up!" : notificationTab === "events" ? "No upcoming events" : "No recent logs"}
                          </h4>
                          <p className="mt-3 text-[16px] font-semibold text-[#9b7b7b]">
                            {notificationTab === "alerts" ? "No new notifications." : notificationTab === "events" ? "There are no event updates right now." : "There are no log updates right now."}
                          </p>
                          {notificationMessage ? (
                            <p className="mt-4 rounded-full bg-[#9e1515]/10 px-4 py-2 text-sm font-semibold text-[#9e1515]">
                              {notificationMessage}
                            </p>
                          ) : null}
                        </div>

                        <div className="flex items-center justify-between border-t border-[#f0d0d0] px-6 py-5 text-[16px] font-semibold">
                          <button type="button" onClick={() => handleNotificationAction("view_all")} className="text-[#9e1515] hover:underline">View all</button>
                          <button type="button" onClick={() => handleNotificationAction("mark_all")} className="text-[#c41d1d] hover:underline">Mark all alerts as read</button>
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate("/profile")}
                    className="grid h-14 w-14 place-items-center overflow-hidden rounded-full bg-[#ff4c83] shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                    aria-label="Open profile"
                  >
                    {profileImage ? (
                      <img src={profileImage} alt="Profile" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-sm font-black text-white">{avatarText}</span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* ===================== CONTENT ===================== */}
        {/*
          Replaced qpg-wrap / qpg-wrap--wide with explicit responsive padding
          so cards never clip or overflow on mobile.
        */}
        <div className="qpg-wrap qpg-wrap--wide">
          <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_340px]">
            <div className="min-w-0 space-y-8 sm:space-y-10">

              {/* ──────────── HERO / Welcome back ──────────── */}
              <div className="relative overflow-hidden rounded-4xl border-2 border-[#1E293B] bg-[#FFFDF5] p-5 shadow-[6px_6px_0px_#1E293B] sm:rounded-[24px] sm:p-6">
                {/*
                  Decorations are clipped by overflow-hidden on the parent.
                  Reduced size on mobile so text always has space.
                */}
                <div className="pointer-events-none absolute -top-10 -left-10 h-28 w-28 rounded-full bg-[#FBBF24] opacity-80 sm:-top-12 sm:-left-12 sm:h-40 sm:w-40" />
                <div className="pointer-events-none absolute -bottom-10 -right-10 h-28 w-28 rounded-full bg-[#34D399] opacity-80 sm:-bottom-12 sm:-right-12 sm:h-40 sm:w-40" />

                <div className="relative z-10">
                  <p className="text-sm font-semibold text-[#64748B]">Welcome back</p>

                  <h2 className="mt-2 text-[20px] font-extrabold leading-tight text-[#1E293B] sm:text-[24px] md:text-[30px]">
                    Here's what we recommend for your learning journey today
                  </h2>

                  <p className="mt-3 text-sm text-[#475569]">
                    Explore your courses, continue where you left off, and use Learner's AI to boost your study experience.
                  </p>
                </div>
              </div>

              {/* ──────────── STATES ──────────── */}
              {loading ? (
                <div className="rounded-xl border-2 border-[#1E293B] bg-white p-6 shadow-[4px_4px_0px_#1E293B]">
                  Loading home courses...
                </div>
              ) : error ? (
                <div className="rounded-xl border-2 border-[#1E293B] bg-[#FEE2E2] p-6 text-red-600 shadow-[4px_4px_0px_#1E293B]">
                  {error}
                </div>
              ) : (
                <>
                  {/* ──────────── RECOMMENDED (marquee) ──────────── */}
                  <section className="space-y-4">
                    <h3 className="text-[18px] font-extrabold text-[#1E293B] sm:text-[20px]">
                      Recommended For You ✨
                    </h3>

                    {/* overflow-hidden clips the marquee — no side bleed */}
                    <div className="overflow-hidden rounded-4xl sm:rounded-[24px]">
                      <div className="group">
                        <div className="group-hover:paused flex w-max gap-4 py-2 animate-[dashboard-marquee_24s_linear_infinite] sm:gap-5">
                          {recommendedMarquee.map((course, index) => {
                            const shadowColor =
                              index % 3 === 0 ? "#8B5CF6" : index % 3 === 1 ? "#F472B6" : "#FBBF24";
                            const btnBg =
                              index % 3 === 0 ? "#8B5CF6" : index % 3 === 1 ? "#F472B6" : "#FBBF24";
                            const btnColor = index % 3 === 2 ? "#1E293B" : "#FFFFFF";

                            return (
                              <div
                                key={`${course.id}-${index}`}
                                className="
                                card-lift-marquee sm:w-42.5
                                w-42.5 shrink-0 rounded-xl border-2 border-[#1E293B] bg-white p-3
                                
                                shadow-[4px_4px_0px_#1E293B]
                                
                                transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]

                                hover:-translate-x-1 hover:-translate-y-1
                                hover:-rotate-2 hover:scale-[1.05]

                                hover:shadow-[8px_8px_0px_var(--shadow-color)]"
                                style={{ "--shadow-color": shadowColor } as React.CSSProperties}
                              >
                                <button
                                  onClick={() => openCourse(course.id)}
                                  className="block w-full overflow-hidden rounded-xl border-2 border-[#1E293B]"
                                >
                                  <img
                                    src={getCourseImage(course.code)}
                                    alt={course.title}
                                    className="h-17.5 w-full object-cover sm:h-20"
                                  />
                                </button>

                                <button
                                  onClick={() => openCourse(course.id)}
                                  className="btn-lift mt-3 w-full rounded-full border-2 border-[#1E293B] px-3 py-2 text-xs font-bold shadow-[4px_4px_0px_#1E293B] transition-all duration-300"
                                  style={{ background: btnBg, color: btnColor }}
                                >
                                  Explore
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* ──────────── CONTINUE LEARNING ──────────── */}
                  <section className="space-y-4">
                    <h3 className="text-[18px] font-extrabold text-[#1E293B] sm:text-[20px]">
                      Continue Learning
                    </h3>

                    {/*
                      Mobile: 1 column (full width)
                      sm (≥640): 2 columns
                      2xl (≥1536): 3 columns
                      gap reduced on mobile to prevent side overflow
                    */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 2xl:grid-cols-3">
                      {continueLearning.map((course, index) => {
                        const shadowColor =
                          index % 3 === 0 ? "#8B5CF6" : index % 3 === 1 ? "#F472B6" : "#FBBF24";
                        const btnBg =
                          index % 3 === 0 ? "#8B5CF6" : index % 3 === 1 ? "#F472B6" : "#FBBF24";
                        const btnColor = index % 3 === 2 ? "#1E293B" : "#FFFFFF";

                        return (
                          <div
                            key={course.id}
                            className="card-lift rounded-xl border-2 border-[#1E293B] bg-white p-4 shadow-[4px_4px_0px_#1E293B] hover:shadow-[8px_8px_0px_var(--shadow-color)] active:shadow-[8px_8px_0px_var(--shadow-color)]"
                            style={{ "--shadow-color": shadowColor } as React.CSSProperties}
                          >
                            <img
                              src={getCourseImage(course.code)}
                              alt={course.title}
                              className="h-36 w-full rounded-lg border-2 border-[#1E293B] object-cover sm:h-40"
                            />

                            <p className="mt-3 text-xs font-bold uppercase text-[#8B5CF6]">
                              {course.code}
                            </p>

                            <h4 className="mt-1 text-[15px] font-extrabold text-[#1E293B] sm:text-[16px]">
                              {course.title}
                            </h4>

                            <p className="mt-2 text-sm text-gray-600 line-clamp-3">
                              {course.description}
                            </p>

                            <button
                              onClick={() => openCourse(course.id)}
                              className="btn-lift mt-4 w-full rounded-full border-2 border-[#1E293B] px-4 py-2 font-bold shadow-[4px_4px_0px_#1E293B] transition-all duration-300 hover:shadow-[6px_6px_0px_#1E293B] active:shadow-[6px_6px_0px_#1E293B]"
                              style={{ background: btnBg, color: btnColor }}
                            >
                              Resume
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </section>

                  {/* ──────────── COURSE LIST ──────────── */}
                  <section className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-[18px] font-extrabold text-[#1E293B] sm:text-[20px]">
                        Course Lists
                      </h3>
                      <button onClick={openCoursesPage} className="font-bold underline text-sm sm:text-base">
                        See All
                      </button>
                    </div>

                    {/*
                      Mobile: 1 column
                      sm (≥640): 2 columns
                      2xl (≥1536): 3 columns
                    */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 2xl:grid-cols-3">
                      {courseList.map((course, index) => {
                        const shadowColor =
                          index % 3 === 0 ? "#8B5CF6" : index % 3 === 1 ? "#F472B6" : "#FBBF24";
                        const btnBg =
                          index % 3 === 0 ? "#8B5CF6" : index % 3 === 1 ? "#F472B6" : "#FBBF24";
                        const btnColor = index % 3 === 2 ? "#1E293B" : "#FFFFFF";

                        return (
                          <div
                            key={course.id}
                            className="card-lift rounded-xl border-2 border-[#1E293B] bg-white p-4 shadow-[4px_4px_0px_#1E293B] hover:shadow-[8px_8px_0px_var(--shadow-color)] active:shadow-[8px_8px_0px_var(--shadow-color)]"
                            style={{ "--shadow-color": shadowColor } as React.CSSProperties}
                          >
                            <img
                              src={getCourseImage(course.code)}
                              alt={course.title}
                              className="h-36 w-full rounded-lg border-2 border-[#1E293B] object-cover sm:h-40"
                            />

                            <h4 className="mt-3 text-[15px] font-extrabold text-[#1E293B] sm:text-[16px]">
                              {course.title}
                            </h4>

                            <p className="mt-2 text-sm text-gray-600 line-clamp-3">
                              {course.description}
                            </p>

                            <button
                              onClick={() => openCourse(course.id)}
                              className="btn-lift mt-4 w-full rounded-full border-2 border-[#1E293B] px-4 py-2 font-bold text-white shadow-[4px_4px_0px_#1E293B] transition-all duration-300 hover:shadow-[6px_6px_0px_#1E293B] active:shadow-[6px_6px_0px_#1E293B]"
                              style={{ background: btnBg, color: btnColor }}
                            >
                              Explore
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </section>

                  {/* ──────────── QUICK EXPLORE ──────────── */}
                  <section className="space-y-4">
                    <h3 className="text-[18px] font-extrabold text-[#1E293B] sm:text-[20px]">
                      Quick Explore
                    </h3>

                    {/*
                      Mobile: 1 column (stacked, each card full width — no overlap)
                      sm (≥640): 2 columns
                      md (≥768): 3 columns
                    */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 md:grid-cols-3 md:gap-6">
                      {["Programming", "Database", "Web Development"].map((term, i) => {
                        const colors = ["#8B5CF6", "#F472B6", "#FBBF24"];
                        const accents = ["bg-[#8B5CF6]", "bg-[#F472B6]", "bg-[#FBBF24]"];
                        const shadowColor = i === 0 ? "#8B5CF6" : i === 1 ? "#F472B6" : "#FBBF24";

                        return (
                          <button
                            key={term}
                            onClick={() => openFilteredCourses(term)}
                            className="relative rounded-2xl border-2 border-[#1E293B] bg-white p-6 text-left
                              shadow-[4px_4px_0px_#1E293B]
                              transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]
                              
                              hover:-translate-x-1 hover:-translate-y-1
                              hover:-rotate-2 hover:scale-[1.03]
                              
                              hover:shadow-[8px_8px_0px_var(--shadow-color)]"
                            style={{ "--shadow-color": shadowColor } as React.CSSProperties}
                          >
                            {/* Corner accent */}
                            <span
                              className={`absolute top-0 right-0 h-6 w-6 rounded-bl-xl border-l-2 border-b-2 border-[#1E293B] ${accents[i]}`}
                            />

                            {/* Icon */}
                            <div
                              className="mb-4 flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#1E293B] sm:h-12 sm:w-12"
                              style={{ background: colors[i] }}
                            >
                              <span className="text-base font-bold text-white sm:text-lg">●</span>
                            </div>

                            <h4 className="text-[15px] font-extrabold text-[#1E293B] sm:text-[17px]">
                              {term}
                            </h4>

                            <p className="mt-2 text-sm text-gray-600">
                              Browse related courses and start learning.
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </section>
                </>
              )}
            </div>

            {/* RIGHT SIDE — hidden on mobile, shown on xl+ */}
            <div className="min-w-0">
              <DashboardRightWidgets />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}