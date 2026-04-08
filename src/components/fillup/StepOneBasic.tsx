import type { FillUpFormData } from "../../types/fillup.types";
import { STRANDS } from "../../constants";

type Props = {
  data: FillUpFormData;
  setData: (val: FillUpFormData) => void;
};

import { ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export default function StepOneBasic({ data, setData }: Props) {
  const [open, setOpen] = useState(false);
  const [programOpen, setProgramOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="space-y-4">

      {/* Name */}
      <input
        placeholder="NAME"
        value={data.name}
        onChange={(e) => setData({ ...data, name: e.target.value })}
        className="w-full px-4 py-3 rounded-lg border-2 border-slate-300 
        focus:border-[#8B5CF6] focus:shadow-[4px_4px_0px_#8B5CF6] outline-none"
      />

      {/* 🔽 CUSTOM STRAND DROPDOWN */}
      <div ref={ref} className="relative">

        {/* Trigger */}
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="
            w-full flex items-center justify-between
            px-4 py-3 rounded-lg border-2 border-[#1E293B]
            bg-white font-semibold text-sm

            shadow-[4px_4px_0px_#1E293B]

            transition-all duration-300

            hover:-translate-x-1 hover:-translate-y-1
            hover:shadow-[6px_6px_0px_#1E293B]
          "
        >
          <span className={data.strand ? "text-[#1E293B]" : "text-gray-400"}>
            {data.strand || "SELECT STRAND"}
          </span>

          <ChevronDown
            className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`}
          />
        </button>

        {/* Dropdown */}
        {open && (
          <div className="
            absolute left-0 right-0 mt-2 z-50
            max-h-64 overflow-y-auto

            rounded-2xl border-2 border-[#1E293B] bg-white
            shadow-[6px_6px_0px_#1E293B]

            p-3 space-y-3
          ">
            {Object.entries(STRANDS).map(([track, strands]) => (
              <div key={track}>

                {/* Track Label */}
                <p className="mb-2 text-xs font-extrabold uppercase text-[#64748B]">
                  {track}
                </p>

                {/* Button Grid */}
                <div className="flex flex-wrap gap-2">
                  {strands.map((strand, i) => {
                    const isSelected = data.strand === strand;

                    const colors = ["#8B5CF6", "#F472B6", "#FBBF24", "#34D399"];
                    const color = colors[i % colors.length];

                    return (
                      <button
                        key={strand}
                        type="button"
                        onClick={() => {
                          setData({ ...data, strand });
                          setOpen(false);
                        }}
                        className={`
                          px-3 py-2 text-sm font-bold
                          rounded-full border-2 border-[#1E293B]

                          transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]

                          shadow-[3px_3px_0px_#1E293B]

                          hover:-translate-x-1 hover:-translate-y-1
                          hover:shadow-[5px_5px_0px_#1E293B]

                          active:translate-x-px active:translate-y-px

                          ${isSelected
                            ? "text-white"
                            : "bg-white text-[#1E293B]"
                          }
                        `}
                        style={{
                          background: isSelected ? color : "#FFFFFF",
                        }}
                      >
                        {strand}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Program */}
      {/* 🔽 CUSTOM PROGRAM DROPDOWN */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setProgramOpen((prev) => !prev)}
            className="
              w-full flex items-center justify-between
              px-4 py-3 rounded-lg border-2 border-[#1E293B]
              bg-white font-semibold text-sm

              shadow-[4px_4px_0px_#1E293B]

              transition-all duration-300

              hover:-translate-x-1 hover:-translate-y-1
              hover:shadow-[6px_6px_0px_#1E293B]
            "
          >
            <span className={data.program ? "text-[#1E293B]" : "text-gray-400"}>
              {data.program || "SELECT PROGRAM"}
            </span>

            <ChevronDown
              className={`h-4 w-4 transition ${programOpen ? "rotate-180" : ""}`}
            />
          </button>

          {programOpen && (
            <div className="
              absolute left-0 right-0 mt-2 z-50
              rounded-2xl border-2 border-[#1E293B] bg-white
              shadow-[6px_6px_0px_#1E293B]

              p-3 flex flex-wrap gap-2
            ">
              {["BSCS", "BSIT", "BSIS", "BTVTED"].map((prog, i) => {
                const isSelected = data.program === prog;

                const colors = ["#8B5CF6", "#F472B6", "#FBBF24", "#34D399"];
                const color = colors[i % colors.length];

                return (
                  <button
                    key={prog}
                    type="button"
                    onClick={() => {
                      setData({ ...data, program: prog });
                      setProgramOpen(false);
                    }}
                    className={`
                      px-4 py-2 text-sm font-bold
                      rounded-full border-2 border-[#1E293B]

                      transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]

                      shadow-[3px_3px_0px_#1E293B]

                      hover:-translate-x-1 hover:-translate-y-1
                      hover:shadow-[5px_5px_0px_#1E293B]

                      active:translate-x-px active:translate-y-px

                      ${isSelected
                        ? "text-white"
                        : "bg-white text-[#1E293B]"
                      }
                    `}
                    style={{
                      background: isSelected ? color : "#FFFFFF",
                    }}
                  >
                    {prog}
                  </button>
                );
              })}
            </div>
          )}
        </div>

      {/* Goals */}
      <textarea
        placeholder="CAREER GOALS"
        value={data.goals}
        onChange={(e) =>
          setData({ ...data, goals: e.target.value })
        }
        className="w-full px-4 py-3 rounded-lg border-2 border-slate-300 
        focus:border-[#8B5CF6] focus:shadow-[4px_4px_0px_#8B5CF6] outline-none"
        rows={3}
      />
    </div>
  );
}