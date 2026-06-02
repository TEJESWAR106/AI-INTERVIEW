"use client";
import { PerformanceReport } from "@/types";

interface Props {
  report: PerformanceReport;
  onRestart: () => void;
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  const color = value >= 70 ? "bg-green-500" : value >= 50 ? "bg-amber-500" : "bg-red-500";
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-700">{label}</span>
        <span className="font-medium">{value}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div className={`${color} h-2 rounded-full transition-all`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export default function ScoreReport({ report, onRestart }: Props) {
  const overallPercent = Math.round((report.overallScore / 10) * 100);

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-2xl shadow-lg space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800">Interview Performance Report</h2>
        <div className="mt-4 inline-block">
          <div className="text-6xl font-bold text-blue-600">{report.overallScore}<span className="text-2xl text-gray-400">/10</span></div>
          <p className="text-gray-500 mt-1">Overall Score</p>
        </div>
      </div>

      {/* Category Scores */}
      <div>
        <h3 className="font-semibold text-gray-800 mb-3">Performance Breakdown</h3>
        <div className="space-y-3">
          <ScoreBar label="Technical Skills" value={report.categoryScores.technicalSkills} />
          <ScoreBar label="Communication" value={report.categoryScores.communication} />
          <ScoreBar label="Problem Solving" value={report.categoryScores.problemSolving} />
          <ScoreBar label="Relevance to JD" value={report.categoryScores.relevance} />
        </div>
      </div>

      {/* Strengths */}
      <div>
        <h3 className="font-semibold text-green-700 mb-2">✓ Your Strengths</h3>
        <ul className="space-y-1">
          {report.strengths.map((s, i) => (
            <li key={i} className="text-sm text-gray-700 flex gap-2">
              <span className="text-green-500">•</span>{s}
            </li>
          ))}
        </ul>
      </div>

      {/* Areas to Improve */}
      <div>
        <h3 className="font-semibold text-amber-700 mb-2">⚠ Areas to Improve</h3>
        <ul className="space-y-1">
          {report.areasToImprove.map((a, i) => (
            <li key={i} className="text-sm text-gray-700 flex gap-2">
              <span className="text-amber-500">•</span>{a}
            </li>
          ))}
        </ul>
      </div>

      {/* Action Plan */}
      <div className="bg-blue-50 rounded-xl p-4">
        <h3 className="font-semibold text-blue-800 mb-2">📋 Action Plan</h3>
        <ol className="space-y-2">
          {report.actionPlan.map((step, i) => (
            <li key={i} className="text-sm text-blue-700 flex gap-2">
              <span className="font-bold">{i + 1}.</span>{step}
            </li>
          ))}
        </ol>
      </div>

      {/* Missing Skills */}
      {report.topMissingSkills?.length > 0 && (
        <div>
          <h3 className="font-semibold text-red-700 mb-2">Skills Gap</h3>
          <div className="flex flex-wrap gap-2">
            {report.topMissingSkills.map((s, i) => (
              <span key={i} className="px-3 py-1 bg-red-50 text-red-700 rounded-full text-xs font-medium">
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={onRestart}
        className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700"
      >
        Start New Interview
      </button>
    </div>
  );
}