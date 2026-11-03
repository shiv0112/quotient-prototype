/* Builder A demo data: sign-in, onboarding, settings, digest. Read-only extras; core data lives in data.js. */
window.QD = window.QD || {};
QD.a = {
  meetingsThisWeek: 12,          // shown after calendar connects (ux-spec S03a)
  newCode: 'QX4-81M',            // invented: the fresh Telegram code after "Get a new code"
  bot: '@QuotientRemindBot',
  version: '1.0',
  digestTimes: ['7:00','7:30','8:00','8:30','9:00'],
  digestOpens: '#meeting-wei-today',   // first item that needs action (ux-spec S20)
  // Third-party sign-in marks. Brand colours are fixed by Google / Microsoft / Telegram, so they are the one place raw colours appear.
  logo: {
    google: '<svg class="logo" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>',
    microsoft: '<svg class="logo" viewBox="0 0 21 21" aria-hidden="true"><rect width="10" height="10" fill="#F25022"/><rect x="11" width="10" height="10" fill="#7FBA00"/><rect y="11" width="10" height="10" fill="#00A4EF"/><rect x="11" y="11" width="10" height="10" fill="#FFB900"/></svg>',
    telegram: '<svg class="logo" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="12" fill="#2AABEE"/><path fill="#fff" d="M5.4 11.8l11.6-4.5c.5-.2 1 .1.8.9l-2 9.3c-.1.6-.5.8-1 .5l-3-2.2-1.4 1.4c-.2.2-.3.3-.6.3l.2-3.1 5.6-5.1c.2-.2 0-.3-.4-.1l-6.9 4.4-3-.9c-.6-.2-.6-.6.1-.9z"/></svg>'
  }
};
