"use client";

import React, { useState } from 'react';
import { ArrowRight, GraduationCap, Mail, School, Sparkles } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { DancingSquares } from '@/components/shared/DancingSquares';

export default function LoginPage() {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'student' | 'teacher'>('student');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      if (isLogin) {
        await login(email, password, role);
      } else {
        if (!name.trim()) throw new Error('Name is required');
        await register(name, email, password, role);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Something went wrong.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-page">
      <main className="app-shell-wide">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-8)', alignItems: 'center', minHeight: 'calc(100vh - 12rem)' }}>
          <section>
            <span className="badge badge-green">Auth Gateway</span>
            <h1 className="chunky-heading" style={{ fontSize: 'var(--heading-xl)', margin: 'var(--space-6) 0' }}>
              Enter your learning space
            </h1>
            <p style={{ fontWeight: 'var(--font-medium)', lineHeight: 'var(--leading-relaxed)', color: 'var(--muted)', maxWidth: '34rem' }}>
              Choose student or educator mode, then continue into adaptive quizzes, classes, analytics, and teacher-managed learning paths.
            </p>
          </section>

          <section className="card" style={{ background: 'var(--surface)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
              <button type="button" onClick={() => { setIsLogin(true); setError(null); }} className="neo-btn" style={{ background: isLogin ? 'var(--navy)' : 'var(--surface)', color: isLogin ? 'var(--surface)' : 'var(--navy)' }}>Sign In</button>
              <button type="button" onClick={() => { setIsLogin(false); setError(null); }} className="neo-btn" style={{ background: !isLogin ? 'var(--navy)' : 'var(--surface)', color: !isLogin ? 'var(--surface)' : 'var(--navy)' }}>Create</button>
            </div>

            <h2 className="chunky-heading" style={{ fontSize: 'var(--text-3xl)', marginBottom: 'var(--space-3)' }}>
              {isLogin ? 'Welcome Back' : 'New Account'}
            </h2>
            <p style={{ fontWeight: 'var(--font-extrabold)', color: 'var(--ink-secondary)', marginBottom: 'var(--space-6)' }}>
              {isLogin ? 'Select your role and sign in.' : 'Pick an account type and register.'}
            </p>

            {error && (
              <div className="card" style={{ background: 'var(--error-soft)', padding: 'var(--space-3)', marginBottom: 'var(--space-4)', color: 'var(--error)', fontWeight: 'var(--font-extrabold)' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {!isLogin && (
                <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontWeight: 'var(--font-black)', textTransform: 'uppercase' }}>
                  Full Name
                  <input value={name} onChange={e => setName(e.target.value)} placeholder="Alex Johnson" style={fieldStyle} required={!isLogin} />
                </label>
              )}

              <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontWeight: 'var(--font-black)', textTransform: 'uppercase' }}>
                Email
                <div style={{ position: 'relative' }}>
                  <Mail size={18} style={{ position: 'absolute', left: 'var(--space-3)', top: '50%', transform: 'translateY(-50%)', width: 'var(--icon-md)', height: 'var(--icon-md)' }} />
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="alex@school.edu" style={{ ...fieldStyle, paddingLeft: 'var(--space-10)' }} required />
                </div>
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontWeight: 'var(--font-black)', textTransform: 'uppercase' }}>
                Password
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" style={fieldStyle} required />
              </label>

              <div>
                <div style={{ fontWeight: 'var(--font-black)', textTransform: 'uppercase', marginBottom: 'var(--space-2)' }}>{isLogin ? 'Sign In As' : 'Account Type'}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                  {[
                    { value: 'student' as const, label: 'Student', icon: GraduationCap, sub: 'Learn adaptively' },
                    { value: 'teacher' as const, label: 'Educator', icon: School, sub: 'Manage classes' },
                  ].map(item => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setRole(item.value)}
                      className="neo-btn"
                      style={{ background: role === item.value ? 'var(--primary-soft)' : 'var(--surface)', flexDirection: 'column', alignItems: 'center', padding: 'var(--space-4)' }}
                    >
                      <item.icon size={24} style={{ width: 'var(--icon-xl)', height: 'var(--icon-xl)' }} />
                      <span>{item.label}</span>
                      <small style={{ fontFamily: 'Inter, sans-serif', fontWeight: 'var(--font-extrabold)' }}>{item.sub}</small>
                    </button>
                  ))}
                </div>
              </div>

              <button type="submit" disabled={isLoading} className="neo-btn neo-btn-primary" style={{ width: '100%', padding: 'var(--space-4)', opacity: isLoading ? 0.7 : 1 }}>
                {isLoading ? <DancingSquares size="sm" inline label="Processing..." /> : isLogin ? 'Access Portal' : 'Create Account'}
                {!isLoading && <ArrowRight size={18} style={{ width: 'var(--icon-md)', height: 'var(--icon-md)' }} />}
              </button>
            </form>
          </section>
        </div>
      </main>
    </div>
  );
}

const fieldStyle: React.CSSProperties = {
  width: '100%',
  padding: 'var(--space-3)',
  border: '1px solid var(--outline)',
  borderRadius: 'var(--radius-xl)',
  background: 'var(--surface-low)',
  outline: 'none',
  fontWeight: 'var(--font-semibold)',
};
