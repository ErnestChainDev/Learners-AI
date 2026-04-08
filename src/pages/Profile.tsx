import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Pencil,
  Save,
  X,
  ImagePlus,
  Target,
  Heart,
  Lightbulb,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { storage } from "../utils/storage";
import DashboardRightWidgets from "../components/dashboard/DashboardRightWidgets";

import introProgramming from "../assets/intro-programming.webp";
import webDevelopment from "../assets/WebDevelopment.png";
import DBM from "../assets/DBM.png";
import DSA from "../assets/DSA.jpg";
import NB from "../assets/NB.png";
import EDTECH from "../assets/EDTECH.png";

type ProfileOut = {
  user_id: number;
  full_name: string;
  strand: string;
  interests: string;
  career_goals: string;
  preferred_program: string;
  skills: string;
  notes: string;
};

type LatestLearnItem = {
  id: number;
  user_id: string;
  course_id: number;
  course_title: string;
  lesson_index: number;
  lesson_title: string;
  status: "in_progress" | "completed";
  updated_at: string;
};

type SectionIconKey = "career" | "interests" | "skills";

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

const STRANDS = {
  "Academic Track": ["STEM", "ABM", "HUMSS", "GAS"],
  "TVL Track": ["Home Economics", "ICT", "Industrial Arts", "Agri-Fishery Arts"],
  "Arts and Design Track": ["Arts and Design"],
  "Sports Track": ["Sports"],
} as const;
const PROGRAMS = ["BSCS", "BSIT", "BSIS", "BTVTED"] as const;

const INTEREST_OPTIONS = [
  "Algorithms & Problem Solving",
  "Artificial Intelligence",
  "Software Engineering",
  "Data Structures",
  "Machine Learning",
  "Web Development",
  "Network Administration",
  "System Integration",
  "Cybersecurity",
  "Cloud Computing",
  "Business Process Analysis",
  "Data Analytics",
  "Information Management",
  "Enterprise Systems",
  "Project Management",
  "Technical Skills Development",
  "Teaching & Instruction",
  "Industrial Tools & Systems",
  "Curriculum Design",
  "Applied Technologies",
];

const SKILL_OPTIONS = [
  "Programming",
  "Algorithm Design",
  "Logical thinking",
  "Debugging",
  "Mathematical analysis",
  "Web development",
  "Network troubleshooting",
  "System administration",
  "Hardware setup",
  "Cybersecurity basics",
  "Data analysis",
  "Documentation",
  "Business communication",
  "System planning",
  "Critical thinking",
  "Technical teaching",
  "Hands-on skills",
  "Equipment handling",
  "Instructional planning",
  "Practical problem solving",
];

const COURSE_IMAGES: Record<string, string> = {
  "Introduction to Programming": introProgramming,
  "Web Development Fundamentals": webDevelopment,
  "Database Management Systems": DBM,
  "Data Structures and Algorithms": DSA,
  "Networking Basics": NB,
  "Educational Technology Tools": EDTECH,
};

const CHIP_ACTIVE_STYLES = [
  "bg-[#8B5CF6] border-[#1E293B] text-white",
  "bg-[#F472B6] border-[#1E293B] text-white",
  "bg-[#FBBF24] border-[#1E293B] text-[#1E293B]",
  "bg-[#34D399] border-[#1E293B] text-[#1E293B]",
];

function getChipActiveStyle(index: number) {
  return CHIP_ACTIVE_STYLES[index % CHIP_ACTIVE_STYLES.length];
}

function getLatestLearnImage(title: string) {
  return COURSE_IMAGES[title] || introProgramming;
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

function initials(name?: string) {
  const n = (name ?? "").trim();
  if (!n) return "U";
  const parts = n.split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] ?? "U";
  const b = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";
  return (a + b).toUpperCase();
}

function normalizeProfile(
  p: Partial<ProfileOut> & { user_id: number }
): ProfileOut {
  return {
    user_id: p.user_id,
    full_name: p.full_name ?? "",
    strand: p.strand ?? "",
    interests: p.interests ?? "",
    career_goals: p.career_goals ?? "",
    preferred_program: p.preferred_program ?? "",
    skills: p.skills ?? "",
    notes: p.notes ?? "",
  };
}

function parseMultiValue(value: string): string[] {
  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

function stringifyMultiValue(values: string[]) {
  return values.join(", ");
}

function readImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result =
        typeof reader.result === "string" ? reader.result : "";
      resolve(result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ─── useTouchHover hook ───────────────────────────────────────────────────────
function useTouchHover<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const add = () => el.classList.add("is-touch-hover");
    const remove = () => el.classList.remove("is-touch-hover");
    el.addEventListener("pointerdown", add);
    el.addEventListener("pointerup", remove);
    el.addEventListener("pointercancel", remove);
    el.addEventListener("pointerleave", remove);
    return () => {
      el.removeEventListener("pointerdown", add);
      el.removeEventListener("pointerup", remove);
      el.removeEventListener("pointercancel", remove);
      el.removeEventListener("pointerleave", remove);
    };
  }, []);
  return ref;
}

