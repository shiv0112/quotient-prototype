/* S17 What left your device (#sent-<case>). Read-only statement of every send, newest first. */
(function(){
  'use strict';
  var D = Q.data, B = QD.b;


  function rows(key){ return QB.sendRows(key); }
  function chars(t){ return t.length.toLocaleString('en-SG'); }

  function render(p){
    var key = D.cases[p.parts[0]] ? p.parts[0] : 'wei', c = D.cases[key];
    var s = QB.local('sent', ['normal','expanded','empty','loading','error'], 'normal', p);
    var list = s.s==='empty' ? [] : rows(key);
    var head = QB.demo([['normal','Populated'],['expanded','Expanded row'],['empty','Empty'],['loading','Loading'],['error','Error']], s.s)+
      '<a class="back" href="#case-'+key+'">'+Q.icon('back','i-sm')+'Back to '+Q.esc(c.name)+'</a>'+
      '<header class="page-head rise"><div><h1 class="h1">What left your device <span class="case-no">· '+Q.esc(c.name)+' #'+c.no+'</span></h1>'+
      '<p class="sub">Every piece of text sent to the AI for this case, exactly as sent.</p></div></header>';
    // Typed or pasted notes are not audio; a recorded meeting counts even while it is still on today's calendar.
    // Web/phone send meeting audio to the speech service (UPDATE-2 2c); desktop transcribes on the device.
    var web = Q.edition()!=='desktop';
    var audio = !web || s.s==='empty' ? '' : Q.caseMeetings(key).filter(function(x){ return x.m.len && x.m.len!=='typed'; }).reverse().map(function(x){
      return '<li class="s17-audio">'+Q.icon('mic','i-sm')+'<span>Audio · '+Q.esc(x.m.len)+' · sent for transcription · deleted after<small>'+Q.esc(x.m.date||x.m.day)+'</small></span></li>'; }).join('');
    var fixed = '<ul class="s17-fixed rise">'+audio+D.log.fixed.map(function(t){ return '<li>'+Q.icon('device','i-sm')+Q.esc(t)+'</li>'; }).join('')+'</ul>';
    var body;
    if(s.s==='loading') body = '<div aria-busy="true">'+[1,2,3].map(function(){ return '<div class="skel-row"><span class="skel" style="width:30%"></span><span class="skel" style="width:16%"></span><span class="skel" style="width:12%"></span></div>'; }).join('')+'</div>';
    else if(s.s==='error') body = '<div class="banner banner-error" role="alert">'+Q.icon('alert')+'<p>Couldn\'t load this log. Nothing was changed.</p><button class="btn-link" data-bstate="normal">Try again</button></div>';
    else if(!list.length) body = '<div class="empty rise"><h2>Nothing has left your device for this case.</h2><p>When you send text to the AI, it will be listed here word for word.</p><a class="btn btn-secondary" href="#case-'+key+'">Back to '+Q.esc(c.name)+'</a></div>';
    else {
      var total = list.reduce(function(a,r){ return a + r.text.length; }, 0);
      body = '<div class="s17-sum rise"><div><b>'+list.length+'</b><span>sends</span></div><div><b>'+total.toLocaleString('en-SG')+'</b><span>characters in total</span></div>'+'</div>'+
        '<ul class="s17-list rise">'+list.map(function(r,i){
          var open = (s.s==='expanded' && i===0) || r.fresh;
          return '<li><details'+(open?' open':'')+'><summary><span><b>'+Q.esc(r.feature)+'</b>'+(r.fresh?'<span class="chip chip-outline s17-new">Just now</span>':'')+'</span>'+
            '<span class="w">'+Q.esc(r.when)+'</span><span class="c">'+chars(r.text)+' characters</span>'+
            '<span class="x"><span class="show">Show exact text</span><span class="hide">Hide text</span>'+Q.icon('next','i-sm')+'</span></summary>'+
            '<p class="s17-txt">'+QB.phText(r.text)+'</p></details></li>'; }).join('')+'</ul>';
    }
    return '<div class="page s17">'+head+body+fixed+'</div>';
  }

  Q.screen('sent', { caseArg:true, title:function(p){ var c = D.cases[p.parts[0]]; return 'What left your device'+(c?' · '+c.name:''); }, nav:'cases', render:render });
})();
