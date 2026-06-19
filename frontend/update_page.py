import re

with open("src/app/quiz/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Imports
content = content.replace(
    "import { generateQuestion, submitAnswer, getSocraticHint, getExplanation, scheduleReview } from '@/services/quizService';",
    "import { generateQuestion, submitAnswer, getSocraticHint, getExplanation, scheduleReview, generateTopicDag } from '@/services/quizService';"
)

# 2. State variables
state_vars = """
  // Quiz tracking
  const [quizState, setQuizState] = useState<'setup' | 'playing'>('setup');
  const [inputTopic, setInputTopic] = useState(selectedTopic || "");
  const [dagData, setDagData] = useState<any>(null);
  const [isLoadingDag, setIsLoadingDag] = useState(false);
  const [selectedSubtopic, setSelectedSubtopic] = useState("");
  
  const [qIndex, setQIndex] = useState(0);"""
content = content.replace(
    "  // Quiz tracking\n  const [qIndex, setQIndex] = useState(0);",
    state_vars
)

# 3. fetchNextQuestion
old_fetch = """      const data = await generateQuestion({
        topic: selectedTopic,
        subtopic: "General",
        difficulty: currentTheta,
        bloom_level: bloomLevel,
        previous_questions: prevQuestions
      });"""
new_fetch = """      const data = await generateQuestion({
        topic: inputTopic,
        subtopic: selectedSubtopic || "General",
        difficulty: currentTheta,
        bloom_level: bloomLevel,
        previous_questions: prevQuestions
      });"""
content = content.replace(old_fetch, new_fetch)

content = content.replace('topic: "Algorithms",', 'topic: inputTopic,')

# 4. handleGenerateDag and startQuiz, and useEffect update
old_use_effect = """  useEffect(() => {
    if (user && user.role === 'student' && !q && isGenLoading) {
      fetchNextQuestion(0.0);
    }
  }, [user]); // Run once when user is available"""

new_use_effect = """  const handleGenerateDag = async () => {
    if (!inputTopic.trim()) return;
    setIsLoadingDag(true);
    try {
      const data = await generateTopicDag(inputTopic);
      setDagData(data);
      if (data.subtopics && data.subtopics.length > 0) {
        setSelectedSubtopic(data.subtopics[0].title);
      }
    } catch (e) {
      console.error("Failed to generate DAG:", e);
    } finally {
      setIsLoadingDag(false);
    }
  };

  const startQuiz = () => {
    setQuizState('playing');
    fetchNextQuestion(0.0);
  };"""
content = content.replace(old_use_effect, new_use_effect)

# 5. submitAnswer
old_submit = """      const res = await submitAnswer({
        theta: theta,
        difficulty: difficulty,
        selected_option: q.optKeys[selected],
        correct_answer: q.optKeys[q.correct],
        topic: selectedTopic,
        subtopic: "General",
        question: q.question
      });"""
new_submit = """      const res = await submitAnswer({
        theta: theta,
        difficulty: difficulty,
        selected_option: q.optKeys[selected],
        correct_answer: q.optKeys[q.correct],
        topic: inputTopic,
        subtopic: selectedSubtopic || "General",
        question: q.question
      });"""
content = content.replace(old_submit, new_submit)

# 6. Setup Rendering
old_render = """  if (isLoading || !user || user.role !== 'student' || isGenLoading || !q) {
    return (
      <div style={{ minHeight: 'calc(100vh - 4rem)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FAFAFC' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '2.5rem', height: '2.5rem',
            border: '3px solid #EDE9FE',
            borderTopColor: '#7C3AED',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem',
          }} />
          <p style={{ color: '#6B7280', fontSize: '0.875rem', fontWeight: 500 }}>
             {isGenLoading ? 'Generating next adaptive question...' : 'Loading Portal...'}
          </p>
        </div>
      </div>
    );
  }"""

new_render = """  if (isLoading || !user || user.role !== 'student') {
    return (
      <div style={{ minHeight: 'calc(100vh - 4rem)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FAFAFC' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '2.5rem', height: '2.5rem', border: '3px solid #EDE9FE', borderTopColor: '#7C3AED', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
          <p style={{ color: '#6B7280', fontSize: '0.875rem', fontWeight: 500 }}>Loading Portal...</p>
        </div>
      </div>
    );
  }

  if (quizState === 'setup') {
    return (
      <div style={{ minHeight: 'calc(100vh - 4rem)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FAFAFC', padding: '2rem' }}>
        <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', width: '100%', maxWidth: '440px' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem', color: '#111827' }}>Quiz Setup</h2>
          <p style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '1.5rem' }}>Use AI to discover prerequisite knowledge graphs or jump straight in.</p>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>Topic</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input 
                type="text" 
                value={inputTopic} 
                onChange={e => setInputTopic(e.target.value)}
                style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '1rem', outline: 'none' }}
                placeholder="e.g. Quantum Computing"
              />
              <button 
                onClick={handleGenerateDag}
                disabled={isLoadingDag || !inputTopic}
                style={{ background: '#7C3AED', color: 'white', padding: '0 1rem', borderRadius: '8px', border: 'none', fontWeight: 600, cursor: isLoadingDag || !inputTopic ? 'not-allowed' : 'pointer', opacity: isLoadingDag || !inputTopic ? 0.7 : 1 }}
              >
                {isLoadingDag ? <Loader2 size={18} className="animate-spin" /> : 'Magic'}
              </button>
            </div>
          </div>

          {dagData && dagData.subtopics && (
            <div style={{ marginBottom: '2rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>Select Focus Subtopic</label>
              <select 
                value={selectedSubtopic} 
                onChange={e => setSelectedSubtopic(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '1rem', background: 'white', outline: 'none' }}
              >
                {dagData.subtopics.map((st: any) => (
                  <option key={st.id || st.title} value={st.title}>{st.title} (Lvl {st.level})</option>
                ))}
              </select>
              <p style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '0.5rem' }}>Options are generated dynamically using a prerequisite Knowledge DAG.</p>
            </div>
          )}

          <button 
            onClick={startQuiz}
            disabled={!inputTopic || isLoadingDag}
            style={{ width: '100%', background: '#10B981', color: 'white', padding: '0.875rem', borderRadius: '8px', border: 'none', fontWeight: 700, fontSize: '1rem', cursor: !inputTopic || isLoadingDag ? 'not-allowed' : 'pointer', opacity: !inputTopic || isLoadingDag ? 0.5 : 1 }}
          >
            Start Quiz
          </button>
        </div>
      </div>
    );
  }

  if (isGenLoading || !q) {
    return (
      <div style={{ minHeight: 'calc(100vh - 4rem)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FAFAFC' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '2.5rem', height: '2.5rem', border: '3px solid #EDE9FE', borderTopColor: '#7C3AED', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
          <p style={{ color: '#6B7280', fontSize: '0.875rem', fontWeight: 500 }}>Generating next adaptive question...</p>
        </div>
      </div>
    );
  }"""
content = content.replace(old_render, new_render)

with open("src/app/quiz/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
