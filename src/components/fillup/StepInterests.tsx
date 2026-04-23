import { useState } from "react";
import BubbleSelect from "./BubbleSelect";
import { INTERESTS } from "../../constants";
import type { FillUpFormData } from "../../types/fillup.types";
import { showSuccess, showError, showWarning } from "../../utils/toast";

type Props = {
  data: FillUpFormData;
  setData: (val: FillUpFormData) => void;
};

export default function StepInterests({ data, setData }: Props) {
  const [customInterest, setCustomInterest] = useState("");

  const addCustomInterest = () => {
    const value = customInterest.trim().toLowerCase();

    if (!value) {
      showError("Please enter an interest");
      return;
    }

    if (data.interests.includes(value)) {
      showWarning("Interest already added");
      return;
    }

    setData({ ...data, interests: [...data.interests, value] });
    showSuccess("Interest added successfully");

    setCustomInterest("");
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Select your Interests</h2>

      <BubbleSelect
        items={INTERESTS}
        selected={data.interests}
        onChange={(val) => setData({ ...data, interests: val })}
      />

      {/* 🔥 CUSTOM INPUT */}
      <div className="mt-4 flex gap-2">
        <input
          value={customInterest}
          onChange={(e) => setCustomInterest(e.target.value)}
          placeholder="Other interest..."
          className="flex-1 px-3 py-2 border-2 border-slate-300 rounded-lg"
        />
        <button
          onClick={addCustomInterest}
          className="px-4 py-2 bg-[#8B5CF6] text-white rounded-lg border-2 border-[#1E293B]"
        >
          Add
        </button>
      </div>
    </div>
  );
}