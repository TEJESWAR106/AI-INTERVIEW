import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { retrieveContext } from "./vectorStore";

const llm = new ChatOpenAI({
  model: "gpt-4o",
  temperature: 0.7,
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateQuestion(
  vectorStore: MemoryVectorStore,
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
- Questions 1-3: warm-up / background questions
- Questions 4-6: technical / skill-based questions  
- Questions 7-8: behavioral / situational questions
- Do not repeat topics already covered
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
  vectorStore: MemoryVectorStore,
  jdAnalysis: any
): Promise<{ score: number; feedback: string }> {
  const context = await retrieveContext(vectorStore, question, 3);

  const prompt = PromptTemplate.fromTemplate(`
You are evaluating a candidate's interview answer.

QUESTION: {question}
CANDIDATE'S ANSWER: {answer}
RELEVANT CONTEXT: {context}
REQUIRED SKILLS: {skills}

Score the answer from 1-10 and provide specific feedback.

Return JSON only:
{{
  "score": 7,
  "feedback": "Your answer demonstrated X but lacked Y."
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
    return { score: 5, feedback: "Answer received." };
  }
}