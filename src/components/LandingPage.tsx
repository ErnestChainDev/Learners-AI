import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Target,
  Bot,
  Search,
  Zap,
  Shield,
  LayoutDashboard,
  BookOpen,
  Brain,
  ClipboardList,
  MessageCircle,
  Star,
  GraduationCap,
  Laptop,
  Building2,
  CheckCircle2,
  ChevronDown,
  Menu,
  X,
} from "lucide-react";

/* ─── helpers ─────────────────────────────────────────────────── */
const useReducedMotion = () => {
  const [reduced, setReduced] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const h = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, []);
  return reduced;
};

/* ─── global animation styles ─────────────────────────────────── */
const AnimationStyles = () => (
  <style>{`
    @keyframes popIn {
      from { opacity: 0; transform: scale(0.85); }
      to   { opacity: 1; transform: scale(1); }
    }

    /* Gentle up-down float */
    @keyframes floatY {
      0%, 100% { transform: translateY(0px); }
      50%       { transform: translateY(-18px); }
    }

    /* Diagonal drift with slight rotation */
    @keyframes driftA {
      0%   { transform: translate(0px, 0px)   rotate(0deg); }
      25%  { transform: translate(8px, -12px) rotate(8deg); }
      50%  { transform: translate(16px, 0px)  rotate(0deg); }
      75%  { transform: translate(8px,  12px) rotate(-8deg); }
      100% { transform: translate(0px, 0px)   rotate(0deg); }
    }

    /* Opposite-direction drift */
    @keyframes driftB {
      0%   { transform: translate(0px,  0px)  rotate(0deg); }
      25%  { transform: translate(-8px, 12px) rotate(-6deg); }
      50%  { transform: translate(-14px, 0px) rotate(0deg); }
      75%  { transform: translate(-8px,-12px) rotate(6deg); }
      100% { transform: translate(0px,  0px)  rotate(0deg); }
    }

    /* Slow panning for dot grids */
    @keyframes panGrid {
      0%   { transform: translate(0px, 0px); }
      50%  { transform: translate(-12px, -10px); }
      100% { transform: translate(0px, 0px); }
    }

    /* Slow pulse scale for large bg blobs */
    @keyframes blobPulse {
      0%, 100% { transform: scale(1); }
      50%       { transform: scale(1.12); }
    }

    /* Orbiting dots inside About section */
    @keyframes orbitSpin {
      from { transform: rotate(0deg) translateX(0px); }
      to   { transform: rotate(360deg) translateX(0px); }
    }
  `}</style>
);

/* ─── tiny primitives ─────────────────────────────────────────── */
const Badge = ({ children, color }: { children: React.ReactNode; color?: string }) => (
  <span
    style={{ background: color ?? "#8B5CF6", color: "#fff", border: "2px solid #1E293B" }}
    className="inline-block px-4 py-1 rounded-full text-sm font-bold tracking-wide"
  >
    {children}
  </span>
);

const PrimaryBtn = ({
  children,
  href,
  to,
  onClick,
}: {
  children: React.ReactNode;
  href?: string;
  to?: string;
  onClick?: () => void;
}) => {
  const navigate = useNavigate();
  const handleClick = () => {
    if (onClick) onClick();
    else if (to) navigate(to);
  };

  if (href) {
    return (
      <a
        href={href}
        className="group inline-flex items-center gap-3 px-6 py-3 rounded-full font-bold text-white text-base border-2 border-slate-800 transition-all duration-300 active:translate-x-0.5 active:translate-y-0.5"
        style={{ background: "#8B5CF6", boxShadow: "4px 4px 0px #1E293B", transitionTimingFunction: "cubic-bezier(0.34,1.56,0.64,1)", cursor: "pointer" }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "6px 6px 0px #1E293B"; (e.currentTarget as HTMLElement).style.transform = "translate(-2px,-2px)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "4px 4px 0px #1E293B"; (e.currentTarget as HTMLElement).style.transform = "translate(0,0)"; }}
      >
        {children}
        <span className="flex items-center justify-center w-7 h-7 rounded-full bg-white/30">
          <ArrowRight size={14} strokeWidth={2.5} />
        </span>
      </a>
    );
  }

  return (
    <button
      onClick={handleClick}
      className="group inline-flex items-center gap-3 px-6 py-3 rounded-full font-bold text-white text-base border-2 border-slate-800 transition-all duration-300 active:translate-x-0.5 active:translate-y-0.5"
      style={{ background: "#8B5CF6", boxShadow: "4px 4px 0px #1E293B", transitionTimingFunction: "cubic-bezier(0.34,1.56,0.64,1)", cursor: "pointer" }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "6px 6px 0px #1E293B"; (e.currentTarget as HTMLElement).style.transform = "translate(-2px,-2px)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "4px 4px 0px #1E293B"; (e.currentTarget as HTMLElement).style.transform = "translate(0,0)"; }}
    >
      {children}
      <span className="flex items-center justify-center w-7 h-7 rounded-full bg-white/30">
        <ArrowRight size={14} strokeWidth={2.5} />
      </span>
    </button>
  );
};

const SecondaryBtn = ({ children, href }: { children: React.ReactNode; href?: string }) => {
  const Tag = href ? "a" : "button";
  return (
    <Tag
      href={href}
      className="group inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-slate-800 text-base border-2 border-slate-800 bg-transparent transition-all duration-300"
      style={{ transitionTimingFunction: "cubic-bezier(0.34,1.56,0.64,1)" }}
      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "#FBBF24")}
      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
    >
      {children}
    </Tag>
  );
};

