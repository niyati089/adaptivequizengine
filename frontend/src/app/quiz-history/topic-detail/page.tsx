"use client";

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getQuizHistory } from '@/services/quizService';
import Link from 'next/link';
import { ChevronDown, ChevronUp, CheckCircle, XCircle, TrendingUp, Calendar, ArrowLeft, BarChart3, Award, AlertCircle } from 'lucide-react';

interface Question {
  id: number;
  question_text: string;
  options: Record<string, string>;
  selected_option: string;
  correct_option: string;
  is_correct: boolean;
  explanation: string;
  misconception: string | null;
  theta_before: number;
  theta_after: number;
  bloom_level: string;
  timestamp: string;
}

interface SubtopicData {
  questions: Question[];
  stats: {
    total: number;
    correct: number;
    accuracy: number;
  };
}

interface TopicData {
  subtopics: Record<string, SubtopicData>;
  stats: {
    total_questions: number;
    correct: number;
    accuracy: number;
  };
}

interface HistoryData {
  user_id: number;
  user_name: string;
  total_attempts: number;
  history: Record<string, TopicData>;
}

export default function TopicDetailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { api } = useAuth();
  
  const topicName = searchParams.get('topic');
  const [history, setHistory] = useState<HistoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [expandedSubtopic, setExpandedSubtopic] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'correct' | 'incorrect'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'accuracy'>('date');

  useEffect(() => {
    if (!topicName) {
      setError('No topic selected');
      setLoading(false);
      return;
    }

    const fetchHistory = async () => {
      try {
        if (!api) {
          setError('API instance not available');
          setLoading(false);
          return;
        }
        
        const data = await getQuizHistory(api);
        setHistory(data);
        setError(null);
      } catch (error: any) {
        setError(error?.response?.data?.detail || error?.message || 'Failed to load quiz history');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [api, topicName]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 80) return { bg: '#ECFDF5', text: '#059669', label: 'Excellent' };
    if (accuracy >= 60) return { bg: '#FEF3C7', text: '#D97706', label: 'Good' };
    return { bg: '#FEE2E2', text: '#DC2626', label: 'Needs Work' };
  };

  const getThetaChange = (before: number, after: number) => {
    const change = after - before;
    if (change > 0) return { text: `+${change.toFixed(2)}`, color: '#059669' };
    if (change < 0) return { text: `${change.toFixed(2)}`, color: '#DC2626' };
    return { text: '0.00', color: '#6B7280' };
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1rem', color: '#6B7280', marginBottom: '1rem' }}>Loading topic analysis...</div>
          <div style={{ width: '40px', height: '40px', border: '3px solid #E5E7EB', borderTop: '3px solid #7C3AED', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
        </div>
      </div>
    );
  }

  if (error || !history || !topicName || !history.history[topicName]) {
    return (
      <div style={{ minHeight: '100vh', background: '#F9FAFB', padding: '2rem 1.5rem' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <Link href="/quiz-history" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#7C3AED', marginBottom: '2rem', textDecoration: 'none' }}>
            <ArrowLeft size={16} /> Back to Quiz History
          </Link>
          <div style={{ background: '#FEE2E2', border: '1px solid #FECACA', borderRadius: '12px', padding: '2rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1.125rem', color: '#DC2626', fontWeight: 600, marginBottom: '0.5rem' }}>Error Loading Topic</div>
            <div style={{ fontSize: '0.9375rem', color: '#991B1B', marginBottom: '1.5rem' }}>{error || 'Topic not found'}</div>
          </div>
        </div>
      </div>
    );
  }

  const topicData = history.history[topicName];
  const allQuestions = Object.values(topicData.subtopics).flatMap(s => s.questions);
  
  let filteredQuestions = allQuestions;
  if (filterStatus === 'correct') {
    filteredQuestions = allQuestions.filter(q => q.is_correct);
  } else if (filterStatus === 'incorrect') {
    filteredQuestions = allQuestions.filter(q => !q.is_correct);
  }

  if (sortBy === 'accuracy') {
    filteredQuestions = [...filteredQuestions].sort((a, b) => {
      const accA = a.is_correct ? 1 : 0;
      const accB = b.is_correct ? 1 : 0;
      return accB - accA;
    });
  } else {
    filteredQuestions = [...filteredQuestions].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  const accuracyColor = getAccuracyColor(topicData.stats.accuracy);
  const incorrectCount = topicData.stats.total_questions - topicData.stats.correct;

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', fontFamily: "'Inter', sans-serif", padding: '2rem 1.5rem' }}>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        {/* Back Button */}
        <Link href="/quiz-history" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#7C3AED', marginBottom: '1.5rem', textDecoration: 'none', fontSize: '0.9375rem', fontWeight: 500 }}>
          <ArrowLeft size={16} /> Back to Quiz History
        </Link>

        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 900, color: '#111827', margin: '0 0 0.5rem 0' }}>{topicName} Analysis</h1>
          <p style={{ fontSize: '1rem', color: '#6B7280', margin: 0 }}>Detailed question-wise analysis for your {topicName} attempts</p>
        </div>

        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <BarChart3 size={20} color="#7C3AED" />
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#6B7280' }}>Total Questions</span>
            </div>
            <div style={{ fontSize: '1.875rem', fontWeight: 900, color: '#111827' }}>{topicData.stats.total_questions}</div>
          </div>
          <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <CheckCircle size={20} color="#059669" />
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#6B7280' }}>Correct</span>
            </div>
            <div style={{ fontSize: '1.875rem', fontWeight: 900, color: '#111827' }}>{topicData.stats.correct}</div>
          </div>
          <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <XCircle size={20} color="#DC2626" />
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#6B7280' }}>Incorrect</span>
            </div>
            <div style={{ fontSize: '1.875rem', fontWeight: 900, color: '#111827' }}>{incorrectCount}</div>
          </div>
          <div style={{ background: accuracyColor.bg, padding: '1.5rem', borderRadius: '12px', border: `1px solid ${accuracyColor.text}33`, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <Award size={20} color={accuracyColor.text} />
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#6B7280' }}>Accuracy</span>
            </div>
            <div style={{ fontSize: '1.875rem', fontWeight: 900, color: accuracyColor.text }}>{topicData.stats.accuracy.toFixed(1)}%</div>
          </div>
        </div>

        {/* Subtopic Breakdown */}
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #E5E7EB', overflow: 'hidden', marginBottom: '2rem' }}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid #E5E7EB' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#111827', margin: 0 }}>By Subtopic</h2>
          </div>
          <div style={{ padding: '1rem' }}>
            {Object.entries(topicData.subtopics).map(([subtopic, subtopicData]) => {
              const subtopicAccuracy = getAccuracyColor(subtopicData.stats.accuracy);
              return (
                <div key={subtopic} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', borderBottom: '1px solid #E5E7EB', cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = '#F9FAFB'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                  <div>
                    <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#111827' }}>{subtopic}</div>
                    <div style={{ fontSize: '0.8125rem', color: '#6B7280' }}>{subtopicData.stats.correct}/{subtopicData.stats.total} correct</div>
                  </div>
                  <div style={{ background: subtopicAccuracy.bg, color: subtopicAccuracy.text, padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.8125rem', fontWeight: 600 }}>
                    {subtopicData.stats.accuracy.toFixed(1)}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Filters and Sorting */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div>
            <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#6B7280', marginRight: '0.5rem' }}>Filter:</label>
            <select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value as any)}
              style={{ padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #D1D5DB', fontSize: '0.875rem', background: 'white', cursor: 'pointer' }}
            >
              <option value="all">All Questions ({allQuestions.length})</option>
              <option value="correct">Correct Only ({allQuestions.filter(q => q.is_correct).length})</option>
              <option value="incorrect">Incorrect Only ({allQuestions.filter(q => !q.is_correct).length})</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#6B7280', marginRight: '0.5rem' }}>Sort:</label>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value as any)}
              style={{ padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #D1D5DB', fontSize: '0.875rem', background: 'white', cursor: 'pointer' }}
            >
              <option value="date">Newest First</option>
              <option value="accuracy">Accuracy</option>
            </select>
          </div>
        </div>

        {/* Questions List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredQuestions.length === 0 ? (
            <div style={{ padding: '2rem', background: 'white', borderRadius: '12px', border: '1px solid #E5E7EB', textAlign: 'center' }}>
              <AlertCircle size={24} color="#9CA3AF" style={{ margin: '0 auto 1rem' }} />
              <div style={{ fontSize: '1rem', color: '#6B7280', fontWeight: 500 }}>No questions found</div>
            </div>
          ) : (
            filteredQuestions.map((question, idx) => (
              <div
                key={question.id}
                onClick={() => setSelectedQuestion(question)}
                style={{
                  background: 'white',
                  borderRadius: '12px',
                  border: '1px solid #E5E7EB',
                  padding: '1.5rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.12)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                  <div style={{ marginTop: '0.25rem', flexShrink: 0 }}>
                    {question.is_correct ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '50%', background: '#ECFDF5', border: '2px solid #059669' }}>
                        <CheckCircle size={18} color="#059669" />
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '50%', background: '#FEE2E2', border: '2px solid #DC2626' }}>
                        <XCircle size={18} color="#DC2626" />
                      </div>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '0.5rem' }}>
                      <p style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#111827', margin: 0, lineHeight: '1.4' }}>{question.question_text}</p>
                      <div style={{ flexShrink: 0, background: question.is_correct ? '#ECFDF5' : '#FEE2E2', color: question.is_correct ? '#059669' : '#DC2626', padding: '0.25rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600 }}>
                        {question.is_correct ? 'Correct' : 'Incorrect'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8125rem', color: '#6B7280', flexWrap: 'wrap' }}>
                      <span>Your: <strong style={{ color: question.is_correct ? '#059669' : '#DC2626' }}>{question.selected_option}</strong></span>
                      {!question.is_correct && <span>Correct: <strong style={{ color: '#059669' }}>{question.correct_option}</strong></span>}
                      {question.bloom_level && <span>Level: <strong>{question.bloom_level}</strong></span>}
                      <span style={{ color: getThetaChange(question.theta_before, question.theta_after).color }}>θ: {getThetaChange(question.theta_before, question.theta_after).text}</span>
                      <span>{formatDate(question.timestamp)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Question Detail Modal */}
      {selectedQuestion && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
          onClick={() => setSelectedQuestion(null)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '16px',
              padding: '2rem',
              maxWidth: '600px',
              width: '100%',
              maxHeight: '80vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px rgba(0, 0, 0, 0.15)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedQuestion(null)}
              style={{
                position: 'absolute',
                top: '1.5rem',
                right: '1.5rem',
                background: '#F3F4F6',
                border: 'none',
                borderRadius: '8px',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: '#6B7280',
              }}
            >
              ×
            </button>

            {/* Question Text */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                {selectedQuestion.is_correct ? (
                  <CheckCircle size={24} color="#059669" />
                ) : (
                  <XCircle size={24} color="#DC2626" />
                )}
                <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: selectedQuestion.is_correct ? '#059669' : '#DC2626' }}>
                  {selectedQuestion.is_correct ? 'Correct Answer' : 'Incorrect Answer'}
                </span>
              </div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', margin: '0 0 1rem 0' }}>
                {selectedQuestion.question_text}
              </h2>
            </div>

            {/* Answer Options */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#6B7280', marginBottom: '0.75rem', textTransform: 'uppercase' }}>Options</h3>
              {Object.entries(selectedQuestion.options).map(([key, value]) => {
                const isSelected = key === selectedQuestion.selected_option;
                const isCorrect = key === selectedQuestion.correct_option;
                let bgColor = '#F9FAFB';
                let borderColor = '#E5E7EB';

                if (isCorrect) {
                  bgColor = '#ECFDF5';
                  borderColor = '#059669';
                } else if (isSelected && !isCorrect) {
                  bgColor = '#FEE2E2';
                  borderColor = '#DC2626';
                }

                return (
                  <div
                    key={key}
                    style={{
                      padding: '1rem',
                      marginBottom: '0.75rem',
                      background: bgColor,
                      border: `2px solid ${borderColor}`,
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '1rem',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '32px',
                        height: '32px',
                        background: 'white',
                        border: `2px solid ${borderColor}`,
                        borderRadius: '6px',
                        fontWeight: 600,
                        color: '#111827',
                        fontSize: '0.9375rem',
                        flexShrink: 0,
                      }}
                    >
                      {key}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, color: '#111827', fontSize: '0.9375rem' }}>{value}</p>
                      {isCorrect && <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8125rem', color: '#059669', fontWeight: 500 }}>✓ Correct answer</p>}
                      {isSelected && !isCorrect && <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8125rem', color: '#DC2626', fontWeight: 500 }}>✗ Your answer</p>}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Explanation */}
            {selectedQuestion.explanation && (
              <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#F0F9FF', borderLeft: '4px solid #0284C7', borderRadius: '4px' }}>
                <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#0284C7', margin: '0 0 0.5rem 0' }}>Explanation</h3>
                <p style={{ margin: 0, fontSize: '0.9375rem', color: '#1E40AF', lineHeight: '1.5' }}>
                  {selectedQuestion.explanation}
                </p>
              </div>
            )}

            {/* Misconception */}
            {selectedQuestion.misconception && !selectedQuestion.is_correct && (
              <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#FEF3C7', borderLeft: '4px solid #D97706', borderRadius: '4px' }}>
                <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#D97706', margin: '0 0 0.5rem 0' }}>Misconception Detected</h3>
                <p style={{ margin: 0, fontSize: '0.9375rem', color: '#92400E', lineHeight: '1.5' }}>
                  {selectedQuestion.misconception}
                </p>
              </div>
            )}

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', padding: '1rem', background: '#F9FAFB', borderRadius: '8px' }}>
              <div>
                <div style={{ fontSize: '0.8125rem', color: '#6B7280', marginBottom: '0.5rem' }}>Ability Before (θ)</div>
                <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#111827' }}>{selectedQuestion.theta_before.toFixed(2)}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.8125rem', color: '#6B7280', marginBottom: '0.5rem' }}>Ability After (θ)</div>
                <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#111827' }}>{selectedQuestion.theta_after.toFixed(2)}</div>
              </div>
              {selectedQuestion.bloom_level && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <div style={{ fontSize: '0.8125rem', color: '#6B7280', marginBottom: '0.5rem' }}>Bloom's Level</div>
                  <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#7C3AED', textTransform: 'capitalize' }}>
                    {selectedQuestion.bloom_level}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
