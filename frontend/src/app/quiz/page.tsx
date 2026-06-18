"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Lightbulb, ChevronRight, Clock, BarChart2, CheckCircle, XCircle, ChevronDown, Loader2 } from 'lucide-react';
import { generateQuestion, submitAnswer, getSocraticHint, getExplanation, scheduleReview } from '@/services/quizService';

export default function QuizPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedTopic = searchParams.get('topic') || "Computer Science";

  // Route protection
  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login');
      } else if (user.role !== 'student') {
        router.push('/dashboard');
      }
    }
  }, [user, isLoading, router]);

  // Quiz tracking
  const [qIndex, setQIndex] = useState(0);
  const [q, setQ] = useState<any>(null);
  const [theta, setTheta] = useState(0.0);
  const [bloomLevel, setBloomLevel] = useState("Remembering");
  const [difficulty, setDifficulty] = useState(0.5);
  
  // Interaction states
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [timer, setTimer] = useState(60);
  const [score, setScore] = useState(0);
  const [isGenLoading, setIsGenLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<any>(null);

  // AI States
  const [showHint, setShowHint] = useState(false);
  const [hintLoading, setHintLoading] = useState(false);
  const [aiHint, setAiHint] = useState("");
  
  const [showExplanation, setShowExplanation] = useState(false);
  const [expLoading, setExpLoading] = useState(false);
  const [aiExplanation, setAiExplanation] = useState("");

  const fetchNextQuestion = async (currentTheta: number, prevQuestions: string[] = []) => {
    setIsGenLoading(true);
    try {
      const data = await generateQuestion({
        topic: selectedTopic,
        subtopic: "General",
        difficulty: currentTheta,
        bloom_level: bloomLevel,
        previous_questions: prevQuestions
      });
      setQ({
        question: data.question,
        options: [data.options.A, data.options.B, data.options.C, data.options.D],
        optKeys: ["A", "B", "C", "D"],
        correct: ["A", "B", "C", "D"].indexOf(data.correct_answer),
        topic: "Algorithms",
        topicColor: '#7C3AED',
        difficulty: currentTheta,
        diffLabel: 'Adaptive',
        hint: data.hint,
        explanation: data.explanation,
        misconceptions: data.misconceptions
      });
      setDifficulty(currentTheta);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenLoading(false);
      setTimer(60);
    }
  };

  useEffect(() => {
    if (user && user.role === 'student' && !q && isGenLoading) {
      fetchNextQuestion(0.0);
    }
  }, [user]); // Run once when user is available

  useEffect(() => {
    if (submitted || !q) return;
    const interval = setInterval(() => {
      setTimer(t => {
        if (t <= 1) { clearInterval(interval); setSubmitted(true); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [q, submitted]);

  const handleSelect = (i: number) => {
    if (submitted || isSubmitting) return;
    setSelected(i);
  };

  const handleRevealHint = async () => {
    setShowHint(true);
    setHintLoading(true);
    try {
      const res = await getSocraticHint({
        question: q.question,
        user_answer: selected !== null ? q.options[selected] : "I don't know",
        correct_answer: q.options[q.correct],
        confidence: 3
      });
      setAiHint(res.hint || q.hint);
    } catch (e) {
      console.error("Failed to fetch Socratic hint:", e);
      setAiHint(q.hint || "Think critically about the options."); // fallback
    } finally {
      setHintLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (selected === null || !q) return;
    setIsSubmitting(true);
    setSubmitted(true);
    
    const isCorrect = selected === q.correct;
    if (isCorrect) setScore(s => s + 1);

    try {
      // 1. Submit to IRT backend to update theta
      const res = await submitAnswer({
        theta: theta,
        difficulty: difficulty,
        selected_option: q.optKeys[selected],
        correct_answer: q.optKeys[q.correct],
        topic: selectedTopic,
        subtopic: "General",
        question: q.question
      });
      
      setTheta(res.new_theta);
      setBloomLevel(res.next_bloom);
      setFeedback(res);

      // 2. Schedule Review
      scheduleReview({
        topic_id: q.topic,
        quality: isCorrect ? 5 : 2
      }).catch(e => console.error("Failed to schedule review:", e));

      // 3. Dynamic Explanation
      setExpLoading(true);
      setShowExplanation(true);
      const expRes = await getExplanation({
        question: q.question,
        correct_answer: q.options[q.correct],
        difficulty: "Adaptive"
      });
      setAiExplanation(expRes.explanation || q.explanation);

    } catch (e) {
      console.error("Error submitting answer:", e);
      setAiExplanation(q.explanation); // fallback
    } finally {
      setIsSubmitting(false);
      setExpLoading(false);
      setShowExplanation(true);
    }
  };

  const handleNext = () => {
    setQIndex(i => i + 1);
    setSelected(null);
    setSubmitted(false);
    setShowHint(false);
    setAiHint("");
    setShowExplanation(false);
    setAiExplanation("");
    setFeedback(null);
    
    // Fetch next dynamic question
    fetchNextQuestion(theta, [q.question]); 
  };

  if (isLoading || !user || user.role !== 'student' || isGenLoading || !q) {
    return (
      <div style={{ minHeight: 'calc(100vh - 4rem)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FAFAFC' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '2.5rem', height: '2.5rem',
            border: '3px solid #EDE9FE',
            borderTopColor: '#7C3AED',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem',
          }} />
          <p style={{ color: '#6B7280', fontSize: '0.875rem', fontWeight: 500 }}>
             {isGenLoading ? 'Generating next adaptive question...' : 'Loading Portal...'}
          </p>
        </div>
      </div>
    );
  }

  const timerColor = timer > 20 ? '#059669' : timer > 10 ? '#D97706' : '#DC2626';

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', fontFamily: "'Inter', sans-serif" }}>

      {/* ─── TOP PROGRESS BAR ─── */}
      <div style={{ background: 'white', borderBottom: '1px solid #E5E7EB', padding: '0.875rem 1.5rem' }}>
        <div style={{ maxWidth: '56rem', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#6B7280', whiteSpace: 'nowrap' }}>
            Question {qIndex + 1}
          </span>
          <div style={{ flex: 1 }}>
            <div className="progress-track" style={{ background: '#F3F4F6', borderRadius: '9999px', height: '6px' }}>
              <div className="progress-fill" style={{ width: `100%`, background: '#7C3AED', height: '100%', borderRadius: '9999px' }} />
            </div>
          </div>
          <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#7C3AED', whiteSpace: 'nowrap' }}>
            Continuous Learning
          </span>
        </div>
      </div>

      {/* ─── MAIN CONTENT ─── */}
      <div style={{ maxWidth: '56rem', margin: '0 auto', padding: '2rem 1.5rem', display: 'grid', gridTemplateColumns: '1fr 280px', gap: '1.5rem', alignItems: 'start' }}>

        {/* Left: Question */}
        <div>
          {/* Question card */}
          <div className="card" style={{ marginBottom: '1rem', background: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            {/* Card header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                <span style={{ background: `${q.topicColor}15`, color: q.topicColor, padding: '0.3rem 0.75rem', borderRadius: '9999px', fontSize: '0.8125rem', fontWeight: 600 }}>
                  {q.topic}
                </span>
                <span style={{ background: '#F3F4F6', color: '#6B7280', padding: '0.3rem 0.75rem', borderRadius: '9999px', fontSize: '0.8125rem', fontWeight: 500 }}>
                  θ = {(q.difficulty > 0 ? '+' : '')}{q.difficulty.toFixed(2)} · {q.diffLabel}
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
              {q.options.map((option: string, i: number) => {
                let cls = 'option-btn';
                if (submitted) {
                  if (i === q.correct) cls += ' correct';
                  else if (i === selected) cls += ' incorrect';
                } else if (i === selected) {
                  cls += ' selected';
                }
                return (
                  <button key={i} className={cls} onClick={() => handleSelect(i)} style={{ width: '100%', textAlign: 'left', padding: '1rem', border: '1px solid #E5E7EB', borderRadius: '8px', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '1rem', background: i === selected && !submitted ? '#EDE9FE' : 'white', cursor: submitted || isSubmitting ? 'default' : 'pointer' }}>
                    <span className="option-label" style={{ fontWeight: 600, color: '#6B7280' }}>{String.fromCharCode(65 + i)}</span>
                    <span style={{ fontSize: '1rem', fontWeight: 500, flex: 1 }}>{option}</span>
                    {submitted && i === q.correct && <CheckCircle size={18} color="#059669" />}
                    {submitted && i === selected && i !== q.correct && <XCircle size={18} color="#DC2626" />}
                  </button>
                );
              })}
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #F3F4F6' }}>
              {!submitted ? (
                <button
                  onClick={handleSubmit}
                  disabled={selected === null || isSubmitting}
                  style={{
                    background: selected === null || isSubmitting ? '#E5E7EB' : '#7C3AED',
                    color: selected === null || isSubmitting ? '#9CA3AF' : 'white',
                    border: 'none', borderRadius: '10px', padding: '0.75rem 2rem',
                    fontWeight: 700, fontSize: '0.9375rem', cursor: selected === null || isSubmitting ? 'not-allowed' : 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Answer'}
                </button>
              ) : (
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button onClick={handleNext}
                    style={{ background: '#7C3AED', color: 'white', border: 'none', borderRadius: '10px', padding: '0.75rem 1.5rem', fontWeight: 700, fontSize: '0.9375rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    Next Question <ChevronRight size={16} />
                  </button>
                </div>
              )}
              <span style={{ fontSize: '0.875rem', color: '#9CA3AF' }}>
                Score: {score}/{qIndex + (submitted ? 1 : 0)}
              </span>
            </div>
          </div>

          {/* Explanation drawer */}
          {submitted && showExplanation && q && (
            <div style={{ background: (feedback?.correct || selected === q.correct) ? '#F0FDF4' : '#FEF2F2', border: `1.5px solid ${(feedback?.correct || selected === q.correct) ? '#BBF7D0' : '#FECACA'}`, borderRadius: '12px', padding: '1.25rem', marginBottom: '1rem' }}>
              <p style={{ fontSize: '0.875rem', fontWeight: 700, color: (feedback?.correct || selected === q.correct) ? '#065F46' : '#991B1B', marginBottom: '0.5rem' }}>
                {(feedback?.correct || selected === q.correct) ? '✓ Correct! Explanation' : '✗ Incorrect. Explanation & Misconception'}
              </p>
              {!(feedback?.correct || selected === q.correct) && selected !== null && q.misconceptions && (
                 <p style={{ fontSize: '0.9375rem', color: '#7F1D1D', marginBottom: '0.75rem' }}>
                     <em>Your Mistake:</em> {q.misconceptions[q.optKeys[selected]]}
                 </p>
              )}
              {expLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#047857' }}>
                  <Loader2 size={16} className="animate-spin" />
                  <span style={{ fontSize: '0.875rem' }}>AI is analyzing...</span>
                </div>
              ) : (
                <p style={{ fontSize: '0.9375rem', color: (feedback?.correct || selected === q.correct) ? '#047857' : '#991B1B', lineHeight: 1.65, margin: 0 }}>{aiExplanation || q.explanation}</p>
              )}
            </div>
          )}
        </div>

        {/* Right: Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'sticky', top: '5rem' }}>

          {/* Socratic hint */}
          <div className="card" style={{ border: '1.5px solid #FEF3C7', padding: '1.25rem', background: 'white', borderRadius: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.875rem' }}>
              <div style={{ width: '2rem', height: '2rem', background: '#FEF3C7', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Lightbulb size={16} color="#D97706" />
              </div>
              <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#111827' }}>Socratic Hint</span>
            </div>

            {showHint ? (
              hintLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#92400E' }}>
                  <Loader2 size={16} className="animate-spin" />
                  <span style={{ fontSize: '0.875rem' }}>AI is thinking...</span>
                </div>
              ) : (
                <p style={{ fontSize: '0.9rem', color: '#374151', lineHeight: 1.65, margin: 0 }}>{aiHint}</p>
              )
            ) : (
              <div>
                <p style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '0.75rem', lineHeight: 1.6 }}>
                  Stuck? Get a guided question from our AI tutor — without giving away the answer.
                </p>
                <button onClick={handleRevealHint}
                  style={{ background: '#FEF3C7', color: '#92400E', border: 'none', borderRadius: '8px', padding: '0.5rem 1rem', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', width: '100%' }}>
                  Reveal Hint
                </button>
              </div>
            )}
          </div>

          {/* Session signals */}
          <div className="card" style={{ padding: '1.25rem', background: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <BarChart2 size={18} color="#7C3AED" />
              <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#111827' }}>Session Signals</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              {[
                { label: 'Ability (θ)', value: theta.toFixed(2), note: `Difficulty: ${difficulty.toFixed(2)}`, color: '#059669' },
                { label: 'System Mode', value: 'Dynamic IRT', note: `Bloom: ${bloomLevel}`, color: '#7C3AED' },
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
