import {
  shuffleQuestionOptions,
  shuffleModuleQuestions,
  shuffleQuestionOrder,
  getOriginalQuestionIndex,
  isAnswerCorrect,
  getAnswerKeyFromIndex,
} from './quizUtils'
import type { QuizQuestion } from './courseData'

// Mock data
const mockQuestion: QuizQuestion = {
  question: 'What is 2 + 2?',
  options: {
    a: '3',
    b: '4',
    c: '5',
    d: '6'
  },
  correct: 'b'
}

const mockQuestions: QuizQuestion[] = [
  mockQuestion,
  {
    question: 'What is the capital of France?',
    options: {
      a: 'London',
      b: 'Berlin',
      c: 'Paris',
      d: 'Madrid'
    },
    correct: 'c'
  }
]

describe('quizUtils', () => {
  describe('shuffleQuestionOptions', () => {
    it('should return a shuffled question with all options', () => {
      const shuffled = shuffleQuestionOptions(mockQuestion, 'session-1')

      expect(shuffled.question).toBe(mockQuestion.question)
      expect(shuffled.shuffledOptions).toHaveLength(4)
      expect(shuffled.shuffledOptions.map(o => o.key).sort()).toEqual(['a', 'b', 'c', 'd'])
    })

    it('should preserve correctness tracking', () => {
      const shuffled = shuffleQuestionOptions(mockQuestion, 'session-1')
      const correctOption = shuffled.shuffledOptions.find(o => o.isCorrect)

      expect(correctOption).toBeDefined()
      expect(correctOption?.key).toBe('b')
      expect(correctOption?.text).toBe('4')
    })

    it('should produce consistent shuffle for same session', () => {
      const shuffle1 = shuffleQuestionOptions(mockQuestion, 'session-1')
      const shuffle2 = shuffleQuestionOptions(mockQuestion, 'session-1')

      expect(shuffle1.shuffledOptions.map(o => o.key)).toEqual(
        shuffle2.shuffledOptions.map(o => o.key)
      )
    })

    it('should produce different shuffle for different sessions', () => {
      const shuffle1 = shuffleQuestionOptions(mockQuestion, 'session-1')
      const shuffle2 = shuffleQuestionOptions(mockQuestion, 'session-2')

      const order1 = shuffle1.shuffledOptions.map(o => o.key).join('')
      const order2 = shuffle2.shuffledOptions.map(o => o.key).join('')

      // Highly likely to be different (not guaranteed, but statistically almost certain)
      // This is a probabilistic test
      expect(order1).not.toBe(order2)
    })

    it('should work without session ID (random shuffle)', () => {
      const shuffle1 = shuffleQuestionOptions(mockQuestion)
      const shuffle2 = shuffleQuestionOptions(mockQuestion)

      expect(shuffle1.shuffledOptions).toHaveLength(4)
      expect(shuffle2.shuffledOptions).toHaveLength(4)
    })
  })

  describe('shuffleModuleQuestions', () => {
    it('should shuffle all questions in a module', () => {
      const shuffled = shuffleModuleQuestions(mockQuestions, 'session-1')

      expect(shuffled).toHaveLength(2)
      expect(shuffled[0].shuffledOptions).toHaveLength(4)
      expect(shuffled[1].shuffledOptions).toHaveLength(4)
    })

    it('should maintain question text and structure', () => {
      const shuffled = shuffleModuleQuestions(mockQuestions, 'session-1')

      expect(shuffled[0].question).toBe(mockQuestions[0].question)
      expect(shuffled[1].question).toBe(mockQuestions[1].question)
    })

    it('should produce consistent shuffle for all questions in same session', () => {
      const shuffle1 = shuffleModuleQuestions(mockQuestions, 'session-1')
      const shuffle2 = shuffleModuleQuestions(mockQuestions, 'session-1')

      shuffle1.forEach((q, i) => {
        expect(q.shuffledOptions.map(o => o.key)).toEqual(
          shuffle2[i].shuffledOptions.map(o => o.key)
        )
      })
    })
  })

  describe('shuffleQuestionOrder', () => {
    it('should return all questions in different order', () => {
      const questions = shuffleModuleQuestions(mockQuestions, 'session-1')
      const shuffled = shuffleQuestionOrder(questions, 'session-1')

      expect(shuffled).toHaveLength(2)
      expect(shuffled.map(q => q.originalIndex).sort()).toEqual([0, 1])
    })

    it('should preserve question data during reorder', () => {
      const questions = shuffleModuleQuestions(mockQuestions, 'session-1')
      const shuffled = shuffleQuestionOrder(questions, 'session-1')

      // All questions should still be present
      const originalIndices = shuffled.map(q => q.originalIndex).sort()
      expect(originalIndices).toEqual([0, 1])

      // Question text should be preserved
      shuffled.forEach(q => {
        expect(q.question).toBeDefined()
        expect(q.shuffledOptions).toBeDefined()
      })
    })

    it('should produce consistent order for same session', () => {
      const questions = shuffleModuleQuestions(mockQuestions, 'session-1')
      const shuffle1 = shuffleQuestionOrder(questions, 'session-1')
      const shuffle2 = shuffleQuestionOrder(questions, 'session-1')

      expect(shuffle1.map(q => q.originalIndex)).toEqual(
        shuffle2.map(q => q.originalIndex)
      )
    })

    it('should produce different order for different sessions', () => {
      const questions = shuffleModuleQuestions(mockQuestions, 'session-1')
      const shuffle1 = shuffleQuestionOrder(questions, 'session-1')
      const shuffle2 = shuffleQuestionOrder(questions, 'session-2')

      const order1 = shuffle1.map(q => q.originalIndex).join('')
      const order2 = shuffle2.map(q => q.originalIndex).join('')

      // Highly likely to be different for different sessions
      expect(order1).not.toBe(order2)
    })
  })

  describe('isAnswerCorrect', () => {
    it('should return true for correct answer', () => {
      const shuffled = shuffleQuestionOptions(mockQuestion, 'session-1')
      expect(isAnswerCorrect(shuffled.shuffledOptions, 'b')).toBe(true)
    })

    it('should return false for incorrect answers', () => {
      const shuffled = shuffleQuestionOptions(mockQuestion, 'session-1')
      expect(isAnswerCorrect(shuffled.shuffledOptions, 'a')).toBe(false)
      expect(isAnswerCorrect(shuffled.shuffledOptions, 'c')).toBe(false)
      expect(isAnswerCorrect(shuffled.shuffledOptions, 'd')).toBe(false)
    })

    it('should handle invalid keys', () => {
      const shuffled = shuffleQuestionOptions(mockQuestion, 'session-1')
      expect(isAnswerCorrect(shuffled.shuffledOptions, 'z')).toBe(false)
    })

    it('should validate regardless of option position', () => {
      const shuffled = shuffleQuestionOptions(mockQuestion, 'session-1')
      const correctKey = shuffled.shuffledOptions.find(o => o.isCorrect)!.key

      // The correct answer should validate even if it's in a different position
      expect(isAnswerCorrect(shuffled.shuffledOptions, correctKey)).toBe(true)
    })
  })

  describe('getAnswerKeyFromIndex', () => {
    it('should return correct key for valid index', () => {
      const shuffled = shuffleQuestionOptions(mockQuestion, 'session-1')
      const key = getAnswerKeyFromIndex(shuffled.shuffledOptions, 0)

      expect(key).toBeDefined()
      expect(['a', 'b', 'c', 'd']).toContain(key)
    })

    it('should return null for invalid indices', () => {
      const shuffled = shuffleQuestionOptions(mockQuestion, 'session-1')
      expect(getAnswerKeyFromIndex(shuffled.shuffledOptions, -1)).toBeNull()
      expect(getAnswerKeyFromIndex(shuffled.shuffledOptions, 4)).toBeNull()
      expect(getAnswerKeyFromIndex(shuffled.shuffledOptions, 10)).toBeNull()
    })
  })

  describe('getOriginalQuestionIndex', () => {
    it('should return correct original index', () => {
      const questions = shuffleModuleQuestions(mockQuestions, 'session-1')
      const shuffled = shuffleQuestionOrder(questions, 'session-1')

      expect(getOriginalQuestionIndex(shuffled, 0)).toBeGreaterThanOrEqual(0)
      expect(getOriginalQuestionIndex(shuffled, 1)).toBeGreaterThanOrEqual(0)
    })

    it('should return -1 for invalid indices', () => {
      const questions = shuffleModuleQuestions(mockQuestions, 'session-1')
      const shuffled = shuffleQuestionOrder(questions, 'session-1')

      expect(getOriginalQuestionIndex(shuffled, -1)).toBe(-1)
      expect(getOriginalQuestionIndex(shuffled, 10)).toBe(-1)
    })
  })

  describe('Integration tests', () => {
    it('should correctly validate shuffled answers across session', () => {
      const shuffled = shuffleQuestionOptions(mockQuestion, 'session-1')

      const correctOption = shuffled.shuffledOptions.find(o => o.isCorrect)!

      expect(isAnswerCorrect(shuffled.shuffledOptions, correctOption.key)).toBe(true)
    })

    it('should score a quiz correctly with shuffled answers', () => {
      const session = 'session-1'
      const shuffled = shuffleModuleQuestions(mockQuestions, session)

      // Build answers using the shuffled keys
      const answers: Record<number, string> = {}
      const scores: Record<number, boolean> = {}

      shuffled.forEach((q, i) => {
        const correctOption = q.shuffledOptions.find(o => o.isCorrect)!
        answers[i] = correctOption.key
        scores[i] = isAnswerCorrect(q.shuffledOptions, correctOption.key)
      })

      const correctCount = Object.values(scores).filter(Boolean).length
      const score = Math.round((correctCount / shuffled.length) * 100)

      expect(score).toBe(100)
    })

    it('should handle both answer and question shuffling together', () => {
      const session = 'session-1'

      // Shuffle options first
      const shuffled = shuffleModuleQuestions(mockQuestions, session)

      // Then shuffle question order
      const shuffledQuestions = shuffleQuestionOrder(shuffled, session)

      expect(shuffledQuestions).toHaveLength(2)

      // All original indices should be present
      const indices = shuffledQuestions.map(q => q.originalIndex).sort()
      expect(indices).toEqual([0, 1])

      // Each question should have shuffled options
      shuffledQuestions.forEach(q => {
        expect(q.shuffledOptions).toHaveLength(4)
      })
    })

    it('should correctly score quiz with shuffled questions and answers', () => {
      const session = 'session-1'

      // Apply both shuffles
      const shuffledOptions = shuffleModuleQuestions(mockQuestions, session)
      const shuffledQuestions = shuffleQuestionOrder(shuffledOptions, session)

      // Build answers based on current (shuffled) positions
      const answers: Record<number, string> = {}
      const scores: Record<number, boolean> = {}

      shuffledQuestions.forEach((q, displayIdx) => {
        const correctOption = q.shuffledOptions.find(o => o.isCorrect)!
        answers[displayIdx] = correctOption.key
        scores[displayIdx] = isAnswerCorrect(q.shuffledOptions, correctOption.key)
      })

      const correctCount = Object.values(scores).filter(Boolean).length
      const score = Math.round((correctCount / shuffledQuestions.length) * 100)

      expect(score).toBe(100)
    })
  })
})
