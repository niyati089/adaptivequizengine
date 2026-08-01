"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, BarChart3, Bolt, BookOpen, ChevronRight, Download, RefreshCw, Search, Sparkles, TrendingUp, Users, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getEducatorDashboard, getReTeachingRecommendations, getStudentAnalytics } from "@/services/quizService";
import { DancingSquares } from "@/components/shared/DancingSquares";

const barColor = (score: number) => score >= 70 ? "var(--primary)" : score >= 50 ? "var(--warning)" : "var(--coral)";

export default function EducatorPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [selectedTopic, setSelectedTopic] = useState("Computer Science");
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [reTeachingText, setReTeachingText] = useState("");
  const [isGenLoading, setIsGenLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [studentAnalytics, setStudentAnalytics] = useState<any>(null);
  const [studentAnalyticsLoading, setStudentAnalyticsLoading] = useState(false);
  const [studentAnalyticsError, setStudentAnalyticsError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading) {
      if (!user) router.push("/login");
      else if (user.role !== "teacher") router.push("/dashboard");
    }
  }, [user, authLoading, router]);

  const fetchDashboardData = async (topicName: string) => {
    setIsLoading(true);
    try {
      const data = await getEducatorDashboard(topicName);
      setDashboardData(data);
      setReTeachingText("");
      setSelectedStudent(null);
      setStudentAnalytics(null);
    } catch (e) {
      console.error("Failed to fetch educator dashboard data:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFetchReTeaching = async (focusPlan = false) => {
    if (focusPlan) {
      window.setTimeout(() => document.getElementById("reteaching-plan")?.scrollIntoView({ behavior: "smooth", block: "center" }), 0);
    }
    setIsGenLoading(true);
    try {
      const data = await getReTeachingRecommendations(selectedTopic);
      setReTeachingText(data.recommendation);
    } catch (e) {
      console.error("Failed to fetch re-teaching recommendations:", e);
      setReTeachingText("Failed to generate AI plans. Please check backend Groq API configuration.");
    } finally {
      setIsGenLoading(false);
    }
  };

  const exportStudentsCsv = () => {
    const rows: string[][] = [
      ["Name", "Email", "Mastery", "Theta", "Velocity", "Subtopics Mastered"],
      ...filteredStudents.map((student: any) => [
        student.name,
        student.email || "",
        `${student.mastery}%`,
        student.theta,
        student.velocity,
        String(student.topics),
      ]),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${selectedTopic.replace(/\s+/g, "-").toLowerCase()}-students.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleCongratulate = () => {
    const topStudent = [...students].sort((a: any, b: any) => (b.mastery || 0) - (a.mastery || 0))[0];
    if (!topStudent) return;
    if (topStudent.email) {
      window.location.href = `mailto:${topStudent.email}?subject=${encodeURIComponent(`Great progress in ${selectedTopic}`)}&body=${encodeURIComponent(`Hi ${topStudent.name},\n\nGreat work on your recent progress in ${selectedTopic}. Keep it up!\n`)}`;
      return;
    }
    openStudentAnalytics(topStudent);
  };

  useEffect(() => {
    if (user?.role === "teacher") fetchDashboardData(selectedTopic);
  }, [user]);

  const openStudentAnalytics = async (student: any) => {
    setSelectedStudent(student);
    setStudentAnalytics(null);
    setStudentAnalyticsError(null);

    if (!student.id) {
      setStudentAnalyticsError("This is mock dashboard data, so no saved student analytics are available yet.");
      return;
    }

    setStudentAnalyticsLoading(true);
    try {
      const data = await getStudentAnalytics(student.id);
      setStudentAnalytics(data);
    } catch (err: any) {
      setStudentAnalyticsError(err.response?.data?.detail || "Could not load this student's analytics.");
    } finally {
      setStudentAnalyticsLoading(false);
    }
  };

  if (authLoading || !user || user.role !== "teacher") return <Loading label="Verifying credentials..." />;
  if (isLoading || !dashboardData) return <Loading label="Loading educator intelligence..." />;

  const { kpis, topic_perf, misconceptions, students } = dashboardData;
  const filteredStudents = students.filter((s: any) => s.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="app-page">
      <main className="app-shell-wide">
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: "var(--space-4)", flexWrap: "wrap", marginBottom: "var(--space-8)" }}>
          <div>
            <h1 className="chunky-heading" style={{ fontSize: "var(--heading-lg)", margin: 0 }}>Educator Intelligence Hub</h1>
            <p style={{ color: "var(--muted)", fontSize: "var(--text-base)", lineHeight: "var(--leading-relaxed)", maxWidth: "44rem", margin: "var(--space-2) 0 0" }}>
              Real-time cohort tracking and AI-driven pedagogical recommendations for {selectedTopic}.
            </p>
            {dashboardData.is_mock && <span className="badge badge-amber" style={{ marginTop: "var(--space-3)" }}>Mock Fallback</span>}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", flexWrap: "wrap" }}>
            <div style={{ display: "flex", gap: "var(--space-2)", alignItems: "center", background: "var(--surface)", border: "1px solid var(--outline)", borderRadius: "var(--radius-full)", padding: "var(--space-2) var(--space-3)" }}>
              <span style={{ color: "var(--muted)", fontSize: "var(--text-xs)", fontWeight: "var(--font-extrabold)" }}>Topic</span>
              <input value={selectedTopic} onChange={(e) => setSelectedTopic(e.target.value)} onKeyDown={(e) => e.key === "Enter" && fetchDashboardData(selectedTopic)} style={{ border: 0, outline: "none", width: "150px", fontWeight: "var(--font-bold)", background: "transparent" }} />
              <button onClick={() => fetchDashboardData(selectedTopic)} title="Refresh stats" style={{ border: 0, background: "transparent", color: "var(--primary)", display: "grid", placeItems: "center" }}>
                <RefreshCw size={15} />
              </button>
            </div>
            <Link href="/analytics" className="neo-btn neo-btn-primary">
              Deep Analytics <ChevronRight size={15} />
            </Link>
          </div>
        </header>

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "var(--space-4)", marginBottom: "var(--space-6)" }}>
          {[
            { icon: Users, label: "Active Students", value: kpis.active_students, sub: "attempted questions", wash: "var(--blue-soft)", color: "var(--primary)" },
            { icon: BookOpen, label: "Avg Class Mastery", value: kpis.avg_class_mastery, sub: "overall learning rate", wash: "var(--success-soft)", color: "var(--success)" },
            { icon: AlertTriangle, label: "Active Misconceptions", value: kpis.active_misconceptions, sub: "unique gaps detected", wash: "var(--pink-soft)", color: "var(--coral)" },
            { icon: TrendingUp, label: "Avg Theta Velocity", value: kpis.avg_theta_velocity, sub: "ability delta", wash: "var(--primary-soft)", color: "var(--primary-strong)" },
          ].map((k) => (
            <div key={k.label} className="stat-card" style={{ display: "flex", gap: "var(--space-3)", alignItems: "center" }}>
              <div className="icon-box" style={{ background: k.wash, color: k.color }}>
                <k.icon size={20} />
              </div>
              <div>
                <div style={{ color: "var(--muted)", fontSize: "var(--text-xs)", fontWeight: "var(--font-extrabold)" }}>{k.label}</div>
                <div style={{ fontSize: "var(--text-3xl)", fontWeight: "var(--font-black)", lineHeight: "var(--leading-tight)" }}>{k.value}</div>
                <div style={{ color: "var(--muted)", fontSize: "var(--text-xs)" }}>{k.sub}</div>
              </div>
            </div>
          ))}
        </section>

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))", gap: "var(--space-6)", alignItems: "start" }}>
          <div style={{ display: "grid", gap: "var(--space-6)" }}>
            <div className="glass-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "var(--space-4)", flexWrap: "wrap", marginBottom: "var(--space-5)" }}>
                <h2 style={{ fontSize: "var(--text-xl)", fontWeight: "var(--font-black)", margin: 0 }}>Class Pulse: Subtopic Mastery</h2>
                <div style={{ display: "flex", gap: "var(--space-3)", color: "var(--muted)", fontSize: "var(--text-sm)", fontWeight: "var(--font-bold)" }}>
                  <Legend color="var(--coral)" label="Needs Attention" />
                  <Legend color="var(--primary)" label="Mastered" />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "var(--space-4)" }}>
                {topic_perf.map((topic: any) => (
                  <div key={topic.topic} style={{ background: "var(--surface-low)", borderLeft: `var(--space-1) solid ${barColor(topic.score)}`, borderRadius: "var(--radius-lg)", padding: "var(--space-4)" }}>
                    <p style={{ color: "var(--muted)", fontSize: "var(--text-xs)", fontWeight: "var(--font-black)", textTransform: "uppercase", margin: 0 }}>{topic.topic}</p>
                    <p style={{ fontSize: "var(--text-lg)", fontWeight: "var(--font-black)", margin: "var(--space-2) 0 var(--space-3)" }}>{topic.score}%</p>
                    <div className="progress-track" style={{ height: "var(--space-1)" }}>
                      <div className="progress-fill" style={{ width: `${topic.score}%`, background: barColor(topic.score) }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "var(--space-4)", flexWrap: "wrap", marginBottom: "var(--space-4)" }}>
                <h2 style={{ fontSize: "var(--text-xl)", fontWeight: "var(--font-black)", margin: 0 }}>Student Cohort Performance</h2>
                <div style={{ display: "flex", gap: "var(--space-3)", alignItems: "center", flexWrap: "wrap" }}>
                  <label style={{ display: "flex", gap: "var(--space-2)", alignItems: "center", background: "var(--surface-low)", borderRadius: "var(--radius-full)", padding: "var(--space-2) var(--space-3)", border: "1px solid var(--outline)" }}>
                    <Search size={15} color="var(--muted)" />
                    <input placeholder="Search students..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ border: 0, outline: "none", background: "transparent", width: "170px" }} />
                  </label>
                  <button onClick={exportStudentsCsv} className="neo-btn neo-btn-secondary" style={{ padding: "var(--space-3) var(--space-4)" }}>
                    <Download size={16} /> Export
                  </button>
                </div>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Student Name</th>
                      <th>Mastery</th>
                      <th>Ability</th>
                      <th>Velocity</th>
                      <th>Subtopics</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((s: any, i: number) => (
                      <tr key={i} onClick={() => openStudentAnalytics(s)} style={{ cursor: "pointer", background: selectedStudent?.id && selectedStudent.id === s.id ? "var(--primary-soft)" : undefined }}>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", fontWeight: "var(--font-extrabold)" }}>
                            <div style={{ width: "var(--space-8)", height: "var(--space-8)", borderRadius: "var(--radius-full)", background: i % 2 ? "var(--pink-soft)" : "var(--blue-soft)", display: "grid", placeItems: "center", fontSize: "var(--text-xs)", fontWeight: "var(--font-black)" }}>
                              {s.name.split(" ").map((n: string) => n[0]).join("")}
                            </div>
                            {s.name}
                          </div>
                        </td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                            <span style={{ fontWeight: "var(--font-black)", color: barColor(s.mastery) }}>{s.mastery}%</span>
                            <div className="progress-track" style={{ width: "6rem", height: "var(--space-2)" }}><div className="progress-fill" style={{ width: `${s.mastery}%`, background: barColor(s.mastery) }} /></div>
                          </div>
                        </td>
                        <td style={{ fontWeight: "var(--font-black)", color: parseFloat(s.theta) >= 0 ? "var(--primary)" : "var(--coral)" }}>{s.theta}</td>
                        <td><span className="badge badge-blue" style={{ padding: "var(--space-2) var(--space-3)" }}>{s.velocity}</span></td>
                        <td style={{ color: "var(--muted)" }}>{s.topics} mastered</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div id="reteaching-plan" className="glass-card" style={{ scrollMarginTop: "var(--space-16)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "var(--space-4)", flexWrap: "wrap", marginBottom: "var(--space-4)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                  <BookOpen size={18} color="var(--primary)" />
                  <h2 style={{ fontSize: "var(--text-lg)", fontWeight: "var(--font-black)", margin: 0 }}>AI-Driven Re-teaching Lesson Plan</h2>
                </div>
                <button onClick={() => handleFetchReTeaching()} disabled={isGenLoading} className="neo-btn neo-btn-primary" style={{ opacity: isGenLoading ? 0.7 : 1 }}>
                  {isGenLoading ? <DancingSquares size="sm" inline label="Generating..." /> : <><RefreshCw size={15} />{reTeachingText ? "Regenerate Plan" : "Generate Plan"}</>}
                </button>
              </div>
              <div style={{ background: "var(--surface-low)", border: "1px solid var(--outline)", borderRadius: "var(--radius-xl)", padding: "var(--space-5)", minHeight: "var(--space-20)", color: "var(--muted)", lineHeight: "var(--leading-relaxed)" }}>
                {isGenLoading ? "Analyzing conceptual gaps and formulating activities..." : reTeachingText ? <FormattedPlan text={reTeachingText} /> : `Generate a customized remedial instruction plan for ${selectedTopic} based on class misconceptions.`}
              </div>
            </div>
          </div>

          <aside style={{ display: "grid", gap: "var(--space-4)", position: "sticky", top: "var(--space-16)" }}>
            {selectedStudent && (
              <StudentAnalyticsPanel
                student={selectedStudent}
                analytics={studentAnalytics}
                loading={studentAnalyticsLoading}
                error={studentAnalyticsError}
                onClose={() => {
                  setSelectedStudent(null);
                  setStudentAnalytics(null);
                  setStudentAnalyticsError(null);
                }}
              />
            )}
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
              <Sparkles size={18} color="var(--coral)" />
              <h2 style={{ fontSize: "var(--text-lg)", fontWeight: "var(--font-black)", margin: 0 }}>AI Educator Insights</h2>
            </div>
            <InsightCard
              tone="red"
              label="Critical Gap"
              title={misconceptions[0]?.issue || "Misconception cluster"}
              desc={`${misconceptions[0]?.pct || 65}% of attempts suggest this area needs re-teaching.`}
              button="Remediate Now"
              onClick={() => handleFetchReTeaching(true)}
              loading={isGenLoading}
            />
            <InsightCard
              tone="purple"
              label="Growth Trend"
              title="Lexical Diversity"
              desc="Several learners have shown stronger use of advanced phrasing across recent attempts."
              button="Send Congratulations"
              onClick={handleCongratulate}
              disabled={!students.length}
            />
            <div className="card" style={{ background: "var(--surface-mid)" }}>
              <h3 style={{ color: "var(--muted)", fontSize: "var(--text-xs)", fontWeight: "var(--font-black)", textTransform: "uppercase", margin: "0 0 var(--space-4)" }}>Active Class Session</h3>
              <div style={{ display: "flex", alignItems: "start", gap: "var(--space-3)", marginBottom: "var(--space-4)" }}>
                <span style={{ width: "var(--space-2)", height: "var(--space-2)", borderRadius: "var(--radius-full)", background: "var(--success)", marginTop: "var(--space-2)" }} />
                <div>
                  <strong>8 students currently active</strong>
                  <p style={{ color: "var(--muted)", margin: "var(--space-1) 0 0" }}>Focus: {selectedTopic}</p>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", background: "var(--surface)", borderRadius: "var(--radius-lg)", padding: "var(--space-3)" }}>
                <span>Avg. Engagement Rate</span>
                <strong style={{ color: "var(--primary)" }}>94%</strong>
              </div>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return <span style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-2)" }}><span style={{ width: "var(--space-2)", height: "var(--space-2)", borderRadius: "var(--radius-full)", background: color }} />{label}</span>;
}

function FormattedPlan({ text }: { text: string }) {
  const cleaned = text
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .trim();

  const lines = cleaned
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !/^(={3,}|-{3,}|_{3,}|\*{3,})$/.test(line));

  return (
    <div style={{ display: "grid", gap: "var(--space-3)" }}>
      {lines.map((line, index) => {
        const heading = line.match(/^#{1,4}\s+(.*)$/);
        if (heading) {
          return <h3 key={index} style={{ color: "var(--ink)", fontSize: "var(--text-base)", fontWeight: "var(--font-black)", margin: index === 0 ? 0 : "var(--space-2) 0 0" }}>{heading[1]}</h3>;
        }

        if (/^[A-Z][A-Za-z\s/()-]+:$/.test(line)) {
          return <h3 key={index} style={{ color: "var(--ink)", fontSize: "var(--text-base)", fontWeight: "var(--font-black)", margin: index === 0 ? 0 : "var(--space-2) 0 0" }}>{line.replace(/:$/, "")}</h3>;
        }

        const numbered = line.match(/^\d+\.\s+(.*)$/);
        const bullet = line.match(/^[-*]\s+(.*)$/);
        const content = numbered?.[1] || bullet?.[1];
        if (content) {
          return (
            <div key={index} style={{ display: "flex", gap: "var(--space-3)", alignItems: "flex-start", background: "var(--surface)", borderRadius: "var(--radius-lg)", padding: "var(--space-3)" }}>
              <span style={{ width: "var(--space-2)", height: "var(--space-2)", borderRadius: "var(--radius-full)", background: "var(--primary)", marginTop: "var(--space-2)", flexShrink: 0 }} />
              <p style={{ margin: 0, color: "var(--muted)", lineHeight: "var(--leading-relaxed)" }}>{content}</p>
            </div>
          );
        }

        return <p key={index} style={{ margin: 0, color: "var(--muted)", lineHeight: "var(--leading-relaxed)" }}>{line}</p>;
      })}
    </div>
  );
}

function StudentAnalyticsPanel({ student, analytics, loading, error, onClose }: { student: any; analytics: any; loading: boolean; error: string | null; onClose: () => void }) {
  const summary = analytics?.summary;
  const topics = analytics?.topic_mastery || [];
  const thetaHistory = analytics?.theta_history || [];

  return (
    <div className="card" style={{ borderColor: "var(--primary-soft)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: "var(--space-4)", alignItems: "start", marginBottom: "var(--space-4)" }}>
        <div>
          <span className="badge badge-purple">Student Analytics</span>
          <h3 style={{ fontSize: "var(--text-xl)", fontWeight: "var(--font-black)", margin: "var(--space-3) 0 var(--space-1)" }}>{student.name}</h3>
          <p style={{ color: "var(--muted)", margin: 0, fontSize: "var(--text-sm)" }}>{student.email || "Class learner"}</p>
        </div>
        <button onClick={onClose} aria-label="Close student analytics" style={{ border: 0, background: "var(--surface-low)", borderRadius: "var(--radius-full)", width: "var(--space-8)", height: "var(--space-8)", display: "grid", placeItems: "center" }}>
          <X size={15} />
        </button>
      </div>

      {loading ? (
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", color: "var(--muted)" }}>
          <DancingSquares size="sm" inline label="Loading student analytics..." />
        </div>
      ) : error ? (
        <p style={{ color: "var(--coral)", lineHeight: "var(--leading-normal)" }}>{error}</p>
      ) : summary ? (
        <div style={{ display: "grid", gap: "var(--space-4)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)" }}>
            {[
              ["Questions", summary.total_questions],
              ["Accuracy", `${summary.accuracy}%`],
              ["Theta", `${summary.current_theta >= 0 ? "+" : ""}${summary.current_theta}`],
              ["Topics", summary.topics_practiced],
            ].map(([label, value]) => (
              <div key={label} style={{ background: "var(--surface-low)", borderRadius: "var(--radius-lg)", padding: "var(--space-3)" }}>
                <div style={{ color: "var(--muted)", fontSize: "var(--text-xs)", fontWeight: "var(--font-black)", textTransform: "uppercase" }}>{label}</div>
                <div style={{ color: "var(--ink)", fontSize: "var(--text-lg)", fontWeight: "var(--font-black)", marginTop: "var(--space-1)" }}>{value}</div>
              </div>
            ))}
          </div>

          <div>
            <h4 style={{ margin: "0 0 var(--space-3)", fontSize: "var(--text-base)", fontWeight: "var(--font-black)" }}>Theta History</h4>
            {thetaHistory.length ? (
              <div style={{ display: "flex", alignItems: "end", gap: "var(--space-2)", height: "var(--space-20)" }}>
                {thetaHistory.map((point: any, i: number) => {
                  const height = Math.max(12, Math.min(100, ((point.theta + 3) / 6) * 100));
                  return <div key={i} title={`${point.session}: ${point.theta}`} style={{ flex: 1, height: `${height}%`, background: "var(--primary)", borderRadius: "var(--radius-sm) var(--radius-sm) 0 0", opacity: 0.45 + (i / Math.max(thetaHistory.length, 1)) * 0.5 }} />;
                })}
              </div>
            ) : (
              <p style={{ color: "var(--muted)", margin: 0 }}>No attempts yet.</p>
            )}
          </div>

          <div>
            <h4 style={{ margin: "0 0 var(--space-3)", fontSize: "var(--text-base)", fontWeight: "var(--font-black)" }}>Topic Mastery</h4>
            <div style={{ display: "grid", gap: "var(--space-3)" }}>
              {topics.length ? topics.map((topic: any) => (
                <div key={topic.name}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "var(--space-4)", marginBottom: "var(--space-2)", fontSize: "var(--text-sm)", fontWeight: "var(--font-extrabold)" }}>
                    <span>{topic.name}</span>
                    <span style={{ color: barColor(topic.pct) }}>{topic.pct}%</span>
                  </div>
                  <div className="progress-track" style={{ height: "var(--space-2)" }}>
                    <div className="progress-fill" style={{ width: `${topic.pct}%`, background: barColor(topic.pct) }} />
                  </div>
                </div>
              )) : <p style={{ color: "var(--muted)", margin: 0 }}>No topic mastery data yet.</p>}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function InsightCard({
  tone,
  label,
  title,
  desc,
  button,
  onClick,
  disabled = false,
  loading = false,
}: {
  tone: "red" | "purple";
  label: string;
  title: string;
  desc: string;
  button: string;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  const color = tone === "red" ? "var(--coral)" : "var(--primary)";
  const wash = tone === "red" ? "var(--error-soft)" : "var(--primary-soft)";
  return (
    <div className="card card-hover" style={{ background: "var(--surface)", borderColor: wash, position: "relative", overflow: "hidden" }}>
      <BarChart3 size={64} style={{ position: "absolute", right: "var(--space-4)", top: "var(--space-4)", color, opacity: 0.08 }} />
      <span className={tone === "red" ? "badge badge-red" : "badge badge-purple"}>{label}</span>
      <h3 style={{ fontSize: "var(--text-lg)", fontWeight: "var(--font-black)", margin: "var(--space-4) 0 var(--space-3)" }}>{title}</h3>
      <p style={{ color: "var(--muted)", lineHeight: "var(--leading-relaxed)" }}>{desc}</p>
      <button
        onClick={onClick}
        disabled={disabled || loading}
        className={tone === "red" ? "neo-btn neo-btn-primary" : "neo-btn neo-btn-secondary"}
        style={{ width: "100%", opacity: disabled || loading ? 0.65 : 1 }}
      >
        {loading ? <DancingSquares size="sm" inline label="Generating..." /> : <>{button} <Bolt size={16} /></>}
      </button>
    </div>
  );
}

function Loading({ label }: { label: string }) {
  return (
    <div className="app-page" style={{ display: "grid", placeItems: "center" }}>
      <DancingSquares size="lg" label={label} />
    </div>
  );
}
