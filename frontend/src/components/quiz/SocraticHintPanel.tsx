'use client';

import React, { useState, useRef } from 'react';
import { Lightbulb, ChevronDown, AlertCircle, CheckCircle2, Loader2, Volume2, Copy } from 'lucide-react';
import { SocraticHintResponse } from '@/hooks/useSocraticHints';

interface SocraticHintPanelProps {
 hints: SocraticHintResponse[];
 misconception?: string;
 isLoading?: boolean;
 error?: string;
 canEscalate?: boolean;
 onRequestHint?: () => void;
 onEscalateHint?: () => void;
 onTrackOutcome?: (helpful: boolean) => void;
}

const HINT_LEVEL_INFO = {
 1: { label: 'Nudge', description: 'A gentle nudge', color: '#3B82F6', bg: '#EFF6FF' },
 2: { label: 'Probe', description: 'A probing question', color: '#8B5CF6', bg: '#F5F3FF' },
 3: { label: 'Guidance', description: 'Helpful guidance', color: '#D97706', bg: '#FEF3C7' },
 4: { label: 'Step-by-Step', description: 'Scaffolded steps', color: '#DC2626', bg: '#FEE2E2' },
 5: { label: 'Explanation', description: 'Full explanation', color: '#059669', bg: '#ECFDF5' },
};

