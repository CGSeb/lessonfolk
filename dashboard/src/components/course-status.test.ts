import { describe, expect, it } from 'vitest';
import { t } from '../i18n/en';
import { courseStatusDisplay, finishedLessons, getCourseStatus, isCourseDone } from './course-status';

const counts = (over: Partial<Parameters<typeof getCourseStatus>[0]> = {}) => ({
  done: 0,
  skipped: 0,
  placementSkipped: 0,
  inProgress: 0,
  total: 3,
  completed: false,
  ...over,
});

describe('getCourseStatus', () => {
  it('is not started without any progress entry', () => {
    expect(getCourseStatus(counts())).toBe('not_started');
  });

  it('is in progress once a lesson is started, done or skipped', () => {
    expect(getCourseStatus(counts({ inProgress: 1 }))).toBe('in_progress');
    expect(getCourseStatus(counts({ done: 1 }))).toBe('in_progress');
    expect(getCourseStatus(counts({ skipped: 1 }))).toBe('in_progress');
  });

  it('is completed when every lesson is done or skipped', () => {
    expect(getCourseStatus(counts({ done: 2, skipped: 1, completed: true }))).toBe('completed');
  });

  it('ignores level-check skips when deciding whether the learner started', () => {
    expect(getCourseStatus(counts({ skipped: 2, placementSkipped: 2 }))).toBe('not_started');
    expect(getCourseStatus(counts({ skipped: 2, placementSkipped: 2, inProgress: 1 }))).toBe('in_progress');
    expect(getCourseStatus(counts({ skipped: 2, placementSkipped: 1 }))).toBe('in_progress');
  });

  it('is skipped by placement when the level check skipped every lesson', () => {
    expect(getCourseStatus(counts({ skipped: 3, placementSkipped: 3, completed: true }))).toBe('skipped_placement');
    expect(getCourseStatus(counts({ done: 1, skipped: 2, placementSkipped: 2, completed: true }))).toBe('completed');
  });

  it('treats an empty course as not started', () => {
    expect(getCourseStatus(counts({ total: 0 }))).toBe('not_started');
  });
});

describe('finishedLessons', () => {
  it('counts done and skipped lessons', () => {
    expect(finishedLessons(counts({ done: 2, skipped: 1, inProgress: 1 }))).toBe(3);
  });
});

describe('courseStatusDisplay', () => {
  it('maps each status to an existing UI string and badge variant', () => {
    expect(t(courseStatusDisplay('not_started').key)).toBe('Not started');
    expect(courseStatusDisplay('in_progress')).toEqual({ key: 'status.inProgress', variant: 'info' });
    expect(courseStatusDisplay('completed')).toEqual({ key: 'status.completed', variant: 'success' });
    expect(courseStatusDisplay('skipped_placement')).toEqual({ key: 'status.skippedPlacement', variant: 'placement' });
  });
});

describe('isCourseDone', () => {
  it('is true for completed and level-check-skipped courses only', () => {
    expect(isCourseDone('completed')).toBe(true);
    expect(isCourseDone('skipped_placement')).toBe(true);
    expect(isCourseDone('in_progress')).toBe(false);
    expect(isCourseDone('not_started')).toBe(false);
  });
});
