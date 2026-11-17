export type StepId =
  | 'prepare'
  | 'interview'
  | 'outline'
  | 'write'
  | 'register'
  | 'validate'
  | 'handback'

export type StepStatus = 'todo' | 'active' | 'done'

export type Lesson = { file: string; title?: string; isWritten: boolean }

/** What is being built: a course (create-course) or a practice project (create-project). */
export type BuildKind = 'course' | 'project'

export type Build = {
  isActive: boolean
  /** Left out in a summary saved before projects existed: a course. */
  kind?: BuildKind
  title?: string
  /** The course id, or the project id for a project. */
  courseId?: string
  level?: string
  theme?: string
  steps: Record<StepId, StepStatus>
  lessons: Lesson[]
  /** A project's milestone titles, in order. */
  milestones?: string[]
  /** A project's files written so far, by language (`en`, `fr`). */
  projectFiles?: string[]
  validation?: 'pass' | 'fail'
  note?: string
}

declare module 'claude-code' {
  interface PluginState {
    'course-builder': { build: Build }
  }
}
