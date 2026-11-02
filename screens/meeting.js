/* S06 Meeting detail (#meeting-<meetingId>). Record (permission dialog every press), live bar via Q.recording,
   desktop-only Call audio switch (off by default, per meeting), transcribe on device, paste/upload, then start a case. */
(function(){
  'use strict';
  var D = Q.data, B = QD.b, MS = {}, ticker = null, askNow = false;


  function find(id){
    var u = D.meetings.upcoming.filter(function(m){ return m.id===id; })[0];
    if(u) return { m:u, past:false };
    var p = D.meetings.past.filter(function(m){ return m.id===id; })[0];
    return p ? { m:p, past:true } : null;
  }
  function stamp(i){ var s = 12 + i*41; return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0'); }
  function state(id){
    if(MS[id]) return MS[id];
    var tr = D.transcripts[id] || (id==='wei-today' ? null : null), lines = [];
    if(tr) lines = tr.lines.map(function(l){ return tr.labels ? { t:l[1], sp:l[0], s:l[2] } : { t:l[0], s:l[1] }; });
    return MS[id] = { phase: tr ? 'done' : 'before', call:false, callUsed: tr ? tr.labels : false, lines:lines, banner:null };
  }
  function mine(id){ var r = Q.recording.get(); return r && r.meeting===id ? r : null; }

  /* ---------- recording ---------- */
  function startRec(id, call){
    var ms = state(id);
    Q.recording.start({ callAudio: call });
    var r = Q.recording.get(); r.meeting = id;
    ms.phase = 'recording'; ms.callUsed = r.call; ms.lines = []; ms.banner = null;
    feed(id, 2);
    clearInterval(ticker);
    var k = 0;
    ticker = setInterval(function(){ var r = mine(id); if(!r){ clearInterval(ticker); return; } if(!r.paused && ++k%3===0) feed(id, 1); paintLive(id); }, 1000);
  }
  function feed(id, n){
    var ms = state(id);
    var start = ms.lines.length;
    for(var k=0;k<n;k++){ var i = ms.lines.length, l = B.live[i % B.live.length]; ms.lines.push({ t:stamp(i), sp:ms.callUsed ? l[0] : null, s:l[1] }); }
    // Append only the new lines so earlier lines stay solid (no replayed fade).
    var ul = document.querySelector('.s06-tr[data-live="'+id+'"]');
    if(ul){ ul.insertAdjacentHTML('beforeend', lines({ lines:ms.lines.slice(start) }).replace(/<li>/g,'<li class="new">')); var e = document.querySelector('.s06-empty'); if(e) e.remove(); }
  }
  function paintLive(id){
    var r = Q.recording.get(), el = document.querySelector('.s06-live .t'); if(!r || !el) return;
    el.textContent = String(Math.floor(r.secs/60)).padStart(2,'0')+':'+String(r.secs%60).padStart(2,'0');
    var box = document.querySelector('.s06-live'); if(box){ box.classList.toggle('paused', r.paused); box.querySelector('.m').textContent = r.paused ? 'Paused' : recMsg(r); }
    var pb = document.querySelector('.s06 [data-rec="pause"],.s06 [data-rec="resume"]');
    if(pb){ pb.dataset.rec = r.paused ? 'resume' : 'pause'; pb.textContent = r.paused ? 'Resume' : 'Pause'; }
  }
  function recMsg(r){ return r.call ? 'Recording your microphone + call audio' : 'Recording your microphone only · call audio is not recorded'; }

  Q.on('recording-stopped', function(){
    Object.keys(MS).forEach(function(id){ var ms = MS[id]; if(ms.phase!=='recording') return;
      clearInterval(ticker); ms.phase = 'transcribing'; ms.call = false; // call audio resets after every recording
      while(ms.lines.length<6) feed(id, 1);
      if(Q.route().id==='meeting') Q.refresh();
      setTimeout(function(){ if(ms.phase!=='transcribing') return; ms.phase = 'done'; if(location.hash==='#meeting-'+id) Q.refresh(); }, 3200);
    });
  });

  function askRecord(id){
    Q.dialog({ title:'Before you record', body:'<p>You must have the client\'s permission to record this meeting. Do you wish to continue?</p>',
      actions:[{label:'Cancel',value:null},{label:'Continue',value:'go',kind:'primary'}], safe:null })
    .then(function(ok){ if(!ok) return; startRec(id, Q.edition()==='desktop' && state(id).call); Q.refresh(); });
  }

  /* ---------- render ---------- */
  function lines(ms){
    return ms.lines.map(function(l){
      return '<li><span class="ts">'+Q.esc(l.t||'')+'</span>'+(l.sp?'<span class="sp'+(l.sp==='You'?' you':'')+'">'+l.sp+'</span>':'')+'<span>'+Q.esc(l.s)+'</span></li>'; }).join('');
  }
  function recordCard(id, x, ms){
    var desk = Q.edition()==='desktop', r = mine(id);
    var ca = desk
      ? '<div class="s06-ca"><label class="switch"><input type="checkbox" data-act="call"'+(ms.call?' checked':'')+(r?' disabled':'')+'> Call audio · '+(ms.call?'on':'off')+'</label>'+
        '<small>'+(r?'Locked while recording. Stop, then Record again to change it.':'Also record the other side of the call. Resets every meeting.')+'</small></div>'
      : '<p class="s06-hint">Call audio needs the desktop app. <a href="#prefs">Get the desktop app</a></p>';
    // While recording, the pinned bar is the only live control (timer, Pause, Stop). The card only states call audio.
    if(r) return desk ? '<p class="s06-lock rise">'+Q.icon('mic','i-sm')+'Call audio · '+(r.call?'on':'off')+' · locked while recording</p>' : '';
    return '<section class="card hero s06-rec rise" aria-labelledby="rec-h"><div><p class="eyebrow" id="rec-h">Record this meeting</p></div>'+
      '<div class="s06-rec-row"><button class="btn btn-primary s06-recbtn" data-act="record"><span class="dot" aria-hidden="true"></span>Record</button>'+ca+'</div>'+
      '<p class="s06-default">'+Q.icon('mic','i-sm')+(ms.call&&desk?'Records your microphone + call audio.':'Records your microphone only. Call audio is not recorded.')+' Echo cancellation is on.</p></section>';
  }
  function banner(ms){
    var desk = Q.edition()==='desktop';
    if(ms.banner==='mic') return '<div class="banner banner-error" role="alert">'+Q.icon('alert')+'<p>Quotient can\'t use your microphone. Allow it in your '+(desk?'system':'browser')+' settings, then try again.</p><button class="btn-link" data-act="clear">Try again</button></div>';
    if(ms.banner==='upload') return '<div class="banner banner-error" role="alert">'+Q.icon('alert')+'<p>We couldn\'t read that file. Use a .vtt or .txt transcript.</p><button class="btn-link" data-act="upload">Choose another file</button></div>';
    if(ms.banner==='callperm') return '<div class="banner banner-warn" role="alert">'+Q.icon('alert')+'<p>Call audio needs permission.</p><a class="btn btn-sm" href="#prefs">Open settings</a></div>';
    return '';
  }
  function transcript(id, ms){
    var plain = !ms.lines.some(function(l){ return l.sp; });
    if(ms.phase==='transcribing') return '<section class="card rise" aria-busy="true"><h2 class="h3">Writing up the transcript on this device…</h2>'+
      '<p class="small muted">You can leave this screen. We\'ll keep going.</p><div class="s06-prog"><i></i></div></section>';
    var live = ms.phase==='recording';
    var head = '<div class="s06-tr-head"><div><h2 class="h3">'+(live?'Live transcript':'Transcript')+'</h2><p class="small muted">'+
      (live?'Writing on this device as you talk':!ms.lines.length?'Nothing recorded yet':(plain?'Microphone only · one transcript':'You and Client · call audio was on'))+'</p></div>'+
      (ms.phase==='done'?'<label class="s06-search"><span class="sr">Search the transcript</span>'+Q.icon('search','i-sm')+'<input class="input" type="search" data-act="search" placeholder="Search"></label>':'')+'</div>';
    var body = ms.lines.length ? '' : '<p class="s06-empty">Notes will appear here after you record or paste them.</p>';
    var notes = ms.phase==='done' ? '<div class="field" style="margin-top:var(--s-5)"><label class="label" for="yn">Your notes</label><textarea class="textarea" id="yn" rows="3" placeholder="Points you want to remember"></textarea></div>' : '';
    return '<section class="card rise">'+head+body+'<ul class="s06-tr'+(plain?' plain':'')+'" data-live="'+id+'">'+lines(ms)+'</ul><p class="s06-empty" data-none hidden>No lines match.</p>'+notes+'</section>';
  }
  function cta(x){
    var c = x.m.c ? D.cases[x.m.c] : null, h, btn;
    if(c && !Object.keys(c.tables).length){ h = 'Next: add the plans you\'re comparing'; btn = '<a class="btn btn-primary" href="#new-case-'+x.m.c+'">'+Q.icon('plus')+'Add plans to case #'+c.no+'</a>'; }
    else if(c){ h = 'Add these notes to '+c.first+'\'s case'; btn = '<button class="btn btn-primary" data-act="add">Add to case #'+c.no+'</button>'; }
    else { h = 'Start a case from these notes'; btn = '<a class="btn btn-primary" href="#new-case">'+Q.icon('plus')+'Start case from these notes</a>'; }
    return '<section class="card s06-cta rise"><div><h2>'+Q.esc(h)+'</h2><p class="small muted">The transcript stays on this device.</p></div>'+btn+'</section>';
  }
  function side(){
    return '<aside class="card s06-side stack rise" style="gap:var(--s-3)" aria-labelledby="ow-h"><h2 class="h3" id="ow-h">Other ways in</h2>'+
      '<button class="btn btn-secondary btn-block" data-act="paste">'+Q.icon('file','i-sm')+'Paste notes</button>'+
      '<button class="btn btn-secondary btn-block" data-act="upload">'+Q.icon('share','i-sm')+'Upload transcript file</button><p class="hint">Zoom or Teams transcript, .vtt or .txt</p>'+
      '<input type="file" accept=".vtt,.txt" hidden data-file>'+
      '<p class="device-line small">'+Q.icon('device','i-sm')+'Recordings and transcripts stay on this device.</p></aside>';
  }

  var STATES = [['before','Upcoming'],['dialog','Permission dialog'],['recording','Recording'],['call','Recording + call audio'],['paused','Paused'],['transcribing','Transcribing'],['done','Done'],['mic','Mic blocked'],['upload','Upload error'],['callperm','Call audio permission']];
  function current(id, ms){
    var r = mine(id);
    if(r) return r.paused ? 'paused' : r.call ? 'call' : 'recording';
    if(ms.banner) return ms.banner;
    return ms.phase;
  }
  function apply(id, s){
    var ms = state(id), r = mine(id);
    if(r && ['recording','call','paused'].indexOf(s)<0){ ms.phase = 'idle'; Q.recording.stop(); }
    ms.banner = null;
    if(s==='before' || s==='dialog'){ ms.phase = 'before'; ms.lines = []; askNow = s==='dialog'; }
    if(s==='mic' || s==='upload' || s==='callperm'){ ms.phase = 'before'; ms.lines = []; ms.banner = s; }
    if(s==='recording' || s==='call' || s==='paused'){
      var wantCall = s==='call' && Q.edition()==='desktop';
      if(!r || r.call!==wantCall){ if(r){ ms.phase='idle'; Q.recording.stop(); } ms.call = wantCall; startRec(id, wantCall); feed(id, 2); }
      if(s==='paused') Q.recording.pause(); else Q.recording.resume();
    }
    if(s==='transcribing'){ ms.phase = 'transcribing'; if(!ms.lines.length) feed(id, 6);
      setTimeout(function(){ if(ms.phase==='transcribing'){ ms.phase='done'; if(location.hash==='#meeting-'+id) Q.refresh(); } }, 3200); }
    if(s==='done'){ ms.phase = 'done'; if(!ms.lines.length){ ms.callUsed = false; feed(id, 6); } }
  }
  QB.onState.meeting = function(s){ var r = Q.route(); apply(r.arg, s); };

  function render(p){
    var x = find(p.arg) || find('wei-today'), id = x.m.id, ms = state(id);
    var s = QB.local('meeting', STATES.map(function(z){ return z[0]; }), 'none', p);
    if(s.fresh && s.s!=='none') apply(id, s.s);
    var c = x.m.c ? D.cases[x.m.c] : null;
    var when = x.past ? x.m.date+' '+x.m.time : x.m.day+' '+x.m.time;
    var states = STATES.filter(function(z){ return Q.edition()==='desktop' || (z[0]!=='call' && z[0]!=='callperm'); });
    var head = '<a class="back" href="#meetings">'+Q.icon('back','i-sm')+'Back to Meetings</a>'+
      '<header class="page-head rise"><div><h1 class="h1">'+Q.esc(x.m.who)+' · '+Q.esc(when)+'</h1>'+
      '<p class="sub">'+Q.esc(x.m.app)+(c?'<span class="dot-sep"></span><a href="#case-'+x.m.c+'">Case #'+c.no+'</a>':'<span class="dot-sep"></span>No case yet')+
      (!x.past?'<span class="dot-sep s06-rdot"></span><label class="switch s06-remind" title="We\'ll remind you before it starts. You still press Record."><input type="checkbox" data-act="notes"'+(x.m.notes?' checked':'')+'> Remind me 10 min before</label>':'')+'</p></div></header>';
    var main = (ms.phase==='done' ? cta(x) : '') + banner(ms) +
      (ms.phase==='before' || ms.phase==='recording' || ms.phase==='idle' ? recordCard(id, x, ms) : '') + transcript(id, ms);
    return '<div class="page s06">'+QB.demo(states, current(id, ms))+head+'<div class="s06-grid"><div class="stack">'+main+'</div>'+side()+'</div></div>';
  }

  function mount(el, p){
    var x = find(p.arg) || find('wei-today'), id = x.m.id, ms = state(id), pg = el.querySelector('.page');
    if(ms.phase==='idle') ms.phase = 'before';
    paintLive(id);
    pg.addEventListener('click', function(e){
      var a = e.target.closest('[data-act]'); if(!a) return;
      var act = a.dataset.act;
      if(act==='record') askRecord(id);
      if(act==='clear'){ ms.banner = null; Q.refresh(); }
      if(act==='paste') Q.sheet({ title:'Paste notes', body:'<p class="small muted">For '+Q.esc(x.m.who)+'. Notes stay on this device.</p><div class="field"><label class="label" for="pn">Notes or transcript</label><textarea class="textarea" id="pn" rows="12"></textarea></div>',
        foot:'<button class="btn btn-primary" data-save>Add notes</button><button class="btn btn-ghost" data-close>Cancel</button>',
        mount:function(sh){ var t = sh.querySelector('#pn'); t.focus();
          sh.querySelector('[data-save]').addEventListener('click', function(){
            var ls = t.value.split(/\n+/).map(function(z){ return z.trim(); }).filter(Boolean);
            if(!ls.length){ t.setAttribute('aria-invalid','true'); return; }
            ms.lines = ls.map(function(z){ return { t:'', s:z }; }); ms.phase = 'done'; ms.banner = null; Q.closeSheet(); Q.refresh(); Q.toast('Notes added'); }); } });
      if(act==='upload') pg.querySelector('[data-file]').click();
      if(act==='add'){ Q.toast('Notes added to case #'+D.cases[x.m.c].no); Q.go('#case-'+x.m.c); }
    });
    pg.addEventListener('change', function(e){
      var a = e.target.closest('[data-act],[data-file]'); if(!a) return;
      if(a.dataset.act==='call'){ ms.call = a.checked; Q.refresh(); }
      if(a.dataset.act==='notes'){ x.m.notes = a.checked; Q.toast(a.checked ? 'We\'ll remind you at '+QB.remindAt(x.m.time) : 'No reminder for this meeting'); }
      if(a.hasAttribute('data-file')){ var f = a.files[0]; if(!f) return;
        if(!/\.(vtt|txt)$/i.test(f.name)){ ms.banner = 'upload'; Q.refresh(); return; }
        var rd = new FileReader();
        rd.onload = function(){ var ls = String(rd.result).split(/\r?\n/).map(function(z){ return z.trim(); })
            .filter(function(z){ return z && z!=='WEBVTT' && z.indexOf('-->')<0 && !/^\d+$/.test(z); }).slice(0,60);
          if(!ls.length){ ms.banner = 'upload'; Q.refresh(); return; }
          ms.lines = ls.map(function(z){ return { t:'', s:z }; }); ms.phase = 'done'; ms.banner = null; Q.refresh(); Q.toast('Transcript added'); };
        rd.onerror = function(){ ms.banner = 'upload'; Q.refresh(); };
        rd.readAsText(f); }
    });
    var q = pg.querySelector('[data-act="search"]');
    if(q) q.addEventListener('input', function(){ var v = q.value.toLowerCase(), n = 0;
      pg.querySelectorAll('.s06-tr li').forEach(function(li){ var hit = li.textContent.toLowerCase().indexOf(v)>=0; li.hidden = !hit; if(hit) n++; });
      pg.querySelector('[data-none]').hidden = n>0; });
    if(askNow){ askNow = false; setTimeout(function(){ askRecord(id); }, 250); }
  }

  Q.screen('meeting', { title:function(p){ var x = find(p.arg); return x ? x.m.who+' meeting' : 'Meeting'; }, nav:'meetings', render:render, mount:mount });
})();
