import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { quizApi } from "../api/quiz";
import QuestionRenderer from "../components/quiz/QuestionRenderer";
import type {
  AnswerState,
  DragDropMappingIn,
  QuestionOut,
  SaveAnswerIn,
  SubmitQuizOut,
} from "../types/quiz.types";
import "../styles/TakeQuiz.css";

type CourseRec = {
  course_id: number;
  code: string;
  title: string;
  program: string;
  score: number;
};

type RecommendOut = {
  user_id: number;
  cluster_id: number;
  percent_score: number;
  gwa: number;
  rating: string;
  gwa_remarks: string;
  recommended_program: string;
  confidence: number;
  message: string;
  course_recommendations: CourseRec[];
};

type UnknownObj = Record<string, unknown>;

function isObj(v: unknown): v is UnknownObj {
  return typeof v === "object" && v !== null;
}
function num(v: unknown, fb = 0) {
  return typeof v === "number" && Number.isFinite(v) ? v : fb;
}
function str(v: unknown, fb = "") {
  return typeof v === "string" ? v : fb;
}
function arrUnknown(v: unknown): unknown[] {
  return Array.isArray(v) ? v : [];
}

function parseCourseRec(v: unknown): CourseRec {
  const o = isObj(v) ? v : {};
  return {
    course_id: num(o.course_id, 0),
    code: str(o.code, ""),
    title: str(o.title, ""),
    program: str(o.program, ""),
    score: num(o.score, 0),
  };
}

function parseRec(raw: unknown): { rec: RecommendOut | null; detail?: string } {
  if (!isObj(raw)) return { rec: null };
  if (typeof raw.detail === "string") return { rec: null, detail: raw.detail };

  const rec: RecommendOut = {
    user_id: num(raw.user_id, 0),
    cluster_id: num(raw.cluster_id, 0),
    percent_score: num(raw.percent_score, 0),
    gwa: num(raw.gwa, 0),
    rating: str(raw.rating, ""),
    gwa_remarks: str(raw.gwa_remarks, ""),
    recommended_program: str(raw.recommended_program, ""),
    confidence: num(raw.confidence, 0),
    message: str(raw.message, ""),
    course_recommendations: arrUnknown(raw.course_recommendations).map(parseCourseRec),
  };

  if (!rec.recommended_program && !rec.message) return { rec: null };
  return { rec };
}

function programLabel(p: string) {
  const s = (p || "").toUpperCase().trim();
  if (s === "BSCS") return "BSCS (Computer Science)";
  if (s === "BSIT") return "BSIT (Information Technology)";
  if (s === "BSIS") return "BSIS (Information Systems)";
  if (s === "BTVTED") return "BTVTED ICT";
  return s || "—";
}

type LocalAnswer = {
  questionId: number;
  answerState: AnswerState;
  selectedOptionId: number | null;
  mappings: DragDropMappingIn[];
};

function buildInitialAnswer(questionId: number): LocalAnswer {
  return {
    questionId,
    answerState: "unanswered",
    selectedOptionId: null,
    mappings: [],
  };
}

