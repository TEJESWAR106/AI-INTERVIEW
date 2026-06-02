// CHANGED: ChatOpenAI → ChatGroq, modelName → llama-3.3-70b-versatile
import { ChatGroq } from "@langchain/groq";
import { PromptTemplate } from "@langchain/core/prompts";
import { SimpleVectorStore } from "./vectorStore";
import { retrieveContext } from "./vectorStore";

const llm = new ChatGroq({
  model: "llama-3.3-70b-versatile",
  temperature: 0.7,
  apiKey: process.env.GROQ_API_KEY,
});

export async function generateQuestion(
  vectorStore: SimpleVectorStore,
  questionNumber: number,
  previousQA: string,
  jdAnalysis: any
): Promise<string> {
  const context = await retrieveContext(
    vectorStore,
    jdAnalysis.keyTopics.join(" "),
    4
  );

  const prompt = PromptTemplate.fromTemplate(`
You are a senior technical interviewer. Ask question #{questionNumber} of 8.

CONTEXT FROM RESUME & JD:
{context}

JOB ROLE: {jobTitle}
KEY SKILLS NEEDED: {skills}

PREVIOUS Q&A:
{previousQA}

Rules:
- If question 1-3: ask warm-up / background questions
- If question 4-6: ask technical / skill-based questions
- If question 7-8: ask behavioral / situational questions
- Vary question types, do not repeat topics
- Keep question concise and professional

Ask ONLY the question. No preamble.
`);

  const chain = prompt.pipe(llm);
  const result = await chain.invoke({
    questionNumber: questionNumber.toString(),
    context,
    jobTitle: jdAnalysis.jobTitle,
    skills: jdAnalysis.requiredSkills.slice(0, 6).join(", "),
    previousQA: previousQA || "None yet",
  });

  return result.content as string;
}

export async function scoreAnswer(
  question: string,
  answer: string,
  vectorStore: SimpleVectorStore,
  jdAnalysis: any
): Promise<{ score: number; feedback: string }> {
  const context = await retrieveContext(vectorStore, question, 3);

  const prompt = PromptTemplate.fromTemplate(`
You are evaluating a candidate's interview answer.

QUESTION: {question}
CANDIDATE'S ANSWER: {answer}
RELEVANT CONTEXT (from resume/JD): {context}
REQUIRED SKILLS: {skills}

Score the answer from 1-10 and provide specific feedback.

Return JSON only:
{{
  "score": 7,
  "feedback": "Your answer demonstrated X but lacked Y. Consider Z."
}}
`);

  const chain = prompt.pipe(llm);
  const result = await chain.invoke({
    question,
    answer,
    context,
    skills: jdAnalysis.requiredSkills.join(", "),
  });

  try {
    const content = result.content as string;
    const clean = content.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch {
    return { score: 5, feedback: "Answer received. Keep practicing!" };
  }
}