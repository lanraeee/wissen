import type { QuizQuestion } from './courseData'

export interface ShuffledOption {
  key: string
  text: string
  isCorrect: boolean
}

export interface ShuffledQuestion extends QuizQuestion {
  shuffledOptions: ShuffledOption[]
}

/**
 * Seeded random number generator for consistent shuffling within a session
 * Uses a simple hash-based approach to ensure same input produces same output
 */
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

/**
 * Fisher-Yates shuffle algorithm with optional seeding
 * If seed is provided, produces deterministic output
 */
function shuffleArray<T>(array: T[], seed?: number): T[] {
  const arr = [...array]
  const random = seed !== undefined ?
    (i: number) => seededRandom(seed + i) :
    () => Math.random()

  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(random(i) * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/**
 * Generate a simple hash from string for seeding
 */
function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash)
}

/**
 * Shuffle quiz answer options while maintaining correctness tracking
 * Uses deterministic seeding based on question content + session ID
 *
 * @param question - The quiz question with original options
 * @param sessionId - Optional session identifier for deterministic shuffling
 * @returns Question with shuffled options array
 */
export function shuffleQuestionOptions(
  question: QuizQuestion,
  sessionId?: string
): ShuffledQuestion {
  const optionEntries = Object.entries(question.options) as Array<[string, string]>

  // Create seed from question text + session ID for deterministic but varied shuffles
  const seed = hashString(question.question + (sessionId || ''))

  // Shuffle the option entries
  const shuffledEntries = shuffleArray(optionEntries, seed)

  // Create shuffled options array with correctness tracking
  const shuffledOptions: ShuffledOption[] = shuffledEntries.map(([key, text]) => ({
    key,
    text,
    isCorrect: key === question.correct
  }))

  return {
    ...question,
    shuffledOptions
  }
}

/**
 * Shuffle all questions in a module
 */
export function shuffleModuleQuestions(
  questions: QuizQuestion[],
  sessionId?: string
): ShuffledQuestion[] {
  return questions.map(q => shuffleQuestionOptions(q, sessionId))
}

/**
 * Create a mapping from new option positions to original keys
 * Useful for storing user answers in a normalized format
 */
export function getAnswerKeyFromIndex(
  shuffledOptions: ShuffledOption[],
  selectedIndex: number
): string | null {
  if (selectedIndex < 0 || selectedIndex >= shuffledOptions.length) {
    return null
  }
  return shuffledOptions[selectedIndex].key
}

/**
 * Check if an answer is correct based on shuffled options
 */
export function isAnswerCorrect(
  shuffledOptions: ShuffledOption[],
  selectedKey: string
): boolean {
  const selected = shuffledOptions.find(opt => opt.key === selectedKey)
  return selected?.isCorrect ?? false
}

/**
 * Shuffle the order of questions in a quiz
 * Maintains original question data, just reorders them
 *
 * @param questions - Array of questions to shuffle
 * @param sessionId - Optional session identifier for deterministic shuffling
 * @returns Reordered questions array with original indices preserved
 */
export function shuffleQuestionOrder(
  questions: ShuffledQuestion[],
  sessionId?: string
): Array<ShuffledQuestion & { originalIndex: number }> {
  // Create indexed array to track original positions
  const indexed = questions.map((q, i) => ({ question: q, originalIndex: i }))

  // Create seed from "question-order" + session ID
  const seed = hashString('question-order' + (sessionId || ''))

  // Shuffle the indexed array
  const shuffledIndexed = shuffleArray(indexed, seed)

  // Return with original indices preserved for answer tracking
  return shuffledIndexed.map(({ question, originalIndex }) => ({
    ...question,
    originalIndex
  }))
}

/**
 * Get the original question index after shuffling
 * Used for mapping shuffled answer positions back to original questions
 */
export function getOriginalQuestionIndex(
  shuffledQuestions: Array<ShuffledQuestion & { originalIndex: number }>,
  currentIndex: number
): number {
  if (currentIndex < 0 || currentIndex >= shuffledQuestions.length) {
    return -1
  }
  return shuffledQuestions[currentIndex].originalIndex
}
