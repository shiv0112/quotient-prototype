/* Builder C demo data (share, write-up, MAS, nudge, cases). Extends Q.data read-only.
   Invented for the demo (not in the brief): client email addresses, Siti's MAS answers.
   Siti's meeting transcripts now live in data.js (transcripts['siti-oct13'], ['siti-oct29']). */
window.QD = window.QD || {};
QD.c = {
  emails: { wei:'wei.tan@example.com', alvin:'alvin.lim@example.com', priya:'priya.k@example.com', siti:'siti.nur@example.com' },
  /* Siti: not a Selected Client (0 of 3 "no"). Question text matches data.js mas.questions. */
  masSiti: { questions:[
    { q:'Is the client under 62?', answer:'yes', from:'From the case: age 33', note:'If the client turns 62 before the policy starts, apply the safeguards (FAQ 6).' },
    { q:'Is the client proficient in spoken and written English, or the language the meeting and documents use?', answer:'yes' },
    { q:'Does the client have at least GCE O-Level or N-Level, or equivalent?', answer:'yes' } ] }
  /* Cases list rows use Q.status() (core.js), the same source as Today and the Case card. */
};
