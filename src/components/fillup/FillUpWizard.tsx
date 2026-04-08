import { useState } from "react";
import StepIndicator from "./StepIndicator";
import StepOneBasic from "./StepOneBasic";
import StepSkills from "./StepSkills";
import StepInterests from "./StepInterests";
import type { FillUpFormData } from "../../types/fillup.types";

import { storage } from "../../utils/storage";
import { useNavigate } from "react-router-dom";

export default function FillUpWizard() {
  const [step, setStep] = useState(1);
  const navigate = useNavigate();

  const [data, setData] = useState<FillUpFormData>({
    name: "",
    strand: "",
    program: "",
    goals: "",
    skills: [],
    interests: [],
  });

  const next = async () => {
    if (step === 3) {
      try {
        const token = storage.getToken();
        if (!token) throw new Error("No token");

        const API_BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

        const cleanPayload = {
          full_name: data.name.trim(),
          strand: data.strand.trim(),
          preferred_program: data.program.trim(),
          career_goals: data.goals.trim(),
          skills: data.skills.length ? data.skills.join(", ").trim() : "",
          interests: data.interests.length ? data.interests.join(", ").trim() : "",
          notes: "",
        };

        console.log("🔥 CLEAN PAYLOAD:", cleanPayload);

        const res = await fetch(`${API_BASE}/profile/me`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(cleanPayload),
        });

        const text = await res.text();
        const result = text ? JSON.parse(text) : null;

        if (!res.ok) {
          console.error("❌ BACKEND ERROR:", result);
          throw new Error(
            result?.detail?.[0]?.msg ||
              result?.detail ||
              result?.message ||
              "Failed to save profile"
          );
        }

        console.log("✅ SUCCESS:", result);
        window.location.href = "/home";
      } catch (err: unknown) {
        console.error("SAVE ERROR:", err);

        if (err instanceof Error) alert(err.message);
        else alert("Failed to save profile");
      }
    } else {
      setStep((prev) => prev + 1);
    }
  };

  const back = () => setStep((prev) => prev - 1);

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
          border-left: 50px solid transparent;
          border-right: 50px solid transparent;
          border-bottom: 90px solid #8B5CF6;
          transform: rotate(-15deg);
        }

        .qpg-deco--yellow {
          width: 140px;
          height: 140px;
          background: #FBBF24;
          top: 60px;
          left: -40px;
          box-shadow: 6px 6px 0px #1E293B;
        }

        .qpg-deco--pink {
          width: 120px;
          height: 120px;
          background: #F472B6;
          bottom: 40px;
          right: -30px;
          box-shadow: 6px 6px 0px #1E293B;
        }

        .qpg-deco--violet {
          top: 180px;
          right: 10%;
        }

        .qpg-deco {
          animation: float 6s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }

        @media (max-width: 768px) {
          .qpg-deco--triangle {
            display: none;
          }
        }
        `}
      </style>

      {/* MAIN CONTAINER */}
      <div
        className="relative min-h-screen flex items-center justify-center overflow-hidden px-3"
        style={{
          backgroundColor: "#FFFDF5",
          backgroundImage:
            "radial-gradient(rgba(100,116,139,0.15) 1.5px, transparent 1.5px)",
          backgroundSize: "18px 18px",
        }}
      >
        {/* DECORATIONS */}
        <span className="qpg-deco qpg-deco--circle qpg-deco--yellow" />
        <span className="qpg-deco qpg-deco--circle qpg-deco--pink" />
        <span className="qpg-deco qpg-deco--triangle qpg-deco--violet" />

        {/* CONTENT */}
        <div className="relative z-10 w-full max-w-3xl">
          <div
            className="
            bg-white border-2 border-[#1E293B] 
            rounded-xl p-6 md:p-8
            shadow-[6px_6px_0px_#E2E8F0] md:shadow-[8px_8px_0px_#E2E8F0]
            transition-all duration-300
          "
          >
            <StepIndicator step={step} />

            {step === 1 && <StepOneBasic data={data} setData={setData} />}
            {step === 2 && <StepSkills data={data} setData={setData} />}
            {step === 3 && <StepInterests data={data} setData={setData} />}

            {/* RESPONSIVE BUTTONS */}
            <div className="mt-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              
              {/* LOGIN */}
              <button
                onClick={() => navigate("/login")}
                className="
                  text-sm font-bold text-[#64748B]
                  text-center md:text-left
                  hover:text-[#8B5CF6]
                "
              >
                Already have an account? Login
              </button>

              {/* ACTION BUTTONS */}
              <div className="flex w-full gap-3 md:w-auto md:justify-end">
                
                {step > 1 && (
                  <button
                    onClick={back}
                    className="
                      flex-1 md:flex-none
                      px-5 py-3 md:py-2
                      rounded-full border-2 border-[#1E293B]

                      shadow-[4px_4px_0px_#1E293B]

                      hover:-translate-x-1 hover:-translate-y-1
                      hover:shadow-[6px_6px_0px_#1E293B]

                      active:translate-x-1 active:translate-y-1
                      active:shadow-[2px_2px_0px_#1E293B]
                    "
                  >
                    Back
                  </button>
                )}

                <button
                  onClick={next}
                  className="
                    flex-1 md:flex-none
                    px-5 py-3 md:py-2
                    bg-[#8B5CF6] text-white rounded-full border-2 border-[#1E293B]

                    shadow-[4px_4px_0px_#1E293B]

                    hover:-translate-x-1 hover:-translate-y-1
                    hover:shadow-[6px_6px_0px_#1E293B]

                    active:translate-x-1 active:translate-y-1
                    active:shadow-[2px_2px_0px_#1E293B]
                  "
                >
                  {step === 3 ? "Finish" : "Next"}
                </button>

              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}