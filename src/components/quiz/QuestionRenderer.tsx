// src/components/quiz/QuestionRenderer.tsx
import DragDropQuestion from "./DragDropQuestion";
import type { DragDropMappingIn, QuestionOut } from "../../types/quiz.types";

type Props = {
  question: QuestionOut;
  selectedOptionId: number | null;
  dragMappings: DragDropMappingIn[];
  onSelectOption: (optionId: number) => void;
  onChangeMappings: (next: DragDropMappingIn[]) => void;
};

export default function QuestionRenderer({
  question,
  selectedOptionId,
  dragMappings,
  onSelectOption,
  onChangeMappings,
}: Props) {
  if (question.question_type === "drag_drop") {
    return (
      <div className="quizQuestion">
        <h3>{question.text}</h3>

        {question.image_url ? (
          <div className="quizQuestionImageWrap">
            <img
              src={question.image_url}
              alt="Drag and drop prompt"
              className="quizQuestionImage"
            />
          </div>
        ) : (
          <div className="quizNoImageBoard">
            <div className="quizNoImageTitle">No image needed for this activity</div>
            <div className="quizNoImageText">
              Match the draggable items to the correct labels below.
            </div>
          </div>
        )}

        <DragDropQuestion
          items={question.drag_items ?? []}
          value={dragMappings}
          onChange={onChangeMappings}
        />
      </div>
    );
  }

  if (question.question_type === "fill_blank_choice") {
    const selectedText =
      question.options.find((o) => o.id === selectedOptionId)?.text ??
      question.blank_placeholder ??
      "_____";

    return (
      <div className="quizQuestion">
        <h3>{question.text}</h3>

        <div className="fillBlankPreview">
          <span className="fillBlankValue">{selectedText}</span>
        </div>

        <div className="quizWordButtons">
          {question.options.map((o) => (
            <button
              key={o.id}
              type="button"
              className={`quizWordBtn ${selectedOptionId === o.id ? "active" : ""}`}
              onClick={() => onSelectOption(o.id)}
            >
              {o.text}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="quizQuestion">
      <h3>{question.text}</h3>

      <div className="quizOptions">
        {question.options.map((o) => (
          <label key={o.id} className={`quizOption ${selectedOptionId === o.id ? "active" : ""}`}>
            <input
              type="radio"
              name={`q_${question.id}`}
              checked={selectedOptionId === o.id}
              onChange={() => onSelectOption(o.id)}
            />
            <span>{o.text}</span>
          </label>
        ))}
      </div>
    </div>
  );
}