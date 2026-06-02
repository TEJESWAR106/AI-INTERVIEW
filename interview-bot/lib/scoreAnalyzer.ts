import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";

const llm = new ChatOpenAI({
  model: "gpt-4o",
  temperature: 0.3,
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generatePerformanceReport(messages: any[], jdAnalysis: any) {
  const qaHistory = messages
    .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
    .join("\n");

  const scores = messages
    .filter((m) => m.score !== undefined)
    .map((m) => m.score as number);

  const avgScore = scores.length > 0
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : 5;

  const prompt = PromptTemplate.fromTemplate(`
You are an interview coach generating a performance report.

INTERVIEW TRANSCRIPT:
{transcript}

JOB ROLE: {jobTitle}
MISSING SKILLS: {missingSkills}
AVERAGE SCORE: {avgScore}/10

Return JSON only:
{{
  "overallScore": {avgScore},
  "categoryScores": {{
    "technicalSkills": 0,
    "communication": 0,
    "problemSolving": 0,
    "relevance": 0
  }},
  "strengths": ["strength1", "strength2"],
  "areasToImprove": ["area1", "area2"],
  "actionPlan": ["step1", "step2", "step3"],
  "topMissingSkills": ["skill1", "skill2"]
}}
`);

  const chain = prompt.pipe(llm);
  const result = await chain.invoke({
    transcript: qaHistory,
    jobTitle: jdAnalysis.jobTitle,
    missingSkills: jdAnalysis.missingSkills.join(", "),
    avgScore: avgScore.toString(),
  });

  const content = result.content as string;
  const clean = content.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
}