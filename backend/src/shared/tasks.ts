import type { TaskId } from './types'

export interface TaskDefinition {
  id: TaskId
  title: string
  icon: string
  summary: string
  instructions: string
  passage?: string
}

/** Public-domain phonetics passage used by the "Read aloud" task. */
export const NORTH_WIND =
  'The North Wind and the Sun were disputing which was the stronger, when a traveler came along wrapped in a warm cloak. They agreed that the one who first succeeded in making the traveler take his cloak off should be considered stronger than the other.'

/** The speech tasks, shared by the desktop app and the website so both ask for the same thing. */
export const TASKS: Record<TaskId, TaskDefinition> = {
  reading: {
    id: 'reading',
    title: 'Read aloud',
    icon: '📖',
    summary: 'Read a short passage · about 30 seconds',
    instructions:
      "Read the passage below out loud at your normal pace. Press Start when you're ready, and Stop when you finish.",
    passage: NORTH_WIND
  },
  fluency: {
    id: 'fluency',
    title: 'Name animals',
    icon: '🦊',
    summary: 'Name as many animals as you can · 1 minute',
    instructions:
      "Name as many different animals as you can think of. You have up to one minute. Press Start when you're ready."
  },
  story: {
    id: 'story',
    title: 'Your morning',
    icon: '☀️',
    summary: 'Describe your morning · about 1 minute',
    instructions:
      "Tell me about your morning today, from when you woke up. Speak for about a minute. Press Start when you're ready."
  }
}

export const TASK_LIST: TaskDefinition[] = [TASKS.reading, TASKS.fluency, TASKS.story]
