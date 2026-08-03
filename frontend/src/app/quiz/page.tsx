"use client";

import React, { Suspense, useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { BarChart2, CheckCircle, ChevronRight, Clock, Lightbulb, XCircle, AlertTriangle, Loader2, Trophy, Target, Brain, Home, RotateCcw, ChevronDown, Flame, Shield, BookOpen, Sparkles, Camera, TrendingUp } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { generateQuestion, generateTopicDag, getClassQuiz, getExplanation, getSocraticHint, recordProctoringEvent, scheduleReview, submitAnswer } from "@/services/quizService";
import { DancingSquares } from "@/components/shared/DancingSquares";
import { MermaidDiagram } from "@/components/shared/MermaidDiagram";
import { useProctoring } from "@/hooks/useProctoring";
import { ProctoringPreview } from "@/components/proctoring/ProctoringPreview";
import { ProctoringWarningModal } from "@/components/proctoring/ProctoringWarningModal";
import { Modal } from "@/components/shared/Modal";
import { SocraticHintPanel } from "@/components/quiz/SocraticHintPanel";
import { api } from "@/services/api";

interface QuestionRecord {
  question: string;
  subtopic: string;
  concept: string;
  correct: boolean;
  bloomLevel: string;
}



interface QuestionRecord {
  question: string;
  subtopic: string;
  concept: string;
  correct: boolean;
  bloomLevel: string;
}

function QuizContent() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedTopic = searchParams.get("topic") || "Computer Science";
  const classroomQuizId = searchParams.get("classroomQuizId");

  const [quizState, setQuizState] = useState<"setup" | "playing" | "results">("setup");
  const [inputTopic, setInputTopic] = useState(selectedTopic || "");
  const [dagData, setDagData] = useState<any>(null);
  const [isLoadingDag, setIsLoadingDag] = useState(false);
  const [selectedSubtopic, setSelectedSubtopic] = useState("");
  const [classQuiz, setClassQuiz] = useState<any>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [qIndex, setQIndex] = useState(0);
  const [q, setQ] = useState<any>(null);
  const [theta, setTheta] = useState(0.0);
  const [bloomLevel, setBloomLevel] = useState("Remembering");
  const [difficulty, setDifficulty] = useState(0.5);
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [timer, setTimer] = useState(60);
  const [isGenLoading, setIsGenLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<any>(null);
  const [showHint, setShowHint] = useState(false);
  const [hintLoading, setHintLoading] = useState(false);
  const [aiHint, setAiHint] = useState("");
  const [showExplanation, setShowExplanation] = useState(false);
  const [expLoading, setExpLoading] = useState(false);
  const [aiExplanation, setAiExplanation] = useState("");

  const isClassroomQuiz = !!classroomQuizId;
  const targetQuestions = isClassroomQuiz ? (classQuiz?.num_questions || 10) : null;
  const canEndTest = !isClassroomQuiz && qIndex >= 9;
  
  // Diagram states
  const [aiDiagramSyntax, setAiDiagramSyntax] = useState<string | null>(null);
  const [aiDiagramUrl, setAiDiagramUrl] = useState("");
  const [showSidebarDiagram, setShowSidebarDiagram] = useState(false);

  // Results states
  const [score, setScore] = useState(0);
  const [questionHistory, setQuestionHistory] = useState<QuestionRecord[]>([]);

  const [askedQuestions, setAskedQuestions] = useState<string[]>([]);
  const [misconceptionTags, setMisconceptionTags] = useState<string[]>([]);
  const [startTheta, setStartTheta] = useState(0.0);

  // Proctoring state
  const [proctoringEnabled, setProctoringEnabled] = useState(false);
  const [proctoringWarnings, setProctoringWarnings] = useState(0);
  const [maxProctoringWarnings, setMaxProctoringWarnings] = useState(3);
  const [showProctoringWarning, setShowProctoringWarning] = useState(false);
  const [proctoringExceeded, setProctoringExceeded] = useState(false);
  const [lastProctoringEvent, setLastProctoringEvent] = useState("");
  const [cameraMinimized, setCameraMinimized] = useState(false);
  
  // Redesigned UI states
  const [xp, setXp] = useState(0);
  const [xpGained, setXpGained] = useState(0);
  const [oldTheta, setOldTheta] = useState(0.0);
  const [activeTab, setActiveTab] = useState<"learn" | "hint" | "visual" | "integrity">("learn");
  const [aiKeyTakeaway, setAiKeyTakeaway] = useState("");
  const [aiExample, setAiExample] = useState("");
  const [aiCommonMistake, setAiCommonMistake] = useState("");
  
  // Hint states (legacy 2-level)
  const [hintLevel, setHintLevel] = useState(1);
  const [aiHint2, setAiHint2] = useState("");
  const [hint2Loading, setHint2Loading] = useState(false);

  // 5-level advanced Socratic hint session state
  const [socraticSession, setSocraticSession] = useState<any>(null);
  const [isLoadingAdvancedHint, setIsLoadingAdvancedHint] = useState(false);
  const [advancedHintError, setAdvancedHintError] = useState<string | undefined>();
  
  // Initialize proctoring hook with enabled state
  const proctoring = useProctoring(proctoringEnabled);

  useEffect(() => {
    if (!isLoading) {
      if (!user) router.push("/login");
      else if (user.role !== "student") router.push("/classes");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (!classroomQuizId || !user || user.role !== "student") return;

    const loadClassQuiz = async () => {
      try {
        const quiz = await getClassQuiz(Number(classroomQuizId));
        setClassQuiz(quiz);
        setInputTopic(quiz.topic);
        setSelectedSubtopic(quiz.subtopic || "General");
        setBloomLevel(quiz.bloom_level || "Remembering");
        setDifficulty(quiz.starting_difficulty || 0);
        setProctoringEnabled(quiz.enable_proctoring || false);
        setMaxProctoringWarnings(quiz.max_proctoring_warnings || 3);
      } catch (e) {
        console.error("Failed to load class quiz:", e);
        setMessage("Failed to load quiz. Please try again.");
      }
    };

    loadClassQuiz();
  }, [classroomQuizId, user]);

  const fetchNextQuestion = async (currentTheta: number) => {
    setIsGenLoading(true);
    try {
      const data = await generateQuestion({
        topic: inputTopic,
        subtopic: selectedSubtopic || "General",
        difficulty: currentTheta,
        bloom_level: bloomLevel,
        previous_questions: askedQuestions,
        classroom_quiz_id: classQuiz?.id,
      });
      setQ({
        question: data.question,
        options: [data.options.A, data.options.B, data.options.C, data.options.D],
        optKeys: ["A", "B", "C", "D"],
        correct: ["A", "B", "C", "D"].indexOf(data.correct_answer),
        topic: inputTopic,
        topicColor: "var(--primary)",
        difficulty: currentTheta,
        diffLabel: "Adaptive",
        concept: data.concept || selectedSubtopic || 'General',
        hint: data.hint,
        explanation: data.explanation,
        misconceptions: data.misconceptions,
      });
      setAskedQuestions((prev) => [...prev, data.question]);
      setDifficulty(currentTheta);
    } catch (e) {
      console.error(e);
      setMessage("Failed to generate question. Please try again.");
    } finally {
      setIsGenLoading(false);
      setTimer(60);
    }
  };

  const handleGenerateDag = async () => {
    if (!inputTopic.trim()) return;
    setIsLoadingDag(true);
    try {
      const data = await generateTopicDag(inputTopic);
      let parsedSubtopics = data.subtopics;
      if (!parsedSubtopics && data.dag?.nodes) {
        parsedSubtopics = data.dag.nodes.map((n: any) => ({ title: n.label || n.id, level: n.level }));
      }
      setDagData({ ...data, subtopics: parsedSubtopics });
      if (parsedSubtopics?.length > 0) setSelectedSubtopic(parsedSubtopics[0].title);
    } catch (e) {
      console.error("Failed to generate DAG:", e);
      setMessage("Failed to generate topic structure. Please try again.");
    } finally {
      setIsLoadingDag(false);
    }
  };

  const startQuiz = () => {
    setQuizState("playing");
    const startingTheta = classQuiz?.starting_difficulty || 0.0;
    setTheta(startingTheta);
    setStartTheta(startingTheta);
    setAskedQuestions([]);
    setQuestionHistory([]);
    setMisconceptionTags([]);
    setQIndex(0);
    setScore(0);
    setProctoringWarnings(0);
    setProctoringExceeded(false);
    setShowProctoringWarning(false);
    setMessage(null);
    fetchNextQuestion(startingTheta);
    // Start proctoring if enabled
    if (classQuiz?.enable_proctoring) {
      proctoring.start().catch(err => {
        console.error("Failed to start proctoring:", err);
        setMessage("Failed to start camera. Please check permissions.");
      });
    }
  };

  const handleEndTest = () => {
    // Stop proctoring if enabled
    if (proctoringEnabled) {
      proctoring.stop();
    }
    setQuizState('results');
  };

  const handleRestartQuiz = () => {
    setQuizState('setup');
    setQIndex(0);
    setQ(null);
    setTheta(0.0);
    setBloomLevel('Remembering');
    setDifficulty(0.5);
    setSelected(null);
    setSubmitted(false);
    setTimer(60);
    setScore(0);
    setQuestionHistory([]);
    setFeedback(null);
    setShowHint(false);
    setAiHint('');
    setShowExplanation(false);
    setAiExplanation('');
    setAiDiagramSyntax(null);
    setAiDiagramUrl('');
    setShowSidebarDiagram(false);
    setDagData(null);
    setInputTopic('');
    setSelectedSubtopic('');
  };

  const handleStartConceptQuiz = (concept: string) => {
    const parentTopic = inputTopic; // capture before any state changes
    // Reset quiz state but keep the parent topic; use concept as the focused subtopic
    setQIndex(0);
    setQ(null);
    setTheta(0.0);
    setBloomLevel('Remembering');
    setDifficulty(0.5);
    setSelected(null);
    setSubmitted(false);
    setTimer(60);
    setScore(0);
    setQuestionHistory([]);
    setFeedback(null);
    setShowHint(false);
    setAiHint('');
    setShowExplanation(false);
    setAiExplanation('');
    setAiDiagramSyntax(null);
    setAiDiagramUrl('');
    setShowSidebarDiagram(false);
    setDagData(null);
    // Keep the parent topic; concept becomes the subtopic for targeted drilling
    setInputTopic(parentTopic);
    setSelectedSubtopic(concept);
    setQuizState('playing');
    setIsGenLoading(true);
    generateQuestion({
      topic: parentTopic,
      subtopic: concept,
      difficulty: 0.0,
      bloom_level: 'Remembering',
      previous_questions: []
    }).then(data => {
      setQ({
        question: data.question,
        options: [data.options.A, data.options.B, data.options.C, data.options.D],
        optKeys: ['A', 'B', 'C', 'D'],
        correct: ['A', 'B', 'C', 'D'].indexOf(data.correct_answer),
        topic: parentTopic,
        topicColor: '#EF4444',
        difficulty: 0.0,
        diffLabel: 'Adaptive',
        concept: data.concept || concept,
        hint: data.hint,
        explanation: data.explanation,
        misconceptions: data.misconceptions
      });
    }).catch(e => console.error(e))
      .finally(() => { setIsGenLoading(false); setTimer(60); });
  };

  const recordProctoringEventHandler = useCallback(async (
    eventType: 'tab_switch' | 'copy' | 'paste' | 'context_menu' | 'window_blur' | 'no_face_detected' | 'multiple_people' | 'phone_detected' | 'paper_detected' | 'looking_away',
    eventData?: string,
    severity?: 'low' | 'medium' | 'high' | 'critical'
  ) => {
    if (!proctoringEnabled || !classQuiz) {
      console.log('[Proctoring] Event not recorded - proctoring disabled or no quiz', { proctoringEnabled, hasQuiz: !!classQuiz });
      return;
    }

    console.log('[Proctoring] Recording event:', { eventType, eventData, severity, quizId: classQuiz.id });

    try {
      const response = await recordProctoringEvent({
        classroom_quiz_id: classQuiz.id,
        event_type: eventType,
        event_data: eventData,
        severity: severity || (eventType === 'tab_switch' || eventType === 'window_blur' || eventType === 'looking_away' ? 'low' : eventType === 'multiple_people' ? 'critical' : 'medium')
      });

      console.log('[Proctoring] Event recorded successfully:', response);

      setProctoringWarnings(response.warning_count);
      setMaxProctoringWarnings(response.max_warnings);
      setProctoringExceeded(response.exceeded);
      setShowProctoringWarning(true);
      
      const eventLabels: Record<string, string> = {
        tab_switch: "switching tabs",
        copy: "copying text",
        paste: "pasting text",
        context_menu: "opening context menu",
        window_blur: "leaving the window",
        no_face_detected: "no face detected",
        multiple_people: "multiple people detected",
        phone_detected: "phone detected",
        paper_detected: "paper/notes detected",
        looking_away: "looking away from screen"
      };
      setLastProctoringEvent(eventLabels[eventType] || eventType);

      // Auto-hide warning after 5 seconds
      setTimeout(() => setShowProctoringWarning(false), 5000);
    } catch (e) {
      console.error("[Proctoring] Failed to record proctoring event:", e);
    }
  }, [proctoringEnabled, classQuiz]);

  // Proctoring event listeners
  useEffect(() => {
    if (!proctoringEnabled || quizState !== "playing") return;

    // Tab visibility change detection
    const handleVisibilityChange = () => {
      if (document.hidden) {
        recordProctoringEventHandler('tab_switch', 'User left the tab');
      }
    };

    // Window blur detection (user clicked outside browser)
    const handleWindowBlur = () => {
      recordProctoringEventHandler('window_blur', 'User left the browser window');
    };

    // Copy detection
    const handleCopy = (e: ClipboardEvent) => {
      const selectedText = window.getSelection()?.toString() || '';
      recordProctoringEventHandler('copy', `Copied text: ${selectedText.substring(0, 50)}`);
    };

    // Paste detection
    const handlePaste = (e: ClipboardEvent) => {
      recordProctoringEventHandler('paste', 'Attempted to paste content');
    };

    // Context menu (right-click) detection
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault(); // Optionally prevent context menu
      recordProctoringEventHandler('context_menu', 'Right-click detected');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [proctoringEnabled, quizState, recordProctoringEventHandler]);

  // AI Detection monitoring for UI warnings
  const lastAIEventTimeRef = useRef<Record<string, number>>({});

  useEffect(() => {
    if (!proctoringEnabled || quizState !== "playing" || !proctoring.ready) return;

    const checkDetectionViolations = () => {
      const now = Date.now();
      const cooldownMs = 5000; // 5 second cooldown between same event types
      const detection = proctoring.detection;

      // Debug logging
      console.log('[Proctoring] Detection status:', {
        faceDetected: detection.faceDetected,
        faceCount: detection.faceCount,
        multiplePeople: detection.multiplePeople,
        phoneDetected: detection.phoneDetected,
        paperDetected: detection.paperDetected,
        lookingAway: detection.lookingAway
      });

      // Check each violation type with cooldown
      if (detection.multiplePeople) {
        const lastTime = lastAIEventTimeRef.current['multiple_people'] || 0;
        if (now - lastTime > cooldownMs) {
          console.log('[Proctoring] Recording multiple_people event');
          lastAIEventTimeRef.current['multiple_people'] = now;
          recordProctoringEventHandler('multiple_people', `Multiple faces detected (${detection.faceCount} faces)`, 'critical');
        }
      }

      if (detection.phoneDetected) {
        const lastTime = lastAIEventTimeRef.current['phone_detected'] || 0;
        if (now - lastTime > cooldownMs) {
          console.log('[Proctoring] Recording phone_detected event');
          lastAIEventTimeRef.current['phone_detected'] = now;
          recordProctoringEventHandler('phone_detected', 'Mobile phone detected in frame', 'high');
        }
      }

      if (detection.paperDetected) {
        const lastTime = lastAIEventTimeRef.current['paper_detected'] || 0;
        if (now - lastTime > cooldownMs) {
          console.log('[Proctoring] Recording paper_detected event');
          lastAIEventTimeRef.current['paper_detected'] = now;
          recordProctoringEventHandler('paper_detected', 'Paper/notes detected in frame', 'high');
        }
      }

      if (detection.lookingAway) {
        const lastTime = lastAIEventTimeRef.current['looking_away'] || 0;
        if (now - lastTime > cooldownMs) {
          console.log('[Proctoring] Recording looking_away event');
          lastAIEventTimeRef.current['looking_away'] = now;
          recordProctoringEventHandler('looking_away', 'Student looking away from screen', 'low');
        }
      }

      if (!detection.faceDetected) {
        const lastTime = lastAIEventTimeRef.current['no_face_detected'] || 0;
        if (now - lastTime > cooldownMs) {
          console.log('[Proctoring] Recording no_face_detected event');
          lastAIEventTimeRef.current['no_face_detected'] = now;
          recordProctoringEventHandler('no_face_detected', 'Face not detected', 'high');
        }
      }
    };

    // Check violations every 1 second
    const interval = setInterval(checkDetectionViolations, 1000);
    return () => clearInterval(interval);
  }, [proctoringEnabled, quizState, proctoring.ready, proctoring.detection, recordProctoringEventHandler]);

  const finalizeAnswerRef = useRef<(opts?: { timedOut?: boolean }) => void>(() => {});

  useEffect(() => {
    if (submitted || !q) return;
    const interval = setInterval(() => {
      setTimer((t) => {
        if (t <= 1) {
          clearInterval(interval);
          finalizeAnswerRef.current({ timedOut: true });
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [q, submitted]);

  const handleRevealHint = async (level: number = 1) => {
    if (!q) return;
    setShowHint(true);

    // Use advanced 5-level Socratic hint system for the first hint
    if (level === 1 && !socraticSession) {
      const sessionId = `hint_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setIsLoadingAdvancedHint(true);
      setAdvancedHintError(undefined);
      setHintLoading(true);
      try {
        const response = await api.post('/socratic-advanced/hint-adaptive', {
          question: q.question,
          user_answer: selected !== null ? q.options[selected] : "I don't know",
          correct_answer: q.options[q.correct],
          confidence: 3,
          theta: theta,
          session_id: sessionId,
        });
        const hintData = response.data;
        const newSession = {
          session_id: sessionId,
          question: q.question,
          correct_answer: q.options[q.correct],
          hints: [hintData],
          misconception: hintData.misconception,
        };
        setSocraticSession(newSession);
        // Also populate legacy aiHint for compatibility
        setAiHint(hintData.hint || q.hint || "Try breaking down the question's terms.");
        setHintLevel(1);
      } catch (e: any) {
        const errorMsg = e?.response?.data?.detail || e?.message || 'Failed to get hint';
        setAdvancedHintError(errorMsg);
        console.error("Failed to fetch advanced Socratic hint:", e);
        // Fallback to legacy hint
        try {
          const res = await getSocraticHint({
            question: q.question,
            user_answer: selected !== null ? q.options[selected] : "I don't know",
            correct_answer: q.options[q.correct],
            confidence: 3,
            hint_level: 1
          });
          setAiHint(res.hint || q.hint || "Try breaking down the question's terms.");
        } catch {
          setAiHint(q.hint || "Think about the core concept.");
        }
      } finally {
        setHintLoading(false);
        setIsLoadingAdvancedHint(false);
      }
      return;
    }

    // Legacy level-2 hint (used only when advanced session is not available)
    if (level === 2 && !socraticSession) {
      setHintLevel(2);
      setHint2Loading(true);
      try {
        const res = await getSocraticHint({
          question: q.question,
          user_answer: selected !== null ? q.options[selected] : "I don't know",
          correct_answer: q.options[q.correct],
          confidence: 3,
          hint_level: 2
        });
        setAiHint2(res.hint || "Consider looking at the options again.");
      } catch (e) {
        console.error("Failed to fetch Socratic hint 2:", e);
        setAiHint2("Consider reviewing the definitions or core formulas.");
      } finally {
        setHint2Loading(false);
      }
    }
  };

  const handleEscalateHint = async () => {
    if (!socraticSession?.session_id || !q) return;
    setIsLoadingAdvancedHint(true);
    setAdvancedHintError(undefined);
    try {
      const response = await api.post(`/socratic-advanced/hint-escalate?session_id=${socraticSession.session_id}`, {
        question: socraticSession.question,
        user_answer: selected !== null ? q.options[selected] : "I don't know",
        correct_answer: socraticSession.correct_answer,
        confidence: 3,
        theta: theta,
      });
      const hintData = response.data;
      setSocraticSession((prev: any) => ({
        ...prev,
        hints: [...prev.hints, hintData],
        misconception: hintData.misconception || prev.misconception,
      }));
    } catch (e: any) {
      const errorMsg = e?.response?.data?.detail || e?.message || 'Failed to escalate hint';
      setAdvancedHintError(errorMsg);
      console.error("Failed to escalate hint:", e);
    } finally {
      setIsLoadingAdvancedHint(false);
    }
  };

  const handleTrackHintOutcome = async (helpful: boolean) => {
    if (!socraticSession?.hints || socraticSession.hints.length === 0) return;
    const lastHint = socraticSession.hints[socraticSession.hints.length - 1];
    try {
      await api.post('/socratic-advanced/hint-outcome', {
        hint_id: lastHint.hint_id,
        did_help: helpful,
        time_to_understand: 5,
        hint_level: lastHint.hint_level,
      });
    } catch (e) {
      console.error('Error tracking hint outcome:', e);
    }
  };

  const handleGetExplanation = async () => {
    if (!q) return;
    setShowExplanation(true);
    setExpLoading(true);
    try {
      const difficultyLabel = difficulty < -1.5 ? "easy" : difficulty < 0.5 ? "medium" : "hard";
      const res = await getExplanation({
        question: q.question,
        correct_answer: q.options[q.correct],
        difficulty: difficultyLabel,
      });
      setAiExplanation(res.explanation);
      setAiDiagramSyntax(res.mermaid_diagram || null);
      setAiDiagramUrl(res.diagram_url || "");
      setAiKeyTakeaway(res.key_takeaway || "Review the key details carefully.");
      setAiExample(res.example || "No real-world example generated.");
      setAiCommonMistake(res.common_mistake || "No common mistake annotated.");
    } catch (e) {
      console.error("Failed to fetch explanation:", e);
      setAiExplanation(q.explanation || "No explanation available.");
      setAiDiagramSyntax(null);
      setAiDiagramUrl("");
      setAiKeyTakeaway("Understand the core concept.");
      setAiExample("Example loading failed.");
      setAiCommonMistake("Mistake analysis failed.");
    } finally {
      setExpLoading(false);
    }
  };

  const finalizeAnswer = async (opts?: { timedOut?: boolean }) => {
    const timedOut = !!opts?.timedOut;
    if (!q || submitted) return;
    if (!timedOut && selected === null) return;

    setIsSubmitting(true);
    setOldTheta(theta);
    try {
      const data = await submitAnswer({
        user_id: user?.id,
        classroom_id: classQuiz?.classroom_id,
        classroom_quiz_id: classQuiz?.id,
        theta,
        difficulty,
        selected_option: selected !== null ? q.optKeys[selected] : "",
        correct_answer: q.optKeys[q.correct],
        topic: q.topic,
        subtopic: selectedSubtopic || "General",
        question: q.question,
        question_index: qIndex + 1,
        misconception: q.misconceptions?.[selected !== null ? selected : q.correct],
        misconceptions: q.misconceptions,
        answer_options: q.options ? {
          A: q.options[0],
          B: q.options[1],
          C: q.options[2],
          D: q.options[3]
        } : undefined,
        explanation: q.explanation,
        bloom_level: bloomLevel,
      });

      // Calculate XP
      const gained = data.correct ? 12 : 3;
      setXpGained(gained);
      setXp((prev) => prev + gained);

      setFeedback(data);
      setQuestionHistory((prev) => [
        ...prev,
        {
          question: q.question,
          subtopic: selectedSubtopic || "General",
          concept: q.concept || "General",
          correct: data.correct,
          bloomLevel: bloomLevel
        }
      ]);
      
      setMisconceptionTags((prev) => [...prev, ...(data.misconception_tag ? [data.misconception_tag] : [])]);
      setScore((s) => s + (data.correct ? 1 : 0));
      setSubmitted(true);
      
      const newThetaVal = data.new_theta !== undefined ? data.new_theta : (data.next_theta !== undefined ? data.next_theta : theta);
      setTheta(newThetaVal);
    } catch (e) {
      console.error("Failed to submit answer:", e);
      setMessage("Failed to submit answer. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  finalizeAnswerRef.current = finalizeAnswer;

  const handleNext = () => {
    if (proctoringExceeded) {
      finishQuiz();
      return;
    }
    setSelected(null);
    setSubmitted(false);
    setFeedback(null);
    setShowHint(false);
    setAiHint("");
    setAiHint2("");
    setHintLevel(1);
    if (socraticSession?.session_id) {
      api.delete(`/socratic-advanced/session/${socraticSession.session_id}`).catch(() => {});
    }
    setSocraticSession(null);
    setAdvancedHintError(undefined);
    setShowExplanation(false);
    setAiDiagramUrl("");
    setAiDiagramSyntax(null);
    setAiKeyTakeaway("");
    setAiExample("");
    setAiCommonMistake("");
    setShowSidebarDiagram(false);
    const nextIndex = qIndex + 1;
    if (isClassroomQuiz && targetQuestions && nextIndex >= targetQuestions) {
      finishQuiz();
    } else {
      setQIndex(nextIndex);
      fetchNextQuestion(theta);
    }
  };

  const finishQuiz = () => {
    // Clean up camera before leaving
    if (proctoringEnabled) {
      proctoring.stop();
    }
    // Show Gayatri's in-page results screen (concepts to focus on + targeted quiz)
    setQuizState('results');
  };

  // Clean up camera on unmount or when quiz state changes
  useEffect(() => {
    return () => {
      if (proctoringEnabled) {
        proctoring.stop();
      }
    };
  }, [proctoringEnabled, proctoring.stop]);

  if (quizState === "setup") {
    return (
      <div className="neo-page">
        <div className="neo-shell">
          <div style={{ marginBottom: "var(--space-8)" }}>
            <span className="badge badge-purple">Student Quiz</span>
            <h1 className="chunky-heading" style={{ fontSize: "var(--heading-lg)", margin: "var(--space-4) 0 0" }}>Adaptive Quiz Setup</h1>
            <p style={{ color: "var(--ink-secondary)", marginTop: "var(--space-3)", fontWeight: "var(--font-extrabold)" }}>
              {classQuiz ? `Complete the quiz assigned by your teacher` : "Practice any topic with AI-generated adaptive questions"}
            </p>
          </div>

          {message && <div className="card" style={{ marginBottom: "var(--space-6)", color: "var(--error)", background: "var(--error-soft)" }}>{message}</div>}

          <section className="card" style={{ marginBottom: "var(--space-8)" }}>
            <FieldLabel label="Topic">
              <div style={{ display: "flex", gap: "var(--space-3)" }}>
                <input
                  value={inputTopic}
                  onChange={(e) => setInputTopic(e.target.value)}
                  disabled={!!classQuiz}
                  placeholder="e.g. Data Structures, Thermodynamics, World History"
                  style={{ ...inputStyle, flex: 1 }}
                />
                {!classQuiz && (
                  <button
                    onClick={handleGenerateDag}
                    disabled={isLoadingDag || !inputTopic.trim()}
                    className="neo-btn neo-btn-secondary"
                    style={{
                      whiteSpace: "nowrap",
                      display: "flex",
                      alignItems: "center",
                      gap: "var(--space-2)",
                      padding: "var(--space-3) var(--space-4)"
                    }}
                  >
                    {isLoadingDag ? <Loader2 size={16} className="animate-spin" /> : null}
                    Subtopics
                  </button>
                )}
              </div>
            </FieldLabel>

            <FieldLabel label="Focus Subtopic">
              {dagData?.subtopics ? (
                <select value={selectedSubtopic} onChange={(e) => setSelectedSubtopic(e.target.value)} style={inputStyle}>
                  {dagData.subtopics.map((st: any) => (
                    <option key={st.id || st.title} value={st.title}>{st.title} (Lvl {st.level})</option>
                  ))}
                </select>
              ) : (
                <input value={selectedSubtopic} onChange={(e) => setSelectedSubtopic(e.target.value)} disabled={!!classQuiz} placeholder="e.g. Arrays, Kinematics" style={inputStyle} />
              )}
            </FieldLabel>

            {proctoring.error && proctoringEnabled && (
              <div className="card" style={{
                background: "var(--pink-soft)",
                borderColor: "var(--coral)",
                marginTop: "var(--space-4)"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                  <AlertTriangle size={20} color="var(--error)" />
                  <div>
                    <p style={{
                      color: "var(--coral)",
                      fontWeight: "var(--font-extrabold)",
                      margin: "0 0 var(--space-1)"
                    }}>
                      Camera Access Required
                    </p>
                    <p style={{
                      color: "var(--coral)",
                      fontSize: "var(--text-sm)",
                      margin: 0
                    }}>
                      {proctoring.error}
                    </p>
                  </div>
                </div>
              </div>
            )}
            <button onClick={startQuiz} disabled={!inputTopic || isLoadingDag} className="neo-btn neo-btn-primary" style={{ width: "100%", padding: "var(--space-4)", marginTop: "var(--space-6)", opacity: !inputTopic || isLoadingDag ? 0.55 : 1 }}>
              Start Quiz <ChevronRight size={18} />
            </button>
          </section>
        </div>
      </div>
    );
  }

  if (quizState === 'results') {
    const totalAnswered = questionHistory.length;
    const totalCorrect = questionHistory.filter(r => r.correct).length;
    const totalIncorrect = totalAnswered - totalCorrect;
    const accuracyPct = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;

    const wrongRecords = questionHistory.filter(r => !r.correct);

    // Smart Deduplication for LLM-generated similar concepts (Gayatri: Added prerequisite quizes)
    let focusConceptsList: {original: string, norm: string, subtopic: string}[] = [];
    wrongRecords.forEach(r => {
      if (!r.concept) return;
      let norm = r.concept.replace(/\([^)]*\)/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
      if (norm.endsWith('s') && !norm.endsWith('ss')) norm = norm.slice(0, -1);
      if (!norm) return;

      let dupIdx = focusConceptsList.findIndex(item => item.norm.includes(norm) || norm.includes(item.norm));
      if (dupIdx !== -1) {
        if (norm.length < focusConceptsList[dupIdx].norm.length) {
          focusConceptsList[dupIdx] = { original: r.concept, norm, subtopic: r.subtopic };
        }
      } else {
        focusConceptsList.push({ original: r.concept, norm, subtopic: r.subtopic });
      }
    });

    const focusConcepts = focusConceptsList.map(item => item.original);
    const conceptSubtopicMap: Record<string, string> = {};
    focusConceptsList.forEach(item => { conceptSubtopicMap[item.original] = item.subtopic; });

    const wrongBloomLevels = questionHistory
      .filter(r => !r.correct)
      .map(r => r.bloomLevel);
    const uniqueWrongBlooms = Array.from(new Set(wrongBloomLevels));

    const getPerformanceLabel = (pct: number) => {
      if (pct >= 80) return { label: 'Excellent', color: '#059669', bg: '#ECFDF5' };
      if (pct >= 60) return { label: 'Good', color: '#D97706', bg: '#FFFBEB' };
      if (pct >= 40) return { label: 'Needs Practice', color: '#DC2626', bg: '#FEF2F2' };
      return { label: 'Keep Studying', color: '#7C3AED', bg: '#F5F3FF' };
    };

    const perf = getPerformanceLabel(accuracyPct);

    return (
      <div className="neo-page" style={{ padding: '2rem 1rem' }}>
        <div className="neo-shell" style={{ maxWidth: '800px' }}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <div style={{
              width: '5rem', height: '5rem',
              background: 'linear-gradient(135deg, var(--primary), var(--primary))',
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1.25rem',
              boxShadow: '0 0 40px rgba(124, 58, 237, 0.5)',
            }}>
              <Trophy size={32} color="white" />
            </div>
            <h1 className="chunky-heading" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Quiz Complete!</h1>
            <p style={{ color: 'var(--ink-secondary)', fontSize: '1rem' }}>Topic: <strong style={{ color: 'var(--ink)' }}>{inputTopic}</strong> · Subtopic: <strong style={{ color: 'var(--ink)' }}>{selectedSubtopic || 'General'}</strong></p>
          </div>

          <div style={{
            background: perf.bg,
            border: `2px solid ${perf.color}30`,
            borderRadius: '16px',
            padding: '1.75rem',
            textAlign: 'center',
            marginBottom: '1.5rem',
            backdropFilter: 'blur(10px)',
          }}>
            <div style={{ fontSize: '4rem', fontWeight: 900, color: perf.color, lineHeight: 1 }}>{accuracyPct}%</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: perf.color, marginTop: '0.5rem' }}>{perf.label}</div>
            <div style={{ fontSize: '0.9rem', color: '#6B7280', marginTop: '0.25rem' }}>{totalCorrect} correct out of {totalAnswered} questions</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            {[
              { icon: <CheckCircle size={22} color="#059669" />, label: 'Correct', value: totalCorrect, color: '#059669', bg: 'rgba(5,150,105,0.08)', border: 'rgba(5,150,105,0.25)' },
              { icon: <XCircle size={22} color="#DC2626" />, label: 'Incorrect', value: totalIncorrect, color: '#DC2626', bg: 'rgba(220,38,38,0.08)', border: 'rgba(220,38,38,0.25)' },
              { icon: <BarChart2 size={22} color="var(--primary)" />, label: 'Questions', value: totalAnswered, color: 'var(--primary)', bg: 'rgba(124,58,237,0.08)', border: 'rgba(124,58,237,0.25)' },
            ].map(stat => (
              <div key={stat.label} style={{
                background: stat.bg,
                border: `1.5px solid ${stat.border}`,
                borderRadius: '14px',
                padding: '1.25rem',
                textAlign: 'center',
              }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.625rem' }}>{stat.icon}</div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: stat.color }}>{stat.value}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 500 }}>{stat.label}</div>
              </div>
            ))}
          </div>

          <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={{ width: '2.25rem', height: '2.25rem', background: 'var(--error-soft)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Target size={18} color="var(--error)" />
              </div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Concepts to Focus On</h2>
            </div>

            {focusConcepts.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'var(--success-soft)', border: '1px solid var(--success)', borderRadius: '10px', padding: '1rem' }}>
                <CheckCircle size={20} color="var(--success)" />
                <p style={{ color: 'var(--success)', fontSize: '0.9rem', margin: 0, fontWeight: 500 }}>Amazing! You answered all questions correctly. Keep it up!</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                {focusConcepts.map((concept, i) => {
                  const parentSubtopic = conceptSubtopicMap[concept] || selectedSubtopic || 'General';
                  return (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: '0.875rem',
                      background: 'var(--surface-low)',
                      border: '1px solid var(--outline)',
                      borderRadius: '10px',
                      padding: '0.875rem 1rem',
                    }}>
                      <div style={{
                        width: '1.75rem', height: '1.75rem', background: 'var(--primary-soft)',
                        borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', flexShrink: 0
                      }}>{i + 1}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 700, margin: 0, fontSize: '0.9rem' }}>{concept}</p>
                        <p style={{ color: 'var(--muted)', fontSize: '0.72rem', margin: '0.15rem 0 0' }}>
                          under <span style={{ color: 'var(--primary)' }}>{parentSubtopic}</span> · {inputTopic}
                        </p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                        <button
                          onClick={() => handleStartConceptQuiz(concept)}
                          className="neo-btn neo-btn-primary"
                          style={{
                            padding: '0.4rem 0.75rem',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                          }}
                        >
                          ▶ Give Quiz
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {uniqueWrongBlooms.length > 0 && (
            <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div style={{ width: '2.25rem', height: '2.25rem', background: 'var(--primary-soft)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Brain size={18} color="var(--primary)" />
                </div>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Cognitive Gap Areas</h2>
              </div>
              <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '0.875rem' }}>These Bloom's Taxonomy levels need more attention:</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {uniqueWrongBlooms.map((bloom, i) => (
                  <span key={i} className="badge badge-purple" style={{ padding: '0.4rem 0.875rem', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: 600 }}>{bloom}</span>
                ))}
              </div>
            </div>
          )}

          <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>Question Breakdown</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '280px', overflowY: 'auto' }}>
              {questionHistory.map((record, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  background: record.correct ? 'var(--success-soft)' : 'var(--error-soft)',
                  border: `1px solid ${record.correct ? 'var(--success)' : 'var(--error)'}`,
                  borderRadius: '8px',
                  padding: '0.75rem',
                }}>
                  <div style={{
                    width: '1.625rem', height: '1.625rem', background: record.correct ? 'rgba(5,150,105,0.2)' : 'rgba(220,38,38,0.2)',
                    borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.7rem', fontWeight: 700, color: record.correct ? '#059669' : '#DC2626', flexShrink: 0,
                  }}>Q{i + 1}</div>
                  <p style={{ color: 'var(--ink)', fontSize: '0.8rem', margin: 0, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{record.question}</p>
                  {record.correct
                    ? <CheckCircle size={16} color="#059669" style={{ flexShrink: 0 }} />
                    : <XCircle size={16} color="#DC2626" style={{ flexShrink: 0 }} />
                  }
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              onClick={handleRestartQuiz}
              className="neo-btn neo-btn-primary"
              style={{
                flex: 1,
                padding: '1rem',
                fontWeight: 700,
                fontSize: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
              }}
            >
              <RotateCcw size={18} /> Try Again
            </button>
            <Link href="/dashboard" className="neo-btn neo-btn-secondary" style={{
              flex: 1,
              padding: '1rem',
              fontWeight: 700,
              fontSize: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              textDecoration: 'none',
              textAlign: 'center',
            }}>
              <Home size={18} /> Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isGenLoading || !q) return <LoadingState label="Generating next adaptive question..." />;

  const timerColor = timer > 20 ? "var(--success)" : timer > 10 ? "var(--warning)" : "var(--coral)";
  const progress = isClassroomQuiz && targetQuestions
    ? Math.min(100, ((qIndex + 1) / targetQuestions) * 100)
    : Math.min(100, ((qIndex + 1) / 10) * 100);
  const correct = feedback?.correct || selected === q.correct;

  const currentDifficultyLabel = difficulty < -1.5 ? "easy" : difficulty < 0.5 ? "medium" : "hard";

  return (
    <div className="neo-page" style={{ padding: "var(--space-6)" }}>
      {/* ─── STAGE 1: TOP PROGRESS & PERFORMANCE DASHBOARD ─── */}
      <div className="card" style={{ marginBottom: "var(--space-6)", display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "var(--space-4)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
            <span style={{ fontSize: "var(--text-lg)", fontWeight: "var(--font-black)" }}>
              {isClassroomQuiz && targetQuestions 
                ? `Question ${qIndex + 1}/${targetQuestions}` 
                : `Question ${qIndex + 1}`
              }
            </span>
            <span style={{ color: "var(--muted)", fontSize: "var(--text-sm)" }}>({inputTopic})</span>
          </div>
          
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)" }}>
            {/* Ability & Mastery Badge metrics */}
            <div style={{ display: "flex", gap: "var(--space-2)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-1)", padding: "var(--space-1) var(--space-3)", background: "var(--primary-soft)", border: "1px solid var(--primary-light)", borderRadius: "var(--radius-full)" }} title="Your current calculated Ability (Theta)">
                <Brain size={14} color="var(--primary)" />
                <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-extrabold)", color: "var(--primary-strong)" }}>
                  Ability: {theta >= 0 ? "+" : ""}{theta.toFixed(2)}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-1)", padding: "var(--space-1) var(--space-3)", background: "var(--amber-soft)", border: "1px solid var(--amber-light)", borderRadius: "var(--radius-full)" }} title="Estimated mastery level for this topic">
                <Target size={14} color="var(--amber)" />
                <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-extrabold)", color: "var(--amber-strong)" }}>
                  Mastery: {Math.round(((theta + 3.0) / 6.0) * 100)}%
                </span>
              </div>
            </div>

            {!isClassroomQuiz ? (
              <button
                onClick={handleEndTest}
                disabled={!canEndTest}
                title={canEndTest ? "End test and see results" : `Complete at least ${10 - (qIndex + 1) + (submitted ? 1 : 0)} more question(s) to end`}
                style={{
                  background: canEndTest ? "#DC2626" : "var(--surface-high)",
                  color: canEndTest ? "white" : "var(--muted)",
                  border: "1px solid var(--outline)",
                  borderRadius: "var(--radius-md)",
                  padding: "var(--space-2) var(--space-3)",
                  fontSize: "var(--text-xs)",
                  fontWeight: "var(--font-extrabold)",
                  cursor: canEndTest ? "pointer" : "not-allowed",
                  whiteSpace: "nowrap",
                  transition: "all var(--transition-fast) ease",
                }}
              >
                {canEndTest ? "🏁 End Test" : `End Test (${Math.max(0, 10 - (qIndex + 1))} left)`}
              </button>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-1)", padding: "var(--space-1) var(--space-3)", background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.2)", borderRadius: "var(--radius-full)" }}>
                <Shield size={14} color="#DC2626" />
                <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-extrabold)", color: "#DC2626" }}>
                  Classroom Assignment
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="progress-track" style={{ height: "8px" }}>
          <div className="progress-fill" style={{ width: `${progress}%`, background: "var(--primary)", height: "100%", borderRadius: "var(--radius-full)" }} />
        </div>
      </div>

      {/* Proctoring Warning Popup Modal */}
      <ProctoringWarningModal
        show={showProctoringWarning}
        event={lastProctoringEvent}
        warnings={proctoringWarnings}
        maxWarnings={maxProctoringWarnings}
        exceeded={proctoringExceeded}
        onDismiss={() => setShowProctoringWarning(false)}
      />

      {/* ─── STAGE 2: TWO-COLUMN MAIN QUIZ & TUTOR WORKSPACE ─── */}
      <div style={{ display: "flex", flexDirection: "row", gap: "var(--space-6)", flexWrap: "wrap", alignItems: "stretch" }}>
        
        {/* CENTER-LEFT COLUMN: MAIN QUIZ (approx 62% width) */}
        <div style={{ flex: "2 1 540px", display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
          
          {/* Proctoring Banner Alert */}
          {proctoringEnabled && proctoring.error && (
            <div className="card" style={{ background: "var(--pink-soft)", borderColor: "var(--coral)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                <AlertTriangle size={20} color="var(--error)" />
                <div style={{ flex: 1 }}>
                  <p style={{ color: "var(--coral)", fontWeight: "var(--font-extrabold)", margin: "0 0 var(--space-1)" }}>
                    Integrity System Offline
                  </p>
                  <p style={{ color: "var(--coral)", fontSize: "var(--text-sm)", margin: 0 }}>
                    {proctoring.error}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Proctoring Initialization Status */}
          {proctoringEnabled && !proctoring.ready && !proctoring.error && (
            <div className="card" style={{ background: "var(--info-soft)", borderColor: "var(--info)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                <div style={{
                  width: "18px",
                  height: "18px",
                  borderRadius: "50%",
                  border: "2px solid var(--info)",
                  borderTopColor: "transparent",
                  animation: "spin 1s linear infinite"
                }} />
                <div style={{ flex: 1 }}>
                  <p style={{ color: "var(--info)", fontWeight: "var(--font-extrabold)", margin: 0, fontSize: "var(--text-sm)" }}>
                    Initializing Integrity Monitor...
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Question Workspace Card */}
          <div className="glass-card" style={{ padding: "clamp(var(--space-5), 4vw, var(--space-8))", display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "var(--space-4)" }}>
              <div style={{ display: "flex", gap: "var(--space-2)" }}>
                <span className="badge badge-purple" style={{ fontSize: "var(--text-xs)" }}>{q.concept}</span>
                <span className="badge badge-green" style={{ fontSize: "var(--text-xs)" }}>Difficulty: {currentDifficultyLabel}</span>
                <span className="badge badge-amber" style={{ fontSize: "var(--text-xs)" }}>{bloomLevel}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", color: timerColor, fontSize: "var(--text-sm)", fontWeight: "var(--font-bold)" }}>
                <Clock size={16} />
                <span>{timer}s</span>
              </div>
            </div>

            <h2 style={{ fontSize: "var(--text-lg)", fontWeight: "var(--font-extrabold)", marginBottom: "var(--space-4)", lineHeight: "var(--leading-snug)" }}>
              {q.question}
            </h2>

            <div style={{ display: "grid", gap: "var(--space-3)" }}>
              {q.options.map((opt: string, idx: number) => {
                const isSelected = selected === idx;
                const isCorrect = q.correct === idx;
                const showResult = submitted;
                const isWrong = isSelected && !isCorrect && showResult;
                const isRight = isCorrect && showResult;

                return (
                  <button
                    key={idx}
                    onClick={() => !submitted && setSelected(idx)}
                    disabled={submitted}
                    style={{
                      width: "100%",
                      padding: "var(--space-4) var(--space-5)",
                      borderRadius: "var(--radius-lg)",
                      border: isWrong
                        ? "2px solid var(--error)"
                        : isRight
                        ? "2px solid var(--success)"
                        : isSelected
                        ? "2px solid var(--primary)"
                        : "1px solid var(--outline)",
                      background: isWrong
                        ? "var(--error-soft)"
                        : isRight
                        ? "var(--success-soft)"
                        : isSelected
                        ? "var(--primary-soft)"
                        : "var(--surface)",
                      color: "var(--ink)",
                      fontSize: "var(--text-base)",
                      fontWeight: "var(--font-semibold)",
                      cursor: submitted ? "default" : "pointer",
                      textAlign: "left",
                      transition: "all var(--transition-base)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "var(--space-3)"
                    }}
                  >
                    <span>{opt}</span>
                    {showResult && isRight && <CheckCircle size={18} color="var(--success)" />}
                    {showResult && isWrong && <XCircle size={18} color="var(--error)" />}
                  </button>
                );
              })}
            </div>

            {/* Submit & Hint Panel (Before Answering) */}
            {!submitted && (
              <div style={{ display: "flex", gap: "var(--space-3)", marginTop: "var(--space-4)" }}>
                <button
                  onClick={() => finalizeAnswer()}
                  disabled={selected === null || isSubmitting}
                  className="neo-btn neo-btn-primary"
                  style={{ opacity: selected === null ? 0.5 : 1, flex: 2, padding: "var(--space-3)" }}
                >
                  {isSubmitting ? "Submitting..." : "Submit Answer"}
                </button>
                <button
                  onClick={() => {
                    setActiveTab("hint");
                    handleRevealHint(1);
                  }}
                  className="neo-btn neo-btn-secondary"
                  style={{ flex: 1, padding: "var(--space-3)" }}
                >
                  💡 Get Hint
                </button>
              </div>
            )}
          </div>

          {/* ─── STAGE 3: POST-ANSWER INTERACTIVE PROGRESS & PERFORMANCE SUMMARY ─── */}
          {submitted && feedback && (
            <div className="card" style={{
              padding: "var(--space-6)",
              border: `2px solid ${feedback.correct ? "var(--success)" : "var(--error)"}`,
              background: feedback.correct ? "var(--success-soft)" : "var(--error-soft)",
              borderRadius: "var(--radius-xl)",
              display: "flex",
              flexDirection: "column",
              gap: "var(--space-4)",
              animation: "fadeIn var(--transition-base) ease-out"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                {feedback.correct ? <CheckCircle size={24} color="var(--success)" /> : <XCircle size={24} color="var(--error)" />}
                <span style={{ fontSize: "var(--text-lg)", fontWeight: "var(--font-black)", color: feedback.correct ? "var(--success-strong)" : "var(--error-strong)" }}>
                  {feedback.correct ? "Correct Answer!" : "Incorrect Answer"}
                </span>
                
                <span style={{
                  marginLeft: "auto",
                  fontSize: "var(--text-xs)",
                  fontWeight: "var(--font-extrabold)",
                  color: feedback.correct ? "var(--success-strong)" : "var(--warning-strong)",
                  background: feedback.correct ? "rgba(16,185,129,0.15)" : "rgba(245,158,11,0.15)",
                  padding: "var(--space-1) var(--space-3)",
                  borderRadius: "var(--radius-full)"
                }}>
                  {feedback.correct ? `+${xpGained} XP` : `+${xpGained} XP (effort)`}
                </span>
              </div>

              <p style={{ fontSize: "var(--text-sm)", color: "var(--ink)", margin: 0, lineHeight: "var(--leading-normal)" }}>
                {feedback.explanation}
              </p>

              {/* Progress Stat Changes Grid */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
                gap: "var(--space-3)",
                background: "rgba(255, 255, 255, 0.45)",
                padding: "var(--space-3)",
                borderRadius: "var(--radius-lg)",
                border: "1px solid var(--outline)"
              }}>
                <div>
                  <div style={{ fontSize: "var(--text-xs)", color: "var(--muted)", fontWeight: "var(--font-bold)" }}>🧠 ABILITY</div>
                  <div style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-extrabold)", color: "var(--ink)" }}>
                    {oldTheta.toFixed(2)} → <span style={{ color: "var(--primary)" }}>{theta.toFixed(2)}</span>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "var(--text-xs)", color: "var(--muted)", fontWeight: "var(--font-bold)" }}>🎯 MASTERY</div>
                  <div style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-extrabold)", color: "var(--ink)" }}>
                    {Math.round(((oldTheta + 3.0) / 6.0) * 100)}% → <span style={{ color: "var(--amber)" }}>{Math.round(((theta + 3.0) / 6.0) * 100)}%</span>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "var(--text-xs)", color: "var(--muted)", fontWeight: "var(--font-bold)" }}>📈 DIFFICULTY</div>
                  <div style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-extrabold)", color: "var(--ink)", textTransform: "capitalize" }}>
                    {currentDifficultyLabel} → <span style={{ color: "var(--green)" }}>{feedback.next_difficulty < -1.5 ? "easy" : feedback.next_difficulty < 0.5 ? "medium" : "hard"}</span>
                  </div>
                </div>
              </div>

              {/* Interactive Next CTAs */}
              <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap", marginTop: "var(--space-1)" }}>
                <button
                  onClick={() => {
                    setActiveTab("learn");
                    handleGetExplanation();
                  }}
                  className="neo-btn neo-btn-secondary"
                  style={{ flex: 1, padding: "var(--space-2)", fontSize: "var(--text-xs)", display: "flex", alignItems: "center", justifyContent: "center", gap: "var(--space-1)" }}
                >
                  <BookOpen size={14} /> Learn Why
                </button>
                
                {(aiDiagramSyntax || aiDiagramUrl || feedback.mermaid_diagram || feedback.diagram_url) && (
                  <button
                    onClick={() => {
                      setActiveTab("visual");
                      if (!aiDiagramSyntax && !aiDiagramUrl) {
                        setAiDiagramSyntax(feedback.mermaid_diagram || null);
                        setAiDiagramUrl(feedback.diagram_url || "");
                      }
                    }}
                    className="neo-btn neo-btn-secondary"
                    style={{ flex: 1, padding: "var(--space-2)", fontSize: "var(--text-xs)", display: "flex", alignItems: "center", justifyContent: "center", gap: "var(--space-1)" }}
                  >
                    <BarChart2 size={14} /> Concept Visual
                  </button>
                )}

                <button
                  onClick={handleNext}
                  className="neo-btn neo-btn-primary"
                  style={{
                    flex: 2,
                    padding: "var(--space-2) var(--space-4)",
                    fontSize: "var(--text-xs)",
                  background: (isClassroomQuiz && targetQuestions && qIndex + 1 >= targetQuestions) ? "#059669" : "var(--primary)",
                  color: "white",
                  fontWeight: "var(--font-black)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "var(--space-2)",
                  borderRadius: "var(--radius-md)"
                }}
              >
                {isClassroomQuiz && targetQuestions && qIndex + 1 >= targetQuestions ? (
                  <><Trophy size={14} /><span>See Results</span></>
                ) : (
                  <><span>🟣 Next Adaptive Question</span><ChevronRight size={14} /></>
                )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT SIDEBAR COLUMN: INTEGRATED AI TUTOR (approx 38% width) */}
        <div style={{ flex: "1 1 340px", display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
          <div className="card" style={{ padding: "0 0 var(--space-4) 0", overflow: "hidden", display: "flex", flexDirection: "column" }}>
            
            {/* Tab header buttons */}
            <div style={{ display: "flex", borderBottom: "1px solid var(--outline)", background: "rgba(255,255,255,0.02)" }}>
              {[
                { id: "learn", label: "Learn", icon: <BookOpen size={16} /> },
                { id: "hint", label: "Hint", icon: <Lightbulb size={16} /> },
                { id: "visual", label: "Diagram", icon: <BarChart2 size={16} /> },
                { id: "integrity", label: "Integrity", icon: <Shield size={16} /> }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  style={{
                    flex: 1,
                    padding: "var(--space-3) var(--space-1)",
                    border: "none",
                    borderBottom: activeTab === tab.id ? "3px solid var(--primary)" : "3px solid transparent",
                    background: activeTab === tab.id ? "var(--surface-low)" : "transparent",
                    color: activeTab === tab.id ? "var(--primary)" : "var(--muted)",
                    fontWeight: activeTab === tab.id ? "var(--font-black)" : "var(--font-semibold)",
                    fontSize: "0.75rem",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "4px",
                    transition: "all var(--transition-fast) ease"
                  }}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab contents wrapper */}
            <div style={{ padding: "var(--space-4) var(--space-5) 0 var(--space-5)", minHeight: "280px" }}>
              
              {/* LEARN TAB */}
              {activeTab === "learn" && (
                <div style={{ animation: "fadeIn var(--transition-fast) ease" }}>
                  {expLoading ? (
                    <div style={{ padding: "var(--space-6) 0" }}>
                      <DancingSquares size="sm" inline label="AI is drafting detailed explanation..." />
                    </div>
                  ) : showExplanation ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
                      <div>
                        <h4 style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-black)", color: "var(--primary)", textTransform: "uppercase", marginBottom: "4px", letterSpacing: "0.05em" }}>
                          📖 Explanation
                        </h4>
                        <p style={{ fontSize: "var(--text-sm)", color: "var(--muted)", margin: 0, lineHeight: "var(--leading-relaxed)" }}>
                          {aiExplanation}
                        </p>
                      </div>
                      
                      {aiKeyTakeaway && (
                        <div style={{ borderTop: "1px solid var(--outline)", paddingTop: "var(--space-3)" }}>
                          <h4 style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-black)", color: "var(--amber)", textTransform: "uppercase", marginBottom: "4px", letterSpacing: "0.05em" }}>
                            💡 Key Takeaway
                          </h4>
                          <p style={{ fontSize: "var(--text-sm)", color: "var(--muted)", margin: 0, fontStyle: "italic", lineHeight: "var(--leading-relaxed)" }}>
                            {aiKeyTakeaway}
                          </p>
                        </div>
                      )}
                      
                      {aiExample && (
                        <div style={{ borderTop: "1px solid var(--outline)", paddingTop: "var(--space-3)" }}>
                          <h4 style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-black)", color: "var(--green)", textTransform: "uppercase", marginBottom: "4px", letterSpacing: "0.05em" }}>
                            🌍 Real World Example
                          </h4>
                          <p style={{ fontSize: "var(--text-sm)", color: "var(--muted)", margin: 0, lineHeight: "var(--leading-relaxed)" }}>
                            {aiExample}
                          </p>
                        </div>
                      )}

                      {aiCommonMistake && (
                        <div style={{ borderTop: "1px solid var(--outline)", paddingTop: "var(--space-3)" }}>
                          <h4 style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-black)", color: "var(--coral)", textTransform: "uppercase", marginBottom: "4px", letterSpacing: "0.05em" }}>
                            ⚠ Common Mistake
                          </h4>
                          <p style={{ fontSize: "var(--text-sm)", color: "var(--coral-strong)", margin: 0, lineHeight: "var(--leading-relaxed)" }}>
                            {aiCommonMistake}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "260px", textAlign: "center", gap: "var(--space-3)" }}>
                      <span style={{ fontSize: "3rem" }}>🔒</span>
                      <h4 style={{ margin: 0, fontWeight: "var(--font-bold)" }}>Explanation Locked</h4>
                      <p style={{ fontSize: "var(--text-xs)", color: "var(--muted)", margin: 0, maxWidth: "220px" }}>
                        Submit your answer to unlock the AI explanation, key takeaways, and real-world examples.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* HINT TAB */}
              {activeTab === "hint" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", animation: "fadeIn var(--transition-fast) ease" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                    <Lightbulb size={18} color="var(--warning)" />
                    <h4 style={{ margin: 0, fontWeight: "var(--font-bold)" }}>Need Help?</h4>
                  </div>

                  {(hintLoading || isLoadingAdvancedHint) && !socraticSession ? (
                    <DancingSquares size="sm" inline label="AI is generating hint..." />
                  ) : socraticSession?.hints && socraticSession.hints.length > 0 ? (
                    /* 5-level Socratic Hint Panel */
                    <SocraticHintPanel
                      hints={socraticSession.hints}
                      misconception={socraticSession.misconception}
                      canEscalate={socraticSession.hints.length < 5 && socraticSession.hints[socraticSession.hints.length - 1]?.next_level_available}
                      isLoading={isLoadingAdvancedHint}
                      error={advancedHintError}
                      onEscalateHint={handleEscalateHint}
                      onTrackOutcome={handleTrackHintOutcome}
                    />
                  ) : aiHint ? (
                    /* Fallback: simple hint display */
                    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
                      <div style={{ padding: "var(--space-3)", background: "var(--warning-soft)", border: "1px solid var(--warning)", borderRadius: "var(--radius-lg)" }}>
                        <div style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-bold)", color: "var(--warning)", marginBottom: "4px" }}>HINT 1</div>
                        <p style={{ fontSize: "var(--text-sm)", color: "var(--muted)", margin: 0, lineHeight: "var(--leading-relaxed)" }}>{aiHint}</p>
                      </div>

                      {hintLevel === 1 && (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--space-2)" }}>
                          <span style={{ color: "var(--outline)", fontSize: "1.2rem" }}>↓</span>
                          <button
                            onClick={() => handleRevealHint(2)}
                            className="neo-btn neo-btn-secondary"
                            style={{ width: "100%", fontSize: "var(--text-xs)" }}
                          >
                            Still stuck? Reveal Hint 2
                          </button>
                        </div>
                      )}

                      {hint2Loading ? (
                        <DancingSquares size="sm" inline label="AI is generating Hint 2..." />
                      ) : aiHint2 ? (
                        <div style={{ padding: "var(--space-3)", background: "var(--warning-soft)", border: "1px solid var(--warning)", borderRadius: "var(--radius-lg)", animation: "fadeIn var(--transition-fast) ease" }}>
                          <div style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-bold)", color: "var(--warning)", marginBottom: "4px" }}>HINT 2</div>
                          <p style={{ fontSize: "var(--text-sm)", color: "var(--muted)", margin: 0, lineHeight: "var(--leading-relaxed)" }}>{aiHint2}</p>
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <div>
                      <p style={{ fontSize: "var(--text-sm)", color: "var(--muted)", margin: "0 0 var(--space-4)" }}>
                        Stuck on this question? Ask the AI Tutor for a progressive Socratic hint to help guide your reasoning.
                      </p>
                      <button
                        onClick={() => handleRevealHint(1)}
                        className="neo-btn neo-btn-secondary"
                        style={{ width: "100%" }}
                      >
                        Reveal Hint
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* DIAGRAM TAB */}
              {activeTab === "visual" && (
                <div style={{ animation: "fadeIn var(--transition-fast) ease" }}>
                  {!submitted ? (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "260px", textAlign: "center", gap: "var(--space-3)" }}>
                      <span style={{ fontSize: "3rem" }}>🔒</span>
                      <h4 style={{ margin: 0, fontWeight: "var(--font-bold)" }}>Diagram Locked</h4>
                      <p style={{ fontSize: "var(--text-xs)", color: "var(--muted)", margin: 0, maxWidth: "220px" }}>
                        Submit your answer to view the concept's workflow or visual schema.
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                      <h4 style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-black)", color: "var(--primary)", textTransform: "uppercase", marginBottom: "var(--space-1)", letterSpacing: "0.05em" }}>
                        📊 Concept Visual
                      </h4>
                      {aiDiagramSyntax ? (
                        <div style={{ background: "rgba(0,0,0,0.02)", border: "1px solid var(--outline)", borderRadius: "var(--radius-lg)", padding: "var(--space-3)", width: "100%", overflowX: "auto" }}>
                          <MermaidDiagram syntax={aiDiagramSyntax} />
                        </div>
                      ) : aiDiagramUrl ? (
                        <img src={aiDiagramUrl} alt="Concept Diagram" style={{ maxWidth: "100%", height: "auto", borderRadius: "var(--radius-md)", border: "1px solid var(--outline)" }} />
                      ) : (
                        <div style={{ padding: "var(--space-4)", textAlign: "center", color: "var(--muted)", fontSize: "var(--text-sm)" }}>
                          No diagram syntax generated for this concept. Review the explanation in the Learn tab!
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* INTEGRITY TAB */}
              {activeTab === "integrity" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", animation: "fadeIn var(--transition-fast) ease" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                    <Shield size={18} color={proctoringEnabled ? "var(--success)" : "var(--muted)"} />
                    <h4 style={{ margin: 0, fontWeight: "var(--font-bold)" }}>Integrity Status</h4>
                  </div>

                  {!proctoringEnabled ? (
                    <p style={{ fontSize: "var(--text-sm)", color: "var(--muted)", margin: 0 }}>
                      Integrity monitor is not active or required for this session.
                    </p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", padding: "var(--space-2) var(--space-3)", background: "var(--success-soft)", border: "1px solid var(--success)", borderRadius: "var(--radius-md)" }}>
                        <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--success)", animation: "pulse 1.5s infinite" }} />
                        <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-extrabold)", color: "var(--success-strong)" }}>
                          🟢 Integrity Monitor Active
                        </span>
                      </div>
                      
                      {/* Compact webcam display wrapper inside sidebar tab */}
                      {proctoring.stream ? (
                        <div style={{ width: "100%", height: "130px", borderRadius: "var(--radius-lg)", overflow: "hidden", background: "black", border: "1px solid var(--outline)", position: "relative" }}>
                          <ProctoringPreview
                            stream={proctoring.stream}
                            status={{
                              faceDetected: proctoring.detection.faceDetected,
                              multiplePeople: proctoring.detection.multiplePeople,
                              phoneDetected: proctoring.detection.phoneDetected,
                              paperDetected: proctoring.detection.paperDetected,
                              lookingAway: proctoring.detection.lookingAway,
                              violations: [
                                ...(proctoring.detection.multiplePeople ? ["Multiple people"] : []),
                                ...(proctoring.detection.phoneDetected ? ["Phone"] : []),
                                ...(proctoring.detection.paperDetected ? ["Paper/notes"] : []),
                                ...(proctoring.detection.lookingAway ? ["Looking away"] : []),
                                ...(!proctoring.detection.faceDetected ? ["No face"] : [])
                              ]
                            }}
                            isMinimized={false}
                            onMinimize={() => {}}
                          />
                        </div>
                      ) : (
                        <div style={{ padding: "var(--space-4)", background: "var(--surface-low)", border: "1px solid var(--outline)", borderRadius: "var(--radius-lg)", textAlign: "center", color: "var(--muted)", fontSize: "var(--text-xs)" }}>
                          <Camera size={24} style={{ marginBottom: "var(--space-2)", opacity: 0.5 }} />
                          <br />
                          Camera offline or permission not granted.
                        </div>
                      )}
                      
                      <div style={{ fontSize: "var(--text-xs)", color: "var(--muted)", borderTop: "1px solid var(--outline)", paddingTop: "var(--space-2)" }}>
                        <div>Warnings: <strong>{proctoringWarnings} / {maxProctoringWarnings}</strong></div>
                        {lastProctoringEvent && <div style={{ marginTop: "2px" }}>Last Event: <span style={{ color: "var(--coral-strong)", fontWeight: "var(--font-semibold)" }}>{lastProctoringEvent}</span></div>}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─── STAGE 4: BOTTOM SESSION FOOTER ─── */}
      <div className="card" style={{ marginTop: "var(--space-6)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "var(--space-4)", padding: "var(--space-3) var(--space-5)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", color: "var(--coral-strong)", fontWeight: "var(--font-extrabold)" }}>
          <Flame size={18} fill="currentColor" />
          <span style={{ fontSize: "var(--text-sm)" }}>🔥 4 Day Streak</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", color: "var(--primary-strong)", fontWeight: "var(--font-extrabold)" }}>
          <span style={{ fontSize: "var(--text-sm)" }}>⚡ Total XP: {xp} XP</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", color: timerColor, fontWeight: "var(--font-extrabold)" }}>
          <Clock size={18} />
          <span style={{ fontSize: "var(--text-sm)" }}>⏱ {timer}s remaining</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", color: proctoringEnabled ? "var(--success-strong)" : "var(--muted)", fontWeight: "var(--font-bold)" }}>
          {proctoringEnabled ? (
            <>
              <Shield size={18} color="var(--success)" />
              <span style={{ fontSize: "var(--text-sm)" }}>🟢 Integrity Monitor Active</span>
            </>
          ) : (
            <>
              <Shield size={18} color="var(--muted)" />
              <span style={{ fontSize: "var(--text-sm)" }}>Integrity Monitor Offline</span>
            </>
          )}
        </div>
      </div>

      {/* Enlarge Concept Diagram Modal */}
      <Modal
        isOpen={showSidebarDiagram}
        onClose={() => setShowSidebarDiagram(false)}
        title="Concept Diagram"
        size="lg"
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "300px", gap: "1rem" }}>
          {aiDiagramSyntax ? (
            <div style={{ width: "100%" }}>
              <MermaidDiagram syntax={aiDiagramSyntax} />
            </div>
          ) : aiDiagramUrl ? (
            <img src={aiDiagramUrl} alt="Concept Diagram" style={{ maxWidth: "100%", height: "auto", borderRadius: "8px" }} />
          ) : (
            <p style={{ color: "var(--muted)" }}>No diagram available.</p>
          )}
        </div>
      </Modal>
    </div>
  );
}

function FieldLabel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "var(--space-4)" }}>
      <label style={{ display: "block", fontSize: "var(--text-sm)", fontWeight: "var(--font-bold)", color: "var(--muted)", marginBottom: "var(--space-2)", textTransform: "uppercase" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function LoadingState({ label }: { label: string }) {
  return (
    <div className="app-page" style={{ minHeight: "60vh", display: "grid", placeItems: "center" }}>
      <DancingSquares size="lg" label={label} />
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  border: "1px solid var(--outline)",
  borderRadius: "var(--radius-xl)",
  background: "var(--surface-low)",
  color: "var(--ink)",
  outline: "none",
  padding: "var(--space-4) var(--space-4)",
  fontWeight: "var(--font-semibold)",
};

export default function QuizPage() {
  return (
    <Suspense fallback={<LoadingState label="Loading quiz..." />}>
      <QuizContent />
    </Suspense>
  );
}
