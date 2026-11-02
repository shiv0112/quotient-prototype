/* S16 Follow-up nudge (#nudge-<case>[-<state>]) and S16t Telegram reminder mock (#telegram[-<state>]). Phone-first.
   Nudge states: nodraft, default (draft), sent, snoozed, reply (log a reply), three (3 nudges).
   Telegram states: default (3 buttons), snooze (how long?), snoozed, replied. Telegram text shows case numbers only. */
(function(){
  'use strict';
  var D = Q.data, N = D.nudge, ui = { hash:null }, tg = { hash:null };
  var SNOOZE = { '1':'Wed 4 Nov', '3':'Fri 6 Nov' }; // today is Tue 3 Nov
  var BOT = (QD.a && QD.a.bot) || '@QuotientRemindBot';


  function demo(base, list, cur){
    return '<nav class="switcher" aria-label="Demo states"><span class="eyebrow">Demo states</span><div class="switcher-chips">'+list.map(function(x){
      return '<button class="chip" data-go="#'+base+(x[0]?'-'+x[0]:'')+'" aria-pressed="'+(x[0]===cur)+'">'+x[1]+'</button>'; }).join('')+'</div></nav>';
  }

  /* ---------- S16 Nudge ---------- */
  function render(p){
    var key = D.cases[p.parts[0]] ? p.parts[0] : 'priya', c = D.cases[key];
    if(location.hash!==ui.hash){ ui.hash = location.hash; ui.st = p.parts[1] || (c.nudged ? 'sent' : c.snoozedTo ? 'snoozed' : ''); ui.method = 'email'; ui.snooze = '1'; ui.draft = N.draft.replace('Priya', c.first); }
    var st = p.state==='empty' ? 'nodraft' : p.state==='error' ? 'error' : p.state==='loading' ? 'loading' : ui.st;
    var chips = demo('nudge-'+key, [['nodraft','No draft yet'],['','Draft'],['sent','Sent'],['snoozed','Snoozed'],['reply','Log a reply'],['three','3 nudges']], ui.st);
    var head = '<header><a class="back" href="#case-'+key+'">'+Q.icon('back','i-sm')+'Back to '+Q.esc(c.name)+'</a>'+
      '<h1 class="h1 display">Nudge '+Q.esc(c.name)+'</h1>'+
      '<p class="ng-sub"><span class="num">#'+c.no+'</span><span class="dot-sep"></span>shared '+(c.dates.shared||N.shared)+'<span class="dot-sep"></span>no reply for '+(c.quietDays||3)+' days</p></header>';
    var top = '', body;
    if(st==='snoozed') top = '<div class="banner" role="status">'+Q.icon('bell')+'<p>Snoozed until '+(c.snoozedTo||SNOOZE[ui.snooze])+'. We\'ll remind you on Telegram.</p><button class="btn-link" data-act="unsnooze">Undo</button></div>';
    if(st==='three') top = '<div class="banner" role="status">'+Q.icon('info')+'<p>3 nudges sent with no reply. Keep going or mark as lost?</p><button class="btn-link" data-act="keep">Keep going</button><button class="btn-link" data-act="lost">Mark lost</button></div>';
    if(st==='error') top = '<div class="banner banner-error" role="alert">'+Q.icon('alert')+'<p>Couldn\'t draft the nudge. Nothing else was sent.</p><button class="btn-link" data-go="#gate-'+key+'">Try again</button></div>';

    if(st==='nodraft' || st==='error') body = '<section class="card hero ng-hero" aria-labelledby="ng-d"><p class="eyebrow">Follow-up</p><h2 id="ng-d">Draft a short nudge for '+Q.esc(c.first)+'</h2>'+
      '<p>Only one talking point and <span class="ph">[CLIENT]</span> are sent. The name goes back in on this device.</p>'+
      '<div><a class="btn btn-primary" href="#gate-'+key+'">Draft a nudge'+Q.icon('arrow','i-sm')+'</a></div></section>';
    else if(st==='loading') body = '<div class="card" aria-busy="true"><span class="skel" style="width:30%"></span><span class="skel skel-lg" style="width:100%;margin-top:16px;height:96px"></span></div>';
    else if(st==='sent') body = '<div class="banner banner-success" role="status">'+Q.icon('check')+'<p>Nudge sent · next reminder '+(c.nudged?c.nudged.next:N.next)+'</p></div>'+
      '<section class="card ng-draft" aria-labelledby="ng-s"><h2 class="h3" id="ng-s">What you sent · '+D.today.date+'</h2><p class="ng-sent">'+Q.esc(ui.draft)+'</p>'+
      '<p class="ng-log">'+Q.icon('device','i-sm')+'Sent from your '+(ui.method==='email'?'email':'share menu')+'. We only note that you sent it.</p></section>'+
      '<div class="ng-acts"><a class="btn btn-primary" href="#case-'+key+'">Done</a><div class="row"><button class="btn btn-secondary" data-act="reply">Log a reply</button></div></div>';
    else if(st==='reply') body = '<section class="card ng-draft" aria-labelledby="ng-r"><h2 class="h3" id="ng-r">What did '+Q.esc(c.first)+' say?</h2>'+
      '<div class="ng-opts" role="radiogroup" aria-labelledby="ng-r">'+['Wants to go ahead','Has questions','Wants a revised quote','Not interested'].map(function(o,i){
        return '<label class="check"><input type="radio" name="ng-why" value="'+o+'"'+(i===1?' checked':'')+'> '+o+'</label>'; }).join('')+'</div>'+
      '<div class="field"><label class="label" for="ng-note">Note <span class="muted" style="font-weight:400">(optional)</span></label><textarea class="textarea" id="ng-note" rows="3" placeholder="What they asked or said"></textarea></div></section>'+
      '<div class="ng-acts"><button class="btn btn-primary" data-act="savereply">Save reply</button><div class="row"><button class="btn btn-ghost" data-act="back">Cancel</button></div></div>';
    else {
      var share = ui.method==='share', isWeb = p.edition!=='desktop';
      body = '<section class="card ng-draft" aria-labelledby="ng-l"><label class="h3" id="ng-l" for="ng-txt">Your nudge</label>'+
        '<textarea class="textarea" id="ng-txt" rows="4">'+Q.esc(ui.draft)+'</textarea>'+
        '<p class="ng-from"><span class="chip chip-device">'+Q.icon('device','i-sm')+'<span>Drafted from: talking point + <b>[CLIENT]</b> · name added on this device</span></span><a href="#sent-'+key+'">See what was sent</a></p>'+
        '<div class="field"><span class="label" id="ng-m">Send with</span><div class="seg" role="group" aria-labelledby="ng-m" style="align-self:flex-start">'+
          '<button data-method="email" aria-pressed="'+!share+'">Email</button><button data-method="share" aria-pressed="'+share+'">Share</button></div>'+
          '<span class="hint">'+(share?(isWeb?'Opens your browser\'s share menu: WhatsApp, Telegram and others.':'Opens the system share sheet: WhatsApp, Telegram and others.'):'Opens your email app with this text. To: '+Q.esc((QD.c.emails[key])||'')+'')+'</span></div></section>'+
        '<div class="ng-acts"><button class="btn btn-primary" data-act="send">'+Q.icon('share','i-sm')+'Send nudge</button>'+
          '<div class="row"><button class="btn btn-secondary" data-act="replied">Already replied</button>'+
          '<div class="menu"><button class="btn btn-secondary" data-menu aria-haspopup="true" aria-expanded="false">'+Q.icon('bell','i-sm')+'Snooze</button><div class="menu-pop" role="menu">'+
            '<button role="menuitem" data-snooze="1">1 day · until '+SNOOZE['1']+'</button><button role="menuitem" data-snooze="3">3 days · until '+SNOOZE['3']+'</button></div></div>'+
          '<div class="menu"><button class="btn btn-ghost" data-menu aria-haspopup="true" aria-expanded="false" aria-label="More actions">'+Q.icon('more')+'<span class="desk-only">More</span></button><div class="menu-pop" role="menu">'+
            '<button role="menuitem" data-act="won">Mark won</button><button role="menuitem" class="danger" data-act="lost">Mark lost</button></div></div></div>'+
          '<p class="ng-log"><button class="btn-link" data-act="reply" style="padding:0">Log a reply</button> if '+Q.esc(c.first)+' got back to you another way.</p></div>';
    }
    return '<div class="page ng">'+chips+head+top+body+'</div>';
  }

  function mount(el, p){
    var key = D.cases[p.parts[0]] ? p.parts[0] : 'priya', c = D.cases[key], pg = el.querySelector('.page');
    var ta = pg.querySelector('#ng-txt'); if(ta) ta.addEventListener('input', function(){ ui.draft = ta.value; });
    pg.addEventListener('click', function(e){
      var m = e.target.closest('[data-method]'); if(m){ ui.method = m.dataset.method; Q.refresh(); return; }
      var sz = e.target.closest('[data-snooze]'); if(sz){ ui.snooze = sz.dataset.snooze; ui.st = 'snoozed'; c.snoozedTo = SNOOZE[ui.snooze]; delete c.nudged; Q.refresh(); Q.toast('Snoozed until '+SNOOZE[ui.snooze]); return; }
      var a = e.target.closest('[data-act]'); if(!a) return;
      var act = a.dataset.act;
      if(act==='send'){ if(!ui.draft.trim()){ ta.setAttribute('aria-invalid','true'); ta.focus(); return; } ui.st = 'sent'; c.nudged = { on:D.today.date, next:N.next }; delete c.snoozedTo; Q.refresh(); Q.toast('Nudge sent · next reminder '+N.next); }
      if(act==='unsnooze' || act==='keep' || act==='back'){ if(act==='unsnooze') delete c.snoozedTo; ui.st = ''; Q.refresh(); }
      if(act==='replied' || act==='reply'){ ui.st = 'reply'; Q.refresh(); var r = document.querySelector('.ng input[type=radio]:checked'); if(r) r.focus(); }
      if(act==='savereply'){ var r2 = pg.querySelector('input[name=ng-why]:checked');
        if(c.now<3){ c.now = 3; c.dates.replied = D.today.date; }
        Q.toast('Reply logged · '+(r2?r2.value.toLowerCase():'')); Q.go('#case-'+key); }
      if(act==='won'){ c.result = 'won'; c.now = 7; c.dates.closed = D.today.date; Q.toast('Marked as won'); Q.go('#case-'+key); }
      if(act==='lost') Q.dialog({ title:'Why was '+c.first+'\'s case lost?',
        body:'<div class="opts" role="radiogroup">'+['Budget changed','Chose another adviser','Not ready','Other'].map(function(r,i){
          return '<label class="check"><input type="radio" name="why" value="'+r+'"'+(i===0?' checked':'')+'> '+r+'</label>'; }).join('')+'</div>',
        actions:[{label:'Cancel',value:null},{label:'Mark lost',value:'ok',kind:'danger'}], safe:null
      }).then(function(v){ if(!v) return; var r = document.querySelector('.dialog input[name=why]:checked');
        c.reason = r ? r.value : 'Other'; c.lostAt = Math.min(c.now,6); c.result = 'lost'; c.now = 7; c.dates.closed = D.today.date; Q.toast('Marked as lost'); Q.go('#case-'+key); });
    });
  }

  Q.screen('nudge', { title:function(p){ var c = D.cases[p.parts[0]]; return 'Nudge'+(c?' '+c.name:''); }, nav:'cases', render:render, mount:mount });

  /* ---------- S16t Telegram reminder (mock of the adviser's phone) ---------- */
  function bubble(text, me, time, kb){
    return '<div class="tg-msg'+(me?' me':'')+'"><div class="tg-b">'+text+'<time>'+(time||'09:00')+'</time></div>'+(kb||'')+'</div>';
  }
  function kb(btns, used){ return '<div class="tg-kb">'+btns.map(function(b){ return '<button data-tg="'+b[0]+'"'+(used?' disabled':'')+'>'+b[1]+'</button>'; }).join('')+'</div>'; }

  function renderTg(p){
    if(location.hash!==tg.hash){ tg.hash = location.hash; tg.st = p.parts[0]||''; tg.days = '3'; }
    var st = tg.st, first = ['nudge','Nudge'], msgs = '<span class="tg-day">Today</span>'+
      bubble(Q.esc(N.telegram), false, '09:00', kb([first,['replied','Already replied'],['snooze','Snooze']], !!st));
    if(st==='replied') msgs += bubble('Already replied', true, '09:02')+bubble('Got it. Log what they said in Quotient.', false, '09:02', kb([['open','Open case #398']]));
    if(st==='snooze' || st==='snoozed') msgs += bubble('Snooze', true, '09:02')+bubble('Snooze case #398 for how long?', false, '09:02', kb([['d1','1 day'],['d3','3 days']], st==='snoozed'));
    if(st==='snoozed') msgs += bubble(tg.days==='1'?'1 day':'3 days', true, '09:03')+bubble('Snoozed. We\'ll remind you on '+SNOOZE[tg.days]+'.', false, '09:03');
    var logo = (QD.a && QD.a.logo && QD.a.logo.telegram) || '<span class="tg-ava">'+Q.icon('bell')+'</span>';
    var phone = '<div class="tg-phone" role="region" aria-label="Telegram chat mock"><div class="tg-top">'+Q.icon('back')+logo+'<div><b>Quotient reminders</b><small>bot · '+Q.esc(BOT)+'</small></div></div>'+
      '<div class="tg-chat" aria-live="polite">'+msgs+'</div><div class="tg-bar"><span>Message</span>'+Q.icon('mic')+'</div></div>';
    return '<div class="page">'+demo('telegram', [['','Reminder'],['snooze','Snooze: how long?'],['snoozed','Snoozed'],['replied','Already replied']], st)+
      '<div class="tg" style="margin-top:var(--s-6)"><div class="tg-copy"><p class="eyebrow">Telegram reminder · on your phone</p><h1 class="h1 display">A nudge reminder, with no names</h1>'+
      '<p class="lede">After the follow-up wait, Quotient reminds you on Telegram. The message carries the case number only.</p>'+
      '<ul><li>Never a client name, phone number or plan detail in Telegram.</li><li><b>Nudge</b> opens the draft in Quotient. Names are filled in on your device after you sign in.</li><li><b>Already replied</b> and <b>Snooze</b> answer right in the chat.</li></ul>'+
      '<p class="small muted">Wait set to '+D.adviser.waitDays+' days in <a href="#prefs">Settings</a>.</p></div>'+phone+'</div></div>';
  }
  function mountTg(el){
    el.querySelector('.page').addEventListener('click', function(e){
      var b = e.target.closest('[data-tg]'); if(!b || b.disabled) return;
      var v = b.dataset.tg;
      if(v==='nudge') return Q.go('#nudge-priya');
      if(v==='open') return Q.go('#nudge-priya-reply');
      if(v==='replied') tg.st = 'replied';
      if(v==='snooze') tg.st = 'snooze';
      if(v==='d1' || v==='d3'){ tg.days = v.slice(1); tg.st = 'snoozed'; D.cases.priya.snoozedTo = SNOOZE[tg.days]; delete D.cases.priya.nudged; }
      Q.refresh();
    });
  }
  Q.screen('telegram', { title:'Telegram reminder', nav:'today', render:renderTg, mount:mountTg });
})();