function formatTime(seconds: number) {
  const safe = Math.max(0, seconds);
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function TakeQuiz() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(true);
  const [error, setError] = useState("");

  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [items, setItems] = useState<QuestionOut[]>([]);
  const [idx, setIdx] = useState(0);

  const [answers, setAnswers] = useState<Record<number, LocalAnswer>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SubmitQuizOut | null>(null);

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const [timeLeft, setTimeLeft] = useState(0);
  const saveTimeoutRef = useRef<number | null>(null);

  const current = items[idx];
  const total = items.length;
  const currentId = current?.id ?? null;
  const currentTimeLimit = current?.time_limit_seconds ?? 0;

  const answeredCount = useMemo(
    () => Object.values(answers).filter((a) => a.answerState === "answered").length,
    [answers]
  );
  const missedCount = useMemo(
    () => Object.values(answers).filter((a) => a.answerState === "missed").length,
    [answers]
  );
  const unansweredCount = total - answeredCount - missedCount;

  useEffect(() => {
    document.body.classList.add("quiz-taking-mode");
    return () => document.body.classList.remove("quiz-taking-mode");
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      setStarting(true);
      setError("");
      setResult(null);

      try {
        const start = await quizApi.startAttempt(20);
        if (cancelled) return;

        setAttemptId(start.attempt_id);
        setStarting(false);

        const [qs, progress] = await Promise.all([
          quizApi.getAttemptQuestions(start.attempt_id),
          quizApi.getAttemptProgress(start.attempt_id),
        ]);

        if (cancelled) return;

        const nextAnswers: Record<number, LocalAnswer> = {};
        for (const q of qs) nextAnswers[q.id] = buildInitialAnswer(q.id);

        for (const saved of progress.saved_answers) {
          nextAnswers[saved.question_id] = {
            questionId: saved.question_id,
            answerState: saved.answer_state,
            selectedOptionId: saved.selected_option_id ?? null,
            mappings: (saved.mappings ?? []).filter(
              (m) => m.item_key && m.target_key
            ),
          };
        }

        setItems(qs);
        setAnswers(nextAnswers);

        const firstUnfinishedIndex = qs.findIndex((q) => {
          const a = nextAnswers[q.id];
          return !a || a.answerState === "unanswered";
        });

        setIdx(firstUnfinishedIndex >= 0 ? firstUnfinishedIndex : 0);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to load quiz");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void run();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!currentId) return;
    setTimeLeft(currentTimeLimit);
  }, [currentId, currentTimeLimit]);

  const persistAnswer = useCallback(
    async (payload: SaveAnswerIn) => {
      if (!attemptId) return;
      await quizApi.saveAnswer(attemptId, payload);
    },
    [attemptId]
  );

  const buildPayloadFromLocal = useCallback((answer: LocalAnswer): SaveAnswerIn => ({
    question_id: answer.questionId,
    answer_state: answer.answerState,
    selected_option_id: answer.selectedOptionId,
    mappings: answer.mappings,
  }), []);

  const updateLocalAnswer = useCallback(
    (questionId: number, updater: (prev: LocalAnswer) => LocalAnswer) => {
      setAnswers((prev) => {
        const currentAnswer = prev[questionId] ?? buildInitialAnswer(questionId);
        return { ...prev, [questionId]: updater(currentAnswer) };
      });
    },
    []
  );

  const debouncedSave = useCallback(
    (payload: SaveAnswerIn) => {
      if (saveTimeoutRef.current) window.clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = window.setTimeout(() => void persistAnswer(payload), 250);
    },
    [persistAnswer]
  );

  const selectOption = useCallback(
    (questionId: number, optionId: number) => {
      const next: LocalAnswer = {
        questionId,
        answerState: "answered",
        selectedOptionId: optionId,
        mappings: [],
      };
      updateLocalAnswer(questionId, () => next);
      debouncedSave(buildPayloadFromLocal(next));
    },
    [buildPayloadFromLocal, debouncedSave, updateLocalAnswer]
  );

  const changeDragMappings = useCallback(
    (questionId: number, mappings: DragDropMappingIn[]) => {
      const next: LocalAnswer = {
        questionId,
        answerState: mappings.length ? "answered" : "unanswered",
        selectedOptionId: null,
        mappings,
      };
      updateLocalAnswer(questionId, () => next);
      debouncedSave(buildPayloadFromLocal(next));
    },
    [buildPayloadFromLocal, debouncedSave, updateLocalAnswer]
  );

  const handleQuestionTimeout = useCallback(async () => {
    if (!current || !attemptId) return;

    const local = answers[current.id] ?? buildInitialAnswer(current.id);

    if (local.answerState === "answered") {
      if (idx < total - 1) setIdx((v) => Math.min(total - 1, v + 1));
      return;
    }

    const missed: LocalAnswer = {
      questionId: current.id,
      answerState: "missed",
      selectedOptionId: null,
      mappings: [],
    };

    setAnswers((prev) => ({ ...prev, [current.id]: missed }));

    try {
      await persistAnswer(buildPayloadFromLocal(missed));
    } catch { /* keep UX smooth */ }

    if (idx < total - 1) setIdx((v) => Math.min(total - 1, v + 1));
  }, [answers, attemptId, buildPayloadFromLocal, current, idx, persistAnswer, total]);

  useEffect(() => {
    if (!currentId || !attemptId || result) return;

    const timer = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          void handleQuestionTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [attemptId, currentId, result, handleQuestionTimeout]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) window.clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  function questionStatus(questionId: number): "current" | "answered" | "missed" | "unanswered" {
    if (current?.id === questionId) return "current";
    const a = answers[questionId];
    if (!a) return "unanswered";
    if (a.answerState === "answered") return "answered";
    if (a.answerState === "missed") return "missed";
    return "unanswered";
  }

  async function goToQuestion(nextIdx: number) {
    if (nextIdx < 0 || nextIdx >= total) return;
    setIdx(nextIdx);
  }

  async function handleSubmit() {
    if (!attemptId) return;
    setError("");
    setSubmitting(true);

    try {
      const answersPayload = items.map((q) => {
        const local = answers[q.id] ?? buildInitialAnswer(q.id);
        return buildPayloadFromLocal(local);
      });

      const payload = {
        answers: answersPayload, // ✅ FIXED
      };

      console.log("SUBMIT PAYLOAD:", payload); // 🔍 debug

      const res = await quizApi.submitAttempt(attemptId, answersPayload);
      setResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Submit failed");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancelQuiz() {
    if (!attemptId) return;
    setCancelling(true);
    setError("");

    try {
      await quizApi.cancelAttempt(attemptId);
      navigate("/home", { replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Cancel failed");
    } finally {
      setCancelling(false);
      setShowCancelModal(false);
    }
  }

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="qpg-wrap">
        {/* Decorative background shapes */}
        <span className="qpg-deco qpg-deco--circle qpg-deco--yellow" />
        <span className="qpg-deco qpg-deco--circle qpg-deco--pink" />
        <span className="qpg-deco qpg-deco--triangle qpg-deco--violet" />

        <div className="qpg-card qpg-card--center">
          <div className="qpg-card__icon-float qpg-card__icon-float--violet">⏳</div>
          <h2 className="qpg-heading">Take a Quiz</h2>
          <p className="qpg-body">{starting ? "Starting attempt…" : "Loading questions…"}</p>
        </div>
      </div>
    );
  }

  /* ── Hard Error ── */
  if (error && !items.length) {
    return (
      <div className="qpg-wrap">
        <span className="qpg-deco qpg-deco--circle qpg-deco--yellow" />
        <span className="qpg-deco qpg-deco--circle qpg-deco--pink" />

        <div className="qpg-card qpg-card--center">
          <h2 className="qpg-heading">Take a Quiz</h2>
          <p className="qpg-error">{error}</p>
          <div className="qpg-nav">
            <button className="qpg-btn qpg-btn--secondary" onClick={() => navigate("/home")}>
              ← Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Result ── */
  if (result) {
    const { rec, detail } = parseRec(result.recommendation);
    const percent =
      result.total > 0 ? Math.round((result.score / result.total) * 1000) / 10 : 0;
    const courses = rec?.course_recommendations ?? [];

    return (
      <div className="qpg-wrap">
        {/* Decorations */}
        <span className="qpg-deco qpg-deco--circle qpg-deco--yellow" />
        <span className="qpg-deco qpg-deco--circle qpg-deco--pink" />
        <span className="qpg-deco qpg-deco--triangle qpg-deco--mint" />
        <span className="qpg-deco qpg-deco--squiggle" />

        <div className="qpg-card qpg-result-card">
          {/* Header */}
          <div className="qpg-result-header">
            <div className="qpg-card__icon-float qpg-card__icon-float--mint">🎉</div>
            <h2 className="qpg-heading">Quiz Result</h2>
            <div className="qpg-pills">
              <span className="qpg-pill qpg-pill--violet">Attempt #{result.attempt_id}</span>
              <span className="qpg-pill qpg-pill--amber">
                Score: {result.score}/{result.total} ({percent}%)
              </span>
            </div>
          </div>

          {detail && <p className="qpg-error">Recommendation error: {detail}</p>}

          {/* Stats grid */}
          <div className="qpg-result-grid">
            <div className="qpg-result-box qpg-result-box--violet">
              <div className="qpg-result-label">Rating</div>
              <div className="qpg-result-value">{rec?.rating || "—"}</div>
              <div className="qpg-result-hint">{rec?.gwa_remarks || ""}</div>
            </div>
            <div className="qpg-result-box qpg-result-box--amber">
              <div className="qpg-result-label">Estimated GWA</div>
              <div className="qpg-result-value">{rec ? rec.gwa.toFixed(2) : "—"}</div>
              <div className="qpg-result-hint">
                {rec ? `Percent score: ${rec.percent_score.toFixed(1)}%` : ""}
              </div>
            </div>
            <div className="qpg-result-box qpg-result-box--mint">
              <div className="qpg-result-label">Recommended Program</div>
              <div className="qpg-result-value">
                {rec ? programLabel(rec.recommended_program) : "—"}
              </div>
              <div className="qpg-result-hint">
                {rec ? `Confidence: ${rec.confidence}% · Cluster: ${rec.cluster_id}` : ""}
              </div>
            </div>
          </div>

          <h3 className="qpg-subhead">Recommendation Details</h3>
          <div className="qpg-message-box">
            {rec?.message ? (
              <pre className="qpg-pre">{rec.message}</pre>
            ) : (
              <p className="qpg-muted">No recommendation message returned. Check your AI service.</p>
            )}
          </div>

          <h3 className="qpg-subhead">Suggested Courses</h3>
          {courses.length ? (
            <div className="qpg-courses">
              {courses.slice(0, 10).map((c) => (
                <div key={c.course_id} className="qpg-course-row">
                  <div className="qpg-course-left">
                    <span className="qpg-course-code">{c.code}</span>
                    <span className="qpg-course-title">{c.title}</span>
                    <span className="qpg-course-meta">{programLabel(c.program)}</span>
                  </div>
                  <div className="qpg-course-score">{(c.score * 100).toFixed(1)}%</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="qpg-muted">No course recommendations yet.</p>
          )}

          {!rec && (
            <>
              <h3 className="qpg-subhead">Raw Recommendation (Debug)</h3>
              <pre className="qpg-json">{JSON.stringify(result.recommendation, null, 2)}</pre>
            </>
          )}

          <div className="qpg-nav" style={{ marginTop: 24 }}>
            <button className="qpg-btn qpg-btn--primary" onClick={() => navigate("/home")}>
              ← Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── No questions ── */
  if (!current) {
    return (
      <div className="qpg-wrap">
        <div className="qpg-card qpg-card--center">
          <h2 className="qpg-heading">Take a Quiz</h2>
          <p className="qpg-body">No questions found.</p>
        </div>
      </div>
    );
  }

  /* ── Active Quiz ── */
  const localAnswer = answers[current.id] ?? buildInitialAnswer(current.id);
  const selected = localAnswer.selectedOptionId ?? null;
  const currentMappings = localAnswer.mappings ?? [];

  return (
    <div className="qpg-wrap qpg-wrap--wide">
      {/* Background decorations */}
      <span className="qpg-deco qpg-deco--circle qpg-deco--pink" aria-hidden="true" />
      <span className="qpg-deco qpg-deco--triangle qpg-deco--violet" aria-hidden="true" />
      <span className="qpg-deco qpg-deco--dots" aria-hidden="true" />

      <div className="qpg-card qpg-card--layout">

        {/* ── Top header ── */}
        <header className="qpg-header">
          <div className="qpg-header__left">
            <h2 className="qpg-heading">Take a Quiz</h2>
            <div className="qpg-pills">
              <span className="qpg-pill qpg-pill--violet">
                {current.category.toUpperCase()}
              </span>
              <span className="qpg-pill qpg-pill--pink">
                {current.question_type.replaceAll("_", " ")}
              </span>
              <span className="qpg-pill qpg-pill--amber">
                {idx + 1} / {total}
              </span>
            </div>
          </div>

          <div className="qpg-header__right">
            <div className={`qpg-timer${timeLeft <= 10 ? " qpg-timer--danger" : ""}`}>
              <span className="qpg-timer__icon">⏱</span>
              {formatTime(timeLeft)}
            </div>
            <button
              className="qpg-btn qpg-btn--danger qpg-btn--sm"
              onClick={() => setShowCancelModal(true)}
            >
              Cancel Quiz
            </button>
          </div>
        </header>

        {error && <p className="qpg-error">{error}</p>}

        {/* ── Main grid ── */}
        <div className="qpg-main-grid">

          {/* Sidebar */}
          <aside className="qpg-sidebar">
            <div className="qpg-sidebar-card">
              <h4 className="qpg-sidebar-title">Question Status</h4>

              <div className="qpg-stats">
                <div className="qpg-stat-row">
                  <span className="qpg-stat-dot qpg-stat-dot--answered" />
                  <span>Answered</span>
                  <strong className="qpg-pill qpg-pill--mint qpg-pill--sm">{answeredCount}</strong>
                </div>
                <div className="qpg-stat-row">
                  <span className="qpg-stat-dot qpg-stat-dot--missed" />
                  <span>Missed</span>
                  <strong className="qpg-pill qpg-pill--pink qpg-pill--sm">{missedCount}</strong>
                </div>
                <div className="qpg-stat-row">
                  <span className="qpg-stat-dot qpg-stat-dot--unanswered" />
                  <span>Unanswered</span>
                  <strong className="qpg-pill qpg-pill--amber qpg-pill--sm">
                    {Math.max(0, unansweredCount)}
                  </strong>
                </div>
              </div>

              <div className="qpg-indicators">
                {items.map((q, i) => (
                  <button
                    key={q.id}
                    type="button"
                    className={`qpg-indicator qpg-indicator--${questionStatus(q.id)}`}
                    onClick={() => void goToQuestion(i)}
                    aria-label={`Go to question ${i + 1}`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              <div className="qpg-legend">
                <div className="qpg-legend-row">
                  <span className="qpg-stat-dot qpg-stat-dot--current" /> Current
                </div>
                <div className="qpg-legend-row">
                  <span className="qpg-stat-dot qpg-stat-dot--answered" /> Answered
                </div>
                <div className="qpg-legend-row">
                  <span className="qpg-stat-dot qpg-stat-dot--missed" /> Missed
                </div>
                <div className="qpg-legend-row">
                  <span className="qpg-stat-dot qpg-stat-dot--unanswered" /> Unanswered
                </div>
              </div>
            </div>
          </aside>

          {/* Main content */}
          <section className="qpg-content">
            <QuestionRenderer
              question={current}
              selectedOptionId={selected}
              dragMappings={currentMappings}
              onSelectOption={(optionId) => selectOption(current.id, optionId)}
              onChangeMappings={(next) => changeDragMappings(current.id, next)}
            />

            <div className="qpg-nav">
              <button
                className="qpg-btn qpg-btn--secondary"
                onClick={() => setIdx((v) => Math.max(0, v - 1))}
                disabled={idx === 0}
              >
                ← Previous
              </button>

              {idx < total - 1 ? (
                <button
                  className="qpg-btn qpg-btn--primary"
                  onClick={() => setIdx((v) => Math.min(total - 1, v + 1))}
                >
                  Next →
                </button>
              ) : (
                <button
                  className="qpg-btn qpg-btn--primary"
                  onClick={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? "Submitting…" : "Submit Quiz ✓"}
                </button>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* ── Cancel Modal ── */}
      {showCancelModal && (
        <div className="qpg-backdrop" role="dialog" aria-modal="true">
          <div className="qpg-modal">
            <div className="qpg-card__icon-float qpg-card__icon-float--pink">⚠️</div>
            <h3 className="qpg-heading qpg-heading--md">Leave Quiz?</h3>
            <p className="qpg-body">
              Your current attempt will be cancelled. Are you sure you want to exit?
            </p>
            <div className="qpg-modal-actions">
              <button
                type="button"
                className="qpg-btn qpg-btn--secondary"
                onClick={() => setShowCancelModal(false)}
              >
                Continue Quiz
              </button>
              <button
                type="button"
                className="qpg-btn qpg-btn--danger"
                onClick={() => void handleCancelQuiz()}
                disabled={cancelling}
              >
                {cancelling ? "Cancelling…" : "Cancel and Exit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
