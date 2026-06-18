"use client";

import React, { useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, Cell
} from 'recharts';
import { TrendingUp, BarChart2, Clock, Target, Zap, Brain } from 'lucide-react';

const thetaHistory = [
  { week: 'Wk 1', avg: -0.40, top: 0.20, bottom: -0.80 },
  { week: 'Wk 2', avg: -0.10, top: 0.45, bottom: -0.60 },
  { week: 'Wk 3', avg: 0.18, top: 0.72, bottom: -0.30 },
  { week: 'Wk 4', avg: 0.35, top: 0.90, bottom: -0.10 },
  { week: 'Wk 5', avg: 0.48, top: 1.05, bottom: 0.05 },
  { week: 'Wk 6', avg: 0.62, top: 1.20, bottom: 0.18 },
];

const masteryDist = [
  { range: '0–20%', count: 8 }, { range: '21–40%', count: 14 }, { range: '41–60%', count: 27 },
  { range: '61–80%', count: 38 }, { range: '81–100%', count: 23 },
];

const questionDiff = [
  { b: '-3.0', count: 5 }, { b: '-2.0', count: 12 }, { b: '-1.0', count: 24 },
  { b: '0.0', count: 38 }, { b: '+1.0', count: 32 }, { b: '+2.0', count: 18 },
  { b: '+3.0', count: 7 },
];

const sessionLength = [
  { sessions: 1, mastery: 35 }, { sessions: 2, mastery: 48 }, { sessions: 3, mastery: 58 },
  { sessions: 5, mastery: 67 }, { sessions: 8, mastery: 76 }, { sessions: 12, mastery: 82 },
  { sessions: 16, mastery: 87 }, { sessions: 20, mastery: 91 },
];

const insights = [
  { icon: Clock, label: 'Avg. Time per Question', value: '1m 24s', delta: '↓ 18s from last week', color: '#7C3AED', bg: '#EDE9FE' },
  { icon: Target, label: 'First-Attempt Accuracy', value: '71%', delta: '↑ 6% from last week', color: '#059669', bg: '#ECFDF5' },
  { icon: Zap, label: 'Hint Usage Rate', value: '28%', delta: '↓ 5% (getting better!)', color: '#D97706', bg: '#FEF3C7' },
  { icon: Brain, label: 'Socratic Hint Efficacy', value: '82%', delta: 'Correct after 1 hint', color: '#0284C7', bg: '#E0F2FE' },
];

const PERIODS = ['7 days', '30 days', '90 days', 'All time'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: '10px', padding: '0.75rem 1rem', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: '0.875rem' }}>
        <p style={{ color: '#6B7280', margin: '0 0 0.25rem' }}>{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ color: p.color || '#7C3AED', fontWeight: 700, margin: '0.1rem 0' }}>{p.name}: {p.value}</p>
        ))}
      </div>
    );
  }
  return null;
};

