import {
  shuffleQuestionOptions,
  shuffleModuleQuestions,
  isAnswerCorrect,
  getAnswerKeyFromIndex,
} from './quizUtils'
import type { QuizQuestion, Module } from './courseData'

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

  describe('Integration tests', () => {
    it('should correctly validate shuffled answers across session', () => {
      const shuffled = shuffleQuestionOptions(mockQuestion, 'session-1')

      // Simulate user selecting different options
      mockQuestion.options.a; // Position might vary
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
  })
})
