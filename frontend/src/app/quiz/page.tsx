"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Lightbulb, ChevronRight, Clock, BarChart2, CheckCircle, XCircle, ChevronDown } from 'lucide-react';
import { generateQuestion, submitAnswer } from '@/services/quizService';

export default function QuizPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login');
      } else if (user.role !== 'student') {
        router.push('/unauthorized');
      }
    }
  }, [user, isLoading, router]);

  if (isLoading || !user || user.role !== 'student') {
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
          <p style={{ color: '#6B7280', fontSize: '0.875rem', fontWeight: 500 }}>Loading Portal...</p>
        </div>
      </div>
    );
  }

  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const [showHint, setShowHint] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [timer, setTimer] = useState(60);
  const [score, setScore] = useState(0);

  // Dynamic IRT State
  const [isLoading, setIsLoading] = useState(true);
  const [q, setQ] = useState<any>(null);
  const [theta, setTheta] = useState(0.0);
  const [difficulty, setDifficulty] = useState(0.0);
  const [bloomLevel, setBloomLevel] = useState('understand');
  const [prevQuestions, setPrevQuestions] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<any>(null);

  const [topic, setTopic] = useState('Python Basics');
  const [subtopic, setSubtopic] = useState('Variables & Flow');
  const [isConfiguring, setIsConfiguring] = useState(true);

  // Load question on mount or subsequent next requests
  useEffect(() => {
    if (!isConfiguring && !q && !submitted) {
      loadNextQuestion();
    }
  }, [qIndex, isConfiguring]);

  const loadNextQuestion = async () => {
    setIsLoading(true);
    try {
      const data = await generateQuestion({
        topic,
        subtopic,
        difficulty,
        bloom_level: bloomLevel,
        previous_questions: prevQuestions,
      });

      // Map options dictionary into array
      const optKeys = Object.keys(data.options);
      const optArray = optKeys.map(k => data.options[k]);
      const correctIdx = optKeys.indexOf(data.correct_answer);

      setQ({
        ...data,
        topicColor: '#7C3AED',
        diffLabel: data.difficulty > 1.5 ? 'Expert' : data.difficulty > 0.5 ? 'Advanced' : data.difficulty > -0.5 ? 'Intermediate' : 'Beginner',
        optionsArray: optArray,
        correctIdx: correctIdx,
        optKeys: optKeys,
        hint: `Hint: Carefully check your logic for options ${optKeys[0]} and ${optKeys[1]}.`
      });

      setPrevQuestions(prev => [...prev, data.question]);
    } catch (err) {
      console.error("Failed to fetch question:", err);
    } finally {
      setIsLoading(false);
      setTimer(60);
    }
  };

  useEffect(() => {
    if (submitted || isLoading || !q) return;
    const interval = setInterval(() => {
      setTimer(t => {
        if (t <= 1) { 
            clearInterval(interval); 
            handleAutoSubmit();
            return 0; 
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [qIndex, submitted, isLoading, q]);

  const handleSelect = (i: number) => {
    if (submitted) return;
    setSelected(i);
  };

  const handleAutoSubmit = async () => {
    if (!selected) setSelected(0);
    await handleSubmit();
  }

  const handleSubmit = async () => {
    if (selected === null || !q) return;
    setSubmitted(true);
    setIsLoading(true);
    
    try {
        const selectedLetter = q.optKeys[selected];
        const result = await submitAnswer({
            theta: theta,
            difficulty: q.difficulty,
            selected_option: selectedLetter,
            correct_answer: q.correct_answer,
            topic: topic,
            subtopic: subtopic,
            question: q.question
        });

        setFeedback(result);
        if (result.correct) setScore(s => s + 1);
        
        // Update IRT trackers internally
        setTheta(result.new_theta);
        setDifficulty(result.next_difficulty);
        setBloomLevel(result.next_bloom);
    } catch (err) {
        console.error("Error submitting answer:", err);
    } finally {
        setIsLoading(false);
        setShowExplanation(true);
    }
  };

  const handleNext = () => {
    setQIndex(i => i + 1);
    setSelected(null);
    setSubmitted(false);
    setShowHint(false);
    setShowExplanation(false);
    setQ(null); // Triggers loading next
    setFeedback(null);
  };

  const timerColor = timer > 20 ? '#059669' : timer > 10 ? '#D97706' : '#DC2626';

  if (isConfiguring) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F9FAFB', fontFamily: "'Inter', sans-serif" }}>
        <div style={{ background: 'white', padding: '2.5rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', width: '100%', maxWidth: '400px' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', marginBottom: '1.5rem', textAlign: 'center' }}>Configure Your Quiz</h1>
          
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>Topic</label>
            <input 
              type="text" 
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '1rem' }}
              placeholder="e.g. Physics"
            />
          </div>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>Subtopic</label>
            <input 
              type="text" 
              value={subtopic}
              onChange={(e) => setSubtopic(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '1rem' }}
              placeholder="e.g. Kinematics"
            />
          </div>
          
          <button 
            onClick={() => setIsConfiguring(false)}
            style={{ width: '100%', background: '#7C3AED', color: 'white', padding: '0.875rem', borderRadius: '8px', fontWeight: 700, fontSize: '1rem', border: 'none', cursor: 'pointer' }}
          >
            Start Adaptive Quiz
          </button>
        </div>
      </div>
    );
  }

  if (!q || isLoading) {
    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', sans-serif" }}>
            <h2 style={{color: '#7C3AED'}}>Generating Adaptive Question...</h2>
        </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', fontFamily: "'Inter', sans-serif" }}>

      {/* ─── TOP PROGRESS BAR ─── */}
      <div style={{ background: 'white', borderBottom: '1px solid #E5E7EB', padding: '0.875rem 1.5rem' }}>
        <div style={{ maxWidth: '56rem', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#6B7280', whiteSpace: 'nowrap' }}>
            Question {qIndex + 1}
          </span>
          <div style={{ flex: 1 }}>
            <div className="progress-track" style={{ background: '#E5E7EB', height: 8, borderRadius: 4, width: '100%' }}>
              <div className="progress-fill" style={{ width: `50%`, background: '#7C3AED', height: '100%', borderRadius: 4 }} />
            </div>
          </div>
          <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#7C3AED', whiteSpace: 'nowrap' }}>
            Adaptive Mode
          </span>
        </div>
      </div>

      {/* ─── MAIN CONTENT ─── */}
      <div style={{ maxWidth: '56rem', margin: '0 auto', padding: '2rem 1.5rem', display: 'grid', gridTemplateColumns: '1fr 280px', gap: '1.5rem', alignItems: 'start' }}>

        {/* Left: Question */}
        <div>
          {/* Question card */}
          <div className="card" style={{ marginBottom: '1rem', background: '#fff', padding: 20, borderRadius: 12, boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
            {/* Card header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                <span style={{ background: `${q.topicColor}15`, color: q.topicColor, padding: '0.3rem 0.75rem', borderRadius: '9999px', fontSize: '0.8125rem', fontWeight: 600 }}>
                  {topic}
                </span>
                <span style={{ background: '#F3F4F6', color: '#6B7280', padding: '0.3rem 0.75rem', borderRadius: '9999px', fontSize: '0.8125rem', fontWeight: 500 }}>
                  θ = {q.difficulty} · {q.diffLabel}
                </span>
                <span style={{ background: '#FEF3C7', color: '#92400E', padding: '0.3rem 0.75rem', borderRadius: '9999px', fontSize: '0.8125rem', fontWeight: 500 }}>
                  Bloom: {bloomLevel}
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
            <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
              {q.optionsArray.map((option: string, i: number) => {
                let bg = '#F9FAFB', borderColor = '#E5E7EB', color = '#111827';
                if (submitted && feedback) {
                  if (i === q.correctIdx) { bg = '#F0FDF4'; borderColor = '#34D399'; }
                  else if (i === selected) { bg = '#FEF2F2'; borderColor = '#F87171'; }
                } else if (i === selected) {
                  bg = '#EDE9FE'; borderColor = '#7C3AED'; color = '#5B21B6';
                }

                return (
                  <button key={i} onClick={() => handleSelect(i)}
                    style={{
                      display: 'flex', alignItems: 'center', p: 15, background: bg, border: `1px solid ${borderColor}`,
                      borderRadius: 10, cursor: 'pointer', textAlign: 'left', minHeight: 48, padding: '10px 15px'
                    }}>
                    <span style={{ background: 'white', color: color, width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 15, fontSize: 13, fontWeight: 'bold', border: `1px solid ${borderColor}` }}>
                      {q.optKeys[i]}
                    </span>
                    <span style={{ fontSize: '1rem', fontWeight: 500, color: color, flex: 1 }}>{option}</span>
                    {submitted && i === q.correctIdx && <CheckCircle size={18} color="#059669" />}
                    {submitted && i === selected && i !== q.correctIdx && <XCircle size={18} color="#DC2626" />}
                  </button>
                );
              })}
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #F3F4F6' }}>
              {!submitted ? (
                <button
                  onClick={handleSubmit}
                  disabled={selected === null || isLoading}
                  style={{
                    background: selected === null || isLoading ? '#E5E7EB' : '#7C3AED',
                    color: selected === null || isLoading ? '#9CA3AF' : 'white',
                    border: 'none', borderRadius: '10px', padding: '0.75rem 2rem',
                    fontWeight: 700, fontSize: '0.9375rem', cursor: selected === null || isLoading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {isLoading ? 'Submitting...' : 'Submit Answer'}
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
          {submitted && showExplanation && q && feedback && (
            <div style={{ background: feedback.correct ? '#F0FDF4' : '#FEF2F2', border: `1.5px solid ${feedback.correct ? '#BBF7D0' : '#FECACA'}`, borderRadius: '12px', padding: '1.25rem', marginBottom: '1rem' }}>
              <p style={{ fontSize: '0.875rem', fontWeight: 700, color: feedback.correct ? '#065F46' : '#991B1B', marginBottom: '0.5rem' }}>
                {feedback.correct ? '✓ Correct! Explanation' : '✗ Incorrect. Explanation & Misconception'}
              </p>
              {!feedback.correct && selected !== null && (
                 <p style={{ fontSize: '0.9375rem', color: '#7F1D1D', marginBottom: '0.75rem' }}>
                     <em>Your Mistake:</em> {q.misconceptions[q.optKeys[selected]]}
                 </p>
              )}
              <p style={{ fontSize: '0.9375rem', color: feedback.correct ? '#047857' : '#991B1B', lineHeight: 1.65, margin: 0 }}>{q.explanation}</p>
            </div>
          )}
        </div>

        {/* Right: Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'sticky', top: '5rem' }}>

          {/* Socratic hint */}
          <div className="card" style={{ border: '1.5px solid #FEF3C7', padding: 15, background: '#fff', borderRadius: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.875rem' }}>
              <div style={{ width: '2rem', height: '2rem', background: '#FEF3C7', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Lightbulb size={16} color="#D97706" />
              </div>
              <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#111827' }}>Socratic Hint</span>
            </div>

            {showHint ? (
              <p style={{ fontSize: '0.9rem', color: '#374151', lineHeight: 1.65, margin: 0 }}>{q?.hint || "Think critically about the options."}</p>
            ) : (
              <div>
                <p style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '0.75rem', lineHeight: 1.6 }}>
                  Stuck? Get a guided question from our AI tutor.
                </p>
                <button onClick={() => setShowHint(true)}
                  style={{ background: '#FEF3C7', color: '#92400E', border: 'none', borderRadius: '8px', padding: '0.5rem 1rem', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', width: '100%' }}>
                  Reveal Hint
                </button>
              </div>
            )}
          </div>

          {/* Session signals */}
          <div className="card" style={{ padding: 15, background: '#fff', borderRadius: 12, boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <BarChart2 size={18} color="#7C3AED" />
              <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#111827' }}>Session Signals</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              {[
                { label: 'Ability (θ)', value: theta.toFixed(2), note: `Difficulty: ${difficulty}`, color: '#059669' },
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
