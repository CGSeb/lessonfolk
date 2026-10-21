// The words of the Course companion (pane, buttons, toasts) in the learner's language, which
// is the language saved in their profile (`get_progress`). English is the fallback. What the
// mod tells the model (tool descriptions and results) stays in English.

export type Lang = 'en' | 'fr'

// A profile language code ("fr", "fr-CA"…) to a language the mod has words for.
export const langOf = (code?: string): Lang =>
  code?.trim().toLowerCase().split(/[-_]/)[0] === 'fr' ? 'fr' : 'en'

type Words = {
  title: string
  // The learner commands offered as buttons: what the button says, and what a press sends.
  commands: { key: string; label: string; text: string }[]
  say: string
  answer: string
  send: string
  companion: string
  dashboard: string
  lessons: string
  keyIdeas: string
  next: string
  skipped: string
  levels: Record<string, string>
  noProgress: string[]
  offline: string[]
  allDone: string[]
  refused: string[]
  showDetails: string
  hideDetails: string
  copyRules: string
  copied: string
  copyFailed: string
  lessonComplete: (title: string) => string
  newCourse: (course: string, theme?: string) => string
  waits: (reason: string) => string
}

const en: Words = {
  title: 'Course companion',
  commands: [
    { key: 'continue', label: 'Continue', text: 'continue' },
    { key: 'quiz', label: 'Quiz me', text: 'quiz me' },
    { key: 'skip', label: 'Skip', text: 'skip this' },
    { key: 'progress', label: 'My progress', text: 'show my progress' },
  ],
  say: 'Say:',
  answer: 'Answer:',
  send: 'Send',
  companion: 'Companion',
  dashboard: 'Dashboard ↗',
  lessons: 'Lessons',
  keyIdeas: 'Key ideas',
  next: 'Next:',
  skipped: '(skipped)',
  levels: {},
  noProgress: ['No course started yet.', 'Say "start" to begin.'],
  offline: [
    'Waiting for the tutor.',
    'This pane fills in once the tutor reads your progress: say "continue" to start or resume a lesson.',
    'Still empty after that? Check that the LessonFolk server is connected (/mcp).',
  ],
  allDone: ['You have finished every course. Well done!', 'Ask the tutor what to explore next.'],
  refused: ["The app refused the pane's read.", 'Allow it in ~/.claude/settings.json (permissions.allow):'],
  showDetails: 'Show details ▸',
  hideDetails: 'Hide details ▾',
  copyRules: 'Copy rules',
  copied: 'Copied: paste it into ~/.claude/settings.json',
  copyFailed: 'Could not copy to the clipboard',
  lessonComplete: title => `Lesson complete: ${title}`,
  newCourse: (course, theme) => `New course: ${course}${theme ? ` (${theme})` : ''}`,
  waits: reason => `Course companion waits: ${reason}`,
}

const fr: Words = {
  title: 'Compagnon de cours',
  commands: [
    { key: 'continue', label: 'Continuer', text: 'continue' },
    { key: 'quiz', label: 'Interroge-moi', text: 'interroge-moi' },
    { key: 'skip', label: 'Passer', text: 'passe cette leçon' },
    { key: 'progress', label: 'Ma progression', text: 'montre ma progression' },
  ],
  say: 'Dites :',
  answer: 'Répondez :',
  send: 'Envoyer',
  companion: 'Compagnon',
  dashboard: 'Tableau de bord ↗',
  lessons: 'Leçons',
  keyIdeas: 'Idées clés',
  next: 'Suivante :',
  skipped: '(passée)',
  levels: { beginner: 'débutant', intermediate: 'intermédiaire', advanced: 'avancé' },
  noProgress: ['Aucun cours commencé pour l’instant.', 'Dites « commencer » pour démarrer.'],
  offline: [
    'En attente du tuteur.',
    'Ce panneau se remplit dès que le tuteur lit votre progression : dites « continue » pour démarrer ou reprendre une leçon.',
    'Toujours vide après ça ? Vérifiez que le serveur LessonFolk est connecté (/mcp).',
  ],
  allDone: ['Vous avez terminé tous les cours. Bravo !', 'Demandez au tuteur quoi explorer ensuite.'],
  refused: ['L’application a refusé la lecture du panneau.', 'Autorisez-la dans ~/.claude/settings.json (permissions.allow) :'],
  showDetails: 'Afficher les détails ▸',
  hideDetails: 'Masquer les détails ▾',
  copyRules: 'Copier les règles',
  copied: 'Copié : collez-le dans ~/.claude/settings.json',
  copyFailed: 'Impossible de copier dans le presse-papiers',
  lessonComplete: title => `Leçon terminée : ${title}`,
  newCourse: (course, theme) => `Nouveau cours : ${course}${theme ? ` (${theme})` : ''}`,
  waits: reason => `Le compagnon de cours attend : ${reason}`,
}

const WORDS: Record<Lang, Words> = { en, fr }

export const words = (lang?: Lang): Words => WORDS[lang ?? 'en']
