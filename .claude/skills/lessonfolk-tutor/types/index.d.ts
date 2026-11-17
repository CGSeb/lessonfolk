export type LessonState = {
  id: string
  title: string
  status: 'done' | 'skipped' | 'current' | 'todo'
}

// One milestone of the project in focus: reached, the one being worked on, or still ahead.
export type MilestoneState = { title: string; status: 'done' | 'current' | 'todo' }

// The practice project in focus: its milestones and, once they are all reached, the review.
export type ProjectView = {
  id: string
  title: string
  status: 'in_progress' | 'done'
  milestones: MilestoneState[]
  reviewed: number
  reviewTotal: number
}

export type View = {
  state: 'no-progress' | 'offline' | 'all-done' | 'lesson' | 'between' | 'project'
  // The learner's language (profile), for the words of the pane; unknown when offline.
  lang?: 'en' | 'fr'
  courseId?: string
  courseTitle?: string
  themeTitle?: string
  level?: string
  lessons?: LessonState[]
  current?: { id: string; title: string; ideas: string[] }
  next?: { id: string; title: string; courseTitle?: string }
  // State `project`: the project the tutor is coaching.
  project?: ProjectView
  // Offline only: why each attempt to reach the server failed.
  reason?: string[]
}

// Lesson statuses as last read from the server, to spot what a save changed.
export type Snapshot = {
  current?: string
  statuses: Record<string, string>
  // Projects as last read: their status and how many milestones were reached.
  projects?: Record<string, { status: string; reached: number }>
}

// What the tutor worked on last, so the pane follows it: a project (by id) or the lessons.
export type Focus = { kind: 'project'; id?: string } | { kind: 'lesson' }

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
    'lessonfolk-tutor': {
      isActive: boolean
      instance: string
      choices: Choices | null
      view: View
      snapshot: Snapshot | null
      ideas: IdeaMarks
      detailsOpen: boolean
      // The language the learner picked in the pane, over the profile's.
      langChoice: 'en' | 'fr' | null
    }
  }
}
