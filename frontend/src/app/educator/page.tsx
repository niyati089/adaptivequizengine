"use client";

import React from 'react';
import Link from 'next/link';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Users, BookOpen, AlertTriangle, TrendingUp, ChevronRight, ArrowUp, ArrowDown } from 'lucide-react';

const topicPerf = [
  { topic: 'Fractions', score: 85 }, { topic: 'Equations', score: 62 }, { topic: 'Ratios', score: 71 },
  { topic: 'Geometry', score: 45 }, { topic: 'Statistics', score: 58 }, { topic: 'Algebra', score: 39 },
];

const students = [
  { name: 'Aisha Kumar', mastery: 82, theta: '+0.91', velocity: 'Fast', trend: 'up', topics: 8 },
  { name: 'Marcus Tee', mastery: 74, theta: '+0.62', velocity: 'Fast', trend: 'up', topics: 7 },
  { name: 'Priya Sharma', mastery: 61, theta: '+0.38', velocity: 'Medium', trend: 'up', topics: 5 },
  { name: 'Leon Baxter', mastery: 48, theta: '+0.11', velocity: 'Slow', trend: 'down', topics: 4 },
  { name: 'Sofia Reyes', mastery: 55, theta: '+0.28', velocity: 'Medium', trend: 'stable', topics: 5 },
  { name: 'James Wu', mastery: 38, theta: '-0.14', velocity: 'Slow', trend: 'down', topics: 3 },
];

const misconceptions = [
  { issue: 'Adding unlike denominators', pct: 42, severity: 'high' },
  { issue: 'Area vs. Perimeter confusion', pct: 28, severity: 'medium' },
  { issue: 'Sign errors in algebra', pct: 35, severity: 'high' },
  { issue: 'Decimal place value', pct: 19, severity: 'low' },
];

const barColor = (score: number) => score >= 70 ? '#059669' : score >= 50 ? '#D97706' : '#EF4444';

export default function EducatorPage() {
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
            { icon: Users, label: 'Active Students', value: '124', sub: '+8 this week', color: '#7C3AED', bg: '#EDE9FE' },
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
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#111827', margin: 0 }}>Student Performance</h2>
            <input placeholder="Search students..." style={{ border: '1.5px solid #E5E7EB', borderRadius: '8px', padding: '0.4375rem 0.875rem', fontSize: '0.875rem', color: '#374151', outline: 'none', width: '220px' }} />
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student</th><th>Mastery</th><th>Ability (θ)</th><th>Velocity</th><th>Topics</th><th>Trend</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600, color: '#111827' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                        <div style={{ width: '2rem', height: '2rem', borderRadius: '50%', background: '#EDE9FE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6875rem', fontWeight: 800, color: '#7C3AED', flexShrink: 0 }}>
                          {s.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        {s.name}
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
                      <span style={{ fontSize: '0.8125rem', fontWeight: 600, padding: '0.2rem 0.625rem', borderRadius: '9999px',
                        background: s.velocity === 'Fast' ? '#ECFDF5' : s.velocity === 'Medium' ? '#FEF3C7' : '#FEE2E2',
                        color: s.velocity === 'Fast' ? '#059669' : s.velocity === 'Medium' ? '#D97706' : '#DC2626' }}>
                        {s.velocity}
                      </span>
                    </td>
                    <td style={{ color: '#6B7280' }}>{s.topics} mastered</td>
                    <td>
                      {s.trend === 'up' ? <ArrowUp size={16} color="#059669" /> : s.trend === 'down' ? <ArrowDown size={16} color="#DC2626" /> : <span style={{ color: '#9CA3AF' }}>—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
