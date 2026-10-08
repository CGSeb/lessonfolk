export type LessonState = {
  id: string
  title: string
  status: 'done' | 'skipped' | 'current' | 'todo'
}

export type View = {
  state: 'no-progress' | 'offline' | 'all-done' | 'lesson' | 'between'
  courseId?: string
  courseTitle?: string
  themeTitle?: string
  level?: string
  lessons?: LessonState[]
  current?: { id: string; title: string; ideas: string[] }
  next?: { id: string; title: string; courseTitle?: string }
}

// Lesson statuses as last read from the server, to spot what a save changed.
export type Snapshot = { current?: string; statuses: Record<string, string> }

// Key ideas of `lessonId` the tutor reported: 1-based numbers.
export type IdeaMarks = { lessonId?: string; covered: number[]; active?: number }

// The answers the tutor offered for the question it just asked, shown as buttons above the prompt.
export type Choices = {
  options: { label: string; reply: string }[]
  isMulti: boolean
  picked: number[]
}


declare module 'claude-code' {
  interface PluginState {
    'course-companion': {
      isActive: boolean
      instance: string
      choices: Choices | null
      view: View
      snapshot: Snapshot | null
      ideas: IdeaMarks
    }
  }
}
