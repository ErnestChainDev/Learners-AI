type Props = {
  step: number;
};

export default function StepIndicator({ step }: Props) {
  return (
    <div className="flex items-center justify-center gap-4 mb-8">
      {[1, 2, 3].map((s) => (
        <div
          key={s}
          className={`
            w-10 h-10 flex items-center justify-center rounded-full border-2 font-bold
            ${
              step === s
                ? "bg-[#8B5CF6] text-white border-[#1E293B] shadow-[4px_4px_0px_#1E293B]"
                : "bg-white text-[#1E293B] border-[#1E293B]"
            }
          `}
        >
          {s}
        </div>
      ))}
    </div>
  );
}