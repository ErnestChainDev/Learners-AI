import { useEffect, useMemo, useState } from "react";
import {
  RefreshCcw,
  Send,
} from "lucide-react";

import "../styles/Feedback.css";
import toast from "react-hot-toast";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import {
  feedbackApi,
  type FeedbackStatsOut,
  type FeedbackType,
} from "../api/feedback";

type FeedbackFormState = {
  type: FeedbackType;
  rating: number;
  comment: string;
};

const feedbackTypeOptions: {
  value: FeedbackType;
  label: string;
}[] = [
  { value: "chat", label: "Learner's AI" },
  { value: "course", label: "Course" },
  { value: "recommendation", label: "Recommendation" },
  { value: "quiz", label: "Quiz" },
  { value: "profile", label: "Profile" },
];

const initialForm: FeedbackFormState = {
  type: "chat",
  rating: 5,
  comment: "",
};

export default function Feedback() {
  const [form, setForm] = useState<FeedbackFormState>(initialForm);
  const [stats, setStats] = useState<FeedbackStatsOut[]>([]);

  const [loadingStats, setLoadingStats] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function loadStats() {
    setLoadingStats(true);

    try {
      const data = await feedbackApi.getStats();
      setStats(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Failed to load stats");
    } finally {
      setLoadingStats(false);
    }
  }

  useEffect(() => {
    loadStats();
  }, []);

  const totalFeedback = useMemo(
    () => stats.reduce((s, i) => s + i.count, 0),
    [stats]
  );

  const overallAverage = useMemo(() => {
    if (!stats.length || totalFeedback === 0) return 0;

    return (
      stats.reduce((s, i) => s + i.avg_rating * i.count, 0) /
      totalFeedback
    );
  }, [stats, totalFeedback]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setSubmitting(true);

    try {
      await feedbackApi.submit({
        type: form.type,
        reference_id: 0,
        rating: form.rating,
        comment: form.comment,
      });

      toast.success("Feedback submitted successfully!");
      setForm(initialForm);
      await loadStats();
    } catch {
      toast.error("Failed to submit feedback");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="feedback-page p-6 space-y-6">
      {/* HEADER */}
      <div className="pg-card">
        <h1 className="text-3xl font-extrabold">Feedback & Analytics</h1>

        <button
          onClick={loadStats}
          disabled={loadingStats}
          className="pg-btn pg-btn-primary mt-4"
        >
          <RefreshCcw size={16} />
          {loadingStats ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* FORM */}
        <div className="pg-card">
          <h2 className="font-bold mb-4">Submit Feedback</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* TYPE SELECT */}
            <select
              value={form.type}
              onChange={(e) =>
                setForm({
                  ...form,
                  type: e.target.value as FeedbackType,
                })
              }
              className="pg-select"
            >
              {feedbackTypeOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>

            {/* TAGS */}
            <div className="flex gap-2 flex-wrap">
              {feedbackTypeOptions.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  className={`pg-tag ${
                    form.type === o.value ? "active" : ""
                  }`}
                  onClick={() =>
                    setForm({ ...form, type: o.value })
                  }
                >
                  {o.label}
                </button>
              ))}
            </div>

            {/* RATING */}
            <div className="grid grid-cols-5 gap-2">
              {[1, 2, 3, 4, 5].map((v) => (
                <button
                  key={v}
                  type="button"
                  className={`pg-rating ${
                    form.rating === v ? "active" : ""
                  }`}
                  onClick={() =>
                    setForm({ ...form, rating: v })
                  }
                >
                  ⭐ {v}
                </button>
              ))}
            </div>

            {/* COMMENT */}
            <textarea
              value={form.comment}
              onChange={(e) =>
                setForm({ ...form, comment: e.target.value })
              }
              className="pg-textarea"
              rows={5}
              placeholder="Write your feedback..."
            />

            {/* SUBMIT */}
            <button
              type="submit"
              disabled={submitting}
              className="pg-btn pg-btn-primary w-full"
            >
              <Send size={16} />
              {submitting ? "Submitting..." : "Submit Feedback"}
            </button>
          </form>
        </div>

        {/* STATS */}
        <div className="space-y-4">
          <div className="pg-stat">
            <strong>Total Feedback:</strong> {totalFeedback}
          </div>

          <div className="pg-stat">
            <strong>Average Rating:</strong>{" "}
            {overallAverage.toFixed(2)}
          </div>

          {/* BAR CHART */}
          <div className="pg-card">
            <h3 className="font-bold mb-4">Feedback Overview</h3>

            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stats}>
                <XAxis
                  dataKey="type"
                  tickFormatter={(value) => {
                    if (value === "chat") return "AI";
                    if (value === "course") return "Course";
                    if (value === "recommendation") return "Reco";
                    if (value === "quiz") return "Quiz";
                    if (value === "profile") return "Profile";
                    return value;
                  }}
                />
                <YAxis domain={[0, 5]} />
                <Tooltip />
                <Bar dataKey="avg_rating" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* LIST */}
          {loadingStats ? (
            <div className="pg-card">Loading...</div>
          ) : (
            stats.map((item) => (
              <div key={item.type} className="pg-card">
                <p className="font-bold">{item.type}</p>

                <div className="pg-progress mt-2">
                  <div
                    className="pg-progress-fill"
                    style={{
                      width: `${(item.avg_rating / 5) * 100}%`,
                    }}
                  />
                </div>

                <p className="mt-2">
                  {item.avg_rating.toFixed(2)} / 5
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}