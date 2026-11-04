/* S08 Privacy gate (#gate-<case>) and S09 Edit what is sent (#gate-edit-<case>). Focus mode.
   The receipt: exact outgoing text, placeholders fold in once on entry, counts tick up. */
(function(){
  'use strict';
  var D = Q.data, B = QD.b, lifted = {};


  function ctx(p){ var key = D.cases[p.parts[0]] && QB.feature(p.parts[0]) ? p.parts[0] : 'wei'; return { key:key, c:D.cases[key], f:QB.feature(key) }; }
  function backTo(x){ var fl = B.flow[x.f]; return { href:fl.back, label: { compare:'Back to '+x.c.name, 'compare-daniel':'Back to '+x.c.name, writeup:'Back to the write-up', nudge:'Back to the nudge', 'mas-suggest':'Back to MAS checks' }[x.f] }; }

  /* ---------------- S08 ---------------- */
  function ledger(v){
    return '<ul class="s08-led" aria-label="Replaced on this device">'+v.rows.map(function(r){
      var orig = r.removed || r.kind==='NRIC' || r.kind==='Phone' ? 'Not shown' : r.orig;
      var right = r.removed ? '<span class="gone">REMOVED</span>' : '<span class="ph">'+Q.esc(r.ph)+'</span>';
      return '<li><span class="k">'+Q.esc(r.kind)+'</span><span class="o">'+Q.esc(orig)+'</span><span class="dots" aria-hidden="true"></span>'+right+
        '<span class="n">'+(r.removed?'':'×'+r.n)+'</span></li>'; }).join('')+'</ul>';
  }
  function exact(v, x){
    var known = v.g.known ? '<p class="s08-known">'+Q.icon('device','i-sm')+Q.esc(v.g.known)+'</p>' : '';
    return '<div class="s08-src">'+v.cards.map(function(c){
      return '<section><h3>'+Q.icon(/PDF/.test(c.src)?'file':'info','i-sm')+Q.esc(c.src)+'</h3><p class="s08-txt">'+c.parts.map(function(pt){
        return pt.ph ? '<span class="s08-ph" data-o="'+Q.esc(pt.r.orig)+'"><span class="ph">'+Q.esc(pt.ph)+'</span></span>' : Q.esc(pt.s); }).join('')+'</p></section>'; }).join('')+known+'</div>';
  }

  function renderGate(p){
    var x = ctx(p), v = QB.view(x.key), fl = B.flow[x.f], b = backTo(x);
    // First case: the full receipt. After the first Send (D.adviser.gateSeen): a one-line summary, details one tap away.
    var states = [['normal','First time · full'],['summary','Later · one line'],['loading','Finding details'],['error','Error']];
    if(/^compare/.test(x.f)) states.splice(2,0,['nothing','Nothing to send']);
    var s = QB.local('gate', states.map(function(z){return z[0];}), D.adviser.gateSeen ? 'summary' : 'normal', p);
    var head = QB.demo(states, s.s)+'<a class="back" href="'+b.href+'">'+Q.icon('back','i-sm')+Q.esc(b.label)+'</a>'+
      '<header class="s08-head rise"><p class="eyebrow">Before anything is sent · Case #'+x.c.no+'</p><h1 class="h1">What leaves your device</h1><p class="sub">'+Q.esc(D.gate[x.f].sub)+'</p></header>';
    if(s.s==='loading') return '<div class="page s08">'+head+'<div class="s08-rc" aria-busy="true"><p class="s08-sec">Finding personal details on this device…</p>'+
      [70,92,84,60,88,40].map(function(w){ return '<span class="skel" style="width:'+w+'%;margin-top:14px"></span>'; }).join('')+'</div></div>';
    if(s.s==='error') return '<div class="page s08">'+head+'<div class="banner banner-error" role="alert">'+Q.icon('alert')+
      '<p>Couldn\'t check this text. Nothing was sent.</p><button class="btn-link" data-bstate="normal">Try again</button></div>'+
      '<div class="s08-acts"><a class="btn btn-ghost" href="'+fl.back+'">Cancel</a></div></div>';
    if(s.s==='nothing') return '<div class="page s08">'+head+'<div class="s08-rc rise"><div class="s08-nothing">'+
      '<span class="chip chip-device">'+Q.icon('device','i-sm')+'0 characters</span><p class="big">Nothing leaves your device for this comparison.</p>'+
      '<p class="muted">Harbour Assurance, Meridian Life and Orchid Mutual are all read on this device.</p></div></div>'+
      '<div class="s08-acts u2-dock"><button class="btn btn-primary" data-act="build">Build comparison</button><span class="spacer"></span><a class="btn btn-ghost" href="'+fl.back+'">Cancel</a></div></div>';
    if(s.s==='summary') return '<div class="page s08">'+head+picker(x, v)+
      '<section class="s08-rc u2-gsum rise" aria-label="Outgoing text summary"><p class="u2-gline">'+Q.icon('device')+'<span><b class="num">'+v.charsLabel+'</b> characters<span class="dot-sep"></span><b class="num">'+v.count+'</b> details replaced on this device</span>'+
        '<button class="btn-link" data-bstate="normal">See details</button></p>'+
        '<p class="small muted">Kept on this device: the PDFs, names, NRIC, phone, email, address.</p></section>'+
      '<div class="s08-acts u2-dock"><button class="btn btn-primary" data-act="send">Send this text</button><span class="spacer"></span><a class="btn btn-ghost" href="'+fl.back+'">Cancel</a></div></div>';
    return '<div class="page s08">'+head+picker(x, v)+
      '<article class="s08-rc rise" aria-label="Outgoing text">'+
        '<div class="s08-rc-top"><span class="s08-sec" style="margin:0">Outgoing text · '+Q.esc(B.featureName[x.f])+'</span><span class="s08-sec r" style="margin:0">Case #'+x.c.no+'</span>'+
        '<span class="meta">To the AI, after you press Send</span><span class="meta r num">'+D.today.date+' · 10:12</span></div>'+
        '<hr class="s08-cut"><p class="s08-sec">Replaced on this device</p>'+ledger(v)+
        '<hr class="s08-cut"><p class="s08-sec">The exact text</p>'+exact(v, x)+
        '<hr class="s08-dbl"><div class="s08-tot"><span class="l">Details replaced</span><span class="v num" data-count="'+v.count+'">'+v.count+'</span>'+
        '<span class="l">Characters sent</span><span class="v big num" data-count="'+v.chars+'">'+v.charsLabel+'</span></div>'+
        '<p class="s08-kept">'+Q.icon('device','i-sm')+'<span>Kept on this device: the PDFs, names, NRIC, phone, email, address. Names go back in when the answer returns.</span></p>'+
      '</article>'+
      '<div class="s08-acts u2-dock"><button class="btn btn-primary" data-act="send">Send this text</button><a class="btn btn-secondary" href="#gate-edit-'+x.key+'">Edit what is sent</a>'+
      '<span class="spacer"></span><a class="btn btn-ghost" href="'+fl.back+'">Cancel</a></div></div>';
  }

  /* "Your notes": choose which meetings and notes go in (default all for the case). The receipt shows each one's text under its own heading. */
  function picker(x, v){
    if(!(v.g.cards||[]).some(function(c){ return c.mid; })) return '';
    var pick = QB.pick(x.key), list = Q.caseMeetings(x.key).filter(function(m){ return !m.upcoming && m.m.notesReady; });
    return '<div class="s08-pick rise" role="group" aria-labelledby="s08-pk"><span class="label" id="s08-pk">Your notes from</span><div class="switcher-chips" style="flex-wrap:wrap">'+list.map(function(z){ var m = z.m;
      return '<button class="chip" data-pick="'+m.id+'" aria-pressed="'+(pick.indexOf(m.id)>=0)+'">'+(m.kind==='notes'?'Quick notes · ':'Meeting · ')+Q.esc(m.date)+' '+Q.esc(m.time)+'</button>'; }).join('')+'</div>'+
      (pick.length ? '' : '<span class="small muted">No notes selected. Only the other text below is sent.</span>')+'</div>';
  }



  function mountGate(el, p){
    var x = ctx(p), pg = el.querySelector('.page');
    pg.addEventListener('click', function(e){
      var pk = e.target.closest('[data-pick]');
      if(pk){ var cur = QB.pick(x.key), i = cur.indexOf(pk.dataset.pick); if(i>=0) cur.splice(i,1); else cur.push(pk.dataset.pick); Q.refresh(); var f = document.querySelector('[data-pick="'+pk.dataset.pick+'"]'); if(f) f.focus({preventScroll:true}); return; }
      var a = e.target.closest('[data-act]'); if(!a) return;
      var v = QB.view(x.key);
      if(a.dataset.act==='send'){
        (B.sends[x.key] = B.sends[x.key] || []).unshift({ feature:B.featureName[x.f], when:D.today.date+', 10:12', text:v.cards.map(function(c){ return c.text; }).join('\n\n'), fresh:true });
        B.nothing = false; D.adviser.gateSeen = true; Q.go('#processing-'+x.key);
      }
      if(a.dataset.act==='build'){ B.nothing = true; Q.go('#processing-'+x.key); }
    });
    var phs = pg.querySelectorAll('.s08-ph');
    if(!phs.length || lifted[location.hash] || QB.reduced()) return;
    lifted[location.hash] = true;
    // Show the originals first, then fold each into its placeholder, left to right, once.
    // The characters-sent total always shows the real count of the text above; only the details count ticks with the fold.
    var cnt = pg.querySelector('[data-count]'), n = 0;
    phs.forEach(function(s){ s.classList.add('pre'); });
    cnt.textContent = '0';
    phs.forEach(function(s, i){
      setTimeout(function(){ s.classList.remove('pre'); s.classList.add('lift'); n++; cnt.textContent = n;
        setTimeout(function(){ s.classList.add('done'); s.classList.remove('lift'); }, 340); }, 700 + i*110);
    });
    setTimeout(function(){ cnt.textContent = cnt.dataset.count; }, 700 + phs.length*110);
  }

  Q.screen('gate', { title:'What leaves your device', rail:false, nav:'', render:renderGate, mount:mountGate });

  /* ---------------- S09 ---------------- */
  var tick = false, askNow = false;
  function renderEdit(p){
    var x = ctx(p), v = QB.view(x.key), e = QB.edits(x.key);
    var s = QB.local('gate-edit', ['normal','hidden','confirm'], 'normal', p);
    if(s.fresh && s.s==='hidden' && !e.hidden.length){ e.hidden.push('non-smoker'); e.undo.push({ hide:'non-smoker' }); v = QB.view(x.key); }
    var text = v.cards.map(function(c){
      return '<section class="card"><p class="s08-sec">'+Q.esc(c.src)+'</p><p class="s09-txt">'+c.parts.map(function(pt){
        if(pt.ph) return '<button class="s09-p" data-show="'+Q.esc(pt.ph)+'" aria-label="'+Q.esc(pt.ph)+', hidden '+Q.esc(pt.r.kind.toLowerCase())+'. Show again"><span class="ph">'+Q.esc(pt.ph)+'</span></button>';
        var out = '', last = 0;
        pt.s.replace(QB.WORD, function(w, off){ var e = Q.esc(w);
          out += Q.esc(pt.s.slice(last, off))+'<button class="s09-w" data-hide="'+e+'" aria-label="Hide '+e+'">'+e+'</button>'; last = off + w.length; return w; });
        return out + Q.esc(pt.s.slice(last));
      }).join('')+'</p></section>'; }).join('');
    var side = '<ul>'+v.rows.map(function(r){
      var what = r.removed || r.kind==='NRIC' || r.kind==='Phone' ? r.kind+' (hidden)' : r.kind;
      var act = r.removed ? '<span class="small muted">Removed</span>' : '<button class="btn-link" data-show="'+Q.esc(r.ph)+'">Show again</button>';
      return '<li>'+(r.removed?'<span class="chip">removed</span>':'<span class="ph">'+Q.esc(r.ph)+'</span>')+'<span>'+Q.esc(what)+(r.n>1?'<small>'+r.n+' places</small>':'')+'</span>'+act+'</li>'; }).join('')+'</ul>';
    var undo = e.undo.length ? '<button class="btn btn-ghost btn-sm" data-act="undo">Undo</button>' : '';
    var t = tick ? ' s09-tick' : ''; tick = false; askNow = s.fresh && s.s==='confirm';
    return '<div class="page s09">'+QB.demo([['normal','Default'],['hidden','After hide'],['confirm','Show-again confirm']], s.s)+
      '<a class="back" href="#gate-'+x.key+'">'+Q.icon('back','i-sm')+'Back to what leaves your device</a>'+
      '<header class="s08-head rise" style="margin-bottom:var(--s-6)"><h1 class="h1">Edit what is sent</h1><p class="sub">Click any word to hide it. Click a placeholder to show it again.</p></header>'+
      '<div class="s09-grid"><div class="stack">'+text+'</div>'+
      '<aside class="card s09-side" aria-labelledby="s09-h"><div class="card-head" style="margin-bottom:0"><h2 class="h3" id="s09-h">Hidden on this device</h2>'+undo+'</div>'+
        '<div class="s09-count" aria-live="polite"><div><b class="num'+t+'">'+v.count+'</b><span>details replaced</span></div><div><b class="num">'+v.charsLabel+'</b><span>characters sent</span></div></div>'+
        '<hr class="s08-cut" style="margin:var(--s-4) 0 var(--s-2)">'+side+
        '<div class="u2-dock" style="margin-top:var(--s-5)"><a class="btn btn-primary btn-block" href="#gate-'+x.key+'">Done</a></div></aside></div></div>';
  }
  function mountEdit(el, p){
    var x = ctx(p), e = QB.edits(x.key);
    function ask(ph){
      var m = QB.view(x.key).rows.filter(function(r){ return r.ph===ph; })[0]; if(!m) return;
      Q.dialog({ title:'Show \''+m.orig+'\' in the text sent to the AI?', body:'<p>It will be sent as written, in '+m.n+' place'+(m.n>1?'s':'')+'.</p>',
        actions:[{label:'Keep hidden',value:null},{label:'Show it',value:'show',kind:'primary'}], safe:null })
      .then(function(ok){ if(!ok) return;
        if(m.user) e.hidden.splice(e.hidden.indexOf(m.orig),1); else e.shown.push(ph);
        e.undo.push(m.user ? { unhide:m.orig } : { show:ph }); Q.refresh(); });
    }
    el.querySelector('.page').addEventListener('click', function(ev){
      var h = ev.target.closest('[data-hide]'), sh = ev.target.closest('[data-show]'), a = ev.target.closest('[data-act]');
      if(h){ var w = h.dataset.hide; if(e.hidden.indexOf(w)<0){ e.hidden.push(w); e.undo.push({ hide:w }); tick = true; Q.refresh(); } }
      if(sh) ask(sh.dataset.show);
      if(a && a.dataset.act==='undo'){ var u = e.undo.pop();
        if(u.hide) e.hidden.splice(e.hidden.indexOf(u.hide),1);
        if(u.unhide) e.hidden.push(u.unhide);
        if(u.show) e.shown.splice(e.shown.indexOf(u.show),1);
        Q.refresh(); }
    });
    if(askNow) setTimeout(function(){ ask('[CLIENT]'); }, 300);
  }
  Q.screen('gate-edit', { title:'Edit what is sent', rail:false, nav:'', render:renderEdit, mount:mountEdit });
})();
