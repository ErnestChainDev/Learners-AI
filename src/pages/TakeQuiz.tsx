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

// ─── Types ────────────────────────────────────────────────────────────────────
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

// ─── Submitted Screen (shown right after submit, before going to results) ─────
interface SubmittedScreenProps {
  submitOut: SubmitQuizOut;
  onCheckResults: () => void;
  onBackHome: () => void;
}

function SubmittedScreen({ submitOut, onCheckResults, onBackHome }: SubmittedScreenProps) {
  const percent =
    submitOut.total > 0
      ? Math.round((submitOut.score / submitOut.total) * 1000) / 10
      : 0;

    return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-[#f6f7fb] overflow-hidden">
      
      {/* Background decorations */}
      <span className="qpg-deco qpg-deco--circle qpg-deco--yellow" />
      <span className="qpg-deco qpg-deco--circle qpg-deco--pink" />
      <span className="qpg-deco qpg-deco--triangle qpg-deco--mint" />
      <span className="qpg-deco qpg-deco--squiggle" />

      {/* Centered card */}
      <div className="qpg-card qpg-card--center relative z-10 w-full max-w-md">
        
        <div className="qpg-card__icon-float qpg-card__icon-float--mint">✅</div>

        <h2 className="qpg-heading text-center">Quiz Submitted!</h2>

        <div className="qpg-pills flex flex-wrap justify-center gap-2 mb-4">
          <span className="qpg-pill qpg-pill--violet">
            Attempt #{submitOut.attempt_id}
          </span>
          <span className="qpg-pill qpg-pill--amber">
            Score: {submitOut.score}/{submitOut.total} ({percent}%)
          </span>
        </div>

        <p className="qpg-body text-center mb-6">
          Your answers have been recorded. Click below to view your full results
          and AI-powered program recommendations.
        </p>

        <div className="flex flex-col gap-3 items-center">
          <button
            className="qpg-btn qpg-btn--primary w-full"
            onClick={onCheckResults}
          >
            📊 Check Quiz Results
          </button>

          <button
            className="qpg-btn qpg-btn--secondary w-full"
            onClick={onBackHome}
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main TakeQuiz component ──────────────────────────────────────────────────
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
  const [submitOut, setSubmitOut] = useState<SubmitQuizOut | null>(null);

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

  // Lock body scroll while quiz is open
  useEffect(() => {
    document.body.classList.add("quiz-taking-mode");
    return () => document.body.classList.remove("quiz-taking-mode");
  }, []);

  // ── Bootstrap ──────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      setStarting(true);
      setError("");
      setSubmitOut(null);

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
            mappings: saved.mappings ?? [],
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

  // ── Reset timer on question change ────────────────────────────────────────
  useEffect(() => {
    if (!currentId) return;
    setTimeLeft(currentTimeLimit);
  }, [currentId, currentTimeLimit]);

  // ── Persist helpers ────────────────────────────────────────────────────────
  const persistAnswer = useCallback(
    async (payload: SaveAnswerIn) => {
      if (!attemptId) return;
      await quizApi.saveAnswer(attemptId, payload);
    },
    [attemptId]
  );

  const buildPayloadFromLocal = useCallback(
    (answer: LocalAnswer): SaveAnswerIn => ({
      question_id: answer.questionId,
      answer_state: answer.answerState,
      selected_option_id: answer.selectedOptionId,
      mappings: answer.mappings,
    }),
    []
  );

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
      saveTimeoutRef.current = window.setTimeout(
        () => void persistAnswer(payload),
        250
      );
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

  // ── Question timeout ───────────────────────────────────────────────────────
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

  // ── Per-question countdown ─────────────────────────────────────────────────
  useEffect(() => {
    if (!currentId || !attemptId || submitOut) return;

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
  }, [attemptId, currentId, submitOut, handleQuestionTimeout]);

  // ── Cleanup debounce on unmount ────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) window.clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  // ── Helpers ────────────────────────────────────────────────────────────────
  function questionStatus(
    questionId: number
  ): "current" | "answered" | "missed" | "unanswered" {
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

  // ── Submit ─────────────────────────────────────────────────────────────────
  async function handleSubmit() {
    if (!attemptId) return;
    setError("");
    setSubmitting(true);

    try {
      const payload = items.map((q) => {
        const local = answers[q.id] ?? buildInitialAnswer(q.id);
        return buildPayloadFromLocal(local);
      });

      const res = await quizApi.submitAttempt(attemptId, payload);

      // ✅ Show the intermediate "submitted" screen with the Check Results button
      setSubmitOut(res);
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

  // ── Navigate to /quiz-results, passing submitOut via router state ──────────
  function handleCheckResults() {
    if (!submitOut) return;
    navigate("/quiz-results", {
      state: { submitOut },
      replace: false,
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════════════

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="qpg-wrap">
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
            <button
              className="qpg-btn qpg-btn--secondary"
              onClick={() => navigate("/home")}
            >
              ← Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Submitted screen (shows "Check Quiz Results" button) ── */
  if (submitOut) {
    return (
      <SubmittedScreen
        submitOut={submitOut}
        onCheckResults={handleCheckResults}
        onBackHome={() => navigate("/home", { replace: true })}
      />
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
      <span className="qpg-deco qpg-deco--circle qpg-deco--yellow" aria-hidden="true" />
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
                  <strong className="qpg-pill qpg-pill--mint qpg-pill--sm">
                    {answeredCount}
                  </strong>
                </div>
                <div className="qpg-stat-row">
                  <span className="qpg-stat-dot qpg-stat-dot--missed" />
                  <span>Missed</span>
                  <strong className="qpg-pill qpg-pill--pink qpg-pill--sm">
                    {missedCount}
                  </strong>
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
                  onClick={() => void handleSubmit()}
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
