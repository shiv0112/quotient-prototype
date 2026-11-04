/* S03a-d Onboarding (#welcome-1 .. #welcome-4), one choice per screen. Focus layout: wordmark + progress header with the tile motif.
   1 How it works · 2 Turn on reminders (Quotient notifications) · 3 Calendar · 4 Follow-up wait. Nothing to connect except the calendar.
   States via ?state= : welcome-2 on | off
                        welcome-3 connecting | connected | error
                        welcome-4 changed */
(function(){
  'use strict';
  var D = Q.data, A = QD.a, ad = D.adviser;
  var mode = null, timer = null, focusSel = null;
  var o = { cal:'Google', days:ad.waitDays, saved:false };
  var last = null;
  function later(fn, ms){ var h = Q.route().hash; return setTimeout(function(){ if(Q.route().hash===h) fn(); }, ms); }
  function fresh(){ var h = Q.route().hash; if(h!==last){ last = h; mode = null; clearTimeout(timer); } }


  var STEPS = ['How it works','Reminders','Calendar','Follow-up'], N = STEPS.length;
  function shell(n, inner){
    return '<div class="page ob"><header class="ob-top tiled"><span class="wordmark">Quotient</span>'+
      '<div class="ob-prog" role="progressbar" aria-label="Setup progress" aria-valuemin="1" aria-valuemax="'+N+'" aria-valuenow="'+n+'" aria-valuetext="Step '+n+' of '+N+', '+STEPS[n-1]+'">'+
      '<span class="num">Step '+n+' of '+N+'</span><span class="ob-segs" aria-hidden="true">'+STEPS.map(function(x, i){ i++; return '<i class="'+(i<=n?'on':'')+'"></i>'; }).join('')+'</span></div></header>'+
      '<div class="ob-body">'+(n>1?'<a class="back" href="#welcome-'+(n-1)+'">'+Q.icon('back','i-sm')+'Back</a>':'<span class="back" aria-hidden="true" style="visibility:hidden">'+Q.icon('back','i-sm')+'Back</span>')+inner+'</div></div>';
  }
  function head(h, sub){ return '<header class="ob-head rise"><h1 class="h1">'+h+'</h1><p class="lede">'+sub+'</p></header>'; }
  function skip(n){ return '<a class="btn-link" href="#welcome-'+(n+1)+'">Skip for now</a>'; }
  function next(n, label){ return '<a class="btn btn-primary" href="#welcome-'+(n+1)+'">'+(label||'Continue')+Q.icon('arrow','i-sm')+'</a>'; }

  /* S03a · How it works: 3 swipe cards. */
  function how(){
    var cards = [
      ['Upload illustrations','Drop 3 to 5 policy PDFs. We read every number and keep its page.',
        '<span class="u2-file">'+Q.icon('file','i-sm')+'harbour-wl.pdf</span><span class="u2-file">'+Q.icon('file','i-sm')+'meridian-wl.pdf</span><span class="u2-file">'+Q.icon('file','i-sm')+'orchid-wl.pdf</span>'],
      ['Check the yellow numbers','Yellow means we are not sure. Tap it, see the PDF page, confirm.',
        '<span class="u2-row"><span class="small muted">Guaranteed at 65</span><span class="fig"><span class="proof">p.6</span><span class="v">'+Q.money(98500)+'</span></span></span>'+
        '<span class="u2-row"><span class="small muted">Illustrated yr 20</span><span class="fig confirm-cell"><span class="tag">Check</span><span class="proof">p.6</span><span class="v">'+Q.money(72760)+'</span></span></span>'],
      ['Send on WhatsApp','Send on WhatsApp. Quotient reminds you if the client goes quiet.',
        '<p class="ob-bubble u2-out">Hi Wei! Here are the 3 plans we talked about, side by side.</p><p class="ob-bubble">'+Q.icon('bell','i-sm')+' Case #402 · no reply in 3 days</p>']
    ];
    return shell(1, head('How it works','Three steps from meeting to a file you can share.')+
      '<div class="u2-how rise" tabindex="0" aria-label="How it works, swipe sideways">'+cards.map(function(c, i){
        return '<article class="u2-howc" aria-label="'+(i+1)+' of 3: '+Q.esc(c[0])+'"><div class="u2-vis" aria-hidden="true">'+c[2]+'</div>'+
          '<p class="eyebrow num">'+(i+1)+' of 3</p><h2 class="h3">'+Q.esc(c[0])+'</h2><p class="small muted">'+Q.esc(c[1])+'</p></article>'; }).join('')+'</div>'+
      '<span class="u2-hdots" aria-hidden="true"><i class="on"></i><i></i><i></i></span>'+
      '<div class="ob-acts u2-dock">'+next(1, 'Get started')+'</div>');
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
        '<div class="ob-acts u2-dock">'+next(3)+'</div>'
      : (s==='error' ? '<div class="banner banner-error" role="alert">'+Q.icon('alert')+'<p>Couldn\'t connect.</p><button class="btn-link" data-cal="'+o.cal+'">Try again</button></div>' : '')+
        '<div class="ob-choices rise" role="group" aria-label="Choose your calendar">'+card('Google','Connect Google Calendar','Google Workspace or Gmail')+card('Microsoft','Connect Microsoft Outlook','Microsoft 365 or Outlook.com')+'</div>'+
        '<div class="ob-acts">'+skip(3)+'</div>';
    return shell(3, head('Connect your calendar','We read meeting times. We add follow-ups you choose.')+body);
  }

  /* S03b · Turn on reminders: Quotient's own notifications. Case numbers only. */
  function remind(s){
    var web = Q.edition()!=='desktop';
    var tip = '<p class="ob-helper">'+Q.icon('info','i-sm')+'<span>'+(web ? 'On iPhone, first add Quotient to your home screen (Share, then Add to Home Screen). Apple only lets home screen apps send notifications.' : 'Notifications come from the desktop app.')+'</span></p>';
    var status = s==='on' ? '<div class="ob-done" role="status"><span class="ob-ck">'+Q.icon('check')+'</span><span><b>Reminders on ✓</b><small>We\'ll also show them on Today and in your morning digest.</small></span></div>'
      : s==='off' ? '<p class="ob-status bad">'+Q.icon('alert')+'Notifications are off. You\'ll still see reminders on Today and in the morning digest.</p>' : '';
    var acts = s==='on' ? next(2) : '<button class="btn btn-primary" data-act="notify">'+Q.icon('bell','i-sm')+'Turn on notifications</button>'+skip(2);
    var preview = '<figure class="ob-rem rise" style="margin:0" aria-label="Example reminder"><p class="eyebrow">What a reminder looks like</p>'+Q.notice()+
      '<figcaption class="small muted">Case numbers only. Client names never appear in a notification.</figcaption></figure>';
    return shell(2, head('Turn on reminders','We\'ll tell you when a client goes quiet.')+
      '<div aria-live="polite">'+status+'</div>'+(s==='on'?'':tip)+'<div class="ob-acts u2-dock">'+acts+'</div>'+preview);
  }

  /* S03e */
  function wait(s){
    if(s==='changed' && !o.saved) o.days = 5;
    var d = o.days;
    return shell(4, head('When should we remind you?','If a client hasn\'t replied after you share a comparison.')+
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
      return [how, remind, cal, wait][Math.min(Math.max(n,1),N)-1](s);
    },
    mount:function(el, p){
      var pg = el.querySelector('.page'); if(!pg) return;
      pg.addEventListener('click', function(e){
        var c = e.target.closest('[data-cal]');
        if(c){ o.cal = c.dataset.cal; mode = 'connecting'; Q.refresh(); clearTimeout(timer);
          timer = later(function(){ mode = 'connected'; focusSel = '.ob-acts .btn-primary'; Q.refresh(); }, 1600); return; }
        var a = e.target.closest('[data-act]'); if(!a) return;
        var act = a.dataset.act;
        // Simulated permission prompt: the real one comes from the phone or the desktop app.
        if(act==='notify') Q.dialog({ title:'"Quotient" would like to send you notifications', body:'<p class="small muted">Reminders show case numbers only.</p>',
          actions:[{label:'Don\'t allow',value:null},{label:'Allow',value:'ok',kind:'primary'}], safe:'ok' }).then(function(v){
            ad.notify = !!v; mode = v ? 'on' : 'off'; focusSel = '.ob-acts .btn-primary'; Q.refresh(); });
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