/* ─── decorative shapes ───────────────────────────────────────── */

/**
 * DotGrid — now accepts an animationStyle prop so callers can
 * opt into the panGrid animation (or pass "none" to keep static).
 */
const DotGrid = ({
  className,
  animationStyle = "none",
}: {
  className?: string;
  animationStyle?: string;
}) => (
  <svg
    className={`absolute pointer-events-none select-none ${className}`}
    width="200"
    height="200"
    aria-hidden
    style={{ animation: animationStyle }}
  >
    <defs>
      <pattern id="dots" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
        <circle cx="2" cy="2" r="1.5" fill="#1E293B" fillOpacity="0.12" />
      </pattern>
    </defs>
    <rect width="200" height="200" fill="url(#dots)" />
  </svg>
);

const Squiggle = ({ color = "#8B5CF6", className }: { color?: string; className?: string }) => (
  <svg viewBox="0 0 200 20" className={`w-40 h-5 ${className}`} aria-hidden>
    <path
      d="M0 10 Q25 0 50 10 Q75 20 100 10 Q125 0 150 10 Q175 20 200 10"
      fill="none"
      stroke={color}
      strokeWidth="3"
      strokeLinecap="round"
    />
  </svg>
);

/**
 * FloatCircle — animates by default with floatY.
 * Pass animationName="driftA" | "driftB" | "blobPulse" for variety.
 * Pass duration / delay for staggering.
 */
const FloatCircle = ({
  size = 80,
  color,
  className,
  animationName = "floatY",
  duration = "6s",
  delay = "0s",
}: {
  size?: number;
  color: string;
  className?: string;
  animationName?: string;
  duration?: string;
  delay?: string;
}) => {
  const reduced = useReducedMotion();
  return (
    <div
      aria-hidden
      className={`absolute rounded-full pointer-events-none select-none ${className}`}
      style={{
        width: size,
        height: size,
        background: color,
        opacity: 0.18,
        border: "2px solid #1E293B",
        animation: reduced
          ? "none"
          : `${animationName} ${duration} ease-in-out ${delay} infinite`,
      }}
    />
  );
};

/**
 * FloatTriangle — animates with driftA or driftB by default.
 */
const FloatTriangle = ({
  color,
  className,
  animationName = "driftA",
  duration = "7s",
  delay = "0s",
}: {
  color: string;
  className?: string;
  animationName?: string;
  duration?: string;
  delay?: string;
}) => {
  const reduced = useReducedMotion();
  return (
    <svg
      aria-hidden
      className={`absolute pointer-events-none select-none ${className}`}
      width="40"
      height="40"
      viewBox="0 0 40 40"
      style={{
        animation: reduced
          ? "none"
          : `${animationName} ${duration} ease-in-out ${delay} infinite`,
      }}
    >
      <polygon
        points="20,4 36,36 4,36"
        fill={color}
        fillOpacity="0.22"
        stroke="#1E293B"
        strokeWidth="1.5"
      />
    </svg>
  );
};

/* ─── section heading ─────────────────────────────────────────── */
const SectionHeading = ({
  badge,
  title,
  sub,
  badgeColor,
}: {
  badge: string;
  title: React.ReactNode;
  sub?: string;
  badgeColor?: string;
}) => (
  <div className="text-center mb-16">
    <Badge color={badgeColor}>{badge}</Badge>
    <h2
      className="mt-4 text-4xl md:text-5xl font-extrabold text-slate-800 leading-tight"
      style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
    >
      {title}
    </h2>
    {sub && (
      <p
        className="mt-4 text-slate-500 text-lg max-w-2xl mx-auto"
        style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
      >
        {sub}
      </p>
    )}
  </div>
);

