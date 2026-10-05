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

export type Build = {
  isActive: boolean
  title?: string
  courseId?: string
  level?: string
  theme?: string
  steps: Record<StepId, StepStatus>
  lessons: Lesson[]
  validation?: 'pass' | 'fail'
  note?: string
}

declare module 'claude-code' {
  interface PluginState {
    'course-builder': { build: Build }
  }
}
