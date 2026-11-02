/* S04 Today (#today). Reference screen: one primary (Open meeting), everything else secondary. */
(function(){
  'use strict';
  var D = Q.data;

  function head(sub){
    return '<header class="today-head tiled rise">'+
      '<p class="eyebrow">'+D.today.long+'</p>'+
      '<h1 class="h1 display">Good morning, '+Q.esc(D.adviser.first)+'</h1>'+
      (sub?'<p class="lede">'+sub+'</p>':'')+
      '<a class="btn btn-secondary phone-only" href="#new-case">'+Q.icon('plus')+'New case</a>'+
    '</header>';
  }

  function nextMeeting(){
    var m = D.meetings.upcoming[0], c = D.cases[m.c];
    return '<section class="card hero meet rise" aria-labelledby="nm-h">'+
      '<div class="meet-top"><p class="eyebrow">Next meeting · today</p><span class="meet-time num">'+m.time+'</span></div>'+
      '<h2 class="h2" id="nm-h">'+Q.esc(m.who)+'</h2>'+
      '<p class="meet-line">'+m.time+' to '+m.end+'<span class="dot-sep"></span>'+Q.icon('video','i-sm')+' '+m.app+'<span class="dot-sep"></span>Case #'+c.no+' · '+D.steps[c.now].label+'</p>'+
      '<div class="meet-acts">'+
        '<label class="switch"><input type="checkbox" id="nm-notes"'+(m.notes?' checked':'')+'> Take notes</label>'+
        '<span class="meet-hint">We\'ll remind you before it starts. You still press Record.</span>'+
        '<a class="btn btn-primary" href="#meeting-'+m.id+'">Open meeting'+Q.icon('arrow','i-sm')+'</a>'+
      '</div></section>';
  }

  function needs(){
    var list = Q.needs(), rows = list.slice(0,5).map(function(k){ var c = D.cases[k], st = Q.status(k);
      return '<li><div class="who"><a class="who-link" href="#case-'+k+'"><b>'+Q.esc(c.name)+'</b> <span class="case-no">#'+c.no+'</span></a><small>'+Q.esc(st.why)+'</small></div>'+
        '<a class="btn btn-secondary btn-sm need-btn" href="'+st.go+'">'+Q.esc(st.btn)+'</a></li>'; }).join('');
    return '<section class="card rise" aria-labelledby="ny-h"><div class="card-head"><h2 class="h3" id="ny-h">Needs you</h2><span class="small muted num">'+list.length+' case'+(list.length===1?'':'s')+'</span></div>'+
      (rows ? '<ul class="list">'+rows+'</ul>' : '<p class="muted" style="padding:var(--s-4) 0">Nothing needs you right now.</p>')+
      '<div class="card-foot"><a href="#cases">See all cases ('+D.caseOrder.length+')</a></div></section>';
  }

  function digest(){
    return '<section class="card digest rise" aria-labelledby="dg-h">'+
      '<p class="eyebrow" id="dg-h">This morning\'s digest</p>'+
      '<ul class="digest-list">'+D.digest.items.map(function(i){ return '<li><a href="'+i.go+'">'+Q.esc(i.text)+'</a></li>'; }).join('')+'</ul>'+
      '<p class="small device-line">'+Q.icon('device','i-sm')+' Sent to this device at '+D.digest.sent+'. Names never leave it.</p></section>';
  }

  Q.screen('today', {
    title:'Today', nav:'today',
    render:function(p){
      var clientMeetings = D.meetings.upcoming.filter(function(m){ return m.day==='Today' && !m.internal; }).length;
      var n = Q.needs().length, sub = clientMeetings+' meeting today<span class="dot-sep"></span>'+n+' case'+(n===1?' needs':'s need')+' you';
      if(p.state==='empty') return '<div class="page">'+head('')+
        '<div class="empty rise"><h2>Nothing needs you yet</h2><p>Your next meeting will show here. You can also start a case from PDFs.</p>'+
        '<a class="btn btn-primary" href="#new-case">'+Q.icon('plus')+'New case</a><a href="#welcome-1">Connect your calendar</a></div></div>';
      if(p.state==='loading') return '<div class="page">'+head('')+'<div class="today-grid"><div class="stack">'+
        '<div class="card" aria-busy="true"><span class="skel" style="width:30%"></span><span class="skel skel-lg" style="width:45%;margin-top:16px"></span><span class="skel" style="width:70%;margin-top:14px"></span></div>'+
        '<div class="card">'+[1,2,3,4].map(function(){ return '<div style="padding:14px 0;border-bottom:1px solid var(--line)"><span class="skel" style="width:40%"></span><span class="skel" style="width:25%;margin-top:8px"></span></div>'; }).join('')+'</div>'+
        '</div><aside class="stack"><div class="card"><span class="skel" style="width:60%"></span><span class="skel" style="width:90%;margin-top:12px"></span></div></aside></div></div>';
      var top = p.state==='error'
        ? '<div class="banner banner-error rise" role="alert">'+Q.icon('alert')+'<p>Calendar didn\'t sync. Your cases are still here.</p><button class="btn-link" data-toast="Calendar synced">Try again</button></div>'
        : nextMeeting();
      return '<div class="page">'+head(sub)+
        '<div class="today-grid"><div class="stack">'+top+needs()+'</div>'+
        '<aside class="stack">'+digest()+'</aside></div></div>';
    },
    mount:function(el){
      var sw = el.querySelector('#nm-notes');
      if(sw) sw.addEventListener('change', function(){ D.meetings.upcoming[0].notes = sw.checked;
        Q.toast(sw.checked ? 'We\'ll remind you at '+QB.remindAt(D.meetings.upcoming[0].time) : 'No reminder for this meeting'); });
    }
  });
})();
