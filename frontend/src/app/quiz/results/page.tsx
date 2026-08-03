"use client";

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, AlertTriangle, ArrowRight, BarChart2, Sparkles } from 'lucide-react';

const MISCONCEPTION_LABELS: Record<string, string> = {
  sign_error: 'Sign / Direction Error',
  off_by_one: 'Off-by-One / Boundary Error',
  concept_confusion: 'Concept Confusion',
  overgeneralization: 'Overgeneralization',
  calculation_error: 'Calculation / Procedural Slip',
  unit_scope_error: 'Unit / Scope Error',
  misread_question: 'Misread Question',
  incomplete_reasoning: 'Incomplete Reasoning',
};

function ResultsContent() {
  const searchParams = useSearchParams();

  const topic = searchParams.get('topic') || 'your topic';
  const subtopic = searchParams.get('subtopic') || '';
  const correct = Number(searchParams.get('correct') || 0);
  const total = Number(searchParams.get('total') || 0);
  const startTheta = Number(searchParams.get('startTheta') || 0);
  const endTheta = Number(searchParams.get('endTheta') || 0);
  const misconceptionTags = (searchParams.get('misconceptions') || '')
    .split(',')
    .filter(Boolean);

  const scorePercent = total > 0 ? Math.round((correct / total) * 100) : 0;
  const thetaDelta = Math.round((endTheta - startTheta) * 100) / 100;

  const misconceptionCounts = misconceptionTags.reduce<Record<string, number>>((acc, tag) => {
    acc[tag] = (acc[tag] || 0) + 1;
    return acc;
  }, {});
  const misconceptionEntries = Object.entries(misconceptionCounts).sort((a, b) => b[1] - a[1]);

  return (
    <div className="neo-page">
      <div className="neo-shell" style={{ maxWidth: '56rem' }}>

        {/* ─── SCORE HEADER ─── */}
        <div className="card" style={{ marginBottom: 'var(--space-6)', display: 'flex', gap: 'var(--space-8)', alignItems: 'center', flexWrap: 'wrap', background: 'var(--primary)', border: 'none' }}>
          <div style={{ position: 'relative', width: '120px', height: '120px', flexShrink: 0 }}>
            <svg width="120" height="120" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="10" />
              <circle cx="60" cy="60" r="50" fill="none" stroke="var(--amber)" strokeWidth="10"
                strokeDasharray={`${2 * Math.PI * 50}`}
                strokeDashoffset={`${2 * Math.PI * 50 * (1 - scorePercent / 100)}`}
                strokeLinecap="round"
                transform="rotate(-90 60 60)"
              />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 'var(--text-3xl)', fontWeight: 'var(--font-black)', color: 'var(--surface)', lineHeight: 'var(--leading-tight)' }}>{scorePercent}%</span>
              <span style={{ fontSize: 'var(--text-xs)', color: 'rgba(255,255,255,0.7)', fontWeight: 'var(--font-medium)' }}>Score</span>
            </div>
          </div>

          <div style={{ color: 'var(--surface)', flex: 1 }}>
            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', color: 'var(--amber)', marginBottom: 'var(--space-2)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Quiz Complete · {topic}{subtopic ? ` · ${subtopic}` : ''}
            </div>
            <h1 style={{ fontSize: 'var(--heading-sm)', fontWeight: 'var(--font-black)', color: 'var(--surface)', letterSpacing: '-0.03em', marginBottom: 'var(--space-2)' }}>
              {scorePercent >= 80 ? 'Excellent Work!' : scorePercent >= 60 ? 'Good Progress!' : 'Keep Practicing!'}
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 'var(--text-base)', marginBottom: 'var(--space-4)' }}>
              {correct} of {total} correct · Theta moved from {startTheta >= 0 ? '+' : ''}{startTheta.toFixed(2)} to {endTheta >= 0 ? '+' : ''}{endTheta.toFixed(2)}
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-6)', flexWrap: 'wrap' }}>
              {[
                [`${thetaDelta >= 0 ? '+' : ''}${thetaDelta.toFixed(2)}`, 'Ability change'],
                [`${correct}/${total}`, 'Questions correct'],
                [`${misconceptionTags.length}`, 'Misconceptions flagged'],
              ].map(([val, label]) => (
                <div key={label}>
                  <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-extrabold)', color: 'var(--amber)' }}>{val}</div>
                  <div style={{ fontSize: 'var(--text-sm)', color: 'rgba(255,255,255,0.6)' }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)' }}>

          {/* ─── ABILITY PROGRESS ─── */}
          <div className="card" style={{ gridColumn: '1 / -1' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-5)' }}>
              <BarChart2 size={20} color="var(--primary)" />
              <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-bold)', color: 'var(--ink)', margin: 0 }}>Ability Progress: {topic}</h2>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', color: 'var(--ink)' }}>Theta (ability estimate)</span>
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-bold)', color: thetaDelta >= 0 ? 'var(--success)' : 'var(--error)' }}>
                {thetaDelta >= 0 ? '+' : ''}{thetaDelta.toFixed(2)}
              </span>
            </div>
            <div style={{ position: 'relative', height: '8px', background: 'var(--surface-high)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${((endTheta + 3) / 6) * 100}%`, background: 'var(--primary)', borderRadius: 'var(--radius-full)', transition: 'width 0.8s ease' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--space-1)' }}>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted-light)' }}>Before: {startTheta >= 0 ? '+' : ''}{startTheta.toFixed(2)}</span>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', fontWeight: 'var(--font-semibold)' }}>After: {endTheta >= 0 ? '+' : ''}{endTheta.toFixed(2)}</span>
            </div>
          </div>

          {/* ─── MISCONCEPTIONS ─── */}
          <div className="card" style={{ gridColumn: '1 / -1' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-5)' }}>
              <AlertTriangle size={20} color="var(--warning)" />
              <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-bold)', color: 'var(--ink)', margin: 0 }}>Misconceptions Detected</h2>
            </div>
            {misconceptionEntries.length === 0 ? (
              <div style={{ padding: 'var(--space-3)', background: 'var(--success-soft)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--success)', display: 'flex', gap: 'var(--space-2)', alignItems: 'flex-start' }}>
                <CheckCircle size={16} color="var(--success)" style={{ marginTop: '1px', flexShrink: 0 }} />
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--success)', margin: 0, lineHeight: 'var(--leading-snug)' }}>
                  No recurring misconceptions detected this session — clean run!
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {misconceptionEntries.map(([tag, count]) => (
                  <div key={tag} style={{ padding: 'var(--space-3)', background: 'var(--warning-soft)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--warning)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--warning)', margin: 0, lineHeight: 'var(--leading-snug)', fontWeight: 'var(--font-medium)' }}>
                      {MISCONCEPTION_LABELS[tag] || tag}
                    </p>
                    <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-extrabold)', color: 'var(--warning)', background: 'rgba(146,64,14,0.1)', borderRadius: 'var(--radius-full)', padding: 'var(--space-1) var(--space-3)' }}>
                      ×{count}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <div style={{ padding: 'var(--space-3)', background: 'var(--primary-soft)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--primary-light)', marginTop: 'var(--space-3)', display: 'flex', gap: 'var(--space-2)', alignItems: 'flex-start' }}>
              <Sparkles size={16} color="var(--primary)" style={{ marginTop: '1px', flexShrink: 0 }} />
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--primary)', margin: 0, lineHeight: 'var(--leading-snug)' }}>
                Spaced repetition scheduled for {topic}{subtopic ? ` (${subtopic})` : ''} based on today's performance.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-6)', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href={`/quiz?topic=${encodeURIComponent(topic)}`} className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            Take Another Quiz <ArrowRight size={16} style={{ width: 'var(--icon-sm)', height: 'var(--icon-sm)' }} />
          </Link>
          <Link href="/analytics" className="btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            View Full Analytics
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={<div className="neo-page" />}>
      <ResultsContent />
    </Suspense>
  );
}
