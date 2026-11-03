/* S03a-c Onboarding (#welcome-1 .. #welcome-3). Builder A. Focus layout: wordmark + progress header with the tile motif.
   States via ?state= : welcome-1 connecting | connected | error
                        welcome-2 waiting | connected | expired
                        welcome-3 changed */
(function(){
  'use strict';
  var D = Q.data, A = QD.a, ad = D.adviser;
  var mode = null, timer = null, focusSel = null;
  var o = { cal:'Google', code:ad.telegramCode, days:ad.waitDays, saved:false };
  var last = null;
  function later(fn, ms){ var h = Q.route().hash; return setTimeout(function(){ if(Q.route().hash===h) fn(); }, ms); }
  function fresh(){ var h = Q.route().hash; if(h!==last){ last = h; mode = null; clearTimeout(timer); } }


  var STEPS = ['Calendar','Reminders','Follow-up'];
  function shell(n, inner){
    return '<div class="page ob"><header class="ob-top tiled"><span class="wordmark">Quotient</span>'+
      '<div class="ob-prog" role="progressbar" aria-label="Setup progress" aria-valuemin="1" aria-valuemax="3" aria-valuenow="'+n+'" aria-valuetext="Step '+n+' of 3, '+STEPS[n-1]+'">'+
      '<span class="num">Step '+n+' of 3</span><span class="ob-segs" aria-hidden="true">'+[1,2,3].map(function(i){ return '<i class="'+(i<=n?'on':'')+'"></i>'; }).join('')+'</span></div></header>'+
      '<div class="ob-body">'+(n>1?'<a class="back" href="#welcome-'+(n-1)+'">'+Q.icon('back','i-sm')+'Back</a>':'<span class="back" aria-hidden="true" style="visibility:hidden">'+Q.icon('back','i-sm')+'Back</span>')+inner+'</div></div>';
  }
  function head(h, sub){ return '<header class="ob-head rise"><h1 class="h1">'+h+'</h1><p class="lede">'+sub+'</p></header>'; }
  function skip(n){ return '<a class="btn-link" href="#welcome-'+(n+1)+'">Skip for now</a>'; }

  /* S03a */
  function cal(s){
    var busy = s==='connecting';
    var card = function(k, title, sub){
      var isBusy = busy && o.cal===k;
      return '<button type="button" class="ob-choice'+(isBusy?' busy':'')+'" data-cal="'+k+'"'+(busy?' disabled':'')+(isBusy?' aria-busy="true"':'')+'>'+A.logo[k.toLowerCase()]+
        '<b>'+title+'</b><small>'+(isBusy?'<span class="ob-spin" aria-hidden="true"></span>Waiting for '+k+'…':sub)+'</small></button>'; };
    var body = s==='connected'
      ? '<div class="ob-done" role="status"><span class="ob-ck">'+Q.icon('check')+'</span><span><b>Connected · '+A.meetingsThisWeek+' meetings this week</b><small>'+(o.cal==='Google'?'Google Calendar':'Microsoft Outlook')+' · '+Q.esc(ad.email)+'</small></span></div>'+
        '<div class="ob-acts"><a class="btn btn-primary" href="#welcome-2">Continue'+Q.icon('arrow','i-sm')+'</a></div>'
      : (s==='error' ? '<div class="banner banner-error" role="alert">'+Q.icon('alert')+'<p>Couldn\'t connect.</p><button class="btn-link" data-cal="'+o.cal+'">Try again</button></div>' : '')+
        '<div class="ob-choices rise" role="group" aria-label="Choose your calendar">'+card('Google','Connect Google Calendar','Google Workspace or Gmail')+card('Microsoft','Connect Microsoft Outlook','Microsoft 365 or Outlook.com')+'</div>'+
        '<div class="ob-acts">'+skip(1)+'</div>';
    return shell(1, head('Connect your calendar','Your meetings show up here, so you can take notes in one tap.')+body);
  }

  /* S03b */
  function tg(s){
    var status = s==='waiting' ? '<p class="ob-status wait"><span class="ob-pulse" aria-hidden="true"></span>Waiting for your message in Telegram…</p>'
      : s==='connected' ? '<p class="ob-status ok">'+Q.icon('check')+'Connected · reminders go to '+Q.esc(ad.telegram)+'</p>'
      : s==='expired' ? '<p class="ob-status bad">'+Q.icon('alert')+'That code expired. <button class="btn-link" data-act="newcode">Get a new code</button></p>' : '';
    var acts = s==='connected'
      ? '<a class="btn btn-primary" href="#welcome-3">Continue'+Q.icon('arrow','i-sm')+'</a>'
      : '<button class="btn btn-primary" data-act="open"'+(s==='waiting'?' aria-disabled="true"':'')+'>Open Telegram'+Q.icon('arrow','i-sm')+'</button>'+skip(2);
    var helper = s==='connected' ? '' : '<p class="ob-helper">Or send this code to '+A.bot+': <span class="ob-code"'+(s==='expired'?' style="text-decoration:line-through;opacity:.6"':'')+'>'+Q.esc(o.code)+'</span></p>';
    var preview = '<figure class="ob-tg rise" style="margin:0" aria-label="Example reminder">'+
      '<p class="eyebrow">What a reminder looks like</p>'+
      '<div class="ob-tg-who">'+A.logo.telegram+'<span><b>Quotient reminders</b><small>'+A.bot+'</small></span></div>'+
      '<p class="ob-bubble">'+Q.esc(D.nudge.telegram)+'</p>'+
      '<div class="ob-bubble-acts" aria-hidden="true"><span>Nudge</span><span>Already replied</span><span>Snooze</span></div>'+
      '<figcaption class="small muted">Case numbers only. Client names stay on your device.</figcaption></figure>';
    return shell(2, head('Get reminders on Telegram','We\'ll message you when a client goes quiet. Messages show case numbers only, never client names.')+
      '<div aria-live="polite">'+status+'</div><div class="ob-acts">'+acts+'</div>'+helper+preview);
  }

  /* S03c */
  function wait(s){
    if(s==='changed' && !o.saved) o.days = 5;
    var d = o.days;
    return shell(3, head('When should we remind you?','If a client hasn\'t replied after you share a comparison.')+
      '<fieldset class="ob-days rise"><legend class="sr">Days to wait before a reminder</legend>'+[1,2,3,4,5,6,7].map(function(i){
        return '<label class="ob-day"><input type="radio" name="ob-days" value="'+i+'"'+(i===d?' checked':'')+' aria-label="'+i+' day'+(i>1?'s':'')+'"><b>'+i+'</b><small>day'+(i>1?'s':'')+'</small></label>'; }).join('')+'</fieldset>'+
      '<p class="ob-live" aria-live="polite">We\'ll remind you <b class="num">'+d+' day'+(d>1?'s':'')+'</b> after you share.</p>'+
      '<div class="ob-acts"><button class="btn btn-primary" data-act="finish">Finish</button></div>'+
      '<p class="ob-note">You can change this any time in Settings.</p>');
  }

  Q.screen('welcome', {
    title:function(p){ return 'Set up · step '+(p.arg||1)+' of 3'; }, nav:'', rail:false,
    render:function(p){
      fresh();
      var n = +p.arg || 1, s = mode || p.state;
      return n===2 ? tg(s) : n===3 ? wait(s) : cal(s);
    },
    mount:function(el, p){
      var pg = el.querySelector('.page'); if(!pg) return;
      pg.addEventListener('click', function(e){
        var c = e.target.closest('[data-cal]');
        if(c){ o.cal = c.dataset.cal; mode = 'connecting'; Q.refresh(); clearTimeout(timer);
          timer = later(function(){ mode = 'connected'; focusSel = '.ob-acts .btn-primary'; Q.refresh(); }, 1600); return; }
        var a = e.target.closest('[data-act]'); if(!a) return;
        var act = a.dataset.act;
        if(act==='open'){ if(a.getAttribute('aria-disabled')) return; mode = 'waiting'; Q.refresh(); clearTimeout(timer);
          timer = later(function(){ mode = 'connected'; focusSel = '.ob-acts .btn-primary'; Q.refresh(); }, 2600); }
        if(act==='newcode'){ o.code = A.newCode; mode = 'default'; focusSel = '[data-act="open"]'; Q.refresh(); }
        if(act==='finish'){ mode = null; Q.go('#today'); setTimeout(function(){ Q.toast('You\'re set up. Your next meeting is below.'); }, 350); }
      });
      pg.addEventListener('change', function(e){
        if(e.target.name==='ob-days'){ o.days = ad.waitDays = +e.target.value; o.saved = true;
          pg.querySelector('.ob-live').innerHTML = 'We\'ll remind you <b class="num">'+o.days+' day'+(o.days>1?'s':'')+'</b> after you share.'; }
      });
      if(focusSel){ var f = pg.querySelector(focusSel); focusSel = null; if(f) f.focus(); }
    }
  });
})();
