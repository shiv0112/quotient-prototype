/* S03a-e Onboarding (#welcome-1 .. #welcome-5), one choice per screen. Focus layout: wordmark + progress header with the tile motif.
   1 How it works · 2 Client channel · 3 Reminders (Telegram connect inline) · 4 Calendar · 5 Follow-up wait.
   States via ?state= : welcome-3 waiting | connected | expired
                        welcome-4 connecting | connected | error
                        welcome-5 changed */
(function(){
  'use strict';
  var D = Q.data, A = QD.a, ad = D.adviser;
  var mode = null, timer = null, focusSel = null;
  var o = { cal:'Google', code:ad.telegramCode, days:ad.waitDays, saved:false, remind:ad.remindVia || 'telegram' };
  var last = null;
  function later(fn, ms){ var h = Q.route().hash; return setTimeout(function(){ if(Q.route().hash===h) fn(); }, ms); }
  function fresh(){ var h = Q.route().hash; if(h!==last){ last = h; mode = null; clearTimeout(timer); } }


  var STEPS = ['How it works','Client channel','Reminders','Calendar','Follow-up'], N = STEPS.length;
  function shell(n, inner){
    return '<div class="page ob"><header class="ob-top tiled"><span class="wordmark">Quotient</span>'+
      '<div class="ob-prog" role="progressbar" aria-label="Setup progress" aria-valuemin="1" aria-valuemax="'+N+'" aria-valuenow="'+n+'" aria-valuetext="Step '+n+' of '+N+', '+STEPS[n-1]+'">'+
      '<span class="num">Step '+n+' of '+N+'</span><span class="ob-segs" aria-hidden="true">'+[1,2,3,4,5].map(function(i){ return '<i class="'+(i<=n?'on':'')+'"></i>'; }).join('')+'</span></div></header>'+
      '<div class="ob-body">'+(n>1?'<a class="back" href="#welcome-'+(n-1)+'">'+Q.icon('back','i-sm')+'Back</a>':'<span class="back" aria-hidden="true" style="visibility:hidden">'+Q.icon('back','i-sm')+'Back</span>')+inner+'</div></div>';
  }
  function head(h, sub){ return '<header class="ob-head rise"><h1 class="h1">'+h+'</h1><p class="lede">'+sub+'</p></header>'; }
  function skip(n){ return '<a class="btn-link" href="#welcome-'+(n+1)+'">Skip for now</a>'; }
  function next(n, label){ return '<a class="btn btn-primary" href="#welcome-'+(n+1)+'">'+(label||'Continue')+Q.icon('arrow','i-sm')+'</a>'; }
  function ic(d){ return '<svg class="i logo" viewBox="0 0 24 24" aria-hidden="true">'+d+'</svg>'; }
  var IC = { whatsapp:ic('<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/>'), email:ic('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>') };
  /* One choice per screen: radio cards. */
  function choices(name, cur, list){
    return '<div class="ob-choices u2-pick rise" role="radiogroup" aria-label="'+Q.esc(name)+'">'+list.map(function(c){
      return '<button type="button" class="ob-choice" role="radio" aria-checked="'+(c[0]===cur)+'" data-pick="'+c[0]+'">'+c[1]+'<b>'+c[2]+'</b><small>'+c[3]+'</small>'+
        '<span class="u2-tick" aria-hidden="true">'+Q.icon('check','i-sm')+'</span></button>'; }).join('')+'</div>';
  }

  /* S03a · How it works: 3 swipe cards. */
  function how(){
    var cards = [
      ['Upload illustrations','Drop 3 to 5 policy PDFs. We read every number and keep its page.',
        '<span class="u2-file">'+Q.icon('file','i-sm')+'harbour-wl.pdf</span><span class="u2-file">'+Q.icon('file','i-sm')+'meridian-wl.pdf</span><span class="u2-file">'+Q.icon('file','i-sm')+'orchid-wl.pdf</span>'],
      ['Check the yellow numbers','Yellow means we are not sure. Tap it, see the PDF page, confirm.',
        '<span class="u2-row"><span class="small muted">Guaranteed at 65</span><span class="fig"><span class="proof">p.6</span><span class="v">'+Q.money(98500)+'</span></span></span>'+
        '<span class="u2-row"><span class="small muted">Illustrated yr 20</span><span class="fig confirm-cell"><span class="tag">Check</span><span class="proof">p.6</span><span class="v">'+Q.money(72760)+'</span></span></span>'],
      ['Send on WhatsApp','We remind you if the client goes quiet.',
        '<p class="ob-bubble u2-out">Hi Wei! Here are the 3 plans we talked about, side by side.</p><p class="ob-bubble">'+A.logo.telegram+' Case #402 · quiet 3 days. Nudge?</p>']
    ];
    return shell(1, head('How it works','Three steps from meeting to a file you can share.')+
      '<div class="u2-how rise" tabindex="0" aria-label="How it works, swipe sideways">'+cards.map(function(c, i){
        return '<article class="u2-howc" aria-label="'+(i+1)+' of 3: '+Q.esc(c[0])+'"><div class="u2-vis" aria-hidden="true">'+c[2]+'</div>'+
          '<p class="eyebrow num">'+(i+1)+' of 3</p><h2 class="h3">'+Q.esc(c[0])+'</h2><p class="small muted">'+Q.esc(c[1])+'</p></article>'; }).join('')+'</div>'+
      '<span class="u2-hdots" aria-hidden="true"><i class="on"></i><i></i><i></i></span>'+
      '<div class="ob-acts u2-dock">'+next(1, 'Get started')+'</div>');
  }

  /* S03b · Where clients talk to you. */
  function channel(){
    return shell(2, head('Where do your clients talk to you?','We open your shared comparison in this app, ready to send.')+
      choices('Client channel', ad.channel==='email' ? 'email' : 'whatsapp', [['whatsapp', IC.whatsapp, 'WhatsApp', 'Most clients in Singapore'], ['email', IC.email, 'Email', 'A link and a PDF in your mail app']])+
      '<div class="ob-acts u2-dock">'+next(2)+'</div><p class="ob-note">You can change this any time in Settings.</p>');
  }

  /* S03d */
  function cal(s){
    var busy = s==='connecting';
    var card = function(k, title, sub){
      var isBusy = busy && o.cal===k;
      return '<button type="button" class="ob-choice'+(isBusy?' busy':'')+'" data-cal="'+k+'"'+(busy?' disabled':'')+(isBusy?' aria-busy="true"':'')+'>'+A.logo[k.toLowerCase()]+
        '<b>'+title+'</b><small>'+(isBusy?'<span class="ob-spin" aria-hidden="true"></span>Waiting for '+k+'…':sub)+'</small></button>'; };
    var body = s==='connected'
      ? '<div class="ob-done" role="status"><span class="ob-ck">'+Q.icon('check')+'</span><span><b>Connected · '+A.meetingsThisWeek+' meetings this week</b><small>'+(o.cal==='Google'?'Google Calendar':'Microsoft Outlook')+' · '+Q.esc(ad.email)+'</small></span></div>'+
        '<div class="ob-acts u2-dock">'+next(4)+'</div>'
      : (s==='error' ? '<div class="banner banner-error" role="alert">'+Q.icon('alert')+'<p>Couldn\'t connect.</p><button class="btn-link" data-cal="'+o.cal+'">Try again</button></div>' : '')+
        '<div class="ob-choices rise" role="group" aria-label="Choose your calendar">'+card('Google','Connect Google Calendar','Google Workspace or Gmail')+card('Microsoft','Connect Microsoft Outlook','Microsoft 365 or Outlook.com')+'</div>'+
        '<div class="ob-acts">'+skip(4)+'</div>';
    return shell(4, head('Connect your calendar','We read meeting times. We add follow-ups you choose.')+body);
  }

  /* S03c · Where we remind you. Telegram keeps its connect step inline. */
  function remind(s){
    var pick = choices('Reminder channel', o.remind, [['telegram', A.logo.telegram, 'Telegram', 'Case numbers only'], ['push', ic('<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0"/>'), 'Phone notification', 'From the Quotient app'], ['email', IC.email, 'Email', 'To '+Q.esc(ad.email)]]);
    var h = head('Where should we remind you?','We\'ll tell you when a client goes quiet.');
    if(o.remind!=='telegram') return shell(3, h+pick+'<div class="ob-acts u2-dock">'+next(3)+skip(3)+'</div>');
    return tg(s, h+pick);
  }
  function tg(s, top){
    var status = s==='waiting' ? '<p class="ob-status wait"><span class="ob-pulse" aria-hidden="true"></span>Waiting for your message in Telegram…</p>'
      : s==='connected' ? '<p class="ob-status ok">'+Q.icon('check')+'Connected · reminders go to '+Q.esc(ad.telegram)+'</p>'
      : s==='expired' ? '<p class="ob-status bad">'+Q.icon('alert')+'That code expired. <button class="btn-link" data-act="newcode">Get a new code</button></p>' : '';
    var acts = s==='connected'
      ? next(3)
      : '<button class="btn btn-primary" data-act="open"'+(s==='waiting'?' aria-disabled="true"':'')+'>Open Telegram'+Q.icon('arrow','i-sm')+'</button>'+skip(3);
    var helper = s==='connected' ? '' : '<p class="ob-helper">Or send this code to '+A.bot+': <span class="ob-code"'+(s==='expired'?' style="text-decoration:line-through;opacity:.6"':'')+'>'+Q.esc(o.code)+'</span></p>';
    var preview = '<figure class="ob-tg rise" style="margin:0" aria-label="Example reminder">'+
      '<p class="eyebrow">What a reminder looks like</p>'+
      '<div class="ob-tg-who">'+A.logo.telegram+'<span><b>Quotient reminders</b><small>'+A.bot+'</small></span></div>'+
      '<p class="ob-bubble">'+Q.esc(D.nudge.telegram)+'</p>'+
      '<div class="ob-bubble-acts" aria-hidden="true"><span>Nudge</span><span>Already replied</span><span>Snooze</span></div>'+
      '<figcaption class="small muted">Case numbers only. Client names are never sent to Telegram.</figcaption></figure>';
    return shell(3, top+'<h2 class="h3 u2-sub">Connect Telegram</h2>'+
      '<div aria-live="polite">'+status+'</div>'+helper+'<div class="ob-acts u2-dock">'+acts+'</div>'+preview);
  }

  /* S03e */
  function wait(s){
    if(s==='changed' && !o.saved) o.days = 5;
    var d = o.days;
    return shell(5, head('When should we remind you?','If a client hasn\'t replied after you share a comparison.')+
      '<fieldset class="ob-days rise"><legend class="sr">Days to wait before a reminder</legend>'+[1,2,3,4,5,6,7].map(function(i){
        return '<label class="ob-day"><input type="radio" name="ob-days" value="'+i+'"'+(i===d?' checked':'')+' aria-label="'+i+' day'+(i>1?'s':'')+'"><b>'+i+'</b><small>day'+(i>1?'s':'')+'</small></label>'; }).join('')+'</fieldset>'+
      '<p class="ob-live" aria-live="polite">We\'ll remind you <b class="num">'+d+' day'+(d>1?'s':'')+'</b> after you share.</p>'+
      '<div class="ob-acts u2-dock"><button class="btn btn-primary" data-act="finish">Finish</button></div>'+
      '<p class="ob-note">You can change this any time in Settings.</p>');
  }

  Q.screen('welcome', {
    title:function(p){ return 'Set up · step '+(p.arg||1)+' of '+N; }, nav:'', rail:false,
    render:function(p){
      fresh();
      var n = +p.arg || 1, s = mode || p.state;
      return [how, channel, remind, cal, wait][Math.min(Math.max(n,1),N)-1](s);
    },
    mount:function(el, p){
      var pg = el.querySelector('.page'); if(!pg) return;
      pg.addEventListener('click', function(e){
        var c = e.target.closest('[data-cal]');
        if(c){ o.cal = c.dataset.cal; mode = 'connecting'; Q.refresh(); clearTimeout(timer);
          timer = later(function(){ mode = 'connected'; focusSel = '.ob-acts .btn-primary'; Q.refresh(); }, 1600); return; }
        var k = e.target.closest('[data-pick]');
        if(k){ if(+p.arg===2) ad.channel = k.dataset.pick; else { o.remind = ad.remindVia = k.dataset.pick; mode = null; }
          focusSel = '[data-pick="'+k.dataset.pick+'"]'; Q.refresh(); return; }
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
      var how = pg.querySelector('.u2-how');
      if(how) how.addEventListener('scroll', function(){ var i = Math.round(how.scrollLeft / how.offsetWidth);
        pg.querySelectorAll('.u2-hdots i').forEach(function(d, j){ d.classList.toggle('on', j===i); }); }, { passive:true });
      if(focusSel){ var f = pg.querySelector(focusSel); focusSel = null; if(f) f.focus(); }
    }
  });
})();
