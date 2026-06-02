"use client";
import { useState } from "react";
import FileUpload from "@/components/FileUpload";
import ChatInterface from "@/components/ChatInterface";
import ScoreReport from "@/components/ScoreReport";
import { PerformanceReport } from "@/types";

type Phase = "upload" | "interview" | "report";

export default function Home() {
  const [phase, setPhase] = useState<Phase>("upload");
  const [sessionId, setSessionId] = useState("");
  const [jdAnalysis, setJdAnalysis] = useState<any>(null);
  const [report, setReport] = useState<PerformanceReport | null>(null);

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-12 px-4">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-gray-900">AI Interview Coach</h1>
        <p className="text-gray-600 mt-2">Upload your resume & JD for a personalized mock interview</p>
      </div>

      {phase === "upload" && (
        <FileUpload
          onUploaded={(id, analysis) => {
            setSessionId(id);
            setJdAnalysis(analysis);
            setPhase("interview");
          }}
        />
      )}

      {phase === "interview" && (
        <ChatInterface
          sessionId={sessionId}
          jdAnalysis={jdAnalysis}
          onComplete={(r) => {
            setReport(r);
            setPhase("report");
          }}
        />
      )}

      {phase === "report" && report && (
        <ScoreReport
          report={report}
          onRestart={() => {
            setPhase("upload");
            setSessionId("");
            setJdAnalysis(null);
            setReport(null);
          }}
        />
      )}
    </main>
  );
}