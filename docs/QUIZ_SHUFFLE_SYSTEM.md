# Quiz Answer Shuffle System

## Overview

The Quiz Answer Shuffle System randomly reshuffles answer options for quiz questions on community hub courses. This improves the learning experience by preventing pattern recognition and encouraging genuine understanding.

## Features

### 1. **Deterministic Shuffling**
- Uses a seeded random number generator to ensure the same question gets shuffled consistently within a user session
- Each user sees a different shuffle order (based on their session ID)
- Same shuffle persists across page navigations within the same session

### 2. **Correctness Tracking**
- Maintains tracking of which answer is correct regardless of its position
- Uses the original answer key (a, b, c, d) for validation
- Stores user answers as original keys, not positions

### 3. **Session-Based Stability**
- Shuffle seed is generated once per browser session
- Stored in `sessionStorage` for persistence during the session
- New browser sessions get new shuffle seeds

## Architecture

### Core Components

#### `lib/quizUtils.ts`
Contains all shuffle logic:
- `shuffleQuestionOptions()` - Shuffles options for a single question
- `shuffleModuleQuestions()` - Shuffles all questions in a module
- `isAnswerCorrect()` - Validates answers against shuffled options
- `getAnswerKeyFromIndex()` - Maps selected option to original key

#### `lib/useShuffledQuiz.ts`
React hook that:
- Manages session ID generation and persistence
- Generates shuffled quiz on component mount
- Memoizes results for performance

#### `components/CourseModule.tsx`
Updated to:
- Use the `useShuffledQuiz` hook
- Render shuffled options instead of original order
- Validate answers using the new correctness checker

## How It Works

### 1. Session Initialization
```typescript
const { shuffledQuiz, sessionId } = useShuffledQuiz(module)
```
- First visit: Creates random session ID
- Stores in `sessionStorage`
- ID persists for the browser session

### 2. Question Shuffling
```typescript
// For each question, Fisher-Yates shuffle is applied
seed = hash(question_text + session_id)
shuffled_options = Fisher_Yates_Shuffle(options, seed)
```

### 3. Answer Validation
```typescript
// User selects an option (stored as original key)
// Validation checks: selectedKey === original_correct_key
const isCorrect = isAnswerCorrect(shuffledOptions, 'b')
```

## Benefits

1. **Prevents Guessing Patterns**
   - Answer position changes each session
   - Students can't remember "usually the 3rd option"

2. **Encourages Understanding**
   - Forces reading all options carefully
   - Reduces reliance on memorization

3. **Fair Assessment**
   - Same difficulty for all students
   - Each gets randomly ordered options
   - No advantage from previous attempts

4. **Performance Optimized**
   - Shuffle computed once per module load
   - Memoized results prevent recalculation
   - Minimal performance impact

## Usage Examples

### Basic Usage (Automatic)
```typescript
// CourseModule already uses the shuffle system
// No changes needed in component usage
```

### Custom Shuffling
```typescript
import { shuffleQuestionOptions } from '@/lib/quizUtils'

const question = module.quiz[0]
const shuffled = shuffleQuestionOptions(question, 'my-session-id')

// Use shuffled.shuffledOptions for rendering
```

### Answer Validation
```typescript
import { isAnswerCorrect } from '@/lib/quizUtils'

const userSelectedKey = 'c'
const isCorrect = isAnswerCorrect(shuffled.shuffledOptions, userSelectedKey)
```

## Seeding Algorithm

The system uses a two-part seeding strategy:

1. **Question Hash**
   - Takes the question text as input
   - Produces consistent hash (same question = same base hash)

2. **Session Mixing**
   - Combines question hash with session ID
   - Produces unique but deterministic seed per question per session

```typescript
seed = hash(question_text) + hash(session_id)
```

This ensures:
- Same question, same session = same shuffle order
- Same question, different session = different shuffle order
- Different question = different shuffle order

## Browser Compatibility

- Works in all modern browsers
- Uses standard `sessionStorage` API
- Falls back gracefully if storage unavailable
- No external dependencies required

## Future Enhancements

### Potential Features
1. **Per-Quiz Shuffle Tracking**
   - Analytics on which answer positions are selected most
   - Identify potential biases in question writing

2. **Difficulty-Based Shuffling**
   - Harder questions might shuffle more aggressively
   - Track time spent per shuffled option

3. **Rotate Shuffle Strategies**
   - Implement multiple shuffle algorithms
   - Randomly select which algorithm to use per question

4. **A/B Testing**
   - Track learning outcomes with/without shuffling
   - Measure impact on quiz scores

5. **Accessibility Improvements**
   - Ensure shuffle order can be announced to screen readers
   - Add visual indicators for selected answer

## Testing

### Test Cases
1. **Consistency Test**: Same session, same question = same shuffle
2. **Variation Test**: Different sessions = different shuffles
3. **Correctness Test**: Validation works regardless of shuffle order
4. **Performance Test**: Shuffle doesn't impact page load time
5. **Storage Test**: SessionStorage persists across navigation

### Example Test
```typescript
describe('quizUtils', () => {
  it('should produce consistent shuffle for same session', () => {
    const q1 = shuffleQuestionOptions(question, 'session-1')
    const q2 = shuffleQuestionOptions(question, 'session-1')
    expect(q1.shuffledOptions).toEqual(q2.shuffledOptions)
  })

  it('should produce different shuffle for different sessions', () => {
    const q1 = shuffleQuestionOptions(question, 'session-1')
    const q2 = shuffleQuestionOptions(question, 'session-2')
    expect(q1.shuffledOptions).not.toEqual(q2.shuffledOptions)
  })
})
```

## Troubleshooting

### Issue: Shuffle order changes mid-session
**Solution**: Check browser privacy settings. `sessionStorage` might be disabled.

### Issue: Students see same shuffle order
**Solution**: Ensure unique session IDs are generated. Check if `sessionStorage` is clearing.

### Issue: Performance degradation
**Solution**: Shuffle is memoized. Check if `useShuffledQuiz` hook is being used correctly.

## Configuration

No configuration needed - the system works out of the box. To customize:

1. **Adjust Shuffle Seed**
   - Edit `hashString()` function in `quizUtils.ts`
   - Change hashing algorithm for different shuffle patterns

2. **Change Shuffle Algorithm**
   - Replace `Fisher-Yates` with another algorithm in `shuffleArray()`
   - Maintain the seeding structure

3. **Custom Session ID**
   - Pass custom `sessionId` to `shuffleQuestionOptions()`
   - Override the hook's session generation
