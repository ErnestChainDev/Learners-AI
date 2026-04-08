export type ProfileOut = {
  user_id: number;
  full_name: string;
  strand: string;
  interests: string;
  career_goals: string;
  preferred_program: string;
  skills: string;
  notes: string;
};

export type ProfileUpsertIn = Partial<Pick<
  ProfileOut,
  | "full_name"
  | "strand"
  | "interests"
  | "career_goals"
  | "preferred_program"
  | "skills"
  | "notes"
>>;