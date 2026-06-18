"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Lightbulb, ChevronRight, Clock, BarChart2, CheckCircle, XCircle, ChevronDown } from 'lucide-react';

const QUESTIONS = [
  {
    topic: 'Fractions & Ratios',
    topicColor: '#7C3AED',
    difficulty: 0.72,
    diffLabel: 'Medium-Hard',
    question: 'If 3/4 of a class is 24 students, how many students are in the whole class?',
    options: ['18 students', '24 students', '32 students', '36 students'],
    correct: 2,
    hint: "Think about what '3/4 of the class = 24' tells you about what 1/4 equals first.",
    explanation: 'If 3/4 = 24, then 1/4 = 8. The whole class = 4 × 8 = 32 students.',
  },
  {
    topic: 'Linear Equations',
    topicColor: '#0284C7',
    difficulty: 0.45,
    diffLabel: 'Medium',
    question: 'Solve for x: 2x + 7 = 19',
    options: ['x = 5', 'x = 6', 'x = 7', 'x = 13'],
    correct: 1,
    hint: "Start by isolating the term with x. What do you get when you subtract 7 from both sides?",
    explanation: '2x + 7 = 19  →  2x = 12  →  x = 6.',
  },
];

export default function QuizPage() {
  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [timer, setTimer] = useState(60);
  const [score, setScore] = useState(0);

  const q = QUESTIONS[qIndex];
  const totalQ = QUESTIONS.length;
  const progress = ((qIndex) / totalQ) * 100;

  useEffect(() => {
    if (submitted) return;
    const interval = setInterval(() => {
      setTimer(t => {
        if (t <= 1) { clearInterval(interval); setSubmitted(true); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [qIndex, submitted]);

  const handleSelect = (i: number) => {
    if (submitted) return;
    setSelected(i);
  };

  const handleSubmit = () => {
    if (selected === null) return;
    setSubmitted(true);
    if (selected === q.correct) setScore(s => s + 1);
  };

  const handleNext = () => {
    if (qIndex + 1 >= totalQ) {
      window.location.href = '/quiz/results';
      return;
    }
    setQIndex(i => i + 1);
    setSelected(null);
    setSubmitted(false);
    setShowHint(false);
    setShowExplanation(false);
    setTimer(60);
  };

  const timerColor = timer > 20 ? '#059669' : timer > 10 ? '#D97706' : '#DC2626';

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', fontFamily: "'Inter', sans-serif" }}>

      {/* ─── TOP PROGRESS BAR ─── */}
      <div style={{ background: 'white', borderBottom: '1px solid #E5E7EB', padding: '0.875rem 1.5rem' }}>
        <div style={{ maxWidth: '56rem', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#6B7280', whiteSpace: 'nowrap' }}>
            Question {qIndex + 1} of {totalQ}
          </span>
          <div style={{ flex: 1 }}>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>
          <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#7C3AED', whiteSpace: 'nowrap' }}>
            {Math.round(progress)}% Complete
          </span>
        </div>
      </div>

      {/* ─── MAIN CONTENT ─── */}
      <div style={{ maxWidth: '56rem', margin: '0 auto', padding: '2rem 1.5rem', display: 'grid', gridTemplateColumns: '1fr 280px', gap: '1.5rem', alignItems: 'start' }}>

        {/* Left: Question */}
        <div>
          {/* Question card */}
          <div className="card" style={{ marginBottom: '1rem' }}>
            {/* Card header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                <span style={{ background: `${q.topicColor}15`, color: q.topicColor, padding: '0.3rem 0.75rem', borderRadius: '9999px', fontSize: '0.8125rem', fontWeight: 600 }}>
                  {q.topic}
                </span>
                <span style={{ background: '#F3F4F6', color: '#6B7280', padding: '0.3rem 0.75rem', borderRadius: '9999px', fontSize: '0.8125rem', fontWeight: 500 }}>
                  θ = +{q.difficulty} · {q.diffLabel}
                </span>
              </div>
              {/* Timer */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', background: '#F9FAFB', border: `2px solid ${timerColor}`, borderRadius: '9999px', padding: '0.35rem 0.875rem' }}>
                <Clock size={14} color={timerColor} />
                <span style={{ fontSize: '0.875rem', fontWeight: 800, color: timerColor, fontVariantNumeric: 'tabular-nums' }}>
                  0:{timer.toString().padStart(2, '0')}
                </span>
              </div>
            </div>

            {/* Question */}
            <h2 style={{ fontSize: '1.375rem', fontWeight: 700, color: '#111827', lineHeight: 1.4, letterSpacing: '-0.01em', marginBottom: '1.75rem' }}>
              {q.question}
            </h2>

            {/* Options */}
            <div>
              {q.options.map((option, i) => {
                let cls = 'option-btn';
                if (submitted) {
                  if (i === q.correct) cls += ' correct';
                  else if (i === selected) cls += ' incorrect';
                } else if (i === selected) {
                  cls += ' selected';
                }
                return (
                  <button key={i} className={cls} onClick={() => handleSelect(i)}>
                    <span className="option-label">{String.fromCharCode(65 + i)}</span>
                    <span style={{ fontSize: '1rem', fontWeight: 500 }}>{option}</span>
                    {submitted && i === q.correct && <CheckCircle size={18} color="#059669" style={{ marginLeft: 'auto' }} />}
                    {submitted && i === selected && i !== q.correct && <XCircle size={18} color="#DC2626" style={{ marginLeft: 'auto' }} />}
                  </button>
                );
              })}
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #F3F4F6' }}>
              {!submitted ? (
                <button
                  onClick={handleSubmit}
                  disabled={selected === null}
                  style={{
                    background: selected === null ? '#E5E7EB' : '#7C3AED',
                    color: selected === null ? '#9CA3AF' : 'white',
                    border: 'none', borderRadius: '10px', padding: '0.75rem 2rem',
                    fontWeight: 700, fontSize: '0.9375rem', cursor: selected === null ? 'not-allowed' : 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  Submit Answer
                </button>
              ) : (
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button onClick={() => setShowExplanation(!showExplanation)}
                    style={{ background: '#EDE9FE', color: '#7C3AED', border: 'none', borderRadius: '10px', padding: '0.75rem 1.25rem', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <ChevronDown size={16} style={{ transform: showExplanation ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                    {showExplanation ? 'Hide' : 'Show'} Explanation
                  </button>
                  <button onClick={handleNext}
                    style={{ background: '#7C3AED', color: 'white', border: 'none', borderRadius: '10px', padding: '0.75rem 1.5rem', fontWeight: 700, fontSize: '0.9375rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    {qIndex + 1 >= totalQ ? 'See Results' : 'Next Question'} <ChevronRight size={16} />
                  </button>
                </div>
              )}
              <span style={{ fontSize: '0.875rem', color: '#9CA3AF' }}>
                Score: {score}/{qIndex + (submitted ? 1 : 0)}
              </span>
            </div>
          </div>

          {/* Explanation drawer */}
          {submitted && showExplanation && (
            <div style={{ background: '#F0FDF4', border: '1.5px solid #BBF7D0', borderRadius: '12px', padding: '1.25rem', marginBottom: '1rem' }}>
              <p style={{ fontSize: '0.875rem', fontWeight: 700, color: '#065F46', marginBottom: '0.5rem' }}>✓ Explanation</p>
              <p style={{ fontSize: '0.9375rem', color: '#047857', lineHeight: 1.65, margin: 0 }}>{q.explanation}</p>
            </div>
          )}
        </div>

        {/* Right: Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'sticky', top: '5rem' }}>

          {/* Socratic hint */}
          <div className="card" style={{ border: '1.5px solid #FEF3C7' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.875rem' }}>
              <div style={{ width: '2rem', height: '2rem', background: '#FEF3C7', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Lightbulb size={16} color="#D97706" />
              </div>
              <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#111827' }}>Socratic Hint</span>
            </div>

            {showHint ? (
              <p style={{ fontSize: '0.9rem', color: '#374151', lineHeight: 1.65, margin: 0 }}>{q.hint}</p>
            ) : (
              <div>
                <p style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '0.75rem', lineHeight: 1.6 }}>
                  Stuck? Get a guided question from our AI tutor — without giving away the answer.
                </p>
                <button onClick={() => setShowHint(true)}
                  style={{ background: '#FEF3C7', color: '#92400E', border: 'none', borderRadius: '8px', padding: '0.5rem 1rem', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', width: '100%' }}>
                  Reveal Hint
                </button>
              </div>
            )}
          </div>

          {/* Session signals */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <BarChart2 size={18} color="#7C3AED" />
              <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#111827' }}>Session Signals</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              {[
                { label: 'Ability (θ)', value: '+0.72', note: '↑ from 0.45', color: '#059669' },
                { label: 'Confidence', value: 'High', note: '3 correct streak', color: '#7C3AED' },
                { label: 'Est. Θ shift', value: '+0.15', note: 'on correct answer', color: '#0284C7' },
              ].map(sig => (
                <div key={sig.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '0.8125rem', color: '#6B7280', fontWeight: 500 }}>{sig.label}</span>
                    <span style={{ fontSize: '0.875rem', fontWeight: 700, color: sig.color }}>{sig.value}</span>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: '#9CA3AF', margin: 0 }}>{sig.note}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Quit link */}
          <Link href="/dashboard" style={{ display: 'block', textAlign: 'center', fontSize: '0.875rem', color: '#9CA3AF', textDecoration: 'none', padding: '0.5rem' }}>
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
