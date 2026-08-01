"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { TrendingUp, BarChart2, Clock, Target, Zap, Brain } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getTeacherAnalytics, getUserAnalytics } from '@/services/quizService';
import { DancingSquares } from '@/components/shared/DancingSquares';

const PERIODS = ['7 days', '30 days', '90 days', 'All time'];

const emptyAnalytics = {
  summary: {
    total_questions: 0,
    accuracy: 0,
    current_theta: 0,
    theta_delta: 0,
    topics_practiced: 0,
  },
  theta_history: [],
  mastery_distribution: [
    { range: '0-20%', count: 0 },
    { range: '21-40%', count: 0 },
    { range: '41-60%', count: 0 },
    { range: '61-80%', count: 0 },
    { range: '81-100%', count: 0 },
  ],
  question_difficulty: [],
  session_mastery: [],
  topic_mastery: [],
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div style={{ background: 'var(--surface)', border: '1px solid var(--outline)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-3) var(--space-4)', boxShadow: 'var(--shadow-soft)', fontSize: 'var(--text-sm)' }}>
        <p style={{ color: 'var(--muted)', margin: '0 0 var(--space-1)' }}>{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ color: p.color || 'var(--primary)', fontWeight: 'var(--font-bold)', margin: '0.1rem 0' }}>{p.name}: {p.value}</p>
        ))}
      </div>
    );
  }
  return null;
};

