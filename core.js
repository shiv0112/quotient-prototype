/* Quotient prototype core. No framework, no build. Loaded after data.js, before screens/*.js.

   ADD A SCREEN (one file in screens/, one <script> tag in index.html):
     Q.screen('share', {
       title: 'Share',                 // document title (string or fn(params))
       rail: true,                     // false = focus mode (rail and tab bar hidden)
       nav: 'cases',                   // which rail item lights up: today|meetings|cases|prefs
       render: function(p){ return '<div class="page">...</div>'; },   // returns an HTML string
       mount:  function(el, p){ ... }  // optional: wire events after render
     });

   ROUTES: '#<id>' or '#<id>-<arg>'. Longest registered id wins, so '#gate-edit-wei' -> id 'gate-edit', arg 'wei'.
     p = { id, arg, parts:arg.split('-'), state, edition }
     Hash names: ASCII letters, digits, hyphens. Settings is '#prefs'.
     Query string (works on file://): ?theme=light|dark|system  ?edition=web|desktop  ?state=normal|empty|error|loading

   HELPERS
     Q.data                 demo data (data.js). Mutate it, then Q.refresh() or Q.go(): every render saves
                            cases, writeup, mas and meetings to sessionStorage, so the state is shared by all screens.
                            ?reset (or Demo > Reset demo data) starts fresh.
     Q.status(caseKey)      {why, btn, go, needs}: the one short next step, used by Today, Cases and Case.
     Q.reply(k) · Q.caseAct(k, 'reply'|'reviewed'|'won') · Q.wu(k) the case's write-up (Q.data.writeups[k] once a plan is chosen).
     Q.writeupProgress(k) / Q.masProgress(k)  {done,total}: the one count for write-up parts and firm review checks.
     Q.worry(case)          the kept worry text ('' if none or only suggested).
     Q.waLink(case, text)   WhatsApp click-to-chat URL: wa.me/<digits>?text= with the case mobile, else wa.me/?text= (WhatsApp asks for the chat).
     Q.notice(case?, opts)  the phone notification card from Quotient (case number only). opts.href makes the whole card one tap (no action buttons: iPhone web apps and the desktop app can't show them).
     Q.phonePreview(on?)    prototype only: wide screens show the app in an iPhone frame (iframe ?frame=phone). [data-phone] opens it.
     Q.caseMeetings(k)      [{m, upcoming}] every meeting and quick note on a case, oldest first.  Q.meetingById(id) -> {m, past}.
     [data-quick-notes]     any button starts Record notes (screens/quicknotes.js); ='<case>' pre-picks that case.
     Q.go('#case-wei')      navigate.          Q.refresh()   re-render current screen, keeps scroll, no entrance motion.
     Q.aiRule · Q.recCopy()     privacy lines; recCopy is '' on desktop (UPDATE-2 2c).
     Q.state()              'normal'|'empty'|'error'|'loading'  (demo toolbar). Render the matching state.
     Q.edition()            'web'|'desktop'.   Q.theme(t?) get/set 'light'|'dark'|'system'.
     Q.openSheet(ref)       PDF page viewer for a table cell. ref = 'wei/v1/harbour/b20' (case/version/insurer/row).
                            Low-confidence or missing cells get Confirm / Fix number / Type the number. Resolving calls Q.refresh().
     Q.sheet({title, body, foot, onClose})   generic right-hand sheet.   Q.closeSheet()
     Q.dialog({title, body, actions:[{label, value, kind:'primary'|'secondary'|'danger'}], safe:value}) -> Promise(value|null)
                            Focus starts on the safe action. Esc / backdrop = null.
     Q.toast(msg)           confirmation only, 4 s. Never for errors.
     Q.recording.start({callAudio}) / pause() / resume() / stop()   pinned recording bar on every screen.
     Q.toCheck(caseKey, ver) -> array of refs still yellow.
     Q.money(n) 'S$72,760'   Q.esc(s)   Q.icon(name, cls)   Q.on(evt, fn) / Q.emit(evt, data)
   MARKUP SHORTCUTS (no mount needed): data-go="#hash" navigates, data-sheet="ref" opens the PDF sheet,
     data-toast="text" shows a toast, data-menu on a button toggles its parent .menu.
*/
(function(){
  'use strict';
  var Q = window.Q = {};
  Q.data = window.QDATA;
  var screens = {}, current = null, listeners = {};
  var qs = new URLSearchParams(location.search);

  /* ---------- shared case state (one store, all screens) ---------- */
  var SAVED = ['cases','writeup','writeups','mas','meetings','transcripts','adviser','sends'], VER = 8; // bump VER when the data shape changes
  try{
    if(qs.has('reset')) sessionStorage.removeItem('q-data');
    var saved = JSON.parse(sessionStorage.getItem('q-data') || 'null');
    if(saved && saved.v===VER) SAVED.forEach(function(k){ if(saved[k]) Q.data[k] = saved[k]; });
  }catch(e){}
  Q.save = function(){ if(ppEl) return; /* phone preview open: the frame owns the data until it closes */ try{ var o = { v:VER }; SAVED.forEach(function(k){ o[k] = Q.data[k]; }); sessionStorage.setItem('q-data', JSON.stringify(o)); }catch(e){} };
  Q.resetData = function(){ try{ sessionStorage.removeItem('q-data'); }catch(e){} location.reload(); };

  /* ---------- small utils ---------- */
  Q.esc = function(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); };
  Q.money = function(n){ return n==null ? '' : 'S$' + Number(n).toLocaleString('en-SG'); };
  /* Update 2e: click-to-chat, https://faq.whatsapp.com/5913398998672934. Digits only, country code first; a bare 8-digit SG mobile gets 65. */
  Q.waDigits = function(m){ var d = String(m||'').trim().replace(/^\+/,'').replace(/\D/g,''); if(/^00/.test(d)) d = d.slice(2); // +65… / 0065… -> 65…
    return /^[3689]\d{7}$/.test(d) ? '65'+d : d; }; // a bare 8-digit SG number (3, 6, 8 or 9 first) gets 65
  console.assert(Q.waDigits('9123 4567')==='6591234567' && Q.waDigits('6123 4567')==='6561234567' && Q.waDigits('+65 9123 4567')==='6591234567' &&
    Q.waDigits('0065 9123 4567')==='6591234567' && Q.waDigits('+61 412 345 678')==='61412345678' && Q.waDigits('')==='', 'waDigits self-check failed');
  Q.waLink = function(c, text){ var d = Q.waDigits(c && c.mobile); return 'https://wa.me/'+(d ? d : '')+'?text='+encodeURIComponent(text||''); };
  Q.notice = function(c, o){ c = c || Q.data.cases[Q.data.nudge.c]; o = o || {}; var tag = o.href ? 'a' : 'div';
    return '<'+tag+' class="rn"'+(o.href ? ' href="'+o.href+'" aria-label="Notification from Quotient. Case #'+c.no+'. Open the drafted nudge."' : ' role="group" aria-label="Notification from Quotient"')+'>'+
      '<div class="rn-top">'+Q.icon('bell','i-sm')+'<b>Quotient</b><time>'+(o.time||'now')+'</time></div>'+
      '<p class="rn-text">Case #'+c.no+' · no reply in '+(c.quietDays||3)+' days. A draft nudge is ready.</p></'+tag+'>'; };
  Q.on = function(e,fn){ (listeners[e]=listeners[e]||[]).push(fn); };
  Q.emit = function(e,d){ (listeners[e]||[]).forEach(function(fn){ fn(d); }); };
  function store(k,v){ try{ if(v===undefined) return localStorage.getItem(k); if(v===null) localStorage.removeItem(k); else localStorage.setItem(k,v); }catch(e){ return null; } }

  /* The client's main worry, only once the rep kept it (UPDATE-2 2b: never shown as fact until kept). */
  Q.worry = function(c){ var w = c && c.worry; return w && w.kept && w.text ? w.text : ''; };

  /* One short next step per case, derived from the shared data. Today, Cases and Case all read this.
     Every open stage has one action that moves the case on. '#case-<k>-reply|reviewed|won' open that action on the case page (Q.caseAct). */
  Q.status = function(k){
    var D = Q.data, c = D.cases[k], n, r = '#case-'+k+'-reply';
    function s(why, btn, go, needs){ return { why:why, btn:btn, go:go, needs:!!needs }; }
    if(c.result==='won') return s('Policy with '+(c.chose||'the chosen insurer'), 'Open', '#case-'+k);
    if(c.result==='lost') return s(c.reason||'Lost', 'Open', '#case-'+k);
    var won = s('Firm review done · mark won when the policy starts', 'Mark won', '#case-'+k+'-won', true);
    switch(c.now){
      case 0: return s('Add plans', 'Add plans', '#new-case-'+k);
      case 1: n = Q.toCheck(k).length;
        return n ? s(n+' number'+(n>1?'s':'')+' to check', 'Check', '#case-'+k, true) : s('Ready to share', 'Share', '#share-'+k, true);
      case 2:
        if(c.quiet) return s('Quiet · '+(c.nudgesSent||c.nudgeNo||2)+' nudges sent, reminders stopped', 'Log a reply', r);
        if(c.nudged) return s('Nudge sent · next reminder '+c.nudged.next, 'Log a reply', r);
        if(c.snoozedTo) return s('Snoozed until '+c.snoozedTo, 'Log a reply', r);
        if((c.quietDays||0) >= D.adviser.waitDays) return s('No reply for '+c.quietDays+' days', 'Nudge', '#nudge-'+k, true);
        return s('Shared · reminder '+D.share.remindOn, 'Log a reply', r);
      case 3: return s('Replied · note the plan '+c.first+' chose', 'Log a reply', r, true);
      case 4: if(c.revising) return s('Wants changes · add the new illustration', 'Add illustration', '#new-case-'+k, true);
        return c.shareSent ? s('Revised plan shared · reminder '+D.share.remindOn, 'Log a reply', r)
                           : s('Revised plan ready to share', 'Share v'+Object.keys(c.tables).length, '#share-'+k, true);
      case 5: n = Q.writeupProgress(k);
        if(!n.done) return s('Write-up · 0 of '+n.total+' parts done', 'Start the write-up', '#writeup-'+k, true);
        return n.done<n.total ? s('Write-up · '+n.done+' of '+n.total+' parts done', 'Continue', '#writeup-'+k, true) : s('Write-up ready to copy', 'Copy', '#writeup-'+k, true);
      case 6:
        if(!c.selected) return c.reviewed ? won : s('Documentation review by your firm', 'Firm review done', '#case-'+k+'-reviewed', true);
        n = Q.masProgress(k); n = n.total - n.done;
        return n ? s('Firm review · '+n+' check'+(n>1?'s':'')+' left', 'Open checks', '#mas-'+k, true) : won;
    }
    return s('Open case', 'Open', '#case-'+k);
  };
  Q.CASE_ACTS = { reply:1, reviewed:1, won:1 };
  /* Mark won is offered only once the client has chosen a plan. */
  Q.canWin = function(k){ var c = Q.data.cases[k]; return !!c && !c.result && c.now>=4 && !!c.chose; };
  Q.caseAct = function(k, act){
    var D = Q.data, c = D.cases[k];
    if(act==='reply') return Q.reply(k);
    if(act==='reviewed'){ c.reviewed = D.today.date; Q.go('#case-'+k); Q.toast('Firm review done · mark won when the policy starts'); }
    if(act==='won' && !Q.canWin(k)){ Q.go('#case-'+k); return; }
    if(act==='won') Q.dialog({ title:'Mark '+c.first+'\'s case won?', body:'<p>Do this when the policy with '+Q.esc(c.chose||'the insurer')+' starts.</p>',
      actions:[{label:'Cancel',value:null},{label:'Mark won',value:'ok',kind:'primary'}], safe:null
    }).then(function(v){ if(!v) return; c.result = 'won'; c.now = 7; c.dates.closed = D.today.date; Q.go('#case-'+k); Q.toast('Marked as won'); });
  };

  /* "What did <first> say?" Shared by the case page, the nudge screen and the reminder's "Already replied". */
  Q.reply = function(k){
    var D = Q.data, c = D.cases[k], vers = Object.keys(c.tables), t = c.tables[vers[vers.length-1]], today = D.today.date;
    function label(ins){ return D.insurers[ins].name+(t.changed===ins?' '+vers[vers.length-1]:''); }
    function radios(name, list){ return '<div class="rp-opts" role="radiogroup" aria-labelledby="'+name+'-l">'+list.map(function(o,i){
      return '<label class="check"><input type="radio" name="'+name+'" value="'+Q.esc(o[0])+'"'+(i?'':' checked')+'> '+o[1]+'</label>'; }).join('')+'</div>'; }
    var plans = t ? t.plans.map(function(ins){ return [ins, Q.esc(label(ins))+' <span class="small muted">'+Q.money(t.cells[ins].premium.v)+' a year</span>']; }) : [];
    Q.sheet({ title:'What did '+c.first+' say?',
      body:'<div class="field"><span class="label" id="rp-out-l">Reply</span>'+radios('rp-out', [['chose','Chose a plan'],['changes','Wants changes'],['no','Not going ahead']])+'</div>'+
        '<div class="field" data-rp="chose"><span class="label" id="rp-plan-l">Which plan?</span>'+radios('rp-plan', plans)+'</div>'+
        '<div class="field" data-rp="changes" hidden><label class="label" for="rp-note">What should change? <span class="muted">(optional)</span></label>'+
          '<textarea class="textarea" id="rp-note" rows="2" placeholder="Lower premium, same cover"></textarea><span class="hint">Next you add the insurer\'s new illustration. We build v'+(vers.length+1)+' of the comparison to share.</span></div>'+
        '<div class="field" data-rp="no" hidden><span class="label" id="rp-why-l">Why?</span>'+radios('rp-why', [['Budget changed','Budget changed'],['Chose elsewhere','Chose elsewhere'],['Other','Other']])+
          '<label class="sr" for="rp-other">Other reason</label><input class="input" id="rp-other" placeholder="Reason" hidden></div>',
      foot:'<button class="btn btn-primary" data-rp-save>Save reply</button><button class="btn btn-ghost" data-close>Cancel</button>',
      mount:function(sh){
        function val(n){ var x = sh.querySelector('input[name='+n+']:checked'); return x ? x.value : ''; }
        sh.addEventListener('change', function(){ var o = val('rp-out');
          sh.querySelectorAll('[data-rp]').forEach(function(x){ x.hidden = x.dataset.rp!==o; });
          sh.querySelector('#rp-other').hidden = val('rp-why')!=='Other';
          sh.querySelector('[data-rp-save]').textContent = o==='no' ? 'Mark lost' : 'Save reply'; });
        sh.querySelector('[data-rp-save]').addEventListener('click', function(){
          var o = val('rp-out'), other = sh.querySelector('#rp-other'), why = val('rp-why')==='Other' ? other.value.trim() : val('rp-why');
          if(o==='no' && !why){ other.setAttribute('aria-invalid','true'); other.focus(); return; }
          ['quiet','nudged','snoozedTo','shareSent','revising'].forEach(function(f){ delete c[f]; });
          if(!c.dates.replied || c.now<3) c.dates.replied = today;
          if(o==='chose'){ var ins = val('rp-plan'); c.choseIns = ins; c.chose = label(ins); delete c.chosenLabel;
            c.dates.chosen = c.dates.writeup = today; c.now = 5; (D.writeups = D.writeups || {})[k] = Q.makeWriteup(k);
            Q.closeSheet(); Q.go('#case-'+k); Q.toast(c.first+' chose '+c.chose+' · start the write-up'); }
          if(o==='changes'){ c.revising = sh.querySelector('#rp-note').value.trim() || true; c.chosenLabel = 'Revised'; c.dates.chosen = today; c.now = 4;
            Q.closeSheet(); Q.go('#case-'+k); Q.toast('Reply logged · add the new illustration'); }
          if(o==='no'){ c.reason = why; c.lostAt = Math.min(c.now,6); c.result = 'lost'; c.now = 7; c.dates.closed = today;
            Q.closeSheet(); Q.go('#case-'+k); Q.toast('Marked as lost'); }
        });
      } });
  };

  /* A write-up for any case, drafted from the kept worry and the chosen plan's table cells. Facts not in the notes stay as blanks. */
  Q.makeWriteup = function(k){
    var D = Q.data, c = D.cases[k], ver = Object.keys(c.tables).pop(), t = c.tables[ver], ins = Q.choseIns(k), f = c.first, w = c.worry;
    function v(i, r){ return t.cells[i][r].v; }
    function src(i, lbl, r){ return ['Table · '+D.insurers[i].short+(t.changed===i?' '+ver:'')+' · '+lbl, k+'/'+ver+'/'+i+'/'+r]; }
    function line(text, i, lbl, r){ return [text].concat(src(i, lbl, r)); }
    function blank(b, lead){ return [lead||b+': ', null, null, { blank:b }]; }
    var plan = c.chose.replace(' Assurance','').replace(' Life','').replace(' Mutual','');
    return { c:k, plan:c.chose, drafted:D.today.date, parts:[
      { key:'needs', title:f+'\'s objectives, finances and needs', ref:'§35(a)', need:'req', ticked:false, s:[
        w && w.kept ? ['Objective: '+w.text.charAt(0).toLowerCase()+w.text.slice(1)+'.'].concat(w.meeting && w.from ? [w.from, 'm:'+w.meeting+'@'+w.from.split(' · ')[1]] : ['Added by you', null]) : blank('Objective'),
        blank('Risk tolerance'), blank('Income, assets and liabilities'), blank('Existing policies') ] },
      { key:'why', title:'Why this plan suits '+f, ref:'§35(b) · §31', need:'req', ticked:false, s:[
        line(plan+' costs '+Q.money(v(ins,'premium'))+' a year.', ins, 'premium', 'premium'),
        line('It covers '+f+' with a sum assured of '+Q.money(v(ins,'sa'))+'.', ins, 'sum assured', 'sa'),
        line('Riders: '+v(ins,'riders')+'.', ins, 'riders', 'riders') ] },
      { key:'cons', title:'Disadvantages of this plan for '+f, ref:'§35(c)', need:'req', ticked:false, s:[
        line('Ending the policy early returns less than '+f+' paid: at year 10 the guaranteed value is '+Q.money(v(ins,'g10'))+' against '+Q.money(v(ins,'premium')*10)+' in premiums.', ins, 'guaranteed year 10', 'g10'),
        line('Illustrated values at 3.00% and 4.25% are not guaranteed and could be lower.', ins, '4.25% year 20', 'b20'),
        line('Premiums are paid for '+v(ins,'term')+'.', ins, 'premium term', 'term') ] },
      { key:'others', title:'Other plans considered', ref:'From the comparison', need:'opt', ticked:false, s:t.plans.filter(function(i){ return i!==ins; }).map(function(i){
        return line(D.insurers[i].name+' costs '+Q.money(v(i,'premium'))+' a year for a sum assured of '+Q.money(v(i,'sa'))+'.', i, 'premium', 'premium'); }) },
      { key:'switch', title:'Replacing an existing policy', ref:'§42 to §44', need:'cond', on:false, ticked:false, s:[
        blank('Penalty for ending the old policy'), blank('Costs of switching'), blank('Benefits lost'), blank('Date disclosed in writing', 'Fees and charges disclosed to the client in writing (§44): ') ] },
      { key:'chose', title:'Client chose differently', ref:'§32', need:'cond', on:false, ticked:false, s:[
        blank('Plan the client chose', f+' chose a plan you did not recommend: '), blank('Date told in writing', 'You told '+f+' in writing that it is '+f+'\'s responsibility to make sure the plan suits them: ') ] } ] };
  };
  /* The insurer key of the chosen plan ('Harbour Assurance v2' -> 'harbour'). */
  Q.choseIns = function(k){ var c = Q.data.cases[k], I = Q.data.insurers;
    return c.choseIns || Object.keys(I).filter(function(i){ return (c.chose||'').indexOf(I[i].name)===0; })[0] || null; };
  /* The write-up for a case: Siti's demo one, else the case's own, drafted from its data once a plan is chosen. null if no plan yet. */
  Q.wu = function(k){ var D = Q.data, c = D.cases[k]; if(!c) return null;
    if(D.writeup.c===k) return D.writeup;
    D.writeups = D.writeups || {};
    if(!D.writeups[k] && Q.choseIns(k) && Object.keys(c.tables).length) D.writeups[k] = Q.makeWriteup(k);
    return D.writeups[k] || null; };
  /* Write-up progress: required parts (plus conditional parts that apply) ticked. Optional parts never count. */
  Q.wuCounts = function(p){ return p.need==='req' || (p.need==='cond' && p.on); };
  Q.writeupProgress = function(k){
    var W = Q.wu(k); if(!W) return { done:0, total:3 };
    var req = W.parts.filter(Q.wuCounts);
    return { done:req.filter(function(p){ return p.ticked; }).length, total:req.length };
  };
  /* Firm review progress (FAA-N16 safeguards). A call-back not needed because a supervisor was there throughout counts as done. */
  Q.masDone = function(x){ return x.done || (x.id==='call' && x.sup); };
  Q.masProgress = function(k){
    var M = Q.masFor(k);
    return { done:M.checklist.filter(Q.masDone).length, total:M.checklist.length };
  };
  /* The Selected Client test and firm checks for a case (saved). Marcus's come from data.js, Siti's answers from data-c.js;
     other cases start with only the age question answered (from the case), the rest unanswered. */
  Q.masFor = function(k){
    var D = Q.data, M = D.mas[k], base = D.mas.marcus, c = D.cases[k]; if(M) return M;
    var src = k==='siti' && window.QD && QD.c ? QD.c.masSiti.questions : null;
    return D.mas[k] = { override:null, ns:{},
      questions: base.questions.map(function(q, i){ return { q:q.q, note:q.note, from: i===0 ? 'From the case: age '+c.age : null,
        answer: src ? src[i].answer : i===0 ? (c.age<62 ? 'yes' : 'no') : null }; }),
      checklist: base.checklist.map(function(x){ return { id:x.id, t:x.t, ref:x.ref, faq:x.faq, done:false, path:x.id==='ti' ? 'a' : undefined }; }) };
  };
  /* Unknown case in the route: a clear not-found page, never another case. */
  Q.noCase = function(arg, what){ return '<div class="page"><div class="todo"><span class="chip chip-outline">404</span><h1 class="h2">No '+(what||'case')+' #'+Q.esc(arg)+'</h1>'+
    '<p class="muted">There is no '+(what||'case')+' with that number on this device.</p><a class="btn btn-secondary" href="#cases">Back to Cases</a></div></div>'; };
  /* All meetings and quick notes for a case, oldest first. Each: {m, upcoming}. */
  Q.caseMeetings = function(k){
    var M = Q.data.meetings, out = [];
    M.past.forEach(function(m){ if(m.c===k) out.push({ m:m, upcoming:false }); });
    M.upcoming.forEach(function(m){ if(m.c===k && !m.internal) out.push({ m:m, upcoming:true }); });
    return out.sort(function(a,b){ return (a.m.at||'') < (b.m.at||'') ? -1 : 1; });
  };
  Q.meetingById = function(id){
    var M = Q.data.meetings, u = M.upcoming.filter(function(m){ return m.id===id; })[0];
    if(u) return { m:u, past:false };
    var p = M.past.filter(function(m){ return m.id===id; })[0];
    return p ? { m:p, past:true } : null;
  };
  /* Cases that need the adviser, most urgent first. */
  Q.needs = function(){
    var rank = ['priya','alvin','wei','marcus','siti'], D = Q.data;
    return D.caseOrder.filter(function(k){ return Q.status(k).needs; })
      .sort(function(a,b){ var x = rank.indexOf(a), y = rank.indexOf(b); return (x<0?99:x) - (y<0?99:y); });
  };

  var ICONS = {
    today:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    meetings:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',
    cases:'<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
    prefs:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    plus:'<path d="M12 5v14M5 12h14"/>', back:'<path d="M15 18l-6-6 6-6"/>', next:'<path d="M9 18l6-6-6-6"/>',
    close:'<path d="M18 6L6 18M6 6l12 12"/>', check:'<path d="M20 6L9 17l-5-5"/>', more:'<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
    mic:'<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0M12 17v5"/>', file:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>',
    info:'<circle cx="12" cy="12" r="9"/><path d="M12 16v-4M12 8h.01"/>', alert:'<path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
    search:'<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>', device:'<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>',
    arrow:'<path d="M5 12h14M13 6l6 6-6 6"/>', share:'<path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7M16 6l-4-4-4 4M12 2v13"/>',
    video:'<rect x="2" y="6" width="14" height="12" rx="2"/><path d="M22 8l-6 4 6 4z"/>', bell:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0"/>'
  };
  Q.icon = function(n,cls){ return '<svg class="i '+(cls||'')+'" viewBox="0 0 24 24" aria-hidden="true">'+(ICONS[n]||'')+'</svg>'; };

  /* ---------- screen inventory (ux-spec §6) for the demo jump menu ---------- */
  Q.inventory = [
    ['S01','Sign in','signin'], ['S02','Create account','signup'],
    ['S03a','Onboarding: how it works','welcome-1'], ['S03b','Onboarding: reminders','welcome-2'],
    ['S03c','Onboarding: calendar','welcome-3'], ['S03d','Onboarding: follow-up wait','welcome-4'],
    ['S04','Today','today'], ['S05','Meetings','meetings'],
    ['S06','Meeting: Wei Tan, today','meeting-wei-today'], ['S06','Meeting: Daniel Lee, done','meeting-daniel-past'],
    ['S07','New case','new-case'],
    ['S08','Privacy gate: comparison','gate-wei'], ['S08','Privacy gate: write-up','gate-siti'], ['S08','Privacy gate: nudge','gate-priya'], ['S08','Privacy gate: MAS suggestions','gate-marcus'],
    ['S09','Edit what is sent','gate-edit-wei'], ['S10','Processing','processing-wei'],
    ['S11','Case: Wei Tan (compared)','case-wei'], ['S11','Case: Daniel Lee (met)','case-daniel'], ['S11','Case: Priya Krishnan (shared)','case-priya'], ['S11','Case: Alvin Lim (revised)','case-alvin'],
    ['S11','Case: Siti Nur (write-up)','case-siti'], ['S11','Case: Marcus Raj (firm review)','case-marcus'], ['S11','Case: Kevin Ong (won)','case-kevin'], ['S11','Case: Jasmine Ong (lost)','case-jasmine'],
    ['S12','PDF side sheet','source-wei'], ['S13','Share','share-alvin'], ['S13','Share: blocked (Wei, 2 to check)','share-wei'], ['S14','Write-up','writeup-siti'], ['S15','MAS checks','mas-marcus'],
    ['S16','Follow-up nudge','nudge-priya'], ['S16t','Reminder notification','reminder'], ['S17','What left your device','sent-wei'],
    ['S18','Cases','cases'], ['S19','Settings','prefs'], ['S20','Morning digest','digest'], ['', 'Component gallery','gallery']
  ];
  var NAV_OF = { today:'today', meetings:'meetings', meeting:'meetings', cases:'cases', prefs:'prefs', digest:'today', reminder:'today' };

  /* ---------- registry and router ---------- */
  Q.screen = function(id, def){ def.id = id; screens[id] = def; if(booted) { buildJump(); if(Q.route().id===id) render(true); } };
  Q.route = function(){
    var h = decodeURIComponent(location.hash.replace(/^#\/?/,'')) || 'today';
    if(/^telegram(-|$)/.test(h)){ h = h.replace(/^telegram/,'reminder'); history.replaceState(null,'','#'+h); } // old route (Update 2e)
    if(screens[h]) return { id:h, arg:'', hash:h };
    var best = null;
    Object.keys(screens).forEach(function(id){ if(h.indexOf(id+'-')===0 && (!best || id.length>best.length)) best=id; });
    if(best) return { id:best, arg:h.slice(best.length+1), hash:h };
    return { id:null, arg:'', hash:h };
  };
  Q.go = function(h){ if(location.hash===h) render(true); else location.hash = h; };
  Q.refresh = function(){ render(false); };

  function params(r){ return { id:r.id, arg:r.arg, parts:r.arg?r.arg.split('-'):[], state:Q.state(), edition:Q.edition() }; }

  function render(enter){
    var r = Q.route(), el = document.getElementById('screen'), def = screens[r.id];
    var y = window.scrollY, same = current && current.hash===r.hash;
    if(!def){
      var inv = Q.inventory.filter(function(i){ return i[2]===r.hash; })[0];
      def = { id:'todo', rail:true, title:'Coming soon', render:function(){ return '<div class="page"><div class="todo">'+
        '<span class="chip chip-outline">'+Q.esc(inv?inv[0]:'404')+'</span><h1 class="h2">'+Q.esc(inv?inv[1]:'Page not found')+'</h1>'+
        '<p class="muted">'+(inv?'This screen is being built.':'There is no screen at #'+Q.esc(r.hash)+'.')+'</p>'+
        '<a class="btn btn-secondary" href="#today">Back to Today</a></div></div>'; } };
    }
    var p = params(r);
    if(def.caseArg && p.parts[0] && !Q.data.cases[p.parts[0]]) def = { id:'todo', rail:true, title:'Not found', render:function(){ return Q.noCase(p.parts[0]); } };
    document.body.classList.toggle('focus', def.rail===false);
    el.classList.remove('enter');
    try{ el.innerHTML = def.render(p); }
    catch(err){ el.innerHTML = '<div class="page"><div class="banner banner-error">'+Q.icon('alert')+'<p>This screen failed to render: '+Q.esc(err.message)+'</p></div></div>'; console.error(err); }
    // Demo state chips never sit on the screen: they move into the Demo panel ("States for this screen").
    var ds = document.getElementById('demo-screen');
    if(ds){ ds.innerHTML = ''; el.querySelectorAll('nav.switcher').forEach(function(n){ n.classList.remove('rise'); ds.appendChild(n); }); ds.hidden = !ds.children.length; }
    if(enter && !same){ void el.offsetWidth; el.classList.add('enter'); setTimeout(function(){ el.classList.remove('enter'); }, 1800); }
    if(def.mount) try{ def.mount(el, p); }catch(err){ console.error(err); }
    var t = typeof def.title==='function' ? def.title(p) : def.title;
    document.title = (t ? t+' · ' : '') + 'Quotient';
    var nav = ('nav' in def) ? def.nav : (NAV_OF[def.id] || (def.id==='todo'?'':'cases'));
    document.querySelectorAll('[data-nav]').forEach(function(a){ if(a.dataset.nav===nav) a.setAttribute('aria-current','page'); else a.removeAttribute('aria-current'); });
    var jump = document.getElementById('demo-jump'); if(jump) jump.value = r.hash;
    document.querySelectorAll('.nav .count').forEach(function(n){ n.textContent = Q.state()==='empty' ? 0 : Q.data.caseOrder.length; });
    if(enter && !same) window.scrollTo(0,0); else window.scrollTo(0,y);
    current = r;
    Q.save();
    Q.emit('render', p);
  }

  /* ---------- theme, edition, states ---------- */
  Q.theme = function(t){
    if(t===undefined) return store('q-theme') || 'system';
    store('q-theme', t==='system'?null:t);
    if(t==='system') document.documentElement.removeAttribute('data-theme'); else document.documentElement.setAttribute('data-theme', t);
    syncDemo(); if(booted) Q.refresh();
  };
  Q.edition = function(v){
    if(v===undefined) return store('q-edition') || 'web';
    store('q-edition', v); paintUser(); syncDemo(); Q.refresh();
  };
  /* Honest privacy copy by edition (UPDATE-2 2c). Only desktop writes up on the device. No storage claims. */
  Q.aiRule = 'Only the text you approve goes to the AI, with names replaced.';
  Q.recCopy = function(){ return Q.edition()==='desktop' ? '' : 'Audio is sent to our speech service to be written up, then deleted. Not used for training.'; };
  Q.state = function(v){
    if(v===undefined) return store('q-state') || 'normal';
    store('q-state', v==='normal'?null:v); syncDemo(); Q.refresh();
  };
  function paintUser(){
    var a = Q.data.adviser, ed = Q.edition()==='desktop'?'Desktop':'Web';
    document.querySelectorAll('[data-user]').forEach(function(u){ u.innerHTML = '<span class="avatar">'+a.initials+'</span><span><b>'+Q.esc(a.name)+'</b><small>'+a.initials+' · '+ed+'</small></span>'; });
  }

  /* ---------- cells and the PDF sheet ---------- */
  function cellAt(ref){
    var s = ref.split('/'), c = Q.data.cases[s[0]], t = c && c.tables[s[1]], cell = t && t.cells[s[2]] && t.cells[s[2]][s[3]];
    var row = Q.data.rows.filter(function(r){ return r.key===s[3]; })[0];
    return cell ? { ref:ref, caseKey:s[0], c:c, ver:s[1], table:t, ins:s[2], insurer:Q.data.insurers[s[2]], rowKey:s[3], row:row, cell:cell } : null;
  }
  Q.cell = cellAt;
  Q.toCheck = function(ck, ver){
    var c = Q.data.cases[ck], out = [];
    Object.keys(c.tables).forEach(function(v){ if(ver && v!==ver) return; var t=c.tables[v];
      Q.data.rows.forEach(function(r){ t.plans.forEach(function(ins){ var x=t.cells[ins][r.key]; if(x && x.flag) out.push(ck+'/'+v+'/'+ins+'/'+r.key); }); }); });
    return out;
  };
  function rowLabel(row){ var g = Q.data.groups[row.grp]; return row.grp==='summary' ? row.label : g.label+' · '+row.label.toLowerCase(); }
  Q.rowLabel = rowLabel;

  function pdfPage(x){
    var plan = x.table.cells[x.ins], ins = x.insurer, prem = plan.premium.v, term = parseInt(plan.term.v,10)||20, body;
    if(x.row.grp==='summary'){
      body = '<h4>Plan summary</h4><table><tbody>'+['premium','term','sa','riders'].map(function(k){
        var r = Q.data.rows.filter(function(z){return z.key===k;})[0], v = plan[k].v, hl = k===x.rowKey;
        return '<tr'+(hl?' class="hl"':'')+'><td>'+r.label+'</td><td'+(hl?' class="target"':'')+'>'+(r.kind==='money'?Q.money(v):Q.esc(v))+'</td></tr>'; }).join('')+'</tbody></table>';
    } else {
      var cols = { guaranteed:'g', i300:'a', i425:'b' }, want = cols[x.row.grp];
      body = '<h4>Benefit illustration</h4><table><thead><tr><th>End of</th><th>Premiums paid</th><th>Guaranteed</th><th>Total at 3.00%</th><th>Total at 4.25%</th></tr></thead><tbody>'+
        [['10','Year 10',10],['20','Year 20',Math.min(20,term)],['65','Age 65',term]].map(function(y){
          var hl = y[0]===x.row.yr;
          return '<tr'+(hl?' class="hl"':'')+'><td>'+y[1]+'</td><td>'+Q.money(prem*y[2])+'</td>'+['g','a','b'].map(function(k){
            var c = plan[k+y[0]], tgt = hl && k===want;
            var txt = c.flag==='missing' || c.v==null ? '<span class="gone">not shown</span>' : Q.money(c.v);
            return '<td'+(tgt?' class="target"':'')+'>'+txt+'</td>'; }).join('')+'</tr>'; }).join('')+
        '</tbody></table><p class="pm" style="margin-top:8px">Illustrated values at 3.00% and 4.25% are not guaranteed.</p>';
    }
    return '<div class="pdf" role="img" aria-label="'+Q.esc(ins.name)+' PDF, page '+x.cell.p+'"><div class="pdf-top"><b>'+Q.esc(ins.name)+'</b><span>Policy illustration</span></div>'+
      '<p class="pm">Whole life participating · Life assured: '+Q.esc(x.c.name)+', age '+x.c.age+'</p>'+body+
      '<div class="pdf-foot"><span>'+Q.esc(ins.file)+'</span><span>Page '+x.cell.p+' of '+ins.pages+'</span></div></div>';
  }

  Q.openSheet = function(ref, opts){
    var x = cellAt(ref); if(!x) return;
    var queue = Q.toCheck(x.caseKey, x.ver), qi = queue.indexOf(ref), flag = x.cell.flag, mode = (opts&&opts.mode)||'';
    var val = x.row.kind==='money' ? Q.money(x.cell.v) : x.cell.v;
    var read = '<div class="readout"><span class="small muted">'+Q.esc(rowLabel(x.row))+'</span>'+
      '<span class="v">'+(flag==='missing'?'Not found':Q.esc(val))+'</span><span class="small muted">'+Q.esc(x.insurer.name)+' · page '+x.cell.p+'</span></div>';
    var ask = '', foot = '<button class="btn btn-secondary" data-close>Close</button>';
    if(flag==='check'){
      ask = mode==='fix'
        ? '<div class="field"><label class="label" for="fixv">Correct number</label><input class="input num" id="fixv" inputmode="numeric" value="'+x.cell.v+'"></div>'
        : '<p class="h3">Is this number right?</p><p class="small muted">We read it with low confidence. Compare it with the highlighted line.</p>';
      foot = mode==='fix' ? '<button class="btn btn-primary" data-act="save">Save</button><button class="btn btn-ghost" data-act="cancelfix">Cancel</button>'
                          : '<button class="btn btn-primary" data-act="confirm">Confirm</button><button class="btn btn-secondary" data-act="fix">Fix number</button>';
    } else if(flag==='missing'){
      ask = mode==='fix'
        ? '<div class="field"><label class="label" for="fixv">Number from the PDF</label><input class="input num" id="fixv" inputmode="numeric" placeholder="e.g. 158400"></div>'
        : '<p class="h3">We couldn\'t find this on the PDF.</p><p class="small muted">Type it if you can see it, or mark it as not shown.</p>';
      foot = mode==='fix' ? '<button class="btn btn-primary" data-act="save">Save</button><button class="btn btn-ghost" data-act="cancelfix">Cancel</button>'
                          : '<button class="btn btn-primary" data-act="fix">Type the number</button><button class="btn btn-secondary" data-act="na">Not shown in this PDF</button>';
    } else if(x.cell.by){ ask = '<p class="small" style="color:var(--ok)">'+Q.icon('check','i-sm')+' '+(x.cell.by==='na'?'Marked as not shown in this PDF.':'Checked by you.')+'</p>'; }
    var nav = (flag && queue.length) ? '<span class="small muted num" style="margin-left:auto">'+(qi+1)+' of '+queue.length+' to check</span>'+
      '<button class="icon-btn" data-act="prev" aria-label="Previous number to check"'+(qi<=0?' disabled':'')+'>'+Q.icon('back')+'</button>'+
      '<button class="icon-btn" data-act="nextc" aria-label="Next number to check"'+(qi>=queue.length-1?' disabled':'')+'>'+Q.icon('next')+'</button>' : '';
    Q.sheet({ title: x.insurer.name+' · page '+x.cell.p+' of '+x.insurer.pages, ref:ref,
      body: pdfPage(x) + read + ask, foot: foot + nav,
      mount: function(sh){
        // Phone: lay the page out at 440px and zoom it down to the sheet width, so no column is cut off (pinch to zoom in).
        // shortcut: fitted once on open, not on rotate; reopen the sheet after rotating.
        var pdf = sh.querySelector('.sheet-body .pdf');
        if(pdf){ var bd = pdf.parentNode, cs = getComputedStyle(bd), w = bd.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
          if(w < 440){ pdf.style.width = '440px'; pdf.style.zoom = w/440; } }
        var inp = sh.querySelector('#fixv'); if(inp){ inp.focus(); inp.select && inp.select(); inp.addEventListener('keydown',function(e){ if(e.key==='Enter') act('save'); }); }
        sh.querySelector('.sheet-foot').addEventListener('click', function(e){ var b=e.target.closest('[data-act]'); if(b) act(b.dataset.act); });
      } });
    function resolve(by){
      x.cell.flag = null; x.cell.by = by; Q.refresh(); Q.emit('cell', x);
      var left = Q.toCheck(x.caseKey, x.ver);
      if(left.length) Q.openSheet(left[0]);
      else { Q.closeSheet(); Q.toast('All numbers checked'); }
    }
    function act(a){
      if(a==='confirm') resolve('you');
      else if(a==='na'){ x.cell.v = null; resolve('na'); }
      else if(a==='fix') Q.openSheet(ref,{mode:'fix'});
      else if(a==='cancelfix') Q.openSheet(ref);
      else if(a==='save'){ var inp=document.getElementById('fixv'), n=parseInt(String(inp.value).replace(/[^0-9]/g,''),10);
        if(!n){ inp.setAttribute('aria-invalid','true'); return; } x.cell.v = n; resolve('you'); }
      else if(a==='prev') Q.openSheet(queue[qi-1]);
      else if(a==='nextc') Q.openSheet(queue[qi+1]);
    }
  };

  /* ---------- generic sheet ---------- */
  var sheetEl, scrimEl, sheetOpener, sheetRef, sheetClose;
  Q.sheet = function(o){
    var reuse = !!sheetEl; // closeSheet nulls it, so a sheet still opening (class not yet added) is reused, not doubled
    if(!reuse){
      sheetOpener = document.activeElement;
      scrimEl = document.createElement('div'); scrimEl.className = 'scrim'; scrimEl.addEventListener('click', Q.closeSheet);
      sheetEl = document.createElement('aside'); sheetEl.className = 'sheet'; sheetEl.setAttribute('role','dialog'); sheetEl.setAttribute('aria-modal','true');
      document.body.append(scrimEl, sheetEl);
    }
    sheetRef = o.ref || null; sheetClose = o.onClose || null;
    sheetEl.setAttribute('aria-label', o.title);
    sheetEl.innerHTML = '<div class="sheet-head"><h2>'+Q.esc(o.title)+'</h2><button class="icon-btn" data-close aria-label="Close">'+Q.icon('close')+'</button></div>'+
      '<div class="sheet-body">'+o.body+'</div>'+(o.foot?'<div class="sheet-foot">'+o.foot+'</div>':'');
    sheetEl.querySelectorAll('[data-close]').forEach(function(b){ b.addEventListener('click', Q.closeSheet); });
    if(!reuse){ var s0 = sheetEl, c0 = scrimEl; requestAnimationFrame(function(){ if(sheetEl===s0){ c0.classList.add('open'); s0.classList.add('open'); } }); }
    if(o.mount) o.mount(sheetEl);
    if(!sheetEl.contains(document.activeElement)) (sheetEl.querySelector('.sheet-foot .btn') || sheetEl.querySelector('[data-close]')).focus({preventScroll:true});
  };
  Q.closeSheet = function(){
    if(!sheetEl) return;
    var s = sheetEl, sc = scrimEl, ref = sheetRef; sheetEl = scrimEl = null;
    s.classList.remove('open'); sc.classList.remove('open');
    setTimeout(function(){ s.remove(); sc.remove(); }, 340);
    var back = (ref && document.querySelector('[data-sheet="'+ref+'"]')) || (document.contains(sheetOpener) ? sheetOpener : null);
    if(back) back.focus({preventScroll:true});
    if(sheetClose) sheetClose();
  };

  /* ---------- dialog ---------- */
  Q.dialog = function(o){
    return new Promise(function(done){
      var opener = document.activeElement, w = document.createElement('div');
      w.className = 'dialog-wrap';
      w.innerHTML = '<div class="dialog" role="dialog" aria-modal="true" aria-labelledby="dlg-t"><h2 id="dlg-t">'+Q.esc(o.title)+'</h2>'+
        (o.body?'<div>'+o.body+'</div>':'')+'<div class="acts">'+(o.actions||[]).map(function(a,i){
          return '<button class="btn btn-'+(a.kind||'secondary')+'" data-i="'+i+'">'+Q.esc(a.label)+'</button>'; }).join('')+'</div></div>';
      document.body.appendChild(w);
      requestAnimationFrame(function(){ w.classList.add('open'); });
      function close(v){ document.removeEventListener('keydown', key, true); w.classList.remove('open'); setTimeout(function(){ w.remove(); }, 220); if(opener && document.contains(opener)) opener.focus(); done(v); }
      function key(e){ if(e.key==='Escape'){ e.stopPropagation(); close(null); }
        if(e.key==='Tab'){ var f=w.querySelectorAll('button,input,select,textarea'), a=f[0], z=f[f.length-1];
          if(e.shiftKey && document.activeElement===a){ e.preventDefault(); z.focus(); } else if(!e.shiftKey && document.activeElement===z){ e.preventDefault(); a.focus(); } } }
      document.addEventListener('keydown', key, true);
      w.addEventListener('click', function(e){ if(e.target===w) return close(null); var b=e.target.closest('[data-i]'); if(b) close(o.actions[+b.dataset.i].value); });
      var safe = (o.actions||[]).map(function(a){return a.value;}).indexOf(o.safe);
      (w.querySelector('[data-i="'+(safe<0?0:safe)+'"]') || w.querySelector('button')).focus();
      if(o.mount) o.mount(w, close);
    });
  };

  /* ---------- toast ---------- */
  Q.toast = function(msg){
    var host = document.getElementById('toasts'), t = document.createElement('div');
    t.className = 'toast'; t.innerHTML = Q.icon('check','i-sm')+'<span>'+Q.esc(msg)+'</span>';
    host.appendChild(t); setTimeout(function(){ t.remove(); }, 4000);
  };

  /* ---------- recording bar ---------- */
  var rec = null;
  Q.recording = {
    get: function(){ return rec; },
    start: function(o){ if(rec) Q.recording.stop(); rec = { call: !!(o&&o.callAudio) && Q.edition()==='desktop', secs:0, paused:false }; rec.timer = setInterval(function(){ if(!rec.paused){ rec.secs++; paintRec(); } }, 1000); paintRec(); },
    pause: function(){ if(rec){ rec.paused = true; paintRec(); } },
    resume: function(){ if(rec){ rec.paused = false; paintRec(); } },
    stop: function(){ if(rec){ clearInterval(rec.timer); rec = null; paintRec(); Q.emit('recording-stopped'); } }
  };
  function paintRec(){
    var bar = document.getElementById('recbar'); if(!bar) return;
    if(!rec){ bar.hidden = true; bar.innerHTML = ''; return; }
    var t = String(Math.floor(rec.secs/60)).padStart(2,'0')+':'+String(rec.secs%60).padStart(2,'0');
    var msg = rec.paused ? 'Paused' : rec.call ? 'Recording your microphone + call audio' : 'Recording your microphone only · call audio is not recorded';
    bar.hidden = false; bar.className = 'recbar'+(rec.paused?' paused':'');
    bar.innerHTML = '<span class="live" aria-hidden="true"></span><span class="level" aria-hidden="true"><i></i><i></i><i></i><i></i></span><span role="status">'+msg+'</span>'+
      '<span class="t">'+t+'</span><button class="btn btn-secondary" data-rec="'+(rec.paused?'resume':'pause')+'">'+(rec.paused?'Resume':'Pause')+'</button><button class="btn btn-primary" data-rec="stop">Stop</button>';
  }

  /* ---------- demo toolbar ---------- */
  function buildJump(){
    var s = document.getElementById('demo-jump'); if(!s) return;
    s.innerHTML = Q.inventory.map(function(i){ var built = Q.routeFor(i[2]);
      return '<option value="'+i[2]+'">'+(i[0]?i[0]+'  ':'')+Q.esc(i[1])+(built?'':' (soon)')+'</option>'; }).join('');
    s.value = Q.route().hash;
  }
  Q.routeFor = function(h){ return Object.keys(screens).some(function(id){ return h===id || h.indexOf(id+'-')===0; }); };
  function syncDemo(){
    var d = document.getElementById('demo'); if(!d) return;
    [['theme',Q.theme()],['edition',Q.edition()],['state',Q.state()]].forEach(function(p){
      d.querySelectorAll('[data-'+p[0]+']').forEach(function(b){ b.setAttribute('aria-pressed', String(b.getAttribute('data-'+p[0])===p[1])); }); });
  }

  /* ---------- Preview as Phone (prototype only, wide screens). The same app in an iframe with ?frame=phone, which never nests. ---------- */
  var framed = qs.get('frame')==='phone', ppEl = null;
  if(framed) document.documentElement.classList.add('in-phone-frame');
  function ss(k,v){ try{ if(v===undefined) return sessionStorage.getItem(k); if(v===null) sessionStorage.removeItem(k); else sessionStorage.setItem(k,v); }catch(e){ return null; } }
  if(qs.get('preview')==='phone' && !framed) ss('q-phone','1');
  var SYS = '<svg viewBox="0 0 18 12" aria-hidden="true"><rect x="0" y="8" width="3" height="4" rx="1"/><rect x="5" y="5.5" width="3" height="6.5" rx="1"/><rect x="10" y="3" width="3" height="9" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1"/></svg>'+
    '<svg viewBox="0 0 16 12" aria-hidden="true"><path d="M8 2.6c2.3 0 4.4.9 6 2.4l1.3-1.4A10.6 10.6 0 0 0 8 .7 10.6 10.6 0 0 0 .7 3.6L2 5c1.6-1.5 3.7-2.4 6-2.4zm0 3.8c1.3 0 2.5.5 3.4 1.3l1.3-1.4A6.8 6.8 0 0 0 8 4.5c-1.8 0-3.5.7-4.7 1.8l1.3 1.4C5.5 6.9 6.7 6.4 8 6.4zm0 3.8L10.2 8a3.2 3.2 0 0 0-4.4 0z"/></svg>'+
    '<svg viewBox="0 0 27 12" aria-hidden="true"><rect x=".5" y=".5" width="22" height="11" rx="3.5" fill="none" stroke="currentColor" opacity=".4"/><rect x="2" y="2" width="19" height="8" rx="2"/><path d="M24.5 4v4c.8-.3 1.3-1.1 1.3-2s-.5-1.7-1.3-2z" opacity=".5"/></svg>';
  function fitPhone(){ if(!ppEl) return; var st = ppEl.querySelector('.pp-stage'), h = st ? st.clientHeight : window.innerHeight - 96, w = st ? st.clientWidth : window.innerWidth;
    ppEl.style.setProperty('--pp-scale', Math.min(1, (h - 24) / 868, (w - 32) / 414).toFixed(3)); } // device box is 390x844 + 12px bezel each side
  // The phone frame carries the parent's demo params (state, edition, theme, reset), never preview itself.
  function frameSrc(){ var q = new URLSearchParams(location.search); q.delete('preview'); q.set('frame','phone'); return location.pathname+'?'+q.toString()+location.hash; }
  // Parent and phone frame talk by postMessage (direct access is blocked on file:// in Chrome).
  // Frame -> parent: its screen (hash) and the colour at the top, so the device status bar matches the screen under it.
  // Parent -> frame: the Demo pill's screen jumps. Equality guards stop loops.
  function isDark(c){ var m = String(c).match(/\d+(\.\d+)?/g); if(!m) return false; return (0.299*m[0] + 0.587*m[1] + 0.114*m[2]) < 140; }
  function topColour(){
    var el = document.elementFromPoint(Math.round(window.innerWidth/2), 1), bg = '';
    while(el){ bg = getComputedStyle(el).backgroundColor; if(bg && bg!=='transparent' && !/rgba\([^)]*,\s*0\)/.test(bg)) break; el = el.parentElement; }
    return el ? bg : getComputedStyle(document.body).backgroundColor;
  }
  var postT = 0;
  function postTop(){ if(!framed) return; clearTimeout(postT); postT = setTimeout(function(){ try{ parent.postMessage({ q:'top', bg:topColour(), hash:location.hash }, '*'); }catch(e){} }, 40); }
  if(framed){ Q.on('render', postTop); window.addEventListener('scroll', postTop, { passive:true }); window.addEventListener('load', postTop); }
  window.addEventListener('message', function(e){
    var d = e.data; if(!d || typeof d!=='object') return;
    if(framed && d.q==='go' && d.hash && d.hash!==location.hash) location.hash = d.hash;
    if(framed && d.q==='demo'){ if(d.theme) Q.theme(d.theme); if(d.state) Q.state(d.state); }
    if(!framed && ppEl && d.q==='top'){
      var st = ppEl.querySelector('.pp-status'); if(st && d.bg){ st.style.background = d.bg; st.style.color = isDark(d.bg) ? 'var(--hero-ink)' : ''; }
      if(d.hash && d.hash!==location.hash) history.replaceState(null, '', d.hash); // no hashchange: nothing echoes back to the frame
    }
  });
  window.addEventListener('hashchange', function(){
    if(ppEl){ var f = ppEl.querySelector('iframe'); try{ f.contentWindow.postMessage({ q:'go', hash:location.hash }, '*'); }catch(e){} }
  });
  function openPhone(){
    if(ppEl || framed) return;
    ppEl = document.createElement('div'); ppEl.className = 'pp'; ppEl.setAttribute('role','dialog'); ppEl.setAttribute('aria-modal','true'); ppEl.setAttribute('aria-label','Phone preview');
    ppEl.innerHTML = '<div class="pp-bar"><span class="pp-cap" aria-hidden="true"></span>'+
      '<button class="btn btn-secondary btn-sm" type="button" data-pp-close>'+Q.icon('close','i-sm')+'Close phone preview</button></div>'+
      '<div class="pp-stage"><div class="pp-device"><i class="pp-btn pp-b1"></i><i class="pp-btn pp-b2"></i><i class="pp-btn pp-b3"></i><i class="pp-btn pp-b4"></i>'+
      '<div class="pp-screen"><div class="pp-status"><span class="pp-time num">9:41</span><i class="pp-island"></i><span class="pp-sys">'+SYS+'</span></div>'+
      '<iframe title="Quotient on a phone" src="'+frameSrc()+'"></iframe><i class="pp-home"></i></div></div></div>';
    document.body.appendChild(ppEl); document.body.classList.add('pp-on'); fitPhone();
    ppEl.querySelector('[data-pp-close]').focus({preventScroll:true});
  }
  /* Closing reloads on the frame's screen, so data the frame saved to sessionStorage shows here too. */
  function closePhone(){
    if(!ppEl) return;
    var h = location.hash; try{ h = ppEl.querySelector('iframe').contentWindow.location.hash || h; }catch(e){}
    history.replaceState(null, '', location.pathname + location.search.replace(/[?&]preview=phone/,'') + h); location.reload();
  }
  Q.phonePreview = function(on){
    if(on===undefined) return !framed && ss('q-phone')==='1';
    if(framed) return;
    ss('q-phone', on ? '1' : null);
    if(on) openPhone(); else closePhone();
  };
  window.addEventListener('resize', fitPhone);
  // Board cards and case rows: a tap anywhere that isn't a control opens the case (the name link holds the href).
  document.addEventListener('click', function(e){
    var card = e.target.closest('.bd-card, .cs-row'); if(!card || e.target.closest('a,button,input,select,textarea,label')) return;
    var link = card.querySelector('.bd-name, .who-link'); if(link) Q.go(link.getAttribute('href'));
  });
  // Theme picked inside the phone frame: keep the device status bar in step.
  window.addEventListener('storage', function(e){ if(e.key==='q-theme'){ if(e.newValue) document.documentElement.setAttribute('data-theme', e.newValue); else document.documentElement.removeAttribute('data-theme'); } });

  /* ---------- global events ---------- */
  document.addEventListener('click', function(e){
    var t = e.target;
    var go = t.closest('[data-go]'); if(go){ e.preventDefault(); Q.go(go.dataset.go); return; }
    var sh = t.closest('[data-sheet]'); if(sh){ e.preventDefault(); Q.openSheet(sh.dataset.sheet); return; }
    var to = t.closest('[data-toast]'); if(to){ Q.toast(to.dataset.toast); }
    var r = t.closest('[data-rec]'); if(r){ Q.recording[r.dataset.rec](); return; }
    var m = t.closest('[data-menu]');
    document.querySelectorAll('.menu.open').forEach(function(x){ if(!m || x!==m.parentElement) { x.classList.remove('open'); var b=x.querySelector('[data-menu]'); if(b) b.setAttribute('aria-expanded','false'); } });
    if(m){ var open = m.parentElement.classList.toggle('open'); m.setAttribute('aria-expanded', String(open)); }
    var d = t.closest('#demo [data-theme],#demo [data-edition],#demo [data-state]');
    if(d && ppEl){ // phone preview open: Web/Desktop leave the phone view; theme and state go straight to the phone (instant)
      if(d.dataset.edition){ Q.phonePreview(false); Q.edition(d.dataset.edition); return; }
      var f = ppEl.querySelector('iframe'), msg = { q:'demo' };
      if(d.dataset.theme){ msg.theme = d.dataset.theme; Q.theme(d.dataset.theme); }
      if(d.dataset.state){ msg.state = d.dataset.state; Q.state(d.dataset.state); }
      try{ f.contentWindow.postMessage(msg, '*'); }catch(err){}
      return;
    }
    if(d){ if(d.dataset.theme) Q.theme(d.dataset.theme); if(d.dataset.edition) Q.edition(d.dataset.edition); if(d.dataset.state) Q.state(d.dataset.state); }
    if(t.closest('[data-reset]')){ Q.resetData(); return; }
    if(t.closest('[data-phone]')){ Q.phonePreview(true); return; }
    if(t.closest('[data-pp-close]')){ Q.phonePreview(false); return; }
    if(t.closest('.demo-toggle')){ var dm=document.getElementById('demo'); var o=dm.classList.toggle('open'); t.closest('.demo-toggle').setAttribute('aria-expanded', String(o)); }
  });
  document.addEventListener('keydown', function(e){
    if(e.key==='Escape' && ppEl){ Q.phonePreview(false); return; }
    if(e.key==='Escape'){ if(sheetEl) Q.closeSheet(); document.querySelectorAll('.menu.open,.demo.open').forEach(function(x){ x.classList.remove('open'); }); }
    var typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) || document.activeElement.isContentEditable;
    if(!typing && !e.metaKey && !e.ctrlKey && !e.altKey && (e.key==='n'||e.key==='N') && !document.body.classList.contains('focus') && !sheetEl && !document.querySelector('.dialog-wrap,.wa-wrap,.fu-ss-wrap,.pp')) Q.go('#new-case');
  });
  window.addEventListener('hashchange', function(){
    if(ppEl) return; // phone preview open: the frame has the screen; the parent reloads on close
    if(sheetEl) Q.closeSheet();
    if(Q.waDemo && Q.waDemo.close) Q.waDemo.close();
    document.querySelectorAll('.fu-ss-wrap').forEach(function(x){ x.remove(); });
    render(true); });

  /* ---------- boot ---------- */
  var booted = false;
  ['theme','edition','state'].forEach(function(k){ var v = qs.get(k); if(v) store('q-'+k, (v==='system'||v==='normal')?null:v); });
  var th = Q.theme(); if(th!=='system') document.documentElement.setAttribute('data-theme', th);
  // Demo params are applied once, then dropped from the URL so a reload (or the phone frame) doesn't wipe or reset again.
  (function(){ var q = new URLSearchParams(location.search), had = false;
    ['reset','theme','edition','state'].forEach(function(k){ if(q.has(k)){ q.delete(k); had = true; } });
    if(had){ var s = q.toString(); history.replaceState(null, '', location.pathname+(s?'?'+s:'')+location.hash); } })();
  document.addEventListener('DOMContentLoaded', function(){
    booted = true; paintUser(); buildJump(); syncDemo();
    // Phone tab bar (UPDATE-2 C): 4 tabs. Calendar = #meetings. Phone records notes inside each case (Record notes for this case).
    var tb = document.querySelector('.tabbar');
    if(tb) tb.innerHTML = [['today','today','Today'],['cases','cases','Cases'],['meetings','meetings','Calendar'],['prefs','prefs','Settings']].map(function(t){
      return '<a href="#'+t[0]+'" data-nav="'+t[0]+'">'+Q.icon(t[1])+'<span>'+t[2]+'</span></a>'; }).join('');
    var j = document.getElementById('demo-jump'); if(j) j.addEventListener('change', function(){ Q.go('#'+j.value); });
    render(true);
    if(Q.phonePreview() && window.innerWidth > 760) openPhone();
  });
})();
