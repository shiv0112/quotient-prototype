/* Quotient demo data. Single source for every screen. Read it as Q.data.
   Source: docs/design/BRIEF.md "Demo data". Insurers are synthetic. Figures the brief does not give
   (term, riders, other years) are synthetic demo values, consistent across screens. Today = Tue 3 Nov 2026.
   Screens may mutate this in memory (e.g. confirming a cell); nothing is saved. */
(function(){
  'use strict';

  var today = { date:'Tue 3 Nov', long:'Tuesday 3 November', hour:9 };

  var adviser = { name:'Rachel Lim', first:'Rachel', initials:'RL', email:'rachel.lim@kallangadvisers.sg',
    firm:'Kallang Advisers', signin:'Google', telegram:'@rachel_lim', waitDays:3, digestTime:'8:00',
    phrase:['maple','lantern','pepper','drift'], telegramCode:'QX4-72K' };

  var insurers = {
    harbour:  { name:'Harbour Assurance', short:'Harbour',  file:'harbour-wl.pdf',  pages:14 },
    meridian: { name:'Meridian Life',     short:'Meridian', file:'meridian-wl.pdf', pages:12 },
    orchid:   { name:'Orchid Mutual',     short:'Orchid',   file:'orchid-wl.pdf',   pages:16 }
  };

  /* LIA order, whole life par first. kind: money | text. grp: summary | guaranteed | i300 | i425 */
  var rows = [
    { key:'premium', label:'Annual premium',  grp:'summary', kind:'money' },
    { key:'term',    label:'Premium term',    grp:'summary', kind:'text' },
    { key:'sa',      label:'Sum assured',     grp:'summary', kind:'money' },
    { key:'riders',  label:'Riders',          grp:'summary', kind:'text' },
    { key:'g10',  label:'Year 10', grp:'guaranteed', kind:'money', yr:'10' },
    { key:'g20',  label:'Year 20', grp:'guaranteed', kind:'money', yr:'20' },
    { key:'g65',  label:'Age 65',  grp:'guaranteed', kind:'money', yr:'65' },
    { key:'a10',  label:'Year 10', grp:'i300', kind:'money', yr:'10' },
    { key:'a20',  label:'Year 20', grp:'i300', kind:'money', yr:'20' },
    { key:'a65',  label:'Age 65',  grp:'i300', kind:'money', yr:'65' },
    { key:'b10',  label:'Year 10', grp:'i425', kind:'money', yr:'10' },
    { key:'b20',  label:'Year 20', grp:'i425', kind:'money', yr:'20' },
    { key:'b65',  label:'Age 65',  grp:'i425', kind:'money', yr:'65' }
  ];
  var groups = {
    summary:    { label:'Plan' },
    guaranteed: { label:'Guaranteed value' },
    i300:       { label:'Illustrated total at 3.00% a year', ng:true },
    i425:       { label:'Illustrated total at 4.25% a year', ng:true }
  };

  /* cell = [value, page, flag]; flag: 'check' (low confidence) | 'missing' (not found) */
  function plan(p){ var o={}; Object.keys(p).forEach(function(k){ var c=p[k]; o[k]={ v:c[0], p:c[1], flag:c[2]||null }; }); return o; }

  var weiSet = {
    harbour: plan({ premium:[4200,3], term:['20 years',3], sa:[180000,3], riders:['Early critical illness',4],
      g10:[18400,6], g20:[52300,6], g65:[98500,6], a10:[24100,6], a20:[64900,6], a65:[132400,6],
      b10:[26900,6], b20:[72760,6,'check'], b65:[171800,6] }),
    meridian: plan({ premium:[3600,2], term:['25 years',2], sa:[200000,2], riders:['Early critical illness',3],
      g10:[14200,5], g20:[46800,5], g65:[88900,5], a10:[19800,6], a20:[60450,6], a65:[118600,6],
      b10:[22300,6], b20:[68821,6], b65:[152300,6] }),
    orchid: plan({ premium:[3150,4], term:['20 years',4], sa:[155000,4], riders:['None',4],
      g10:[13100,8], g20:[44900,8], g65:[79400,8], a10:[17900,9], a20:[57600,9], a65:[104200,9],
      b10:[20100,9], b20:[65866,9], b65:[null,9,'missing'] })
  };
  var harbourV2 = plan({ premium:[3300,3], term:['20 years',3], sa:[165000,3], riders:['Early critical illness',4],
    g10:[14500,6], g20:[41100,6], g65:[77300,6], a10:[18900,6], a20:[51000,6], a65:[104000,6],
    b10:[21100,6], b20:[57170,6], b65:[135000,6] });

  function clean(set, scale){ // copy a set, clear flags, optional scale (synthetic, rounded to S$10)
    var out={}; Object.keys(set).forEach(function(ins){ out[ins]={};
      Object.keys(set[ins]).forEach(function(k){ var c=set[ins][k], v=c.v;
        if(typeof v==='number' && scale) v=Math.round(v*scale/10)*10;
        if(v===null) v=Math.round(set.orchid.a65.v*1.3*(scale||1)/10)*10;
        out[ins][k]={ v:v, p:c.p, flag:null }; }); });
    return out;
  }

  var steps = [
    { key:'met', label:'Met' }, { key:'compared', label:'Compared' }, { key:'shared', label:'Shared' },
    { key:'replied', label:'Client replied' }, { key:'chosen', label:'Chosen' }, { key:'writeup', label:'Write-up' },
    { key:'review', label:'Firm review' }, { key:'closed', label:'Won / Lost' }
  ];

  /* now = index of the current state in steps. dates = done-step dates by key. */
  var cases = {
    wei:     { no:402, name:'Wei Tan', first:'Wei', age:35, product:'Whole life', now:1, selected:false,
      dates:{ met:'Wed 28 Oct', compared:'Mon 2 Nov' }, last:'Yesterday',
      tables:{ v1:{ plans:['harbour','meridian','orchid'], cells:weiSet } }, meeting:'wei-today', sends:2 },
    priya:   { no:398, name:'Priya Krishnan', first:'Priya', age:41, product:'Whole life', now:2, selected:false,
      dates:{ met:'Thu 22 Oct', compared:'Tue 27 Oct', shared:'Sat 31 Oct' }, last:'3 days ago', quietDays:3,
      tables:{ v1:{ plans:['harbour','meridian','orchid'], cells:clean(weiSet,1.12) } }, sends:2 },
    alvin:   { no:396, name:'Alvin Lim', first:'Alvin', age:35, product:'Whole life', now:4, chosenLabel:'Revised', selected:false,
      dates:{ met:'Mon 19 Oct', compared:'Thu 22 Oct', shared:'Fri 23 Oct', replied:'Mon 26 Oct', chosen:'Mon 2 Nov' }, last:'Yesterday',
      tables:{ v1:{ plans:['harbour','meridian','orchid'], cells:clean(weiSet) },
               v2:{ plans:['harbour','meridian','orchid'], cells:(function(){ var c=clean(weiSet); c.harbour=clean({h:harbourV2}).h; return c; })(), changed:'harbour' } }, sends:3 },
    siti:    { no:401, name:'Siti Nur', first:'Siti', age:33, product:'Whole life', now:5, selected:false,
      dates:{ met:'Tue 13 Oct', compared:'Fri 16 Oct', shared:'Mon 19 Oct', replied:'Wed 21 Oct', chosen:'Thu 29 Oct', writeup:'Mon 2 Nov' }, last:'Yesterday',
      tables:{ v2:{ plans:['harbour','meridian','orchid'], cells:(function(){ var c=clean(weiSet,.95); c.harbour=clean({h:harbourV2}).h; return c; })() } }, chose:'Harbour Assurance v2', sends:3 },
    marcus:  { no:393, name:'Marcus Raj', first:'Marcus', age:64, product:'Whole life', now:6, selected:true, language:'Mandarin',
      dates:{ met:'Tue 27 Oct', compared:'Wed 28 Oct', shared:'Wed 28 Oct', replied:'Thu 29 Oct', chosen:'Thu 29 Oct', writeup:'Fri 30 Oct', review:'Mon 2 Nov' }, last:'Yesterday',
      tables:{ v1:{ plans:['harbour','meridian','orchid'], cells:clean(weiSet,1.6) } }, sends:3 },
    kevin:   { no:388, name:'Kevin Ong', first:'Kevin', age:39, product:'Whole life', now:7, result:'won', selected:false,
      dates:{ met:'Mon 5 Oct', compared:'Wed 7 Oct', shared:'Thu 8 Oct', replied:'Mon 12 Oct', chosen:'Mon 12 Oct', writeup:'Wed 14 Oct', closed:'Tue 20 Oct' }, last:'2 weeks ago',
      tables:{ v1:{ plans:['harbour','meridian','orchid'], cells:clean(weiSet,1.05) } }, chose:'Meridian Life', sends:4 },
    jasmine: { no:390, name:'Jasmine Ong', first:'Jasmine', age:29, product:'Whole life', now:7, result:'lost', lostAt:3, selected:false, reason:'Budget changed',
      dates:{ met:'Fri 9 Oct', compared:'Tue 13 Oct', shared:'Wed 14 Oct', replied:'Tue 20 Oct', closed:'Tue 20 Oct' }, last:'2 weeks ago',
      tables:{ v1:{ plans:['harbour','meridian','orchid'], cells:clean(weiSet,.82) } }, sends:2 },
    daniel:  { no:405, name:'Daniel Lee', first:'Daniel', age:31, product:'Whole life', now:0, selected:false,
      dates:{ met:'Mon 2 Nov' }, last:'Yesterday', tables:{}, meeting:'daniel-past', sends:0,
      pending:{ v1:{ plans:['harbour','meridian','orchid'], cells:clean(weiSet,.75) } } } // becomes tables after "Compare plans" runs
  };
  var caseOrder = ['wei','priya','alvin','siti','marcus','daniel','kevin','jasmine'];

  /* Today's "Needs you" is computed from the cases by Q.needs() / Q.status() in core.js. */

  var digest = { sent:'8:00', items:[
    { text:'Wei Tan 11:00', go:'#case-wei' }, { text:'Priya quiet 3 days', go:'#case-priya' }, { text:'Share v2 with Alvin', go:'#case-alvin' } ] };

  var meetings = {
    sync:'Google Calendar · synced 2 min ago',
    upcoming:[
      { id:'wei-today', day:'Today', time:'11:00', end:'12:00', who:'Wei Tan', app:'Google Meet', c:'wei', notes:true },
      { id:'huddle', day:'Today', time:'14:30', end:'15:00', who:'Team huddle', app:'Teams', internal:true, notes:false },
      { id:'alvin-wed', day:'Tomorrow', time:'10:00', end:'10:45', who:'Alvin Lim', app:'Zoom', c:'alvin', notes:true },
      { id:'siti-thu', day:'Thu 5 Nov', time:'15:00', end:'16:00', who:'Siti Nur', app:'In person', c:'siti', notes:false },
      { id:'marcus-fri', day:'Fri 6 Nov', time:'10:30', end:'11:30', who:'Marcus Raj', app:'In person', c:'marcus', notes:true }
    ],
    past:[
      { id:'daniel-past', date:'Mon 2 Nov', time:'16:00', who:'Daniel Lee', app:'In person', c:'daniel', notesReady:true },
      { id:'junhao', date:'Fri 30 Oct', time:'12:30', who:'Teo Jun Hao', app:'Zoom', c:null, notesReady:false },
      { id:'wei-oct', date:'Wed 28 Oct', time:'11:00', who:'Wei Tan', app:'Google Meet', c:'wei', notesReady:true },
      { id:'marcus-oct', date:'Tue 27 Oct', time:'14:00', who:'Marcus Raj', app:'In person', c:'marcus', notesReady:true }
    ]
  };

  /* Transcripts. labels:false = mic only (one plain transcript). */
  var transcripts = {
    'daniel-past': { labels:false, lines:[
      ['00:12','Thanks for coming in. Shall we start with what you have now?'],
      ['01:05','I only have the group cover from work. Nothing on my own.'],
      ['03:40','We are hoping to start a family in the next two years.'],
      ['06:18','A budget around three thousand a year feels okay.'],
      ['09:02','I can bring two or three whole life illustrations next time.'] ] },
    'wei-oct': { labels:true, lines:[
      ['You','00:20','What would you like this plan to do for your family?'],
      ['Client','00:41','Cover to 65, and something for the kids\' university.'],
      ['Client','02:10','The children are 8 and 11 now.'],
      ['Client','04:32','About four thousand a year is my limit.'],
      ['You','05:15','I\'ll compare Harbour, Meridian and Orchid side by side.'] ] },
    'marcus-oct': { labels:false, lines:[
      ['00:30','Good afternoon, thank you for having me.'],
      ['02:15','Can we go through it in Mandarin?'],
      ['04:02','My daughter will come for the next meeting.'] ] }
  };

  /* Privacy gate: exact text sent, by feature. Wei has two children, aged 8 and 11. */
  var gate = {
    compare: { c:'wei', sub:'To build the comparison. Your PDFs stay here; only this text is sent.',
      map:[ ['Wei Tan','[CLIENT]'], ['Tan Jia Hui','[CHILD 1]'], ['Tan Jia Le','[CHILD 2]'], ['Straits Freight Pte Ltd','[EMPLOYER]'], ['9123 4567','removed'], ['14 Mar 1991','age 35'] ],
      known:'Harbour Assurance, Meridian Life · read on this device, nothing sent',
      cards:[
        { src:'Your notes', text:'[CLIENT], age 35, project manager at [EMPLOYER]. Married with two children, [CHILD 1] (8) and [CHILD 2] (11). Wants life cover to age 65 and a fund for the children\'s university. Budget about S$4,000 a year. Prefers a whole life participating plan. [CLIENT] asked how illustrated values differ from guaranteed ones.' },
        { src:'Orchid Mutual PDF · page 3 to 5', text:'Life assured: [CLIENT], age next birthday 36. Plan: Orchid Whole Life Par. Annual premium S$3,150, premium term 20 years, sum assured S$155,000. Benefit illustration at 3.00% and 4.25% a year, policy years 1 to 20. [CLIENT] is a non-smoker.' } ] },
    writeup: { c:'siti', sub:'To draft the write-up for Siti Nur #401.' },
    nudge:   { c:'priya', sub:'To draft a nudge for Priya Krishnan #398. Only one talking point and [CLIENT] are sent.',
      cards:[ { src:'Talking point', text:'[CLIENT] wanted to know which plan keeps the premium under S$4,500 a year.' } ] },
    'compare-daniel': { c:'daniel', sub:'To build the comparison. Your PDFs stay here; only this text is sent.' },
    'mas-suggest': { c:'marcus', sub:'To suggest answers to the 3 questions. You choose every answer.' }
  };

  /* "What left your device" log, newest first. */
  var log = {
    wei: [
      { feature:'Answer suggestions', when:'Mon 2 Nov, 16:52', text:'[CLIENT], age 35. Meeting in English. Quote: "I did my degree here and work in English every day."' },
      { feature:'Comparison', when:'Mon 2 Nov, 16:40', text:'[CLIENT], age 35, project manager at [EMPLOYER]. Married with two children, [CHILD 1] (8) and [CHILD 2] (11). Wants life cover to age 65 and a fund for the children\'s university. Budget about S$4,000 a year.' } ],
    priya: [ { feature:'Nudge', when:'Tue 3 Nov, 08:05', text:'[CLIENT] wanted to know which plan keeps the premium under S$4,500 a year.' },
             { feature:'Comparison', when:'Tue 27 Oct, 15:20', text:'[CLIENT], age 41, teacher. Wants cover to age 65.' } ],
    fixed:[ 'MAS checks: plain rules on this device. Nothing sent.', 'Shares: the PDF went from you to the client. Nothing uploaded.', 'Recordings and transcripts stay on this device.' ]
  };

  /* Write-up for Siti (2 of 4 ticked). Sentence: [text, sourceLabel, sourceRef]. Blanks: {blank:'Existing cover'}. */
  var writeup = { c:'siti', plan:'Harbour Assurance v2', drafted:'Tue 3 Nov', parts:[
    { title:'What Siti needs', ticked:true, s:[ ['Cover until age 65 while her children are young.','Meeting 03:12','m:03:12'], ['A premium she can keep paying, under S$3,500 a year.','Meeting 05:40','m:05:40'] ] },
    { title:'Why this plan', ticked:true, s:[ ['Harbour v2 costs S$3,300 a year, within her budget.','Table · Harbour v2 · premium','siti/v2/harbour/premium'], ['It keeps the early critical illness rider she asked about.','Table · Harbour v2 · riders','siti/v2/harbour/riders'] ] },
    { title:'Why not the others', ticked:false, s:[ ['Meridian Life has a 25-year premium term, longer than she wanted.','Table · Meridian · premium term','siti/v2/meridian/term'], [{ blank:'Reason Orchid was not chosen' }] ] },
    { title:'What Siti should know', ticked:false, s:[ ['Illustrated values at 3.00% and 4.25% are not guaranteed.','Table · group label','siti/v2/harbour/b20'], ['Existing cover: ',null,null,{ blank:'Existing cover' }] ] } ] };

  /* MAS checks for Marcus (Selected Client, firm review 3 of 5). */
  var mas = { c:'marcus',
    questions:[
      { q:'Is the client under 62?', answer:'no', from:'From the case: age 64' },
      { q:'Is the client proficient in the language of the meeting and documents?', answer:'no', suggest:{ value:'no', quote:'Can we go through it in Mandarin?', at:'02:15' } },
      { q:'Does the client have at least O-level or N-level education?', answer:null } ],
    checklist:[
      { t:'Declaration signed by the client and you', ref:'§10C', done:true, date:'Mon 2 Nov' },
      { t:'Trusted individual present, with the client\'s consent', ref:'§10D', done:true, date:'Mon 2 Nov' },
      { t:'Supervisor reviewed the documents', ref:'§41K(a)', done:true, date:'Mon 2 Nov' },
      { t:'Supervisor call-back done and audio-recorded', ref:'§41S', done:false },
      { t:'Policy starts only after both supervisor checks pass', ref:'§41K', done:false } ] };

  var nudge = { c:'priya', shared:'Sat 31 Oct', draft:'Hi Priya, just checking in on the comparison I sent on Saturday. Happy to walk through the plans whenever suits you.',
    next:'Fri 6 Nov',
    telegram:'Quotient · Case #398 has had no reply for 3 days. A draft nudge is ready.' };

  var share = { message:'Hi Wei, here\'s the side-by-side of the 3 plans we talked about. Illustrated values are not guaranteed. Happy to go through it on a call.', remindOn:'Fri 6 Nov' };

  window.QDATA = { today:today, adviser:adviser, insurers:insurers, rows:rows, groups:groups, steps:steps,
    cases:cases, caseOrder:caseOrder, digest:digest, meetings:meetings,
    transcripts:transcripts, gate:gate, log:log, writeup:writeup, mas:mas, nudge:nudge, share:share };
})();