/* ─── Nav ─────────────────────────────────────────────────────── */
const Nav = () => {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

  const links = ["About", "Why Us", "How It Works", "Features", "For Who"];

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: scrolled ? "rgba(255,253,245,0.95)" : "transparent",
        backdropFilter: scrolled ? "blur(8px)" : "none",
        borderBottom: scrolled ? "2px solid #E2E8F0" : "none",
      }}
    >
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center border-2 border-slate-800"
            style={{ background: "#8B5CF6", boxShadow: "2px 2px 0 #1E293B" }}
          >
            <Brain size={16} color="white" strokeWidth={2.5} />
          </div>
          <span
            className="font-extrabold text-slate-800 text-lg"
            style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
          >
            Learner's <span style={{ color: "#8B5CF6" }}>AI</span>
          </span>
        </div>

        <ul className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <li key={l}>
              <a
                href={`#${l.toLowerCase().replace(/\s+/g, "-")}`}
                className="font-medium text-slate-600 hover:text-violet-600 transition-colors"
                style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
              >
                {l}
              </a>
            </li>
          ))}
        </ul>

        <div className="hidden md:block">
          <PrimaryBtn to="/register">Get Started</PrimaryBtn>
        </div>

        <button
          className="md:hidden p-2 rounded-lg border-2 border-slate-800"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X size={20} strokeWidth={2.5} /> : <Menu size={20} strokeWidth={2.5} />}
        </button>
      </div>

      {open && (
        <div className="md:hidden bg-[#FFFDF5] border-t-2 border-slate-800 px-6 py-4 flex flex-col gap-4">
          {links.map((l) => (
            <a
              key={l}
              href={`#${l.toLowerCase().replace(/\s+/g, "-")}`}
              className="font-medium text-slate-700 py-2"
              onClick={() => setOpen(false)}
            >
              {l}
            </a>
          ))}
          <PrimaryBtn to="/register">Get Started</PrimaryBtn>
        </div>
      )}
    </nav>
  );
};

