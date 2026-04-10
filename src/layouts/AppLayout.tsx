import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  Home,
  BookOpen,
  Brain, // ✅ NEW
  ClipboardCheck,
  BarChart3,
  MessageCircle,
  LogOut,
  User,
  ChevronDown,
  ChevronRight,
  MessageCirclePlus,
  RotateCcw,
  Trash2,
  Menu,
} from "lucide-react";
import { storage } from "../utils/storage";
import { useChatContext } from "../context/chat-context";

type PreviewMessage = {
  role: "user" | "assistant";
  content: string;
};

type ApiResponse = {
  detail?: string;
  message?: string;
};

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
const CHAT_BASE = `${API_BASE}/chat`;

const navItemBase =
  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200";
const navItemInactive =
  "text-gray-300 hover:bg-white hover:text-black hover:-translate-y-0.5";
const navItemActive = "bg-[#333333] text-white shadow-md";

const navItemDisabled =
  "pointer-events-none opacity-50 cursor-not-allowed text-gray-500";

const subItemBase =
  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-200";
const subItemInactive =
  "text-gray-300 hover:bg-white hover:text-black hover:-translate-y-0.5";
const subItemDisabled =
  "pointer-events-none opacity-50 cursor-not-allowed text-gray-500";

function makePreviewTitle(messages: PreviewMessage[], index: number) {
  const firstUser = messages.find((m) => m.role === "user")?.content?.trim();
  if (!firstUser) return `Chat ${index + 1}`;
  return firstUser.length > 22 ? `${firstUser.slice(0, 22)}...` : firstUser;
}

function getAuthHeaders(): HeadersInit {
  const token = storage.getToken();
  const user = storage.getUser();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (user?.id !== undefined && user?.id !== null) {
    headers["X-User-ID"] = String(user.id);
  }

  return headers;
}

