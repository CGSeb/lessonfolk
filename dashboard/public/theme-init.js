// Apply the saved light/dark choice before first paint (see ThemeToggle).
// A file of its own, not an inline script, so the CSP needs no 'unsafe-inline' for scripts.
try {
  const theme = localStorage.getItem('lessonfolk-theme');
  if (theme === 'light' || theme === 'dark') document.documentElement.dataset.theme = theme;
} catch {}