/* ─── HERO ────────────────────────────────────────────────────── */
const Hero = () => {
  const reduced = useReducedMotion();

  return (
    <section
      className="relative min-h-screen flex items-center overflow-hidden pt-24 pb-16"
      style={{ background: "#FFFDF5" }}
    >
      {/* Large blob — blobPulse */}
      <div
        aria-hidden
        className="absolute -top-20 -left-20 w-125 h-125 rounded-full"
        style={{
          background: "#FBBF24",
          opacity: 0.18,
          border: "2px solid #1E293B",
          animation: reduced ? "none" : "blobPulse 8s ease-in-out infinite",
        }}
      />

      {/* Dot grid — panning */}
      <DotGrid
        className="right-0 top-40 opacity-70"
        animationStyle={reduced ? "none" : "panGrid 12s ease-in-out infinite"}
      />

      {/* Floating shapes — staggered delays & directions */}
      <FloatCircle
        size={60}
        color="#F472B6"
        className="top-32 right-1/4"
        animationName="floatY"
        duration="5s"
        delay="0s"
      />
      <FloatTriangle
        color="#34D399"
        className="bottom-32 left-1/4"
        animationName="driftB"
        duration="7s"
        delay="1s"
      />
      <FloatCircle
        size={30}
        color="#8B5CF6"
        className="bottom-40 right-16"
        animationName="floatY"
        duration="4s"
        delay="1.5s"
      />
      <FloatTriangle
        color="#F472B6"
        className="top-48 left-1/3"
        animationName="driftA"
        duration="9s"
        delay="0.5s"
      />

      <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center w-full">
        {/* Left */}
        <div
          style={{
            animation: reduced ? "none" : "popIn 0.6s cubic-bezier(0.34,1.56,0.64,1) both",
          }}
        >
          <div className="mb-4">
            <Badge color="#34D399">✨ Powered by Explainable AI</Badge>
          </div>

          <h1
            className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-slate-800 leading-[1.1] mb-6"
            style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
          >
            Smarter Course Decisions{" "}
            <span className="relative inline-block">
              <span style={{ color: "#8B5CF6" }}>Start Here</span>
              <Squiggle color="#FBBF24" className="absolute -bottom-2 left-0 w-full" />
            </span>{" "}
            with <span style={{ color: "#F472B6" }}>Learner's AI</span>
          </h1>

          <p
            className="text-lg text-slate-500 mb-8 max-w-lg leading-relaxed"
            style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
          >
            An intelligent course recommendation system powered by Explainable Artificial
            Intelligence that helps students choose the right academic path based on their
            interests, skills, and goals.
          </p>

          <div className="flex flex-wrap gap-4">
            <PrimaryBtn to="/register">Get Started</PrimaryBtn>
            <SecondaryBtn>Take Career Quiz</SecondaryBtn>
          </div>

          <div className="flex flex-wrap gap-3 mt-10">
            {[
              { n: "5K+", l: "Students" },
              { n: "98%", l: "Satisfaction" },
              { n: "200+", l: "Courses" },
            ].map(({ n, l }) => (
              <div
                key={l}
                className="flex items-center gap-2 px-4 py-2 rounded-full border-2 border-slate-800 bg-white"
                style={{ boxShadow: "3px 3px 0 #1E293B" }}
              >
                <span
                  className="font-extrabold text-slate-800"
                  style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
                >
                  {n}
                </span>
                <span
                  className="text-slate-500 text-sm"
                  style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
                >
                  {l}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right – Illustration card */}
        <div
          className="relative flex justify-center items-center"
          style={{
            animation: reduced ? "none" : "popIn 0.7s 0.15s cubic-bezier(0.34,1.56,0.64,1) both",
          }}
        >
          <DotGrid
            className="left-0 top-0 w-full h-full opacity-40"
            animationStyle={reduced ? "none" : "panGrid 15s ease-in-out infinite reverse"}
          />

          {/* Main card */}
          <div
            className="relative z-10 bg-white rounded-2xl border-2 border-slate-800 p-6 w-full max-w-sm"
            style={{ boxShadow: "8px 8px 0 #8B5CF6" }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center border-2 border-slate-800"
                style={{ background: "#8B5CF6" }}
              >
                <Brain size={18} color="white" strokeWidth={2.5} />
              </div>
              <div>
                <p
                  className="font-bold text-slate-800 text-sm"
                  style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
                >
                  AI Analysis Complete
                </p>
                <p
                  className="text-xs text-slate-400"
                  style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
                >
                  Based on your profile
                </p>
              </div>
              <div className="ml-auto w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
            </div>

            {[
              { label: "Computer Science", pct: 94, color: "#8B5CF6" },
              { label: "Information Tech", pct: 81, color: "#F472B6" },
              { label: "Data Science", pct: 75, color: "#FBBF24" },
              { label: "Software Eng.", pct: 68, color: "#34D399" },
            ].map(({ label, pct, color }) => (
              <div key={label} className="mb-3">
                <div className="flex justify-between text-xs mb-1">
                  <span
                    className="font-medium text-slate-700"
                    style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
                  >
                    {label}
                  </span>
                  <span className="font-bold" style={{ color }}>
                    {pct}%
                  </span>
                </div>
                <div className="h-3 rounded-full bg-slate-100 border border-slate-200 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${pct}%`, background: color }}
                  />
                </div>
              </div>
            ))}

            <div
              className="mt-5 p-3 rounded-xl border-2 border-slate-200 flex items-center gap-2"
              style={{ background: "#F0FDF4" }}
            >
              <CheckCircle2 size={16} color="#34D399" strokeWidth={2.5} />
              <p
                className="text-xs font-medium text-slate-600"
                style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
              >
                Top Pick: <strong>Computer Science</strong> — 94% match!
              </p>
            </div>
          </div>

          {/* Floating mini badges */}
          <div
            className="absolute -top-4 -right-4 z-20 bg-[#FBBF24] border-2 border-slate-800 rounded-xl px-3 py-2"
            style={{
              boxShadow: "3px 3px 0 #1E293B",
              animation: reduced ? "none" : "floatY 4s ease-in-out infinite",
              transform: "rotate(6deg)",
            }}
          >
            <span
              className="text-xs font-bold text-slate-800"
              style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
            >
              ✨ XAI Powered
            </span>
          </div>
          <div
            className="absolute -bottom-4 -left-4 z-20 bg-[#F472B6] border-2 border-slate-800 rounded-xl px-3 py-2"
            style={{
              boxShadow: "3px 3px 0 #1E293B",
              animation: reduced ? "none" : "floatY 5s ease-in-out 0.8s infinite",
              transform: "rotate(-5deg)",
            }}
          >
            <span
              className="text-xs font-bold text-white"
              style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
            >
              🎯 Personalized
            </span>
          </div>
        </div>
      </div>

      {/* Scroll hint */}
      <div className="absolute bottom-4 sm:bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 opacity-50 z-20">
        <span
          className="text-xs text-slate-500"
          style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
        >
          Scroll to explore
        </span>
        <ChevronDown size={16} className="animate-bounce" />
      </div>
    </section>
  );
};

/* ─── ABOUT ───────────────────────────────────────────────────── */
const About = () => {
  const reduced = useReducedMotion();

  return (
    <section
      id="about"
      className="py-24 relative overflow-hidden"
      style={{ background: "#F1F5F9" }}
    >
      <FloatCircle
        size={120}
        color="#8B5CF6"
        className="-top-10 -right-10"
        animationName="floatY"
        duration="7s"
        delay="0.3s"
      />
      <FloatTriangle
        color="#FBBF24"
        className="bottom-8 left-8"
        animationName="driftA"
        duration="8s"
        delay="1s"
      />

      <div className="max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Graphic left — orbiting dots now spin around the circle */}
          <div className="relative flex justify-center">
            <div
              className="w-64 h-64 rounded-full flex items-center justify-center border-2 border-slate-800"
              style={{ background: "#8B5CF6", boxShadow: "10px 10px 0 #1E293B" }}
            >
              <div
                className="w-44 h-44 rounded-full flex items-center justify-center border-2 border-white/40"
                style={{ background: "rgba(255,255,255,0.15)" }}
              >
                <Brain size={72} color="white" strokeWidth={2.5} />
              </div>
            </div>

            {/* Orbit ring wrapper — spins slowly */}
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{
                animation: reduced ? "none" : "orbitSpin 12s linear infinite",
              }}
            >
              {[0, 90, 180, 270].map((deg) => (
                <div
                  key={deg}
                  className="absolute w-5 h-5 rounded-full border-2 border-slate-800"
                  style={{
                    background: ["#F472B6", "#FBBF24", "#34D399", "#8B5CF6"][deg / 90],
                    top: `${50 + 48 * Math.sin((deg * Math.PI) / 180)}%`,
                    left: `${50 + 48 * Math.cos((deg * Math.PI) / 180)}%`,
                    transform: "translate(-50%,-50%)",
                    boxShadow: "2px 2px 0 #1E293B",
                  }}
                />
              ))}
            </div>
          </div>

          {/* Text right */}
          <div>
            <Badge color="#8B5CF6">What is Learner's AI?</Badge>
            <h2
              className="mt-4 text-4xl md:text-5xl font-extrabold text-slate-800 leading-tight mb-6"
              style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
            >
              Your Smart Academic{" "}
              <span style={{ color: "#8B5CF6" }}>Decision Partner</span>
            </h2>
            <p
              className="text-slate-500 text-lg leading-relaxed mb-6"
              style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
            >
              Learner's AI is a smart academic decision-support platform designed to guide
              students in selecting the most suitable courses. By analyzing your quiz
              performance, skills, preferences, and career interests, the system provides
              personalized and explainable recommendations to help you make informed decisions.
            </p>
            <div className="flex gap-4 flex-wrap">
              <PrimaryBtn to="/register">Learn More</PrimaryBtn>
              <SecondaryBtn>See Demo</SecondaryBtn>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

/* ─── WHY CHOOSE ──────────────────────────────────────────────── */
const whyItems = [
  {
    icon: Target,
    title: "Personalized Recommendations",
    desc: "Get course suggestions tailored to your skills, interests, and academic performance.",
    color: "#8B5CF6",
    shadow: "#8B5CF6",
  },
  {
    icon: Bot,
    title: "AI-Powered Insights",
    desc: "Uses advanced techniques like clustering and content-based filtering to ensure accurate results.",
    color: "#F472B6",
    shadow: "#F472B6",
  },
  {
    icon: Search,
    title: "Explainable Results",
    desc: "Understand why a course is recommended to you — not just what to choose.",
    color: "#FBBF24",
    shadow: "#E2E8F0",
  },
  {
    icon: Zap,
    title: "Faster Decision-Making",
    desc: "Reduce confusion and save time during course selection.",
    color: "#34D399",
    shadow: "#E2E8F0",
  },
  {
    icon: Shield,
    title: "Secure & Reliable",
    desc: "Your data is protected and used responsibly for better recommendations.",
    color: "#F472B6",
    shadow: "#F472B6",
  },
];

const WhyChoose = () => (
  <section
    id="why-us"
    className="py-24 relative overflow-hidden"
    style={{ background: "#FFFDF5" }}
  >
    <FloatCircle
      size={80}
      color="#F472B6"
      className="top-10 right-10"
      animationName="floatY"
      duration="6s"
      delay="0.2s"
    />
    <FloatTriangle
      color="#8B5CF6"
      className="bottom-10 left-10"
      animationName="driftB"
      duration="8s"
      delay="0.8s"
    />

    <div className="max-w-6xl mx-auto px-6">
      <SectionHeading
        badge="Why Choose Us"
        title={
          <>
            Why Choose <span style={{ color: "#8B5CF6" }}>Learner's AI</span>?
          </>
        }
        sub="Everything you need for smarter academic decisions, all in one platform."
        badgeColor="#F472B6"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {whyItems.map(({ icon: Icon, title, desc, color, shadow }) => (
          <div
            key={title}
            className="group bg-white rounded-2xl border-2 border-slate-800 p-6 relative cursor-default transition-all duration-300"
            style={{
              boxShadow: `8px 8px 0 ${shadow}`,
              transitionTimingFunction: "cubic-bezier(0.34,1.56,0.64,1)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.transform = "rotate(-1deg) scale(1.02)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.transform = "rotate(0deg) scale(1)";
            }}
          >
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center border-2 border-slate-800 mb-5"
              style={{ background: color, boxShadow: "3px 3px 0 #1E293B" }}
            >
              <Icon size={22} color="white" strokeWidth={2.5} />
            </div>
            <h3
              className="text-xl font-bold text-slate-800 mb-2"
              style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
            >
              {title}
            </h3>
            <p
              className="text-slate-500 leading-relaxed"
              style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
            >
              {desc}
            </p>
            <div
              className="absolute top-4 right-4 w-4 h-4 rounded-full border border-slate-200"
              style={{ background: color, opacity: 0.3 }}
            />
          </div>
        ))}
      </div>
    </div>
  </section>
);

/* ─── HOW IT WORKS ────────────────────────────────────────────── */
const steps = [
  { n: 1, title: "Create Your Profile", desc: "Input your skills, interests, and academic background.", color: "#8B5CF6" },
  { n: 2, title: "Take the Career Quiz", desc: "Answer simple questions to assess your strengths and preferences.", color: "#F472B6" },
  { n: 3, title: "AI Analysis", desc: "The system processes your data using intelligent algorithms.", color: "#FBBF24" },
  { n: 4, title: "Get Recommendations", desc: "Receive a ranked list of courses best suited for you.", color: "#34D399" },
  { n: 5, title: "Improve Over Time", desc: "Your feedback helps the system become smarter and more accurate.", color: "#8B5CF6" },
];

const HowItWorks = () => (
  <section
    id="how-it-works"
    className="py-24 relative overflow-hidden"
    style={{ background: "#1E293B" }}
  >
    <div aria-hidden className="absolute inset-0 opacity-5">
      <svg width="100%" height="100%">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M40 0L0 0 0 40" fill="none" stroke="white" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
    </div>

    <div className="max-w-6xl mx-auto px-6 relative z-10">
      <div className="text-center mb-16">
        <Badge color="#FBBF24">How It Works</Badge>
        <h2
          className="mt-4 text-4xl md:text-5xl font-extrabold text-white leading-tight"
          style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
        >
          Five Simple Steps to Your{" "}
          <span style={{ color: "#FBBF24" }}>Perfect Course</span>
        </h2>
      </div>

      <div className="relative">
        <div
          aria-hidden
          className="hidden lg:block absolute top-10 left-[10%] right-[10%] h-0.5"
          style={{
            background:
              "repeating-linear-gradient(90deg,#8B5CF6 0,#8B5CF6 8px,transparent 8px,transparent 20px)",
          }}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {steps.map(({ n, title, desc, color }) => (
            <div key={n} className="flex flex-col items-center text-center group">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center border-2 border-white/30 mb-5 relative z-10 transition-all duration-300"
                style={{
                  background: color,
                  boxShadow: `4px 4px 0 ${color}55`,
                  transitionTimingFunction: "cubic-bezier(0.34,1.56,0.64,1)",
                }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLElement).style.transform =
                    "scale(1.15) rotate(5deg)")
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLElement).style.transform =
                    "scale(1) rotate(0deg)")
                }
              >
                <span
                  className="text-3xl font-extrabold text-white"
                  style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
                >
                  {n}
                </span>
              </div>
              <h3
                className="font-bold text-white text-base mb-2"
                style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
              >
                {title}
              </h3>
              <p
                className="text-slate-400 text-sm leading-relaxed"
                style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
              >
                {desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-center mt-12">
        <PrimaryBtn to="/register">Get Started Now</PrimaryBtn>
      </div>
    </div>
  </section>
);

/* ─── FEATURES ────────────────────────────────────────────────── */
const features = [
  { icon: LayoutDashboard, label: "Smart Dashboard", desc: "Personalized suggestions at a glance.", color: "#8B5CF6" },
  { icon: BookOpen, label: "Course Browsing", desc: "Browse by category, interest, or career path.", color: "#F472B6" },
  { icon: Brain, label: "AI Recommendation Engine", desc: "Intelligent algorithms that understand you.", color: "#FBBF24" },
  { icon: ClipboardList, label: "Career Path Quiz", desc: "Interactive assessment to surface your strengths.", color: "#34D399" },
  { icon: MessageCircle, label: "AI Chat Assistant", desc: "Ask questions, get answers, anytime.", color: "#8B5CF6" },
  { icon: Star, label: "Feedback System", desc: "Continuous improvement through your ratings.", color: "#F472B6" },
];

const Features = () => (
  <section
    id="features"
    className="py-24 relative overflow-hidden"
    style={{ background: "#FFFDF5" }}
  >
    <DotGrid
      className="left-0 top-0"
      animationStyle="panGrid 14s ease-in-out infinite"
    />
    <FloatCircle
      size={100}
      color="#34D399"
      className="-bottom-10 -right-10"
      animationName="floatY"
      duration="7s"
      delay="0.4s"
    />

    <div className="max-w-6xl mx-auto px-6 relative z-10">
      <SectionHeading
        badge="Key Features"
        title={
          <>
            Everything You Need,{" "}
            <span style={{ color: "#F472B6" }}>All in One Place</span>
          </>
        }
        badgeColor="#34D399"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map(({ icon: Icon, label, desc, color }) => (
          <div
            key={label}
            className="group flex gap-4 bg-white rounded-2xl border-2 border-slate-800 p-5 transition-all duration-300 cursor-default"
            style={{
              boxShadow: "6px 6px 0 #E2E8F0",
              transitionTimingFunction: "cubic-bezier(0.34,1.56,0.64,1)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.boxShadow = `6px 6px 0 ${color}`;
              (e.currentTarget as HTMLElement).style.transform = "translate(-2px,-2px)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.boxShadow = "6px 6px 0 #E2E8F0";
              (e.currentTarget as HTMLElement).style.transform = "translate(0,0)";
            }}
          >
            <div
              className="shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center border-2 border-slate-800"
              style={{ background: color, boxShadow: "2px 2px 0 #1E293B" }}
            >
              <Icon size={20} color="white" strokeWidth={2.5} />
            </div>
            <div>
              <h3
                className="font-bold text-slate-800 mb-1"
                style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
              >
                {label}
              </h3>
              <p
                className="text-slate-500 text-sm leading-relaxed"
                style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
              >
                {desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

/* ─── WHO IS THIS FOR ─────────────────────────────────────────── */
const audience = [
  {
    icon: GraduationCap,
    title: "Senior High School Students",
    desc: "Choosing your college course for the first time? Let AI guide your path.",
    color: "#8B5CF6",
    bg: "#EDE9FE",
  },
  {
    icon: Laptop,
    title: "College Students",
    desc: "Exploring better academic paths or considering a shift? We've got you.",
    color: "#F472B6",
    bg: "#FCE7F3",
  },
  {
    icon: Building2,
    title: "Universities",
    desc: "Aiming to improve student guidance and reduce drop-out rates with AI.",
    color: "#34D399",
    bg: "#D1FAE5",
  },
];

const ForWho = () => (
  <section
    id="for-who"
    className="py-24 relative overflow-hidden"
    style={{ background: "#F1F5F9" }}
  >
    <FloatTriangle
      color="#FBBF24"
      className="top-10 right-20"
      animationName="driftA"
      duration="6s"
      delay="0s"
    />
    <FloatCircle
      size={70}
      color="#8B5CF6"
      className="bottom-10 left-10"
      animationName="floatY"
      duration="8s"
      delay="1.2s"
    />

    <div className="max-w-6xl mx-auto px-6">
      <SectionHeading
        badge="Who Is This For?"
        title={
          <>
            Built for <span style={{ color: "#34D399" }}>Every Learner</span>
          </>
        }
        badgeColor="#FBBF24"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {audience.map(({ icon: Icon, title, desc, color }) => (
          <div
            key={title}
            className="relative bg-white rounded-2xl border-2 border-slate-800 p-8 text-center transition-all duration-300 cursor-default"
            style={{
              boxShadow: `8px 8px 0 ${color}55`,
              transitionTimingFunction: "cubic-bezier(0.34,1.56,0.64,1)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.transform = "rotate(-1deg) scale(1.02)";
              (e.currentTarget as HTMLElement).style.boxShadow = `8px 8px 0 ${color}`;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.transform = "rotate(0deg) scale(1)";
              (e.currentTarget as HTMLElement).style.boxShadow = `8px 8px 0 ${color}55`;
            }}
          >
            <div
              className="mx-auto w-16 h-16 rounded-full flex items-center justify-center border-2 border-slate-800 mb-5"
              style={{ background: color, boxShadow: "3px 3px 0 #1E293B" }}
            >
              <Icon size={28} color="white" strokeWidth={2.5} />
            </div>
            <h3
              className="text-xl font-bold text-slate-800 mb-3"
              style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
            >
              {title}
            </h3>
            <p
              className="text-slate-500 leading-relaxed"
              style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
            >
              {desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

/* ─── MISSION ─────────────────────────────────────────────────── */
const Mission = () => (
  <section className="py-24 relative overflow-hidden" style={{ background: "#FFFDF5" }}>
    <div
      aria-hidden
      className="absolute inset-0"
      style={{
        background:
          "radial-gradient(ellipse 60% 60% at 50% 50%, #EDE9FE 0%, transparent 70%)",
      }}
    />
    <FloatCircle
      size={60}
      color="#F472B6"
      className="top-10 left-10"
      animationName="floatY"
      duration="5s"
      delay="0.6s"
    />
    <FloatTriangle
      color="#34D399"
      className="bottom-10 right-10"
      animationName="driftB"
      duration="7s"
      delay="0.2s"
    />

    <div className="max-w-3xl mx-auto px-6 text-center relative z-10">
      <Badge color="#8B5CF6">Our Mission</Badge>
      <h2
        className="mt-4 text-4xl md:text-5xl font-extrabold text-slate-800 leading-tight mb-6"
        style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
      >
        Education that Aligns with Your{" "}
        <span style={{ color: "#8B5CF6" }}>Future</span>
      </h2>
      <p
        className="text-xl text-slate-500 leading-relaxed mb-8"
        style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
      >
        To empower students with intelligent tools that enhance academic decision-making,
        improve learning experiences, and align education with future career success.
      </p>
      <div
        className="inline-flex items-center gap-3 px-6 py-4 rounded-2xl border-2 border-slate-800 bg-white"
        style={{ boxShadow: "6px 6px 0 #FBBF24" }}
      >
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center border-2 border-slate-800"
          style={{ background: "#FBBF24" }}
        >
          <Star size={18} strokeWidth={2.5} color="#1E293B" />
        </div>
        <p
          className="font-bold text-slate-800"
          style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
        >
          Student success is our #1 priority
        </p>
      </div>
    </div>
  </section>
);

/* ─── CTA ─────────────────────────────────────────────────────── */
const CTA = () => {
  const navigate = useNavigate();
  return (
    <section
      className="py-24 relative overflow-hidden"
      style={{ background: "#8B5CF6" }}
    >
      <DotGrid
        className="left-0 top-0 opacity-20"
        animationStyle="panGrid 16s ease-in-out infinite"
      />
      <DotGrid
        className="right-0 bottom-0 opacity-20"
        animationStyle="panGrid 16s ease-in-out 8s infinite reverse"
      />
      <FloatCircle
        size={200}
        color="#FBBF24"
        className="-top-20 -right-20"
        animationName="blobPulse"
        duration="9s"
        delay="0s"
      />
      <FloatCircle
        size={150}
        color="#F472B6"
        className="-bottom-20 -left-20"
        animationName="blobPulse"
        duration="10s"
        delay="1.5s"
      />

      <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
        <div
          className="inline-block mb-4 px-5 py-2 rounded-full border-2 border-white/40 text-white text-sm font-bold"
          style={{ background: "rgba(255,255,255,0.15)" }}
        >
          🚀 Ready to Begin?
        </div>
        <h2
          className="text-4xl md:text-6xl font-extrabold text-white leading-tight mb-6"
          style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
        >
          Start Your Learning
          <br />
          <span style={{ color: "#FBBF24" }}>Journey Today</span>
        </h2>
        <p
          className="text-xl text-white/80 mb-10 max-w-2xl mx-auto"
          style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
        >
          Discover the best path for your future with the help of AI.
        </p>

        <div className="flex flex-wrap gap-4 justify-center">
          <button
            onClick={() => navigate("/register")}
            className="inline-flex items-center gap-3 px-8 py-4 rounded-full font-bold text-slate-800 text-lg border-2 border-slate-800 bg-[#FBBF24] transition-all duration-300"
            style={{
              boxShadow: "4px 4px 0 #1E293B",
              transitionTimingFunction: "cubic-bezier(0.34,1.56,0.64,1)",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.transform = "translate(-2px,-2px)";
              (e.currentTarget as HTMLElement).style.boxShadow = "6px 6px 0 #1E293B";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.transform = "translate(0,0)";
              (e.currentTarget as HTMLElement).style.boxShadow = "4px 4px 0 #1E293B";
            }}
          >
            Get Started Now
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-800">
              <ArrowRight size={16} color="white" strokeWidth={2.5} />
            </span>
          </button>

          <button
            className="inline-flex items-center gap-3 px-8 py-4 rounded-full font-bold text-white text-lg border-2 border-white/60 bg-transparent transition-all duration-300"
            style={{ transitionTimingFunction: "cubic-bezier(0.34,1.56,0.64,1)" }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.15)")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLElement).style.background = "transparent")
            }
          >
            Take the Quiz
          </button>
        </div>
      </div>
    </section>
  );
};

/* ─── FOOTER ──────────────────────────────────────────────────── */
const Footer = () => (
  <footer className="py-10 border-t-2 border-slate-200" style={{ background: "#FFFDF5" }}>
    <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center border-2 border-slate-800"
          style={{ background: "#8B5CF6" }}
        >
          <Brain size={14} color="white" strokeWidth={2.5} />
        </div>
        <span
          className="font-extrabold text-slate-800"
          style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
        >
          Learner's <span style={{ color: "#8B5CF6" }}>AI</span>
        </span>
      </div>
      <p
        className="text-slate-400 text-sm"
        style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
      >
        © {new Date().getFullYear()} Learner's AI. Empowering students with intelligent
        tools.
      </p>
      <div className="flex gap-4">
        {["Privacy", "Terms", "Contact"].map((l) => (
          <a
            key={l}
            href="#"
            className="text-sm text-slate-500 hover:text-violet-600 transition-colors"
            style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
          >
            {l}
          </a>
        ))}
      </div>
    </div>
  </footer>
);

/* ─── PAGE ────────────────────────────────────────────────────── */
export default function LandingPage() {
  return (
    <>
      {/* Google Fonts */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link
        href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;700;800&family=Plus+Jakarta+Sans:wght@400;500;700&display=swap"
        rel="stylesheet"
      />

      {/* ✅ All keyframes in one place — renders once at the top */}
      <AnimationStyles />

      <div style={{ background: "#FFFDF5" }}>
        <Nav />
        <Hero />
        <About />
        <WhyChoose />
        <HowItWorks />
        <Features />
        <ForWho />
        <Mission />
        <CTA />
        <Footer />
      </div>
    </>
  );
}
