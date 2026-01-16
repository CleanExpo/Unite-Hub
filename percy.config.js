// Percy Visual Testing Configuration
// https://docs.percy.io/docs/configuration

module.exports = {
  version: 2,
  snapshot: {
    widths: [375, 768, 1440], // Mobile, Tablet, Desktop
    minHeight: 1024,
    percyCSS: `
      /* Hide dynamic content that causes flaky snapshots */
      [data-testid="timestamp"],
      [data-testid="live-indicator"],
      [data-testid="current-time"],
      .animate-pulse,
      .animate-spin,
      .animate-bounce {
        visibility: hidden !important;
      }

      /* Stabilize loading states */
      [data-loading="true"] {
        opacity: 1 !important;
        animation: none !important;
      }

      /* Hide cursor blink in inputs */
      input, textarea {
        caret-color: transparent !important;
      }
    `,
  },
  discovery: {
    allowedHostnames: ['localhost', '*.unite-hub.com', '*.supabase.co'],
    networkIdleTimeout: 500,
    disableCache: true,
  },
  upload: {
    parallel: true,
  },
};
