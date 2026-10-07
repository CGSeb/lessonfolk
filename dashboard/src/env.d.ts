/// <reference path="../.astro/types.d.ts" />

declare namespace App {
  interface Locals {
    /** LESSONFOLK_AUTH: `none` (one local learner, no sign-in) or `oauth`. Set by src/middleware.ts. */
    authMode: import('./lib/auth/settings').AuthMode;
    /** The current user (`null` when signed out). Progress belongs to `user.id`. Set by src/middleware.ts. */
    user: import('./lib/auth/current-user').CurrentUser | null;
  }
}
