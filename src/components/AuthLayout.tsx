import React from "react";
import book from "../assets/SorSu-logo.png";
import bgVideo from "../assets/SorSU.jpg";
import bgImage from "../assets/SorSU.jpg";
import { useNavigate } from "react-router-dom";


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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-6 sm:p-6">
      {/* Background */}
      <video
        className="absolute inset-0 h-full w-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        poster={bgImage}
      >
        <source src={bgVideo} type="video/mp4" />
      </video>

      {/* Dark + blur overlay */}
      <div className="absolute inset-0 bg-black/35 backdrop-blur-xs sm:backdrop-blur-[6px]" />

      {/* Extra glass shine effect */}
      <div className="absolute inset-0 bg-linear-to-br from-white/10 via-white/5 to-transparent" />

      {/* Content Card */}
      <div className="relative z-10 flex w-full max-w-md items-center justify-center sm:max-w-lg">
        <div className="w-full rounded-2xl border border-white/30 bg-white/15 p-4 shadow-[0_8px_32px_rgba(0,0,0,0.25)] backdrop-blur-xl sm:rounded-3xl sm:p-6 md:p-8">
          {/* Header */}
          <div className="mb-6 text-center sm:mb-8">
            {/* Logo on TOP */}
            <div className="mb-4 flex flex-col items-center justify-center gap-3 sm:mb-6">
              <img
                src={book}
                alt="Learner's Portal"
                onClick={() => navigate("/")}
                className="h-20 w-20 sm:h-30 sm:w-30 rounded-xl object-cover cursor-pointer hover:scale-105 transition"
              />

              {/* Text BELOW logo */}
              <h1 className="text-2xl font-bold text-white drop-shadow-md sm:text-3xl md:text-4xl">
                Learner&apos;s Portal
              </h1>
            </div>

            <h2 className="mb-2 text-2xl font-bold text-white drop-shadow-sm sm:text-3xl">
              {title}
            </h2>

            {subtitle && (
              <p className="mx-auto max-w-sm px-2 text-sm leading-relaxed text-white/80 sm:text-base">
                {subtitle}
              </p>
            )}
          </div>

          {/* Form Content */}
          <div className="text-white">{children}</div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