async function safeJson<T = unknown>(res: Response): Promise<T | null> {
  const text = await res.text();
  if (!text) return null;

  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const [aiOpen, setAiOpen] = useState(false);
  const [recentOpen, setRecentOpen] = useState(true);
  const [deletingRecent, setDeletingRecent] = useState(false);
  const [meOpen, setMeOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const mobileNavRef = useRef<HTMLDivElement | null>(null);

  const {
    chatHistory,
    activeChatIndex,
    newChat,
    selectChat,
    clearChats,
    setChatHistory,
    setActiveChatIndex,
  } = useChatContext();

  const isProfilePage = location.pathname === "/profile";
  const isQuizPage = location.pathname === "/quiz" || location.pathname.startsWith("/quiz/");
  const isChatPage = location.pathname === "/chat";

  useEffect(() => {
    const path = location.pathname;

    let pageTitle = "Learner's Portal";

    if (path === "/home") {
      pageTitle = "Home - Learner's Portal";
    } else if (path === "/courses") {
      pageTitle = "Courses - Learner's Portal";
    } else if (path === "/chat") {
      pageTitle = "Chat - Learner's Portal";
    } else if (path === "/quiz-results") {
      pageTitle = "Quiz Results - Learner's Portal";
    } else if (path.startsWith("/quiz")) {
      pageTitle = "Take a Quiz - Learner's Portal";
    } else if (path === "/feedback") {
      pageTitle = "Feedback - Learner's Portal";
    } else if (path === "/profile") {
      pageTitle = "Profile - Learner's Portal";
    } else if (path === "/login") {
      pageTitle = "Login - Learner's Portal";
    } else if (path === "/register") {
      pageTitle = "Register - Learner's Portal";
    }

    document.title = pageTitle;
  }, [location.pathname]);

  useEffect(() => {
    setAiOpen(false);
    setMeOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent | TouchEvent) {
      const target = event.target as Node | null;
      if (!target) return;

      if (mobileNavRef.current && !mobileNavRef.current.contains(target)) {
        setAiOpen(false);
        setMeOpen(false);
      }
    }

    if (!aiOpen && !meOpen) return;

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, [aiOpen, meOpen]);

  const logout = () => {
    if (isQuizPage) return;
    storage.clearAll();
    navigate("/login", { replace: true });
  };

  const deleteRecentChat = useCallback(async () => {
    if (deletingRecent || isQuizPage) return;

    if (!API_BASE) {
      alert("VITE_API_BASE_URL is not set.");
      return;
    }

    try {
      setDeletingRecent(true);

      const res = await fetch(`${CHAT_BASE}/recent`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      const data = await safeJson<ApiResponse>(res);

      if (!res.ok) {
        throw new Error(data?.detail || "Failed to delete recent chat");
      }

      setChatHistory([[]]);
      setActiveChatIndex(0);
      navigate("/chat", { state: { forceNew: true, openRecent: false } });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to delete recent chat";
      alert(message);
    } finally {
      setDeletingRecent(false);
    }
  }, [deletingRecent, isQuizPage, navigate, setActiveChatIndex, setChatHistory]);

  const profileImage = localStorage.getItem("profileImage");

  const recentChats = useMemo(() => {
    return chatHistory
      .map((chat, index) => ({
        index,
        title: makePreviewTitle(chat, index),
        count: chat.length,
      }))
      .reverse();
  }, [chatHistory]);

  const getNavClass = (isActive: boolean, disabled: boolean) =>
    `${navItemBase} ${
      disabled ? navItemDisabled : isActive ? navItemActive : navItemInactive
    }`;

  const getSubClass = (disabled: boolean) =>
    `w-full ${subItemBase} ${disabled ? subItemDisabled : subItemInactive}`;

  const mobileItemBase =
    "flex min-w-0 flex-1 flex-col items-center justify-center gap-[3px] rounded-2xl px-1.5 py-2 text-[9px] leading-none font-medium transition-all duration-200";

  const mobileItemClass = (active: boolean, disabled: boolean) =>
    `${mobileItemBase} ${
      disabled
        ? "pointer-events-none opacity-45 text-gray-500"
        : active
        ? "bg-white/35 text-black shadow-[0_6px_18px_rgba(255,255,255,0.20)] backdrop-blur-md"
        : "text-gray-800 hover:bg-white/20"
    }`;

  return (
    <div className="h-screen w-full bg-[#f6f7fb]">
      <div className="grid h-screen grid-cols-1 md:grid-cols-[280px_1fr]">
        <aside className="sticky top-0 hidden h-screen flex-col overflow-y-auto border-r border-[#2b2b2b] bg-[#1A1A1A] p-5 shadow-xl md:flex">
          <div>
            <h1 className="text-center text-2xl font-bold text-white">
              Learner&apos;s Portal
            </h1>

            <div className="mt-3 w-full border-t border-dashed border-[#333333]" />

            <nav className="mt-6 space-y-2">
              <NavLink
                to={isQuizPage ? "#" : "/home"}
                onClick={(e) => {
                  if (isQuizPage) e.preventDefault();
                }}
                className={({ isActive }) => getNavClass(isActive, isQuizPage)}
              >
                <Home className="h-5 w-5" />
                Home
              </NavLink>

              <NavLink
                to={isQuizPage ? "#" : "/courses"}
                onClick={(e) => {
                  if (isQuizPage) e.preventDefault();
                }}
                className={({ isActive }) => getNavClass(isActive, isQuizPage)}
              >
                <BookOpen className="h-5 w-5" />
                Courses
              </NavLink>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    if (isQuizPage) return;

                    setAiOpen(false); // close dropdown always

                    newChat();

                    if (location.pathname === "/chat") {
                      setActiveChatIndex(chatHistory.length);
                    } else {
                      navigate("/chat", {
                        state: { forceNew: true, openRecent: false },
                      });
                    }
                  }}
                  disabled={isQuizPage}
                  className={`w-full text-left ${getNavClass(aiOpen, isQuizPage)}`}
                >
                  <Brain className="h-5 w-5" />
                  <span className="flex-1">Learner&apos;s AI</span>
                  {aiOpen ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>

                {aiOpen && !isQuizPage && (
                  <div className="ml-3 space-y-2">
                    <button
                      type="button"
                      onClick={() => {
                        newChat();
                        navigate("/chat", {
                          state: { forceNew: true, openRecent: false },
                        });
                      }}
                      className={getSubClass(false)}
                    >
                      <MessageCirclePlus className="h-4 w-4" />
                      New Chat
                    </button>

                    <div className="rounded-xl border border-[#333333] bg-[#222222] p-2">
                      <button
                        type="button"
                        onClick={() => setRecentOpen((prev) => !prev)}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-gray-200 transition hover:bg-[#333333]"
                      >
                        <RotateCcw className="h-4 w-4" />
                        <span className="flex-1">Recent</span>
                        {recentOpen ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>

                      {recentOpen && (
                        <div className="mt-2 space-y-1">
                          {recentChats.length === 0 ||
                          recentChats.every((chat) => chat.count === 0) ? (
                            <div className="px-3 py-2 text-sm text-gray-400">
                              No recent chats yet
                            </div>
                          ) : (
                            recentChats.map((chat) => {
                              const isActive = chat.index === activeChatIndex;

                              return (
                                <button
                                  key={`${chat.title}-${chat.index}`}
                                  type="button"
                                  onClick={() => {
                                    selectChat(chat.index);
                                    navigate("/chat", {
                                      state: { openRecent: true },
                                    });
                                  }}
                                  className={`block w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                                    isActive
                                      ? "bg-[#333333] text-white"
                                      : "text-gray-300 hover:bg-[#333333] hover:text-white"
                                  }`}
                                >
                                  {chat.title}
                                </button>
                              );
                            })
                          )}

                          <div className="mt-2 space-y-1">
                            <button
                              type="button"
                              onClick={deleteRecentChat}
                              disabled={deletingRecent}
                              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-300 transition hover:bg-[#333333] hover:text-red-200 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <Trash2 className="h-4 w-4" />
                              {deletingRecent
                                ? "Deleting..."
                                : "Delete Recent Chat"}
                            </button>

                            <button
                              type="button"
                              onClick={clearChats}
                              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-gray-300 transition hover:bg-[#333333] hover:text-white"
                            >
                              <RotateCcw className="h-4 w-4" />
                              Clear Local Chats
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <NavLink
                to="/quiz"
                className={({ isActive }) => getNavClass(isActive, false)}
              >
                <ClipboardCheck className="h-5 w-5" />
                Take a Quiz
              </NavLink>

              <NavLink
                to={isQuizPage ? "#" : "/quiz-results"}
                onClick={(e) => {
                  if (isQuizPage) e.preventDefault();
                }}
                className={({ isActive }) => getNavClass(isActive, isQuizPage)}
              >
                <BarChart3 className="h-5 w-5" />
                Quiz Results
              </NavLink>

              <NavLink
                to={isQuizPage ? "#" : "/feedback"}
                onClick={(e) => {
                  if (isQuizPage) e.preventDefault();
                }}
                className={({ isActive }) => getNavClass(isActive, isQuizPage)}
              >
                <MessageCircle className="h-5 w-5" />
                Feedback
              </NavLink>
            </nav>
          </div>

          <div className="mt-auto space-y-3 pt-6">
            <div className="h-0.5 w-full bg-[#333333]" />

            <NavLink
              to={isQuizPage ? "#" : "/profile"}
              onClick={(e) => {
                if (isQuizPage) e.preventDefault();
              }}
              className={({ isActive }) =>
                `flex justify-center rounded-xl py-3 transition-colors ${
                  isQuizPage
                    ? "pointer-events-none cursor-not-allowed opacity-50"
                    : isActive
                    ? "bg-[#800000]/20"
                    : "hover:bg-[#2a2a2a]"
                }`
              }
            >
              {profileImage ? (
                <img
                  src={profileImage}
                  alt="Profile"
                  className="h-20 w-20 rounded-full border border-gray-500 object-cover"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full border border-gray-500 bg-gray-200">
                  <User className="h-10 w-10 text-gray-600" />
                </div>
              )}
            </NavLink>

            <button
              type="button"
              onClick={logout}
              disabled={isQuizPage}
              className={`flex w-full items-center justify-center gap-3 rounded-xl px-4 py-3 transition-colors ${
                isQuizPage
                  ? "pointer-events-none cursor-not-allowed text-gray-500 opacity-50"
                  : "text-gray-300 hover:bg-[#2a2a2a] hover:text-white"
              }`}
            >
              <LogOut className="h-5 w-5" />
              Logout
            </button>
          </div>
        </aside>

        <main className="h-screen overflow-y-auto bg-[#f6f7fb] pb-24 md:pb-0">
          <div
            className={
              isProfilePage ? "min-h-full p-4 md:p-6 xl:p-8" : "min-h-full"
            }
          >
            <Outlet />
          </div>
        </main>
      </div>

      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 px-3 md:hidden">
          <div ref={mobileNavRef} className="relative pointer-events-auto mx-auto max-w-97.5">

            {/* 🍔 MENU DROPDOWN */}
            {menuOpen && !isQuizPage && (
              <div className="
                absolute bottom-full right-0 z-20 mb-3 w-56
                rounded-2xl border-2 border-[#1E293B] bg-white p-2
                shadow-[6px_6px_0px_#1E293B]
                animate-[fadeIn_0.2s_ease]
              ">
                {/* Quiz Results */}
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    navigate("/quiz-results");
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-[#1E293B]
                  hover:bg-[#FBBF24] transition"
                >
                  <BarChart3 className="h-4 w-4" />
                  Quiz Results
                </button>

                {/* Feedback */}
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    navigate("/feedback");
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-[#1E293B]
                  hover:bg-[#F472B6] transition"
                >
                  <MessageCircle className="h-4 w-4" />
                  Feedback
                </button>

                {/* Profile */}
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    navigate("/profile");
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-[#1E293B]
                  hover:bg-[#34D399] transition"
                >
                  <User className="h-4 w-4" />
                  Profile
                </button>

                {/* Logout */}
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    logout();
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-red-600
                  hover:bg-red-100 transition"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            )}

            {/* MAIN NAV */}
            <div className="
              flex items-end gap-1.5
              rounded-full border-2 border-[#1E293B]
              bg-white px-2 py-2
              shadow-[4px_4px_0px_#1E293B]
            ">

              {/* HOME */}
              <NavLink
                to="/home"
                className={({ isActive }) => mobileItemClass(isActive, isQuizPage)}
              >
                <Home className="h-5.5 w-5.5" strokeWidth={2.5} />
                <span>Home</span>
              </NavLink>

              {/* COURSES */}
              <NavLink
                to="/courses"
                className={({ isActive }) => mobileItemClass(isActive, isQuizPage)}
              >
                <BookOpen className="h-5.5 w-5.5" strokeWidth={2.5} />
                <span>Courses</span>
              </NavLink>

              {/* AI */}
              <button
                onClick={() => {
                  setMenuOpen(false);

                  if (isChatPage) {
                    setAiOpen((prev) => !prev);
                  } else {
                    navigate("/chat");
                  }
                }}
                className={mobileItemClass(isChatPage, isQuizPage)}
              >
                <Brain className="h-5.5 w-5.5 text-[#8B5CF6]" strokeWidth={2.5} />
                <span>AI</span>
              </button>

              {/* QUIZ */}
              <NavLink
                to="/quiz"
                className={({ isActive }) => mobileItemClass(isActive, false)}
              >
                <ClipboardCheck className="h-5.5 w-5.5" strokeWidth={2.5} />
                <span>Quiz</span>
              </NavLink>

              {/* 🍔 MENU */}
              <button
                onClick={() => {
                  setAiOpen(false);
                  setMenuOpen((prev) => !prev);
                }}
                className={mobileItemClass(menuOpen, isQuizPage)}
              >
                <Menu className="h-5.5 w-5.5" strokeWidth={2.5} />
                <span>Menu</span>
              </button>

            </div>
          </div>
      </div>
    </div>
  );
}