// ─── SectionCard ─────────────────────────────────────────────────────────────
type SectionCardProps = {
  title: string;
  icon: React.ReactNode;
  editable: boolean;
  accentColor: string;
  onChangeIcon?: () => void;
  children: React.ReactNode;
};

function SectionCard({
  title,
  icon,
  editable,
  accentColor,
  onChangeIcon,
  children,
}: SectionCardProps) {
  const cardRef = useTouchHover<HTMLElement>();

  return (
    <section
      ref={cardRef}
      className="
        section-card
        relative overflow-visible rounded-xl border-2 border-[#1E293B]
        bg-white p-5 pt-8
        shadow-[6px_6px_0px_0px_#E2E8F0]
        transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]
        hover:-rotate-1 hover:scale-[1.02] hover:shadow-[8px_8px_0px_0px_#F472B6]
        active:scale-[0.98] active:rotate-[0.5deg] active:shadow-[3px_3px_0px_#1E293B]
        cursor-pointer select-none
      "
    >
      {/* Icon badge */}
      <button
        type="button"
        onClick={editable ? onChangeIcon : undefined}
        disabled={!editable}
        className={`
          absolute -top-5 left-5 z-10
          grid h-10 w-10 place-items-center rounded-full
          border-2 border-[#1E293B] text-white
          shadow-[3px_3px_0px_#1E293B]
          transition-all duration-200
          hover:scale-110 active:scale-95
          focus-visible:scale-110
          ${accentColor}
          ${editable ? "cursor-pointer" : ""}
        `}
      >
        {icon}
      </button>

      {/* Header */}
      <div className="ml-12">
        <h3 className="text-[18px] font-extrabold text-[#1E293B] leading-tight font-['Outfit',system-ui,sans-serif]">
          {title}
        </h3>
        <p className="mt-1 text-xs text-[#64748B]">
          {title === "Career Goals" && "Your future aspirations and direction"}
          {title === "Interests" && "Areas that capture your curiosity"}
          {title === "Skills" && "Your current strengths and abilities"}
        </p>
      </div>

      {/* Content */}
      <div className="mt-4 text-[14px] leading-7 text-[#475569]">
        {children}
      </div>
    </section>
  );
}

// ─── SectionIconPreview ───────────────────────────────────────────────────────
function SectionIconPreview({
  image,
  fallback,
  alt,
}: {
  image: string;
  fallback: React.ReactNode;
  alt: string;
}) {
  if (image) {
    return (
      <img src={image} alt={alt} className="h-5 w-5 rounded-full object-cover" />
    );
  }
  return <>{fallback}</>;
}

// ─── NoteBubble ───────────────────────────────────────────────────────────────
function NoteBubble({ text, onClick }: { text: string; onClick: () => void }) {
  const bubbleRef = useTouchHover<HTMLButtonElement>();

  return (
    <button
      ref={bubbleRef}
      type="button"
      onClick={onClick}
      title="Click to edit notes"
      className="
        note-bubble
        absolute left-2 -top-16 z-30 min-w-30 max-w-42
        cursor-pointer border-2 border-[#1E293B] bg-white px-3.5 py-2.5
        text-left shadow-[4px_4px_0px_#1E293B]
        transition-all duration-200
        hover:shadow-[6px_6px_0px_#8B5CF6] hover:-translate-y-0.5
        active:shadow-[2px_2px_0px_#8B5CF6] active:translate-y-0
        focus-visible:shadow-[6px_6px_0px_#8B5CF6] focus-visible:-translate-y-0.5
        font-['Plus_Jakarta_Sans',system-ui,sans-serif]
      "
      style={{ borderRadius: "12px 12px 12px 0px" }}
    >
      <span className="text-[13px] font-medium text-[#1E293B]">{text}</span>
      {/* Tail */}
      <span
        className="pointer-events-none absolute"
        style={{
          bottom: -12, left: 42, width: 0, height: 0,
          borderLeft: "10px solid transparent",
          borderRight: "2px solid transparent",
          borderTop: "14px solid #1E293B",
          transform: "rotate(8deg)",
        }}
      />
      <span
        className="pointer-events-none absolute z-1"
        style={{
          bottom: -9, left: 43, width: 0, height: 0,
          borderLeft: "9px solid transparent",
          borderRight: "2px solid transparent",
          borderTop: "13px solid white",
          transform: "rotate(8deg)",
        }}
      />
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Profile() {
  const apiBase = useMemo(() => API_BASE, []);
  const navigate = useNavigate();

  const [profile, setProfile] = useState<ProfileOut | null>(null);
  const [draft, setDraft] = useState<ProfileOut | null>(null);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState("");

  const [latestLearns, setLatestLearns] = useState<LatestLearnItem[]>([]);
  const [latestLearnError, setLatestLearnError] = useState("");

  const [editingNotes, setEditingNotes] = useState(false);

  const [profileImage, setProfileImage] = useState<string>(
    () => localStorage.getItem("profileImage") || ""
  );
  const [coverImage, setCoverImage] = useState<string>(
    () => localStorage.getItem("profileCoverImage") || ""
  );
  const [careerIconImage, setCareerIconImage] = useState<string>(
    () => localStorage.getItem("profileCareerIcon") || ""
  );
  const [interestsIconImage, setInterestsIconImage] = useState<string>(
    () => localStorage.getItem("profileInterestsIcon") || ""
  );
  const [skillsIconImage, setSkillsIconImage] = useState<string>(
    () => localStorage.getItem("profileSkillsIcon") || ""
  );

  const notesRef = useRef<HTMLTextAreaElement | null>(null);
  const profileFileInputRef = useRef<HTMLInputElement | null>(null);
  const coverFileInputRef = useRef<HTMLInputElement | null>(null);
  const careerIconInputRef = useRef<HTMLInputElement | null>(null);
  const interestsIconInputRef = useRef<HTMLInputElement | null>(null);
  const skillsIconInputRef = useRef<HTMLInputElement | null>(null);

  // ── Data fetching ──────────────────────────────────────────────────────────
  const fetchProfile = useCallback(
    async (signal?: AbortSignal) => {
      if (!apiBase) { setError("Missing VITE_API_BASE_URL."); return; }
      const t = storage.getToken();
      if (!t) { setError("You are not logged in."); return; }
      setFetching(true);
      setError("");
      try {
        const res = await fetch(`${apiBase}/profile/me`, {
          method: "GET",
          headers: { Authorization: `Bearer ${t}` },
          signal,
        });
        const data = await safeJson(res);
        if (!res.ok)
          throw new Error(extractErrorMessage(data, `Failed to load profile (${res.status})`));
        const normalized = normalizeProfile(data as ProfileOut);
        setProfile(normalized);
        setDraft(normalized);
        storage.setProfile(normalized);
      } catch (e: unknown) {
        if (signal?.aborted) return;
        setError(e instanceof Error ? e.message : "Failed to load profile");
      } finally {
        if (!signal?.aborted) setFetching(false);
      }
    },
    [apiBase]
  );

  const fetchLatestLearns = useCallback(
    async (signal?: AbortSignal) => {
      if (!apiBase) return;
      const t = storage.getToken();
      if (!t) return;
      try {
        setLatestLearnError("");
        const res = await fetch(`${apiBase}/courses/progress/history`, {
          method: "GET",
          headers: { Authorization: `Bearer ${t}` },
          signal,
        });
        const data = await safeJson(res);
        if (!res.ok) {
          if (res.status === 404) { setLatestLearns([]); return; }
          throw new Error(extractErrorMessage(data, `Failed to load latest learns (${res.status})`));
        }
        setLatestLearns(Array.isArray(data) ? (data as LatestLearnItem[]) : []);
      } catch (e: unknown) {
        if (signal?.aborted) return;
        setLatestLearnError(e instanceof Error ? e.message : "Failed to load latest learns");
      }
    },
    [apiBase]
  );

  useEffect(() => {
    const ctrl = new AbortController();
    void fetchProfile(ctrl.signal);
    void fetchLatestLearns(ctrl.signal);
    return () => ctrl.abort();
  }, [fetchProfile, fetchLatestLearns]);

  useEffect(() => {
    if (editingNotes) {
      window.setTimeout(() => notesRef.current?.focus(), 0);
    }
  }, [editingNotes]);

  // ── Mutations ──────────────────────────────────────────────────────────────
  const onChange = useCallback(
    <K extends keyof ProfileOut>(key: K, value: ProfileOut[K]) => {
      setDraft((prev) => (prev ? { ...prev, [key]: value } : prev));
    },
    []
  );

  const toggleMultiSelect = useCallback(
    (key: "interests" | "skills", value: string) => {
      setDraft((prev) => {
        if (!prev) return prev;
        const current = parseMultiValue(prev[key]);
        const exists = current.includes(value);
        const next = exists
          ? current.filter((item) => item !== value)
          : [...current, value];
        return { ...prev, [key]: stringifyMultiValue(next) };
      });
    },
    []
  );

  const startEdit = () => {
    if (!profile || editing) return;
    setDraft(profile);
    setEditing(true);
    setError("");
  };

  const cancelEdit = () => {
    if (!profile) return;
    setDraft(profile);
    setEditing(false);
    setEditingNotes(false);
    setError("");
  };

  const saveAll = useCallback(async () => {
    if (!draft) return;
    if (!apiBase) { setError("Missing VITE_API_BASE_URL."); return; }
    const t = storage.getToken();
    if (!t) { setError("You are not logged in. Please login again."); return; }
    setSaving(true);
    setError("");
    const cleanPayload = {
      full_name: draft.full_name?.trim() || "",
      strand: draft.strand?.trim() || "",
      preferred_program: draft.preferred_program?.trim() || "",
      career_goals: draft.career_goals?.trim() || "",
      interests: draft.interests?.trim() || "",
      skills: draft.skills?.trim() || "",
      notes: draft.notes?.trim() || "",
    };
    try {
      const res = await fetch(`${apiBase}/profile/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${t}`,
        },
        body: JSON.stringify(cleanPayload),
      });
      const data = await safeJson(res);
      if (!res.ok) {
        throw new Error(
          extractErrorMessage(data, `Failed to save profile (${res.status})`)
        );
      }
      const server = (isObject(data) ? data : {}) as Partial<ProfileOut>;
      const merged: ProfileOut = normalizeProfile({
        user_id: (server.user_id ?? draft.user_id) as number,
        full_name: server.full_name ?? draft.full_name,
        strand: server.strand ?? draft.strand,
        interests: server.interests ?? draft.interests,
        career_goals: server.career_goals ?? draft.career_goals,
        preferred_program: server.preferred_program ?? draft.preferred_program,
        skills: server.skills ?? draft.skills,
        notes: server.notes ?? draft.notes,
      });
      setProfile(merged);
      setDraft(merged);
      setEditing(false);
      setEditingNotes(false);
      storage.setProfile(merged);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to save profile");
    } finally {
      setSaving(false);
    }
  }, [apiBase, draft]);

  const saveNotesOnly = useCallback(async () => {
    if (!draft || !profile) return;
    if (draft.notes === profile.notes) { setEditingNotes(false); return; }
    await saveAll();
  }, [draft, profile, saveAll]);

  // ── Image pickers ──────────────────────────────────────────────────────────
  const openProfileImagePicker = () => {
    if (!saving) profileFileInputRef.current?.click();
  };
  const openCoverImagePicker = () => {
    if (!saving) coverFileInputRef.current?.click();
  };
  const openSectionIconPicker = (key: SectionIconKey) => {
    if (saving) return;
    if (key === "career") careerIconInputRef.current?.click();
    if (key === "interests") interestsIconInputRef.current?.click();
    if (key === "skills") skillsIconInputRef.current?.click();
  };

  const handleProfileImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Please select a valid profile image."); return; }
    try {
      const result = await readImage(file);
      setProfileImage(result);
      localStorage.setItem("profileImage", result);
    } catch { setError("Failed to read profile image."); }
  };

  const handleCoverImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Please select a valid background image."); return; }
    try {
      const result = await readImage(file);
      setCoverImage(result);
      localStorage.setItem("profileCoverImage", result);
    } catch { setError("Failed to read background image."); }
  };

  const handleSectionIconChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    key: SectionIconKey
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Please select a valid section icon image."); return; }
    try {
      const result = await readImage(file);
      if (key === "career") { setCareerIconImage(result); localStorage.setItem("profileCareerIcon", result); }
      else if (key === "interests") { setInterestsIconImage(result); localStorage.setItem("profileInterestsIcon", result); }
      else { setSkillsIconImage(result); localStorage.setItem("profileSkillsIcon", result); }
    } catch { setError("Failed to read section icon image."); }
  };

  // ── Loading state ──────────────────────────────────────────────────────────
  if (fetching || !profile || !draft) {
    return (
      <section className="rounded-xl border-2 border-[#1E293B] bg-white p-6 shadow-[6px_6px_0px_0px_#E2E8F0] font-['Plus_Jakarta_Sans',system-ui,sans-serif]">
        <div className="flex items-center gap-3">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-3 w-3 rounded-full bg-[#8B5CF6] border border-[#1E293B]"
              style={{ animation: `bounce 0.8s ease-in-out ${i * 0.15}s infinite alternate` }}
            />
          ))}
          <span className="text-[#64748B] font-medium ml-1">Loading profile…</span>
        </div>
        {error && (
          <div className="mt-4 rounded-xl border-2 border-[#1E293B] bg-[#FFF1F1] px-4 py-3 text-sm font-semibold text-[#1E293B] shadow-[4px_4px_0px_#F472B6]">
            {error}
          </div>
        )}
        <style>{`
          @keyframes bounce {
            from { transform: translateY(0); }
            to   { transform: translateY(-8px); }
          }
        `}</style>
      </section>
    );
  }

  // ── Derived view data ──────────────────────────────────────────────────────
  const selectedInterests = parseMultiValue(draft.interests);
  const selectedSkills = parseMultiValue(draft.skills);
  const noteText = draft.notes.trim() || "Notes here!!";

  const visibleInterestChips = editing
    ? INTEREST_OPTIONS
    : selectedInterests.length > 0
      ? selectedInterests
      : ["Programming", "Web Development", "UI/UX Design"];

  const visibleSkillChips = editing
    ? SKILL_OPTIONS
    : selectedSkills.length > 0
      ? selectedSkills
      : ["Coding", "Problem-solving", "Team collaboration"];

  const marqueeItems =
    latestLearns.length > 0 ? [...latestLearns, ...latestLearns] : [];

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px] font-['Plus_Jakarta_Sans',system-ui,sans-serif]">
      <div className="min-w-0 space-y-6">

        {/* ── Profile Header Card ─────────────────────────────────────────── */}
        <section className="relative rounded-xl border-2 border-[#1E293B] bg-white p-5 shadow-[6px_6px_0px_0px_#E2E8F0] overflow-visible">
          {/* Decorative corners */}
          <span aria-hidden="true" className="hidden md:block pointer-events-none absolute -top-4 -right-4 h-9 w-9 rounded-full bg-[#FBBF24] border-2 border-[#1E293B] shadow-[2px_2px_0px_#1E293B]" />
          <span aria-hidden="true" className="hidden md:block pointer-events-none absolute -bottom-3 right-16 h-5 w-5 rotate-45 bg-[#34D399] border-2 border-[#1E293B]" />

          {/* Cover */}
          <div
            className="relative h-44 overflow-hidden rounded-xl border-2 border-[#1E293B] bg-cover bg-center bg-no-repeat"
            style={
              coverImage
                ? { backgroundImage: `url(${coverImage})` }
                : { background: "linear-gradient(135deg, #8B5CF6 0%, #F472B6 50%, #FBBF24 100%)" }
            }
          >
            {!coverImage && (
              <div
                aria-hidden="true"
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage: "radial-gradient(circle, #1E293B 1.5px, transparent 1.5px)",
                  backgroundSize: "20px 20px",
                }}
              />
            )}
            <div className="absolute inset-0 bg-black/10" />

            {editing && (
              <button
                type="button"
                className="
                  absolute right-3 top-3 z-10
                  inline-flex items-center gap-2
                  rounded-full border-2 border-[#1E293B] bg-white/90
                  px-4 py-2 text-xs font-bold text-[#1E293B]
                  shadow-[3px_3px_0px_#1E293B]
                  transition-all duration-200
                  hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_#1E293B] hover:bg-[#FBBF24]
                  active:-translate-x-0.5 active:-translate-y-0.5 active:shadow-[5px_5px_0px_#1E293B] active:bg-[#FBBF24]
                  focus-visible:-translate-x-0.5 focus-visible:-translate-y-0.5 focus-visible:shadow-[5px_5px_0px_#1E293B]
                  min-h-11
                "
                onClick={openCoverImagePicker}
              >
                <ImagePlus className="h-3.5 w-3.5" strokeWidth={2.5} />
                Change Background
              </button>
            )}

            <input ref={coverFileInputRef} type="file" accept="image/*" onChange={handleCoverImageChange} style={{ display: "none" }} />
          </div>

          {/* Inline notes editor */}
          {editingNotes && (
            <div className="mt-6 md:mt-4 relative z-20">
              <textarea
                ref={notesRef}
                className="
                  w-full resize-y rounded-xl border-2 border-[#1E293B] bg-white
                  px-3.5 py-2.5 text-sm text-[#1E293B] outline-none
                  shadow-[4px_4px_0px_transparent]
                  transition-shadow duration-200
                  focus:shadow-[4px_4px_0px_#8B5CF6] focus:border-[#8B5CF6]
                  font-['Plus_Jakarta_Sans',system-ui,sans-serif] font-medium
                "
                value={draft.notes ?? ""}
                onChange={(e) => onChange("notes", e.target.value)}
                onBlur={() => void saveNotesOnly()}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void saveNotesOnly(); }
                  if (e.key === "Escape") { onChange("notes", profile.notes); setEditingNotes(false); }
                }}
                disabled={saving}
                rows={2}
                placeholder="Write notes..."
              />
            </div>
          )}

          {/* Avatar row */}
          <div className="relative z-10 -mt-16 grid gap-4 md:grid-cols-[auto_1fr_auto] md:items-end">

            {/* Avatar + note bubble */}
            <div className="relative ml-4">
              <NoteBubble
                text={noteText}
                onClick={() => { if (!saving) setEditingNotes(true); }}
              />

              {/* Avatar */}
              <div
                className="
                  flex h-32 w-32 items-center justify-center overflow-hidden
                  rounded-full border-4 border-[#1E293B]
                  bg-linear-to-br from-[#8B5CF6] to-[#F472B6]
                  shadow-[5px_5px_0px_#1E293B]
                  cursor-pointer
                  transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]
                  hover:-translate-y-1 hover:shadow-[7px_7px_0px_#8B5CF6]
                  active:-translate-y-1 active:shadow-[7px_7px_0px_#8B5CF6]
                  focus-visible:-translate-y-1 focus-visible:shadow-[7px_7px_0px_#8B5CF6]
                "
                onClick={openProfileImagePicker}
                role="button"
                tabIndex={0}
                title="Change profile image"
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openProfileImagePicker(); }
                }}
              >
                {profileImage ? (
                  <img src={profileImage} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-4xl font-black text-white" style={{ fontFamily: "Outfit, system-ui, sans-serif" }}>
                    {initials(draft.full_name)}
                  </span>
                )}
              </div>
            </div>

            <input ref={profileFileInputRef} type="file" accept="image/*" onChange={handleProfileImageChange} style={{ display: "none" }} />

            {/* Name + strand/program */}
            <div className="min-w-0 md:pt-20">
              {!editing ? (
                <h2 className="text-[28px] font-black text-[#1E293B] leading-tight" style={{ fontFamily: "Outfit, system-ui, sans-serif" }}>
                  {draft.full_name || "Unnamed User"}
                </h2>
              ) : (
                <input
                  className="
                    w-full max-w-sm rounded-xl border-2 border-[#CBD5E1] bg-white
                    px-4 py-2.5 text-xl font-bold text-[#1E293B] outline-none
                    shadow-[4px_4px_0px_transparent]
                    transition-all duration-200
                    focus:border-[#8B5CF6] focus:shadow-[4px_4px_0px_#8B5CF6]
                    font-['Outfit',system-ui,sans-serif]
                  "
                  value={draft.full_name ?? ""}
                  onChange={(e) => onChange("full_name", e.target.value)}
                  disabled={saving}
                  placeholder="Your full name"
                  aria-label="Full name"
                />
              )}

              <div className="mt-3 flex flex-wrap gap-5">
                {/* Strand */}
                <div className="min-w-32">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-[#64748B]">Strand</p>
                  {!editing ? (
                    <span className="mt-1 inline-block rounded-full border-2 border-[#1E293B] bg-[#FBBF24] px-3 py-1 text-sm font-bold text-[#1E293B] shadow-[3px_3px_0px_#1E293B]">
                      {draft.strand || "—"}
                    </span>
                  ) : (
                    <select
                      className="
                        mt-1 rounded-xl border-2 border-[#CBD5E1] bg-white
                        px-3 py-2 text-sm font-medium text-[#1E293B] outline-none
                        focus:border-[#8B5CF6] focus:shadow-[3px_3px_0px_#8B5CF6]
                        transition-all duration-200
                      "
                      value={draft.strand}
                      onChange={(e) => onChange("strand", e.target.value)}
                      disabled={saving}
                    >
                      <option value="">Select strand</option>
                      {Object.entries(STRANDS).map(([track, strands]) => (
                        <optgroup key={track} label={track}>
                          {strands.map((strand) => (
                            <option key={strand} value={strand}>{strand}</option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  )}
                </div>

                {/* Preferred Program */}
                <div className="min-w-40">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-[#64748B]">Preferred Program</p>
                  {!editing ? (
                    <span className="mt-1 inline-block rounded-full border-2 border-[#1E293B] bg-[#34D399] px-3 py-1 text-sm font-bold text-[#1E293B] shadow-[3px_3px_0px_#1E293B]">
                      {draft.preferred_program || "—"}
                    </span>
                  ) : (
                    <select
                      className="
                        mt-1 rounded-xl border-2 border-[#CBD5E1] bg-white
                        px-3 py-2 text-sm font-medium text-[#1E293B] outline-none
                        focus:border-[#8B5CF6] focus:shadow-[3px_3px_0px_#8B5CF6]
                        transition-all duration-200
                      "
                      value={draft.preferred_program}
                      onChange={(e) => onChange("preferred_program", e.target.value)}
                      disabled={saving}
                    >
                      <option value="">Select program</option>
                      {PROGRAMS.map((program) => (
                        <option key={program} value={program}>{program}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            </div>

            {/* Edit / Save / Cancel */}
            <div className="md:pt-20">
              {!editing ? (
                <button
                  className="
                    inline-flex items-center gap-2 rounded-full
                    border-2 border-[#1E293B] bg-white
                    px-5 py-2.5 text-sm font-bold text-[#1E293B]
                    shadow-[4px_4px_0px_#1E293B]
                    transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]
                    hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-[#FBBF24] hover:shadow-[6px_6px_0px_#1E293B]
                    active:-translate-x-0.5 active:-translate-y-0.5 active:bg-[#FBBF24] active:shadow-[6px_6px_0px_#1E293B]
                    focus-visible:-translate-x-0.5 focus-visible:-translate-y-0.5 focus-visible:bg-[#FBBF24] focus-visible:shadow-[6px_6px_0px_#1E293B]
                    min-h-12
                  "
                  onClick={startEdit}
                  type="button"
                >
                  <Pencil className="h-4 w-4" strokeWidth={2.5} />
                  Edit Profile
                </button>
              ) : (
                <div className="flex flex-wrap gap-3">
                  {/* Save */}
                  <button
                    className="
                      inline-flex items-center gap-2 rounded-full
                      border-2 border-[#1E293B] bg-[#34D399]
                      px-5 py-2.5 text-sm font-bold text-[#1E293B]
                      shadow-[4px_4px_0px_#1E293B]
                      transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]
                      hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#1E293B]
                      active:-translate-x-0.5 active:-translate-y-0.5 active:shadow-[6px_6px_0px_#1E293B]
                      focus-visible:-translate-x-0.5 focus-visible:-translate-y-0.5 focus-visible:shadow-[6px_6px_0px_#1E293B]
                      disabled:opacity-50 disabled:cursor-not-allowed
                      min-h-12
                    "
                    onClick={() => void saveAll()}
                    disabled={saving}
                    type="button"
                  >
                    <Save className="h-4 w-4" strokeWidth={2.5} />
                    Save
                  </button>

                  {/* Cancel */}
                  <button
                    className="
                      inline-flex items-center gap-2 rounded-full
                      border-2 border-[#1E293B] bg-[#F472B6]
                      px-5 py-2.5 text-sm font-bold text-[#1E293B]
                      shadow-[4px_4px_0px_#1E293B]
                      transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]
                      hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#1E293B]
                      active:-translate-x-0.5 active:-translate-y-0.5 active:shadow-[6px_6px_0px_#1E293B]
                      focus-visible:-translate-x-0.5 focus-visible:-translate-y-0.5 focus-visible:shadow-[6px_6px_0px_#1E293B]
                      disabled:opacity-50 disabled:cursor-not-allowed
                      min-h-12
                    "
                    onClick={cancelEdit}
                    disabled={saving}
                    type="button"
                  >
                    <X className="h-4 w-4" strokeWidth={2.5} />
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── Section Cards ────────────────────────────────────────────────── */}
        <div className="grid gap-6 xl:grid-cols-3">

          {/* Career Goals */}
          <SectionCard
            title="Career Goals"
            editable={editing}
            accentColor="bg-[#8B5CF6]"
            onChangeIcon={() => openSectionIconPicker("career")}
            icon={
              <SectionIconPreview
                image={careerIconImage}
                alt="Career Goals"
                fallback={<Target className="h-4 w-4" strokeWidth={2.5} />}
              />
            }
          >
            {!editing ? (
              <p className="text-sm leading-7 text-[#64748B]">
                {draft.career_goals || "Become a web developer"}
              </p>
            ) : (
              <textarea
                className="
                  w-full resize-y rounded-xl border-2 border-[#CBD5E1] bg-white
                  px-4 py-3 text-sm text-[#1E293B] outline-none
                  shadow-[4px_4px_0px_transparent]
                  transition-all duration-200
                  focus:border-[#8B5CF6] focus:shadow-[4px_4px_0px_#8B5CF6]
                  font-['Plus_Jakarta_Sans',system-ui,sans-serif]
                "
                value={draft.career_goals}
                onChange={(e) => onChange("career_goals", e.target.value)}
                placeholder="Type your career goals"
                disabled={saving}
                rows={5}
              />
            )}
          </SectionCard>

          {/* Interests */}
          <SectionCard
            title="Interests"
            editable={editing}
            accentColor="bg-[#F472B6]"
            onChangeIcon={() => openSectionIconPicker("interests")}
            icon={
              <SectionIconPreview
                image={interestsIconImage}
                alt="Interests"
                fallback={<Heart className="h-4 w-4" strokeWidth={2.5} />}
              />
            }
          >
            <div className="flex flex-wrap gap-2">
              {visibleInterestChips.map((item, index) => {
                const active = selectedInterests.includes(item);
                return (
                  <button
                    key={`${item}-${index}`}
                    type="button"
                    className={`
                      rounded-full border-2 px-3 py-1.5 text-xs font-semibold
                      shadow-[2px_2px_0px_#1E293B]
                      transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]
                      hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_#1E293B]
                      active:-translate-y-0.5 active:shadow-[3px_3px_0px_#1E293B]
                      focus-visible:-translate-y-0.5 focus-visible:shadow-[3px_3px_0px_#1E293B]
                      disabled:opacity-60 disabled:cursor-not-allowed
                      min-h-9
                      ${active
                        ? getChipActiveStyle(index)
                        : "border-[#E2E8F0] bg-white text-[#64748B] hover:border-[#1E293B] active:border-[#1E293B] focus-visible:border-[#1E293B]"
                      }
                    `}
                    onClick={() => editing && toggleMultiSelect("interests", item)}
                    disabled={!editing || saving}
                    title={item}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
          </SectionCard>

          {/* Skills */}
          <SectionCard
            title="Skills"
            editable={editing}
            accentColor="bg-[#FBBF24]"
            onChangeIcon={() => openSectionIconPicker("skills")}
            icon={
              <SectionIconPreview
                image={skillsIconImage}
                alt="Skills"
                fallback={<Lightbulb className="h-4 w-4" strokeWidth={2.5} />}
              />
            }
          >
            <div className="flex flex-wrap gap-2">
              {visibleSkillChips.map((item, index) => {
                const active = selectedSkills.includes(item);
                return (
                  <button
                    key={`${item}-${index}`}
                    type="button"
                    className={`
                      rounded-full border-2 px-3 py-1.5 text-xs font-semibold
                      shadow-[2px_2px_0px_#1E293B]
                      transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]
                      hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_#1E293B]
                      active:-translate-y-0.5 active:shadow-[3px_3px_0px_#1E293B]
                      focus-visible:-translate-y-0.5 focus-visible:shadow-[3px_3px_0px_#1E293B]
                      disabled:opacity-60 disabled:cursor-not-allowed
                      min-h-9
                      ${active
                        ? getChipActiveStyle(index)
                        : "border-[#E2E8F0] bg-white text-[#64748B] hover:border-[#1E293B] active:border-[#1E293B] focus-visible:border-[#1E293B]"
                      }
                    `}
                    onClick={() => editing && toggleMultiSelect("skills", item)}
                    disabled={!editing || saving}
                    title={item}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
          </SectionCard>
        </div>

        {/* Hidden file inputs for section icons */}
        <input ref={careerIconInputRef} type="file" accept="image/*" onChange={(e) => void handleSectionIconChange(e, "career")} style={{ display: "none" }} />
        <input ref={interestsIconInputRef} type="file" accept="image/*" onChange={(e) => void handleSectionIconChange(e, "interests")} style={{ display: "none" }} />
        <input ref={skillsIconInputRef} type="file" accept="image/*" onChange={(e) => void handleSectionIconChange(e, "skills")} style={{ display: "none" }} />

        {/* ── Latest Learned ──────────────────────────────────────────────── */}
        <section className="relative overflow-hidden rounded-xl border-2 border-[#1E293B] bg-white p-5 shadow-[6px_6px_0px_0px_#E2E8F0]">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: "radial-gradient(circle, #1E293B 1.5px, transparent 1.5px)",
              backgroundSize: "18px 18px",
            }}
          />

          <div className="relative flex items-center gap-3">
            <span className="rounded-full border-2 border-[#1E293B] bg-[#8B5CF6] px-3 py-1 text-xs font-bold text-white shadow-[3px_3px_0px_#1E293B]">
              Learning
            </span>
            <h3 className="text-[20px] font-black text-[#1E293B]" style={{ fontFamily: "Outfit, system-ui, sans-serif" }}>
              Latest Learned
            </h3>
          </div>

          {marqueeItems.length > 0 ? (
            <div className="relative mt-5 overflow-hidden">
              <div
                className={`flex w-max gap-4 ${
                  latestLearns.length <= 1 ? "" : "animate-[marquee_22s_linear_infinite]"
                } hover:paused`}
                style={{ touchAction: "pan-x" }}
              >
                {marqueeItems.map((item, index) => (
                  <button
                    key={`${item.id}-${item.course_id}-${item.lesson_index}-${index}`}
                    type="button"
                    className="
                      relative h-24 w-40 shrink-0 overflow-hidden
                      rounded-xl border-2 border-[#1E293B]
                      shadow-[4px_4px_0px_#1E293B] bg-[#111]
                      transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]
                      hover:-translate-y-1 hover:rotate-1 hover:shadow-[6px_6px_0px_#8B5CF6]
                      active:-translate-y-1 active:rotate-1 active:shadow-[6px_6px_0px_#8B5CF6]
                      focus-visible:-translate-y-1 focus-visible:rotate-1 focus-visible:shadow-[6px_6px_0px_#8B5CF6]
                      min-h-11
                    "
                    onClick={() => navigate(`/courses/${item.course_id}`)}
                    title={item.course_title}
                  >
                    <img
                      src={getLatestLearnImage(item.course_title)}
                      alt={item.course_title}
                      className="h-full w-full object-cover"
                    />
                    <span
                      className={`
                        absolute bottom-1.5 right-1.5
                        rounded-full border border-[#1E293B] px-2 py-0.5 text-[10px] font-bold
                        ${item.status === "completed" ? "bg-[#34D399] text-[#1E293B]" : "bg-[#FBBF24] text-[#1E293B]"}
                      `}
                    >
                      {item.status === "completed" ? "✓ Done" : "In progress"}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded-xl border-2 border-dashed border-[#CBD5E1] p-5 text-center text-sm font-medium text-[#64748B]">
              <span className="mr-1 text-lg">📚</span>
              No latest learn yet — start a course!
            </div>
          )}

          {latestLearnError && (
            <div className="mt-4 rounded-xl border-2 border-[#1E293B] bg-[#FFF1F1] px-4 py-3 text-sm font-semibold text-[#1E293B] shadow-[4px_4px_0px_#F472B6]">
              {latestLearnError}
            </div>
          )}
        </section>

        {/* ── Global Error ─────────────────────────────────────────────────── */}
        {error && (
          <div className="rounded-xl border-2 border-[#1E293B] bg-[#FFF1F1] px-4 py-3 text-sm font-semibold text-[#1E293B] shadow-[4px_4px_0px_#F472B6]">
            {error}
          </div>
        )}
      </div>

      {/* ── Right Sidebar ─────────────────────────────────────────────────── */}
      <div className="min-w-0">
        <DashboardRightWidgets courseCount={Object.keys(COURSE_IMAGES).length} />
      </div>

      {/* ── Global keyframes + touch-hover CSS ───────────────────────────── */}
      <style>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(calc(-50% - 8px)); }
        }
        @keyframes bounce {
          from { transform: translateY(0); }
          to   { transform: translateY(-8px); }
        }

        /* ── Touch-hover: fires the same visual as :hover on tap ── */
        .section-card.is-touch-hover {
          --tw-rotate: -1deg;
          --tw-scale-x: 1.02;
          --tw-scale-y: 1.02;
          transform: rotate(-1deg) scale(1.02);
          box-shadow: 8px 8px 0px 0px #F472B6;
        }
        .note-bubble.is-touch-hover {
          transform: translateY(-2px);
          box-shadow: 6px 6px 0px #8B5CF6;
        }

        @media (prefers-reduced-motion: reduce) {
          * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
        }
      `}</style>
    </section>
  );
}