/* S05 Meetings (#meetings). Live / upcoming / past. Notes switch = reminder only, never records by itself. */
(function(){
  'use strict';
  var D = Q.data, M = D.meetings;
  var APPICON = { 'Google Meet':'video', Zoom:'video', Teams:'video', 'In person':'meetings' };


  function app(a){ return '<span class="s05-app">'+Q.icon(APPICON[a]||'video','i-sm')+Q.esc(a)+'</span>'; }

  function upcoming(){
    var day = null, out = '';
    M.upcoming.forEach(function(m){
      if(m.day!==day){ day = m.day; out += '<h3 class="s05-day">'+Q.esc(day)+'</h3>'; }
      var c = m.c ? D.cases[m.c] : null;
      out += '<div class="s05-row'+(m.internal?' muted-row':'')+'">'+
        '<span class="s05-t">'+m.time+'<small>to '+m.end+'</small></span>'+
        '<span class="s05-who">'+(m.internal ? Q.esc(m.who)+'<small class="small muted" style="display:block">Not a client meeting</small>' : '<a href="#meeting-'+m.id+'">'+Q.esc(m.who)+'</a>')+'</span>'+
        app(m.app)+'<span class="case-no">'+(c?'#'+c.no:'')+'</span>'+
        '<label class="switch" title="We\'ll remind you before it starts. You still press Record."><input type="checkbox" data-notes="'+m.id+'"'+(m.notes?' checked':'')+'> <span>Take notes</span></label></div>';
    });
    return '<section class="card s05-sec rise" aria-labelledby="up-h"><div class="card-head"><h2 class="h3" id="up-h">Upcoming</h2><span class="small muted">Notes on means a reminder 10 minutes before. You still press Record.</span></div>'+out+'</section>';
  }

  function past(){
    return '<section class="card s05-sec rise" aria-labelledby="past-h"><div class="card-head"><h2 class="h3" id="past-h">Past</h2></div>'+M.past.map(function(m){
      var c = m.c ? D.cases[m.c] : null;
      return '<div class="s05-row s05-past"><span class="s05-t">'+m.date+'<small>'+m.time+'</small></span>'+
        '<span class="s05-who"><a href="#meeting-'+m.id+'">'+Q.esc(m.who)+'</a></span>'+
        '<span class="stat">'+(m.notesReady?'<span class="chip chip-device">'+Q.icon('check','i-sm')+'Notes ready</span>':'<span class="chip">No notes</span>')+'</span>'+
        '<span class="small">'+(c?'<a href="#case-'+m.c+'">Case #'+c.no+'</a>':'<span class="muted">No case yet</span>')+'</span>'+
        '<a class="btn btn-secondary btn-sm open" href="#meeting-'+m.id+'">Open</a></div>'; }).join('')+'</section>';
  }

  function live(isLive){
    var r = Q.recording.get(), m = M.upcoming[0], c = D.cases[m.c];
    if(!isLive && !r) return '';
    var on = !!r;
    return '<section class="card hero s05-live rise" aria-labelledby="live-h"><span class="s05-pulse'+(on?'':' off')+'" aria-hidden="true"></span>'+
      '<div class="who"><p class="eyebrow">Live now</p><h2 id="live-h">'+Q.esc(m.who)+'</h2><p class="meta">'+m.time+' to '+m.end+'<span class="dot-sep"></span>'+m.app+'<span class="dot-sep"></span>Case #'+c.no+'</p></div>'+
      '<span class="chip '+(on?'chip-device':'')+'">'+(on?'Recording':'Not recording')+'</span>'+
      '<a class="btn btn-primary" href="#meeting-'+m.id+'">Open meeting'+Q.icon('arrow','i-sm')+'</a></section>';
  }

  function note(){
    var m = M.upcoming[0];
    return '<div class="s05-note" role="alertdialog" aria-label="Reminder"><div class="top"><span class="wordmark">Quotient</span><span>now</span></div>'+
      '<p>'+Q.esc(m.who)+' at '+m.time+' · Take notes?</p>'+
      '<div class="acts"><a class="btn btn-secondary btn-sm" href="#meeting-'+m.id+'">Open</a><button class="btn btn-ghost btn-sm" data-act="dismiss">Not this one</button></div></div>';
  }

  function render(p){
    var s = QB.local('meetings', ['normal','live','reminder','empty','week','error','loading'], 'normal', p);
    var demo = QB.demo([['normal','Week'],['live','Live now'],['reminder','Reminder'],['empty','No calendar'],['week','Empty week'],['error','Sync error'],['loading','Loading']], s.s);
    var head = '<header class="page-head rise"><div><h1 class="h1">Meetings</h1>'+
      (s.s==='empty' ? '' : '<p class="sync">'+(s.s==='error'?'':'<span class="ok" aria-hidden="true"></span>')+Q.esc(s.s==='error'?'Google Calendar · last synced 10:02':M.sync)+'</p>')+'</div>'+
      '<button class="btn btn-secondary" data-act="paste">'+Q.icon('file','i-sm')+'Paste notes</button></header>';
    var body;
    if(s.s==='empty') body = '<div class="empty rise"><h2>Connect your calendar to see your meetings here.</h2><p>Google or Microsoft. Quotient only reads the time, title and link.</p><a class="btn btn-primary" href="#welcome-1">Connect calendar</a></div>';
    else if(s.s==='week') body = '<div class="empty rise"><h2>No meetings this week.</h2><p>New meetings show up here as soon as they are on your calendar.</p></div>'+past();
    else if(s.s==='loading') body = '<div class="card" aria-busy="true">'+[1,2,3,4].map(function(){ return '<div class="skel-row"><span class="skel" style="width:8%"></span><span class="skel" style="width:30%"></span><span class="skel" style="width:14%"></span><span class="skel" style="width:12%"></span></div>'; }).join('')+'</div>';
    else body = (s.s==='error' ? '<div class="banner banner-error rise" role="alert">'+Q.icon('alert')+'<p>Couldn\'t sync. Showing meetings from 10:02.</p><button class="btn-link" data-act="retry">Try again</button></div>' : '')+
      live(s.s==='live')+upcoming()+past();
    return '<div class="page s05">'+demo+head+'<div class="stack">'+body+'</div>'+(s.s==='reminder'?note():'')+'</div>';
  }

  function mount(el){
    var pg = el.querySelector('.page');
    pg.addEventListener('change', function(e){
      var i = e.target.closest('[data-notes]'); if(!i) return;
      var m = M.upcoming.filter(function(x){ return x.id===i.dataset.notes; })[0]; m.notes = i.checked;
      Q.toast(i.checked ? 'We\'ll remind you at '+QB.remindAt(m.time) : 'No reminder for this meeting');
    });
    pg.addEventListener('click', function(e){
      var a = e.target.closest('[data-act]'); if(!a) return;
      if(a.dataset.act==='dismiss'){ var n = pg.querySelector('.s05-note'); if(n) n.remove(); Q.toast('No reminder for this meeting'); }
      if(a.dataset.act==='retry'){ QB.local('meetings',[],'normal',{}).s = 'normal'; Q.refresh(); Q.toast('Calendar synced'); }
      if(a.dataset.act==='paste') pasteSheet();
    });
  }

  function pasteSheet(){
    Q.sheet({ title:'Paste notes', body:'<p class="small muted">For a meeting that is not on your calendar. Notes stay on this device.</p>'+
      '<div class="field"><label class="label" for="pn-who">Client name</label><input class="input" id="pn-who" autocomplete="off"></div>'+
      '<div class="field"><label class="label" for="pn-txt">Notes or transcript</label><textarea class="textarea" id="pn-txt" rows="10"></textarea></div>',
      foot:'<button class="btn btn-primary" data-act="save">Save notes</button><button class="btn btn-ghost" data-close>Cancel</button>',
      mount:function(sh){ sh.querySelector('#pn-who').focus();
        sh.querySelector('[data-act="save"]').addEventListener('click', function(){ Q.closeSheet(); Q.toast('Notes saved on this device'); }); } });
  }
  QD.b.pasteSheet = pasteSheet;

  Q.screen('meetings', { title:'Meetings', nav:'meetings', render:render, mount:mount });
})();