export const SocraticHintPanel: React.FC<SocraticHintPanelProps> = ({
 hints,
 misconception,
 isLoading = false,
 error,
 canEscalate = false,
 onRequestHint,
 onEscalateHint,
 onTrackOutcome,
}) => {
 const [expandedHints, setExpandedHints] = useState<Set<number>>(new Set());
 const [feedback, setFeedback] = useState<{ [key: string]: boolean }>({});
 const [showFeedback, setShowFeedback] = useState(false);
 const hintCounterRef = useRef(0);

 if (!hints || hints.length === 0) {
 return null;
 }

 const latestHint = hints[hints.length - 1];
 const hintLevelInfo = HINT_LEVEL_INFO[latestHint.hint_level as keyof typeof HINT_LEVEL_INFO] || HINT_LEVEL_INFO[3];

 const toggleExpanded = (index: number) => {
 const newExpanded = new Set(expandedHints);
 if (newExpanded.has(index)) {
 newExpanded.delete(index);
 } else {
 newExpanded.add(index);
 }
 setExpandedHints(newExpanded);
 };

 const handleFeedback = (helpful: boolean, hintId: string) => {
 setFeedback((prev) => ({ ...prev, [hintId]: helpful }));
 onTrackOutcome?.(helpful);
 setShowFeedback(true);

 // Hide feedback after 2 seconds
 setTimeout(() => {
 setShowFeedback(false);
 }, 2000);
 };

 const copyHintToClipboard = (text: string) => {
 navigator.clipboard.writeText(text);
 };

 const readHintAloud = (text: string) => {
 if ('speechSynthesis' in window) {
 const utterance = new SpeechSynthesisUtterance(text);
 speechSynthesis.speak(utterance);
 }
 };

 return (
 <div
 style={{
 background: hintLevelInfo.bg,
 border: `2px solid ${hintLevelInfo.color}`,
 borderRadius: '12px',
 padding: '1.25rem',
 marginBottom: '1.5rem',
 }}
 >
 {/* Header */}
 <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
 <div
 style={{
 width: '2.5rem',
 height: '2.5rem',
 background: hintLevelInfo.color,
 borderRadius: '8px',
 display: 'flex',
 alignItems: 'center',
 justifyContent: 'center',
 flexShrink: 0,
 }}
 >
 <Lightbulb size={18} color="white" />
 </div>
 <div style={{ flex: 1 }}>
 <div style={{ fontSize: '0.875rem', fontWeight: 600, color: hintLevelInfo.color, textTransform: 'uppercase' }}>
 Hint (Level {latestHint.hint_level}: {hintLevelInfo.label})
 </div>
 <div style={{ fontSize: '0.9rem', color: '#374151', fontWeight: 500, marginTop: '0.25rem' }}>
 {hintLevelInfo.description}
 </div>
 </div>
 </div>

 {/* Misconception Alert */}
 {misconception && (
 <div
 style={{
 padding: '0.75rem',
 background: '#FEF3C7',
 border: '1px solid #FDE68A',
 borderRadius: '8px',
 marginBottom: '1rem',
 display: 'flex',
 gap: '0.5rem',
 alignItems: 'flex-start',
 }}
 >
 <AlertCircle size={16} color="#D97706" style={{ marginTop: '2px', flexShrink: 0 }} />
 <div style={{ fontSize: '0.85rem', color: '#92400E' }}>
 <strong>Misconception detected:</strong> {misconception}
 </div>
 </div>
 )}

 {/* Current Hint */}
 <div style={{ marginBottom: '1rem' }}>
 <div
 style={{
 background: 'white',
 padding: '1rem',
 borderRadius: '8px',
 border: `1px solid ${hintLevelInfo.color}20`,
 marginBottom: '0.75rem',
 }}
 >
 <p style={{ fontSize: '0.95rem', color: '#111827', lineHeight: 1.6, margin: 0 }}>
 {latestHint.hint}
 </p>
 </div>

 {/* Hint Controls */}
 <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
 <button
 onClick={() => readHintAloud(latestHint.hint)}
 style={{
 display: 'inline-flex',
 alignItems: 'center',
 gap: '0.375rem',
 padding: '0.5rem 0.75rem',
 background: '#F3F4F6',
 border: '1px solid #D1D5DB',
 borderRadius: '6px',
 fontSize: '0.8125rem',
 fontWeight: 500,
 color: '#4B5563',
 cursor: 'pointer',
 transition: 'all 0.2s',
 }}
 onMouseOver={(e) => {
 e.currentTarget.style.background = '#E5E7EB';
 }}
 onMouseOut={(e) => {
 e.currentTarget.style.background = '#F3F4F6';
 }}
 >
 <Volume2 size={14} />
 Read Aloud
 </button>

 <button
 onClick={() => copyHintToClipboard(latestHint.hint)}
 style={{
 display: 'inline-flex',
 alignItems: 'center',
 gap: '0.375rem',
 padding: '0.5rem 0.75rem',
 background: '#F3F4F6',
 border: '1px solid #D1D5DB',
 borderRadius: '6px',
 fontSize: '0.8125rem',
 fontWeight: 500,
 color: '#4B5563',
 cursor: 'pointer',
 transition: 'all 0.2s',
 }}
 onMouseOver={(e) => {
 e.currentTarget.style.background = '#E5E7EB';
 }}
 onMouseOut={(e) => {
 e.currentTarget.style.background = '#F3F4F6';
 }}
 >
 <Copy size={14} />
 Copy
 </button>
 </div>
 </div>

 {/* Feedback Section */}
 <div
 style={{
 padding: '0.75rem',
 background: 'rgba(255,255,255,0.5)',
 borderRadius: '8px',
 marginBottom: '1rem',
 }}
 >
 <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#4B5563', marginBottom: '0.5rem' }}>
 Did this hint help?
 </div>
 <div style={{ display: 'flex', gap: '0.5rem' }}>
 <button
 onClick={() => handleFeedback(true, latestHint.hint_id)}
 disabled={isLoading || feedback[latestHint.hint_id] !== undefined}
 style={{
 display: 'inline-flex',
 alignItems: 'center',
 gap: '0.25rem',
 padding: '0.5rem 0.75rem',
 background: feedback[latestHint.hint_id] === true ? '#ECFDF5' : 'white',
 border: feedback[latestHint.hint_id] === true ? '1px solid #A7F3D0' : '1px solid #D1D5DB',
 borderRadius: '6px',
 fontSize: '0.8125rem',
 fontWeight: 500,
 color: feedback[latestHint.hint_id] === true ? '#047857' : '#4B5563',
 cursor: feedback[latestHint.hint_id] !== undefined ? 'default' : 'pointer',
 opacity: feedback[latestHint.hint_id] !== undefined ? 1 : 0.7,
 transition: 'all 0.2s',
 }}
 >
 <CheckCircle2 size={14} />
 Yes
 </button>

 <button
 onClick={() => handleFeedback(false, latestHint.hint_id)}
 disabled={isLoading || feedback[latestHint.hint_id] !== undefined}
 style={{
 display: 'inline-flex',
 alignItems: 'center',
 gap: '0.25rem',
 padding: '0.5rem 0.75rem',
 background: feedback[latestHint.hint_id] === false ? '#FEE2E2' : 'white',
 border: feedback[latestHint.hint_id] === false ? '1px solid #FECACA' : '1px solid #D1D5DB',
 borderRadius: '6px',
 fontSize: '0.8125rem',
 fontWeight: 500,
 color: feedback[latestHint.hint_id] === false ? '#991B1B' : '#4B5563',
 cursor: feedback[latestHint.hint_id] !== undefined ? 'default' : 'pointer',
 opacity: feedback[latestHint.hint_id] !== undefined ? 1 : 0.7,
 transition: 'all 0.2s',
 }}
 >
 <AlertCircle size={14} />
 No
 </button>

 {showFeedback && feedback[latestHint.hint_id] !== undefined && (
 <span
 style={{
 fontSize: '0.8125rem',
 color: feedback[latestHint.hint_id] ? '#047857' : '#991B1B',
 marginLeft: '0.5rem',
 }}
 >
 {feedback[latestHint.hint_id] ? '✓ Thanks for feedback!' : "✓ Got it, we'll improve"}
 </span>
 )}
 </div>
 </div>

 {/* Escalate to Next Level */}
 {canEscalate && latestHint.next_level_available && (
 <button
 onClick={onEscalateHint}
 disabled={isLoading}
 style={{
 width: '100%',
 display: 'inline-flex',
 alignItems: 'center',
 justifyContent: 'center',
 gap: '0.5rem',
 padding: '0.75rem',
 background: hintLevelInfo.color,
 color: 'white',
 border: 'none',
 borderRadius: '8px',
 fontWeight: 600,
 fontSize: '0.9rem',
 cursor: isLoading ? 'not-allowed' : 'pointer',
 opacity: isLoading ? 0.7 : 1,
 transition: 'all 0.2s',
 }}
 onMouseOver={(e) => !isLoading && (e.currentTarget.style.opacity = '0.9')}
 onMouseOut={(e) => !isLoading && (e.currentTarget.style.opacity = '1')}
 >
 {isLoading ? (
 <>
 <Loader2 size={16} className="animate-spin" />
 Getting next level...
 </>
 ) : (
 <>
 <ChevronDown size={16} />
 Get More Help (Level {latestHint.hint_level + 1})
 </>
 )}
 </button>
 )}

 {/* Hint History (collapsed) */}
 {hints.length > 1 && (
 <div style={{ marginTop: '1rem', borderTop: `1px solid ${hintLevelInfo.color}20`, paddingTop: '1rem' }}>
 <button
 onClick={() => toggleExpanded(hints.length - 1)}
 style={{
 display: 'flex',
 alignItems: 'center',
 gap: '0.5rem',
 fontSize: '0.8125rem',
 fontWeight: 600,
 color: hintLevelInfo.color,
 background: 'transparent',
 border: 'none',
 cursor: 'pointer',
 padding: 0,
 }}
 >
 <ChevronDown
 size={16}
 style={{
 transform: expandedHints.has(hints.length - 1) ? 'rotate(180deg)' : 'rotate(0deg)',
 transition: 'transform 0.2s',
 }}
 />
 Previous hints ({hints.length - 1})
 </button>

 {expandedHints.has(hints.length - 1) && (
 <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
 {hints.slice(0, -1).map((hint, index) => {
 const hintInfo = HINT_LEVEL_INFO[hint.hint_level as keyof typeof HINT_LEVEL_INFO] || HINT_LEVEL_INFO[3];
 return (
 <div
 key={index}
 style={{
 padding: '0.75rem',
 background: hintInfo.bg,
 border: `1px solid ${hintInfo.color}40`,
 borderRadius: '6px',
 fontSize: '0.85rem',
 color: '#374151',
 lineHeight: 1.5,
 }}
 >
 <div style={{ fontSize: '0.75rem', fontWeight: 600, color: hintInfo.color, marginBottom: '0.25rem' }}>
 Level {hint.hint_level}: {hintInfo.label}
 </div>
 {hint.hint}
 </div>
 );
 })}
 </div>
 )}
 </div>
 )}

 {error && (
 <div
 style={{
 marginTop: '1rem',
 padding: '0.75rem',
 background: '#FEE2E2',
 border: '1px solid #FECACA',
 borderRadius: '8px',
 fontSize: '0.85rem',
 color: '#991B1B',
 display: 'flex',
 gap: '0.5rem',
 alignItems: 'flex-start',
 }}
 >
 <AlertCircle size={16} style={{ marginTop: '2px', flexShrink: 0 }} />
 <span>{error}</span>
 </div>
 )}
 </div>
 );
};
