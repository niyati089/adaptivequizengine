import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, BarChart3, Brain, GraduationCap, LineChart, PlayCircle, Sparkles, Target, Wand2 } from "lucide-react";
import heroImage from "@/components/images/image1.png";

const features = [
  { icon: Target, title: "Precision Calibration", desc: "Ability estimates adapt with every answer, mapping gaps and strengths into a personal learning profile.", tone: "var(--info-soft)" },
  { icon: Brain, title: "Adaptive Questions", desc: "Teacher topics and free practice become live quizzes that get easier or harder as your confidence changes.", tone: "var(--primary-soft)" },
  { icon: Wand2, title: "AI Guidance", desc: "Socratic hints and explanations keep learners moving without giving away the answer too early.", tone: "var(--error-soft)" },
];

const courses = [
  { title: "Machine Learning Foundations", tags: ["Reasoning", "AI Tutor"], done: "21/39 lessons", pct: 80, href: "/quiz?topic=machine%20learning" },
  { title: "Quantum Logic Sprint", tags: ["Adaptive", "Challenge"], done: "19/25 lessons", pct: 85, href: "/quiz?topic=quantum%20mechanics" },
];

export default function Home() {
  return (
    <div className="app-page">
      <section style={{ position: "relative", overflow: "hidden", padding: "var(--space-16) 0 var(--space-20)" }}>
        <div className="app-shell-wide" style={{ paddingTop: 0, paddingBottom: 0 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "var(--space-12)", alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
              <span className="badge badge-purple">
                <Sparkles size={16} /> Powered by Adaptive AI
              </span>
              <h1 className="chunky-heading" style={{ fontSize: "var(--heading-2xl)", maxWidth: "42rem" }}>
                Master any subject with <span style={{ color: "var(--primary)", fontStyle: "italic" }}>AI tutoring</span>
              </h1>
              <p className="section-subtitle">
                Personalized learning paths that adapt to your pace. Practice with generated quizzes, teacher-led classes, Socratic support, and real progress analytics.
              </p>
              <div style={{ display: "flex", gap: "var(--space-4)", flexWrap: "wrap", paddingTop: "var(--space-2)" }}>
                <Link href="/quiz" className="neo-btn" style={{ background: "var(--amber)", color: "var(--navy)", boxShadow: "0 12px 24px rgba(250, 204, 21, 0.2)" }}>
                  <PlayCircle size={18} /> Play Now
                </Link>
                <Link href="/dashboard" className="neo-btn neo-btn-secondary">
                  <BarChart3 size={18} /> View Dashboard
                </Link>
              </div>
            </div>

            <div style={{ position: "relative" }}>
              <div aria-hidden style={{ position: "absolute", inset: "-1rem", background: "rgba(132,85,239,0.12)", filter: "blur(48px)", borderRadius: "var(--radius-full)" }} />
              <div className="glass-card" style={{ position: "relative", padding: "var(--space-2)", borderRadius: "var(--radius-2xl)", overflow: "hidden" }}>
                <Image src={heroImage} alt="Friendly adaptive learning illustration" priority style={{ width: "100%", height: "auto", aspectRatio: "4 / 3", objectFit: "cover", borderRadius: "var(--radius-xl)" }} />
                <div className="glass-card" style={{ position: "absolute", left: "var(--space-4)", bottom: "var(--space-4)", display: "flex", alignItems: "center", gap: "var(--space-3)", padding: "0.9rem 1rem", maxWidth: "12rem" }}>
                  <div className="icon-box" style={{ width: "var(--space-10)", height: "var(--space-10)", borderRadius: "var(--radius-lg)" }}>
                    <LineChart size={18} />
                  </div>
                  <div>
                    <div style={{ color: "var(--muted)", fontSize: "var(--text-xs)", fontWeight: "var(--font-extrabold)" }}>Growth</div>
                    <div style={{ fontSize: "var(--text-xl)", fontWeight: "var(--font-black)" }}>+24%</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section style={{ background: "rgba(255,255,255,0.68)", padding: "var(--space-16) 0" }}>
        <div className="app-shell-wide" style={{ paddingTop: 0, paddingBottom: 0 }}>
          <div style={{ textAlign: "center", marginBottom: "var(--space-10)", display: "grid", justifyItems: "center", gap: "var(--space-3)" }}>
            <h2 className="section-title">Engineered for progress</h2>
            <p className="section-subtitle">Three connected modules keep practice targeted, explainable, and calm.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "var(--space-6)" }}>
            {features.map((feature) => (
              <div key={feature.title} className="card card-hover">
                <div className="icon-box" style={{ background: feature.tone, marginBottom: "var(--space-6)" }}>
                  <feature.icon size={24} />
                </div>
                <h3 style={{ fontSize: "var(--text-lg)", fontWeight: "var(--font-extrabold)", marginBottom: "var(--space-3)" }}>{feature.title}</h3>
                <p style={{ color: "var(--muted)", lineHeight: 1.7, margin: 0 }}>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="challenges" className="app-shell-wide" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))", gap: "var(--space-6)", alignItems: "stretch", scrollMarginTop: "var(--space-24)" }}>
        <div className="card" style={{ borderRadius: "var(--radius-2xl)", position: "relative", overflow: "hidden" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "var(--space-4)", marginBottom: "var(--space-8)", flexWrap: "wrap" }}>
            <div>
              <span className="badge badge-green">Live Analytics</span>
              <h3 style={{ fontSize: "var(--text-2xl)", fontWeight: "var(--font-black)", margin: "var(--space-4) 0 0" }}>Weekly Engagement</h3>
            </div>
            <Link href="/analytics" className="neo-btn neo-btn-secondary">Open Analytics</Link>
          </div>
          <div style={{ display: "flex", alignItems: "end", justifyContent: "space-between", height: "13rem", gap: "var(--space-4)" }}>
            {[62, 86, 68, 42, 78, 96, 54].map((height, index) => (
              <div key={index} style={{ flex: 1, height: "100%", display: "flex", alignItems: "end", background: "var(--surface-mid)", borderRadius: "var(--radius-xl) var(--radius-xl) var(--radius-sm) var(--radius-sm)", overflow: "hidden" }}>
                <div style={{ width: "100%", height: `${height}%`, background: "var(--primary)", borderRadius: "var(--radius-xl) var(--radius-xl) 0 0" }} />
              </div>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", color: "var(--muted)", fontSize: "var(--text-xs)", fontWeight: "var(--font-extrabold)", marginTop: "var(--space-4)" }}>
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => <span key={day}>{day}</span>)}
          </div>
        </div>

        <div style={{ display: "grid", gap: "var(--space-6)" }}>
          <div className="card" style={{ background: "var(--primary)", color: "white", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <GraduationCap size={32} style={{ opacity: 0.7 }} />
            <div>
              <h3 style={{ fontSize: "var(--text-lg)", fontWeight: "var(--font-extrabold)", marginTop: "var(--space-6)" }}>Current Streak</h3>
              <div style={{ fontSize: "var(--text-5xl)", fontWeight: "var(--font-black)", lineHeight: 1, marginTop: "var(--space-4)" }}>143</div>
              <p style={{ opacity: 0.78, fontSize: "var(--text-xs)", fontWeight: "var(--font-extrabold)", textTransform: "uppercase" }}>Days in a row</p>
            </div>
          </div>
          <div className="card" style={{ background: "var(--surface-high)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "var(--space-6)" }}>
              <Brain size={32} />
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "var(--text-xl)", fontWeight: "var(--font-black)" }}>B2</div>
                <div style={{ color: "var(--muted)", fontSize: "var(--text-xs)" }}>Level</div>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "var(--font-extrabold)", marginBottom: "0.65rem" }}>
              <span>Course Completion</span>
              <span>68%</span>
            </div>
            <div className="progress-track" style={{ background: "white" }}>
              <div className="progress-fill" style={{ width: "68%", background: "var(--amber)" }} />
            </div>
          </div>
        </div>
      </section>

      <section className="app-shell-wide" style={{ paddingTop: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", gap: "var(--space-4)", marginBottom: "var(--space-6)", flexWrap: "wrap" }}>
          <div>
            <h2 style={{ fontSize: "var(--text-2xl)", fontWeight: "var(--font-black)", margin: 0 }}>Your Active Courses</h2>
            <p style={{ color: "var(--muted)", margin: "0.35rem 0 0" }}>Pick up exactly where you left off.</p>
          </div>
          <Link href="/classes" style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", color: "var(--primary)", fontWeight: "var(--font-black)", textDecoration: "none" }}>
            View All <ArrowRight size={16} />
          </Link>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "var(--space-4)" }}>
          {courses.map((course) => (
            <Link key={course.title} href={course.href} className="card card-hover" style={{ display: "flex", gap: "var(--space-4)", alignItems: "center", color: "inherit", textDecoration: "none" }}>
              <div style={{ width: "5rem", height: "5rem", borderRadius: "1.2rem", background: "linear-gradient(135deg, var(--info-soft), var(--primary-soft))", flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginBottom: "0.5rem" }}>
                  {course.tags.map((tag) => <span key={tag} className="badge badge-blue" style={{ padding: "0.3rem 0.55rem", fontSize: "0.65rem" }}>{tag}</span>)}
                </div>
                <h3 style={{ fontSize: "var(--text-lg)", fontWeight: "var(--font-black)", margin: 0 }}>{course.title}</h3>
                <p style={{ color: "var(--muted)", fontSize: "var(--text-sm)", margin: "0.35rem 0 0" }}>{course.done}</p>
              </div>
              <div style={{ textAlign: "right", color: "var(--green)", fontWeight: "var(--font-black)" }}>{course.pct}%</div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
