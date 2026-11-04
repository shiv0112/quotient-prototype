/* S10 Processing (#processing-<case>). Focus mode. Steps tick in order; names go back in on the device at step 4. */
(function(){
  'use strict';
  var D = Q.data, B = QD.b, run = null;


  function ctx(p){ var key = D.cases[p.parts[0]] && QB.feature(p.parts[0]) ? p.parts[0] : 'wei'; var f = QB.feature(key); return { key:key, c:D.cases[key], f:f, fl:B.flow[f] }; }

  function liftLine(x, back){
    var name = x.c.first;
    return Q.esc(x.fl.lift).replace(/\[CLIENT\]/g, back ? '<b class="s10-name">'+Q.esc(name)+'</b>' : '<span class="s10-nm" data-name="'+Q.esc(name)+'"><span class="ph">[CLIENT]</span></span>');
  }

  function render(p){
    var x = ctx(p), v = QB.view(x.key), nothing = /^compare/.test(x.f) && B.nothing;
    var s = QB.local('processing', ['running','done','error','offline'], 'running', p);
    var at = s.s==='done' ? 99 : s.s==='error' ? 3 : s.s==='offline' ? 1 : (run && run.hash===location.hash ? run.at : 0);
    var steps = x.fl.steps.map(function(t,i){
      var cls = i<at ? 'ok' : i===at ? (s.s==='error'||s.s==='offline' ? 'halt' : 'now') : '';
      var label = t.replace('{n}', v.charsLabel), right = '';
      if(i===1 && nothing){ cls = 'skip'; label = 'Nothing sent'; }
      if(i===1 && !nothing) right = '<a class="small" href="#sent-'+x.key+'">See exact text</a>';
      else if(/on this device/.test(t)) right = '<span class="chip chip-device">'+Q.icon('device','i-sm')+'On device</span>';
      return '<li class="'+cls+'" data-i="'+i+'"><span class="s10-dot">'+Q.icon('check')+'</span><span>'+Q.esc(label)+'</span>'+right+'</li>'; }).join('');
    var top = s.s==='error'
      ? '<div class="banner banner-error" role="alert">'+Q.icon('alert')+'<p>Something went wrong after sending. Nothing else was sent.</p><button class="btn-link" data-act="retry">Try again</button></div>'
      : s.s==='offline' ? '<div class="banner banner-info" role="status">'+Q.icon('info')+'<p>You\'re offline. We\'ll continue when you\'re back.</p></div>' : '';
    var done = s.s==='done' || at>=x.fl.steps.length;
    var title = done ? 'Done' : x.fl.title;
    var lift = (at<3 || s.s==='error' || s.s==='offline') ? '' : '<div class="s10-lift" aria-live="polite"><span class="eyebrow">Answer back · names going in on this device</span><p>'+liftLine(x, at>=4)+'</p></div>';
    var foot = done ? '<div class="u2-dock"><a class="btn btn-primary" href="'+x.fl.done+'">'+Q.esc(x.fl.doneBtn)+'</a></div>'
      : '<a class="btn-link" href="'+x.fl.back+'">Cancel</a>';
    return '<div class="page s10">'+QB.demo([['running','Running'],['done','Done'],['error','Error'],['offline','Offline']], s.s)+
      '<header class="s10-head rise"><p class="eyebrow">'+Q.esc(x.c.name)+' · Case #'+x.c.no+'</p><h1 class="h1" aria-live="polite">'+Q.esc(title)+'</h1>'+
      '<p class="sub">'+(done?'Everything is back on this device.':'This takes a few seconds. You can leave this screen.')+'</p></header>'+
      (top?'<div style="margin-bottom:var(--s-5)">'+top+'</div>':'')+
      '<section class="card card-flush rise"><ol class="s10-steps" aria-label="Progress">'+steps+'</ol></section>'+lift+
      '<div class="s10-foot"><p class="s10-safe">'+Q.icon('device','i-sm')+'Your PDFs and notes are safe on this device.</p>'+foot+'</div></div>';
  }

  // Daniel's plans become a real comparison once the run is done, so the case, Today and Cases move on.
  function finish(x){ var c = x.c; if(c.pending && !Object.keys(c.tables).length){ c.tables = c.pending; delete c.pending; c.now = 1; c.dates.compared = D.today.date; Q.save(); } }

  function mount(el, p){
    var x = ctx(p), s = QB.local('processing', ['running','done','error','offline'], 'running', p);
    if(s.s==='done' || (run && run.hash===location.hash && run.at>=x.fl.steps.length)) finish(x);
    el.querySelector('.page').addEventListener('click', function(e){ var a = e.target.closest('[data-act="retry"]'); if(a){ s.s = 'running'; run = null; Q.refresh(); } });
    if(s.s!=='running') return;
    if(!run || run.hash!==location.hash) startRun(x);
  }

  function backIn(el, delay){
    el.querySelectorAll('.s10-nm').forEach(function(n,i){ setTimeout(function(){ n.classList.add('out');
      setTimeout(function(){ if(document.contains(n)) n.outerHTML = '<b class="s10-name in">'+Q.esc(n.dataset.name)+'</b>'; }, 200); }, delay + i*160); });
  }

  // Each tick re-renders; checks the hash so leaving the screen stops the run.
  function startRun(x){
    var hash = location.hash, n = x.fl.steps.length;
    run = { hash:hash, at:0 };
    var wait = [900, 1100, 1300, 1200, 1000];
    (function next(){
      setTimeout(function(){
        if(location.hash!==hash || !run || run.hash!==hash) return;
        run.at++; Q.refresh();
        var el = document.getElementById('screen');
        if(run.at===3) backIn(el, 500);
        if(run.at<n) return next();
        var st = QB.local('processing', ['running','done','error','offline'], 'running', { state:'' });
        if(st.s==='running') setTimeout(function(){ if(location.hash===hash){ run = null; finish(x); Q.go(x.fl.done); if(/^compare/.test(x.f)) Q.toast('Comparison ready'); } }, 1400);
      }, wait[run.at] || 1000);
    })();
  }

  Q.screen('processing', { title:function(p){ return ctx(p).fl.title; }, rail:false, nav:'', render:render, mount:mount });
})();
