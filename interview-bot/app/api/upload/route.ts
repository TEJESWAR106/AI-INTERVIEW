export const runtime = "nodejs";
export const maxDuration = 60;

import { NextRequest, NextResponse } from "next/server";
import { analyzeJD } from "@/lib/jdAnalyzer";
import { createVectorStore } from "@/lib/vectorStore";
import { cleanText } from "@/lib/pdfParser";

export const sessionStore: Record<string, any> = {};

async function extractPDFText(buffer: Buffer): Promise<string> {
  try {
    // Dynamic import avoids module resolution issues on Vercel
    const pdfParse = require("pdf-parse");
    const data = await pdfParse(buffer);
    return data.text.trim();
  } catch {
    // Fallback: return buffer as plain text if PDF parsing fails
    return buffer.toString("utf-8").replace(/[^\x20-\x7E\n]/g, " ").trim();
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const resumeFile = formData.get("resume") as File;
    const jdFile = formData.get("jd") as File;

    if (!resumeFile || !jdFile) {
      return NextResponse.json(
        { error: "Both files required" },
        { status: 400 }
      );
    }

    const resumeBuffer = Buffer.from(await resumeFile.arrayBuffer());
    const jdBuffer = Buffer.from(await jdFile.arrayBuffer());

    const resumeText = cleanText(await extractPDFText(resumeBuffer));
    const jdText = cleanText(await extractPDFText(jdBuffer));

    if (!resumeText || !jdText) {
      return NextResponse.json(
        { error: "Could not extract text from PDFs" },
        { status: 400 }
      );
    }

    const jdAnalysis = await analyzeJD(jdText, resumeText);
    const vectorStore = await createVectorStore(resumeText, jdText);

    const sessionId = `session_${Date.now()}`;
    sessionStore[sessionId] = {
      resumeText,
      jdText,
      jdAnalysis,
      vectorStore,
      messages: [],
      questionNumber: 0,
    };

    return NextResponse.json({ sessionId, jdAnalysis });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: error.message || "Processing failed" },
      { status: 500 }
    );
  }
}