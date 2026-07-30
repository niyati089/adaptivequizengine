"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Users, BookOpen, AlertTriangle, TrendingUp, ChevronRight, ArrowUp, ArrowDown, ShieldAlert, RotateCcw, Loader2 } from 'lucide-react';
import { getEducatorDashboardData, resetSessionProctoring } from '@/services/proctoringService';

const topicPerf = [
  { topic: 'Fractions', score: 85 }, { topic: 'Equations', score: 62 }, { topic: 'Ratios', score: 71 },
  { topic: 'Geometry', score: 45 }, { topic: 'Statistics', score: 58 }, { topic: 'Algebra', score: 39 },
];

const misconceptions = [
  { issue: 'Adding unlike denominators', pct: 42, severity: 'high' },
  { issue: 'Area vs. Perimeter confusion', pct: 28, severity: 'medium' },
  { issue: 'Sign errors in algebra', pct: 35, severity: 'high' },
  { issue: 'Decimal place value', pct: 19, severity: 'low' },
];

const barColor = (score: number) => score >= 70 ? '#059669' : score >= 50 ? '#D97706' : '#EF4444';

export default function EducatorPage() {
  const [backendStudents, setBackendStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [resettingSessionId, setResettingSessionId] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      const data = await getEducatorDashboardData();
      if (data && data.students) {
        setBackendStudents(data.students);
      }
    } catch (err) {
      console.error("Failed to load educator dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleResetSession = async (sessionId: string) => {
    setResettingSessionId(sessionId);
    try {
      await resetSessionProctoring(sessionId);
      alert("Successfully reset proctoring flags and unlocked this student's session.");
      await fetchDashboardData();
    } catch (err: any) {
      alert(err?.response?.data?.detail || "Failed to reset session.");
    } finally {
      setResettingSessionId(null);
    }
  };

  // Combine real database students and beautiful mock students for visual completeness
  const mockStudents = [
    { name: 'Aisha Kumar', email: 'aisha@school.edu', mastery: 82, theta: '+0.91', velocity: 'Fast', trend: 'up', topics: 8, sessions: [], isReal: false },
    { name: 'Marcus Tee', email: 'marcus@school.edu', mastery: 74, theta: '+0.62', velocity: 'Fast', trend: 'up', topics: 7, sessions: [], isReal: false },
    { name: 'Priya Sharma', email: 'priya@school.edu', mastery: 61, theta: '+0.38', velocity: 'Medium', trend: 'up', topics: 5, sessions: [], isReal: false },
    { name: 'Leon Baxter', email: 'leon@school.edu', mastery: 48, theta: '+0.11', velocity: 'Slow', trend: 'down', topics: 4, sessions: [], isReal: false },
    { name: 'Sofia Reyes', email: 'sofia@school.edu', mastery: 55, theta: '+0.28', velocity: 'Medium', trend: 'stable', topics: 5, sessions: [], isReal: false },
    { name: 'James Wu', email: 'james@school.edu', mastery: 38, theta: '-0.14', velocity: 'Slow', trend: 'down', topics: 3, sessions: [], isReal: false },
  ];

  // Map real database students to the table format
  const mappedRealStudents = backendStudents.map(student => {
    // Determine mastery and ability from mock/average since they are just starting
    const hasLockedSession = student.sessions?.some((s: any) => s.is_locked);
    const totalViolations = student.sessions?.reduce((acc: number, s: any) => acc + s.violations_count, 0) || 0;
    
    return {
      id: student.id,
      name: student.name,
      email: student.email,
      mastery: hasLockedSession ? 35 : 68,
      theta: hasLockedSession ? '-0.45' : '+0.12',
      velocity: hasLockedSession ? 'Suspended' : 'Medium',
      trend: hasLockedSession ? 'down' : 'stable',
      topics: 1,
      sessions: student.sessions || [],
      isReal: true,
      totalViolations
    };
  });

  const allStudents = [...mappedRealStudents, ...mockStudents];

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', fontFamily: "'Inter', sans-serif", padding: '2rem 1.5rem' }}>
      <div style={{ maxWidth: '76rem', margin: '0 auto' }}>

        {/* ─── HEADER ─── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#111827', letterSpacing: '-0.03em', marginBottom: '0.25rem' }}>
              Educator Analytics
            </h1>
            <p style={{ fontSize: '0.9375rem', color: '#6B7280' }}>Class-level insights, misconception signals, and learning velocity.</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <select style={{ border: '1.5px solid #E5E7EB', borderRadius: '8px', padding: '0.5rem 0.875rem', fontSize: '0.875rem', color: '#374151', background: 'white', cursor: 'pointer' }}>
              <option>Last 30 days</option>
              <option>Last 7 days</option>
              <option>This month</option>
            </select>
            <Link href="/analytics" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', padding: '0.5rem 1.25rem' }}>
              Deep Analytics <ChevronRight size={15} />
            </Link>
          </div>
        </div>

        {/* ─── KPIs ─── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          {[
            { icon: Users, label: 'Active Students', value: String(mappedRealStudents.length + mockStudents.length), sub: `+${mappedRealStudents.length} database users`, color: '#7C3AED', bg: '#EDE9FE' },
            { icon: BookOpen, label: 'Avg Class Mastery', value: '61%', sub: '↑ 4% vs last week', color: '#059669', bg: '#ECFDF5' },
            { icon: AlertTriangle, label: 'Active Misconceptions', value: '12', sub: '3 high priority', color: '#D97706', bg: '#FEF3C7' },
            { icon: TrendingUp, label: 'Avg θ Velocity', value: '+0.15', sub: 'per session', color: '#0284C7', bg: '#E0F2FE' },
          ].map(k => (
            <div key={k.label} className="stat-card" style={{ display: 'flex', gap: '0.875rem', alignItems: 'center' }}>
              <div className="icon-box" style={{ background: k.bg }}>
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
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '1.5rem', marginBottom: '1.5rem' }}>
          {/* Bar chart */}
          <div className="card">
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#111827', marginBottom: '1.25rem' }}>Topic Mastery Distribution</h2>
            <div style={{ height: '240px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topicPerf} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                  <XAxis dataKey="topic" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} domain={[0, 100]} />
                  <Tooltip cursor={{ fill: '#F9FAFB' }} contentStyle={{ borderRadius: '10px', border: '1px solid #E5E7EB', fontSize: '0.875rem' }} />
                  <Bar dataKey="score" radius={[6, 6, 0, 0]} barSize={36}>
                    {topicPerf.map((entry, i) => (
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
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <AlertTriangle size={18} color="#D97706" />
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#111827', margin: 0 }}>Priority Re-teaching</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              {misconceptions.map((m, i) => (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.375rem' }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#374151', lineHeight: 1.4 }}>{m.issue}</span>
                    <span style={{
                      fontSize: '0.8125rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '9999px',
                      background: m.severity === 'high' ? '#FEE2E2' : m.severity === 'medium' ? '#FEF3C7' : '#ECFDF5',
                      color: m.severity === 'high' ? '#DC2626' : m.severity === 'medium' ? '#D97706' : '#059669',
                    }}>
                      {m.pct}%
                    </span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{
                      width: `${m.pct}%`,
                      background: m.severity === 'high' ? '#EF4444' : m.severity === 'medium' ? '#F59E0B' : '#10B981'
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ─── STUDENT TABLE ─── */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#111827', margin: 0 }}>Student Performance & Integrity</h2>
            <input placeholder="Search students..." style={{ border: '1.5px solid #E5E7EB', borderRadius: '8px', padding: '0.4375rem 0.875rem', fontSize: '0.875rem', color: '#374151', outline: 'none', width: '220px' }} />
          </div>
          
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem' }}>
              <Loader2 className="animate-spin" size={24} color="#7C3AED" />
              <span style={{ marginLeft: '0.5rem', color: '#6B7280', fontSize: '0.875rem' }}>Loading students...</span>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Mastery</th>
                    <th>Ability (θ)</th>
                    <th>Velocity</th>
                    <th>Integrity / Active Lock</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {allStudents.map((s, i) => {
                    const lockedSessions = s.sessions?.filter((sess: any) => sess.is_locked) || [];
                    const isLocked = lockedSessions.length > 0;
                    
                    return (
                      <tr key={i}>
                        <td style={{ fontWeight: 600, color: '#111827' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                            <div style={{ width: '2rem', height: '2rem', borderRadius: '50%', background: s.isReal ? '#EDE9FE' : '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6875rem', fontWeight: 800, color: s.isReal ? '#7C3AED' : '#6B7280', flexShrink: 0 }}>
                              {s.name.split(' ').map((n: string) => n[0]).join('')}
                            </div>
                            <div>
                              <div>{s.name}</div>
                              <div style={{ fontSize: '0.6875rem', color: '#9CA3AF', fontWeight: 400 }}>{s.email}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div className="progress-track" style={{ width: '80px' }}>
                              <div className="progress-fill" style={{ width: `${s.mastery}%`, background: barColor(s.mastery) }} />
                            </div>
                            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: barColor(s.mastery) }}>{s.mastery}%</span>
                          </div>
                        </td>
                        <td style={{ fontWeight: 700, color: parseFloat(s.theta) >= 0 ? '#7C3AED' : '#EF4444' }}>{s.theta}</td>
                        <td>
                          <span style={{
                            fontSize: '0.8125rem', fontWeight: 600, padding: '0.2rem 0.625rem', borderRadius: '9999px',
                            background: s.velocity === 'Fast' ? '#ECFDF5' : s.velocity === 'Medium' ? '#FEF3C7' : s.velocity === 'Slow' ? '#FEE2E2' : '#FEE2E2',
                            color: s.velocity === 'Fast' ? '#059669' : s.velocity === 'Medium' ? '#D97706' : s.velocity === 'Slow' ? '#DC2626' : '#DC2626'
                          }}>
                            {s.velocity}
                          </span>
                        </td>
                        <td>
                          {isLocked ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#DC2626', fontWeight: 600, fontSize: '0.8125rem' }}>
                              <ShieldAlert size={14} /> Locked ({lockedSessions[0].violations_count} violations)
                            </div>
                          ) : (
                            <span style={{ fontSize: '0.8125rem', color: '#059669', fontWeight: 600 }}>Active / Clean</span>
                          )}
                        </td>
                        <td>
                          {isLocked ? (
                            <button
                              onClick={() => handleResetSession(lockedSessions[0].session_id)}
                              disabled={resettingSessionId === lockedSessions[0].session_id}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                background: '#7C3AED',
                                color: 'white',
                                border: 'none',
                                padding: '0.375rem 0.75rem',
                                borderRadius: '6px',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'background-color 0.2s'
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
