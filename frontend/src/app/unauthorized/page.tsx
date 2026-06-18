"use client";

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';
import Link from 'next/link';

export default function UnauthorizedPage() {
  const { user } = useAuth();

  return (
    <div style={{
      minHeight: 'calc(100vh - 4rem)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#FAFAFC',
      padding: '2rem 1.5rem',
    }}>
      <div style={{
        background: 'white',
        border: '1px solid #E5E7EB',
        borderRadius: '24px',
        boxShadow: '0 10px 30px -10px rgba(0,0,0,0.04)',
        width: '100%',
        maxWidth: '32rem',
        padding: '3rem 2rem',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}>
        {/* Shield Icon */}
        <div style={{
          width: '4.5rem', height: '4.5rem',
          background: '#FEE2E2',
          borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#EF4444',
          marginBottom: '1.5rem',
        }}>
          <ShieldAlert size={36} />
        </div>

        {/* Title */}
        <h1 style={{
          fontSize: '1.75rem',
          fontWeight: 800,
          color: '#111827',
          letterSpacing: '-0.025em',
          margin: '0 0 0.5rem 0',
        }}>
          Access Denied
        </h1>

        {/* Description */}
        <p style={{
          fontSize: '0.9375rem',
          color: '#4B5563',
          lineHeight: '1.5rem',
          maxWidth: '24rem',
          margin: '0 0 2rem 0',
        }}>
          You do not have the required permissions to view this section.
          {user ? (
            <span> You are logged in as a <strong style={{ color: '#7C3AED', textTransform: 'capitalize' }}>{user.role}</strong>.</span>
          ) : (
            <span> Please register or sign in to access your portal.</span>
          )}
        </p>

        {/* Navigation CTAs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%', maxWidth: '20rem' }}>
          {user ? (
            <Link
              href={user.role === 'teacher' ? '/educator' : '/dashboard'}
              style={{
                background: '#7C3AED',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                padding: '0.75rem 1.5rem',
                fontSize: '0.9375rem',
                fontWeight: 600,
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 12px rgba(124, 58, 237, 0.15)',
              }}
            >
              <ArrowLeft size={16} />
              <span>Back to Dashboard</span>
            </Link>
          ) : (
            <Link
              href="/login"
              style={{
                background: '#7C3AED',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                padding: '0.75rem 1.5rem',
                fontSize: '0.9375rem',
                fontWeight: 600,
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 12px rgba(124, 58, 237, 0.15)',
              }}
            >
              <span>Sign In</span>
            </Link>
          )}

          <Link
            href="/"
            style={{
              background: 'white',
              border: '1px solid #E5E7EB',
              color: '#374151',
              borderRadius: '12px',
              padding: '0.75rem 1.5rem',
              fontSize: '0.9375rem',
              fontWeight: 600,
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
            }}
          >
            <Home size={16} />
            <span>Go to Homepage</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
