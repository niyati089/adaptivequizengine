"use client";

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import setupImage from '@/components/images/image2.png';
import { Lightbulb, ChevronRight, Clock, BarChart2, CheckCircle, XCircle, ChevronDown, Loader2, Shield, Camera, AlertCircle, Trophy, Target, Brain, AlertTriangle, Home, RotateCcw } from 'lucide-react';
import { generateQuestion, submitAnswer, getSocraticHint, getExplanation, scheduleReview, generateTopicDag } from '@/services/quizService';
import { useProctoring } from '@/hooks/useProctoring';
import { useBrowserMonitoring } from '@/hooks/useBrowserMonitoring';
import { WarningModal } from '@/components/quiz/WarningModal';


interface QuestionRecord {
  question: string;
  subtopic: string;
  concept: string;
  correct: boolean;
  bloomLevel: string;
}

function QuizContent() {
  const { user, isLoading, api } = useAuth();
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
  const [quizState, setQuizState] = useState<'setup' | 'playing' | 'results' | 'summary'>('setup');
  const [inputTopic, setInputTopic] = useState(selectedTopic || "");
  const [dagData, setDagData] = useState<any>(null);
  const [isLoadingDag, setIsLoadingDag] = useState(false);
  const [selectedSubtopic, setSelectedSubtopic] = useState("");
  
  const [qIndex, setQIndex] = useState(0);
  const [q, setQ] = useState<any>(null);
  const [theta, setTheta] = useState(0.0);
  const [bloomLevel, setBloomLevel] = useState("Remembering");
  const [difficulty, setDifficulty] = useState(0.5);

  // Results tracking
  const [questionHistory, setQuestionHistory] = useState<QuestionRecord[]>([]);
  const [score, setScore] = useState(0);
  
  // Interaction states
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [timer, setTimer] = useState(60);
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
  const [aiDiagramUrl, setAiDiagramUrl] = useState("");
  const [showSidebarDiagram, setShowSidebarDiagram] = useState(false);

  const [enableAntiCheating, setEnableAntiCheating] = useState(true);
  const [genError, setGenError] = useState<string | null>(null);

  // Stable session ID shared by both proctoring hooks and the quiz service
  const sessionId = `session_${user?.id || 'guest'}_${inputTopic}`;

  // AI Proctoring Hook
  const proctoring = useProctoring(quizState === 'playing', sessionId);

  // Browser Monitoring & Anti-Cheating Focus Hook
  const browserMonitoring = useBrowserMonitoring({
    maxWarnings: 2,
    sessionId,
    enabled: quizState === 'playing',
    onAutoLock: () => {
      // Intentionally empty — redirect handled by the useEffect below
      // to avoid dual setTimeout race conditions
    }
  });

  // HARD LOCK condition: 2 tab switches / browser violations reached
  // Also locks when backend-restored session count is ≥ maxWarnings
  const isSessionLocked = browserMonitoring.isLocked || browserMonitoring.warningsCount >= 2;

  // Auto-redirect to dashboard when session is locked — single redirect path
  useEffect(() => {
    if (isSessionLocked && quizState === 'playing') {
      const exitTimer = setTimeout(() => {
        router.push('/dashboard');
      }, 2500);
      return () => clearTimeout(exitTimer);
    }
  }, [isSessionLocked, quizState, router]);


  const fetchNextQuestion = async (currentTheta: number, prevQuestions: string[] = []) => {
    if (isSessionLocked) return;
    setIsGenLoading(true);
    setGenError(null);
    try {
      console.log('[Quiz] Calling generateQuestion with token:', !!api?.defaults?.headers?.common?.Authorization);
      const data = await generateQuestion({
        topic: inputTopic,
        subtopic: selectedSubtopic || "General",
        difficulty: currentTheta,
        bloom_level: bloomLevel,
        previous_questions: prevQuestions,
        enable_anti_cheating: enableAntiCheating,
        session_id: sessionId,  // Fix 2: backend verifies lock status before serving question
      }, api);
      setQ({
        question: data.question,
        options: [data.options.A, data.options.B, data.options.C, data.options.D],
        optKeys: ["A", "B", "C", "D"],
        correct: ["A", "B", "C", "D"].indexOf(data.correct_answer),
        topic: inputTopic,
        topicColor: '#7C3AED',
        difficulty: currentTheta,
        diffLabel: 'Adaptive',
        concept: data.concept || selectedSubtopic || 'General',
        hint: data.hint,
        explanation: data.explanation,
        misconceptions: data.misconceptions,
        isVariant: data.is_variant
      });
      setDifficulty(currentTheta);
    } catch (e: any) {
      // Fix 2: Backend returns 403 when the session is locked server-side.
      // This handles the case where client state was bypassed via DevTools.
      if (e?.response?.status === 403) {
        console.warn('[Quiz] Backend refused question — session is locked (403)');
        // The isSessionLocked derived state will trigger via browserMonitoring;
        // we don't need to manually set it — the redirect effect handles the rest.
      } else {
        console.error(e);
        setGenError(e?.response?.data?.detail || e?.message || "Failed to generate question. Please try again.");
      }
    } finally {
      setIsGenLoading(false);
      setTimer(60);
    }
  };


  const handleGenerateDag = async () => {
    if (!inputTopic.trim()) return;
    setIsLoadingDag(true);
    try {
      const data = await generateTopicDag(inputTopic, api);
      let parsedSubtopics = data.subtopics;
      if (!parsedSubtopics && data.dag && data.dag.nodes) {
        parsedSubtopics = data.dag.nodes.map((n: any) => ({
          title: n.label || n.id,
          level: n.level
        }));
      }
      setDagData({ ...data, subtopics: parsedSubtopics });
      if (parsedSubtopics && parsedSubtopics.length > 0) {
        setSelectedSubtopic(parsedSubtopics[0].title);
      }
    } catch (e) {
      console.error("Failed to generate DAG:", e);
    } finally {
      setIsLoadingDag(false);
    }
  };

  const startQuiz = () => {
    setQuizState('playing');
    browserMonitoring.enterFullscreen();
    fetchNextQuestion(0.0);
  };

  const handleEndTest = () => {
    setQuizState('results');
  };

  const handleRestartQuiz = () => {
    setQuizState('setup');
    setQIndex(0);
    setQ(null);
    setTheta(0.0);
    setBloomLevel('Remembering');
    setDifficulty(0.5);
    setSelected(null);
    setSubmitted(false);
    setTimer(60);
    setScore(0);
    setQuestionHistory([]);
    setFeedback(null);
    setShowHint(false);
    setAiHint('');
    setShowExplanation(false);
    setAiExplanation('');
    setDagData(null);
    setInputTopic('');
    setSelectedSubtopic('');
  };

  const handleStartConceptQuiz = (concept: string) => {
    const parentTopic = inputTopic; // capture before any state changes
    // Reset quiz state but keep the parent topic; use concept as the focused subtopic
    setQIndex(0);
    setQ(null);
    setTheta(0.0);
    setBloomLevel('Remembering');
    setDifficulty(0.5);
    setSelected(null);
    setSubmitted(false);
    setTimer(60);
    setScore(0);
    setQuestionHistory([]);
    setFeedback(null);
    setShowHint(false);
    setAiHint('');
    setShowExplanation(false);
    setAiExplanation('');
    setDagData(null);
    // Keep the parent topic; concept becomes the subtopic for targeted drilling
    setInputTopic(parentTopic);
    setSelectedSubtopic(concept);
    setQuizState('playing');
    setIsGenLoading(true);
    generateQuestion({
      topic: parentTopic,
      subtopic: concept,
      difficulty: 0.0,
      bloom_level: 'Remembering',
      previous_questions: []
    }).then(data => {
      setQ({
        question: data.question,
        options: [data.options.A, data.options.B, data.options.C, data.options.D],
        optKeys: ['A', 'B', 'C', 'D'],
        correct: ['A', 'B', 'C', 'D'].indexOf(data.correct_answer),
        topic: parentTopic,
        topicColor: '#EF4444',
        difficulty: 0.0,
        diffLabel: 'Adaptive',
        concept: data.concept || concept,
        hint: data.hint,
        explanation: data.explanation,
        misconceptions: data.misconceptions
      });
    }).catch(e => console.error(e))
      .finally(() => { setIsGenLoading(false); setTimer(60); });
  };

  useEffect(() => {
    if (submitted || !q || isSessionLocked) return;
    const interval = setInterval(() => {
      setTimer(t => {
        if (t <= 1) { clearInterval(interval); setSubmitted(true); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [q, submitted, isSessionLocked]);

  const handleSelect = (i: number) => {
    if (submitted || isSubmitting || isSessionLocked) return;
    setSelected(i);
  };

  const handleRevealHint = async () => {
    if (isSessionLocked) return;
    setShowHint(true);
    setHintLoading(true);
    try {
      const res = await getSocraticHint({
        question: q.question,
        user_answer: selected !== null ? q.options[selected] : "I don't know",
        correct_answer: q.options[q.correct],
        confidence: 3
      }, api);
      setAiHint(res.hint || q.hint);
    } catch (e) {
      console.error("Failed to fetch Socratic hint:", e);
      setAiHint(q.hint || "Think critically about the options.");
    } finally {
      setHintLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (selected === null || !q || isSessionLocked) return;
    setIsSubmitting(true);
    setSubmitted(true);
    
    const isCorrect = selected === q.correct;
    if (isCorrect) setScore(s => s + 1);

    try {
      // Get misconception if the user was incorrect
      const selectedOptionKey = q.optKeys[selected];
      const misconceptionText = !isCorrect && q.misconceptions ? q.misconceptions[selectedOptionKey] : null;

      // 1. Submit to IRT backend to update theta
      const res = await submitAnswer({
        theta: theta,
        difficulty: difficulty,
        selected_option: selectedOptionKey,
        correct_answer: q.optKeys[q.correct],
        topic: inputTopic,
        subtopic: selectedSubtopic || "General",
        question: q.question,
        question_index: qIndex + 1,
        misconception: misconceptionText,
        // New: Pass complete question data for history storage
        question_options: {
          A: q.options[0],
          B: q.options[1],
          C: q.options[2],
          D: q.options[3]
        },
        explanation: q.explanation,
        bloom_level: bloomLevel
      }, api);
      
      setTheta(res.new_theta);
      setBloomLevel(res.next_bloom);
      setFeedback(res);

      scheduleReview({
        topic_id: q.topic,
        quality: isCorrect ? 5 : 2
      }, api).catch(e => console.error("Failed to schedule review:", e));

      setExpLoading(true);
      setShowExplanation(true);
      const expRes = await getExplanation({
        question: q.question,
        correct_answer: q.options[q.correct],
        difficulty: "Adaptive"
      }, api);
      setAiExplanation(expRes.explanation || q.explanation);
      setAiDiagramUrl(expRes.diagram_url || "");

    } catch (e) {
      console.error("Error submitting answer:", e);
      setAiExplanation(q.explanation);
      setAiDiagramUrl("");
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
    setAiDiagramUrl("");
    setShowSidebarDiagram(false);
    setFeedback(null);
    
    fetchNextQuestion(theta, [q.question]); 
  };

  // ─── RESULTS SCREEN ───
  if (quizState === 'results') {
    const totalAnswered = questionHistory.length;
    const totalCorrect = questionHistory.filter(r => r.correct).length;
    const totalIncorrect = totalAnswered - totalCorrect;
    const accuracyPct = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;

    // Concepts to focus on = specific concepts (from LLM) where user got questions wrong
    const wrongRecords = questionHistory.filter(r => !r.correct);
    const focusConcepts = Array.from(new Set(wrongRecords.map(r => r.concept)));
    // Map each concept → its parent subtopic for display context
    const conceptSubtopicMap: Record<string, string> = {};
    wrongRecords.forEach(r => { if (!conceptSubtopicMap[r.concept]) conceptSubtopicMap[r.concept] = r.subtopic; });

    // Bloom level distribution of wrong answers
    const wrongBloomLevels = questionHistory
      .filter(r => !r.correct)
      .map(r => r.bloomLevel);
    const uniqueWrongBlooms = Array.from(new Set(wrongBloomLevels));

    const getPerformanceLabel = (pct: number) => {
      if (pct >= 80) return { label: 'Excellent', color: '#059669', bg: '#ECFDF5' };
      if (pct >= 60) return { label: 'Good', color: '#D97706', bg: '#FFFBEB' };
      if (pct >= 40) return { label: 'Needs Practice', color: '#DC2626', bg: '#FEF2F2' };
      return { label: 'Keep Studying', color: '#7C3AED', bg: '#F5F3FF' };
    };

    const perf = getPerformanceLabel(accuracyPct);

    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0F0C29 0%, #302B63 50%, #24243E 100%)', fontFamily: "'Inter', sans-serif", padding: '2rem 1rem' }}>
        {/* Header */}
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <div style={{
              width: '5rem', height: '5rem',
              background: 'linear-gradient(135deg, #7C3AED, #4F46E5)',
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1.25rem',
              boxShadow: '0 0 40px rgba(124, 58, 237, 0.5)',
            }}>
              <Trophy size={32} color="white" />
            </div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'white', marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>Quiz Complete!</h1>
            <p style={{ color: '#A5B4FC', fontSize: '1rem' }}>Topic: <strong style={{ color: 'white' }}>{inputTopic}</strong> · Subtopic: <strong style={{ color: 'white' }}>{selectedSubtopic || 'General'}</strong></p>
          </div>

          {/* Score Banner */}
          <div style={{
            background: perf.bg,
            border: `2px solid ${perf.color}30`,
            borderRadius: '16px',
            padding: '1.75rem',
            textAlign: 'center',
            marginBottom: '1.5rem',
            backdropFilter: 'blur(10px)',
          }}>
            <div style={{ fontSize: '4rem', fontWeight: 900, color: perf.color, lineHeight: 1 }}>{accuracyPct}%</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: perf.color, marginTop: '0.5rem' }}>{perf.label}</div>
            <div style={{ fontSize: '0.9rem', color: '#6B7280', marginTop: '0.25rem' }}>{totalCorrect} correct out of {totalAnswered} questions</div>
          </div>

          {/* Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            {[
              { icon: <CheckCircle size={22} color="#059669" />, label: 'Correct', value: totalCorrect, color: '#059669', bg: 'rgba(5,150,105,0.08)', border: 'rgba(5,150,105,0.25)' },
              { icon: <XCircle size={22} color="#DC2626" />, label: 'Incorrect', value: totalIncorrect, color: '#DC2626', bg: 'rgba(220,38,38,0.08)', border: 'rgba(220,38,38,0.25)' },
              { icon: <BarChart2 size={22} color="#7C3AED" />, label: 'Questions', value: totalAnswered, color: '#7C3AED', bg: 'rgba(124,58,237,0.08)', border: 'rgba(124,58,237,0.25)' },
            ].map(stat => (
              <div key={stat.label} style={{
                background: stat.bg,
                border: `1.5px solid ${stat.border}`,
                borderRadius: '14px',
                padding: '1.25rem',
                textAlign: 'center',
              }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.625rem' }}>{stat.icon}</div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: stat.color }}>{stat.value}</div>
                <div style={{ fontSize: '0.8rem', color: '#9CA3AF', fontWeight: 500 }}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Focus Areas */}
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1.5px solid rgba(255,255,255,0.1)',
            borderRadius: '16px',
            padding: '1.5rem',
            marginBottom: '1.5rem',
            backdropFilter: 'blur(10px)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={{ width: '2.25rem', height: '2.25rem', background: 'rgba(239,68,68,0.15)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Target size={18} color="#EF4444" />
              </div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white', margin: 0 }}>Concepts to Focus On</h2>
            </div>

            {focusConcepts.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(5,150,105,0.12)', border: '1px solid rgba(5,150,105,0.3)', borderRadius: '10px', padding: '1rem' }}>
                <CheckCircle size={20} color="#059669" />
                <p style={{ color: '#6EE7B7', fontSize: '0.9rem', margin: 0, fontWeight: 500 }}>Amazing! You answered all questions correctly. Keep it up!</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                {focusConcepts.map((concept, i) => {
                  const parentSubtopic = conceptSubtopicMap[concept] || selectedSubtopic || 'General';
                  return (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: '0.875rem',
                      background: 'rgba(239,68,68,0.08)',
                      border: '1px solid rgba(239,68,68,0.2)',
                      borderRadius: '10px',
                      padding: '0.875rem 1rem',
                    }}>
                      <div style={{
                        width: '1.75rem', height: '1.75rem', background: 'rgba(239,68,68,0.2)',
                        borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.75rem', fontWeight: 700, color: '#FCA5A5', flexShrink: 0
                      }}>{i + 1}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ color: 'white', fontWeight: 700, margin: 0, fontSize: '0.9rem' }}>{concept}</p>
                        <p style={{ color: '#9CA3AF', fontSize: '0.72rem', margin: '0.15rem 0 0' }}>
                          under <span style={{ color: '#A5B4FC' }}>{parentSubtopic}</span> · {inputTopic}
                        </p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                        <AlertTriangle size={14} color="#FCA5A5" />
                        <button
                          onClick={() => handleStartConceptQuiz(concept)}
                          style={{
                            background: 'linear-gradient(135deg, #7C3AED, #4F46E5)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '0.4rem 0.75rem',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            boxShadow: '0 2px 8px rgba(124,58,237,0.35)',
                            transition: 'opacity 0.15s ease',
                          }}
                          onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                        >
                          ▶ Give Quiz
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Bloom Level Weakness */}
          {uniqueWrongBlooms.length > 0 && (
            <div style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1.5px solid rgba(255,255,255,0.1)',
              borderRadius: '16px',
              padding: '1.5rem',
              marginBottom: '1.5rem',
              backdropFilter: 'blur(10px)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div style={{ width: '2.25rem', height: '2.25rem', background: 'rgba(124,58,237,0.15)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Brain size={18} color="#A78BFA" />
                </div>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white', margin: 0 }}>Cognitive Gap Areas</h2>
              </div>
              <p style={{ color: '#9CA3AF', fontSize: '0.85rem', marginBottom: '0.875rem' }}>These Bloom's Taxonomy levels need more attention:</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {uniqueWrongBlooms.map((bloom, i) => (
                  <span key={i} style={{
                    background: 'rgba(124,58,237,0.15)',
                    border: '1px solid rgba(124,58,237,0.3)',
                    color: '#C4B5FD',
                    padding: '0.4rem 0.875rem',
                    borderRadius: '9999px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                  }}>{bloom}</span>
                ))}
              </div>
            </div>
          )}

          {/* Question Breakdown */}
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1.5px solid rgba(255,255,255,0.1)',
            borderRadius: '16px',
            padding: '1.5rem',
            marginBottom: '2rem',
            backdropFilter: 'blur(10px)',
          }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white', marginBottom: '1rem' }}>Question Breakdown</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '280px', overflowY: 'auto' }}>
              {questionHistory.map((record, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  background: record.correct ? 'rgba(5,150,105,0.07)' : 'rgba(220,38,38,0.07)',
                  border: `1px solid ${record.correct ? 'rgba(5,150,105,0.2)' : 'rgba(220,38,38,0.2)'}`,
                  borderRadius: '8px',
                  padding: '0.75rem',
                }}>
                  <div style={{
                    width: '1.625rem', height: '1.625rem', background: record.correct ? 'rgba(5,150,105,0.2)' : 'rgba(220,38,38,0.2)',
                    borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.7rem', fontWeight: 700, color: record.correct ? '#6EE7B7' : '#FCA5A5', flexShrink: 0,
                  }}>Q{i + 1}</div>
                  <p style={{ color: '#D1D5DB', fontSize: '0.8rem', margin: 0, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{record.question}</p>
                  {record.correct
                    ? <CheckCircle size={16} color="#059669" style={{ flexShrink: 0 }} />
                    : <XCircle size={16} color="#DC2626" style={{ flexShrink: 0 }} />
                  }
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              onClick={handleRestartQuiz}
              style={{
                flex: 1, background: 'linear-gradient(135deg, #7C3AED, #4F46E5)',
                color: 'white', border: 'none', borderRadius: '12px',
                padding: '1rem', fontWeight: 700, fontSize: '1rem',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                boxShadow: '0 4px 24px rgba(124,58,237,0.4)',
              }}
            >
              <RotateCcw size={18} /> Try Again
            </button>
            <Link href="/dashboard" style={{
              flex: 1, background: 'rgba(255,255,255,0.08)',
              color: 'white', border: '1.5px solid rgba(255,255,255,0.15)', borderRadius: '12px',
              padding: '1rem', fontWeight: 700, fontSize: '1rem',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              textDecoration: 'none',
            }}>
              <Home size={18} /> Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleEndQuiz = () => {
    if (window.confirm("Are you sure you want to end the quiz? Your final score and estimated ability level will be saved.")) {
      proctoring.stopProctoring();
      setQuizState('summary');
    }
  };

  if (isLoading || !user || user.role !== 'student') {
    return (
      <div style={{ minHeight: 'calc(100vh - 4rem)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FAFAFC' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '2.5rem', height: '2.5rem', border: '3px solid #EDE9FE', borderTopColor: '#7C3AED', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
          <p style={{ color: '#6B7280', fontSize: '0.875rem', fontWeight: 500 }}>Loading Portal...</p>
        </div>
      </div>
    );
  }

  if (quizState === 'setup') {
    return (
      <div style={{ minHeight: 'calc(100vh - 4rem)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#FAFAFC', padding: '2rem', gap: '2rem' }}>
        <Image 
          src={setupImage} 
          alt="Quiz Setup" 
          style={{ maxWidth: '400px', width: '100%', height: 'auto' }} 
        />
        <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', width: '100%', maxWidth: '440px' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem', color: '#111827' }}>Quiz Setup</h2>
          <p style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '1.5rem' }}>Use AI to discover prerequisite knowledge graphs or jump straight in.</p>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>Topic</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input 
                type="text" 
                value={inputTopic} 
                onChange={e => setInputTopic(e.target.value)}
                style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '1rem', outline: 'none' }}
                placeholder="e.g. Quantum Computing"
              />
              <button 
                onClick={handleGenerateDag}
                disabled={isLoadingDag || !inputTopic}
                style={{ background: '#7C3AED', color: 'white', padding: '0 1rem', borderRadius: '8px', border: 'none', fontWeight: 600, cursor: isLoadingDag || !inputTopic ? 'not-allowed' : 'pointer', opacity: isLoadingDag || !inputTopic ? 0.7 : 1 }}
              >
                {isLoadingDag ? <Loader2 size={18} className="animate-spin" /> : 'Subtopics'}
              </button>
            </div>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>Focus Subtopic</label>
            {dagData && dagData.subtopics ? (
              <div>
                <select 
                  value={selectedSubtopic} 
                  onChange={e => setSelectedSubtopic(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '1rem', background: 'white', outline: 'none' }}
                >
                  {dagData.subtopics.map((st: any) => (
                    <option key={st.id || st.title} value={st.title}>{st.title} (Lvl {st.level})</option>
                  ))}
                </select>
                <p style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '0.5rem' }}>Options are generated dynamically using a prerequisite Knowledge DAG.</p>
              </div>
            ) : (
              <input 
                type="text" 
                value={selectedSubtopic} 
                onChange={e => setSelectedSubtopic(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '1rem', outline: 'none' }}
                placeholder="e.g. Arrays, Kinematics (Optional)"
              />
            )}
          </div>

          <button 
            onClick={startQuiz}
            disabled={!inputTopic || isLoadingDag}
            style={{ width: '100%', background: '#10B981', color: 'white', padding: '0.875rem', borderRadius: '8px', border: 'none', fontWeight: 700, fontSize: '1rem', cursor: !inputTopic || isLoadingDag ? 'not-allowed' : 'pointer', opacity: !inputTopic || isLoadingDag ? 0.5 : 1, marginBottom: '1rem' }}
          >
            Start Quiz
          </button>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem', color: '#10B981', fontSize: '0.75rem', fontWeight: 600 }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            Dynamic Concept Mastery Variants Active
          </div>
        </div>
      </div>
    );
  }

  if (quizState === 'summary') {
    return (
      <div style={{ minHeight: 'calc(100vh - 4rem)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#FAFAFC', padding: '2rem' }}>
        <div style={{ background: 'white', padding: '2.5rem', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.05)', width: '100%', maxWidth: '480px', textAlign: 'center', border: '1px solid #E5E7EB' }}>
          <div style={{ width: '4rem', height: '4rem', background: '#ECFDF5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', border: '2px solid #A7F3D0' }}>
            <CheckCircle size={32} color="#10B981" />
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem', color: '#111827', letterSpacing: '-0.02em' }}>Quiz Completed!</h2>
          <p style={{ fontSize: '0.9375rem', color: '#6B7280', marginBottom: '2rem' }}>Great job completing your adaptive learning session on <strong>{inputTopic}</strong>.</p>
          
          <div style={{ background: '#F9FAFB', borderRadius: '12px', padding: '1.5rem', border: '1px solid #F3F4F6', marginBottom: '2rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ textAlign: 'center', borderRight: '1px solid #E5E7EB' }}>
              <span style={{ display: 'block', fontSize: '0.75rem', color: '#9CA3AF', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Final Score</span>
              <span style={{ fontSize: '1.75rem', fontWeight: 800, color: '#111827' }}>{score} <span style={{ fontSize: '1rem', color: '#6B7280', fontWeight: 500 }}>/ {qIndex + (submitted ? 1 : 0)}</span></span>
            </div>
            <div style={{ textAlign: 'center' }}>
              <span style={{ display: 'block', fontSize: '0.75rem', color: '#9CA3AF', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Estimated Ability</span>
              <span style={{ fontSize: '1.75rem', fontWeight: 800, color: '#7C3AED' }}>{(theta > 0 ? '+' : '')}{theta.toFixed(2)}</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <button 
              onClick={() => {
                setQuizState('setup');
                setScore(0);
                setQIndex(0);
                setTheta(0.0);
                setQ(null);
                setBloomLevel("Remembering");
                setDifficulty(0.5);
              }}
              style={{ width: '100%', background: '#7C3AED', color: 'white', padding: '0.875rem', borderRadius: '8px', border: 'none', fontWeight: 700, fontSize: '0.9375rem', cursor: 'pointer', transition: 'all 0.15s ease' }}
              onMouseOver={(e) => e.currentTarget.style.background = '#6D28D9'}
              onMouseOut={(e) => e.currentTarget.style.background = '#7C3AED'}
            >
              Start Another Topic
            </button>
            <button 
              onClick={() => router.push('/dashboard')}
              style={{ width: '100%', background: 'transparent', color: '#4B5563', border: '1px solid #D1D5DB', padding: '0.875rem', borderRadius: '8px', fontWeight: 700, fontSize: '0.9375rem', cursor: 'pointer', transition: 'all 0.15s ease' }}
              onMouseOver={(e) => { e.currentTarget.style.background = '#F9FAFB'; e.currentTarget.style.borderColor = '#9CA3AF'; }}
              onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = '#D1D5DB'; }}
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Fix 1: Show restoring state while seeding violation count from backend
  if (browserMonitoring.isRestoringSession) {
    return (
      <div style={{ minHeight: 'calc(100vh - 4rem)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FAFAFC' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '2.5rem', height: '2.5rem', border: '3px solid #EDE9FE', borderTopColor: '#7C3AED', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
          <p style={{ color: '#6B7280', fontSize: '0.875rem', fontWeight: 500 }}>Restoring session integrity state...</p>
        </div>
      </div>
    );
  }

  if (genError) {
    return (
      <div style={{ minHeight: 'calc(100vh - 4rem)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FAFAFC', padding: '1rem' }}>
        <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)', maxWidth: '28rem', width: '100%', textAlign: 'center' }}>
          <div style={{ width: '3rem', height: '3rem', background: '#FEE2E2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            <AlertCircle style={{ color: '#DC2626', width: '1.5rem', height: '1.5rem' }} />
          </div>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#111827', marginBottom: '0.5rem' }}>Failed to Load Quiz</h3>
          <p style={{ color: '#6B7280', fontSize: '0.875rem', marginBottom: '1.5rem', lineHeight: '1.5' }}>
            {genError}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <button
              onClick={() => fetchNextQuestion(theta)}
              style={{ background: '#7C3AED', color: 'white', border: 'none', padding: '0.75rem', borderRadius: '8px', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', transition: 'background-color 0.2s' }}
              onMouseOver={(e) => (e.currentTarget.style.background = '#6D28D9')}
              onMouseOut={(e) => (e.currentTarget.style.background = '#7C3AED')}
            >
              Retry Loading Question
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              style={{ background: 'transparent', color: '#4B5563', border: '1px solid #D1D5DB', padding: '0.75rem', borderRadius: '8px', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseOver={(e) => { e.currentTarget.style.background = '#F9FAFB'; e.currentTarget.style.borderColor = '#9CA3AF'; }}
              onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = '#D1D5DB'; }}
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isGenLoading || !q) {
    return (
      <div style={{ minHeight: 'calc(100vh - 4rem)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FAFAFC' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '2.5rem', height: '2.5rem', border: '3px solid #EDE9FE', borderTopColor: '#7C3AED', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
          <p style={{ color: '#6B7280', fontSize: '0.875rem', fontWeight: 500 }}>
            Generating next adaptive question...
          </p>
        </div>
      </div>
    );
  }

  const timerColor = timer > 20 ? '#059669' : timer > 10 ? '#D97706' : '#DC2626';
  const canEndTest = qIndex >= 9; // After 10 questions (0-indexed: question 10 means index 9+)

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
          {/* End Test button — enabled only after 10 questions */}
          <button
            onClick={handleEndTest}
            disabled={!canEndTest}
            title={canEndTest ? 'End test and see results' : `Complete at least ${10 - (qIndex + 1) + (submitted ? 1 : 0)} more question(s) to end`}
            style={{
              background: canEndTest ? '#DC2626' : '#E5E7EB',
              color: canEndTest ? 'white' : '#9CA3AF',
              border: 'none',
              borderRadius: '8px',
              padding: '0.45rem 0.9rem',
              fontSize: '0.8125rem',
              fontWeight: 700,
              cursor: canEndTest ? 'pointer' : 'not-allowed',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s ease',
              boxShadow: canEndTest ? '0 2px 8px rgba(220,38,38,0.3)' : 'none',
            }}
          >
            {canEndTest ? '🏁 End Test' : `End Test (${Math.max(0, 10 - (qIndex + 1))} more)`}
          </button>
        </div>
      </div>

      {/* ─── MAIN CONTENT ─── */}
      <div style={{ maxWidth: '56rem', margin: '0 auto', padding: '2rem 1.5rem', display: 'grid', gridTemplateColumns: '1fr 280px', gap: '1.5rem', alignItems: 'start' }}>

        {/* Left: Question */}
        <div>
          {/* Question card with Copy/Paste Protection */}
          <div 
            className="card" 
            {...browserMonitoring.copyPreventionHandlers}
            style={{ marginBottom: '1rem', background: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', userSelect: 'none', WebkitUserSelect: 'none' }}
          >

            {/* Card header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                <span style={{ background: `${q.topicColor}15`, color: q.topicColor, padding: '0.3rem 0.75rem', borderRadius: '9999px', fontSize: '0.8125rem', fontWeight: 600 }}>
                  {q.topic}
                </span>
                {q.isVariant && (
                  <span style={{ 
                    background: '#ECFDF5', 
                    color: '#10B981', 
                    border: '1.5px solid #A7F3D0',
                    padding: '0.25rem 0.65rem', 
                    borderRadius: '9999px', 
                    fontSize: '0.8125rem', 
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    boxShadow: '0 2px 4px rgba(16, 185, 129, 0.05)'
                  }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    </svg>
                    Concept Mastery Variant
                  </span>
                )}
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
              <div style={{ display: 'flex', gap: '0.75rem' }}>
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
                  <button onClick={handleNext}
                    style={{ background: '#7C3AED', color: 'white', border: 'none', borderRadius: '10px', padding: '0.75rem 1.5rem', fontWeight: 700, fontSize: '0.9375rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    Next Question <ChevronRight size={16} />
                  </button>
                )}
                
                <button
                  onClick={handleEndQuiz}
                  style={{
                    background: '#FEF2F2',
                    color: '#DC2626',
                    border: '1px solid #FCA5A5',
                    borderRadius: '10px',
                    padding: '0.75rem 1.5rem',
                    fontWeight: 700,
                    fontSize: '0.9375rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = '#FEE2E2';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = '#FEF2F2';
                  }}
                >
                  End Quiz
                </button>
              </div>
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
                <>
                  <p style={{ fontSize: '0.9375rem', color: (feedback?.correct || selected === q.correct) ? '#047857' : '#991B1B', lineHeight: 1.65, margin: 0 }}>{aiExplanation || q.explanation}</p>
                  {aiDiagramUrl && (
                    <button
                      onClick={() => setShowSidebarDiagram(true)}
                      style={{
                        marginTop: '1rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        background: '#EDE9FE',
                        border: '1px solid #C084FC',
                        borderRadius: '8px',
                        padding: '0.4rem 0.8rem',
                        fontSize: '0.8125rem',
                        fontWeight: 600,
                        color: '#6B21A8',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      🖼️ View Concept Diagram
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Right: Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'sticky', top: '5rem' }}>

          {showSidebarDiagram && aiDiagramUrl ? (
            <div className="card" style={{ border: '1.5px solid #E5E7EB', padding: '1.25rem', background: 'white', borderRadius: '12px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #F3F4F6', paddingBottom: '0.5rem' }}>
                <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#111827' }}>Visual Explanation</span>
                <button 
                  onClick={() => setShowSidebarDiagram(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: '1.5rem', lineHeight: '1rem', fontWeight: 'bold' }}
                >
                  ×
                </button>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', background: '#F9FAFB', borderRadius: '8px', padding: '0.75rem', border: '1px dashed #E5E7EB' }}>
                <img src={aiDiagramUrl} alt="Visual Explanation Diagram" style={{ maxWidth: '100%', height: 'auto', borderRadius: '4px' }} />
              </div>
            </div>
          ) : (
            <>
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
            </>
          )}

          {/* AI Proctoring Card */}
          <div className="card" style={{ padding: '1.25rem', background: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: proctoring.violations.total > 0 ? '1.5px solid #FCA5A5' : '1px solid #E5E7EB' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.875rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Shield size={18} color={proctoring.isProctoring ? '#059669' : '#D97706'} />
                <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#111827' }}>AI Proctoring</span>
              </div>
              <span style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '0.15rem 0.5rem',
                borderRadius: '9999px',
                background: proctoring.isProctoring ? '#ECFDF5' : '#FEF3C7',
                color: proctoring.isProctoring ? '#059669' : '#D97706'
              }}>
                {proctoring.isProctoring ? 'Active' : 'Standby'}
              </span>
            </div>

            {/* Webcam video feed preview */}
            <div style={{ position: 'relative', width: '100%', height: '110px', borderRadius: '8px', overflow: 'hidden', background: '#111827', marginBottom: '0.875rem' }}>
              <video
                ref={proctoring.videoRef}
                autoPlay
                playsInline
                muted
                style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
              />
              {!proctoring.permissionGranted && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(17, 24, 39, 0.85)', padding: '0.5rem', textAlign: 'center' }}>
                  <Camera size={20} color="#9CA3AF" />
                  <span style={{ fontSize: '0.75rem', color: '#D1D5DB', marginTop: '0.25rem' }}>
                    {proctoring.cameraError || 'Requesting Camera...'}
                  </span>
                </div>
              )}
              {proctoring.isProctoring && (
                <div style={{ position: 'absolute', top: '6px', left: '6px', background: 'rgba(0, 0, 0, 0.65)', padding: '2px 6px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: proctoring.faceDetected ? '#10B981' : '#EF4444' }} />
                  <span style={{ fontSize: '0.6875rem', color: 'white', fontWeight: 600 }}>
                    {proctoring.faceDetected ? 'Face Detected' : 'No Face'}
                  </span>
                </div>
              )}
            </div>



            {/* Micro Indicators: Violations */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {/* Total Integrity Flags */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.375rem', borderTop: '1px solid #F3F4F6' }}>
                <span style={{ fontSize: '0.75rem', color: '#6B7280', fontWeight: 500 }}>Integrity Flags</span>
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  padding: '0.1rem 0.5rem',
                  borderRadius: '9999px',
                  background: proctoring.violations.total > 0 ? '#FEE2E2' : '#F3F4F6',
                  color: proctoring.violations.total > 0 ? '#DC2626' : '#6B7280'
                }}>
                  {proctoring.violations.total}
                </span>
              </div>

              {/* Breakdown metrics */}
              {proctoring.violations.total > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-around', background: '#FAFAFA', padding: '0.375rem', borderRadius: '6px', fontSize: '0.6875rem', color: '#4B5563' }}>
                  <span>Face: {proctoring.violations.noFaceCount}</span>
                  <span>Tab: {proctoring.violations.tabSwitchCount}</span>
                </div>
              )}

              {/* Warning Alert Banner */}
              {proctoring.lastViolationMessage && proctoring.violations.total > 0 && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.375rem', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '6px', padding: '0.5rem', marginTop: '0.25rem' }}>
                  <AlertCircle size={14} color="#DC2626" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span style={{ fontSize: '0.6875rem', color: '#991B1B', lineHeight: 1.3, fontWeight: 500 }}>
                    {proctoring.lastViolationMessage}
                  </span>
                </div>
              )}
            </div>
          </div>


          {/* Quit link */}
          <Link href="/dashboard" style={{ display: 'block', textAlign: 'center', fontSize: '0.875rem', color: '#9CA3AF', textDecoration: 'none', padding: '0.5rem' }}>
            ← Back to Dashboard
          </Link>
        </div>
      </div>

      {/* Browser Monitoring Warning & Lockdown Modal */}
      <WarningModal
        isVisible={browserMonitoring.showWarningModal || isSessionLocked}
        isLocked={isSessionLocked}
        lastViolation={browserMonitoring.lastViolation || { type: 'TAB_SWITCH', message: 'Maximum integrity violations exceeded.', timestamp: new Date().toISOString() }}
        warningsCount={browserMonitoring.warningsCount}
        maxWarnings={2}
        onDismiss={isSessionLocked ? () => {} : browserMonitoring.dismissWarning}
        onEndQuiz={() => router.push('/dashboard')}
      />
    </div>
  );
}


export default function QuizPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: 'calc(100vh - 4rem)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FAFAFC' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '2.5rem', height: '2.5rem', border: '3px solid #EDE9FE', borderTopColor: '#7C3AED', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
          <p style={{ color: '#6B7280', fontSize: '0.875rem', fontWeight: 500 }}>Loading Quiz...</p>
        </div>
      </div>
    }>
      <QuizContent />
    </Suspense>
  );
}

