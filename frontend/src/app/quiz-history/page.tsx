"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronRight, CheckCircle, XCircle, Clock, TrendingUp, BookOpen, Brain, ArrowLeft } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getQuizHistory } from "@/services/quizService";
import { DancingSquares } from "@/components/shared/DancingSquares";

interface Attempt {
 id: number;
 question_text: string;
 selected_option: string;
 correct_option: string;
 is_correct: boolean;
 answer_options: { [key: string]: string } | null;
 explanation: string | null;
 bloom_level: string | null;
 difficulty: number | null;
 theta_before: number;
 theta_after: number;
 misconception: string | null;
 timestamp: string | null;
}

interface GroupedHistory {
 topic: string;
 subtopic: string;
 total_attempts: number;
 correct_attempts: number;
 accuracy: number;
 next_review_date: string | null;
 attempts: Attempt[];
}

export default function QuizHistoryPage() {
 const router = useRouter();
 const { user, isLoading: authLoading } = useAuth();
 const [history, setHistory] = useState<{ grouped_history: GroupedHistory[]; total_attempts: number; overall_accuracy: number } | null>(null);
 const [loading, setLoading] = useState(true);
 const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
 const [selectedAttempt, setSelectedAttempt] = useState<Attempt | null>(null);

 useEffect(() => {
 if (authLoading) return;
 if (!user) {
 router.push("/login");
 return;
 }

 getQuizHistory()
 .then((data) => setHistory(data))
 .catch((e) => console.error("Failed to load quiz history:", e))
 .finally(() => setLoading(false));
 }, [authLoading, user, router]);

 const toggleGroup = (topic: string, subtopic: string) => {
 const key = `${topic}|${subtopic}`;
 const newExpanded = new Set(expandedGroups);
 if (newExpanded.has(key)) {
 newExpanded.delete(key);
 } else {
 newExpanded.add(key);
 }
 setExpandedGroups(newExpanded);
 };

 const formatDate = (timestamp: string | null) => {
 if (!timestamp) return "Unknown";
 const date = new Date(timestamp);
 return date.toLocaleDateString("en-US", { 
 month: "short", 
 day: "numeric", 
 year: "numeric",
 hour: "2-digit",
 minute: "2-digit"
 });
 };

 const formatNextReview = (iso: string | null): { relative: string; exact: string; overdue: boolean } | null => {
 if (!iso) return null;
 const date = new Date(iso);
 const now = new Date();
 const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
 const exact = date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
 if (diffDays <= 0) return { relative: "Due now", exact, overdue: true };
 if (diffDays === 1) return { relative: "Tomorrow", exact, overdue: false };
 return { relative: `In ${diffDays} days`, exact, overdue: false };
 };

 const getBloomColor = (level: string | null) => {
 if (!level) return "var(--muted)";
 const colors: { [key: string]: string } = {
 "remember": "var(--primary)",
 "understand": "var(--info)",
 "apply": "var(--success)",
 "analyze": "var(--warning)",
 "evaluate": "var(--error)",
 "create": "var(--primary-light)"
 };
 return colors[level.toLowerCase()] || "var(--muted)";
 };

 if (authLoading || loading || !user) {
 return (
 <div className="app-page" style={{ minHeight: "60vh", display: "grid", placeItems: "center" }}>
 <DancingSquares size="lg" label="Loading your quiz history..." />
 </div>
 );
 }

 if (!history || history.grouped_history.length === 0) {
 return (
 <div className="app-page">
 <div className="app-shell-wide">
 <div style={{ marginBottom: "var(--space-8)" }}>
 <Link href="/dashboard" style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-2)", color: "var(--primary)", textDecoration: "none", fontWeight: "var(--font-semibold)" }}>
 <ArrowLeft size="var(--icon-lg)" />
 Back to Dashboard
 </Link>
 </div>

 <div className="card" style={{ textAlign: "center", padding: "var(--space-12) var(--space-8)" }}>
 <BookOpen size="var(--icon-3xl)" color="var(--muted)" style={{ marginBottom: "var(--space-4)" }} />
 <h2 style={{ fontSize: "var(--text-2xl)", fontWeight: "var(--font-extrabold)", margin: "0 0 var(--space-2)" }}>No quiz attempts yet</h2>
 <p style={{ color: "var(--muted)", margin: "0 0 var(--space-6)" }}>
 Take your first quiz to start building your history!
 </p>
 <Link
 href="/quiz"
 style={{
 display: "inline-flex",
 alignItems: "center",
 gap: "var(--space-2)",
 background: "var(--primary)",
 color: "white",
 padding: "var(--space-3) var(--space-6)",
 borderRadius: "var(--radius-full)",
 textDecoration: "none",
 fontWeight: "var(--font-bold)"
 }}
 >
 Start Quiz
 <ChevronRight size="var(--icon-lg)" />
 </Link>
 </div>
 </div>
 </div>
 );
 }

 return (
 <div className="app-page">
 <div className="app-shell-wide">
 <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-8)" }}>
 <div>
 <Link href="/dashboard" style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-2)", color: "var(--primary)", textDecoration: "none", fontWeight: "var(--font-semibold)", marginBottom: "var(--space-2)" }}>
 <ArrowLeft size="var(--icon-lg)" />
 Back to Dashboard
 </Link>
 <h1 className="chunky-heading" style={{ fontSize: "var(--heading-lg)", margin: "var(--space-2) 0 0" }}>Quiz History</h1>
 <p style={{ color: "var(--muted)", margin: "var(--space-2) 0 0" }}>
 Review your past attempts and track your progress
 </p>
 </div>

 <div style={{ display: "flex", gap: "var(--space-4)" }}>
 <div className="stat-card" style={{ padding: "var(--space-4) var(--space-6)", minWidth: "140px" }}>
 <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: "var(--space-2)" }}>
 <Brain size="var(--icon-lg)" color="var(--primary)" />
 <span style={{ color: "var(--muted)", fontSize: "var(--text-xs)", fontWeight: "var(--font-black)", textTransform: "uppercase" }}>Total Attempts</span>
 </div>
 <div className="stat-number">{history.total_attempts}</div>
 </div>

 <div className="stat-card" style={{ padding: "var(--space-4) var(--space-6)", minWidth: "140px" }}>
 <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: "var(--space-2)" }}>
 <TrendingUp size="var(--icon-lg)" color="var(--coral)" />
 <span style={{ color: "var(--muted)", fontSize: "var(--text-xs)", fontWeight: "var(--font-black)", textTransform: "uppercase" }}>Accuracy</span>
 </div>
 <div className="stat-number">{history.overall_accuracy}%</div>
 </div>
 </div>
 </div>

 <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
 {history.grouped_history.map((group) => {
 const key = `${group.topic}|${group.subtopic}`;
 const isExpanded = expandedGroups.has(key);
 
 return (
 <div key={key} className="card" style={{ overflow: "hidden" }}>
 <div
 style={{
 display: "flex",
 justifyContent: "space-between",
 alignItems: "center",
 padding: "var(--space-5) var(--space-6)",
 cursor: "pointer",
 background: isExpanded ? "var(--surface-low)" : "transparent"
 }}
 onClick={() => toggleGroup(group.topic, group.subtopic)}
 >
 <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)" }}>
 <div style={{
 width: "var(--icon-3xl)",
 height: "var(--icon-3xl)",
 borderRadius: "var(--radius-lg)",
 background: "var(--primary-soft)",
 display: "grid",
 placeItems: "center"
 }}>
 <BookOpen size="var(--icon-xl)" color="var(--primary)" />
 </div>
 <div>
 <h3 style={{ fontSize: "var(--text-lg)", fontWeight: "var(--font-extrabold)", margin: 0 }}>{group.topic}</h3>
 <p style={{ color: "var(--muted)", fontSize: "var(--text-sm)", margin: "var(--space-1) 0 0" }}>{group.subtopic}</p>
 </div>
 </div>

 <div style={{ display: "flex", alignItems: "center", gap: "var(--space-8)" }}>
 <div style={{ textAlign: "right" }}>
 <div style={{ fontSize: "var(--text-xl)", fontWeight: "var(--font-extrabold)", color: group.accuracy >= 70 ? "var(--primary)" : group.accuracy >= 50 ? "var(--warning)" : "var(--coral)" }}>
 {group.accuracy}%
 </div>
 <div style={{ color: "var(--muted)", fontSize: "var(--text-xs)" }}>
 {group.correct_attempts}/{group.total_attempts} correct
 </div>
 </div>

 {/* Next Review Badge */}
 {group.next_review_date && (() => {
 const review = formatNextReview(group.next_review_date);
 if (!review) return null;
 return (
 <div style={{
 display: "flex",
 flexDirection: "column",
 alignItems: "center",
 gap: "1px",
 background: review.overdue ? "var(--error-soft)" : "var(--primary-soft)",
 color: review.overdue ? "var(--error)" : "var(--primary)",
 border: `1px solid ${review.overdue ? "var(--error)" : "var(--primary)"}`,
 borderRadius: "var(--radius-lg)",
 padding: "var(--space-1) var(--space-3)",
 minWidth: "80px",
 textAlign: "center",
 }}>
 <div style={{ display: "flex", alignItems: "center", gap: "var(--space-1)" }}>
 <Clock size={10} style={{ flexShrink: 0 }} />
 <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-extrabold)", whiteSpace: "nowrap" }}>
 {review.exact}
 </span>
 </div>
 <span style={{ fontSize: "10px", fontWeight: "var(--font-semibold)", opacity: 0.75, whiteSpace: "nowrap" }}>
 {review.relative}
 </span>
 </div>
 );
 })()}

 <ChevronRight
 size="var(--icon-lg)"
 color="var(--muted)"
 style={{ transition: "transform var(--transition-base)", transform: isExpanded ? "rotate(90deg)" : "none" }}
 />
 </div>
 </div>
 
 {isExpanded && (
 <div style={{ borderTop: "1px solid var(--outline)", padding: "var(--space-6)" }}>
 <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
 {group.attempts.map((attempt) => (
 <div
 key={attempt.id}
 className="card"
 style={{
 padding: "var(--space-4) var(--space-5)",
 cursor: "pointer",
 background: attempt.is_correct ? "var(--success-soft)" : "var(--error-soft)",
 borderColor: attempt.is_correct ? "var(--success)" : "var(--error)"
 }}
 onClick={() => setSelectedAttempt(attempt)}
 >
 <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: "var(--space-4)" }}>
 <div style={{ flex: 1 }}>
 <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: "var(--space-2)" }}>
 {attempt.is_correct ? (
 <CheckCircle size="var(--icon-sm)" color="var(--success)" />
 ) : (
 <XCircle size="var(--icon-sm)" color="var(--error)" />
 )}
 <span style={{ fontSize: "var(--text-sm)", color: "var(--muted)" }}>
 {formatDate(attempt.timestamp)}
 </span>
 {attempt.bloom_level && (
 <span
 style={{
 fontSize: "var(--text-xs)",
 padding: "var(--space-1) var(--space-2)",
 borderRadius: "var(--radius-sm)",
 background: getBloomColor(attempt.bloom_level),
 color: "white",
 fontWeight: "var(--font-semibold)",
 textTransform: "capitalize"
 }}
 >
 {attempt.bloom_level}
 </span>
 )}
 </div>
 <p style={{ fontSize: "var(--text-base)", fontWeight: "var(--font-semibold)", margin: 0, lineHeight: "var(--leading-snug)" }}>
 {attempt.question_text.length > 100
 ? attempt.question_text.substring(0, 100) + "..."
 : attempt.question_text}
 </p>
 </div>

 <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)", alignItems: "end" }}>
 <div style={{ fontSize: "var(--text-sm)", color: "var(--muted)" }}>
 θ: {attempt.theta_before.toFixed(2)} → {attempt.theta_after.toFixed(2)}
 </div>
 {attempt.difficulty && (
 <div style={{ fontSize: "var(--text-sm)", color: "var(--muted)" }}>
 b: {attempt.difficulty.toFixed(2)}
 </div>
 )}
 </div>
 </div>
 </div>
 ))}
 </div>
 </div>
 )}
 </div>
 );
 })}
 </div>
 </div>

 {/* Question Detail Modal */}
 {selectedAttempt && (
 <div
 style={{
 position: "fixed",
 inset: 0,
 background: "rgba(0, 0, 0, 0.5)",
 display: "grid",
 placeItems: "center",
 zIndex: "var(--z-modal)",
 padding: "var(--space-4)"
 }}
 onClick={() => setSelectedAttempt(null)}
 >
 <div
 className="card"
 style={{
 maxWidth: "700px",
 width: "100%",
 maxHeight: "90vh",
 overflowY: "auto",
 padding: "var(--space-8)"
 }}
 onClick={(e) => e.stopPropagation()}
 >
 <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "var(--space-6)" }}>
 <h2 style={{ fontSize: "var(--text-2xl)", fontWeight: "var(--font-extrabold)", margin: 0 }}>Question Details</h2>
 <button
 onClick={() => setSelectedAttempt(null)}
 style={{
 background: "none",
 border: "none",
 cursor: "pointer",
 padding: "var(--space-2)",
 borderRadius: "var(--radius-md)"
 }}
 >
 
 </button>
 </div>

 <div style={{ marginBottom: "var(--space-6)" }}>
 <p style={{ fontSize: "var(--text-lg)", fontWeight: "var(--font-semibold)", lineHeight: "var(--leading-relaxed)", margin: 0 }}>
 {selectedAttempt.question_text}
 </p>
 </div>

 {selectedAttempt.answer_options && (
 <div style={{ marginBottom: "var(--space-6)" }}>
 <h4 style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-bold)", color: "var(--muted)", marginBottom: "var(--space-3)", textTransform: "uppercase" }}>
 Answer Options
 </h4>
 <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
 {Object.entries(selectedAttempt.answer_options).map(([key, value]) => {
 const isSelected = key === selectedAttempt.selected_option;
 const isCorrect = key === selectedAttempt.correct_option;

 let bgColor = "var(--surface-low)";
 let borderColor = "var(--outline)";

 if (isSelected && isCorrect) {
 bgColor = "var(--success-soft)";
 borderColor = "var(--success)";
 } else if (isSelected && !isCorrect) {
 bgColor = "var(--error-soft)";
 borderColor = "var(--error)";
 } else if (isCorrect) {
 bgColor = "var(--success-soft)";
 borderColor = "var(--success)";
 }

 return (
 <div
 key={key}
 style={{
 padding: "var(--space-3) var(--space-4)",
 borderRadius: "var(--radius-md)",
 background: bgColor,
 border: `1px solid ${borderColor}`,
 display: "flex",
 alignItems: "center",
 gap: "var(--space-3)"
 }}
 >
 <span style={{
 fontWeight: "var(--font-bold)",
 fontSize: "var(--text-sm)",
 minWidth: "var(--space-6)"
 }}>
 {key}
 </span>
 <span style={{ fontSize: "var(--text-base)" }}>{value}</span>
 {isCorrect && (
 <CheckCircle size="var(--icon-sm)" color="var(--success)" style={{ marginLeft: "auto" }} />
 )}
 {isSelected && !isCorrect && (
 <XCircle size="var(--icon-sm)" color="var(--error)" style={{ marginLeft: "auto" }} />
 )}
 </div>
 );
 })}
 </div>
 </div>
 )}

 {selectedAttempt.explanation && (
 <div style={{ marginBottom: "var(--space-6)" }}>
 <h4 style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-bold)", color: "var(--muted)", marginBottom: "var(--space-3)", textTransform: "uppercase" }}>
 Explanation
 </h4>
 <div style={{
 padding: "var(--space-4)",
 background: "var(--surface-low)",
 borderRadius: "var(--radius-md)",
 fontSize: "var(--text-base)",
 lineHeight: "var(--leading-relaxed)"
 }}>
 {selectedAttempt.explanation}
 </div>
 </div>
 )}

 {selectedAttempt.misconception && (
 <div style={{ marginBottom: "var(--space-6)" }}>
 <h4 style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-bold)", color: "var(--coral)", marginBottom: "var(--space-3)", textTransform: "uppercase" }}>
 Misconception Identified
 </h4>
 <div style={{
 padding: "var(--space-4)",
 background: "var(--error-soft)",
 borderRadius: "var(--radius-md)",
 fontSize: "var(--text-base)",
 lineHeight: "var(--leading-relaxed)",
 border: "1px solid var(--error)"
 }}>
 {selectedAttempt.misconception}
 </div>
 </div>
 )}

 <div style={{ display: "flex", gap: "var(--space-4)", padding: "var(--space-4)", background: "var(--surface-low)", borderRadius: "var(--radius-md)" }}>
 <div style={{ flex: 1 }}>
 <div style={{ fontSize: "var(--text-xs)", color: "var(--muted)", marginBottom: "var(--space-1)" }}>Ability (θ) Change</div>
 <div style={{ fontSize: "var(--text-lg)", fontWeight: "var(--font-bold)" }}>
 {selectedAttempt.theta_before.toFixed(2)} → {selectedAttempt.theta_after.toFixed(2)}
 </div>
 </div>
 {selectedAttempt.difficulty && (
 <div style={{ flex: 1 }}>
 <div style={{ fontSize: "var(--text-xs)", color: "var(--muted)", marginBottom: "var(--space-1)" }}>Difficulty (b)</div>
 <div style={{ fontSize: "var(--text-lg)", fontWeight: "var(--font-bold)" }}>
 {selectedAttempt.difficulty.toFixed(2)}
 </div>
 </div>
 )}
 {selectedAttempt.bloom_level && (
 <div style={{ flex: 1 }}>
 <div style={{ fontSize: "var(--text-xs)", color: "var(--muted)", marginBottom: "var(--space-1)" }}>Bloom's Level</div>
 <div style={{ fontSize: "var(--text-lg)", fontWeight: "var(--font-bold)", textTransform: "capitalize" }}>
 {selectedAttempt.bloom_level}
 </div>
 </div>
 )}
 </div>

 <div style={{ marginTop: "var(--space-6)", textAlign: "center" }}>
 <button
 onClick={() => setSelectedAttempt(null)}
 style={{
 background: "var(--primary)",
 color: "white",
 border: "none",
 padding: "var(--space-3) var(--space-8)",
 borderRadius: "var(--radius-full)",
 fontWeight: "var(--font-bold)",
 cursor: "pointer",
 fontSize: "var(--text-base)"
 }}
 >
 Close
 </button>
 </div>
 </div>
 </div>
 )}
 </div>
 );
}