/* Builder B data + helpers: S05 Meetings, S06 Meeting, S07 New case, S08 Gate, S09 Edit, S10 Processing, S17 Sent.
   Extends Q.data read-only. Texts not given in data.js (write-up, MAS, extra log rows) are synthetic demo text. */
(function(){
  'use strict';
  var D = Q.data;
  window.QD = window.QD || {};

  /* Gate text + map per feature. map row: [original on device, placeholder (or 'removed'), kind]. */
  var gate = {
    compare: { map:[ ['Wei Tan','[CLIENT]','Name'], ['Tan Jia Hui','[CHILD 1]','Child\'s name'], ['Tan Jia Le','[CHILD 2]','Child\'s name'],
        ['Straits Freight Pte Ltd','[EMPLOYER]','Employer'], ['14 Mar 1991','age 35','Date of birth'], ['9123 4567','removed','Phone'] ],
      cards: D.gate.compare.cards.map(function(c,i){ return i===0 ? { src:'Your notes · Wed 28 Oct meeting', mid:'wei-oct', text:c.text } : c; }), known: D.gate.compare.known },
    writeup: { map:[ ['Siti Nur','[CLIENT]','Name'], ['Changi Health Group','[EMPLOYER]','Employer'], ['2 Jun 1993','age 33','Date of birth'], ['S8812345D','removed','NRIC'] ],
      cards:[
        { src:'Your notes · Tue 13 Oct meeting', mid:'siti-oct13', text:'[CLIENT], age 33, nurse at [EMPLOYER]. Two young children who need support until they finish school. Wants cover until age 65 while the children are young. Income about S$5,800 a month, home loan about S$1,600 a month. [CLIENT] said a premium under S$3,500 a year is comfortable.' },
        { src:'Your notes · Thu 29 Oct meeting', mid:'siti-oct29', text:'[CLIENT] chose the revised Harbour plan. Not replacing any policy. [CLIENT] understands illustrated values are not guaranteed.' },
        { src:'Chosen plan · Harbour Assurance v2', text:'Annual premium S$3,300, premium term 20 years, sum assured S$165,000, early critical illness rider. Illustrated values at 3.00% and 4.25% a year are not guaranteed.' },
        { src:'Other plans', text:'Meridian Life: premium term 25 years. Orchid Mutual: no riders. [CLIENT] asked to keep the critical illness rider. [CLIENT] compared all three on Mon 19 Oct.' } ] },
    'compare-daniel': { map:[ ['Daniel Lee','[CLIENT]','Name'] ], known: D.gate.compare.known,
      cards:[ { src:'Your notes · Mon 2 Nov meeting', mid:'daniel-past', text:'[CLIENT], age 31. Group cover from work only. Hoping to start a family in two years. Budget about S$3,000 a year.' } ] },
    nudge: { map:[ ['Priya Krishnan','[CLIENT]','Name'], ['Aarav','[CHILD 1]','Child\'s name'], ['Meera','[CHILD 2]','Child\'s name'] ], cards: D.gate.nudge.cards },
    'mas-suggest': { map:[ ['Marcus Raj','[CLIENT]','Name'], ['8 Jul 1962','age 64','Date of birth'] ],
      cards:[ { src:'Your notes · Tue 27 Oct meeting', mid:'marcus-oct', text:'[CLIENT], age 64. 02:15 "Can we go through it in Mandarin?" 04:02 "My daughter will help me read the English papers." [CLIENT] did not mention schooling.' },
              { src:'Your notes · Thu 29 Oct meeting', mid:'marcus-oct29', text:'[CLIENT]\'s daughter went through the three plans with [CLIENT] in Mandarin. [CLIENT] prefers Harbour for the shorter premium term.' },
              { src:'Your notes · Mon 2 Nov meeting', mid:'marcus-nov2', text:'[CLIENT] and the adviser signed the Selected Client declaration. [CLIENT] was told to expect a call-back from the supervisor.' } ] }
  };

  /* After Send: processing copy and where each flow lands. lift = the returning line where names go back in. */
  var flow = {
    compare: { back:'#case-wei', done:'#case-wei', title:'Building Wei\'s comparison', doneBtn:'Open comparison',
      steps:['Reading 3 PDFs on this device','Sending {n} characters','Reading the numbers','Putting names back on this device','Checking every number against its page'],
      lift:'[CLIENT] · Orchid Mutual · annual premium S$3,150 · sum assured S$155,000' },
    'compare-daniel': { back:'#new-case-daniel', done:'#case-daniel', title:'Building Daniel\'s comparison', doneBtn:'Open comparison',
      steps:['Reading 3 PDFs on this device','Sending {n} characters','Reading the numbers','Putting names back on this device','Checking every number against its page'],
      lift:'[CLIENT] · Meridian Life · annual premium S$2,700 · sum assured S$150,000' },
    writeup: { back:'#writeup-siti', done:'#writeup-siti', title:'Drafting Siti\'s write-up', doneBtn:'Open write-up',
      steps:['Reading your notes and Harbour v2 on this device','Sending {n} characters','Drafting the four parts','Putting names back on this device','Linking each sentence to its source'],
      lift:'[CLIENT] needs cover until age 65 while her children are young.' },
    nudge: { back:'#nudge-priya', done:'#nudge-priya', title:'Drafting a nudge for Priya', doneBtn:'Open nudge',
      steps:['Choosing her worry and one page on this device','Sending {n} characters','Drafting the nudge','Putting names back on this device'],
      lift:'Hi [CLIENT]! You said your biggest worry is [CHILD 1] and [CHILD 2]\'s uni fund if you ever can\'t work.' },
    'mas-suggest': { back:'#mas-marcus', done:'#mas-marcus', title:'Suggesting answers for Marcus', doneBtn:'Open MAS checks',
      steps:['Finding quotes in the meeting on this device','Sending {n} characters','Suggesting answers','Putting names back on this device'],
      lift:'[CLIENT] asked: "Can we go through it in Mandarin?"' }
  };
  var featureName = { compare:'Comparison', 'compare-daniel':'Comparison', writeup:'Write-up', nudge:'Nudge', 'mas-suggest':'Answer suggestions' };

  /* Extra log rows for cases data.js has none for (counts match each case's `sends`). Newest first. */
  var log = {
    wei:[ D.log.wei[0], { feature:'Comparison', when:D.log.wei[1].when, text:D.gate.compare.cards.map(function(c){ return c.text; }).join('\n\n') } ],
    alvin:[ { feature:'Comparison', when:'Mon 2 Nov, 11:30', text:'[CLIENT], age 35. Revised Harbour Assurance illustration, annual premium S$3,300, sum assured S$165,000.' },
            { feature:'Nudge', when:'Thu 29 Oct, 09:10', text:'[CLIENT] asked if a lower premium is possible with Harbour.' },
            { feature:'Comparison', when:'Thu 22 Oct, 14:05', text:'[CLIENT], age 35, engineer at [EMPLOYER]. Wants whole life cover to age 65.' } ],
    siti:[ { feature:'Write-up', when:'Mon 2 Nov, 15:12', text:gate.writeup.cards[0].text },
           { feature:'Nudge', when:'Tue 20 Oct, 09:00', text:'[CLIENT] wanted to keep the critical illness rider.' },
           { feature:'Comparison', when:'Fri 16 Oct, 10:40', text:'[CLIENT], age 33, nurse at [EMPLOYER]. Wants cover until age 65.' } ],
    marcus:[ { feature:'Answer suggestions', when:'Thu 29 Oct, 17:20', text:gate['mas-suggest'].cards[0].text },
             { feature:'Write-up', when:'Thu 29 Oct, 16:45', text:'[CLIENT], age 64. Chose Harbour Assurance. Meeting held in Mandarin with a trusted individual.' },
             { feature:'Comparison', when:'Wed 28 Oct, 10:15', text:'[CLIENT], age 64. Wants a whole life plan with a short premium term.' } ],
    kevin:[ { feature:'Write-up', when:'Wed 14 Oct, 11:00', text:'[CLIENT], age 39. Chose Meridian Life for the lower premium and the early critical illness rider.' },
            { feature:'Nudge', when:'Sat 10 Oct, 09:00', text:'[CLIENT] wanted to compare the year-20 values again.' },
            { feature:'Answer suggestions', when:'Wed 7 Oct, 15:30', text:'[CLIENT], age 39. Meeting in English.' },
            { feature:'Comparison', when:'Wed 7 Oct, 15:10', text:'[CLIENT], age 39, sales manager at [EMPLOYER]. Wants cover to age 65.' } ],
    jasmine:[ { feature:'Nudge', when:'Sat 17 Oct, 09:00', text:'[CLIENT] asked about a smaller sum assured.' },
              { feature:'Comparison', when:'Tue 13 Oct, 12:20', text:'[CLIENT], age 29. Budget about S$2,500 a year.' } ]
  };

  /* S07 sample files. err: the row shows that message instead of plan details. */
  var files = {
    harbour:  { name:'harbour-wl.pdf',  ins:'Harbour Assurance', plan:'Harbour Whole Life Par', pages:14 },
    meridian: { name:'meridian-wl.pdf', ins:'Meridian Life',     plan:'Meridian Legacy Whole Life', pages:12 },
    orchid:   { name:'orchid-wl.pdf',   ins:'Orchid Mutual',     plan:'Orchid Whole Life Par', pages:16 },
    harbour2: { name:'harbour-wl-v2.pdf', ins:'Harbour Assurance', plan:'Harbour Whole Life Par v2', pages:14 },
    notpdf:   { name:'wei-notes.docx', err:'This isn\'t a PDF.' },
    scanned:  { name:'orchid-scan.pdf', err:'We can\'t read this PDF yet. Ask the insurer for a digital copy.' },
    ilp:      { name:'meridian-invest.pdf', err:'ILP plans aren\'t supported.' },
    fifth:    { name:'lumen-wl.pdf', ins:'Lumen Life', plan:'Lumen Whole Life', pages:10 },
    sixth:    { name:'kestrel-wl.pdf', ins:'Kestrel Life', plan:'Kestrel Whole Life', pages:11 }
  };

  /* S06 live transcript script while recording Wei (speaker used only with call audio). */
  var live = [
    ['You','Thanks for making time, Wei. Shall we start with the three plans?'],
    ['Client','Yes. I looked at the summary you sent last week.'],
    ['You','Harbour and Meridian both have an early critical illness rider. Orchid has none.'],
    ['Client','The kids\' university is still the main thing for me.'],
    ['You','Then the year-20 values matter most. They are not guaranteed.'],
    ['Client','Understood. Can we keep it close to four thousand a year?'],
    ['You','Yes. Meridian and Orchid are both under that.'],
    ['Client','Let\'s look at Meridian more closely.'] ];

  QD.b = { gate:gate, flow:flow, featureName:featureName, log:log, files:files, live:live, sends:{} };

  /* ---------- helpers shared by my screens ---------- */
  var QB = window.QB = {};
  QB.feature = function(key){ var f = null; Object.keys(D.gate).forEach(function(k){ if(D.gate[k].c===key) f = k; }); return f; };
  var edits = {};
  QB.edits = function(key){ return edits[key] || (edits[key] = { hidden:[], shown:[], undo:[] }); };
  function reEsc(s){ return s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'); }
  QB.WORD = /[A-Za-z0-9$][A-Za-z0-9$,.'’-]*[A-Za-z0-9]|[A-Za-z0-9]/g;

  /* Which meetings and notes feed "Your notes" for a case (default: every held meeting with notes). Shared by New case and the gate. */
  var picks = {};
  QB.pick = function(key, ids){
    if(ids) picks[key] = ids;
    if(!picks[key]) picks[key] = Q.caseMeetings(key).filter(function(x){ return !x.upcoming && x.m.notesReady; }).map(function(x){ return x.m.id; });
    return picks[key];
  };

  /* The text as it will be sent, after the adviser's edits. */
  QB.view = function(key){
    var f = QB.feature(key), g = gate[f], e = QB.edits(key);
    var reps = g.map.filter(function(m){ return m[1]!=='removed' && e.shown.indexOf(m[1])<0; })
      .map(function(m){ return { ph:m[1], orig:m[0], kind:m[2], n:0 }; });
    e.hidden.forEach(function(w,i){ reps.push({ ph:'[HIDDEN '+(i+1)+']', orig:w, kind:'Hidden by you', user:true, n:0 }); });
    var removed = g.map.filter(function(m){ return m[1]==='removed'; }).map(function(m){ return { ph:'removed', orig:m[0], kind:m[2], n:1, removed:true }; });
    var byPh = {}; reps.forEach(function(r){ byPh[r.ph] = r; });
    var rx = reps.length ? new RegExp('('+reps.map(function(r){ return reEsc(r.ph); }).sort(function(a,b){ return b.length-a.length; }).join('|')+')') : null;
    var chars = 0;
    var pick = QB.pick(key);
    var cards = (g.cards||[]).filter(function(c){ return !c.mid || pick.indexOf(c.mid)>=0; }).map(function(c){
      var t = c.text;
      g.map.forEach(function(m){ if(e.shown.indexOf(m[1])>=0) t = t.split(m[1]).join(m[0]); });
      e.hidden.forEach(function(w,i){ t = t.replace(new RegExp('(^|[^A-Za-z0-9$\'’-])'+reEsc(w)+'(?=$|[^A-Za-z0-9$\'’-])','g'), '$1[HIDDEN '+(i+1)+']'); });
      var parts = rx ? t.split(rx).filter(function(s){ return s!==''; }).map(function(s){
        var r = byPh[s]; if(r){ r.n++; return { ph:s, r:r }; } return { s:s }; }) : [{ s:t }];
      return { src:c.src, mid:c.mid, parts:parts, text:t };
    });
    chars = cards.map(function(c){ return c.text; }).join('\n\n').length;
    var rows = reps.filter(function(r){ return r.n; }).concat(removed);
    var count = rows.reduce(function(a,r){ return a + r.n; }, 0);
    return { f:f, g:g, cards:cards, rows:rows, count:count, chars:chars, charsLabel:chars.toLocaleString('en-SG') };
  };

  /* Static rendering of sent text with highlighted placeholders (log rows). */
  QB.phText = function(t){
    return Q.esc(t).replace(/(\[[A-Z0-9 ]+\]|\bage \d+\b)/g, '<span class="ph">$1</span>');
  };

  /* Per-screen local demo state, reset whenever the hash changes. */
  var st = {};
  QB.local = function(id, valid, def, p){
    var s = st[id];
    if(!s || s.hash!==location.hash){
      var map = { error:'error', loading:'loading', empty:'empty' };
      var want = p.state!=='normal' && valid.indexOf(p.state)>=0 ? p.state : (map[p.state] && valid.indexOf(map[p.state])>=0 ? map[p.state] : def);
      s = st[id] = { hash:location.hash, s:want, fresh:true };
    } else s.fresh = false;
    return s;
  };
  QB.demo = function(states, cur){
    return '<nav class="switcher b-demo" aria-label="Demo states"><span class="eyebrow">Demo states</span><div class="switcher-chips">'+states.map(function(s){
      return '<button class="chip" data-bstate="'+s[0]+'" aria-pressed="'+(s[0]===cur)+'">'+Q.esc(s[1])+'</button>'; }).join('')+'</div></nav>';
  };
  QB.onState = {};
  document.addEventListener('click', function(e){
    var b = e.target.closest('[data-bstate]'); if(!b) return;
    var id = Q.route().id, s = st[id]; if(!s) return;
    s.s = b.dataset.bstate; if(QB.onState[id]) QB.onState[id](s.s);
    Q.refresh();
  });
  /* Reminder time for a meeting: 10 minutes before ('11:00' -> '10:50'). One string for every reminder switch. */
  QB.remindAt = function(t){ var h = t.split(':'), m = (+h[0])*60 + (+h[1]) - 10; return Math.floor(m/60)+':'+String(m%60).padStart(2,'0'); };
  QB.reduced = function(){ return window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches; };
})();
