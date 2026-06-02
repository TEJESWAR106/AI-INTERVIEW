export const runtime = "nodejs";
export const maxDuration = 60;

// ... rest of your existing chat route code unchanged
import { NextRequest, NextResponse } from "next/server";
import { sessionStore } from "../upload/route";
import { generateQuestion, scoreAnswer } from "@/lib/interviewChain";
import { generatePerformanceReport } from "@/lib/scoreAnalyzer";

export async function POST(req: NextRequest) {
  try {
    const { sessionId, userAnswer, action } = await req.json();

    const session = sessionStore[sessionId];
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Start interview — generate first question
    if (action === "start") {
      session.questionNumber = 1;
      const previousQA = "";
      const question = await generateQuestion(
        session.vectorStore,
        1,
        previousQA,
        session.jdAnalysis
      );

      session.messages.push({ role: "assistant", content: question });

      return NextResponse.json({
        question,
        questionNumber: 1,
        totalQuestions: 8,
      });
    }

    // Process user answer + generate next question
    if (action === "answer") {
      // Score the answer
      const lastQuestion = session.messages
        .filter((m: any) => m.role === "assistant")
        .at(-1)?.content || "";

      const { score, feedback } = await scoreAnswer(
        lastQuestion,
        userAnswer,
        session.vectorStore,
        session.jdAnalysis
      );

      session.messages.push({
        role: "user",
        content: userAnswer,
        score,
        feedback,
      });

      session.questionNumber += 1;

      // Interview complete
      if (session.questionNumber > 8) {
        const report = await generatePerformanceReport(
          session.messages,
          session.jdAnalysis
        );
        return NextResponse.json({ done: true, report, score, feedback });
      }

      // Build Q&A history string
      const previousQA = session.messages
        .map((m: any) => `${m.role}: ${m.content}`)
        .join("\n");

      const nextQuestion = await generateQuestion(
        session.vectorStore,
        session.questionNumber,
        previousQA,
        session.jdAnalysis
      );

      session.messages.push({ role: "assistant", content: nextQuestion });

      return NextResponse.json({
        question: nextQuestion,
        questionNumber: session.questionNumber,
        totalQuestions: 8,
        lastScore: score,
        lastFeedback: feedback,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Chat failed" }, { status: 500 });
  }
}