/* Builder C demo data (share, write-up, MAS, nudge, Telegram, cases). Extends Q.data read-only.
   Invented for the demo (not in the brief): client email addresses, Siti's transcript lines, Siti's MAS answers. */
window.QD = window.QD || {};
QD.c = {
  emails: { wei:'wei.tan@example.com', alvin:'alvin.lim@example.com', priya:'priya.k@example.com', siti:'siti.nur@example.com' },
  /* Siti's meeting (mic only). Times match the write-up source chips in data.js. */
  sitiMeeting: { title:'Meeting with Siti Nur · Tue 13 Oct', lines:[
    ['03:12','I want cover until 65, while the kids are still young.'],
    ['05:40','I would like to stay under three and a half thousand a year.'],
    ['07:05','The critical illness part matters to me.'] ] },
  /* Siti: not a Selected Client (0 of 3 "no"). */
  masSiti: { questions:[
    { q:'Is the client under 62?', answer:'yes', from:'From the case: age 33' },
    { q:'Is the client proficient in the language of the meeting and documents?', answer:'yes' },
    { q:'Does the client have at least O-level or N-level education?', answer:'yes' } ] }
  /* Cases list rows use Q.status() (core.js), the same source as Today and the Case card. */
};
