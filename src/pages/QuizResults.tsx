import React, { useEffect, useState, useRef } from "react";
import { storage } from "../utils/storage";
import "../styles/TakeQuiz.css";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

// ── Types (mirrored from recommendation_engine.py return dict) ─────────────
interface CourseRec {
  course_id: number;
  code: string;
  title: string;
  program: string;
  score: number; // cosine similarity 0–1
}

interface ProfileScoreEntry {
  skills: number;
  interests: number;
  career_goals: number;
}

interface RecommendOut {
  user_id: number;
  cluster_id: number;
  percent_score: number;
  gwa: number;
  rating: string;
  gwa_remarks: string;
  preferred_program: string;
  recommended_program: string;
  confidence: number;
  weighted_scores: Record<string, number>; // values 0–1 (e.g. 0.275)
  profile_scores: Record<string, ProfileScoreEntry>;
  message: string;
  ai_explanation: string;
  course_recommendations: CourseRec[];
}

// ── Program label ──────────────────────────────────────────────────────────
function programLabel(p: string) {
  const s = (p || "").toUpperCase().trim();
  if (s === "BSCS") return "BSCS (Computer Science)";
  if (s === "BSIT") return "BSIT (Information Technology)";
  if (s === "BSIS") return "BSIS (Information Systems)";
  if (s === "BTVTED") return "BTVTED ICT";
  return s || "—";
}

// ── Typewriter hook ────────────────────────────────────────────────────────
function useTypewriter(text: string, speed = 16) {
  const [state, setState] = useState({ displayed: "", done: false, target: "" });
  const idxRef = useRef(0);

  useEffect(() => {
    if (!text) return;
    idxRef.current = 0;

    const interval = window.setInterval(() => {
      idxRef.current += 1;
      const slice = text.slice(0, idxRef.current);
      const finished = idxRef.current >= text.length;
      setState({ displayed: slice, done: finished, target: text });
      if (finished) window.clearInterval(interval);
    }, speed);

    return () => window.clearInterval(interval);
  }, [text, speed]);

  const displayed = state.target === text ? state.displayed : "";
  const done = state.target === text ? state.done : false;
  return { displayed, done };
}

