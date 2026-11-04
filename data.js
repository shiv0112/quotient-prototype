/* Quotient demo data. Single source for every screen. Read it as Q.data.
   Source: docs/design/BRIEF.md "Demo data". Insurers are synthetic. Figures the brief does not give
   (term, riders, other years) are synthetic demo values, consistent across screens. Today = Tue 3 Nov 2026.
   Screens may mutate this in memory (e.g. confirming a cell); nothing is saved. */
(function(){
  'use strict';

  var today = { date:'Tue 3 Nov', long:'Tuesday 3 November', hour:9 };

  var adviser = { name:'Rachel Lim', first:'Rachel', initials:'RL', email:'rachel.lim@kallangadvisers.sg',
    firm:'Kallang Advisers', signin:'Google', telegram:'@rachel_lim', waitDays:3, digestTime:'8:00', telegramCode:'QX4-72K',
    /* Update 2 follow-up loop. channel = where clients talk to the rep (onboarding may set it). Gentle timing lives in Settings. */
    channel:'whatsapp', remindTime:'9:00', weekdaysOnly:true, quietAfter21:true, quietSunday:true, nudgeMax:2 };

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

  /* Update 2 people fields (synthetic, docs/design/UPDATE-2.md). line = the short line on the case board card.
     goal is in the client's words. worry = { text, quote, from:'<date> · <time in meeting>', meeting:<id>, kept } (UPDATE-2 2b): AI-suggested until the rep keeps it. timing = the rep's own typed note, never a guess.
     nudgeNo = which nudge is next (max 2, Settings "Gentle timing"). Merged into cases below. */
  var caseExtra = {
    wei:     { job:'Logistics manager', family:'2 kids (8 and 11)', line:'BTO keys Nov 2027', goal:'Whole life cover',
               worry:{ text:'Cover to 65 and a uni fund for the kids', quote:'Cover to 65, and something for the kids\' university.', from:'Wed 28 Oct · 00:41', meeting:'wei-oct', kept:true } },
    priya:   { job:'Nurse', family:'2 kids, Aarav and Meera', line:'nurse, 2 kids', goal:'Uni fund by 2038', timing:'Evenings', nudgeNo:1,
               worry:{ text:'Kids\' uni fund if she can\'t work', quote:'If I ever can\'t work, my worry is the uni fund for Aarav and Meera.', from:'Thu 22 Oct · 06:12', meeting:'priya-oct22', kept:true } },
    alvin:   { line:'baby due in March', family:'Baby due in March',
               worry:{ text:'Lower budget, same cover', quote:'With the baby coming, can we bring the premium down but keep the same cover?', from:'Mon 26 Oct · 03:05', meeting:'alvin-oct26', kept:true } },
    siti:    { job:'Nurse', family:'2 kids', line:'home loan, 2 kids',
               worry:{ text:'Cover to 65 while the kids are young', quote:'I want cover until 65, while the kids are still young.', from:'Tue 13 Oct · 03:12', meeting:'siti-oct13', kept:false } },
    marcus:  { family:'Daughter Mei helps', line:'64 · daughter Mei helps',
               worry:{ text:'Leave something for Mei', quote:'Most of all, I want to leave something for Mei.', from:'Tue 27 Oct · 05:20', meeting:'marcus-oct', kept:true } },
    daniel:  { line:'met yesterday' }, // no worry yet: the board offers "Add their main worry"
    kevin:   { line:'Meridian Life' },
    jasmine: { line:'budget changed' }
  };
  Object.keys(caseExtra).forEach(function(k){ var x = caseExtra[k]; Object.keys(x).forEach(function(f){ cases[k][f] = x[f]; }); });

  /* Today's "Needs you" is computed from the cases by Q.needs() / Q.status() in core.js. */

  var digest = { sent:'8:00', items:[
    { text:'Wei Tan 11:00', go:'#case-wei' }, { text:'Priya quiet 3 days', go:'#case-priya' }, { text:'Share v2 with Alvin', go:'#case-alvin' } ] };

  /* Meetings. A case holds many meetings and quick notes (c = case key, null = unfiled).
     at = sortable time. kind: 'calendar' (from the calendar) | 'notes' (Record notes, no calendar meeting).
     labels = transcript has You/Client (desktop call audio); otherwise mic only. ti = trusted individual present (Selected Clients). */
  var meetings = {
    sync:'Google Calendar · synced 2 min ago',
    upcoming:[
      { id:'wei-today', day:'Today', time:'11:00', end:'12:00', who:'Wei Tan', app:'Google Meet', c:'wei', notes:true, at:'2026-11-03 11:00', date:'Tue 3 Nov' },
      { id:'huddle', day:'Today', time:'14:30', end:'15:00', who:'Team huddle', app:'Teams', internal:true, notes:false },
      { id:'alvin-wed', day:'Tomorrow', time:'10:00', end:'10:45', who:'Alvin Lim', app:'Zoom', c:'alvin', notes:true, at:'2026-11-04 10:00', date:'Wed 4 Nov' },
      { id:'siti-thu', day:'Thu 5 Nov', time:'15:00', end:'16:00', who:'Siti Nur', app:'In person', c:'siti', notes:false, at:'2026-11-05 15:00', date:'Thu 5 Nov' },
      { id:'marcus-fri', day:'Fri 6 Nov', time:'10:30', end:'11:30', who:'Marcus Raj', app:'In person', c:'marcus', notes:true, at:'2026-11-06 10:30', date:'Fri 6 Nov' }
    ],
    past:[
      { id:'notes-1102', kind:'notes', date:'Mon 2 Nov', time:'18:10', at:'2026-11-02 18:10', who:'Notes · Mon 2 Nov 18:10', c:null, len:'2 min', notesReady:true },
      { id:'marcus-nov2', date:'Mon 2 Nov', time:'15:00', at:'2026-11-02 15:00', who:'Marcus Raj', app:'In person', c:'marcus', len:'40 min', notesReady:true, ti:'Mei (daughter)' },
      { id:'daniel-past', date:'Mon 2 Nov', time:'16:00', at:'2026-11-02 16:00', who:'Daniel Lee', app:'In person', c:'daniel', len:'35 min', notesReady:true },
      { id:'junhao', date:'Fri 30 Oct', time:'12:30', at:'2026-10-30 12:30', who:'Teo Jun Hao', app:'Zoom', c:null, notesReady:false },
      { id:'marcus-oct29', date:'Thu 29 Oct', time:'10:00', at:'2026-10-29 10:00', who:'Marcus Raj', app:'In person', c:'marcus', len:'55 min', notesReady:true, ti:'Mei (daughter)' },
      { id:'alvin-oct26', date:'Mon 26 Oct', time:'12:30', at:'2026-10-26 12:30', who:'Alvin Lim', app:'Zoom', c:'alvin', len:'20 min', notesReady:true },
      { id:'priya-oct22', date:'Thu 22 Oct', time:'19:00', at:'2026-10-22 19:00', who:'Priya Krishnan', app:'Zoom', c:'priya', len:'45 min', notesReady:true },
      { id:'siti-oct29', date:'Thu 29 Oct', time:'15:00', at:'2026-10-29 15:00', who:'Siti Nur', app:'In person', c:'siti', len:'30 min', notesReady:true },
      { id:'wei-oct', date:'Wed 28 Oct', time:'11:00', at:'2026-10-28 11:00', who:'Wei Tan', app:'Google Meet', c:'wei', len:'38 min', notesReady:true },
      { id:'marcus-oct', date:'Tue 27 Oct', time:'14:00', at:'2026-10-27 14:00', who:'Marcus Raj', app:'In person', c:'marcus', len:'50 min', notesReady:true, ti:'Mei (daughter)' },
      { id:'siti-oct13', date:'Tue 13 Oct', time:'15:00', at:'2026-10-13 15:00', who:'Siti Nur', app:'In person', c:'siti', len:'45 min', notesReady:true }
    ]
  };

  /* Transcripts by meeting id. labels:false = mic only (one plain transcript). Siti's, Marcus's, Priya's and Alvin's later lines are synthetic demo text. */
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
      ['04:02','My daughter Mei will help me read the English papers.'],
      ['05:20','Most of all, I want to leave something for Mei.'] ] },
    'priya-oct22': { labels:false, lines:[
      ['00:40','Sorry, evenings are easier with my shifts.'],
      ['03:30','I have the hospital group cover, nothing of my own.'],
      ['06:12','If I ever can\'t work, my worry is the uni fund for Aarav and Meera.'],
      ['09:45','Can you compare a few whole life plans for me?'] ] },
    'alvin-oct26': { labels:false, lines:[
      ['00:30','Thanks for the comparison. We read it over the weekend.'],
      ['03:05','With the baby coming, can we bring the premium down but keep the same cover?'],
      ['07:20','I will send you a revised Harbour plan this week.'] ] },
    'marcus-oct29': { labels:false, lines:[
      ['01:10','Mei went through the three plans with me last night.'],
      ['06:40','I prefer Harbour. The premium term is shorter.'] ] },
    'marcus-nov2': { labels:false, lines:[
      ['00:45','We will sign the Selected Client declaration together today.'],
      ['03:20','Your supervisor will call you in the next few days to check you understand the plan.'] ] },
    'siti-oct13': { labels:false, lines:[
      ['01:20','I work full time as a nurse.'],
      ['01:45','I take home about five thousand eight hundred a month.'],
      ['02:30','The home loan is about one thousand six hundred a month.'],
      ['03:12','I want cover until 65, while the kids are still young.'],
      ['04:05','The two of them will need support until they finish school.'],
      ['05:40','I would like to stay under three and a half thousand a year.'],
      ['07:05','The critical illness part matters to me.'] ] },
    'siti-oct29': { labels:false, lines:[
      ['00:50','I will go with the revised Harbour plan.'],
      ['02:15','I am not replacing any policy. This is my first one of my own.'],
      ['04:30','I understand the illustrated values are not guaranteed.'] ] },
    'notes-1102': { labels:false, lines:[
      ['00:05','Reminder to myself: bring the revised Harbour illustration on Thursday.'],
      ['00:40','Ask the supervisor about the call-back slot for Friday.'] ] }
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
    nudge:   { c:'priya', sub:'To draft a nudge for Priya Krishnan #398. Only her worry, one page of the comparison and placeholders are sent.',
      cards:[ { src:'Her worry · your notes', text:'[CLIENT]\'s biggest worry: the uni fund for [CHILD 1] and [CHILD 2] if she ever can\'t work.' },
              { src:'Comparison PDF · page 1', text:'Which plans keep paying after an early critical illness.' } ] },
    'compare-daniel': { c:'daniel', sub:'To build the comparison. Your PDFs stay here; only this text is sent.' },
    'mas-suggest': { c:'marcus', sub:'To suggest answers to the 3 questions. You choose every answer.' }
  };

  /* "What left your device" log, newest first. */
  var log = {
    wei: [
      { feature:'Answer suggestions', when:'Mon 2 Nov, 16:52', text:'[CLIENT], age 35. Meeting in English. Quote: "I did my degree here and work in English every day."' },
      { feature:'Comparison', when:'Mon 2 Nov, 16:40', text:'[CLIENT], age 35, project manager at [EMPLOYER]. Married with two children, [CHILD 1] (8) and [CHILD 2] (11). Wants life cover to age 65 and a fund for the children\'s university. Budget about S$4,000 a year.' } ],
    priya: [ { feature:'Nudge', when:'Tue 3 Nov, 08:05', text:'[CLIENT]\'s biggest worry: the uni fund for [CHILD 1] and [CHILD 2] if she ever can\'t work.\n\nComparison PDF, page 1: which plans keep paying after an early critical illness.' },
             { feature:'Comparison', when:'Tue 27 Oct, 15:20', text:'[CLIENT], age 41, nurse. Wants cover to age 65.' } ],
    fixed:[ 'MAS checks: plain rules on this device. Nothing sent.', 'Shares: the PDF went from you to the client. Nothing uploaded.' ]
  };

  /* Write-up for Siti, laid out as FAA-N16 para 35 (with 31 and 36). need: 'req' | 'opt' | 'cond' (shown only when on).
     Sentence: [text, sourceLabel, sourceRef]. Meeting refs are 'm:<meetingId>@<time>'. Blanks: {blank:'Risk tolerance'}. Never guessed. */
  var writeup = { c:'siti', plan:'Harbour Assurance v2', drafted:'Tue 3 Nov', parts:[
    { key:'needs', title:'Siti\'s objectives, finances and needs', ref:'§35(a)', need:'req', ticked:false, s:[
      ['Objective: cover until age 65 while her children are young.','Tue 13 Oct · 03:12','m:siti-oct13@03:12'],
      ['Risk tolerance: ',null,null,{ blank:'Risk tolerance' }],
      ['Employment: works full time as a nurse.','Tue 13 Oct · 01:20','m:siti-oct13@01:20'],
      ['Income: about S$5,800 a month.','Tue 13 Oct · 01:45','m:siti-oct13@01:45'],
      ['Assets and liabilities: ',null,null,{ blank:'Assets and liabilities' }],
      ['Financial commitments: home loan of about S$1,600 a month.','Tue 13 Oct · 02:30','m:siti-oct13@02:30'],
      ['Budget: a premium under S$3,500 a year.','Tue 13 Oct · 05:40','m:siti-oct13@05:40'],
      ['Existing policies: ',null,null,{ blank:'Existing policies' }],
      ['Dependants: two children who need support until they finish school.','Tue 13 Oct · 04:05','m:siti-oct13@04:05'] ] },
    { key:'why', title:'Why this plan suits Siti', ref:'§35(b) · §31', need:'req', ticked:true, s:[
      ['Harbour v2 costs S$3,300 a year, within her budget.','Table · Harbour v2 · premium','siti/v2/harbour/premium'],
      ['It keeps the early critical illness rider she asked about.','Table · Harbour v2 · riders','siti/v2/harbour/riders'],
      ['It covers her with a sum assured of S$165,000.','Table · Harbour v2 · sum assured','siti/v2/harbour/sa'] ] },
    { key:'cons', title:'Disadvantages of this plan for Siti', ref:'§35(c)', need:'req', ticked:false, s:[
      ['Ending the policy early returns less than she paid: at year 10 the guaranteed value is S$14,500 against S$33,000 in premiums.','Table · Harbour v2 · guaranteed year 10','siti/v2/harbour/g10'],
      ['Illustrated values at 3.00% and 4.25% are not guaranteed and could be lower.','Table · Harbour v2 · 4.25% year 20','siti/v2/harbour/b20'],
      ['She pays premiums for 20 years.','Table · Harbour v2 · premium term','siti/v2/harbour/term'],
      ['The early critical illness rider adds to the premium: ',null,null,{ blank:'Rider cost per year' }] ] },
    { key:'others', title:'Other plans considered', ref:'From the comparison', need:'opt', ticked:false, s:[
      ['Meridian Life has a 25-year premium term, longer than she wanted.','Table · Meridian · premium term','siti/v2/meridian/term'],
      ['Orchid Mutual: ',null,null,{ blank:'Reason Orchid was not chosen' }] ] },
    { key:'switch', title:'Replacing an existing policy', ref:'§42 to §44', need:'cond', on:false, ticked:false, s:[
      ['Penalty for ending the old policy: ',null,null,{ blank:'Penalty for ending the old policy' }],
      ['Costs of switching: ',null,null,{ blank:'Costs of switching' }],
      ['Benefits lost: ',null,null,{ blank:'Benefits lost' }],
      ['Fees and charges disclosed to the client in writing (§44): ',null,null,{ blank:'Date disclosed in writing' }] ] },
    { key:'chose', title:'Client chose differently', ref:'§32', need:'cond', on:false, ticked:false, s:[
      ['Siti chose a plan you did not recommend: ',null,null,{ blank:'Plan the client chose' }],
      ['You told her in writing that it is her responsibility to make sure the plan suits her: ',null,null,{ blank:'Date told in writing' }] ] } ] };

  /* MAS checks for Marcus (Selected Client, firm review 3 of 5). Wording follows MAS Notice FAA-N16 (29 Dec 2025) and its FAQs. */
  var mas = { c:'marcus',
    questions:[
      { q:'Is the client under 62?', answer:'no', from:'From the case: age 64', note:'If the client turns 62 before the policy starts, apply the safeguards (FAQ 6).' },
      { q:'Is the client proficient in spoken and written English, or the language the meeting and documents use?', answer:'no', suggest:{ value:'no', quote:'Can we go through it in Mandarin?', at:'02:15', mid:'marcus-oct' } },
      { q:'Does the client have at least GCE O-Level or N-Level, or equivalent?', answer:null } ],
    checklist:[
      { id:'decl', t:'Selected Client assessment documented and declared, signed by the client and you. Client told of their status and safeguards', ref:'§10C', faq:'FAQ 5', done:true, date:'Mon 2 Nov' },
      { id:'ti', t:'Trusted individual at every meeting, or the client\'s written statement', ref:'§10D', done:true, date:'Mon 2 Nov', path:'a', ti:'Mei (daughter)' },
      { id:'doc', t:'Documentation review of the needs analysis and know-your-client records', ref:'§41K(a)', done:true, date:'Mon 2 Nov', by:'Your supervisor' },
      { id:'call', t:'Call-back, audio-recorded', ref:'§41K(b) · §41S', done:false, sup:false, summary:false },
      { id:'eff', t:'Both checks done before the policy\'s effective date', ref:'§41K', done:false } ] };

  /* Nudge drafts (UPDATE-2 style): start from the client's own words, point to one page of what was sent,
     never pick a plan or promise returns, no pressure, end with an easy next step. Others fall back to a template in nudge.js. */
  var nudge = { c:'priya', shared:'Sat 31 Oct', draft:'Hi Priya! You said your biggest worry is Aarav and Meera\'s uni fund if you ever can\'t work. Page 1 of the comparison shows which plans keep paying after an early critical illness. Happy to go through it over coffee, no pressure to decide. I just want you to feel sure the kids are covered.',
    drafts:{
      alvin:'Hi Alvin! You wanted a lower budget with the same cover. Page 1 of the revised comparison shows the new Harbour premium next to the other two. Happy to talk it through on a call whenever suits you, no rush at all.'
    },
    next:'Fri 6 Nov', link:'quotient.app/case/',
    telegram:'Case #398 · P.K. · no reply for 3 days since you shared. A draft nudge is ready.' };

  var share = { message:'Hi Wei! Here are the 3 plans we talked about, side by side. You wanted cover to 65 for the new home: page 1 shows the cover and the guaranteed value at 65 for each one. Illustrated values are not guaranteed. Happy to go through it on a call, no rush to decide.', remindOn:'Fri 6 Nov',
    messages:{
      alvin:'Hi Alvin! Here\'s the revised Harbour plan next to the other two. You wanted a lower budget with the same cover: page 1 shows the new premium and the cover side by side. Illustrated values are not guaranteed. Happy to talk it through whenever suits you, no rush.'
    } };

  window.QDATA = { today:today, adviser:adviser, insurers:insurers, rows:rows, groups:groups, steps:steps,
    cases:cases, caseOrder:caseOrder, caseExtra:caseExtra, digest:digest, meetings:meetings,
    transcripts:transcripts, gate:gate, log:log, writeup:writeup, mas:mas, nudge:nudge, share:share };
})();
