"use client";

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Mail, Lock, User as UserIcon, GraduationCap, School, ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  
  // Fields
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
        await login(email, password);
      } else {
        if (!name) {
          throw new Error("Name is required");
        }
        await register(name, email, password, role);
      }
    } catch (err: any) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.detail) {
        setError(err.response.data.detail);
      } else {
        setError(err.message || "Something went wrong. Please check your credentials.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: 'calc(100vh - 4rem)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at 10% 20%, rgba(124, 58, 237, 0.05) 0%, transparent 40%), radial-gradient(circle at 90% 80%, rgba(6, 182, 212, 0.05) 0%, transparent 40%), #FAFAFC',
      padding: '2rem 1.5rem',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background blobs */}
      <div style={{
        position: 'absolute', top: '15%', left: '10%',
        width: '24rem', height: '24rem',
        background: 'linear-gradient(135deg, rgba(124,58,237,0.1), rgba(99,102,241,0.1))',
        borderRadius: '50%', filter: 'blur(60px)',
        zIndex: 0,
      }} />
      <div style={{
        position: 'absolute', bottom: '15%', right: '10%',
        width: '24rem', height: '24rem',
        background: 'linear-gradient(135deg, rgba(6,182,212,0.08), rgba(236,72,153,0.08))',
        borderRadius: '50%', filter: 'blur(60px)',
        zIndex: 0,
      }} />

      {/* Main card */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(229, 231, 235, 0.8)',
        borderRadius: '24px',
        boxShadow: '0 20px 40px -15px rgba(0,0,0,0.05), 0 0 0 1px rgba(124,58,237,0.02)',
        width: '100%',
        maxWidth: '28rem',
        padding: '2.5rem',
        zIndex: 1,
        position: 'relative',
      }}>
        
        {/* Toggle tabs */}
        <div style={{
          display: 'flex',
          background: '#F3F4F6',
          borderRadius: '12px',
          padding: '0.25rem',
          marginBottom: '2rem',
        }}>
          <button
            onClick={() => { setIsLogin(true); setError(null); }}
            style={{
              flex: 1,
              padding: '0.625rem',
              borderRadius: '8px',
              border: 'none',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
              background: isLogin ? 'white' : 'transparent',
              color: isLogin ? '#111827' : '#6B7280',
              boxShadow: isLogin ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
            }}
          >
            Sign In
          </button>
          <button
            onClick={() => { setIsLogin(false); setError(null); }}
            style={{
              flex: 1,
              padding: '0.625rem',
              borderRadius: '8px',
              border: 'none',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
              background: !isLogin ? 'white' : 'transparent',
              color: !isLogin ? '#111827' : '#6B7280',
              boxShadow: !isLogin ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
            }}
          >
            Create Account
          </button>
        </div>

        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.375rem',
            background: 'linear-gradient(135deg, rgba(124,58,237,0.1), rgba(99,102,241,0.1))',
            padding: '0.375rem 0.875rem',
            borderRadius: '99px',
            fontSize: '0.75rem',
            fontWeight: 600,
            color: '#7C3AED',
            marginBottom: '0.75rem',
          }}>
            <Sparkles size={12} />
            <span>AI-Adaptive Learning Engine</span>
          </div>
          <h2 style={{
            fontSize: '1.75rem',
            fontWeight: 800,
            color: '#111827',
            letterSpacing: '-0.02em',
            margin: 0,
          }}>
            {isLogin ? 'Welcome Back' : 'Get Started'}
          </h2>
          <p style={{
            fontSize: '0.875rem',
            color: '#6B7280',
            marginTop: '0.375rem',
            margin: '0.375rem 0 0 0',
          }}>
            {isLogin ? 'Sign in to continue your adaptive journey' : 'Join a smart ecosystem tailored to you'}
          </p>
        </div>

        {error && (
          <div style={{
            background: '#FEF2F2',
            border: '1px solid #FCA5A5',
            color: '#991B1B',
            borderRadius: '12px',
            padding: '0.75rem 1rem',
            fontSize: '0.875rem',
            marginBottom: '1.5rem',
            fontWeight: 500,
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Name field (register only) */}
          {!isLogin && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#374151' }}>Full Name</label>
              <div style={{ position: 'relative' }}>
                <div style={{
                  position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)',
                  color: '#9CA3AF', pointerEvents: 'none', display: 'flex', alignItems: 'center',
                }}>
                  <UserIcon size={18} />
                </div>
                <input
                  type="text"
                  placeholder="Alex Johnson"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required={!isLogin}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem 0.75rem 2.75rem',
                    borderRadius: '12px',
                    border: '1px solid #E5E7EB',
                    fontSize: '0.9375rem',
                    background: 'white',
                    outline: 'none',
                    transition: 'all 0.15s',
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#7C3AED'}
                  onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
                />
              </div>
            </div>
          )}

          {/* Email field */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#374151' }}>Email Address</label>
            <div style={{ position: 'relative' }}>
              <div style={{
                position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)',
                color: '#9CA3AF', pointerEvents: 'none', display: 'flex', alignItems: 'center',
              }}>
                <Mail size={18} />
              </div>
              <input
                type="email"
                placeholder="alex@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem 0.75rem 2.75rem',
                  borderRadius: '12px',
                  border: '1px solid #E5E7EB',
                  fontSize: '0.9375rem',
                  background: 'white',
                  outline: 'none',
                  transition: 'all 0.15s',
                }}
                onFocus={(e) => e.target.style.borderColor = '#7C3AED'}
                onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
              />
            </div>
          </div>

          {/* Password field */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#374151' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <div style={{
                position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)',
                color: '#9CA3AF', pointerEvents: 'none', display: 'flex', alignItems: 'center',
              }}>
                <Lock size={18} />
              </div>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem 0.75rem 2.75rem',
                  borderRadius: '12px',
                  border: '1px solid #E5E7EB',
                  fontSize: '0.9375rem',
                  background: 'white',
                  outline: 'none',
                  transition: 'all 0.15s',
                }}
                onFocus={(e) => e.target.style.borderColor = '#7C3AED'}
                onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
              />
            </div>
          </div>

          {/* Role selection card grids (register only) */}
          {!isLogin && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#374151' }}>Choose Account Type</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                
                {/* Student role card */}
                <div
                  onClick={() => setRole('student')}
                  style={{
                    border: '2px solid ' + (role === 'student' ? '#7C3AED' : '#E5E7EB'),
                    background: role === 'student' ? '#FBF9FF' : 'white',
                    borderRadius: '14px',
                    padding: '0.875rem',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.25rem',
                  }}
                >
                  <GraduationCap size={22} color={role === 'student' ? '#7C3AED' : '#6B7280'} />
                  <span style={{ fontSize: '0.875rem', fontWeight: 700, color: role === 'student' ? '#7C3AED' : '#374151' }}>
                    Student
                  </span>
                  <span style={{ fontSize: '0.6875rem', color: '#9CA3AF' }}>Learn Adaptively</span>
                </div>

                {/* Teacher role card */}
                <div
                  onClick={() => setRole('teacher')}
                  style={{
                    border: '2px solid ' + (role === 'teacher' ? '#7C3AED' : '#E5E7EB'),
                    background: role === 'teacher' ? '#FBF9FF' : 'white',
                    borderRadius: '14px',
                    padding: '0.875rem',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.25rem',
                  }}
                >
                  <School size={22} color={role === 'teacher' ? '#7C3AED' : '#6B7280'} />
                  <span style={{ fontSize: '0.875rem', fontWeight: 700, color: role === 'teacher' ? '#7C3AED' : '#374151' }}>
                    Educator
                  </span>
                  <span style={{ fontSize: '0.6875rem', color: '#9CA3AF' }}>Manage & Track</span>
                </div>

              </div>
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={isLoading}
            style={{
              background: 'linear-gradient(135deg, #7C3AED 0%, #6366F1 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              padding: '0.875rem',
              fontSize: '0.9375rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              marginTop: '0.5rem',
              transition: 'opacity 0.15s',
              opacity: isLoading ? 0.7 : 1,
              boxShadow: '0 4px 12px rgba(124, 58, 237, 0.25)',
            }}
          >
            <span>{isLoading ? 'Processing...' : isLogin ? 'Access Portal' : 'Create Account'}</span>
            {!isLoading && <ArrowRight size={16} />}
          </button>
        </form>

        {/* Footer text */}
        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.8125rem', color: '#9CA3AF' }}>
          {isLogin ? (
            <span>
              Don't have an account?{' '}
              <span
                onClick={() => { setIsLogin(false); setError(null); }}
                style={{ color: '#7C3AED', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
              >
                Sign up
              </span>
            </span>
          ) : (
            <span>
              Already registered?{' '}
              <span
                onClick={() => { setIsLogin(true); setError(null); }}
                style={{ color: '#7C3AED', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
              >
                Log in
              </span>
            </span>
          )}
        </div>

      </div>
    </div>
  );
}
