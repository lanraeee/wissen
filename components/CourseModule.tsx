'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import posthog from 'posthog-js'
import type { Module } from '@/lib/courseData'
import { useShuffledQuiz } from '@/lib/useShuffledQuiz'
import { isAnswerCorrect } from '@/lib/quizUtils'

interface Props {
  courseId: string
  module: Module
  isCompleted: boolean
  prevModuleId?: number
  nextModuleId?: number
}

export default function CourseModule({ courseId, module, isCompleted, prevModuleId, nextModuleId }: Props) {
  const router = useRouter()
  const { shuffledQuiz } = useShuffledQuiz(module)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [result, setResult] = useState<{ passed: boolean; score: number } | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [completed, setCompleted] = useState(isCompleted)

  function handleAnswer(qIdx: number, key: string) {
    setAnswers(prev => ({ ...prev, [qIdx]: key }))
    setResult(null)
  }

  async function handleSubmit() {
    if (!shuffledQuiz || shuffledQuiz.length === 0) return
    const total = shuffledQuiz.length
    const correct = shuffledQuiz.filter((q, displayIndex) => {
      // Use display index (shuffled position) to get the answer
      const selectedKey = answers[displayIndex]
      return selectedKey ? isAnswerCorrect(q.shuffledOptions, selectedKey) : false
    }).length
    const score = Math.round((correct / total) * 100)
    const passed = score >= 80
    setResult({ passed, score })

    if (passed && !completed) {
      setSubmitting(true)
      try {
        const res = await fetch(`/api/courses/${courseId}/progress`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ moduleId: module.id })
        })
        const progressData = await res.json()
        posthog.capture('course_module_completed', {
          course_id: courseId,
          module_id: module.id,
          quiz_score: score,
          certificate_awarded: progressData.certificateAwarded ?? false,
        })
        setCompleted(true)
        router.refresh()
      } catch (e) {
        console.error(e)
        posthog.captureException(e)
      } finally {
        setSubmitting(false)
      }
    }
  }

  const allAnswered = shuffledQuiz ? shuffledQuiz.every((_, i) => answers[i] != null) : true

  return (
    <div className="module-single">
      <div className={`module${completed ? ' module--complete' : ''}`}>
        <div className="module__header">
          <div className="module__check">
            <div className="module__check-box" style={completed ? { background: 'var(--green-800)', borderColor: 'var(--green-800)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' } : {}}>
              {completed && 'âœ“'}
            </div>
          </div>
          <h2 className="module__title">Module {module.id}: {module.title}</h2>
        </div>

        <div className="module__body">
          {module.objectives && (
            <div className="module__objectives">
              <strong>Learning Objectives</strong>
              <ul>
                {module.objectives.map((obj, i) => <li key={i}>{obj}</li>)}
              </ul>
            </div>
          )}

          {module.summary && (
            <p className="module__summary">{module.summary}</p>
          )}

          {shuffledQuiz && shuffledQuiz.length > 0 && (
            <div className="module__quiz">
              <strong>Module Quiz</strong>
              {shuffledQuiz.map((q, qIdx) => (
                <div key={qIdx} className="module__question">
                  <p className="module__question-text">{qIdx + 1}. {q.question}</p>
                  <div className="module__options">
                    {q.shuffledOptions.map((option) => (
                      <label key={option.key} className="module__option">
                        <input
                          type="radio"
                          name={`q${qIdx}`}
                          checked={answers[qIdx] === option.key}
                          onChange={() => handleAnswer(qIdx, option.key)}
                        />
                        <span>{option.text}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}

              {!completed && (
                <button
                  className="module__submit-btn"
                  onClick={handleSubmit}
                  disabled={!allAnswered || submitting}
                >
                  {submitting ? 'Savingâ€¦' : 'Submit Quiz'}
                </button>
              )}

              {result && (
                <div className="module__quiz-result">
                  {result.passed ? (
                    <div className="module__quiz-pass">
                      âœ“ Passed with {result.score}%! Module complete.
                      {nextModuleId && (
                        <span> Ready for the next module!</span>
                      )}
                    </div>
                  ) : (
                    <div className="module__quiz-fail">
                      You scored {result.score}%. You need 80% to pass. Review the material and try again.
                    </div>
                  )}
                </div>
              )}

              {completed && (
                <div className="module__quiz-pass">âœ“ Module completed</div>
              )}
            </div>
          )}


        </div>
      </div>

      <div className="module-nav">
        {prevModuleId ? (
          <a href={`/courses/${courseId}/modules/${prevModuleId}`} className="btn btn--ghost">â† Previous</a>
        ) : <span />}
        {nextModuleId ? (
          <a href={`/courses/${courseId}/modules/${nextModuleId}`} className="btn">Next Module â†’</a>
        ) : (
          <a href={`/courses/${courseId}/certificate`} className="btn">View Certificate â†’</a>
        )}
      </div>
    </div>
  )
}
