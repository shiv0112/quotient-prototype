/* S15 MAS checks and firm review (#mas-<case>[-<state>]). Signature screen: a calm rules-only instrument.
   States: notstarted, suggest, default (Marcus: Selected, 3 of 5), alldone, noquote; Not Selected = #mas-siti.
   The Selected Client test runs here as plain rules. No AI, nothing sent. Suggestions never fill an answer. */
(function(){
  'use strict';
  var D = Q.data, C = QD.c, ui = { hash:null };

  /* FAA-N16 rule: two or more "no" = Selected Client. Decides early when the rest can't change the result. */
  function verdict(a){
    var no = a.filter(function(x){ return x==='no'; }).length, yes = a.filter(function(x){ return x==='yes'; }).length;
    return no>=2 ? 'selected' : yes>=2 ? 'not' : 'open';
  }
  console.assert(verdict(['no','no',null])==='selected' && verdict(['yes','yes',null])==='not' && verdict(['no','yes',null])==='open' &&
    verdict(['no','yes','yes'])==='not' && verdict(['no','no','no'])==='selected' && verdict([null,null,null])==='open', 'MAS rule self-check failed');


  function reset(key, st){
    var src = key==='marcus' ? D.mas : C.masSiti;
    ui.st = st; ui.key = key; ui.noteOpen = null;
    ui.q = src.questions.map(function(q){ return { q:q.q, answer:q.answer, from:q.from, suggest:q.suggest||null }; });
    // Marcus's real checklist is the shared one, so ticks show on the case, Today and Cases. Demo states get a copy.
    ui.list = key===D.mas.c && !st ? D.mas.checklist : D.mas.checklist.map(function(x){ return { t:x.t, ref:x.ref, done:x.done, date:x.date||'', note:'' }; });
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
    var sug = '';
    if(q.suggest==='none') sug = '<div class="mas-sug"><span class="lab">No suggestion</span><p class="small">No clear quote found. Please answer from your own notes.</p></div>';
    else if(q.suggest){ var v = q.suggest.value==='no'?'No':'Yes', chose = q.answer;
      sug = '<div class="mas-sug"><span class="lab">Suggested: '+v+' · from the meeting</span><q>'+Q.esc(q.suggest.quote)+'</q>'+
        '<div class="row"><span class="small muted num">Meeting '+q.suggest.at+'</span>'+
        (chose ? '<span class="small muted">You chose '+(chose==='no'?'No':'Yes')+'.</span>' : '<button class="btn btn-secondary btn-sm" data-use="'+i+'">Use this</button>')+
        '<a class="btn-link" href="#meeting-'+key+'-oct">Play from '+q.suggest.at+'</a></div></div>'; }
    return '<div class="mas-row'+(next?' next':'')+'" role="group" aria-labelledby="mq'+i+'">'+
      '<span class="mas-n" aria-hidden="true">0'+(i+1)+'</span>'+
      '<div>'+(next?'<span class="eyebrow mas-nexttag">Next to answer</span>':'')+'<p class="mas-qt" id="mq'+i+'">'+Q.esc(q.q)+'</p>'+ev+sug+'</div>'+
      '<div class="mas-yn">'+['yes','no'].map(function(v){
        return '<button data-q="'+i+'" data-v="'+v+'" aria-pressed="'+(q.answer===v)+'">'+(v==='yes'?'Yes':'No')+'</button>'; }).join('')+'</div></div>';
  }

  function readout(){
    var a = ui.q.map(function(q){ return q.answer; }), no = a.filter(function(x){ return x==='no'; }).length, v = verdict(a);
    var verdictHtml = v==='selected' ? '<h2 class="h2">Selected Client</h2><p>'+no+' of 3 answers are "no". Firm review applies before the policy starts.</p>'
      : v==='not' ? '<h2 class="h2">Not a Selected Client</h2><p>'+no+' of 3 answers are "no". No firm review needed for this test.</p>'
      : '<h2 class="h2">Answer all 3 questions</h2><p>The result shows as soon as it is decided.</p>';
    return '<div class="mas-read" aria-live="polite"><p class="eyebrow">Result</p><div class="mas-verdict">'+verdictHtml+'</div></div>';
  }

  function review(key, c){
    var done = ui.list.filter(function(x){ return x.done; }).length, nextI = -1;
    ui.list.some(function(x,i){ if(!x.done){ nextI = i; return true; } });
    var items = ui.list.map(function(x,i){
      var cls = x.done ? 'done' : i===nextI ? 'next' : '';
      var acts = x.done ? '' : '<div class="mas-acts"><button class="btn '+(i===nextI?'btn-primary':'btn-secondary')+' btn-sm" data-tick="'+i+'">Mark done</button></div>';
      var meta = (x.done ? '<span>Ticked '+Q.esc(x.date)+'</span><button class="btn-link" data-untick="'+i+'">Undo</button>' : '')+
        (x.note ? '<span>Note: '+Q.esc(x.note)+'</span>' : '')+(ui.noteOpen===i ? '' : '<button class="btn-link" data-note="'+i+'">'+(x.note?'Edit note':'Add note')+'</button>');
      var note = ui.noteOpen===i ? '<div class="mas-note"><label class="sr" for="mas-n'+i+'">Note for '+x.ref+'</label><input class="input" id="mas-n'+i+'" value="'+Q.esc(x.note)+'" placeholder="Optional note">'+
        '<button class="btn btn-secondary btn-sm" data-savenote="'+i+'">Save</button></div>' : '';
      return '<li class="mas-item '+cls+'"><span class="mas-ref">'+x.ref+'</span><span class="mas-dot" aria-hidden="true">'+(x.done?Q.icon('check','i-sm'):'')+'</span>'+
        '<div><p class="mas-it">'+Q.esc(x.t)+' <span class="sr">('+x.ref+', '+(x.done?'done':'not done')+')</span></p><div class="mas-meta">'+meta+'</div>'+note+'</div>'+acts+'</li>'; }).join('');
    var all = done===5 ? '<section class="card next-card done mas-done" aria-label="Firm review done"><div><p class="eyebrow">Firm review</p><h2>Firm review done · Mark won when the policy starts</h2>'+
      '<p>All 5 checks are ticked. Your firm decides when the policy starts.</p></div><a class="btn btn-secondary" href="#case-'+key+'">Open case</a></section>' : '';
    return all+'<section class="card mas-review" aria-labelledby="mas-rh"><div class="mas-rhead"><div><h2 class="h3" id="mas-rh">Firm review · <span class="num">'+done+' of 5</span> done</h2>'+
      '<p class="small muted" style="margin-top:2px">FAA-N16 safeguards for a Selected Client. Tick each when your firm has done it.</p></div>'+
      '<div class="mas-prog" aria-hidden="true">'+ui.list.map(function(x){ return '<i class="'+(x.done?'on':'')+'"></i>'; }).join('')+'</div></div>'+
      '<ol class="mas-rail">'+items+'</ol></section>';
  }

  function render(p){
    var key = D.cases[p.parts[0]] ? p.parts[0] : 'marcus', c = D.cases[key];
    if(location.hash!==ui.hash || ui.key!==key){ ui.hash = location.hash; reset(key, p.parts[1]||''); }
    var head = '<header><a class="back" href="#case-'+key+'">'+Q.icon('back','i-sm')+'Back to '+Q.esc(c.name)+'</a>'+
      '<h1 class="h1 display">MAS checks · '+Q.esc(c.name)+' <span class="case-no" style="font-family:var(--f-text);font-size:var(--t-lg);letter-spacing:0">#'+c.no+'</span></h1>'+
      '<div class="mas-sub"><p class="lede">Selected Client test (FAA-N16) · for every life policy</p>'+
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
      (v==='selected' ? review(key, c) : '')+
      '<p class="mas-foot">'+Q.icon('info','i-sm')+'<span>This is an aid for you and your firm. It is not a sign-off. Your firm sets the timing.</span></p></div>';
  }

  function mount(el, p){
    var pg = el.querySelector('.page'), ni = pg.querySelector('.mas-note .input'); if(ni) ni.focus();
    pg.addEventListener('click', function(e){
      var b = e.target.closest('[data-q]'); if(b){ var q = ui.q[+b.dataset.q]; q.answer = q.answer===b.dataset.v ? null : b.dataset.v; Q.refresh(); refocus('[data-q="'+b.dataset.q+'"][data-v="'+b.dataset.v+'"]'); return; }
      var u = e.target.closest('[data-use]'); if(u){ var qq = ui.q[+u.dataset.use]; qq.answer = qq.suggest.value; Q.refresh(); return; }
      var t = e.target.closest('[data-tick]'); if(t){ var x = ui.list[+t.dataset.tick]; x.done = true; x.date = D.today.date; Q.refresh(); Q.toast(x.ref+' ticked'); return; }
      var un = e.target.closest('[data-untick]'); if(un){ ui.list[+un.dataset.untick].done = false; Q.refresh(); return; }
      var n = e.target.closest('[data-note]'); if(n){ ui.noteOpen = +n.dataset.note; Q.refresh(); return; }
      var sn = e.target.closest('[data-savenote]'); if(sn){ saveNote(); }
    });
    pg.addEventListener('keydown', function(e){ if(e.target.closest('.mas-note') && e.key==='Enter') saveNote(); if(e.target.closest('.mas-note') && e.key==='Escape'){ ui.noteOpen = null; Q.refresh(); } });
    function saveNote(){ var i = ui.noteOpen, inp = pg.querySelector('#mas-n'+i); ui.list[i].note = inp.value.trim(); ui.noteOpen = null; Q.refresh(); }
    function refocus(sel){ var f = document.querySelector(sel); if(f) f.focus({preventScroll:true}); }
  }

  Q.screen('mas', { title:function(p){ var c = D.cases[p.parts[0]]; return 'MAS checks'+(c?' · '+c.name:''); }, nav:'cases', render:render, mount:mount });
})();