// ── Score bar ──────────────────────────────────────────────────────────────
function ScoreBar({
  label,
  pct,
  recommended,
}: {
  label: string;
  pct: number;
  recommended?: boolean;
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 5,
        }}
      >
        <span style={{ fontWeight: 600, fontSize: 13 }}>{label}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span
            className={`qpg-pill qpg-pill--sm ${
              recommended ? "qpg-pill--mint" : "qpg-pill--violet"
            }`}
          >
            {pct.toFixed(1)}%
          </span>
          {recommended && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#10b981",
                whiteSpace: "nowrap",
              }}
            >
              ✅ Recommended
            </span>
          )}
        </div>
      </div>
      <div
        style={{
          width: "100%",
          height: 8,
          background: "rgba(0,0,0,0.07)",
          borderRadius: 99,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${Math.min(pct, 100)}%`,
            height: "100%",
            background: recommended
              ? "linear-gradient(90deg,#10b981,#059669)"
              : "linear-gradient(90deg,#a78bfa,#7c3aed)",
            borderRadius: 99,
            transition: "width 1s ease",
          }}
        />
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
const QuizResults: React.FC = () => {
  const [data, setData] = useState<RecommendOut | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const token = storage.getToken();
        const res = await fetch(`${API_BASE}/ai/recommendations`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json: unknown = await res.json();
        if (!res.ok) {
          const detail =
            typeof json === "object" &&
            json !== null &&
            "detail" in json &&
            typeof (json as Record<string, unknown>).detail === "string"
              ? (json as Record<string, unknown>).detail as string
              : `Server error ${res.status}`;
          setError(detail);
        } else {
          setData(json as RecommendOut);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load results");
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, []);

  const aiText = data?.ai_explanation ?? "";
  const { displayed: typedText, done: typingDone } = useTypewriter(aiText, 16);

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="qpg-wrap">
        <span className="qpg-deco qpg-deco--circle qpg-deco--yellow" />
        <span className="qpg-deco qpg-deco--circle qpg-deco--pink" />
        <span className="qpg-deco qpg-deco--triangle qpg-deco--violet" />
        <div className="qpg-card qpg-card--center">
          <div className="qpg-card__icon-float qpg-card__icon-float--violet">⏳</div>
          <h2 className="qpg-heading">Quiz Results</h2>
          <p className="qpg-body">Loading AI recommendations…</p>
        </div>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (error || !data) {
    return (
      <div className="qpg-wrap">
        <span className="qpg-deco qpg-deco--circle qpg-deco--yellow" />
        <span className="qpg-deco qpg-deco--circle qpg-deco--pink" />
        <div className="qpg-card qpg-card--center">
          <h2 className="qpg-heading">Quiz Results</h2>
          <p className="qpg-error">{error || "No data returned."}</p>
        </div>
      </div>
    );
  }

  // ── Derived values ───────────────────────────────────────────────────────
  const courses: CourseRec[] = Array.isArray(data.course_recommendations)
    ? data.course_recommendations
    : [];

  // weighted_scores values come as 0–1 from Python, multiply by 100 for display
  const weightedEntries: [string, number][] = data.weighted_scores
    ? Object.entries(data.weighted_scores).sort(([, a], [, b]) => b - a)
    : [];

  const topProgram = (data.recommended_program ?? "").toUpperCase().trim();

  const scoreDisplay = `${data.percent_score?.toFixed(1) ?? "—"}%`;

  return (
    <div className="qpg-wrap" style={{ alignItems: "flex-start", padding: "32px 24px" }}>
      {/* Decorations */}
      <span className="qpg-deco qpg-deco--circle qpg-deco--yellow" />
      <span className="qpg-deco qpg-deco--circle qpg-deco--pink" />
      <span className="qpg-deco qpg-deco--triangle qpg-deco--mint" />
      <span className="qpg-deco qpg-deco--squiggle" />

      <style>{`
        @keyframes qpg-blink {
          0%,100% { opacity:1; } 50% { opacity:0; }
        }
        .qr-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 20px;
        }
        @media (max-width: 768px) {
          .qr-grid-2 { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: 1100,
          margin: "0 auto",
        }}
      >
        {/* Page title */}
        <div style={{ marginBottom: 24 }}>
          <h1 className="qpg-heading" style={{ fontSize: 28, marginBottom: 4 }}>
            🎓 Quiz Results
          </h1>
          <p className="qpg-muted">
            Your performance summary and AI-powered program recommendation.
          </p>
        </div>

        {/* ── Row 1: AI Explanation + Assessment Summary ── */}
        <div className="qr-grid-2">

          {/* Card 1 – Explainable AI */}
          <div className="qpg-card" style={{ position: "relative", overflow: "hidden" }}>
            <div
              style={{
                position: "absolute", top: -40, right: -40,
                width: 140, height: 140,
                background:
                  "radial-gradient(circle,rgba(124,58,237,0.10) 0%,transparent 70%)",
                borderRadius: "50%", pointerEvents: "none",
              }}
            />
            <div
              style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}
            >
              <div
                className="qpg-card__icon-float qpg-card__icon-float--violet"
                style={{ position: "static", width: 32, height: 32, fontSize: 16 }}
              >
                🤖
              </div>
              <h3 className="qpg-subhead" style={{ margin: 0 }}>Explainable AI</h3>
              {!typingDone && aiText && (
                <span
                  className="qpg-pill qpg-pill--violet qpg-pill--sm"
                  style={{ marginLeft: "auto" }}
                >
                  ✦ Analyzing…
                </span>
              )}
            </div>

            <div className="qpg-message-box" style={{ minHeight: 100 }}>
              {aiText ? (
                <p
                  className="qpg-body"
                  style={{ lineHeight: 1.8, whiteSpace: "pre-wrap" }}
                >
                  {typedText}
                  {!typingDone && (
                    <span
                      style={{
                        display: "inline-block", width: 2, height: "1em",
                        background: "currentColor", marginLeft: 2,
                        animation: "qpg-blink 0.7s step-end infinite",
                        verticalAlign: "text-bottom",
                      }}
                    />
                  )}
                </p>
              ) : (
                <p className="qpg-muted">No AI explanation available.</p>
              )}
            </div>
          </div>

          {/* Card 2 – Assessment Summary */}
          <div className="qpg-card">
            <div
              style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}
            >
              <div
                className="qpg-card__icon-float qpg-card__icon-float--amber"
                style={{ position: "static", width: 32, height: 32, fontSize: 16 }}
              >
                📋
              </div>
              <h3 className="qpg-subhead" style={{ margin: 0 }}>Assessment Summary</h3>
            </div>

            <div
              className="qpg-result-grid"
              style={{ gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}
            >
              <div
                className="qpg-result-box qpg-result-box--violet"
                style={{ padding: "14px 16px" }}
              >
                <div className="qpg-result-label">Rating</div>
                <div className="qpg-result-value" style={{ fontSize: 15 }}>
                  {data.rating || "—"}
                </div>
                <div className="qpg-result-hint">Est. GWA: {data.gwa?.toFixed(2) ?? "—"}</div>
              </div>
              <div
                className="qpg-result-box qpg-result-box--amber"
                style={{ padding: "14px 16px" }}
              >
                <div className="qpg-result-label">Score</div>
                <div className="qpg-result-value" style={{ fontSize: 15 }}>
                  {scoreDisplay}
                </div>
                <div className="qpg-result-hint">Overall readiness</div>
              </div>
            </div>

            {data.gwa_remarks && (
              <div className="qpg-message-box" style={{ padding: "12px 16px" }}>
                <p className="qpg-body" style={{ fontSize: 13, lineHeight: 1.7 }}>
                  <strong>Remarks:</strong> {data.gwa_remarks}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Row 2: Recommendation + Suggested Courses ── */}
        <div className="qr-grid-2">

          {/* Card 3 – Recommendation */}
          <div className="qpg-card">
            <div
              style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}
            >
              <div
                className="qpg-card__icon-float qpg-card__icon-float--mint"
                style={{ position: "static", width: 32, height: 32, fontSize: 16 }}
              >
                🎯
              </div>
              <h3 className="qpg-subhead" style={{ margin: 0 }}>Recommendation</h3>
            </div>

            {/* Preferred / Recommended labels */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
              {data.preferred_program && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span className="qpg-body" style={{ fontSize: 13, opacity: 0.7 }}>
                    Preferred Program
                  </span>
                  <span className="qpg-pill qpg-pill--violet">
                    {programLabel(data.preferred_program)}
                  </span>
                </div>
              )}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span className="qpg-body" style={{ fontSize: 13, opacity: 0.7 }}>
                  Recommended Program
                </span>
                <span className="qpg-pill qpg-pill--mint">
                  {programLabel(data.recommended_program)}
                </span>
              </div>
              {data.confidence != null && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span className="qpg-body" style={{ fontSize: 13, opacity: 0.7 }}>
                    Confidence
                  </span>
                  <span className="qpg-pill qpg-pill--amber">{data.confidence}%</span>
                </div>
              )}
            </div>

            {/* Weighted score bars — values are 0–1, multiply by 100 */}
            {weightedEntries.length > 0 && (
              <>
                <p
                  className="qpg-body"
                  style={{ fontWeight: 700, fontSize: 12, marginBottom: 12, opacity: 0.7, textTransform: "uppercase", letterSpacing: "0.05em" }}
                >
                  Recommendation Scores
                </p>
                {weightedEntries.map(([prog, score]) => (
                  <ScoreBar
                    key={prog}
                    label={programLabel(prog)}
                    pct={score * 100}
                    recommended={prog.toUpperCase().trim() === topProgram}
                  />
                ))}
              </>
            )}
          </div>

          {/* Card 4 – Suggested Courses */}
          <div className="qpg-card">
            <div
              style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}
            >
              <div
                className="qpg-card__icon-float qpg-card__icon-float--pink"
                style={{ position: "static", width: 32, height: 32, fontSize: 16 }}
              >
                📚
              </div>
              <h3 className="qpg-subhead" style={{ margin: 0 }}>Suggested Courses</h3>
              <span className="qpg-pill qpg-pill--violet qpg-pill--sm" style={{ marginLeft: "auto" }}>
                {courses.length} courses
              </span>
            </div>

            {courses.length > 0 ? (
              <div className="qpg-courses">
                {courses.slice(0, 10).map((c, i) => (
                  <div key={c.course_id} className="qpg-course-row">
                    <div className="qpg-course-left">
                      <span className="qpg-course-code">
                        {i + 1}. [{c.code}]
                      </span>
                      <span className="qpg-course-title">{c.title}</span>
                      <span className="qpg-course-meta">{programLabel(c.program)}</span>
                    </div>
                    <div className="qpg-course-score">
                      {(c.score * 100).toFixed(1)}%
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="qpg-message-box" style={{ textAlign: "center", padding: "32px 16px" }}>
                <p style={{ fontSize: 28, marginBottom: 8 }}>📭</p>
                <p className="qpg-body" style={{ fontWeight: 600, marginBottom: 4 }}>
                  No courses available yet
                </p>
                <p className="qpg-muted" style={{ fontSize: 12 }}>
                  Course recommendations require courses to be seeded in the database.
                </p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default QuizResults;