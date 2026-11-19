export type QuestionCategory = "Behavioral" | "Technical" | "System Design";
export type QuestionLevel = "EASY" | "MEDIUM" | "HARD";

export type InterviewQuestion = {
  id: number;
  cat: QuestionCategory;
  lvl: QuestionLevel;
  src?: string;
  q: string;
  hint: string;
  a: string;
};

export type InterviewSet = {
  analysisId: string;
  createdAt: string;
  source: "ai" | "template" | "sample";
  questions: InterviewQuestion[];
  warnings: string[];
};
