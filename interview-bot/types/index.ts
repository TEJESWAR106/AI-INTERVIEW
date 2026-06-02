export interface UploadedDocs {
  resumeText: string;
  jdText: string;
}

export interface Message {
  role: "user" | "assistant";
  content: string;
  score?: number;
  feedback?: string;
}

export interface InterviewState {
  phase: "upload" | "ready" | "interviewing" | "complete";
  currentQuestion: number;
  totalQuestions: number;
  messages: Message[];
  sessionScore: number;
}

export interface PerformanceReport {
  overallScore: number;
  categoryScores: {
    technicalSkills: number;
    communication: number;
    problemSolving: number;
    relevance: number;
  };
  strengths: string[];
  areasToImprove: string[];
  actionPlan: string[];
  topMissingSkills: string[];
}