export default function AnalyticsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [period, setPeriod] = useState('30 days');
  const [analytics, setAnalytics] = useState<any>(emptyAnalytics);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }

    const loadAnalytics = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = user.role === 'teacher' ? await getTeacherAnalytics() : await getUserAnalytics();
        setAnalytics(data);
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Could not load analytics.');
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, [authLoading, router, user]);

  const filtered = useMemo(() => {
    const limits: Record<string, number> = {
      '7 days': 7,
      '30 days': 12,
      '90 days': 16,
      'All time': Number.MAX_SAFE_INTEGER,
    };
    const limit = limits[period];

    return {
      ...analytics,
      theta_history: analytics.theta_history.slice(-limit),
      session_mastery: analytics.session_mastery.slice(-limit),
    };
  }, [analytics, period]);

  const insights = [
    { icon: Clock, label: 'Questions Answered', value: String(analytics.summary.total_questions), delta: `${analytics.summary.topics_practiced} topics practiced`, color: 'var(--primary)', bg: 'var(--primary-soft)' },
    { icon: Target, label: 'First-Attempt Accuracy', value: `${analytics.summary.accuracy}%`, delta: 'Based on saved quiz attempts', color: 'var(--success)', bg: 'var(--success-soft)' },
    { icon: Zap, label: 'Current Ability', value: `${analytics.summary.current_theta >= 0 ? '+' : ''}${analytics.summary.current_theta}`, delta: `Delta ${analytics.summary.theta_delta >= 0 ? '+' : ''}${analytics.summary.theta_delta}`, color: 'var(--warning)', bg: 'var(--warning-soft)' },
    { icon: Brain, label: 'Mastered Topics', value: String(analytics.topic_mastery.filter((t: any) => t.pct >= 70).length), delta: 'Topics at 70%+ accuracy', color: 'var(--info)', bg: 'var(--info-soft)' },
  ];

  if (authLoading || loading || !user) {
    return (
      <div className="app-page" style={{ display: 'grid', placeItems: 'center' }}>
        <DancingSquares size="lg" label="Loading analytics..." />
      </div>
    );
  }

  return (
    <div className="app-page">
      <div className="app-shell-wide">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-8)', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
          <div>
            <span className="badge badge-purple">Mastery Dashboard</span>
            <h1 className="chunky-heading" style={{ fontSize: 'var(--heading-xl)', color: 'var(--ink)', margin: 'var(--space-4) 0 var(--space-1)' }}>
              {user.name}'s Analytics
            </h1>
            <p style={{ fontSize: 'var(--text-base)', color: 'var(--ink-secondary)', fontWeight: 'var(--font-extrabold)' }}>
              {user.role === 'teacher' ? 'Live class metrics from your assigned quizzes.' : 'Live learning metrics from your saved quiz attempts.'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-1)', background: 'var(--surface)', border: '1.5px solid var(--outline)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-1)' }}>
            {PERIODS.map(p => (
              <button key={p} onClick={() => setPeriod(p)} style={{
                border: 'none', borderRadius: 'var(--radius-md)', padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)',
                cursor: 'pointer', transition: 'all var(--transition-fast)',
                background: period === p ? 'var(--primary)' : 'transparent',
                color: period === p ? 'var(--surface)' : 'var(--muted)',
              }}>{p}</button>
            ))}
          </div>
        </div>

        {error && (
          <div className="card" style={{ marginBottom: 'var(--space-6)', color: 'var(--error)', background: 'var(--error-soft)', borderColor: 'var(--error)' }}>
            {error}
          </div>
        )}

        {analytics.summary.total_questions === 0 && (
          <div className="card" style={{ marginBottom: 'var(--space-6)', background: 'var(--warning-soft)', borderColor: 'var(--warning)' }}>
            <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-extrabold)', color: 'var(--warning)', margin: '0 0 var(--space-1)' }}>No quiz attempts yet</h2>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--warning)', margin: 0 }}>
              {user.role === 'teacher' ? 'Assign quizzes and have students complete them to populate this page.' : 'Take a quiz while signed in and this page will populate automatically.'}
            </p>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
          {insights.map(ins => (
            <div key={ins.label} className="stat-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                <div className="icon-box" style={{ background: ins.bg, width: 'var(--space-8)', height: 'var(--space-8)', borderRadius: 'var(--radius-md)' }}>
                  <ins.icon size={16} color={ins.color} />
                </div>
                <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', color: 'var(--muted)' }}>{ins.label}</span>
              </div>
              <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 'var(--font-black)', color: ins.color, letterSpacing: '-0.04em', lineHeight: 1 }}>{ins.value}</div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted-light)', marginTop: 'var(--space-1)' }}>{ins.delta}</div>
            </div>
          ))}
        </div>

        <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-5)' }}>
            <TrendingUp size={20} color="var(--primary)" />
            <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-bold)', color: 'var(--ink)', margin: 0 }}>Ability Theta Over Time</h2>
          </div>
          <div style={{ height: '260px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={filtered.theta_history} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="thetaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--surface-mid)" vertical={false} />
                <XAxis dataKey="session" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--muted-light)' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--muted-light)' }} domain={[-3, 3]} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="theta" stroke="var(--primary)" strokeWidth={3} fill="url(#thetaGrad)" name="Theta" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-5)' }}>
              <BarChart2 size={20} color="var(--info)" />
              <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-bold)', color: 'var(--ink)', margin: 0 }}>Topic Mastery Distribution</h2>
            </div>
            <div style={{ height: '220px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={filtered.mastery_distribution} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--surface-mid)" vertical={false} />
                  <XAxis dataKey="range" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--muted-light)' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--muted-light)' }} />
                  <Tooltip cursor={{ fill: 'var(--surface-low)' }} contentStyle={{ borderRadius: 'var(--radius-lg)', border: '1px solid var(--outline)', fontSize: 'var(--text-sm)' }} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={30} name="Topics">
                    {filtered.mastery_distribution.map((_: any, i: number) => {
                      const colors = ['var(--error)', 'var(--warning)', 'var(--warning)', 'var(--success)', 'var(--success)'];
                      return <Cell key={i} fill={colors[i]} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-5)' }}>
              <Target size={20} color="var(--warning)" />
              <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-bold)', color: 'var(--ink)', margin: 0 }}>Attempt Difficulty Spread</h2>
            </div>
            <div style={{ height: '220px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={filtered.question_difficulty} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--surface-mid)" vertical={false} />
                  <XAxis dataKey="b" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--muted-light)' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--muted-light)' }} />
                  <Tooltip cursor={{ fill: 'var(--surface-low)' }} contentStyle={{ borderRadius: 'var(--radius-lg)', border: '1px solid var(--outline)', fontSize: 'var(--text-sm)' }} />
                  <Bar dataKey="count" fill="var(--primary)" radius={[6, 6, 0, 0]} barSize={26} name="Questions" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-5)' }}>
            <Zap size={20} color="var(--success)" />
            <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-bold)', color: 'var(--ink)', margin: 0 }}>Sessions vs. Mastery</h2>
          </div>
          <div style={{ height: '220px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={filtered.session_mastery} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--surface-mid)" vertical={false} />
                <XAxis dataKey="sessions" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--muted-light)' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--muted-light)' }} domain={[0, 100]} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="mastery" stroke="var(--success)" strokeWidth={3}
                  dot={{ r: 5, fill: 'var(--success)', stroke: 'var(--surface)', strokeWidth: 2 }}
                  activeDot={{ r: 7 }} name="Mastery %" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
