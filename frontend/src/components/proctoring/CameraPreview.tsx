"use client";

import React, { useEffect, useRef } from 'react';
import { Minimize2, Video, VideoOff } from 'lucide-react';

interface CameraPreviewProps {
  stream: MediaStream | null;
  faceDetected: boolean;
  onMinimize?: () => void;
  isMinimized?: boolean;
}

export function CameraPreview({
  stream,
  faceDetected,
  onMinimize,
  isMinimized = false
}: CameraPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  if (!stream) {
    return null;
  }

  if (isMinimized) {
    return (
      <div
        style={{
          position: 'fixed',
          bottom: '1.5rem',
          right: '1.5rem',
          zIndex: 1000
        }}
      >
        <button
          onClick={onMinimize}
          style={{
            width: '3.5rem',
            height: '3.5rem',
            borderRadius: '50%',
            background: faceDetected ? '#10b981' : '#ef4444',
            border: '3px solid white',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          title={faceDetected ? "Face detected" : "No face detected"}
        >
          {faceDetected ? (
            <Video size={20} color="white" />
          ) : (
            <VideoOff size={20} color="white" />
          )}
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '1.5rem',
        right: '1.5rem',
        zIndex: 1000,
        borderRadius: '1rem',
        overflow: 'hidden',
        boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
        border: `3px solid ${faceDetected ? '#10b981' : '#ef4444'}`,
        background: '#000',
        transition: 'border-color 0.3s'
      }}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          width: '240px',
          height: '180px',
          objectFit: 'cover',
          display: 'block'
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '0.75rem',
          left: '0.75rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 0.75rem',
          borderRadius: '0.5rem',
          background: faceDetected ? 'rgba(16, 185, 129, 0.9)' : 'rgba(239, 68, 68, 0.9)',
          color: 'white',
          fontSize: '0.75rem',
          fontWeight: 700,
          transition: 'all 0.3s'
        }}
      >
        <div
          style={{
            width: '0.5rem',
            height: '0.5rem',
            borderRadius: '50%',
            background: 'white',
            animation: faceDetected ? 'none' : 'pulse 2s infinite'
          }}
        />
        {faceDetected ? 'Face Detected' : 'No Face'}
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: '0.75rem',
          right: '0.75rem'
        }}
      >
        <button
          onClick={onMinimize}
          style={{
            padding: '0.5rem',
            borderRadius: '0.5rem',
            background: 'rgba(0, 0, 0, 0.7)',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.2s'
          }}
          title="Minimize preview"
        >
          <Minimize2 size={16} color="white" />
        </button>
      </div>
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
