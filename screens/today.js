/* S04 Today (#today) = the case board (docs/design/UPDATE-2.md B). One card per client:
   who · their worry · where (6 dots) · one next step · when. Tabs: Needs you · In progress · Won. */
(function(){
  'use strict';
  var D = Q.data, tab = 'needs';
  var DOT = [0,1,2,2,3,4,4,5]; // D.steps index -> board dot (met, compared, shared, chosen, write-up, won)
  var AV = [2,0,1,3]; // avatar tint by case order: Wei green, Priya coral, Alvin blue (as in the mock)
  var DOTS = ['Met','Compared','Shared','Chosen','Write-up','Won'];
  var SVG = { // small icons not in Q.icon
    heart:'<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
    moon:'<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
    chat:'<path d="M4 20l1.3-3.9A8 8 0 1 1 8 19z"/>' };
  function svg(n){ return '<svg class="i i-sm" viewBox="0 0 24 24" aria-hidden="true">'+SVG[n]+'</svg>'; }

  // Saved session state from before Update 2 lacks the people fields: fill them from data.js.
  function backfill(){ Object.keys(D.caseExtra||{}).forEach(function(k){ var c = D.cases[k], x = D.caseExtra[k]; if(c) Object.keys(x).forEach(function(f){ if(c[f]==null) c[f] = x[f]; }); }); }

  function initials(n){ return n.split(' ').map(function(w){ return w[0]; }).slice(0,2).join(''); }
  function mins(t){ var a = String(t).split(':'); return +a[0]*60 + +(a[1]||0); }
  function meetingFor(k){ return D.meetings.upcoming.filter(function(m){ return m.c===k && !m.internal; })[0]; }

  function where(k){
    var c = D.cases[k], n;
    if(c.result==='won') return 'Won';
    if(c.result==='lost') return 'Closed';
    switch(c.now){
      case 0: return 'No plans yet';
      case 1: n = Q.toCheck(k).length; return n ? n+' to check' : 'Ready to share';
      case 2: return c.quiet ? 'Quiet' : c.nudged ? 'Nudge sent' : (c.quietDays||0) >= D.adviser.waitDays ? c.quietDays+' quiet days' : 'Shared';
      case 3: return 'Replied';
      case 4: return c.shareSent ? 'v2 shared' : 'v2 ready';
      case 5: n = Q.writeupProgress(k); return n.done+' of '+n.total+' done';
      case 6: n = Q.masProgress(k); n = n.total - n.done; return n ? n+' check'+(n>1?'s':'')+' left' : 'Checks done';
    }
    return '';
  }

  function dots(k){
    var c = D.cases[k], cur = c.result==='lost' ? DOT[c.lostAt||0] : DOT[c.now] || 0, won = c.result==='won';
    var html = DOTS.map(function(l, i){
      var s = won || i < cur ? 'done' : i===cur && !c.result ? 'now' : c.result==='lost' && i===cur ? 'done' : '';
      return '<i class="'+s+'"></i>'; }).join('');
    return '<span class="bd-dots" role="img" aria-label="Step '+(cur+1)+' of 6: '+DOTS[cur]+'">'+html+'</span>';
  }

  function action(k){
    var c = D.cases[k], st = Q.status(k), label = st.btn, cls = 'btn-secondary';
    if(label==='Continue') label = 'Finish write-up';
    else if(label==='Add plans') label = 'Add illustrations';
    else if(c.now===6 && !c.result && st.go.indexOf('#mas')===0) label = 'Firm review';
    if(label==='Nudge') cls = 'btn-wa';
    else if(label==='Check') cls = 'btn-primary'; // numbers must be confirmed first: the one coral action
    return '<a class="btn btn-sm '+cls+' bd-act" href="'+st.go+'" aria-label="'+Q.esc(label+' · '+c.name)+'">'+(label==='Nudge'?svg('chat'):'')+Q.esc(label)+'</a>';
  }

  /* Labelled "when" chip: the next calendar meeting wins; else the rep's timing note (the note also shows on the nudge screen). */
  function when(k){
    var c = D.cases[k], m = meetingFor(k);
    if(c.result) return c.dates && c.dates.closed ? '<span class="bd-when plain">'+Q.esc(c.dates.closed.replace(/^\w+ /,''))+'</span>' : '';
    if(m) return '<span class="bd-when">'+Q.icon('meetings','i-sm')+'<span class="num">'+(m.day==='Today' ? 'Today '+m.time+' meeting' : 'Meeting '+Q.esc((m.date||m.day).split(' ')[0])+' '+m.time)+'</span></span>';
    if(c.timing) return '<span class="bd-when" title="Your note">'+svg('moon')+'Prefers '+Q.esc(c.timing.toLowerCase())+'</span>';
    return '';
  }

  /* Worry with its source (UPDATE-2 2b). Suggested by the privacy-gated AI after a meeting; never shown as fact until kept. */
  function worry(k){
    var c = D.cases[k], w = c.worry;
    if(c.result) return '';
    if(!w || !w.text) return '<button class="btn-link bd-addw" type="button" data-worry-edit="'+k+'">'+Q.icon('plus','i-sm')+'Add their main worry</button>';
    var date = String(w.from||'').split(' · ')[0], ts = String(w.from||'').split(' · ')[1], src = Q.meetingById(w.meeting);
    var link = src ? '<a href="#meeting-'+w.meeting+(ts?'@'+ts:'')+'">'+(src.m.kind==='notes' ? 'From your notes' : 'From your meeting')+' · '+Q.esc(date)+'</a>' : 'From your notes';
    return '<div class="bd-worry'+(w.kept?'':' sugg')+'">'+
      '<span class="bd-wl">'+svg('heart')+'Worried about</span>'+
      '<p class="bd-wt">'+Q.esc(w.text)+'</p>'+
      '<p class="bd-src">'+(w.kept ? link :
        'Suggested from notes<span class="dot-sep"></span><button type="button" class="btn-link" data-worry-keep="'+k+'" aria-label="Keep worry for '+Q.esc(c.first)+'">Keep</button>'+
        '<span class="dot-sep"></span><button type="button" class="btn-link" data-worry-edit="'+k+'" aria-label="Edit worry for '+Q.esc(c.first)+'">Edit</button>')+'</p></div>';
  }

  function editWorry(k){
    var c = D.cases[k], w = c.worry || {}, ts = String(w.from||'').split(' · ');
    Q.sheet({ title: w.text ? 'Their main worry' : 'Add their main worry',
      body:'<div class="field"><label class="label" for="bd-w">What worries '+Q.esc(c.first)+' most</label>'+
        '<input class="input" id="bd-w" maxlength="80" value="'+Q.esc(w.text||'')+'" placeholder="In their words, one short line">'+
        '<p class="hint">Your nudge and write-up use it once you save.</p></div>'+
        (w.quote ? '<figure class="bd-quote"><blockquote>"'+Q.esc(w.quote)+'"</blockquote><figcaption>'+
          (Q.meetingById(w.meeting) ? '<a href="#meeting-'+w.meeting+(ts[1]?'@'+ts[1]:'')+'">From your meeting · '+Q.esc(ts[0])+(ts[1]?' at '+ts[1]:'')+'</a>' : 'From your notes')+'</figcaption></figure>' : ''),
      foot:'<button class="btn btn-ghost" type="button" data-close>Cancel</button><button class="btn btn-primary" type="button" data-save>Save</button>',
      mount:function(s){
        var inp = s.querySelector('#bd-w');
        function save(){
          var t = inp.value.trim();
          if(t){ c.worry = Object.assign({}, c.worry, { text:t, kept:true }); if(!c.worry.from) c.worry.from = D.today.date; }
          else c.worry = { text:'', kept:false }; // not null: backfill() would restore the old one
          Q.closeSheet(); Q.refresh(); Q.toast(t ? 'Worry saved' : 'Worry removed');
        }
        s.querySelector('[data-save]').addEventListener('click', save);
        inp.addEventListener('keydown', function(e){ if(e.key==='Enter') save(); });
        setTimeout(function(){ inp.focus(); }, 0);
      } });
  }

  function card(k){
    var c = D.cases[k];
    return '<li class="bd-card'+(c.result?' closed':'')+'">'+
      '<div class="bd-top">'+
        '<span class="bd-av av'+AV[D.caseOrder.indexOf(k)%4]+'" aria-hidden="true">'+initials(c.name)+'</span>'+
        '<div class="bd-who"><a class="bd-name" href="#case-'+k+'">'+Q.esc(c.name)+'</a>'+
          '<span class="bd-line"><span class="num">#'+c.no+'</span>'+(c.line?' · '+Q.esc(c.line):'')+'</span>'+when(k)+'</div>'+
      '</div>'+
      worry(k)+
      (c.selected ? '<div class="bd-tags"><span class="chip chip-outline">Selected Client</span></div>' : '')+
      '<div class="bd-foot">'+dots(k)+'<span class="bd-where">'+Q.esc(where(k))+'</span>'+(c.result?'':action(k))+'</div>'+
    '</li>';
  }

  function list(keys){ return '<ul class="bd-list">'+keys.map(function(k){ return card(k); }).join('')+'</ul>'; }

  function groups(){
    var needs = Q.needs(), won = [], lost = [], prog = [];
    D.caseOrder.forEach(function(k){ var c = D.cases[k];
      if(c.result==='won') won.push(k); else if(c.result==='lost') lost.push(k); else if(needs.indexOf(k)<0) prog.push(k); });
    return { needs:needs, prog:prog, won:won, lost:lost };
  }

  function meetLine(){ // only when a client meeting starts within 2 hours of the demo clock
    var now = (D.today.hour||9)*60, m = D.meetings.upcoming.filter(function(x){
      var d = mins(x.time) - now; return x.day==='Today' && !x.internal && d>=0 && d<=120; })[0];
    if(!m) return '';
    var d = mins(m.time) - now, inT = d < 60 ? 'in '+d+' min' : 'in '+Math.round(d/60)+' hr';
    return '<div class="bd-meet"><div class="bd-meet-txt"><span class="eyebrow">Next meeting · '+inT+'</span>'+
      '<span class="bd-meet-row">'+Q.icon('video','i-sm')+'<span><b>'+Q.esc(m.who)+'</b> at <span class="num">'+m.time+'</span> · '+Q.esc(m.app)+'</span></span></div>'+
      '<a href="#meeting-'+m.id+'">Open meeting'+Q.icon('arrow','i-sm')+'</a></div>';
  }

  function head(n){
    return '<header class="today-head bd-head tiled">'+
      '<div><p class="eyebrow">'+D.today.long+'</p>'+
      '<h1 class="h1 display">Morning, '+Q.esc(D.adviser.first)+'</h1>'+
      (n==null?'':'<p class="lede">'+(n ? n+' client'+(n===1?' needs':'s need')+' you today' : 'No one needs you right now')+'</p>')+
      '</div>'+
      '<a class="btn btn-secondary bd-new" href="#new-case">'+Q.icon('plus')+'New case</a>'+
    '</header>';
  }


  function tabs(g){
    function t(id, label, n){ return '<button class="chip" type="button" data-tab="'+id+'" aria-pressed="'+(tab===id)+'" aria-controls="bd-'+id+'">'+label+' <span class="num">'+n+'</span></button>'; }
    return '<div class="bd-tabs" role="group" aria-label="Show cases">'+t('needs','Needs you',g.needs.length)+t('prog','In progress',g.prog.length)+t('won','Won',g.won.length)+'</div>';
  }

  function panel(id, body){ return '<section class="bd-panel" id="bd-'+id+'"'+(tab===id?'':' hidden')+'>'+body+'</section>'; }
  function none(t){ return '<p class="bd-none">'+t+'</p>'; }

  Q.screen('today', {
    title:'Today', nav:'today',
    render:function(p){
      backfill();
      if(/^(needs|prog|won)$/.test(p.arg)) tab = p.arg; // deep link #today-won
      if(p.state==='empty') return '<div class="page bd">'+head(null)+
        '<div class="empty"><h2>Nothing needs you yet</h2><p>Your next meeting will show here. You can also start a case from PDFs.</p>'+
        '<a class="btn btn-primary" href="#new-case">'+Q.icon('plus')+'New case</a><a href="#welcome-4">Connect your calendar</a></div></div>';
      if(p.state==='loading') return '<div class="page bd">'+head(null)+'<ul class="bd-list" aria-busy="true">'+[1,2,3,4].map(function(){
        return '<li class="bd-card"><div class="bd-top"><span class="bd-av skel"></span><div class="bd-who"><span class="skel" style="width:50%"></span><span class="skel" style="width:35%;margin-top:8px"></span></div></div>'+
          '<span class="skel" style="width:70%"></span><span class="skel" style="width:40%;margin-top:14px"></span></li>'; }).join('')+'</ul></div>';
      var g = groups(), top = p.state==='error'
        ? '<div class="banner banner-error" role="alert">'+Q.icon('alert')+'<p>Calendar didn\'t sync. Your cases are still here.</p><button class="btn-link" data-toast="Calendar synced">Try again</button></div>'
        : meetLine();
      return '<div class="page bd">'+head(g.needs.length)+top+tabs(g)+
        panel('needs', g.needs.length ? list(g.needs) : none('Nothing needs you right now.'))+
        panel('prog', g.prog.length ? list(g.prog) : none('No other open cases.'))+
        panel('won', (g.won.length ? list(g.won) : none('No won cases yet.'))+
          (g.lost.length ? '<h2 class="bd-sub">Closed</h2>'+list(g.lost) : ''))+'</div>';
    },
    mount:function(el){
      var page = el.querySelector('.page');
      page.addEventListener('click', function(e){
        var wk = e.target.closest('[data-worry-keep]');
        if(wk){ D.cases[wk.dataset.worryKeep].worry.kept = true; Q.refresh(); Q.toast('Worry kept'); return; }
        var we = e.target.closest('[data-worry-edit]'); if(we){ editWorry(we.dataset.worryEdit); return; }
        var b = e.target.closest('[data-tab]'); if(!b) return;
        tab = b.dataset.tab;
        page.querySelectorAll('[data-tab]').forEach(function(x){ x.setAttribute('aria-pressed', x===b); });
        page.querySelectorAll('.bd-panel').forEach(function(s){ s.hidden = s.id!=='bd-'+tab; });
      });
    }
  });
})();
