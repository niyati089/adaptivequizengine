"use client";

import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ProctoringWarningModalProps {
  show: boolean;
  event: string;
  warnings: number;
  maxWarnings: number;
  exceeded: boolean;
  onDismiss: () => void;
}

export function ProctoringWarningModal({
  show,
  event,
  warnings,
  maxWarnings,
  exceeded,
  onDismiss
}: ProctoringWarningModalProps) {
  if (!show) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.6)',
      display: 'grid',
      placeItems: 'center',
      zIndex: 2000,
      animation: 'fadeIn 0.2s ease-in'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '1rem',
        padding: '2rem',
        maxWidth: '420px',
        width: '90%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        animation: 'slideUp 0.3s ease-out',
        border: exceeded ? '3px solid #dc2626' : '3px solid #f59e0b'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: exceeded ? '#fee2e2' : '#fef3c7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem'
          }}>
            <AlertTriangle size={40} color={exceeded ? '#dc2626' : '#d97706'} />
          </div>
          
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: 900,
            margin: '0 0 0.5rem',
            color: exceeded ? '#dc2626' : '#d97706'
          }}>
            {exceeded ? 'Warning Limit Exceeded!' : 'Proctoring Alert'}
          </h2>
          
          <p style={{
            fontSize: '1rem',
            color: '#6b7280',
            margin: '0 0 1rem',
            lineHeight: 1.5
          }}>
            We detected: <strong>{event}</strong>
          </p>
          
          <div style={{
            background: exceeded ? '#fee2e2' : '#fef3c7',
            borderRadius: '0.75rem',
            padding: '1rem',
            marginBottom: '1rem'
          }}>
            <div style={{
              fontSize: '2rem',
              fontWeight: 900,
              color: exceeded ? '#dc2626' : '#d97706',
              marginBottom: '0.25rem'
            }}>
              {warnings} / {maxWarnings}
            </div>
            <div style={{
              fontSize: '0.85rem',
              color: '#6b7280',
              fontWeight: 600,
              textTransform: 'uppercase'
            }}>
              Warnings Used
            </div>
          </div>
          
          {exceeded && (
            <p style={{
              fontSize: '0.9rem',
              color: '#dc2626',
              fontWeight: 700,
              margin: '0 0 1rem',
              background: '#fee2e2',
              padding: '0.75rem',
              borderRadius: '0.5rem'
            }}>
              Your teacher will be notified about this violation.
            </p>
          )}
          
          {!exceeded && (
            <p style={{
              fontSize: '0.85rem',
              color: '#6b7280',
              margin: '0 0 1rem'
            }}>
              Please maintain focus on your quiz to avoid further warnings.
            </p>
          )}
        </div>
        
        <button
          onClick={onDismiss}
          style={{
            width: '100%',
            padding: '1rem',
            borderRadius: '0.75rem',
            border: 'none',
            background: exceeded ? '#dc2626' : '#d97706',
            color: 'white',
            fontSize: '1rem',
            fontWeight: 800,
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'scale(1.02)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          {exceeded ? 'I Understand' : 'Continue Quiz'}
        </button>
      </div>
    </div>
  );
}
