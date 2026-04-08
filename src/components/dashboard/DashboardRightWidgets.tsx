import {
  Bot,
  Sparkles,
  Trophy,
  CalendarDays,
  BookOpen,
  ArrowRight,
  BarChart3,
  ClipboardCheck,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

type RightWidgetProps = {
  courseCount: number;
};

export default function DashboardRightWidgets({
  courseCount,
}: RightWidgetProps) {
  const navigate = useNavigate();

  return (
    <aside className="space-y-6">

      {/* ===== AI CARD ===== */}
      <section
        className="
          rounded-2xl border-2 border-[#1E293B] bg-white p-5
          shadow-[6px_6px_0px_#E2E8F0]
          transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]

          hover:-translate-x-1 hover:-translate-y-1
          hover:-rotate-1
          hover:shadow-[8px_8px_0px_#8B5CF6]
        "
      >
        <div className="flex items-start gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-full border-2 border-[#1E293B] bg-[#8B5CF6] text-white">
            <Bot className="h-6 w-6" />
          </div>

          <div>
            <h3 className="text-[18px] font-extrabold text-[#1E293B]">
              Learner&apos;s AI
            </h3>
            <p className="mt-1 text-sm text-[#64748B]">
              Ask for explanations, quiz help, or course suggestions.
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-xl border-2 border-[#1E293B] bg-[#F1F5F9] p-4">
          <p className="text-sm font-semibold text-[#475569]">
            “What course should I study next?”
          </p>
        </div>

        <button
          onClick={() => {
            const prompt = "What course should I study next?";

            // SAVE MESSAGE
            localStorage.setItem("ai_prefill", prompt);

            // NAVIGATE
            navigate("/chat");
          }}
          className="
            mt-4 flex w-full items-center justify-center gap-2
            rounded-full border-2 border-[#1E293B]
            bg-[#8B5CF6] px-4 py-3 text-sm font-bold text-white
            shadow-[4px_4px_0px_#1E293B]

            transition-all duration-300
            hover:-translate-x-1 hover:-translate-y-1
            hover:shadow-[6px_6px_0px_#1E293B]
          "
        >
          Open AI Chat
          <ArrowRight className="h-4 w-4" />
        </button>
      </section>

      {/* ===== PROGRESS ===== */}
      <section
        className="
          rounded-2xl border-2 border-[#1E293B] bg-white p-5
          shadow-[6px_6px_0px_#E2E8F0]

          transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]
          hover:-translate-x-1 hover:-translate-y-1
          hover:rotate-1
          hover:shadow-[8px_8px_0px_#F472B6]
        "
      >
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-full border-2 border-[#1E293B] bg-[#F472B6] text-white">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-[18px] font-extrabold text-[#1E293B]">
              Learning Progress
            </h3>
            <p className="text-sm text-[#64748B]">Your current overview</p>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          {/* BAR */}
          <div>
            <div className="mb-2 flex justify-between text-sm font-semibold text-[#475569]">
              <span>Course Completion</span>
              <span>68%</span>
            </div>
            <div className="h-3 rounded-full border-2 border-[#1E293B] bg-white">
              <div className="h-full w-[68%] rounded-full bg-[#8B5CF6]" />
            </div>
          </div>

          <div>
            <div className="mb-2 flex justify-between text-sm font-semibold text-[#475569]">
              <span>Quiz Progress</span>
              <span>45%</span>
            </div>
            <div className="h-3 rounded-full border-2 border-[#1E293B] bg-white">
              <div className="h-full w-[45%] rounded-full bg-[#FBBF24]" />
            </div>
          </div>

          {/* STATS */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="rounded-xl border-2 border-[#1E293B] bg-[#FFFDF5] p-4 text-center shadow-[4px_4px_0px_#E2E8F0]">
              <div className="text-xl font-extrabold text-[#1E293B]">
                {courseCount}
              </div>
              <div className="text-xs text-[#64748B]">Courses</div>
            </div>

            <div className="rounded-xl border-2 border-[#1E293B] bg-[#FFFDF5] p-4 text-center shadow-[4px_4px_0px_#E2E8F0]">
              <div className="text-xl font-extrabold text-[#1E293B]">12</div>
              <div className="text-xs text-[#64748B]">Quizzes</div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== ACHIEVEMENTS ===== */}
      <section
        className="
          rounded-2xl border-2 border-[#1E293B] bg-white p-5
          shadow-[6px_6px_0px_#E2E8F0]

          transition-all duration-300
          hover:-translate-x-1 hover:-translate-y-1
          hover:-rotate-1
          hover:shadow-[8px_8px_0px_#FBBF24]
        "
      >
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-full border-2 border-[#1E293B] bg-[#FBBF24] text-white">
            <Trophy className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-[18px] font-extrabold text-[#1E293B]">
              Achievements
            </h3>
            <p className="text-sm text-[#64748B]">Your latest badges</p>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {[
            {
              icon: <Sparkles />,
              title: "First Course Opened",
              desc: "You started your learning journey.",
            },
            {
              icon: <ClipboardCheck />,
              title: "Quiz Challenger",
              desc: "Completed multiple quiz attempts.",
            },
          ].map((item, i) => (
            <div
              key={i}
              className="
                flex items-center gap-3 rounded-xl border-2 border-[#1E293B] bg-white p-4
                shadow-[4px_4px_0px_#E2E8F0]

                transition hover:-translate-x-1 hover:-translate-y-1
                hover:shadow-[6px_6px_0px_#34D399]
              "
            >
              <div className="text-[#34D399]">{item.icon}</div>
              <div>
                <p className="text-sm font-bold text-[#1E293B]">
                  {item.title}
                </p>
                <p className="text-xs text-[#64748B]">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== ACTIVITIES ===== */}
      <section
        className="
          rounded-2xl border-2 border-[#1E293B] bg-white p-5
          shadow-[6px_6px_0px_#E2E8F0]

          transition hover:-translate-x-1 hover:-translate-y-1
          hover:rotate-1
          hover:shadow-[8px_8px_0px_#34D399]
        "
      >
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-full border-2 border-[#1E293B] bg-[#34D399] text-white">
            <CalendarDays className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-[18px] font-extrabold text-[#1E293B]">
              Upcoming Activities
            </h3>
            <p className="text-sm text-[#64748B]">What&apos;s next for you</p>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {[
            { text: "Take your next quiz", path: "/quiz" },
            { text: "Continue your lessons", path: "/courses" },
          ].map((item, i) => (
            <button
              key={i}
              onClick={() => navigate(item.path)}
              className="
                flex w-full items-start gap-3 rounded-xl border-2 border-[#1E293B] bg-white p-4 text-left
                shadow-[4px_4px_0px_#E2E8F0]

                transition-all duration-300
                hover:-translate-x-1 hover:-translate-y-1
                hover:shadow-[6px_6px_0px_#8B5CF6]
              "
            >
              <BookOpen className="mt-1 h-5 w-5 text-[#8B5CF6]" />
              <div>
                <p className="text-sm font-bold text-[#1E293B]">
                  {item.text}
                </p>
                <p className="text-xs text-[#64748B]">
                  Stay consistent with your learning.
                </p>
              </div>
            </button>
          ))}
        </div>
      </section>
    </aside>
  );
}