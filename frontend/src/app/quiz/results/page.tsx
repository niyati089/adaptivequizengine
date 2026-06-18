import React from 'react';
import Link from 'next/link';
import { CheckCircle, ArrowRight, BarChart2, BookOpen, ChevronRight } from 'lucide-react';

const topicResults = [
  { name: 'Fractions & Ratios', before: 58, after: 73, delta: '+15%', correct: true },
  { name: 'Linear Equations', before: 42, after: 55, delta: '+13%', correct: true },
  { name: 'Decimals', before: 65, after: 62, delta: '-3%', correct: false },
];

const nextTopics = [
  { name: 'Quadratic Equations', reason: 'Next in your DAG path', color: '#7C3AED', bg: '#EDE9FE' },
  { name: 'Ratio Problems', reason: 'Strengthen weak area', color: '#D97706', bg: '#FEF3C7' },
  { name: 'Algebraic Fractions', reason: 'Prerequisite unlocked', color: '#0284C7', bg: '#E0F2FE' },
];

export default function ResultsPage() {
  const scorePercent = 75;
  const correct = 6;
  const total = 8;

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', fontFamily: "'Inter', sans-serif", padding: '2.5rem 1.5rem' }}>
      <div style={{ maxWidth: '56rem', margin: '0 auto' }}>

        {/* ─── SCORE HEADER ─── */}
        <div className="card" style={{ marginBottom: '1.5rem', display: 'flex', gap: '2rem', alignItems: 'center', flexWrap: 'wrap', background: '#7C3AED', border: 'none' }}>
          {/* Score circle */}
          <div style={{ position: 'relative', width: '120px', height: '120px', flexShrink: 0 }}>
            <svg width="120" height="120" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="10" />
              <circle cx="60" cy="60" r="50" fill="none" stroke="#FCD34D" strokeWidth="10"
                strokeDasharray={`${2 * Math.PI * 50}`}
                strokeDashoffset={`${2 * Math.PI * 50 * (1 - scorePercent / 100)}`}
                strokeLinecap="round"
                transform="rotate(-90 60 60)"
              />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '1.875rem', fontWeight: 900, color: 'white', lineHeight: 1 }}>{scorePercent}%</span>
              <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>Score</span>
            </div>
          </div>

          {/* Summary text */}
          <div style={{ color: 'white', flex: 1 }}>
            <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#FCD34D', marginBottom: '0.375rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Quiz Complete
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: 'white', letterSpacing: '-0.03em', marginBottom: '0.5rem' }}>
              {scorePercent >= 80 ? 'Excellent Work!' : scorePercent >= 60 ? 'Good Progress!' : 'Keep Practicing!'}
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '1rem', marginBottom: '1rem' }}>
              {correct} of {total} correct · Theta moved from +0.45 to +0.72
            </p>
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
              {[['θ +0.27', 'Ability gained'], ['2m 34s', 'Total time'], ['82%', 'Hint accuracy']].map(([val, label]) => (
                <div key={label}>
                  <div style={{ fontSize: '1.125rem', fontWeight: 800, color: '#FCD34D' }}>{val}</div>
                  <div style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.6)' }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>

          {/* ─── TOPIC MASTERY UPDATES ─── */}
          <div className="card" style={{ gridColumn: '1 / -1' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <BarChart2 size={20} color="#7C3AED" />
              <h2 style={{ fontSize: '1.0625rem', fontWeight: 700, color: '#111827', margin: 0 }}>Mastery Updates</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {topicResults.map((t, i) => (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.375rem' }}>
                    <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#111827' }}>{t.name}</span>
                    <span style={{ fontSize: '0.875rem', fontWeight: 700, color: t.correct ? '#059669' : '#DC2626' }}>{t.delta}</span>
                  </div>
                  <div style={{ position: 'relative', height: '8px', background: '#F3F4F6', borderRadius: '9999px', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${t.before}%`, background: '#E5E7EB', borderRadius: '9999px' }} />
                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${t.after}%`, background: t.correct ? '#7C3AED' : '#EF4444', borderRadius: '9999px', transition: 'width 0.8s ease' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem' }}>
                    <span style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>Before: {t.before}%</span>
                    <span style={{ fontSize: '0.75rem', color: '#6B7280', fontWeight: 600 }}>After: {t.after}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ─── RECOMMENDED NEXT ─── */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <BookOpen size={20} color="#7C3AED" />
              <h2 style={{ fontSize: '1.0625rem', fontWeight: 700, color: '#111827', margin: 0 }}>Next Up</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {nextTopics.map((t, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: '#F9FAFB', borderRadius: '10px' }}>
                  <div style={{ width: '2.25rem', height: '2.25rem', background: t.bg, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: t.color }}>{i + 1}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#111827' }}>{t.name}</div>
                    <div style={{ fontSize: '0.8125rem', color: '#6B7280' }}>{t.reason}</div>
                  </div>
                  <ChevronRight size={16} color="#D1D5DB" />
                </div>
              ))}
            </div>
          </div>

          {/* ─── PERFORMANCE INSIGHTS ─── */}
          <div className="card">
            <div style={{ marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.0625rem', fontWeight: 700, color: '#111827', margin: 0 }}>Performance Insights</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <div style={{ padding: '0.875rem', background: '#ECFDF5', borderRadius: '10px', border: '1px solid #A7F3D0' }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                  <CheckCircle size={16} color="#059669" style={{ marginTop: '1px', flexShrink: 0 }} />
                  <p style={{ fontSize: '0.875rem', color: '#047857', margin: 0, lineHeight: 1.55 }}>
                    Strong performance on fraction-based reasoning. Your θ crossed +0.70 threshold.
                  </p>
                </div>
              </div>
              <div style={{ padding: '0.875rem', background: '#FEF3C7', borderRadius: '10px', border: '1px solid #FDE68A' }}>
                <p style={{ fontSize: '0.875rem', color: '#92400E', margin: 0, lineHeight: 1.55, fontWeight: 500 }}>
                  ⚠ Misconception detected: sign errors in algebraic manipulation. Focus on this next.
                </p>
              </div>
              <div style={{ padding: '0.875rem', background: '#EDE9FE', borderRadius: '10px', border: '1px solid #C4B5FD' }}>
                <p style={{ fontSize: '0.875rem', color: '#5B21B6', margin: 0, lineHeight: 1.55 }}>
                  📅 Spaced repetition scheduled: Decimals review in 3 days.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/quiz" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            Take Next Quiz <ArrowRight size={16} />
          </Link>
          <Link href="/dashboard" className="btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            View Full Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
