'use client'

import { useMemo } from 'react'
import type { Module } from './courseData'
import type { ShuffledQuestion } from './quizUtils'
import { shuffleModuleQuestions } from './quizUtils'

/**
 * Hook for managing shuffled quiz questions
 * Generates consistent shuffle per session using browser storage
 */
export function useShuffledQuiz(module: Module | null) {
  const sessionId = useMemo(() => {
    // Generate or retrieve session ID from sessionStorage
    if (typeof window === 'undefined') return ''

    const storageKey = 'quiz-session-id'
    let id = sessionStorage.getItem(storageKey)

    if (!id) {
      id = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      sessionStorage.setItem(storageKey, id)
    }

    return id
  }, [])

  const shuffledQuiz = useMemo(() => {
    if (!module?.quiz || module.quiz.length === 0) {
      return []
    }

    return shuffleModuleQuestions(module.quiz, sessionId)
  }, [module, sessionId])

  return { shuffledQuiz, sessionId }
}
