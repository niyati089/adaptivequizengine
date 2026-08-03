"use client";

import React, { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { getMisconceptionWatchlist } from '@/services/quizService';
import { DancingSquares } from '@/components/shared/DancingSquares';

interface WatchlistItem {
  tag: string;
  label: string;
  description: string;
  count: number;
  last_seen: string | null;
  topics: string[];
}

const formatLastSeen = (value: string | null) => {
  if (!value) return 'No recent attempts';
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date(value));
};

const severityColor = (count: number) => {
  if (count >= 3) return 'var(--coral)';
  if (count === 2) return '#d97706';
  return 'var(--green)';
};

export const MisconceptionWatchlist: React.FC = () => {
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getMisconceptionWatchlist()
      .then((data) => {
        if (!cancelled) {
          setItems(data.watchlist || []);
          setError(false);
        }
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="card" style={{ background: 'rgba(255, 218, 219, 0.34)', border: '1px solid rgba(255, 178, 183, 0.42)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
        <AlertTriangle size={18} color="var(--coral)" />
        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#111827', margin: 0 }}>Misconception Watchlist</h2>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#6B7280', fontSize: '0.875rem' }}>
          <DancingSquares size="sm" inline label="Loading patterns..." />
        </div>
      ) : error ? (
        <p style={{ fontSize: '0.875rem', color: '#6B7280', margin: 0 }}>Sign in to view your misconception patterns.</p>
      ) : items.length === 0 ? (
        <p style={{ fontSize: '0.875rem', color: '#6B7280', margin: 0 }}>No recurring misconception patterns yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {items.map((item) => (
            <div key={item.tag} style={{ display: 'flex', gap: '0.75rem', padding: '0.9rem', background: 'rgba(255,255,255,0.72)', border: '1px solid rgba(255,255,255,0.82)', borderRadius: '1rem', alignItems: 'flex-start' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: severityColor(item.count), marginTop: '5px', flexShrink: 0 }} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#111827' }}>
                  {item.label}
                </div>
                <div style={{ fontSize: '0.8125rem', color: '#6B7280', lineHeight: 1.5 }}>
                  {item.count} flagged {item.count === 1 ? 'attempt' : 'attempts'} · Last seen {formatLastSeen(item.last_seen)}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#9CA3AF', marginTop: '0.25rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {(item.topics || []).slice(0, 3).join(', ') || 'General practice'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
