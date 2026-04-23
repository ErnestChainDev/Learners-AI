import {
  Bot,
  CalendarDays,
  BookOpen,
  ArrowRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function DashboardRightWidgets() {
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
            "What course should I study next?"
          </p>
        </div>

        <button
          onClick={() => {
            const prompt = "What course should I study next?";
            localStorage.setItem("ai_prefill", prompt);
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