import React, { useEffect, useState } from "react";
import { storage } from "../utils/storage";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

interface Course {
  course_id: number;
  code: string;
  title: string;
  program: string;
  score: number;
}

interface Result {
  recommended_program?: string;
  confidence?: number;
  percent_score?: number;
  gwa?: number;
  rating?: string;
  gwa_remarks?: string;
  message: string;
  weighted_scores?: Record<string, number>;
  profile_scores?: Record<
    string,
    { skills: number; interests: number; career_goals: number }
  >;
  course_recommendations: Course[];
}

const colors = [
  "bg-violet-500",
  "bg-pink-400",
  "bg-yellow-400",
  "bg-emerald-400",
];

const QuizResults: React.FC = () => {
  const [data, setData] = useState<Result | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      const token = storage.getToken();
      const res = await fetch(`${API_BASE}/ai/recommendations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      setData(result);
      setLoading(false);
    };

    fetchResults();
  }, []);

  if (loading) return <div className="p-6">Loading...</div>;
  if (!data) return <div className="p-6">No data</div>;

  // 🔥 SPLIT MESSAGE
  const rawMessage = data.message || "";
  const sections = rawMessage.split(/(?=🎯|📌|📊)/g);
  const summary = sections[0];
  const rest = sections.slice(1);

  // ✅ FORMATTER (FIXED AI TEXT)
  const formatText = (text: string) => {
    return text
      .replace(/🎯|📊|📌/g, "")
      .split("\n")
      .filter((line) => line.trim() !== "")
      .map((line, i) => (
        <li key={i} className="flex items-start gap-2">
          <span className="mt-2 w-2 h-2 bg-slate-400 rounded-full"></span>
          <span className="text-sm leading-relaxed">
            {line.trim()}
          </span>
        </li>
      ));
  };

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
    <div className="min-h-screen overflow-hidden text-slate-800 p-6 space-y-10"
        style={{
          backgroundColor: "#FFFDF5",
          backgroundImage:
            "radial-gradient(rgba(100,116,139,0.15) 1.5px, transparent 1.5px)",
          backgroundSize: "18px 18px",
        }}>

      {/* TITLE */}
      <h1 className="text-4xl font-extrabold font-[Outfit]">
        🎓 Quiz Results
      </h1>

      {/* MAIN RESULT */}
      <div className="bg-white border-2 border-slate-200 rounded-2xl p-6 shadow-[6px_6px_0px_#E2E8F0]">
        <h2 className="text-2xl font-bold mb-3">
          {data.recommended_program}
        </h2>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <p>Confidence: <b>{data.confidence}%</b></p>
          <p>Score: <b>{data.percent_score}%</b></p>
          <p>GWA: <b>{data.gwa}</b></p>
          <p>Rating: <b>{data.rating}</b></p>
        </div>

        <p className="mt-4 text-slate-500">
          {data.gwa_remarks}
        </p>
      </div>

      {/* 🧠 AI EXPLANATION */}
      <div>
        <h2 className="text-2xl font-bold mb-4 font-[Outfit]">
          🧠 AI Explanation
        </h2>

        <div className="grid md:grid-cols-2 gap-5">

          {/* SUMMARY */}
          {summary && (
            <div className="bg-white border-2 border-slate-200 rounded-2xl p-5 shadow-[6px_6px_0px_#F472B6]">
              <p className="text-xs uppercase tracking-wide text-slate-400 mb-3">
                Summary
              </p>

              <ul className="space-y-2">
                {formatText(summary)}
              </ul>
            </div>
          )}

          {/* OTHER CARDS */}
          {rest.map((section, i) => {
            let title = "Details";

            if (section.includes("🎯")) title = "Recommendation";
            if (section.includes("📊")) title = "Performance";
            if (section.includes("📌")) title = "Insights";

            return (
              <div
                key={i}
                className="bg-white border-2 border-slate-200 rounded-2xl p-5 shadow-[6px_6px_0px_#E2E8F0]"
              >
                <span className="inline-block bg-yellow-300 px-3 py-1 text-xs rounded-full border border-slate-300 mb-3">
                  {title}
                </span>

                <ul className="space-y-2">
                  {formatText(section)}
                </ul>
              </div>
            );
          })}
        </div>
      </div>

      {/* 📊 WEIGHTED SCORES */}
      {data.weighted_scores && (
        <div className="bg-white border-2 border-slate-200 rounded-2xl p-6 shadow-[6px_6px_0px_#E2E8F0]">
          <h2 className="text-2xl font-bold mb-5">📊 Weighted Scores</h2>

          <div className="space-y-5">
            {Object.entries(data.weighted_scores).map(([prog, score], i) => {
              const percent = score * 100;

              return (
                <div key={prog}>
                  <div className="flex justify-between mb-1 font-medium">
                    <span>{prog}</span>
                    <span>{percent.toFixed(1)}%</span>
                  </div>

                  <div className="w-full h-5 bg-slate-100 rounded-full overflow-hidden border">
                    <div
                      className={`h-full ${colors[i % colors.length]} transition-all duration-700`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 📚 COURSES */}
      <div>
        <h2 className="text-2xl font-bold mb-4">📚 Courses</h2>

        <div className="grid md:grid-cols-2 gap-5">
          {data.course_recommendations.map((c) => (
            <div
              key={c.course_id}
              className="bg-white border-2 border-slate-200 rounded-2xl p-5 shadow-[6px_6px_0px_#E2E8F0]"
            >
              <p className="font-bold">{c.code}</p>
              <p className="text-sm mb-2">{c.title}</p>
              <p className="text-xs text-slate-500">{c.program}</p>

              <button className="mt-4 w-full bg-violet-500 text-white py-2 rounded-full border-2 border-slate-800 shadow-[4px_4px_0px_#1E293B] hover:-translate-x-1 hover:-translate-y-1 transition">
                Study Now →
              </button>
            </div>
          ))}
        </div>
      </div>

    </div>
    </>
  );
};

export default QuizResults;