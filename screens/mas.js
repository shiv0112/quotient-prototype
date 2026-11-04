/* S15 MAS checks and firm review (#mas-<case>[-<state>]). Signature screen: a calm rules-only instrument.
   States: notstarted, suggest, default (Marcus: Selected, 3 of 5), alldone, noquote; Not Selected = #mas-siti.
   Wording follows MAS Notice FAA-N16 (updated 29 Dec 2025) paras 10A to 10D, 41K to 41U, and the MAS FAQs of the same date.
   The Selected Client test runs here as plain rules. No AI, nothing sent. Suggestions never fill an answer. */
(function(){
  'use strict';
  var D = Q.data, C = QD.c, ui = { hash:null };
  /* "i" info button with a rule-reference popover (shared by write-up and MAS; first loaded copy wires the listeners) */
  function info(t){ return '<span class="u2-i"><button type="button" class="u2-ib" aria-label="Rule reference" aria-expanded="false">'+Q.icon('info','i-sm')+'</button><span class="u2-tip" role="tooltip">'+Q.esc(t)+'</span></span>'; }
  function rule(r){ return /^§/.test(r) ? 'MAS Notice FAA-N16 '+r : /^FAQ/.test(r) ? 'MAS '+r : r; }
  function lnk(s){ return s.replace(/ ?\((?:§|FAQ )[^()]*(?:\([^()]*\))?[^()]*\)([.,:;])?/g, function(m, p){ return (p||'')+' '+info(rule(m.trim().replace(/[.,:;]$/,'').slice(1,-1))); }); }
  function strip(s){ return s.replace(/ ?\((?:§|FAQ )[^()]*(?:\([^()]*\))?[^()]*\)/g, ''); }
  if(!window.__u2tip){ window.__u2tip = 1;
    var shut = function(except){ document.querySelectorAll('.u2-i.open').forEach(function(w){ if(w!==except){ w.classList.remove('open'); w.firstChild.setAttribute('aria-expanded','false'); } }); };
    var place = function(w){ var t = w.lastChild, b = w.firstChild.getBoundingClientRect(), tw = t.offsetWidth, th = t.offsetHeight; t.style.left = t.style.top = '0px'; var o = t.getBoundingClientRect(); /* a transformed ancestor (dialog) moves the fixed origin */ t.style.left = Math.max(8, Math.min(b.left, window.innerWidth-8-tw))-o.left+'px'; t.style.top = (b.bottom+th+8>window.innerHeight && b.top-th-4>8 ? b.top-th-4 : b.bottom-6)-o.top+'px'; };
    document.addEventListener('click', function(e){ var b = e.target.closest('.u2-ib'), w = b && b.parentNode; shut(w); if(!w) return; e.preventDefault(); e.stopPropagation(); var o = w.classList.toggle('open'); b.setAttribute('aria-expanded', o); place(w); });
    document.addEventListener('keydown', function(e){ if(e.key==='Escape'){ var o = document.querySelector('.u2-i.open'); if(o){ shut(); o.firstChild.focus(); } } });
    ['mouseover','focusin'].forEach(function(n){ document.addEventListener(n, function(e){ var w = e.target.closest && e.target.closest('.u2-i'); if(w) place(w); }); });
  }


  /* FAA-N16 §10A: two or more "no" = Selected Client. Decides early when the rest can't change the result. */
  function verdict(a){
    var no = a.filter(function(x){ return x==='no'; }).length, yes = a.filter(function(x){ return x==='yes'; }).length;
    return no>=2 ? 'selected' : yes>=2 ? 'not' : 'open';
  }
  console.assert(verdict(['no','no',null])==='selected' && verdict(['yes','yes',null])==='not' && verdict(['no','yes',null])==='open' &&
    verdict(['no','yes','yes'])==='not' && verdict(['no','no','no'])==='selected' && verdict([null,null,null])==='open', 'MAS rule self-check failed');

  function reset(key, st){
    var src = key==='marcus' ? D.mas : C.masSiti;
    ui.st = st; ui.key = key; ui.noteOpen = null; ui.override = null; ui.open = {};
    ui.ns = { decl:false, doc:false, selrep:false, call:false }; // Not Selected path (demo only)
    ui.q = src.questions.map(function(q){ return { q:q.q, answer:q.answer, from:q.from, note:q.note, suggest:q.suggest||null }; });
    // Marcus's real checklist is the shared one, so ticks show on the case, Today and Cases. Demo states get a copy.
    ui.list = key===D.mas.c && !st ? D.mas.checklist : D.mas.checklist.map(function(x){ return Object.assign({}, x, { note:'' }); });
    if(key!=='marcus'){ ui.q[0].from = 'From the case: age '+D.cases[key].age; ui.q[0].answer = D.cases[key].age<62 ? 'yes' : 'no'; }
    if(st==='notstarted'){ ui.q.forEach(function(q){ q.answer = null; q.suggest = null; }); }
    if(st==='suggest'){ ui.q[1].answer = null; ui.q[2].answer = null; }
    if(st==='noquote'){ ui.q[1].answer = null; ui.q[1].suggest = 'none'; }
    if(st==='alldone'){ ui.q[2].answer = 'yes'; ui.list.forEach(function(x){ if(!x.done){ x.done = true; x.date = D.today.date; } }); }
  }

  function demo(){
    var list = [['#mas-marcus-notstarted','Not started'],['#mas-marcus-suggest','Suggestion shown'],['#mas-marcus-noquote','No clear quote'],['#mas-siti','Not Selected'],['#mas-marcus','Selected Client'],['#mas-marcus-alldone','All done']];
    return '<nav class="switcher" aria-label="Demo states"><span class="eyebrow">Demo states</span><div class="switcher-chips">'+list.map(function(x){
      return '<button class="chip" data-go="'+x[0]+'" aria-pressed="'+(location.hash===x[0])+'">'+x[1]+'</button>'; }).join('')+'</div></nav>';
  }

  function question(i, q, next, key){
    var ev = q.from ? '<p class="mas-ev">'+Q.icon('file','i-sm')+Q.esc(q.from)+'</p>' : '';
    var note = q.note ? '<p class="mas-ev">'+Q.icon('info','i-sm')+'<span>'+lnk(Q.esc(q.note))+'</span></p>' : '';
    var sug = '';
    if(q.suggest==='none') sug = '<div class="mas-sug"><span class="lab">No suggestion</span><p class="small">No clear quote found. Please answer from your own notes.</p></div>';
    else if(q.suggest){ var v = q.suggest.value==='no'?'No':'Yes', chose = q.answer;
      sug = '<div class="mas-sug"><span class="lab">Suggested: '+v+' · from the meeting</span><q>'+Q.esc(q.suggest.quote)+'</q>'+
        '<div class="row"><span class="small muted num">Meeting '+q.suggest.at+'</span>'+
        (chose ? '<span class="small muted">You chose '+(chose==='no'?'No':'Yes')+'.</span>' : '<button class="btn btn-secondary btn-sm" data-use="'+i+'">Use this</button>')+
        '<a class="btn-link" href="#meeting-'+(q.suggest.mid||key+'-oct')+'">Play from '+q.suggest.at+'</a></div></div>'; }
    return '<div class="mas-row'+(next?' next':'')+'" role="group" aria-labelledby="mq'+i+'">'+
      '<span class="mas-n" aria-hidden="true">0'+(i+1)+'</span>'+
      '<div>'+(next?'<span class="eyebrow mas-nexttag">Next to answer</span>':'')+'<p class="mas-qt" id="mq'+i+'">'+Q.esc(q.q)+'</p>'+ev+note+sug+'</div>'+
      '<div class="mas-yn">'+['yes','no'].map(function(v){
        return '<button data-q="'+i+'" data-v="'+v+'" aria-pressed="'+(q.answer===v)+'">'+(v==='yes'?'Yes':'No')+'</button>'; }).join('')+'</div></div>';
  }

  function readout(){
    var a = ui.q.map(function(q){ return q.answer; }), no = a.filter(function(x){ return x==='no'; }).length, v = verdict(a), h;
    if(v==='selected' && ui.override) h = '<h2 class="h2">Not treated as a Selected Client</h2><p>'+no+' of 3 answers are "no", but you recorded why the safeguards do not apply.'+info('MAS Notice FAA-N16 §10B')+'</p>'+
      '<p class="mas-why">"'+Q.esc(ui.override)+'"</p><button class="btn-link" data-act="undo10b">Undo</button>';
    else if(v==='selected') h = '<h2 class="h2">Selected Client</h2><p>'+no+' of 3 answers are "no". '+info('MAS Notice FAA-N16 §10A')+'The safeguards below apply before the policy starts.</p>'+
      '<span class="u2-row"><button class="btn btn-secondary btn-sm mas-10b" data-act="10b">Not treating as a Selected Client? Record why</button>'+info('MAS Notice FAA-N16 §10B')+'</span>';
    else if(v==='not') h = '<h2 class="h2">Not a Selected Client</h2><p>'+no+' of 3 answers are "no". '+info('MAS Notice FAA-N16 §10A')+'The Selected Client safeguards do not apply.</p>';
    else h = '<h2 class="h2">Answer all 3 questions</h2><p>The result shows as soon as it is decided.</p>';
    return '<div class="mas-read" aria-live="polite"><p class="eyebrow">Result</p><div class="mas-verdict">'+h+'</div></div>';
  }

  /* The explanation under each safeguard, from the notice and FAQs. */
  function detail(x, key){ return lnk(detail0(x, key)); }
  function detail0(x, key){
    if(x.id==='decl') return '<p>Signed by both of you. At the end of the fact-find, tell the client they are a Selected Client and which safeguards apply (FAQ 5).</p>';
    if(x.id==='ti'){
      var held = Q.caseMeetings(key).filter(function(z){ return !z.upcoming; }), withTi = held.filter(function(z){ return z.m.ti; }).length;
      var seg = '<div class="seg mas-path" role="group" aria-label="Which applies">'+[['a','(a) Trusted individual present'],['b','(b) Client declined in writing']].map(function(p){
        return '<button data-path="'+p[0]+'" aria-pressed="'+(x.path===p[0])+'">'+p[1]+'</button>'; }).join('')+'</div>';
      if(x.path==='b') return seg+'<p>The client\'s written statement that they decline to have a trusted individual present and can make decisions without one (§10D(b)).</p>';
      return seg+(x.ti?'<p><b>'+Q.esc(x.ti)+'</b> · present at '+withTi+' of '+held.length+' meetings</p>':'')+
        '<ul class="mas-crit"><li>21 or older</li><li>Proficient in the language of the meeting and documents</li><li>At least GCE O-Level or N-Level, or equivalent</li><li>Can communicate well with the client</li><li>The client\'s consent to share their information with them, documented</li></ul>'+
        '<p class="small muted">Should not be someone with a conflict of interest, such as your firm\'s staff or your supervisor. Family is allowed, but watch for pressure on the client (FAQ 8). Needed at every meeting, including later sales; a different trusted individual is allowed if they meet the criteria (FAQ 9).</p>';
    }
    if(x.id==='doc') return '<p>Review of the needs analysis and know-your-client records, before the policy\'s effective date. Done by your supervisor, non-sales staff, a third party, or a system your firm has shown works (§41N).</p>'+(x.by?'<p class="small muted">Done by: '+Q.esc(x.by)+'</p>':'');
    if(x.id==='call') return '<p>'+(x.summary?'Not recorded: a call-back or meeting with a summary document acknowledged by the client and the person who called. The summary records the questions, the answers and why it was not recorded (§41T).':'Audio-recorded call with the client (§41S). It asks about:')+'</p>'+
        '<ul class="mas-crit"><li>The reason for recommending the plan</li><li>Its main features, risks and limits</li><li>The free-look period</li><li>Whether a trusted individual was offered and present</li><li>How you conducted yourself</li></ul>'+
        '<label class="check"><input type="checkbox" data-flag="sup"'+(x.sup?' checked':'')+'> Your supervisor was present for the whole process, so no call-back is needed (§41K(b)). Part of the process is not enough (FAQ 10).</label>'+
        '<label class="check"><input type="checkbox" data-flag="summary"'+(x.summary?' checked':'')+'> The client won\'t be recorded (§41T)</label>'+
        '<p class="small muted">Tell the client to expect the call (FAQ 16). Keep the recording or summary for 5 years; the client can ask for a copy (§41U).</p>';
    if(x.id==='eff') return '<p>The effective date is when the policy is issued, takes effect or cover starts, whichever is latest (§41R).</p>';
    return '';
  }

  function review(key){
    var done = ui.list.filter(Q.masDone).length, total = ui.list.length, nextI = -1;
    ui.list.some(function(x,i){ if(!Q.masDone(x)){ nextI = i; return true; } });
    var items = ui.list.map(function(x,i){
      var ok = Q.masDone(x), cls = ok ? 'done' : i===nextI ? 'next' : '';
      var title = x.id==='call' && x.summary ? 'Call-back, not recorded · summary document' : x.t;
      var acts = ok ? '' : '<div class="mas-acts"><button class="btn '+(i===nextI?'btn-primary':'btn-secondary')+' btn-sm" data-tick="'+i+'">Mark done</button></div>';
      var meta = (x.id==='call' && x.sup && !x.done ? '<span>Not needed · supervisor present throughout</span>' : x.done ? '<span>Ticked '+Q.esc(x.date)+'</span><button class="btn-link" data-untick="'+i+'">Undo</button>' : '')+
        (x.note ? '<span>Note: '+Q.esc(x.note)+'</span>' : '')+(ui.noteOpen===i ? '' : '<button class="btn-link" data-note="'+i+'">'+(x.note?'Edit note':'Add note')+'</button>');
      var note = ui.noteOpen===i ? '<div class="mas-note"><label class="sr" for="mas-n'+i+'">Note for this check</label><input class="input" id="mas-n'+i+'" value="'+Q.esc(x.note||'')+'" placeholder="Optional note">'+
        '<button class="btn btn-secondary btn-sm" data-savenote="'+i+'">Save</button></div>' : '';
      var open = i in ui.open ? ui.open[i] : !ok;
      return '<li class="mas-item '+cls+'"><span class="mas-dot" aria-hidden="true">'+(ok?Q.icon('check','i-sm'):'')+'</span>'+
        '<div><p class="mas-it">'+Q.esc(title)+' '+info(rule(x.ref)+(x.faq?', '+x.faq:''))+' <span class="sr">('+(ok?'done':'not done')+')</span></p>'+
        '<details class="mas-det" data-det="'+i+'"'+(open?' open':'')+'><summary>Details</summary><div class="mas-detb">'+detail(x, key)+'</div></details>'+
        '<div class="mas-meta">'+meta+'</div>'+note+'</div>'+acts+'</li>'; }).join('');
    var all = done===total ? '<section class="card next-card done mas-done" aria-label="Firm review done"><div><p class="eyebrow">Firm review</p><h2>Firm review done · Mark won when the policy starts</h2>'+
      '<p>All '+total+' checks are ticked. Your firm decides when the policy starts.</p></div><a class="btn btn-secondary" href="#case-'+key+'">Open case</a></section>' : '';
    return all+'<section class="card mas-review" aria-labelledby="mas-rh"><div class="mas-rhead"><div><h2 class="h3" id="mas-rh">Firm review · <span class="num">'+done+' of '+total+'</span> done</h2>'+
      '<p class="small muted" style="margin-top:2px">Selected Client safeguards and checks before the policy starts. The checks also apply to every client of a selected representative.'+info('MAS Notice FAA-N16 §10C, §10D, §41K')+'</p></div>'+
      '<div class="mas-prog" style="grid-template-columns:repeat('+total+',28px)" aria-hidden="true">'+ui.list.map(function(x){ return '<i class="'+(Q.masDone(x)?'on':'')+'"></i>'; }).join('')+'</div></div>'+
      '<ol class="mas-rail">'+items+'</ol></section>';
  }

  /* Not a Selected Client: the determination is still documented (§10C) and a documentation review is still needed (§41L). */
  function notSelected(){
    var n = ui.ns, rows = [
      ['decl','§10C', ui.override ? 'Assessment documented and declared, with your reason for not treating the client as a Selected Client' : 'Assessment documented and declared', 'Signed by the client and you (FAQ 5).'],
      ['doc','§41L','Documentation review before the policy starts','Needs analysis and know-your-client records, reviewed by your supervisor, non-sales staff, a third party or a system your firm has shown works (§41N).'] ];
    if(n.selrep) rows.push(['call','§41K(b) · §41S','Call-back, audio-recorded','Needed because you are a selected representative. Same questions as for a Selected Client.']);
    return '<section class="card mas-review" aria-labelledby="mas-nh"><div class="mas-rhead"><div><h2 class="h3" id="mas-nh">Before the policy starts</h2>'+
      '<p class="small muted" style="margin-top:2px">No trusted individual needed. A call-back is not required unless you are a selected representative.</p></div></div>'+
      '<ol class="mas-rail">'+rows.map(function(r){ var ok = n[r[0]];
        return '<li class="mas-item'+(ok?' done':'')+'"><span class="mas-dot" aria-hidden="true">'+(ok?Q.icon('check','i-sm'):'')+'</span>'+
          '<div><p class="mas-it">'+Q.esc(r[2])+' '+info(rule(r[1]))+'</p><p class="small muted">'+lnk(Q.esc(r[3]))+'</p></div>'+
          '<div class="mas-acts"><button class="btn btn-secondary btn-sm" data-ns="'+r[0]+'">'+(ok?'Undo':'Mark done')+'</button></div></li>'; }).join('')+'</ol>'+
      '<label class="switch"><input type="checkbox" data-selrep'+(n.selrep?' checked':'')+'> I am a selected representative <span class="small muted">(balanced scorecard grade B or worse for two quarters in a row)</span>'+info('MAS FAQ 11')+'</label></section>';
  }

  /* Phone: one sticky main action. Next open firm check, else back to the case (answers save as you go). */
  function dock(key, v){
    var nextI = -1; if(v==='selected' && !ui.override) ui.list.some(function(x,i){ if(!Q.masDone(x)){ nextI = i; return true; } });
    return '<div class="u2-dock u2-ponly">'+(nextI>=0 ? '<button class="btn btn-primary" data-tick="'+nextI+'">'+Q.icon('check','i-sm')+'Mark check '+(nextI+1)+' of '+ui.list.length+' done</button>'
      : '<a class="btn btn-primary" href="#case-'+key+'">Save and back to case</a>')+'</div>';
  }

  function render(p){
    var key = D.cases[p.parts[0]] ? p.parts[0] : 'marcus', c = D.cases[key];
    if(location.hash!==ui.hash || ui.key!==key){ ui.hash = location.hash; reset(key, p.parts[1]||''); }
    var head = '<header><a class="back" href="#case-'+key+'">'+Q.icon('back','i-sm')+'Back to '+Q.esc(c.name)+'</a>'+
      '<h1 class="h1 display">MAS checks · '+Q.esc(c.name)+' <span class="case-no" style="font-family:var(--f-text);font-size:var(--t-lg);letter-spacing:0">#'+c.no+'</span></h1>'+
      '<div class="mas-sub"><p class="lede">Selected Client test · for every life policy'+info('MAS Notice FAA-N16 §10A')+'</p>'+
      '<span class="chip chip-device mas-badge">'+Q.icon('device','i-sm')+'Checked on this device · no AI · nothing sent</span></div></header>';
    if(p.state==='error') return '<div class="page mas">'+demo()+head+'<div class="banner banner-error" role="alert">'+Q.icon('alert')+'<p>Couldn\'t load the checks. Nothing was sent.</p><button class="btn-link" data-go="#mas-'+key+'">Try again</button></div></div>';
    if(p.state==='loading') return '<div class="page mas">'+demo()+head+'<div class="card" aria-busy="true">'+[1,2,3].map(function(){ return '<div class="skel-row"><span class="skel" style="width:60%"></span><span class="skel" style="width:120px"></span></div>'; }).join('')+'</div></div>';
    var a = ui.q.map(function(q){ return q.answer; }), nextQ = a.indexOf(null), v = verdict(a);
    var hasSug = ui.q.some(function(q){ return q.suggest; });
    return '<div class="page mas">'+demo()+head+
      '<section class="card mas-inst" aria-labelledby="mas-t"><div class="mas-q"><div class="mas-ihead"><h2 class="eyebrow" id="mas-t">Selected Client test · 3 questions</h2>'+
        '<p class="mas-rule">Rule: <b>two or more "no" = Selected Client</b></p></div>'+
        ui.q.map(function(q,i){ return question(i, q, i===nextQ, key); }).join('')+
        (hasSug ? '' : '<p class="small" style="margin-top:var(--s-5)"><a href="#gate-'+key+'" style="font-weight:600">Suggest answers from the meeting</a> <span class="muted">· goes through the privacy gate. You still choose every answer.</span></p>')+
      '</div>'+readout()+'</section>'+
      (v==='selected' && !ui.override ? review(key) : v==='open' ? '' : notSelected())+
      '<p class="mas-foot">'+Q.icon('info','i-sm')+'<span>This is an aid for you and your firm. It is not a sign-off. Your firm sets the timing.</span></p>'+dock(key, v)+'</div>';
  }

  function ask10b(){
    var reason = '';
    Q.dialog({ title:'Not treating as a Selected Client',
      body:'<p class="small">You may do this only if you have reasons to conclude the client has adequate knowledge and experience in this class of product, and your recommendation is limited to it. The reason is documented with the assessment.'+info('MAS Notice FAA-N16 §10B, §10C')+'</p>'+
        '<div class="field"><label class="label" for="m10b">Your reason</label><textarea class="textarea" id="m10b" rows="3"></textarea><span class="field-error" id="m10b-e" hidden>Write the reason first.</span></div>',
      actions:[{label:'Cancel',value:null},{label:'Record reason',value:'ok',kind:'primary'}], safe:null,
      mount:function(w){ var t = w.querySelector('#m10b');
        t.addEventListener('input', function(){ reason = t.value.trim(); });
        // Block the save until there is a written reason (capture runs before the dialog's own click handler).
        w.addEventListener('click', function(e){ var b = e.target.closest('[data-i="1"]'); if(b && !t.value.trim()){ e.stopPropagation(); t.setAttribute('aria-invalid','true'); w.querySelector('#m10b-e').hidden = false; t.focus(); } }, true); } })
    .then(function(v){ if(v && reason){ ui.override = reason; Q.refresh(); Q.toast('Reason recorded'); } });
  }

  function mount(el, p){
    var pg = el.querySelector('.page'), ni = pg.querySelector('.mas-note .input'); if(ni) ni.focus();
    pg.addEventListener('click', function(e){
      var b = e.target.closest('[data-q]'); if(b){ var q = ui.q[+b.dataset.q]; q.answer = q.answer===b.dataset.v ? null : b.dataset.v; Q.refresh(); refocus('[data-q="'+b.dataset.q+'"][data-v="'+b.dataset.v+'"]'); return; }
      var u = e.target.closest('[data-use]'); if(u){ var qq = ui.q[+u.dataset.use]; qq.answer = qq.suggest.value; Q.refresh(); return; }
      var t = e.target.closest('[data-tick]'); if(t){ var x = ui.list[+t.dataset.tick]; x.done = true; x.date = D.today.date; delete ui.open[+t.dataset.tick]; Q.refresh(); Q.toast('Check ticked'); return; }
      var un = e.target.closest('[data-untick]'); if(un){ ui.list[+un.dataset.untick].done = false; Q.refresh(); return; }
      var pa = e.target.closest('[data-path]'); if(pa){ ui.list.filter(function(x){ return x.id==='ti'; })[0].path = pa.dataset.path; Q.refresh(); refocus('[data-path="'+pa.dataset.path+'"]'); return; }
      var ns = e.target.closest('[data-ns]'); if(ns){ ui.ns[ns.dataset.ns] = !ui.ns[ns.dataset.ns]; Q.refresh(); refocus('[data-ns="'+ns.dataset.ns+'"]'); return; }
      var n = e.target.closest('[data-note]'); if(n){ ui.noteOpen = +n.dataset.note; Q.refresh(); return; }
      var sn = e.target.closest('[data-savenote]'); if(sn){ saveNote(); return; }
      var a = e.target.closest('[data-act]'); if(a && a.dataset.act==='10b') ask10b();
      if(a && a.dataset.act==='undo10b'){ ui.override = null; Q.refresh(); }
    });
    pg.addEventListener('change', function(e){
      var f = e.target.closest('[data-flag]'); if(f){ var x = ui.list.filter(function(z){ return z.id==='call'; })[0]; x[f.dataset.flag] = f.checked; Q.refresh(); refocus('[data-flag="'+f.dataset.flag+'"]'); return; }
      if(e.target.matches('[data-selrep]')){ ui.ns.selrep = e.target.checked; Q.refresh(); refocus('[data-selrep]'); }
    });
    pg.querySelectorAll('[data-det]').forEach(function(d){ d.addEventListener('toggle', function(){ ui.open[+d.dataset.det] = d.open; }); });
    pg.addEventListener('keydown', function(e){ if(e.target.closest('.mas-note') && e.key==='Enter') saveNote(); if(e.target.closest('.mas-note') && e.key==='Escape'){ ui.noteOpen = null; Q.refresh(); } });
    function saveNote(){ var i = ui.noteOpen, inp = pg.querySelector('#mas-n'+i); ui.list[i].note = inp.value.trim(); ui.noteOpen = null; Q.refresh(); }
    function refocus(sel){ var f = document.querySelector(sel); if(f) f.focus({preventScroll:true}); }
  }

  Q.screen('mas', { title:function(p){ var c = D.cases[p.parts[0]]; return 'MAS checks'+(c?' · '+c.name:''); }, nav:'cases', render:render, mount:mount });
})();
