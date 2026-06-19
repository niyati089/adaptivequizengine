import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { BookOpen, Zap, Target, TrendingUp, Brain, Clock, Award, ChevronRight, Star } from 'lucide-react';
import heroImage from '@/components/images/image1.png';

const leaderboard = [
  { rank: 1, name: 'Aisha K.', score: 2840, avatar: 'AK' },
  { rank: 2, name: 'Marcus T.', score: 2760, avatar: 'MT' },
  { rank: 3, name: 'Priya S.', score: 2590, avatar: 'PS' },
  { rank: 4, name: 'Leon B.', score: 2420, avatar: 'LB' },
  { rank: 5, name: 'Sofia R.', score: 2310, avatar: 'SR' },
  { rank: 6, name: 'James W.', score: 2190, avatar: 'JW' },
];

const featuredCards = [
  {
    tag: "Today's Challenge",
    title: "Quadratic Equations Mastery",
    subtitle: "Test your algebraic reasoning with AI-adaptive difficulty scaling.",
    stats: "Avg θ: +0.40  ·  Est. 8 mins  ·  248 plays",
    cta: "Start Quiz",
    href: "/quiz",
    accent: "#7C3AED",
    accentLight: "#EDE9FE",
  },
  {
    tag: "New Feature",
    title: "Socratic AI Tutor",
    subtitle: "Our new hint system guides you with questions, never answers—like a real tutor.",
    stats: "82% mastery improvement  ·  3 hint levels",
    cta: "Try It Now",
    href: "/quiz",
    accent: "#0284C7",
    accentLight: "#E0F2FE",
  },
  {
    tag: "Never Miss Progress",
    title: "Daily Learning Streak",
    subtitle: "Set your daily goal and track your mastery streak across all topics.",
    stats: "Join 10,000+ learners building daily habits",
    cta: "View Dashboard",
    href: "/dashboard",
    accent: "#D97706",
    accentLight: "#FEF3C7",
    dark: true,
  },
];

const topics = ['Mathematics', 'Science', 'History', 'Literature', 'Programming', 'Economics', 'Philosophy', 'Physics', 'Chemistry', 'Biology'];

const features = [
  { icon: Target, title: 'Item Response Theory', desc: 'Each question is calibrated to your exact ability level (θ) in real time — no wasted questions.', color: '#7C3AED' },
  { icon: Brain, title: 'Misconception Detection', desc: 'Our AI analyzes wrong answers to identify the root conceptual gap, not just the symptom.', color: '#0284C7' },
  { icon: Zap, title: 'Socratic Hints', desc: 'Guided questioning leads you to answers through reasoning, building lasting understanding.', color: '#D97706' },
  { icon: TrendingUp, title: 'Spaced Repetition', desc: 'SM-2 scheduler resurfaces material at the optimal moment before you forget it.', color: '#059669' },
  { icon: BookOpen, title: 'Knowledge DAG', desc: 'Topic prerequisite graph ensures you never study advanced material before the foundations.', color: '#DC2626' },
  { icon: Award, title: 'Mastery Tracking', desc: 'Detailed analytics show exactly where you stand and what to study next.', color: '#7C3AED' },
];

