// src/types/quiz.types.ts
export type QuizCategory = "bscs" | "bsit" | "bsis" | "btvted";
export type QuestionType = "mcq" | "fill_blank_choice" | "drag_drop";
export type AttemptStatus = "in_progress" | "completed" | "cancelled";
export type AnswerState = "answered" | "missed" | "unanswered";

export type OptionOut = {
  id: number;
  question_id: number;
  text: string;
  display_order: number;
};

export type DragDropItemOut = {
  id: number;
  question_id: number;
  item_key: string;
  item_text: string;
  target_key: string | null;
  target_label: string | null;
  display_order: number;
};

export type QuestionOut = {
  id: number;
  category: QuizCategory;
  text: string;
  question_type: QuestionType;
  points: number;
  time_limit_seconds: number;
  image_url?: string | null;
  blank_placeholder?: string | null;
  options: OptionOut[];
  drag_items: DragDropItemOut[];
};

export type AttemptStartOut = {
  attempt_id: number;
  status: AttemptStatus;
};

export type DragDropMappingIn = {
  item_key: string;
  target_key: string;
};

export type SaveAnswerIn = {
  question_id: number;
  answer_state: AnswerState;
  selected_option_id?: number | null;
  mappings?: DragDropMappingIn[];
};

export type SavedAnswerOut = {
  question_id: number;
  answer_state: AnswerState;
  selected_option_id?: number | null;
  mappings: DragDropMappingIn[];
  is_correct: boolean;
  points_earned: number;
};

export type AttemptProgressOut = {
  attempt_id: number;
  status: AttemptStatus;
  score: number;
  total: number;
  saved_answers: SavedAnswerOut[];
};

export type SubmitQuizIn = {
  answers: SaveAnswerIn[];
};

// JSON-safe type
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export type SubmitQuizOut = {
  attempt_id: number;
  status: AttemptStatus;
  score: number;
  total: number;
  recommendation: { [key: string]: JsonValue };
};