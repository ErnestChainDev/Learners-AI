import React from "react";
import { useNavigate } from "react-router-dom";
import { Brain } from "lucide-react";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  title,
  subtitle,
}) => {
  const navigate = useNavigate();

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#FFFDF5] px-4 py-10 overflow-hidden font-['Plus_Jakarta_Sans']">

      {/* 🎬 ANIMATION STYLES */}
      <style>
        {`
          @keyframes floatSlow {
            0% { transform: translateY(0px) translateX(0px); }
            50% { transform: translateY(-20px) translateX(10px); }
            100% { transform: translateY(0px) translateX(0px); }
          }

          @keyframes floatMedium {
            0% { transform: translateY(0px) translateX(0px); }
            50% { transform: translateY(15px) translateX(-10px); }
            100% { transform: translateY(0px) translateX(0px); }
          }

          @keyframes floatFast {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
            100% { transform: translateY(0px); }
          }
        `}
      </style>

      {/* 🎨 BACKGROUND DECORATIONS */}

      {/* Big yellow circle */}
      <div
        className="absolute -top-20 -left-20 w-72 h-72 bg-[#FBBF24] rounded-full border-2 border-[#1E293B]"
        style={{ animation: "floatSlow 8s ease-in-out infinite" }}
      />

      {/* Pink blob */}
      <div
        className="absolute -bottom-15 -right-10 w-64 h-64 bg-[#F472B6] border-2 border-[#1E293B]"
        style={{
          borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%",
          animation: "floatMedium 6s ease-in-out infinite",
        }}
      />

      {/* Green circle */}
      <div
        className="absolute top-20 right-10 w-20 h-20 bg-[#34D399] rounded-full border-2 border-[#1E293B]"
        style={{ animation: "floatFast 4s ease-in-out infinite" }}
      />

      {/* Violet circle */}
      <div
        className="absolute bottom-24 left-10 w-16 h-16 bg-[#8B5CF6] rounded-full border-2 border-[#1E293B]"
        style={{ animation: "floatMedium 7s ease-in-out infinite" }}
      />

      {/* Dot grid pattern */}
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#1E293B_1px,transparent_1px)] bg-size-[16px_16px]" />

      {/* 🎯 MAIN CARD */}
      <div className="relative z-10 w-full max-w-md sm:max-w-lg">
        <div className="bg-white border-2 border-[#1E293B] rounded-2xl p-6 sm:p-8 shadow-[8px_8px_0px_#E2E8F0] transition-all duration-300 hover:-rotate-1 hover:scale-[1.02]">

          {/* HEADER */}
          <div className="text-center mb-6 sm:mb-8">

            {/* Logo */}
            <div className="flex flex-col items-center gap-3 mb-4">

              {/* Clickable Brain Circle */}
              <button
                type="button"
                onClick={() => navigate("/")}
                aria-label="Go to homepage"
                className="w-14 h-14 rounded-full flex items-center justify-center border-2 border-[#1E293B] cursor-pointer transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#1E293B] active:translate-x-px active:translate-y-px active:shadow-[1px_1px_0px_#1E293B]"
                style={{ background: "#8B5CF6", boxShadow: "2px 2px 0 #1E293B" }}
              >
                <Brain size={24} color="white" strokeWidth={2.5} />
              </button>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1E293B] font-['Outfit']">
                Learner's Portal
              </h1>
            </div>

            {/* Title */}
            <h2 className="text-xl sm:text-2xl font-bold text-[#1E293B] font-['Outfit']">
              {title}
            </h2>

            {/* Subtitle */}
            {subtitle && (
              <p className="mt-2 text-sm sm:text-base text-[#64748B] max-w-sm mx-auto">
                {subtitle}
              </p>
            )}
          </div>

          {/* FORM CONTENT */}
          <div className="space-y-4">
            {children}
          </div>
        </div>
      </div>

      {/* 🎉 CONFETTI SHAPES */}
      <div
        className="absolute top-10 right-10 w-6 h-6 bg-[#34D399] border-2 border-[#1E293B] rotate-12"
        style={{ animation: "floatFast 5s ease-in-out infinite" }}
      />
      <div
        className="absolute bottom-20 left-10 w-5 h-5 bg-[#8B5CF6] rounded-full border-2 border-[#1E293B]"
        style={{ animation: "floatSlow 9s ease-in-out infinite" }}
      />
      <div
        className="absolute top-1/2 left-6 w-4 h-4 bg-[#F472B6] rotate-45 border-2 border-[#1E293B]"
        style={{ animation: "floatMedium 6s ease-in-out infinite" }}
      />

    </div>
  );
};

export default AuthLayout;