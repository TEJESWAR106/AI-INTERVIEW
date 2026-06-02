// CHANGED: ChatOpenAI → ChatGroq, modelName → llama-3.3-70b-versatile
import { ChatGroq } from "@langchain/groq";
import { PromptTemplate } from "@langchain/core/prompts";

const llm = new ChatGroq({
  model: "llama-3.3-70b-versatile",
  temperature: 0.2,
  apiKey: process.env.GROQ_API_KEY,
});

export async function analyzeJD(jdText: string, resumeText: string) {
  const prompt = PromptTemplate.fromTemplate(`
You are an expert HR analyst. Analyze the job description and resume below.

JOB DESCRIPTION:
{jd}

CANDIDATE RESUME:
{resume}

Return a JSON object with:
{{
  "jobTitle": "string",
  "requiredSkills": ["skill1", "skill2"],
  "candidateSkills": ["skill1", "skill2"],
  "missingSkills": ["skill1"],
  "experienceMatch": "low | medium | high",
  "keyTopics": ["topic1", "topic2"],
  "suggestedQuestionCategories": ["Technical", "Behavioral", "Situational"]
}}

Return ONLY the JSON. No extra text.
`);

  const chain = prompt.pipe(llm);
  const result = await chain.invoke({ jd: jdText, resume: resumeText });

  try {
    const content = result.content as string;
    const clean = content.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch {
    throw new Error("Failed to parse JD analysis");
  }
}