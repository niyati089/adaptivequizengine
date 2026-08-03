"use client";

import React, { useEffect } from 'react';
import { AlertTriangle, Eye, Clipboard, Monitor, Maximize, X, ShieldAlert } from 'lucide-react';
import { ViolationType, ViolationEvent } from '@/hooks/useBrowserMonitoring';

interface WarningModalProps {
 isVisible: boolean;
 isLocked: boolean;
 lastViolation: ViolationEvent | null;
 warningsCount: number;
 maxWarnings: number;
 onDismiss: () => void;
 onEndQuiz: () => void;
}

const VIOLATION_CONFIG: Record<ViolationType, { icon: React.ReactNode; label: string; color: string; bg: string }> = {
 TAB_SWITCH: {
 icon: <Eye size={28} />,
 label: 'Tab Switch Detected',
 color: '#D97706',
 bg: '#FEF3C7',
 },
 WINDOW_BLUR: {
 icon: <Monitor size={28} />,
 label: 'Window Focus Lost',
 color: '#DC2626',
 bg: '#FEF2F2',
 },
 COPY_ATTEMPT: {
 icon: <Clipboard size={28} />,
 label: 'Copy Attempt Blocked',
 color: '#7C3AED',
 bg: '#EDE9FE',
 },
 PASTE_ATTEMPT: {
 icon: <Clipboard size={28} />,
 label: 'Paste Attempt Blocked',
 color: '#7C3AED',
 bg: '#EDE9FE',
 },
 FULLSCREEN_EXIT: {
 icon: <Maximize size={28} />,
 label: 'Fullscreen Exited',
 color: '#DC2626',
 bg: '#FEF2F2',
 },
};

