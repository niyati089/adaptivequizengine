"use client";

import React, { useEffect, useRef } from 'react';
import { AlertTriangle, Eye, EyeOff, Minimize2, Smartphone, FileText } from 'lucide-react';

interface DetectionStatus {
  faceDetected: boolean;
  multiplePeople: boolean;
  phoneDetected: boolean;
  paperDetected: boolean;
  lookingAway: boolean;
  violations: string[];
}

interface ProctoringPreviewProps {
  stream: MediaStream | null;
  status: DetectionStatus;
  onMinimize?: () => void;
  isMinimized?: boolean;
}

export function ProctoringPreview({
  stream,
  status,
  onMinimize,
  isMinimized = false
}: ProctoringPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  if (!stream) return null;

  const hasViolations = status.violations.length > 0;
  const borderColor = hasViolations ? '#ef4444' : status.faceDetected ? '#10b981' : '#f59e0b';

  if (isMinimized) {
    return (
      <div style={{ position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 1000 }}>
        <button
          onClick={onMinimize}
          style={{
            width: '4rem',
            height: '4rem',
            borderRadius: '50%',
            background: borderColor,
            border: '3px solid white',
            boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s',
            position: 'relative'
          }}
          title={hasViolations ? status.violations.join(', ') : "Proctoring active"}
        >
          <Eye size={24} color="white" />
          {hasViolations && (
            <span style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              background: '#dc2626',
              color: 'white',
              fontSize: '11px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {status.violations.length}
            </span>
          )}
        </button>
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '1.5rem',
      right: '1.5rem',
      zIndex: 1000,
      borderRadius: '1rem',
      overflow: 'hidden',
      boxShadow: '0 12px 32px rgba(0,0,0,0.4)',
      border: `3px solid ${borderColor}`,
      background: '#000',
      transition: 'border-color 0.3s',
      width: '280px'
    }}>
      {/* Video feed */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          width: '100%',
          height: '210px',
          objectFit: 'cover',
          display: 'block'
        }}
      />

      {/* Status overlay */}
      <div style={{
        position: 'absolute',
        top: '0.75rem',
        left: '0.75rem',
        right: '0.75rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem'
      }}>
        {/* Main status */}
        <div style={{
          padding: '0.5rem 0.75rem',
          borderRadius: '0.5rem',
          background: hasViolations
            ? 'rgba(239, 68, 68, 0.95)'
            : status.faceDetected
              ? 'rgba(16, 185, 129, 0.95)'
              : 'rgba(245, 158, 11, 0.95)',
          color: 'white',
          fontSize: '0.75rem',
          fontWeight: 800,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <div style={{
            width: '0.5rem',
            height: '0.5rem',
            borderRadius: '50%',
            background: 'white',
            animation: hasViolations ? 'pulse 1s infinite' : 'none'
          }} />
          {hasViolations ? 'VIOLATION DETECTED' : status.faceDetected ? 'MONITORED' : 'NO FACE'}
        </div>

        {/* Violation indicators */}
        {(status.multiplePeople || status.phoneDetected || status.paperDetected || status.lookingAway) && (
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.4rem'
          }}>
            {status.multiplePeople && (
              <div style={{
                padding: '0.3rem 0.5rem',
                borderRadius: '0.4rem',
                background: 'rgba(239, 68, 68, 0.95)',
                color: 'white',
                fontSize: '0.65rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem'
              }}>
                <AlertTriangle size={12} />
                Multiple People
              </div>
            )}
            {status.phoneDetected && (
              <div style={{
                padding: '0.3rem 0.5rem',
                borderRadius: '0.4rem',
                background: 'rgba(239, 68, 68, 0.95)',
                color: 'white',
                fontSize: '0.65rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem'
              }}>
                <Smartphone size={12} />
                Phone
              </div>
            )}
            {status.paperDetected && (
              <div style={{
                padding: '0.3rem 0.5rem',
                borderRadius: '0.4rem',
                background: 'rgba(239, 68, 68, 0.95)',
                color: 'white',
                fontSize: '0.65rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem'
              }}>
                <FileText size={12} />
                Notes
              </div>
            )}
            {status.lookingAway && (
              <div style={{
                padding: '0.3rem 0.5rem',
                borderRadius: '0.4rem',
                background: 'rgba(245, 158, 11, 0.95)',
                color: 'white',
                fontSize: '0.65rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem'
              }}>
                <EyeOff size={12} />
                Looking Away
              </div>
            )}
          </div>
        )}
      </div>

      {/* Controls */}
      <div style={{
        position: 'absolute',
        bottom: '0.75rem',
        right: '0.75rem'
      }}>
        <button
          onClick={onMinimize}
          style={{
            padding: '0.5rem',
            borderRadius: '0.5rem',
            background: 'rgba(0, 0, 0, 0.8)',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title="Minimize"
        >
          <Minimize2 size={16} color="white" />
        </button>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