export default function AnalyticsPage() {
  const [period, setPeriod] = useState('30 days');

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', fontFamily: "'Inter', sans-serif", padding: '2rem 1.5rem' }}>
      <div style={{ maxWidth: '76rem', margin: '0 auto' }}>

        {/* ─── HEADER ─── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#111827', letterSpacing: '-0.03em', marginBottom: '0.25rem' }}>
              Analytics
            </h1>
            <p style={{ fontSize: '0.9375rem', color: '#6B7280' }}>Deep population metrics, IRT analysis, and learning behaviour insights.</p>
          </div>
          {/* Period picker */}
          <div style={{ display: 'flex', gap: '0.375rem', background: 'white', border: '1.5px solid #E5E7EB', borderRadius: '10px', padding: '0.25rem' }}>
            {PERIODS.map(p => (
              <button key={p} onClick={() => setPeriod(p)} style={{
                border: 'none', borderRadius: '8px', padding: '0.4375rem 0.875rem', fontSize: '0.875rem', fontWeight: 600,
                cursor: 'pointer', transition: 'all 0.15s ease',
                background: period === p ? '#7C3AED' : 'transparent',
                color: period === p ? 'white' : '#6B7280',
              }}>{p}</button>
            ))}
          </div>
        </div>

        {/* ─── BEHAVIOURAL INSIGHTS ─── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          {insights.map(ins => (
            <div key={ins.label} className="stat-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.625rem' }}>
                <div className="icon-box" style={{ background: ins.bg, width: '2.25rem', height: '2.25rem', borderRadius: '8px' }}>
                  <ins.icon size={16} color={ins.color} />
                </div>
                <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: '#6B7280' }}>{ins.label}</span>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, color: ins.color, letterSpacing: '-0.04em', lineHeight: 1 }}>{ins.value}</div>
              <div style={{ fontSize: '0.75rem', color: '#9CA3AF', marginTop: '0.375rem' }}>{ins.delta}</div>
            </div>
          ))}
        </div>

        {/* ─── THETA HISTORY ─── */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingUp size={20} color="#7C3AED" />
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#111827', margin: 0 }}>Population Ability (θ) Over Time</h2>
            </div>
            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8125rem', color: '#6B7280' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <span style={{ display: 'inline-block', width: '24px', height: '3px', background: '#7C3AED', borderRadius: '9999px' }} />
                Average θ
              </span>
            </div>
          </div>
          <div style={{ height: '260px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={thetaHistory} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="topGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.08} />
                    <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} domain={[-1, 1.5]} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="top" stroke="none" fill="url(#topGrad)" name="Top performer" />
                <Area type="monotone" dataKey="bottom" stroke="none" fill="white" name="Bottom" />
                <Line type="monotone" dataKey="avg" stroke="#7C3AED" strokeWidth={3} dot={{ r: 5, fill: '#7C3AED', stroke: 'white', strokeWidth: 2 }} name="Avg θ" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ─── BOTTOM 2-COL ─── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>

          {/* Mastery distribution */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <BarChart2 size={20} color="#0284C7" />
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#111827', margin: 0 }}>Mastery Score Distribution</h2>
            </div>
            <div style={{ height: '220px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={masteryDist} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                  <XAxis dataKey="range" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9CA3AF' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} />
                  <Tooltip cursor={{ fill: '#F9FAFB' }} contentStyle={{ borderRadius: '10px', border: '1px solid #E5E7EB', fontSize: '0.875rem' }} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={30} name="Students">
                    {masteryDist.map((_, i) => {
                      const colors = ['#EF4444', '#F59E0B', '#F59E0B', '#059669', '#059669'];
                      return <Cell key={i} fill={colors[i]} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Question difficulty distribution */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <Target size={20} color="#D97706" />
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#111827', margin: 0 }}>Item Difficulty (b) Distribution</h2>
            </div>
            <div style={{ height: '220px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={questionDiff} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                  <XAxis dataKey="b" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9CA3AF' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} />
                  <Tooltip cursor={{ fill: '#F9FAFB' }} contentStyle={{ borderRadius: '10px', border: '1px solid #E5E7EB', fontSize: '0.875rem' }} />
                  <Bar dataKey="count" fill="#7C3AED" radius={[6, 6, 0, 0]} barSize={26} name="Questions" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p style={{ fontSize: '0.75rem', color: '#9CA3AF', marginTop: '0.75rem', textAlign: 'center' }}>
              Difficulty parameter b (–3 Easy → +3 Hard)
            </p>
          </div>
        </div>

        {/* ─── SESSIONS vs MASTERY ─── */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Zap size={20} color="#059669" />
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#111827', margin: 0 }}>Sessions vs. Mastery Gain</h2>
            </div>
            <p style={{ fontSize: '0.8125rem', color: '#9CA3AF', margin: 0 }}>Diminishing returns curve showing learning velocity</p>
          </div>
          <div style={{ height: '220px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sessionLength} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                <XAxis dataKey="sessions" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} label={{ value: 'Sessions completed', position: 'insideBottom', offset: -2, fontSize: 11, fill: '#9CA3AF' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} domain={[0, 100]} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="mastery" stroke="#059669" strokeWidth={3}
                  dot={{ r: 5, fill: '#059669', stroke: 'white', strokeWidth: 2 }}
                  activeDot={{ r: 7 }} name="Mastery %" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Insight callouts */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid #F3F4F6' }}>
            {[
              { val: '2.1 sessions', label: 'Avg sessions to master a topic', color: '#7C3AED' },
              { val: '87%', label: 'Plateau mastery level (20+ sessions)', color: '#059669' },
              { val: 'Session 3–6', label: 'Highest learning velocity window', color: '#D97706' },
            ].map(s => (
              <div key={s.label} style={{ background: '#F9FAFB', borderRadius: '10px', padding: '0.875rem 1rem' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: s.color, letterSpacing: '-0.03em' }}>{s.val}</div>
                <div style={{ fontSize: '0.8125rem', color: '#6B7280', marginTop: '0.25rem' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