export default function Home() {
  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: '#FAFAFA' }}>

      {/* ─── HERO ─── */}
      <section style={{ background: '#7C3AED', padding: '3rem 1.5rem 4rem' }}>
        <div className="container" style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '2rem', alignItems: 'start', padding: '0 1.5rem' }}>

          {/* Left: Main hero content */}
          <div style={{ color: 'white' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.15)', padding: '0.375rem 0.875rem', borderRadius: '9999px', marginBottom: '1.5rem', fontSize: '0.875rem', fontWeight: 600 }}>
              <span style={{ width: '6px', height: '6px', background: '#FCD34D', borderRadius: '50%', display: 'inline-block' }} />
              AI-Powered · Adaptive · Personalized
            </div>

            <h1 style={{ fontSize: 'clamp(2.25rem, 5vw, 3.5rem)', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: '1.25rem', color: 'white' }}>
              Master Any Subject<br />
              with AI Tutoring
            </h1>

            <p style={{ fontSize: '1.125rem', color: 'rgba(255,255,255,0.8)', lineHeight: 1.7, marginBottom: '2rem', maxWidth: '34rem' }}>
              AdaptiveTutor calibrates every question to your ability, detects misconceptions before they compound, and guides you with Socratic reasoning — not just answers.
            </p>

            {/* Stats row */}
            <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
              {[['10K+', 'Active learners'], ['94%', 'Mastery rate'], ['3×', 'Faster learning']].map(([val, label]) => (
                <div key={label}>
                  <div style={{ fontSize: '1.625rem', fontWeight: 900, color: '#FCD34D' }}>{val}</div>
                  <div style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.65)', fontWeight: 500 }}>{label}</div>
                </div>
              ))}
            </div>

            {/* CTAs */}
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <Link href="/quiz" style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                background: '#FCD34D', color: '#1C1917', textDecoration: 'none',
                padding: '0.875rem 1.75rem', borderRadius: '10px', fontWeight: 700, fontSize: '0.9375rem',
              }}>
                Play Now <ChevronRight size={18} />
              </Link>
              <Link href="/dashboard" style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                background: 'rgba(255,255,255,0.15)', color: 'white', textDecoration: 'none',
                padding: '0.875rem 1.75rem', borderRadius: '10px', fontWeight: 600, fontSize: '0.9375rem',
                border: '1.5px solid rgba(255,255,255,0.3)',
              }}>
                View Dashboard
              </Link>
            </div>
          </div>

          {/* Right: Hero Image */}
          <div style={{ maxWidth: '400px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Image 
              src={heroImage} 
              alt="Adaptive Learning" 
              style={{ width: '100%', height: 'auto', borderRadius: '20px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }} 
            />
          </div>
        </div>
      </section>

      {/* ─── FEATURED CARDS ─── */}
      <section style={{ padding: '2.5rem 1.5rem', background: '#F9FAFB' }}>
        <div className="container" style={{ padding: '0 1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            {featuredCards.map((card, i) => (
              <div key={i} className="card card-hover" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <span style={{ display: 'inline-block', background: card.accentLight, color: card.accent, padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.8125rem', fontWeight: 600 }}>
                  {card.tag}
                </span>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: '#111827', letterSpacing: '-0.02em', margin: 0 }}>
                  {card.title}
                </h3>
                <p style={{ fontSize: '0.9rem', color: '#6B7280', lineHeight: 1.65, margin: 0 }}>{card.subtitle}</p>
                <p style={{ fontSize: '0.8125rem', color: '#9CA3AF', margin: 0 }}>{card.stats}</p>
                <div style={{ marginTop: 'auto', paddingTop: '0.5rem' }}>
                  <Link href={card.href} style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                    background: '#FCD34D', color: '#1C1917', textDecoration: 'none',
                    padding: '0.625rem 1.25rem', borderRadius: '8px', fontWeight: 700, fontSize: '0.875rem',
                  }}>
                    {card.cta}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TOPIC CATEGORIES ─── */}
      <section style={{ padding: '2rem 1.5rem', background: 'white', borderTop: '1px solid #E5E7EB' }}>
        <div className="container" style={{ padding: '0 1.5rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#111827', marginBottom: '1rem' }}>Categories</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.625rem' }}>
            {topics.map(topic => (
              <Link key={topic} href={`/quiz?topic=${encodeURIComponent(topic)}`} style={{
                textDecoration: 'none', padding: '0.5rem 1rem',
                background: 'white', border: '1.5px solid #E5E7EB',
                borderRadius: '9999px', fontSize: '0.875rem', fontWeight: 500, color: '#374151',
                transition: 'all 0.15s ease',
              }}>
                {topic}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="section" style={{ background: '#F9FAFB' }}>
        <div className="container" style={{ padding: '0 1.5rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 className="section-title">How AdaptiveTutor Works</h2>
            <p className="section-subtitle">Four steps to real, lasting mastery — powered by the science of learning.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
            {[
              { num: '01', title: 'Calibration', desc: 'Answer a short set of questions. Our IRT engine instantly estimates your ability level (θ) across prerequisite topics.' },
              { num: '02', title: 'Adaptive Questions', desc: 'Every question is selected to maximise information gain — not too easy, not too hard. Always in the zone of proximal development.' },
              { num: '03', title: 'AI Guidance', desc: 'Stuck? Our Socratic agent asks targeted questions to guide your reasoning, never revealing the answer outright.' },
              { num: '04', title: 'Mastery Review', desc: 'SM-2 spaced repetition resurfaces weak topics at the exact moment before you forget them.' },
            ].map((step, i) => (
              <div key={i} className="card">
                <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#E5E7EB', letterSpacing: '-0.05em', lineHeight: 1, marginBottom: '1rem' }}>{step.num}</div>
                <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, color: '#111827', marginBottom: '0.5rem' }}>{step.title}</h3>
                <p style={{ fontSize: '0.9375rem', color: '#6B7280', lineHeight: 1.65, margin: 0 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURES GRID ─── */}
      <section className="section" style={{ background: 'white' }}>
        <div className="container" style={{ padding: '0 1.5rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 className="section-title">Intelligence at Every Step</h2>
            <p className="section-subtitle">Every component of AdaptiveTutor is built on peer-reviewed learning science.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            {features.map((f, i) => (
              <div key={i} className="card card-hover" style={{ display: 'flex', gap: '1rem' }}>
                <div className="icon-box" style={{ background: `${f.color}15`, minWidth: '3rem' }}>
                  <f.icon size={20} color={f.color} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#111827', marginBottom: '0.375rem' }}>{f.title}</h3>
                  <p style={{ fontSize: '0.9rem', color: '#6B7280', lineHeight: 1.65, margin: 0 }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── STATS BANNER ─── */}
      <section style={{ background: '#111827', padding: '4rem 1.5rem' }}>
        <div className="container" style={{ padding: '0 1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '2rem', textAlign: 'center' }}>
            {[['10,000+', 'Active Learners'], ['4.2M+', 'Questions Answered'], ['94%', 'Mastery Achievement'], ['3×', 'Faster than Traditional']].map(([val, label]) => (
              <div key={label}>
                <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#FCD34D', letterSpacing: '-0.04em' }}>{val}</div>
                <div style={{ fontSize: '0.9375rem', color: '#9CA3AF', marginTop: '0.375rem', fontWeight: 500 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section style={{ background: '#7C3AED', padding: '5rem 1.5rem', textAlign: 'center' }}>
        <div className="container-narrow" style={{ padding: '0 1.5rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', background: 'rgba(255,255,255,0.15)', padding: '0.375rem 0.875rem', borderRadius: '9999px', marginBottom: '1.5rem' }}>
            <Star size={14} color="#FCD34D" fill="#FCD34D" />
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'white' }}>Join 10,000+ learners</span>
          </div>
          <h2 style={{ fontSize: 'clamp(1.875rem, 4vw, 3rem)', fontWeight: 900, color: 'white', letterSpacing: '-0.03em', marginBottom: '1rem' }}>
            Ready to Start Learning?
          </h2>
          <p style={{ fontSize: '1.125rem', color: 'rgba(255,255,255,0.8)', marginBottom: '2.5rem', lineHeight: 1.7 }}>
            Take your first adaptive quiz and see how quickly your mastery grows.
          </p>
          <Link href="/quiz" style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            background: '#FCD34D', color: '#1C1917', textDecoration: 'none',
            padding: '1rem 2.5rem', borderRadius: '10px', fontWeight: 800, fontSize: '1.0625rem',
          }}>
            Play Now <ChevronRight size={20} />
          </Link>
        </div>
      </section>
    </div>
  );
}
