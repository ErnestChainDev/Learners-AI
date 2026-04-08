import BubbleSelect from "./BubbleSelect";
import { SKILLS } from "../../constants";
import type { FillUpFormData } from "../../types/fillup.types";

type Props = {
  data: FillUpFormData;
  setData: (val: FillUpFormData) => void;
};

export default function StepSkills({ data, setData }: Props) {
  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Select your Skills</h2>

      <BubbleSelect
        items={SKILLS}
        selected={data.skills}
        onChange={(val) => setData({ ...data, skills: val })}
      />
    </div>
  );
}