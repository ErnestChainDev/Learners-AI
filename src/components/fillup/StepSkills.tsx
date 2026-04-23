import { useState } from "react";
import BubbleSelect from "./BubbleSelect";
import { SKILLS } from "../../constants";
import type { FillUpFormData } from "../../types/fillup.types";
import { showSuccess, showError, showWarning } from "../../utils/toast";

type Props = {
  data: FillUpFormData;
  setData: (val: FillUpFormData) => void;
};

export default function StepSkills({ data, setData }: Props) {
  const [customSkill, setCustomSkill] = useState("");

  const addCustomSkill = () => {
    const value = customSkill.trim().toLowerCase();

    if (!value) {
      showError("Please enter a skill");
      return;
    }

    if (data.skills.includes(value)) {
      showWarning("Skill already added");
      return;
    }

    setData({ ...data, skills: [...data.skills, value] });
    showSuccess("Skill added successfully");

    setCustomSkill("");
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Select your Skills</h2>

      <BubbleSelect
        items={SKILLS}
        selected={data.skills}
        onChange={(val) => setData({ ...data, skills: val })}
      />

      {/* 🔥 CUSTOM INPUT */}
      <div className="mt-4 flex gap-2">
        <input
          value={customSkill}
          onChange={(e) => setCustomSkill(e.target.value)}
          placeholder="Other skill..."
          className="flex-1 px-3 py-2 border-2 border-slate-300 rounded-lg"
        />
        <button
          onClick={addCustomSkill}
          className="px-4 py-2 bg-[#8B5CF6] text-white rounded-lg border-2 border-[#1E293B]"
        >
          Add
        </button>
      </div>
    </div>
  );
}