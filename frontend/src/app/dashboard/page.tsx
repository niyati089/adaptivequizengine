"use client";

import React from 'react';
import Link from 'next/link';
import { AreaChart, Area, LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Brain, Target, BookOpen, ChevronRight, AlertTriangle } from 'lucide-react';

const thetaData = [
  { session: 'S1', theta: -0.30 }, { session: 'S2', theta: 0.05 }, { session: 'S3', theta: 0.28 },
  { session: 'S4', theta: 0.21 }, { session: 'S5', theta: 0.45 }, { session: 'S6', theta: 0.52 },
  { session: 'S7', theta: 0.61 }, { session: 'S8', theta: 0.72 },
];

const masteryData = [
  { subject: 'Fractions', A: 73, fullMark: 100 },
  { subject: 'Equations', A: 55, fullMark: 100 },
  { subject: 'Geometry', A: 40, fullMark: 100 },
  { subject: 'Statistics', A: 68, fullMark: 100 },
  { subject: 'Ratios', A: 61, fullMark: 100 },
];

const topicMastery = [
  { name: 'Fractions & Equivalent Ratios', pct: 73, status: 'good' },
  { name: 'Linear Equations', pct: 55, status: 'medium' },
  { name: 'Quadratic Expressions', pct: 32, status: 'low' },
  { name: 'Geometry: Area & Perimeter', pct: 40, status: 'low' },
  { name: 'Descriptive Statistics', pct: 68, status: 'good' },
  { name: 'Percentages & Proportions', pct: 61, status: 'medium' },
];

const weakInsights = [
  { topic: 'Sign errors in algebra', frequency: 'High', action: 'Review next session' },
  { topic: 'Adding unlike denominators', frequency: 'Medium', action: 'Queued for tomorrow' },
  { topic: 'Area vs Perimeter confusion', frequency: 'Low', action: 'Spaced review in 5 days' },
];

const statusColor = (s: string) => s === 'good' ? '#059669' : s === 'medium' ? '#D97706' : '#DC2626';
const statusBg = (s: string) => s === 'good' ? '#ECFDF5' : s === 'medium' ? '#FEF3C7' : '#FEF2F2';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: '10px', padding: '0.75rem 1rem', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
        <p style={{ fontSize: '0.8125rem', color: '#6B7280', margin: 0 }}>{label}</p>
        <p style={{ fontSize: '1rem', fontWeight: 700, color: '#7C3AED', margin: '0.25rem 0 0' }}>θ = {payload[0].value}</p>
      </div>
    );
  }
  return null;
};

export default function DashboardPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', fontFamily: "'Inter', sans-serif", padding: '2rem 1.5rem' }}>
      <div style={{ maxWidth: '72rem', margin: '0 auto' }}>

        {/* ─── HEADER ─── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#111827', letterSpacing: '-0.03em', marginBottom: '0.25rem' }}>
              My Dashboard
            </h1>
            <p style={{ fontSize: '0.9375rem', color: '#6B7280' }}>Track your adaptive learning progress across all topics.</p>
          </div>
          <Link href="/quiz" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            Start Today's Quiz <ChevronRight size={16} />
          </Link>
        </div>

        {/* ─── KPI CARDS ─── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          {[
            { label: 'Current Theta', value: '+0.72', sub: '↑ from -0.30', color: '#7C3AED', bg: '#EDE9FE' },
            { label: 'Overall Mastery', value: '68%', sub: '↑ 12% this week', color: '#059669', bg: '#ECFDF5' },
            { label: 'Topics Mastered', value: '4 / 12', sub: '2 in review', color: '#0284C7', bg: '#E0F2FE' },
            { label: 'Day Streak', value: '7 days', sub: '🔥 Keep it up!', color: '#D97706', bg: '#FEF3C7' },
          ].map(k => (
            <div key={k.label} className="stat-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: k.color }} />
                <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: '#6B7280' }}>{k.label}</span>
              </div>
              <div className="stat-number" style={{ color: k.color }}>{k.value}</div>
              <div style={{ fontSize: '0.8125rem', color: '#9CA3AF', marginTop: '0.25rem' }}>{k.sub}</div>
            </div>
          ))}
        </div>

        {/* ─── CHARTS ROW ─── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.5rem', marginBottom: '1.5rem' }}>

          {/* Theta line chart */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <TrendingUp size={20} color="#7C3AED" />
                <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#111827', margin: 0 }}>Ability (θ) Progression</h2>
              </div>
              <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: '#9CA3AF' }}>Last 8 sessions</span>
            </div>
            <div style={{ height: '220px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={thetaData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="thetaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.12} />
                      <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                  <XAxis dataKey="session" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} domain={[-0.5, 1]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="theta" stroke="#7C3AED" strokeWidth={3} fill="url(#thetaGrad)"
                    dot={{ r: 5, fill: '#7C3AED', strokeWidth: 2, stroke: 'white' }}
                    activeDot={{ r: 7, fill: '#7C3AED', stroke: 'white', strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Radar chart */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <Brain size={20} color="#7C3AED" />
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#111827', margin: 0 }}>Topic Overview</h2>
            </div>
            <div style={{ height: '220px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={masteryData}>
                  <PolarGrid stroke="#E5E7EB" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: '#6B7280' }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar dataKey="A" stroke="#7C3AED" fill="#7C3AED" fillOpacity={0.2} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* ─── TOPIC MASTERY ─── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <Target size={20} color="#7C3AED" />
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#111827', margin: 0 }}>Topic Mastery</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {topicMastery.map((t, i) => (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.375rem' }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#374151' }}>{t.name}</span>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: statusColor(t.status), background: statusBg(t.status), padding: '0.2rem 0.5rem', borderRadius: '9999px' }}>
                      {t.pct}%
                    </span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${t.pct}%`, background: statusColor(t.status) }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Weak insights + Adaptive path */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <AlertTriangle size={18} color="#D97706" />
                <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#111827', margin: 0 }}>Misconception Watchlist</h2>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {weakInsights.map((w, i) => (
                  <div key={i} style={{ display: 'flex', gap: '0.75rem', padding: '0.75rem', background: '#F9FAFB', borderRadius: '10px', alignItems: 'flex-start' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: w.frequency === 'High' ? '#EF4444' : w.frequency === 'Medium' ? '#F59E0B' : '#10B981', marginTop: '5px', flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#111827' }}>{w.topic}</div>
                      <div style={{ fontSize: '0.8125rem', color: '#6B7280' }}>{w.action}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card" style={{ background: '#7C3AED', border: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.875rem' }}>
                <BookOpen size={18} color="rgba(255,255,255,0.8)" />
                <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'white', margin: 0 }}>Adaptive Path</h2>
              </div>
              {[
                { label: 'Current', topic: 'Equivalent Ratios', status: 'In Progress' },
                { label: 'Next', topic: 'Linear Equations', status: 'Unlocked' },
                { label: 'Review', topic: 'Unit Fractions', status: '3 days' },
              ].map((p, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.625rem 0', borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.15)' : 'none' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.55)', fontWeight: 600, textTransform: 'uppercase' }}>{p.label}</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'white' }}>{p.topic}</div>
                  </div>
                  <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.2)', color: 'white', padding: '0.25rem 0.625rem', borderRadius: '9999px', fontWeight: 600 }}>
                    {p.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
