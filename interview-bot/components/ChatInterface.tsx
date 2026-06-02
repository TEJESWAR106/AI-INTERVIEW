"use client";
import { useState, useRef, useEffect } from "react";
import { Message } from "@/types";

interface Props {
  sessionId: string;
  jdAnalysis: any;
  onComplete: (report: any) => void;
}

export default function ChatInterface({ sessionId, jdAnalysis, onComplete }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 8 });
  const [lastFeedback, setLastFeedback] = useState<{score: number; text: string} | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const startInterview = async () => {
    setLoading(true);
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, action: "start" }),
    });
    const data = await res.json();
    setMessages([{ role: "assistant", content: data.question }]);
    setProgress({ current: 1, total: 8 });
    setStarted(true);
    setLoading(false);
  };

  const sendAnswer = async () => {
    if (!input.trim()) return;
    const answer = input.trim();
    setInput("");
    setLoading(true);

    setMessages((prev) => [...prev, { role: "user", content: answer }]);

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, userAnswer: answer, action: "answer" }),
    });
    const data = await res.json();

    if (data.done) {
      onComplete(data.report);
    } else {
      setLastFeedback({ score: data.lastScore, text: data.lastFeedback });
      setMessages((prev) => [...prev, { role: "assistant", content: data.question }]);
      setProgress({ current: data.questionNumber, total: 8 });
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto flex flex-col h-[80vh] bg-white rounded-2xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-blue-600 text-white">
        <h2 className="font-bold text-lg">Mock Interview — {jdAnalysis.jobTitle}</h2>
        <div className="flex items-center gap-2 mt-1">
          <div className="flex-1 bg-blue-400 rounded-full h-2">
            <div
              className="bg-white rounded-full h-2 transition-all"
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            />
          </div>
          <span className="text-sm">Q {progress.current}/{progress.total}</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {!started && (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">
              Ready for your mock interview for <strong>{jdAnalysis.jobTitle}</strong>?
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Missing skills detected: {jdAnalysis.missingSkills?.slice(0,3).join(", ")}
            </p>
            <button
              onClick={startInterview}
              disabled={loading}
              className="px-8 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700"
            >
              {loading ? "Loading..." : "Begin Interview"}
            </button>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                m.role === "user"
                  ? "bg-blue-600 text-white rounded-br-sm"
                  : "bg-gray-100 text-gray-800 rounded-bl-sm"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}

        {lastFeedback && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm">
            <span className="font-medium text-amber-800">Score: {lastFeedback.score}/10</span>
            <p className="text-amber-700 mt-1">{lastFeedback.text}</p>
          </div>
        )}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-2xl px-4 py-3 text-gray-500 text-sm animate-pulse">
              Thinking...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {started && (
        <div className="p-4 border-t flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your answer..."
            rows={2}
            className="flex-1 border rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendAnswer();
              }
            }}
          />
          <button
            onClick={sendAnswer}
            disabled={loading || !input.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl font-medium disabled:opacity-50"
          >
            Send
          </button>
        </div>
      )}
    </div>
  );
}