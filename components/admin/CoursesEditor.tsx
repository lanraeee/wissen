'use client'

import { useState, useEffect } from 'react'
import type { Course, Module, QuizQuestion } from '@/lib/courseData'

const s = (bg: string, color = '#fff') => ({
  padding: '5px 12px', borderRadius: 6, fontSize: '.75rem', fontWeight: 600,
  background: bg, color, border: 'none', cursor: 'pointer',
} as const)

const inp = { padding: '6px 10px', fontSize: '.85rem', border: '1px solid #d0ccc4', borderRadius: 6, width: '100%', boxSizing: 'border-box' as const }
const fieldLabel = { fontSize: '.68rem', fontWeight: 700, textTransform: 'uppercase' as const, color: '#8a9a8f', letterSpacing: '.06em', display: 'block', marginBottom: 2 }

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

const BLANK_QUIZ: QuizQuestion = { question: '', options: { a: '', b: '', c: '', d: '' }, correct: 'a' }
const BLANK_MODULE = (id: number): Module => ({ id, title: '', desc: '', objectives: [''], summary: '', quiz: [{ ...BLANK_QUIZ }] })
const BLANK_COURSE: Course = { id: '', title: '', tagline: '', modules: [], certificateName: '', isPremium: false }

function QuizEditor({ quiz, onChange }: { quiz: QuizQuestion[]; onChange: (q: QuizQuestion[]) => void }) {
  function update(i: number, patch: Partial<QuizQuestion>) {
    onChange(quiz.map((q, idx) => idx === i ? { ...q, ...patch } : q))
  }
  function updateOption(i: number, key: 'a' | 'b' | 'c' | 'd', value: string) {
    onChange(quiz.map((q, idx) => idx === i ? { ...q, options: { ...q.options, [key]: value } } : q))
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {quiz.map((q, i) => (
        <div key={i} style={{ background: '#fff', border: '1px solid #e8e4dc', borderRadius: 6, padding: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={fieldLabel}>Question {i + 1}</label>
            <button style={s('#fee2e2', '#dc2626')} onClick={() => onChange(quiz.filter((_, idx) => idx !== i))}>✕</button>
          </div>
          <input style={inp} value={q.question} onChange={e => update(i, { question: e.target.value })} placeholder="Question text" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {(['a', 'b', 'c', 'd'] as const).map(k => (
              <div key={k} style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <input type="radio" name={`correct-${i}`} checked={q.correct === k} onChange={() => update(i, { correct: k })} title="Mark as correct answer" />
                <input style={inp} value={q.options[k]} onChange={e => updateOption(i, k, e.target.value)} placeholder={`Option ${k.toUpperCase()}`} />
              </div>
            ))}
          </div>
        </div>
      ))}
      <button style={{ ...s('#f0ece4', '#3a4a3f'), alignSelf: 'flex-start' }} onClick={() => onChange([...quiz, { ...BLANK_QUIZ }])}>+ Add Question</button>
    </div>
  )
}

function ModuleEditor({ mod, onChange, onRemove }: { mod: Module; onChange: (m: Module) => void; onRemove: () => void }) {
  const [open, setOpen] = useState(false)

  function updateObjective(i: number, value: string) {
    onChange({ ...mod, objectives: mod.objectives.map((o, idx) => idx === i ? value : o) })
  }

  return (
    <div style={{ background: '#f9f7f3', borderRadius: 8, padding: '10px 12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => setOpen(o => !o)}>
        <strong style={{ fontSize: '.88rem' }}>Module {mod.id}: {mod.title || '(untitled)'}</strong>
        <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
          <button style={s('#e8e4dc', '#3a4a3f')}>{open ? 'Collapse' : 'Edit'}</button>
          <button style={s('#fee2e2', '#dc2626')} onClick={onRemove}>Remove</button>
        </div>
      </div>
      {open && (
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div>
            <label style={fieldLabel}>Title</label>
            <input style={inp} value={mod.title} onChange={e => onChange({ ...mod, title: e.target.value })} />
          </div>
          <div>
            <label style={fieldLabel}>Short Description</label>
            <input style={inp} value={mod.desc} onChange={e => onChange({ ...mod, desc: e.target.value })} />
          </div>
          <div>
            <label style={fieldLabel}>Summary</label>
            <textarea style={{ ...inp, minHeight: 70 }} value={mod.summary} onChange={e => onChange({ ...mod, summary: e.target.value })} />
          </div>
          <div>
            <label style={fieldLabel}>Learning Objectives</label>
            {mod.objectives.map((o, i) => (
              <div key={i} style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                <input style={inp} value={o} onChange={e => updateObjective(i, e.target.value)} />
                <button style={s('#fee2e2', '#dc2626')} onClick={() => onChange({ ...mod, objectives: mod.objectives.filter((_, idx) => idx !== i) })}>✕</button>
              </div>
            ))}
            <button style={s('#f0ece4', '#3a4a3f')} onClick={() => onChange({ ...mod, objectives: [...mod.objectives, ''] })}>+ Add Objective</button>
          </div>
          <div>
            <label style={fieldLabel}>Quiz</label>
            <QuizEditor quiz={mod.quiz} onChange={quiz => onChange({ ...mod, quiz })} />
          </div>
        </div>
      )}
    </div>
  )
}

function CourseEditor({ course, onChange, onRemove }: { course: Course; onChange: (c: Course) => void; onRemove: () => void }) {
  const [open, setOpen] = useState(false)

  function addModule() {
    const nextId = (course.modules.at(-1)?.id ?? 0) + 1
    onChange({ ...course, modules: [...course.modules, BLANK_MODULE(nextId)] })
  }
  function updateModule(i: number, m: Module) {
    onChange({ ...course, modules: course.modules.map((x, idx) => idx === i ? m : x) })
  }
  function removeModule(i: number) {
    onChange({ ...course, modules: course.modules.filter((_, idx) => idx !== i) })
  }

  return (
    <div style={{ background: '#fff', border: '1px solid #e8e4dc', borderRadius: 10, padding: '14px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => setOpen(o => !o)}>
        <div>
          <strong>{course.title || '(untitled course)'}</strong>
          <span style={{ marginLeft: 8, fontSize: '.72rem', color: '#8a9a8f' }}>{course.modules.length} modules · id: {course.id || '(new)'}</span>
        </div>
        <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
          <button style={s('#e8e4dc', '#3a4a3f')}>{open ? 'Collapse' : 'Edit'}</button>
          <button style={s('#fee2e2', '#dc2626')} onClick={onRemove}>Remove</button>
        </div>
      </div>
      {open && (
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <label style={fieldLabel}>Title</label>
              <input style={inp} value={course.title} onChange={e => {
                const title = e.target.value
                onChange({ ...course, title, id: course.id || slugify(title) })
              }} />
            </div>
            <div>
              <label style={fieldLabel}>Course ID (stable — changing this orphans existing progress/certificates)</label>
              <input style={inp} value={course.id} onChange={e => onChange({ ...course, id: slugify(e.target.value) })} />
            </div>
          </div>
          <div>
            <label style={fieldLabel}>Tagline</label>
            <input style={inp} value={course.tagline} onChange={e => onChange({ ...course, tagline: e.target.value })} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <label style={fieldLabel}>Certificate Name</label>
              <input style={inp} value={course.certificateName} onChange={e => onChange({ ...course, certificateName: e.target.value })} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 18 }}>
              <input type="checkbox" id={`premium-${course.id}`} checked={course.isPremium} onChange={e => onChange({ ...course, isPremium: e.target.checked })} />
              <label htmlFor={`premium-${course.id}`} style={{ fontSize: '.85rem' }}>Premium course</label>
            </div>
          </div>

          <label style={fieldLabel}>Modules</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {course.modules.map((m, i) => (
              <ModuleEditor key={m.id} mod={m} onChange={mod => updateModule(i, mod)} onRemove={() => removeModule(i)} />
            ))}
          </div>
          <button style={{ ...s('#1a3c2e'), alignSelf: 'flex-start' }} onClick={addModule}>+ Add Module</button>
        </div>
      )}
    </div>
  )
}

export default function CoursesEditor() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/admin/content/courses').then(r => r.json()).then(res => {
      setCourses(res.value ?? [])
      setLoaded(true)
    })
  }, [])

  async function save() {
    setSaving(true); setError('')
    try {
      const res = await fetch('/api/admin/content/courses', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: courses }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d?.error || 'Save failed — your changes have not been stored.')
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed.')
    } finally {
      setSaving(false)
    }
  }

  function addCourse() {
    setCourses(c => [...c, { ...BLANK_COURSE }])
  }
  function updateCourse(i: number, course: Course) {
    setCourses(c => c.map((x, idx) => idx === i ? course : x))
  }
  function removeCourse(i: number) {
    if (!confirm('Remove this course? Existing progress/certificates referencing it will no longer show on its detail page.')) return
    setCourses(c => c.filter((_, idx) => idx !== i))
  }

  if (!loaded) return <div style={{ padding: 24, color: '#8a9a8f' }}>Loading…</div>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Courses</h2>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {saved && <span style={{ fontSize: '.8rem', color: '#16a34a' }}>Saved!</span>}
          <button style={s('#1a3c2e')} onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</button>
        </div>
      </div>
      {error && <div style={{ marginBottom: 16, color: '#dc2626', fontSize: '.85rem', background: '#fee2e2', padding: '8px 14px', borderRadius: 7 }}>{error}</div>}

      <p style={{ margin: '0 0 16px', fontSize: '.85rem', color: '#8a9a8f' }}>
        Editing an existing course&apos;s ID or a module&apos;s number changes what learner progress and certificates
        point to — leave those alone once a course has been published. Titles, descriptions, and quiz content are safe to edit anytime.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {courses.map((c, i) => (
          <CourseEditor key={i} course={c} onChange={course => updateCourse(i, course)} onRemove={() => removeCourse(i)} />
        ))}
      </div>

      <button style={{ ...s('#1a3c2e'), marginTop: 12 }} onClick={addCourse}>+ Add Course</button>
    </div>
  )
}