export function WarningModal({
 isVisible,
 isLocked,
 lastViolation,
 warningsCount,
 maxWarnings,
 onDismiss,
 onEndQuiz,
}: WarningModalProps) {
 // Prevent background scroll while modal is open
 useEffect(() => {
 if (isVisible) {
 document.body.style.overflow = 'hidden';
 } else {
 document.body.style.overflow = '';
 }
 return () => { document.body.style.overflow = ''; };
 }, [isVisible]);

 if (!isVisible || !lastViolation) return null;

 const config = VIOLATION_CONFIG[lastViolation.type];
 const remaining = maxWarnings - warningsCount;
 const isLastWarning = remaining === 0;

 return (
 /* Backdrop */
 <div style={{
 position: 'fixed',
 inset: 0,
 zIndex: 9999,
 display: 'flex',
 alignItems: 'center',
 justifyContent: 'center',
 background: 'rgba(0, 0, 0, 0.65)',
 backdropFilter: 'blur(4px)',
 animation: 'fadeIn 0.2s ease',
 padding: '1rem',
 }}>
 {/* Modal card */}
 <div style={{
 background: 'white',
 borderRadius: '20px',
 boxShadow: '0 25px 60px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(0,0,0,0.05)',
 width: '100%',
 maxWidth: '440px',
 overflow: 'hidden',
 animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
 }}>

 {/* Colored header strip */}
 <div style={{
 background: isLocked
 ? 'linear-gradient(135deg, #7F1D1D, #DC2626)'
 : `linear-gradient(135deg, ${config.color}22, ${config.color}11)`,
 padding: '2rem 1.75rem 1.5rem',
 borderBottom: `1px solid ${isLocked ? '#FCA5A5' : config.color}22`,
 textAlign: 'center',
 }}>
 {/* Icon circle */}
 <div style={{
 width: '64px',
 height: '64px',
 borderRadius: '50%',
 background: isLocked ? '#FEF2F2' : config.bg,
 color: isLocked ? '#DC2626' : config.color,
 display: 'flex',
 alignItems: 'center',
 justifyContent: 'center',
 margin: '0 auto 1rem',
 boxShadow: `0 0 0 8px ${isLocked ? '#FEE2E2' : config.bg}88`,
 }}>
 {isLocked ? <ShieldAlert size={28} /> : config.icon}
 </div>

 <h2 style={{
 fontSize: '1.25rem',
 fontWeight: 800,
 color: isLocked ? '#7F1D1D' : '#111827',
 margin: '0 0 0.375rem',
 letterSpacing: '-0.01em',
 }}>
 {isLocked ? '️ Quiz Locked' : config.label}
 </h2>

 <p style={{ fontSize: '0.875rem', color: '#6B7280', margin: 0, lineHeight: 1.5 }}>
 {isLocked
 ? 'You have exceeded the maximum number of integrity violations. Your session has been terminated.'
 : lastViolation.message}
 </p>
 </div>

 {/* Body */}
 <div style={{ padding: '1.5rem 1.75rem' }}>
 {/* Warning count pills */}
 {!isLocked && (
 <div style={{ marginBottom: '1.5rem' }}>
 <div style={{
 display: 'flex',
 justifyContent: 'space-between',
 alignItems: 'center',
 marginBottom: '0.5rem',
 }}>
 <span style={{ fontSize: '0.8125rem', color: '#6B7280', fontWeight: 500 }}>
 Integrity Violations
 </span>
 <span style={{
 fontSize: '0.8125rem',
 fontWeight: 700,
 color: isLastWarning ? '#DC2626' : '#D97706',
 }}>
 {warningsCount} / {maxWarnings}
 </span>
 </div>

 {/* Progress bar */}
 <div style={{ display: 'flex', gap: '6px' }}>
 {Array.from({ length: maxWarnings }).map((_, i) => (
 <div
 key={i}
 style={{
 flex: 1,
 height: '6px',
 borderRadius: '9999px',
 background: i < warningsCount
 ? (i === maxWarnings - 1 ? '#DC2626' : '#F59E0B')
 : '#F3F4F6',
 transition: 'background 0.3s ease',
 }}
 />
 ))}
 </div>

 <p style={{
 fontSize: '0.8125rem',
 color: isLastWarning ? '#DC2626' : '#92400E',
 fontWeight: 600,
 marginTop: '0.625rem',
 background: isLastWarning ? '#FEF2F2' : '#FEF3C7',
 padding: '0.5rem 0.75rem',
 borderRadius: '8px',
 textAlign: 'center',
 }}>
 {isLastWarning
 ? ' Final warning! One more violation will lock the quiz.'
 : `️ ${remaining} warning${remaining !== 1 ? 's' : ''} remaining before auto-lock.`}
 </p>
 </div>
 )}

 {/* Policy reminder */}
 <div style={{
 background: '#F9FAFB',
 borderRadius: '10px',
 padding: '0.875rem',
 marginBottom: '1.25rem',
 fontSize: '0.8125rem',
 color: '#374151',
 lineHeight: 1.6,
 border: '1px solid #E5E7EB',
 }}>
 <strong style={{ display: 'block', marginBottom: '0.25rem', color: '#111827' }}>
 Academic Integrity Policy
 </strong>
 Tab switching, window minimization, and copying content are prohibited during this quiz.
 All violations are logged and visible to your educator.
 </div>

 {/* Buttons */}
 <div style={{ display: 'flex', gap: '0.75rem' }}>
 {!isLocked && (
 <button
 onClick={onDismiss}
 style={{
 flex: 1,
 padding: '0.75rem',
 borderRadius: '10px',
 border: '1.5px solid #E5E7EB',
 background: 'white',
 color: '#374151',
 fontWeight: 600,
 fontSize: '0.9375rem',
 cursor: 'pointer',
 transition: 'all 0.15s ease',
 }}
 onMouseEnter={e => (e.currentTarget.style.background = '#F9FAFB')}
 onMouseLeave={e => (e.currentTarget.style.background = 'white')}
 >
 I Understand
 </button>
 )}
 <button
 onClick={onEndQuiz}
 style={{
 flex: isLocked ? 1 : 0,
 padding: '0.75rem 1.25rem',
 borderRadius: '10px',
 border: 'none',
 background: 'linear-gradient(135deg, #DC2626, #B91C1C)',
 color: 'white',
 fontWeight: 700,
 fontSize: '0.9375rem',
 cursor: 'pointer',
 whiteSpace: 'nowrap',
 boxShadow: '0 2px 8px rgba(220, 38, 38, 0.35)',
 }}
 >
 {isLocked ? 'Return to Dashboard' : 'End Quiz'}
 </button>
 </div>
 </div>
 </div>

 <style>{`
 @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
 @keyframes slideUp {
 from { opacity: 0; transform: translateY(24px) scale(0.97) }
 to { opacity: 1; transform: translateY(0) scale(1) }
 }
 `}</style>
 </div>
 );
}
