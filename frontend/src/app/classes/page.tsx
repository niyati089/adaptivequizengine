"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BookOpen, Check, Plus, Shield, Trash2, Users, X, BarChart2, Eye } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { DancingSquares } from '@/components/shared/DancingSquares';
import { ProctoringDashboard } from '@/components/educator/ProctoringDashboard';
import {
  createClassQuiz,
  createClassroom,
  decideClassRequest,
  deleteClassQuiz,
  deleteClassroom,
  getClasses,
  getMyClasses,
  removeClassStudent,
  requestClassEnrollment,
  updateClassQuiz,
  updateClassroom,
} from '@/services/quizService';

const inputStyle = {
  width: '100%',
  padding: 'var(--space-3) var(--space-4)',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--outline)',
  fontSize: 'var(--text-sm)',
  outline: 'none',
};

export default function ClassesPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [classes, setClasses] = useState<any[]>([]);
  const [availableClasses, setAvailableClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [classForm, setClassForm] = useState({ name: '', subject: '', description: '' });
  const [quizForm, setQuizForm] = useState({ title: '', topic: '', subtopic: 'General', bloom_level: 'Remembering', starting_difficulty: 0, enable_anti_cheating: false, enable_proctoring: false, max_proctoring_warnings: 3 });
  const [viewingProctoringQuizId, setViewingProctoringQuizId] = useState<number | null>(null);

  const selectedClass = classes.find(item => item.id === selectedClassId) || classes[0];

  const load = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const mine = await getMyClasses();
      setClasses(mine);
      if (!selectedClassId && mine.length) setSelectedClassId(mine[0].id);
      if (user?.role === 'student') {
        const all = await getClasses();
        setAvailableClasses(all);
      }
    } catch (e: any) {
      setMessage(e.response?.data?.detail || 'Could not load classes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    load();
  }, [isLoading, router, user]);

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classForm.name.trim()) return;
    await createClassroom(classForm);
    setClassForm({ name: '', subject: '', description: '' });
    load();
  };

  const handleCreateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass || !quizForm.title.trim() || !quizForm.topic.trim()) return;
    await createClassQuiz(selectedClass.id, quizForm);
    setQuizForm({ title: '', topic: '', subtopic: 'General', bloom_level: 'Remembering', starting_difficulty: 0, enable_anti_cheating: false, enable_proctoring: false, max_proctoring_warnings: 3 });
    load();
  };

  if (isLoading || loading || !user) {
    return (
      <div className="app-page" style={{ display: 'grid', placeItems: 'center' }}>
        <DancingSquares size="lg" label="Loading classes..." />
      </div>
    );
  }

  if (user.role === 'student') {
    const enrolledIds = new Set(classes.map(item => item.id));

    return (
      <div className="neo-page">
        <div className="neo-shell">
          <div style={{ marginBottom: 'var(--space-8)' }}>
            <span className="badge badge-green">Student Gateway</span>
            <h1 className="chunky-heading" style={{ fontSize: 'var(--heading-2xl)', margin: 'var(--space-4) 0 0' }}>Classes</h1>
            <p style={{ color: 'var(--ink-secondary)', marginTop: 'var(--space-3)', fontWeight: 'var(--font-extrabold)' }}>Request access to teacher classes, then take adaptive quizzes assigned inside them.</p>
          </div>

          {message && <div className="card" style={{ marginBottom: 'var(--space-6)', color: 'var(--error)', background: 'var(--error-soft)' }}>{message}</div>}

          <section style={{ marginBottom: 'var(--space-8)' }}>
            <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-extrabold)', color: 'var(--ink)', marginBottom: 'var(--space-4)' }}>My Enrolled Classes</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
              {classes.length === 0 && <div className="card">No approved classes yet.</div>}
              {classes.map(item => (
                <div key={item.id} className="card">
                  <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-extrabold)', margin: '0 0 var(--space-1)' }}>{item.name}</h3>
                  <p style={{ color: 'var(--muted)', fontSize: 'var(--text-sm)', margin: '0 0 var(--space-4)' }}>{item.subject || 'General'} · {item.teacher}</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                    {item.quizzes.length === 0 && <p style={{ color: 'var(--muted-light)', fontSize: 'var(--text-sm)' }}>No quizzes assigned yet.</p>}
                    {item.quizzes.map((quiz: any) => (
                      <Link key={quiz.id} href={`/quiz?classroomQuizId=${quiz.id}`} className="neo-btn neo-btn-secondary" style={{ justifyContent: 'space-between', textDecoration: 'none', color: 'var(--navy)', padding: 'var(--space-3)' }}>
                        <span style={{ fontWeight: 'var(--font-bold)' }}>{quiz.title}</span>
                        <span style={{ color: 'var(--primary)', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-bold)' }}>{quiz.topic}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-extrabold)', color: 'var(--ink)', marginBottom: 'var(--space-4)' }}>Available Classes</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 'var(--space-4)' }}>
              {availableClasses.map(item => (
                <div key={item.id} className="card">
                  <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-extrabold)', margin: '0 0 var(--space-1)' }}>{item.name}</h3>
                  <p style={{ color: 'var(--muted)', fontSize: 'var(--text-sm)', margin: '0 0 var(--space-3)' }}>{item.subject || 'General'} · {item.teacher}</p>
                  <p style={{ color: 'var(--muted)', fontSize: 'var(--text-sm)', lineHeight: 'var(--leading-normal)', minHeight: 'var(--space-10)' }}>{item.description || 'Teacher-managed adaptive practice class.'}</p>
                  <button
                    onClick={async () => { await requestClassEnrollment(item.id); load(); }}
                    disabled={enrolledIds.has(item.id) || item.enrollment_status === 'pending'}
                    className="neo-btn"
                    style={{ marginTop: 'var(--space-4)', width: '100%', color: 'var(--navy)', background: enrolledIds.has(item.id) ? 'var(--surface-high)' : item.enrollment_status === 'pending' ? 'var(--warning-soft)' : 'var(--primary-soft)', cursor: enrolledIds.has(item.id) || item.enrollment_status === 'pending' ? 'default' : 'pointer' }}
                  >
                    {enrolledIds.has(item.id) ? 'Enrolled' : item.enrollment_status === 'pending' ? 'Pending Approval' : 'Request to Join'}
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="neo-page">
      <div className="neo-shell">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--space-4)', marginBottom: 'var(--space-8)', flexWrap: 'wrap' }}>
          <div>
            <span className="badge badge-amber">Educator Hub</span>
            <h1 className="chunky-heading" style={{ fontSize: 'var(--heading-2xl)', margin: 'var(--space-4) 0 0' }}>Classes</h1>
            <p style={{ color: 'var(--ink-secondary)', marginTop: 'var(--space-3)', fontWeight: 'var(--font-extrabold)' }}>Manage class enrollment, adaptive quiz configs, and classroom performance.</p>
          </div>
          <form onSubmit={handleCreateClass} className="card" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 'var(--space-2)', padding: 'var(--space-3)', minWidth: 'min(100%, 42rem)' }}>
            <input value={classForm.name} onChange={e => setClassForm({ ...classForm, name: e.target.value })} placeholder="Class name" style={inputStyle} />
            <input value={classForm.subject} onChange={e => setClassForm({ ...classForm, subject: e.target.value })} placeholder="Subject" style={inputStyle} />
            <button type="submit" className="neo-btn neo-btn-primary"><Plus size={16} /> Create</button>
          </form>
        </div>

        {message && <div className="card" style={{ marginBottom: 'var(--space-6)', color: 'var(--error)', background: 'var(--error-soft)' }}>{message}</div>}

        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 'var(--space-6)', alignItems: 'start' }}>
          <aside className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {classes.length === 0 && <p style={{ color: 'var(--muted)' }}>Create your first class to begin.</p>}
            {classes.map(item => (
              <button key={item.id} onClick={() => setSelectedClassId(item.id)} className="neo-btn" style={{ textAlign: 'left', justifyContent: 'flex-start', alignItems: 'flex-start', flexDirection: 'column', background: selectedClass?.id === item.id ? 'var(--primary-soft)' : 'var(--surface)', cursor: 'pointer' }}>
                <div style={{ fontWeight: 'var(--font-extrabold)', color: selectedClass?.id === item.id ? 'var(--primary)' : 'var(--ink)' }}>{item.name}</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>{item.dashboard.students} students · {item.quizzes.length} quizzes</div>
              </button>
            ))}
          </aside>

          {selectedClass && (
            <main style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-4)', alignItems: 'flex-start' }}>
                  <div>
                    <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-black)', color: 'var(--ink)', margin: 0 }}>{selectedClass.name}</h2>
                    <p style={{ color: 'var(--muted)', marginTop: 'var(--space-1)' }}>{selectedClass.subject || 'General'} · {selectedClass.description || 'No description'}</p>
                  </div>
                  <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                    <button onClick={async () => {
                      const name = window.prompt('Class name', selectedClass.name);
                      const subject = window.prompt('Subject', selectedClass.subject || '');
                      const description = window.prompt('Description', selectedClass.description || '');
                      if (name) {
                        await updateClassroom(selectedClass.id, { name, subject: subject || '', description: description || '' });
                        load();
                      }
                    }} style={{ border: '1px solid var(--outline)', borderRadius: 'var(--radius-md)', background: 'var(--surface)', padding: 'var(--space-2) var(--space-3)', fontWeight: 'var(--font-bold)' }}>Edit</button>
                    <button onClick={async () => { if (window.confirm('Delete this class and its quizzes/enrollments?')) { await deleteClassroom(selectedClass.id); setSelectedClassId(null); load(); } }} style={{ border: 'none', borderRadius: 'var(--radius-md)', background: 'var(--error)', color: 'var(--surface)', padding: 'var(--space-2) var(--space-3)', fontWeight: 'var(--font-extrabold)' }}><Trash2 size={16} /></button>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 'var(--space-4)', marginTop: 'var(--space-5)' }}>
                  {[
                    { icon: Users, label: 'Students', value: selectedClass.dashboard.students, color: 'var(--primary)' },
                    { icon: BookOpen, label: 'Quizzes', value: selectedClass.quizzes.length, color: 'var(--info)' },
                    { icon: BarChart2, label: 'Attempts', value: selectedClass.dashboard.attempts, color: 'var(--warning)' },
                    { icon: Check, label: 'Accuracy', value: `${selectedClass.dashboard.accuracy}%`, color: 'var(--success)' },
                  ].map(stat => (
                    <div key={stat.label} className="stat-card">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}><stat.icon size={16} color={stat.color} /><span style={{ color: 'var(--muted)', fontSize: 'var(--text-sm)' }}>{stat.label}</span></div>
                      <div className="stat-number" style={{ color: stat.color }}>{stat.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card">
                <h3 style={{ fontWeight: 'var(--font-black)', fontSize: 'var(--text-base)', margin: '0 0 var(--space-4)' }}>Join Requests</h3>
                {selectedClass.requests.length === 0 && <p style={{ color: 'var(--muted-light)' }}>No pending requests.</p>}
                {selectedClass.requests.map((request: any) => (
                  <div key={request.enrollment_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-2) 0', borderTop: '1px solid var(--surface-low)' }}>
                    <div><strong>{request.name}</strong><div style={{ color: 'var(--muted)', fontSize: 'var(--text-xs)' }}>{request.email}</div></div>
                    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                      <button onClick={async () => { await decideClassRequest(selectedClass.id, request.enrollment_id, 'approve'); load(); }} style={{ border: 'none', borderRadius: 'var(--radius-md)', background: 'var(--success)', color: 'var(--surface)', padding: 'var(--space-2)' }}><Check size={16} /></button>
                      <button onClick={async () => { await decideClassRequest(selectedClass.id, request.enrollment_id, 'reject'); load(); }} style={{ border: 'none', borderRadius: 'var(--radius-md)', background: 'var(--error)', color: 'var(--surface)', padding: 'var(--space-2)' }}><X size={16} /></button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="card">
                <h3 style={{ fontWeight: 'var(--font-black)', fontSize: 'var(--text-base)', margin: '0 0 var(--space-4)' }}>Adaptive Quizzes</h3>
                <form onSubmit={handleCreateQuiz} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr auto', gap: 'var(--space-2)' }}>
                    <input value={quizForm.title} onChange={e => setQuizForm({ ...quizForm, title: e.target.value })} placeholder="Quiz title" style={inputStyle} />
                    <input value={quizForm.topic} onChange={e => setQuizForm({ ...quizForm, topic: e.target.value })} placeholder="Topic" style={inputStyle} />
                    <input value={quizForm.subtopic} onChange={e => setQuizForm({ ...quizForm, subtopic: e.target.value })} placeholder="Subtopic" style={inputStyle} />
                    <button type="submit" style={{ border: 'none', borderRadius: 'var(--radius-md)', background: 'var(--primary)', color: 'var(--surface)', fontWeight: 'var(--font-extrabold)', padding: '0 var(--space-4)' }}>Add</button>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer', userSelect: 'none', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-bold)', color: 'var(--ink-secondary)' }}>
                    <input
                      type="checkbox"
                      checked={quizForm.enable_anti_cheating}
                      onChange={e => setQuizForm({ ...quizForm, enable_anti_cheating: e.target.checked })}
                      style={{ width: 'var(--space-4)', height: 'var(--space-4)', accentColor: 'var(--primary)' }}
                    />
                    <Shield size={15} color="var(--primary)" />
                    Enable Anti-Cheat Variants — each student gets a uniquely reworded version of the same question
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer', userSelect: 'none', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-bold)', color: 'var(--ink-secondary)' }}>
                    <input
                      type="checkbox"
                      checked={quizForm.enable_proctoring}
                      onChange={e => setQuizForm({ ...quizForm, enable_proctoring: e.target.checked })}
                      style={{ width: 'var(--space-4)', height: 'var(--space-4)', accentColor: 'var(--error)' }}
                    />
                    <Eye size={15} color="var(--error)" />
                    Enable AI Proctoring — track tab switches, copy/paste, and suspicious activity
                  </label>
                </form>
                {selectedClass.quizzes.map((quiz: any) => (
                  <div key={quiz.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto auto auto', gap: 'var(--space-3)', alignItems: 'center', padding: 'var(--space-3) 0', borderTop: '1px solid var(--surface-low)' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                        <strong>{quiz.title}</strong>
                        {quiz.enable_anti_cheating && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-1)', background: 'var(--primary-soft)', color: 'var(--primary)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-extrabold)', borderRadius: 'var(--radius-full)', padding: 'var(--space-1) var(--space-2)' }}>
                            <Shield size={11} /> Anti-Cheat
                          </span>
                        )}
                        {quiz.enable_proctoring && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-1)', background: 'var(--error-soft)', color: 'var(--error)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-extrabold)', borderRadius: 'var(--radius-full)', padding: 'var(--space-1) var(--space-2)' }}>
                            <Eye size={11} /> Proctored
                          </span>
                        )}
                      </div>
                      <div style={{ color: 'var(--muted)', fontSize: 'var(--text-xs)' }}>{quiz.topic} · {quiz.subtopic}</div>
                    </div>
                    <span style={{ color: 'var(--muted)', fontSize: 'var(--text-sm)' }}>{quiz.attempts} attempts</span>
                    <span style={{ color: 'var(--success)', fontWeight: 'var(--font-extrabold)' }}>{quiz.accuracy}%</span>
                    {quiz.enable_proctoring && (
                      <button
                        onClick={() => setViewingProctoringQuizId(quiz.id)}
                        style={{ border: '1px solid var(--outline)', borderRadius: 'var(--radius-md)', background: 'var(--surface)', color: 'var(--error)', padding: 'var(--space-2)', fontWeight: 'var(--font-bold)', display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}
                      >
                        <Eye size={16} /> View
                      </button>
                    )}
                    <button onClick={async () => {
                      const title = window.prompt('Quiz title', quiz.title);
                      const topic = window.prompt('Topic', quiz.topic);
                      const subtopic = window.prompt('Subtopic', quiz.subtopic || 'General');
                      if (title && topic) {
                        const enableAC = window.confirm('Enable anti-cheat variants for this quiz?\n\n(Current: ' + (quiz.enable_anti_cheating ? 'ON' : 'OFF') + ')\n\nClick OK to enable, Cancel to disable.');
                        const enableProc = window.confirm('Enable AI proctoring for this quiz?\n\n(Current: ' + (quiz.enable_proctoring ? 'ON' : 'OFF') + ')\n\nClick OK to enable, Cancel to disable.');
                        await updateClassQuiz(selectedClass.id, quiz.id, { title, topic, subtopic: subtopic || 'General', enable_anti_cheating: enableAC, enable_proctoring: enableProc });
                        load();
                      }
                    }} style={{ border: '1px solid var(--outline)', borderRadius: 'var(--radius-md)', background: 'var(--surface)', color: 'var(--ink-secondary)', padding: 'var(--space-2)', fontWeight: 'var(--font-bold)' }}>Edit</button>
                    <button onClick={async () => { await deleteClassQuiz(selectedClass.id, quiz.id); load(); }} style={{ border: 'none', borderRadius: 'var(--radius-md)', background: 'var(--error-soft)', color: 'var(--error)', padding: 'var(--space-2)' }}><Trash2 size={16} /></button>
                  </div>
                ))}
              </div>

              <div className="card">
                <h3 style={{ fontWeight: 'var(--font-black)', fontSize: 'var(--text-base)', margin: '0 0 var(--space-4)' }}>Enrolled Students</h3>
                {selectedClass.students.length === 0 && <p style={{ color: 'var(--muted-light)' }}>No approved students yet.</p>}
                {selectedClass.students.map((student: any) => (
                  <div key={student.enrollment_id} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: 'var(--space-4)', alignItems: 'center', padding: 'var(--space-3) 0', borderTop: '1px solid var(--surface-low)' }}>
                    <div><strong>{student.name}</strong><div style={{ color: 'var(--muted)', fontSize: 'var(--text-xs)' }}>{student.email}</div></div>
                    <span style={{ color: 'var(--muted)', fontSize: 'var(--text-sm)' }}>{student.attempts} attempts</span>
                    <span style={{ color: 'var(--success)', fontWeight: 'var(--font-extrabold)' }}>{student.accuracy}%</span>
                    <button onClick={async () => { await removeClassStudent(selectedClass.id, student.enrollment_id); load(); }} style={{ border: 'none', borderRadius: 'var(--radius-md)', background: 'var(--error-soft)', color: 'var(--error)', padding: 'var(--space-2)' }}><X size={16} /></button>
                  </div>
                ))}
              </div>

              {/* Proctoring Dashboard Modal */}
              {viewingProctoringQuizId && (
                <div style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'rgba(0, 0, 0, 0.5)',
                  display: 'grid',
                  placeItems: 'center',
                  zIndex: 1000,
                  padding: 'var(--space-8)'
                }}>
                  <div style={{
                    background: 'var(--surface)',
                    borderRadius: 'var(--radius-xl)',
                    padding: 'var(--space-8)',
                    maxWidth: '900px',
                    width: '100%',
                    maxHeight: '85vh',
                    overflow: 'auto'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
                      <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-black)', margin: 0 }}>
                        <Eye size={24} style={{ display: 'inline', marginRight: 'var(--space-2)', verticalAlign: 'middle' }} />
                        Proctoring Dashboard
                      </h2>
                      <button
                        onClick={() => setViewingProctoringQuizId(null)}
                        style={{
                          border: 'none',
                          background: 'var(--surface-low)',
                          color: 'var(--ink-secondary)',
                          padding: 'var(--space-2) var(--space-4)',
                          borderRadius: 'var(--radius-md)',
                          fontWeight: 'var(--font-bold)',
                          cursor: 'pointer'
                        }}
                      >
                        Close
                      </button>
                    </div>
                    <ProctoringDashboard quizId={viewingProctoringQuizId} />
                  </div>
                </div>
              )}
            </main>
          )}
        </div>
      </div>
    </div>
  );
}
