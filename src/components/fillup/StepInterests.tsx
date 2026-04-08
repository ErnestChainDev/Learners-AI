import BubbleSelect from "./BubbleSelect";
import { INTERESTS } from "../../constants";
import type { FillUpFormData } from "../../types/fillup.types";

type Props = {
  data: FillUpFormData;
  setData: (val: FillUpFormData) => void;
};

export default function StepInterests({ data, setData }: Props) {
  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Select your Interests</h2>
      <BubbleSelect
        items= {INTERESTS}
        selected={data.interests}
        onChange={(val) => setData({ ...data, interests: val })}
      />
    </div>
  );
}