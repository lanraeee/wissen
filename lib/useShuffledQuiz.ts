'use client'

import { useMemo } from 'react'
import type { Module } from './courseData'
import type { ShuffledQuestion } from './quizUtils'
import { shuffleModuleQuestions, shuffleQuestionOrder } from './quizUtils'

export interface ShuffledQuizWithIndices extends ShuffledQuestion {
  originalIndex: number
}

/**
 * Hook for managing shuffled quiz questions
 * Shuffles both answer options AND question order for each session
 * Generates consistent shuffle per session using browser storage
 */
export function useShuffledQuiz(module: Module | null, enableQuestionShuffle: boolean = true) {
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

    // First, shuffle all answer options
    let questions = shuffleModuleQuestions(module.quiz, sessionId)

    // Then, optionally shuffle question order
    if (enableQuestionShuffle) {
      questions = shuffleQuestionOrder(questions, sessionId) as ShuffledQuestion[]
    }

    return questions
  }, [module, sessionId, enableQuestionShuffle])

  return { shuffledQuiz, sessionId }
}
