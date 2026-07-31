"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getQuizHistory } from '@/services/quizService';
import Link from 'next/link';
import { ChevronDown, CheckCircle, XCircle, BookOpen, TrendingUp, ArrowLeft } from 'lucide-react';

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

export default function QuizHistoryPage() {
  const { api } = useAuth();
  const [history, setHistory] = useState<HistoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        if (!api) {
          console.error('❌ API not available');
          setError('API instance not available. Please try logging in again.');
          setLoading(false);
          return;
        }
        
        console.log('📊 Fetching quiz history...');
        const data = await getQuizHistory(api);
        
        console.log('✓ Quiz history fetched:', {
          user: data.user_name,
          total_attempts: data.total_attempts,
          topics: Object.keys(data.history).length
        });
        
        setHistory(data);
        setError(null);
      } catch (error: any) {
        console.error('❌ Failed to fetch quiz history:', error);
        
        const errorMsg = error?.response?.data?.detail || 
                        error?.message || 
                        'Failed to load quiz history';
        
        setError(errorMsg);
        setHistory(null);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [api]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 80) return { bg: '#ECFDF5', text: '#059669', label: 'Excellent' };
    if (accuracy >= 60) return { bg: '#FEF3C7', text: '#D97706', label: 'Good' };
    return { bg: '#FEE2E2', text: '#DC2626', label: 'Needs Work' };
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1rem', color: '#6B7280', marginBottom: '1rem' }}>Loading your quiz history...</div>
          <div style={{ width: '40px', height: '40px', border: '3px solid #E5E7EB', borderTop: '3px solid #7C3AED', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', background: '#F9FAFB', padding: '2rem 1.5rem' }}>
        <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
          <Link href="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#7C3AED', marginBottom: '2rem', textDecoration: 'none' }}>
            <ArrowLeft size={16} /> Back to Dashboard
          </Link>
          <div style={{ background: '#FEE2E2', border: '1px solid #FECACA', borderRadius: '12px', padding: '2rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1.125rem', color: '#DC2626', fontWeight: 600, marginBottom: '0.5rem' }}>Error Loading Quiz History</div>
            <div style={{ fontSize: '0.9375rem', color: '#991B1B', marginBottom: '1.5rem' }}>{error}</div>
            <button
              onClick={() => window.location.reload()}
              style={{ background: '#DC2626', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!history) {
    return (
      <div style={{ minHeight: '100vh', background: '#F9FAFB', padding: '2rem 1.5rem' }}>
        <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
          <Link href="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#7C3AED', marginBottom: '2rem', textDecoration: 'none' }}>
            <ArrowLeft size={16} /> Back to Dashboard
          </Link>
          <div style={{ textAlign: 'center', padding: '3rem 1.5rem', background: 'white', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
            <div style={{ fontSize: '1.125rem', color: '#6B7280', marginBottom: '0.5rem' }}>No quiz history yet</div>
            <div style={{ fontSize: '0.9375rem', color: '#9CA3AF' }}>Start taking quizzes to see your progress here!</div>
            <Link href="/quiz" style={{ display: 'inline-block', marginTop: '1.5rem', padding: '0.75rem 1.5rem', background: '#7C3AED', color: 'white', borderRadius: '8px', textDecoration: 'none', fontWeight: 500 }}>
              Start a Quiz
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', fontFamily: "'Inter', sans-serif", padding: '2rem 1.5rem' }}>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <Link href="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#7C3AED', marginBottom: '1rem', textDecoration: 'none', fontSize: '0.9375rem', fontWeight: 500 }}>
            <ArrowLeft size={16} /> Back to Dashboard
          </Link>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, color: '#111827', marginBottom: '0.5rem' }}>Quiz History</h1>
          <p style={{ fontSize: '1rem', color: '#6B7280' }}>Review all your attempted questions and track your progress</p>
        </div>

        {/* Summary Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <BookOpen size={20} color="#7C3AED" />
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#6B7280' }}>Total Attempts</span>
            </div>
            <div style={{ fontSize: '1.875rem', fontWeight: 900, color: '#111827' }}>{history.total_attempts}</div>
          </div>
          <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <CheckCircle size={20} color="#059669" />
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#6B7280' }}>Topics Covered</span>
            </div>
            <div style={{ fontSize: '1.875rem', fontWeight: 900, color: '#111827' }}>{Object.keys(history.history).length}</div>
          </div>
          <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <TrendingUp size={20} color="#D97706" />
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#6B7280' }}>Overall Accuracy</span>
            </div>
            <div style={{ fontSize: '1.875rem', fontWeight: 900, color: '#111827' }}>
              {(() => {
                let total = 0, correct = 0;
                for (const topic of Object.values(history.history)) {
                  total += topic.stats.total_questions;
                  correct += topic.stats.correct;
                }
                return `${total > 0 ? Math.round((correct / total) * 100) : 0}%`;
              })()}
            </div>
          </div>
        </div>

        {/* Topics List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {Object.entries(history.history).map(([topic, topicData]) => {
            const accuracyColor = getAccuracyColor(topicData.stats.accuracy);

            return (
              <div key={topic} style={{ background: 'white', borderRadius: '12px', border: '1px solid #E5E7EB', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                {/* Topic Header - Click to view details */}
                <div
                  onClick={() => {
                    const params = new URLSearchParams({ topic });
                    window.location.href = `/quiz-history/topic-detail?${params}`;
                  }}
                  style={{
                    width: '100%',
                    padding: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    background: 'white',
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#F9FAFB'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, textAlign: 'left' }}>
                    <BookOpen size={24} color="#7C3AED" />
                    <div>
                      <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#111827', margin: 0, marginBottom: '0.25rem' }}>{topic}</h2>
                      <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8125rem', color: '#6B7280' }}>
                        <span>{topicData.stats.total_questions} questions</span>
                        <span>{topicData.stats.correct} correct</span>
                        <span style={{ color: accuracyColor.text, fontWeight: 600 }}>{topicData.stats.accuracy.toFixed(1)}% accuracy</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ background: accuracyColor.bg, color: accuracyColor.text, padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.8125rem', fontWeight: 600 }}>
                      {accuracyColor.label}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '6px', background: '#F3F4F6' }}>
                      <ChevronDown size={20} color="#6B7280" style={{ transform: 'rotate(-90deg)' }} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
