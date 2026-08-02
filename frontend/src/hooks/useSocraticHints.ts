'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';

export interface SocraticHintResponse {
  hint: string;
  hint_id: string;
  hint_level: number;
  hint_level_label: string;
  hint_type: string;
  misconception?: string;
  next_level_available: boolean;
  dialogue_turn: number;
  learner_theta: number;
  confidence: number;
}

export interface HintSessionState {
  session_id: string;
  question: string;
  correct_answer: string;
  hints: SocraticHintResponse[];
  misconception?: string;
  is_loading: boolean;
  error?: string;
}

export const useSocraticHints = (apiInstance?: any) => {
  const [session, setSession] = useState<HintSessionState | null>(null);
  const [isLoadingHint, setIsLoadingHint] = useState(false);
  const [hintError, setHintError] = useState<string | null>(null);
  const sessionTimerRef = useRef<NodeJS.Timeout>();
  const apiRef = useRef(apiInstance);

  // Update apiRef when apiInstance changes
  useEffect(() => {
    apiRef.current = apiInstance;
  }, [apiInstance]);

  // Initialize session when user answers incorrectly
  const initializeSession = useCallback(
    (questionData: {
      questionId?: string;
      question: string;
      userAnswer: string;
      correctAnswer: string;
      topic?: string;
      subtopic?: string;
      theta?: number;
      difficulty?: number;
      questionOptions?: Record<string, string>;
      misconceptions?: Record<string, string>;
      bloomLevel?: string;
    }) => {
      const sessionId = `hint_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setSession({
        session_id: sessionId,
        question: questionData.question,
        correct_answer: questionData.correctAnswer,
        hints: [],
        is_loading: false,
      });

      // Clear any existing timer
      if (sessionTimerRef.current) {
        clearTimeout(sessionTimerRef.current);
      }

      // Auto-clear session after 10 minutes of inactivity
      sessionTimerRef.current = setTimeout(() => {
        setSession(null);
      }, 10 * 60 * 1000);
    },
    []
  );

  // Request adaptive hint
  const requestHint = useCallback(
    async () => {
      setIsLoadingHint(true);
      setHintError(null);

      try {
        if (!session?.session_id) {
          setHintError('No session initialized');
          setIsLoadingHint(false);
          return null;
        }

        if (!apiRef.current) {
          setHintError('API instance not available');
          setIsLoadingHint(false);
          return null;
        }

        const response = await apiRef.current.post('/socratic-advanced/hint-adaptive', {
          question: session.question,
          user_answer: session.question, // placeholder
          correct_answer: session.correct_answer,
          theta: 0,
          confidence: 3,
          session_id: session.session_id,
        });

        const hintData: SocraticHintResponse = response.data;

        // Update session with new hint using current session state
        setSession((prevSession) => {
          if (!prevSession) return prevSession;
          return {
            ...prevSession,
            hints: [...prevSession.hints, hintData],
            misconception: hintData.misconception || prevSession.misconception,
          };
        });

        return hintData;
      } catch (error: any) {
        const errorMsg = error?.response?.data?.detail || error?.message || 'Failed to get hint';
        setHintError(errorMsg);
        console.error('Error requesting hint:', errorMsg);
        return null;
      } finally {
        setIsLoadingHint(false);
      }
    },
    [session?.session_id, session?.question, session?.correct_answer]
  );

  // Escalate to next hint level
  const escalateHint = useCallback(
    async () => {
      setIsLoadingHint(true);
      setHintError(null);

      try {
        if (!session?.session_id) {
          setHintError('No session initialized');
          setIsLoadingHint(false);
          return null;
        }

        if (!apiRef.current) {
          setHintError('API instance not available');
          setIsLoadingHint(false);
          return null;
        }

        const response = await apiRef.current.post(`/socratic-advanced/hint-escalate?session_id=${session.session_id}`, {
          question: session.question,
          user_answer: session.question,
          correct_answer: session.correct_answer,
          theta: 0,
          confidence: 3,
        });

        const hintData: SocraticHintResponse = response.data;

        // Update session with new hint using current session state
        setSession((prevSession) => {
          if (!prevSession) return prevSession;
          return {
            ...prevSession,
            hints: [...prevSession.hints, hintData],
            misconception: hintData.misconception || prevSession.misconception,
          };
        });

        return {
          ...hintData,
          is_final_hint: hintData.hint.startsWith('The answer is:'),
        };
      } catch (error: any) {
        const errorMsg = error?.response?.data?.detail || error?.message || 'Failed to escalate hint';
        setHintError(errorMsg);
        console.error('Error escalating hint:', errorMsg);
        return null;
      } finally {
        setIsLoadingHint(false);
      }
    },
    [session?.session_id, session?.question, session?.correct_answer]
  );

  // Track hint effectiveness
  const trackHintOutcome = useCallback(
    async (didHelp: boolean, timeToUnderstand?: number) => {
      if (!session || session.hints.length === 0) {
        console.warn('Missing session or last hint for tracking outcome');
        return null;
      }

      if (!apiRef.current) {
        console.warn('API instance not available for tracking hint outcome');
        return null;
      }

      const lastHint = session.hints[session.hints.length - 1];

      try {
        const response = await apiRef.current.post('/socratic-advanced/hint-outcome', {
          hint_id: lastHint.hint_id,
          did_help: didHelp,
          time_to_understand: timeToUnderstand || 5,
          hint_level: lastHint.hint_level,
        });

        return response.data;
      } catch (error: any) {
        console.error('Error tracking hint outcome:', error);
        return null;
      }
    },
    [session?.hints]
  );

  // Clear session
  const clearSession = useCallback(async () => {
    // Use the current session state directly via closure
    setSession((prevSession) => {
      if (prevSession && apiRef.current) {
        // Make the delete call
        apiRef.current.delete(`/socratic-advanced/session/${prevSession.session_id}`).catch((error: any) => {
          console.warn('Error clearing session:', error);
        });
      }
      return null;
    });

    setHintError(null);

    if (sessionTimerRef.current) {
      clearTimeout(sessionTimerRef.current);
    }
  }, []);

  // Get current hint level
  const getCurrentHintLevel = useCallback((): number | null => {
    if (!session || session.hints.length === 0) {
      return null;
    }
    return session.hints[session.hints.length - 1].hint_level;
  }, [session]);

  // Can escalate?
  const canEscalate = useCallback((): boolean => {
    if (!session || session.hints.length === 0) {
      return true; // Can get first hint
    }
    return session.hints[session.hints.length - 1].next_level_available;
  }, [session]);

  return {
    session,
    isLoadingHint,
    hintError,
    initializeSession,
    requestHint,
    escalateHint,
    trackHintOutcome,
    clearSession,
    getCurrentHintLevel,
    canEscalate,
  };
};
