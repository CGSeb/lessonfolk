import { z } from 'zod';

/** Schemas for course content, matching docs/course-format.md. */

const kebab = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
/** Lesson ids are `<course-id>/<file name without .md>`, e.g. `ai-foundations/01-what-is-ai`. */
const lessonIdPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*\/[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const levelSchema = z.enum(['beginner', 'intermediate', 'advanced']);
export type Level = z.infer<typeof levelSchema>;

export const courseIdSchema = z.string().regex(kebab, 'must be a kebab-case course id');
export const lessonIdSchema = z
  .string()
  .regex(lessonIdPattern, 'must look like <course-id>/<lesson-file-name>');

/** `courses/<lang>/index.yaml` */
export const indexSchema = z.strictObject({
  courses: z.array(courseIdSchema),
});
export type IndexFile = z.infer<typeof indexSchema>;

/** `courses/<lang>/<course>/course.yaml` */
export const courseFileSchema = z.strictObject({
  id: courseIdSchema,
  title: z.string().min(1),
  level: levelSchema,
  description: z.string().min(1),
  estimatedHours: z.number().positive(),
  prerequisites: z.array(courseIdSchema).default([]),
  lessons: z.array(lessonIdSchema).min(1),
});
export type CourseFile = z.infer<typeof courseFileSchema>;

/** Frontmatter of `courses/<lang>/<course>/<lesson>.md` */
export const lessonFrontmatterSchema = z.strictObject({
  id: lessonIdSchema,
  title: z.string().min(1),
  level: levelSchema,
  estimatedMinutes: z.number().int().positive(),
  objectives: z.array(z.string().min(1)).min(1),
  prerequisites: z.array(lessonIdSchema).default([]),
});
export type LessonFrontmatter = z.infer<typeof lessonFrontmatterSchema>;

/** Render zod issues as `field: message` lines. */
export function formatIssues(error: z.ZodError): string[] {
  return error.issues.map((issue) => {
    const path = issue.path.length ? issue.path.join('.') : '(root)';
    if (issue.code === 'invalid_type' && /received undefined$/.test(issue.message)) {
      return `${path}: missing required field (expected ${issue.expected})`;
    }
    if (issue.code === 'unrecognized_keys') {
      return `${path}: unknown field${issue.keys.length > 1 ? 's' : ''} ${issue.keys.join(', ')}`;
    }
    return `${path}: ${issue.message}`;
  });
}
