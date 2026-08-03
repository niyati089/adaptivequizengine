"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Area, AreaChart, CartesianGrid, PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Brain, ChevronRight, Sparkles, Star, Target, BookOpen } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getUserAnalytics } from "@/services/quizService";
import { MisconceptionWatchlist } from "@/components/dashboard/MisconceptionWatchlist";
import { DancingSquares } from "@/components/shared/DancingSquares";

const emptyAnalytics = {
  summary: {
    total_questions: 0,
    accuracy: 0,
    current_theta: 0,
    theta_delta: 0,
    topics_practiced: 0,
  },
  theta_history: [] as { session: string; theta: number }[],
  topic_mastery: [] as { name: string; pct: number; status: string }[],
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="card" style={{ padding: "var(--space-3) var(--space-4)", borderRadius: "var(--radius-lg)" }}>
      <p style={{ color: "var(--muted)", fontSize: "var(--text-xs)", margin: 0 }}>{label}</p>
      <p style={{ color: "var(--primary)", fontSize: "var(--text-base)", fontWeight: "var(--font-black)", margin: "var(--space-1) 0 0" }}>theta = {payload[0].value}</p>
    </div>
  );
};

const statusColor = (status: string) => (status === "good" ? "var(--primary)" : status === "medium" ? "var(--warning)" : "var(--coral)");

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [analytics, setAnalytics] = useState<any>(emptyAnalytics);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }

    getUserAnalytics()
      .then((data) => setAnalytics(data))
      .catch((e) => console.error("Failed to load dashboard analytics:", e))
      .finally(() => setLoading(false));
  }, [authLoading, user, router]);

  if (authLoading || loading || !user) {
    return (
      <div className="app-page" style={{ minHeight: "60vh", display: "grid", placeItems: "center" }}>
        <DancingSquares size="lg" label="Loading your dashboard..." />
      </div>
    );
  }

  const { summary, theta_history, topic_mastery } = analytics;
  const masteredCount = topic_mastery.filter((t: any) => t.pct >= 70).length;
  const weakestTopic = [...topic_mastery].sort((a: any, b: any) => a.pct - b.pct)[0];
  const radarData = topic_mastery.slice(0, 6).map((t: any) => ({ subject: t.name, A: t.pct }));

  const stats = [
    { icon: Brain, label: "Current Theta", value: `${summary.current_theta >= 0 ? "+" : ""}${summary.current_theta}`, sub: `Delta ${summary.theta_delta >= 0 ? "+" : ""}${summary.theta_delta}`, color: "var(--primary)", wash: "var(--blue-soft)" },
    { icon: Star, label: "Overall Accuracy", value: `${summary.accuracy}%`, sub: `${summary.total_questions} questions answered`, color: "var(--coral)", wash: "var(--pink-soft)" },
    { icon: Target, label: "Topics Mastered", value: `${masteredCount}/${topic_mastery.length || 0}`, sub: "At 70%+ accuracy", color: "var(--primary)", wash: "var(--primary-soft)" },
    { icon: Sparkles, label: "Topics Practiced", value: String(summary.topics_practiced), sub: "Across all sessions", color: "var(--warning)", wash: "var(--warning-soft)" },
  ];

  return (
    <div className="app-page">
      <div className="app-shell-wide">
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "end", gap: "var(--space-4)", flexWrap: "wrap", marginBottom: "var(--space-8)" }}>
          <div>
            <h1 className="chunky-heading" style={{ fontSize: "var(--heading-lg)", margin: 0 }}>Hello, {user.name?.split(" ")[0] || "there"}!</h1>
            <p style={{ color: "var(--muted)", fontSize: "var(--text-base)", margin: "var(--space-2) 0 0" }}>Here is your adaptive learning progress.</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", background: "var(--surface-low)", border: "1px solid var(--outline)", borderRadius: "var(--radius-full)", padding: "var(--space-2) var(--space-4)" }}>
            <Sparkles size={16} color="var(--primary)" />
            <span style={{ color: "var(--primary)", fontWeight: "var(--font-extrabold)", fontSize: "var(--text-xs)" }}>AI Coach Active</span>
          </div>
        </header>

        {summary.total_questions === 0 && (
          <div className="card" style={{ marginBottom: "var(--space-6)", background: "var(--warning-soft)", borderColor: "var(--warning)" }}>
            <h2 style={{ fontSize: "var(--text-base)", fontWeight: "var(--font-extrabold)", color: "var(--ink-secondary)", margin: "0 0 var(--space-1)" }}>No quiz attempts yet</h2>
            <p style={{ fontSize: "var(--text-sm)", color: "var(--ink-secondary)", margin: 0 }}>
              Take a quiz to start building your adaptive learning profile — this page updates automatically from your real attempts.
            </p>
          </div>
        )}

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "var(--space-5)", marginBottom: "var(--space-6)" }}>
          {stats.map((stat) => (
            <div key={stat.label} className="stat-card" style={{ position: "relative", overflow: "hidden" }}>
              <div aria-hidden style={{ position: "absolute", width: "var(--space-20)", height: "var(--space-20)", borderRadius: "var(--radius-full)", right: "calc(var(--space-8) * -1)", top: "calc(var(--space-8) * -1)", background: stat.wash, opacity: 0.7 }} />
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: "var(--space-4)", position: "relative" }}>
                <stat.icon size={18} color={stat.color} style={{ width: "var(--icon-md)", height: "var(--icon-md)" }} />
                <span style={{ color: "var(--muted)", fontSize: "var(--text-xs)", fontWeight: "var(--font-black)", textTransform: "uppercase" }}>{stat.label}</span>
              </div>
              <div className="stat-number" style={{ position: "relative" }}>{stat.value}</div>
              <div className="stat-label" style={{ position: "relative" }}>{stat.sub}</div>
            </div>
          ))}

          {summary.total_questions > 0 && (
            <div
              className="stat-card"
              style={{
                position: "relative",
                overflow: "hidden",
                background: "var(--surface-low)",
                cursor: "pointer"
              }}
              onClick={() => router.push("/quiz-history")}
            >
              <div aria-hidden style={{ position: "absolute", width: "var(--space-20)", height: "var(--space-20)", borderRadius: "var(--radius-full)", right: "calc(var(--space-8) * -1)", top: "calc(var(--space-8) * -1)", background: "var(--primary-soft)", opacity: 0.7 }} />
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: "var(--space-4)", position: "relative" }}>
                <BookOpen size={18} color="var(--primary)" />
                <span style={{ color: "var(--muted)", fontSize: "var(--text-xs)", fontWeight: "var(--font-black)", textTransform: "uppercase" }}>Quiz History</span>
              </div>
              <div className="stat-number" style={{ position: "relative" }}>View All</div>
              <div className="stat-label" style={{ position: "relative" }}>Review past attempts</div>
            </div>
          )}
        </section>

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))", gap: "var(--space-5)", alignItems: "start" }}>
          <div style={{ display: "grid", gap: "var(--space-5)" }}>
            <div className="glass-card" style={{ minHeight: "400px", display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: "var(--space-4)", marginBottom: "var(--space-6)", flexWrap: "wrap" }}>
                <div>
                  <h2 style={{ fontSize: "var(--text-2xl)", fontWeight: "var(--font-black)", margin: 0 }}>Ability Progression</h2>
                  <p style={{ color: "var(--muted)", margin: "var(--space-1) 0 0", fontSize: "var(--text-sm)" }}>Theta estimation over your last sessions</p>
                </div>
              </div>
              <div style={{ flex: 1, minHeight: "280px" }}>
                {theta_history.length === 0 ? (
                  <div style={{ height: "100%", display: "grid", placeItems: "center", color: "var(--muted)", fontWeight: "var(--font-bold)" }}>
                    Take a quiz to see your ability trend here.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={theta_history} margin={{ top: 10, right: 8, bottom: 0, left: -18 }}>
                      <defs>
                        <linearGradient id="thetaGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.18} />
                          <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(198,198,204,0.45)" vertical={false} />
                      <XAxis dataKey="session" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "var(--muted)" }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "var(--muted)" }} domain={[-3, 3]} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="theta" stroke="var(--primary)" strokeWidth={4} fill="url(#thetaGrad)" dot={{ r: 5, fill: "var(--primary)", strokeWidth: 2, stroke: "var(--surface)" }} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "var(--space-5)" }}>
              <div className="card" style={{ background: "rgba(221, 226, 246, 0.55)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: "var(--space-4)" }}>
                  <Sparkles size={18} color="var(--primary)" />
                  <h2 style={{ fontSize: "var(--text-lg)", fontWeight: "var(--font-black)", margin: 0 }}>AI Insights</h2>
                </div>
                {[
                  weakestTopic
                    ? [`Reinforce ${weakestTopic.name}`, `You're at ${weakestTopic.pct}% accuracy here — a good next focus.`]
                    : ["Keep practicing", "Complete a few quizzes to unlock personalized insights."],
                  ["Review distractor explanations", "Reading why wrong answers are wrong builds faster recall."],
                ].map(([title, desc]) => (
                  <div key={title} style={{ background: "rgba(255,255,255,0.72)", border: "1px solid rgba(255,255,255,0.8)", borderRadius: "var(--radius-xl)", padding: "var(--space-3)", marginTop: "var(--space-3)", display: "flex", justifyContent: "space-between", gap: "var(--space-3)" }}>
                    <div>
                      <div style={{ fontWeight: "var(--font-black)", fontSize: "var(--text-sm)" }}>{title}</div>
                      <div style={{ color: "var(--muted)", fontSize: "var(--text-xs)", marginTop: "var(--space-1)" }}>{desc}</div>
                    </div>
                    <ChevronRight size={18} color="var(--primary)" />
                  </div>
                ))}
              </div>

              <div className="card" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <h2 style={{ alignSelf: "start", fontSize: "var(--text-lg)", fontWeight: "var(--font-black)", margin: "0 0 var(--space-4)" }}>Topic Balance</h2>
                <div style={{ width: "100%", height: "220px" }}>
                  {radarData.length === 0 ? (
                    <div style={{ height: "100%", display: "grid", placeItems: "center", color: "var(--muted)", fontWeight: "var(--font-bold)", fontSize: "var(--text-xs)", textAlign: "center" }}>
                      Take a quiz to see your topic balance.
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarData}>
                        <PolarGrid stroke="rgba(198,198,204,0.5)" />
                        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: "var(--ink-secondary)" }} />
                        <Radar dataKey="A" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.2} strokeWidth={2} />
                      </RadarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>
          </div>

          <aside style={{ display: "grid", gap: "var(--space-5)", position: "sticky", top: "var(--space-20)" }}>
            <div className="glass-card">
              <h2 style={{ fontSize: "var(--text-lg)", fontWeight: "var(--font-black)", margin: "0 0 var(--space-5)" }}>Topic Mastery</h2>
              {topic_mastery.length === 0 ? (
                <p style={{ color: "var(--muted)", fontWeight: "var(--font-bold)", margin: 0 }}>Take your first quiz to see topic mastery here.</p>
              ) : (
                <div style={{ display: "grid", gap: "var(--space-5)" }}>
                  {topic_mastery.slice(0, 6).map((topic: any) => (
                    <div key={topic.name}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: "var(--space-4)", marginBottom: "var(--space-2)" }}>
                        <span style={{ fontWeight: "var(--font-bold)", fontSize: "var(--text-sm)" }}>{topic.name}</span>
                        <span style={{ color: statusColor(topic.status), fontWeight: "var(--font-black)", fontSize: "var(--text-xs)" }}>{topic.pct}%</span>
                      </div>
                      <div className="progress-track">
                        <div className="progress-fill" style={{ width: `${topic.pct}%`, background: statusColor(topic.status) }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <Link href="/quiz" className="neo-btn neo-btn-primary" style={{ width: "100%", marginTop: "var(--space-6)" }}>
                Start Today's Quiz <ChevronRight size={16} />
              </Link>
            </div>
            <MisconceptionWatchlist />
          </aside>
        </section>
      </div>
    </div>
  );
}
