"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Users, BookOpen, AlertTriangle, TrendingUp, ChevronRight, ArrowUp, ArrowDown, ShieldAlert, RotateCcw, Loader2, RefreshCw } from 'lucide-react';
import { getEducatorDashboard, getReTeachingRecommendations } from '@/services/quizService';
import { resetSessionProctoring } from '@/services/proctoringService';

const barColor = (score: number) => score >= 70 ? '#059669' : score >= 50 ? '#D97706' : '#EF4444';

export default function EducatorPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [selectedTopic, setSelectedTopic] = useState("Computer Science");
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [resettingSessionId, setResettingSessionId] = useState<string | null>(null);

  // AI Re-teaching states
  const [reTeachingText, setReTeachingText] = useState("");
  const [isGenLoading, setIsGenLoading] = useState(false);

  // Route protection
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
      } else if (user.role !== 'teacher') {
        router.push('/dashboard');
      }
    }
  }, [user, authLoading, router]);

  const fetchDashboardData = async (topicName: string) => {
    setIsLoading(true);
    try {
      const data = await getEducatorDashboard(topicName);
      setDashboardData(data);
      // Reset re-teaching when topic changes
      setReTeachingText("");
    } catch (e) {
      console.error("Failed to fetch educator dashboard data:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFetchReTeaching = async () => {
    setIsGenLoading(true);
    try {
      const data = await getReTeachingRecommendations(selectedTopic);
      setReTeachingText(data.recommendation);
    } catch (e) {
      console.error("Failed to fetch re-teaching recommendations:", e);
      setReTeachingText("Failed to generate AI plans. Please check backend Groq API configuration.");
    } finally {
      setIsGenLoading(false);
    }
  };

  const handleResetSession = async (sessionId: string) => {
    setResettingSessionId(sessionId);
    try {
      await resetSessionProctoring(sessionId);
      alert("Successfully reset proctoring flags and unlocked this student's session.");
      await fetchDashboardData(selectedTopic);
    } catch (err: any) {
      alert(err?.response?.data?.detail || "Failed to reset session.");
    } finally {
      setResettingSessionId(null);
    }
  };

  useEffect(() => {
    if (user && user.role === 'teacher') {
      fetchDashboardData(selectedTopic);
    }
  }, [user]);

  // Markdown renderer helper
  const renderMarkdown = (text: string) => {
    if (!text) return null;
    return text.split('\n').map((line, idx) => {
      if (line.startsWith('### ')) {
        return <h3 key={idx} style={{ fontSize: '1.125rem', fontWeight: 700, margin: '1rem 0 0.5rem', color: '#111827' }}>{line.replace('### ', '')}</h3>;
      }
      if (line.startsWith('## ')) {
        return <h2 key={idx} style={{ fontSize: '1.25rem', fontWeight: 800, margin: '1.2rem 0 0.6rem', color: '#111827' }}>{line.replace('## ', '')}</h2>;
      }
      if (line.startsWith('# ')) {
        return <h1 key={idx} style={{ fontSize: '1.5rem', fontWeight: 900, margin: '1.5rem 0 0.8rem', color: '#111827' }}>{line.replace('# ', '')}</h1>;
      }
      if (line.startsWith('- ') || line.startsWith('* ')) {
        return <li key={idx} style={{ marginLeft: '1.5rem', fontSize: '0.875rem', color: '#374151', margin: '0.25rem 0' }}>{line.substring(2)}</li>;
      }
      if (/^\d+\.\s/.test(line)) {
        return <div key={idx} style={{ marginLeft: '1rem', fontSize: '0.875rem', color: '#374151', margin: '0.35rem 0', fontWeight: 500 }}>{line}</div>;
      }
      if (line.trim() === '') {
        return <div key={idx} style={{ height: '0.5rem' }} />;
      }
      return <p key={idx} style={{ fontSize: '0.875rem', color: '#374151', margin: '0.5rem 0', lineHeight: 1.5 }}>{line}</p>;
    });
  };

  if (authLoading || !user || user.role !== 'teacher') {
    return (
      <div style={{ minHeight: 'calc(100vh - 4rem)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FAFAFC' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '2.5rem', height: '2.5rem', border: '3px solid #EDE9FE', borderTopColor: '#7C3AED', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
          <p style={{ color: '#6B7280', fontSize: '0.875rem', fontWeight: 500 }}>Verifying Credentials...</p>
        </div>
      </div>
    );
  }

  if (isLoading || !dashboardData) {
    return (
      <div style={{ minHeight: 'calc(100vh - 4rem)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FAFAFC' }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 size={36} className="animate-spin" color="#7C3AED" style={{ margin: '0 auto 1rem' }} />
          <p style={{ color: '#6B7280', fontSize: '0.875rem', fontWeight: 500 }}>Loading Educator Intelligence...</p>
        </div>
      </div>
    );
  }

  const { kpis, topic_perf, misconceptions, students, db_students } = dashboardData;

  const filteredStudents = students.filter((s: any) =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Merge db_students (proctoring data) back into student list if available
  const dbStudentMap: Record<string, any> = {};
  if (db_students) {
    db_students.forEach((s: any) => { dbStudentMap[s.name] = s; });
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', fontFamily: "'Inter', sans-serif", padding: '2rem 1.5rem' }}>
      <div style={{ maxWidth: '76rem', margin: '0 auto' }}>

        {/* ─── HEADER ─── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.75rem', fontWeight: 900, color: '#111827', letterSpacing: '-0.03em', marginBottom: '0.25rem' }}>
              Educator Intelligence Dashboard
              {dashboardData.is_mock && (
                <span style={{ fontSize: '0.75rem', fontWeight: 600, background: '#FEF3C7', color: '#D97706', padding: '0.125rem 0.5rem', borderRadius: '9999px', verticalAlign: 'middle' }}>
                  Mock Fallback
                </span>
              )}
            </h1>
            <p style={{ fontSize: '0.9375rem', color: '#6B7280' }}>Real-time class analytics, misconception aggregations, and instructional insights.</p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center', background: 'white', border: '1.5px solid #E5E7EB', borderRadius: '8px', padding: '0.25rem 0.5rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6B7280', paddingLeft: '0.25rem' }}>Topic:</span>
              <input
                type="text"
                value={selectedTopic}
                onChange={e => setSelectedTopic(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && fetchDashboardData(selectedTopic)}
                style={{ border: 'none', fontSize: '0.875rem', color: '#374151', outline: 'none', width: '150px', fontWeight: 600 }}
                placeholder="Topic name..."
              />
              <button
                onClick={() => fetchDashboardData(selectedTopic)}
                title="Refresh stats"
                style={{ border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#7C3AED' }}
              >
                <RefreshCw size={15} />
              </button>
            </div>

            <Link href="/analytics" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', padding: '0.5rem 1.25rem' }}>
              Deep Analytics <ChevronRight size={15} />
            </Link>
          </div>
        </div>

        {/* ─── KPIs ─── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          {[
            { icon: Users, label: 'Active Students', value: kpis.active_students, sub: 'attempted questions', color: '#7C3AED', bg: '#EDE9FE' },
            { icon: BookOpen, label: 'Avg Class Mastery', value: kpis.avg_class_mastery, sub: 'overall learning rate', color: '#059669', bg: '#ECFDF5' },
            { icon: AlertTriangle, label: 'Active Misconceptions', value: kpis.active_misconceptions, sub: 'unique gaps detected', color: '#D97706', bg: '#FEF3C7' },
            { icon: TrendingUp, label: 'Avg θ Velocity', value: kpis.avg_theta_velocity, sub: 'ability delta per session', color: '#0284C7', bg: '#E0F2FE' },
          ].map(k => (
            <div key={k.label} className="stat-card" style={{ display: 'flex', gap: '0.875rem', alignItems: 'center', background: 'white', padding: '1.25rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div className="icon-box" style={{ background: k.bg, width: '2.5rem', height: '2.5rem', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <k.icon size={20} color={k.color} />
              </div>
              <div>
                <div style={{ fontSize: '0.8125rem', color: '#6B7280', fontWeight: 500 }}>{k.label}</div>
                <div style={{ fontSize: '1.625rem', fontWeight: 900, color: '#111827', letterSpacing: '-0.04em', lineHeight: 1.1 }}>{k.value}</div>
                <div style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>{k.sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ─── CHARTS ROW ─── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr minmax(300px, 360px)', gap: '1.5rem', marginBottom: '1.5rem', alignItems: 'stretch' }}>

          {/* Bar chart */}
          <div className="card" style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#111827', marginBottom: '1.25rem' }}>Subtopic Mastery Distribution</h2>
            <div style={{ height: '240px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topic_perf} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                  <XAxis dataKey="topic" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} domain={[0, 100]} />
                  <Tooltip cursor={{ fill: '#F9FAFB' }} contentStyle={{ borderRadius: '10px', border: '1px solid #E5E7EB', fontSize: '0.875rem' }} />
                  <Bar dataKey="score" radius={[6, 6, 0, 0]} barSize={36}>
                    {topic_perf.map((entry: any, i: number) => (
                      <Cell key={i} fill={barColor(entry.score)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: 'flex', gap: '1.25rem', marginTop: '0.875rem', paddingTop: '0.875rem', borderTop: '1px solid #F3F4F6' }}>
              {[['#059669', '≥70% Mastered'], ['#D97706', '50–69% Learning'], ['#EF4444', '<50% At Risk']].map(([color, label]) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: color }} />
                  <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Misconceptions panel */}
          <div className="card" style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <AlertTriangle size={18} color="#D97706" />
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#111827', margin: 0 }}>Priority Re-teaching Areas</h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1, overflowY: 'auto', maxHeight: '250px' }}>
              {misconceptions.length > 0 ? (
                misconceptions.map((m: any, i: number) => (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.375rem', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#374151', lineHeight: 1.4, wordBreak: 'break-word' }}>{m.issue}</span>
                      <span style={{
                        fontSize: '0.8125rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '9999px', flexShrink: 0,
                        background: m.severity === 'high' ? '#FEE2E2' : m.severity === 'medium' ? '#FEF3C7' : '#ECFDF5',
                        color: m.severity === 'high' ? '#DC2626' : m.severity === 'medium' ? '#D97706' : '#059669',
                      }}>
                        {m.pct}%
                      </span>
                    </div>
                    <div className="progress-track" style={{ height: '6px', background: '#E5E7EB', borderRadius: '3px', overflow: 'hidden' }}>
                      <div className="progress-fill" style={{
                        height: '100%',
                        width: `${m.pct}%`,
                        background: m.severity === 'high' ? '#EF4444' : m.severity === 'medium' ? '#F59E0B' : '#10B981'
                      }} />
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#6B7280', fontSize: '0.875rem' }}>
                  No misconceptions flagged yet.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ─── AI RE-TEACHING PANEL ─── */}
        <div className="card" style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BookOpen size={18} color="#7C3AED" />
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#111827', margin: 0 }}>AI-Driven Re-teaching Lesson Plan</h2>
            </div>

            <button
              onClick={handleFetchReTeaching}
              disabled={isGenLoading}
              style={{
                background: '#7C3AED', color: 'white', border: 'none', borderRadius: '8px',
                padding: '0.5rem 1rem', fontSize: '0.875rem', fontWeight: 600, cursor: isGenLoading ? 'not-allowed' : 'pointer',
                opacity: isGenLoading ? 0.7 : 1, display: 'inline-flex', alignItems: 'center', gap: '0.5rem'
              }}
            >
              {isGenLoading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <RefreshCw size={15} />
                  {reTeachingText ? 'Regenerate Plan' : 'Generate AI Lesson Plan'}
                </>
              )}
            </button>
          </div>

          <div style={{ background: '#F9FAFB', padding: '1.5rem', borderRadius: '8px', border: '1px solid #E5E7EB', minHeight: '100px' }}>
            {isGenLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', padding: '2rem 0' }}>
                <Loader2 className="animate-spin" color="#7C3AED" size={24} />
                <p style={{ color: '#6B7280', fontSize: '0.875rem', fontWeight: 500 }}>Analyzing conceptual gaps & formulating activities...</p>
              </div>
            ) : reTeachingText ? (
              <div style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                {renderMarkdown(reTeachingText)}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem 0', color: '#6B7280', fontSize: '0.875rem' }}>
                Click the button to generate a customized remedial instruction plan for <strong>{selectedTopic}</strong> based on real class misconceptions.
              </div>
            )}
          </div>
        </div>

        {/* ─── STUDENT TABLE ─── */}
        <div className="card" style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#111827', margin: 0 }}>Student Ability, Velocity & Integrity</h2>
            <input
              placeholder="Search students..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ border: '1.5px solid #E5E7EB', borderRadius: '8px', padding: '0.4375rem 0.875rem', fontSize: '0.875rem', color: '#374151', outline: 'none', width: '220px' }}
            />
          </div>

          <div style={{ overflowX: 'auto' }}>
            {filteredStudents.length > 0 ? (
              <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #F3F4F6' }}>
                    <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' }}>Student</th>
                    <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' }}>Mastery</th>
                    <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' }}>Ability (θ)</th>
                    <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' }}>Velocity</th>
                    <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' }}>Subtopics</th>
                    <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' }}>Trend</th>
                    <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' }}>Integrity</th>
                    <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((s: any, i: number) => {
                    // Merge proctoring sessions from db_students if available
                    const dbEntry = dbStudentMap[s.name];
                    const sessions = s.sessions || dbEntry?.sessions || [];
                    const lockedSessions = sessions.filter((sess: any) => sess.is_locked);
                    const isLocked = lockedSessions.length > 0;

                    return (
                      <tr key={i} style={{ borderBottom: '1px solid #F3F4F6' }}>
                        <td style={{ padding: '1rem', fontWeight: 600, color: '#111827' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                            <div style={{ width: '2rem', height: '2rem', borderRadius: '50%', background: '#EDE9FE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6875rem', fontWeight: 800, color: '#7C3AED', flexShrink: 0 }}>
                              {s.name.split(' ').map((n: string) => n[0]).join('')}
                            </div>
                            {s.name}
                          </div>
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div className="progress-track" style={{ width: '80px', height: '6px', background: '#E5E7EB', borderRadius: '3px', overflow: 'hidden' }}>
                              <div className="progress-fill" style={{ height: '100%', width: `${s.mastery}%`, background: barColor(s.mastery) }} />
                            </div>
                            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: barColor(s.mastery) }}>{s.mastery}%</span>
                          </div>
                        </td>
                        <td style={{ padding: '1rem', fontWeight: 700, color: parseFloat(s.theta) >= 0 ? '#7C3AED' : '#EF4444' }}>{s.theta}</td>
                        <td style={{ padding: '1rem' }}>
                          <span style={{
                            fontSize: '0.8125rem', fontWeight: 600, padding: '0.2rem 0.625rem', borderRadius: '9999px',
                            background: s.velocity === 'Fast' ? '#ECFDF5' : s.velocity === 'Medium' ? '#FEF3C7' : '#FEE2E2',
                            color: s.velocity === 'Fast' ? '#059669' : s.velocity === 'Medium' ? '#D97706' : '#DC2626'
                          }}>
                            {s.velocity}
                          </span>
                        </td>
                        <td style={{ padding: '1rem', color: '#6B7280', fontSize: '0.875rem' }}>{s.topics} mastered</td>
                        <td style={{ padding: '1rem' }}>
                          {s.trend === 'up' ? <ArrowUp size={16} color="#059669" /> : s.trend === 'down' ? <ArrowDown size={16} color="#DC2626" /> : <span style={{ color: '#9CA3AF' }}>—</span>}
                        </td>
                        <td style={{ padding: '1rem' }}>
                          {isLocked ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#DC2626', fontWeight: 600, fontSize: '0.8125rem' }}>
                              <ShieldAlert size={14} /> Locked ({lockedSessions[0].violations_count} violations)
                            </div>
                          ) : (
                            <span style={{ fontSize: '0.8125rem', color: '#059669', fontWeight: 600 }}>Active / Clean</span>
                          )}
                        </td>
                        <td style={{ padding: '1rem' }}>
                          {isLocked ? (
                            <button
                              onClick={() => handleResetSession(lockedSessions[0].session_id)}
                              disabled={resettingSessionId === lockedSessions[0].session_id}
                              style={{
                                display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                                background: '#7C3AED', color: 'white', border: 'none',
                                padding: '0.375rem 0.75rem', borderRadius: '6px',
                                fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', transition: 'background-color 0.2s'
                              }}
                              onMouseOver={(e) => (e.currentTarget.style.background = '#6D28D9')}
                              onMouseOut={(e) => (e.currentTarget.style.background = '#7C3AED')}
                            >
                              {resettingSessionId === lockedSessions[0].session_id ? (
                                <Loader2 className="animate-spin" size={12} />
                              ) : (
                                <RotateCcw size={12} />
                              )}
                              Reset Session
                            </button>
                          ) : (
                            <span style={{ fontSize: '0.8125rem', color: '#9CA3AF' }}>No Action</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem 0', color: '#6B7280', fontSize: '0.875rem' }}>
                No students matched the search criteria.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
