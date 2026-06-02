// CHANGED: ChatOpenAI → ChatGroq, modelName → llama-3.3-70b-versatile
import { ChatGroq } from "@langchain/groq";
import { PromptTemplate } from "@langchain/core/prompts";
import { Message, PerformanceReport } from "@/types";

const llm = new ChatGroq({
  model: "llama-3.3-70b-versatile",
  temperature: 0.3,
  apiKey: process.env.GROQ_API_KEY,
});

export async function generatePerformanceReport(
  messages: Message[],
  jdAnalysis: any
): Promise<PerformanceReport> {
  const qaHistory = messages
    .filter((m) => m.role === "assistant" || m.role === "user")
    .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
    .join("\n");

  const scores = messages
    .filter((m) => m.score !== undefined)
    .map((m) => m.score as number);

  const avgScore =
    scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 5;

  const prompt = PromptTemplate.fromTemplate(`
You are an interview coach generating a performance report.

INTERVIEW TRANSCRIPT:
{transcript}

JOB ROLE: {jobTitle}
MISSING SKILLS: {missingSkills}
AVERAGE ANSWER SCORE: {avgScore}/10

Generate a detailed performance report as JSON:
{{
  "overallScore": {avgScore},
  "categoryScores": {{
    "technicalSkills": 0-100,
    "communication": 0-100,
    "problemSolving": 0-100,
    "relevance": 0-100
  }},
  "strengths": ["strength1", "strength2", "strength3"],
  "areasToImprove": ["area1", "area2", "area3"],
  "actionPlan": [
    "Action step 1 with specific resource",
    "Action step 2",
    "Action step 3"
  ],
  "topMissingSkills": ["skill1", "skill2"]
}}

Return ONLY JSON.
`);

  const chain = prompt.pipe(llm);
  const result = await chain.invoke({
    transcript: qaHistory,
    jobTitle: jdAnalysis.jobTitle,
    missingSkills: jdAnalysis.missingSkills.join(", "),
    avgScore: avgScore.toString(),
  });

  try {
    const content = result.content as string;
    const clean = content.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch {
    throw new Error("Failed to generate report");
  }
}