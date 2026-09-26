import { NORTH_WIND } from '../../../shared/tasks'
import type { TaskId } from './types'

export { TASKS, TASK_LIST, type TaskDefinition } from '../../../shared/tasks'

export type ScriptVariant = 'healthy' | 'markers'

/** Demo transcripts in markup: ~filler  ^repeated  ?word-finding  ... long pause */
export const SCRIPTS: Record<TaskId, Record<ScriptVariant, string>> = {
  reading: {
    healthy: NORTH_WIND,
    markers:
      'The North Wind and the ~um Sun were ... disputing which was the ^the the stronger, when a ~uh traveler came along ... wrapped in a warm ... ?the ?coat ?thing cloak. They agreed that the one who ~um first ... succeeded in making the ^the the traveler take his cloak off ... should be considered stronger than the ~uh other.'
  },
  fluency: {
    healthy:
      'Dog, cat, horse, cow, pig, sheep, goat, chicken, duck, lion, tiger, bear, elephant, giraffe, zebra, monkey, rabbit, mouse, deer, wolf, fox, eagle, owl, shark, whale, dolphin, snake, frog, turtle, kangaroo.',
    markers:
      'Dog, ~um cat ... ^dog dog ~uh ... horse ... ?the ?one ?with ?stripes ... cow ~um ... ^cat cat ... pig ... ~uh ... bird ... ?the ?big ?gray ?one ... elephant.'
  },
  story: {
    healthy:
      'This morning I woke up around seven, made a pot of coffee, and read the newspaper on the porch. Then I called my daughter to plan her visit this weekend, and after that I walked the dog around the park before breakfast.',
    markers:
      'This morning I ~um woke up ... and I made the ... ?the ?hot ?drink ... coffee. Then I ~uh called my ^my daughter ... about the ~um ... ^visit visit. And then I ~uh ... walked the ... ?the ?animal dog around the ... ^the the park.'
  }
}
