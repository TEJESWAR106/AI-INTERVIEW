import { NextRequest, NextResponse } from "next/server";
import { extractTextFromPDF, cleanText } from "@/lib/pdfParser";
import { analyzeJD } from "@/lib/jdAnalyzer";
import { createVectorStore } from "@/lib/vectorStore";

// In-memory store (use Redis in production)
export const sessionStore: Record<string, any> = {};

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const resumeFile = formData.get("resume") as File;
    const jdFile = formData.get("jd") as File;

    if (!resumeFile || !jdFile) {
      return NextResponse.json({ error: "Both files required" }, { status: 400 });
    }

    // Extract text from PDFs
    const resumeBuffer = Buffer.from(await resumeFile.arrayBuffer());
    const jdBuffer = Buffer.from(await jdFile.arrayBuffer());

    const resumeText = cleanText(await extractTextFromPDF(resumeBuffer));
    const jdText = cleanText(await extractTextFromPDF(jdBuffer));

    // Analyze JD vs Resume
    const jdAnalysis = await analyzeJD(jdText, resumeText);

    // Build vector store
    const vectorStore = await createVectorStore(resumeText, jdText);

    // Create session
    const sessionId = `session_${Date.now()}`;
    sessionStore[sessionId] = {
      resumeText,
      jdText,
      jdAnalysis,
      vectorStore,
      messages: [],
      questionNumber: 0,
    };

    return NextResponse.json({
      sessionId,
      jdAnalysis,
      message: "Files processed successfully",
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}