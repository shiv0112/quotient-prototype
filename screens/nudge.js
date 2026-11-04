/* S16 Follow-up nudge (#nudge-<case>[-<state>]) and S16t Telegram reminder mock (#telegram[-<state>]). Phone-first.
   Nudge states: nodraft, default (client card + draft), sent, snoozed, reply (log a reply), quiet (max nudges reached).
   The rep copies the draft and sends it from their own WhatsApp. No bot. Telegram text: case number and initials only. */
(function(){
  'use strict';
  var D = Q.data, N = D.nudge, ui = { hash:null }, tg = { hash:null };
  var SNOOZE = { '1':'Wed 4 Nov', '3':'Fri 6 Nov' }; // today is Tue 3 Nov
  var BOT = (QD.a && QD.a.bot) || '@QuotientRemindBot';
  var SVG = function(d){ return '<svg class="i i-sm" viewBox="0 0 24 24" aria-hidden="true">'+d+'</svg>'; };
  var I_COPY = SVG('<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h8"/>');
  var I_CHAT = SVG('<path d="M20.5 12a8.5 8.5 0 0 1-12.4 7.5L3.5 20.5l1.1-4.4A8.5 8.5 0 1 1 20.5 12z"/>');

  function demo(base, list, cur){
    return '<nav class="switcher" aria-label="Demo states"><span class="eyebrow">Demo states</span><div class="switcher-chips">'+list.map(function(x){
      return '<button class="chip" data-go="#'+base+(x[0]?'-'+x[0]:'')+'" aria-pressed="'+(x[0]===cur)+'">'+x[1]+'</button>'; }).join('')+'</div></nav>';
  }
  function letters(name){ return name.split(' ').map(function(w){ return w.charAt(0).toUpperCase(); }).join(''); }
  function initials(name){ return letters(name).split('').join('.')+'.'; } // "P.K.": Telegram never carries a full name
  function maxN(){ return D.adviser.nudgeMax || 2; }
  function sentWhat(c){
    var d = c.shareSent || c.dates.shared;
    return d ? (c.shareSent ? 'Revised comparison PDF' : 'Comparison PDF')+' · <span class="fu-nw">sent '+Q.esc(d)+'</span>' : 'Nothing shared yet';
  }
  /* Draft in UPDATE-2 style. Named drafts live in data.js; the rest use the client's own worry and page 1 of what was sent. */
  function draftFor(key, c){
    if(N.drafts && N.drafts[key]) return N.drafts[key];
    if(key===N.c) return N.draft;
    return 'Hi '+c.first+'! '+(c.worry && c.worry!=='Not sure yet' ? 'You said "'+c.worry+'" matters most to you. ' : '')+
      'Page 1 of the comparison shows the cover and premium for each plan side by side. Happy to go through it on a call whenever suits you, no pressure to decide.';
  }

  function clientCard(key, c, quiet){
    var no = quiet ? maxN()+1 : Math.min(c.nudgeNo || 1, maxN()), dots = '';
    for(var i=1;i<=maxN();i++) dots += '<i'+(i<no?' class="done"':i===no?' class="now"':'')+'></i>';
    var who = [c.age ? c.age : '', c.job, c.family].filter(Boolean).map(Q.esc).join('<span class="dot-sep"></span>');
    function fact(k, v, cls){ return v ? '<div'+(cls?' class="'+cls+'"':'')+'><dt>'+k+'</dt><dd>'+v+'</dd></div>' : ''; }
    return '<section class="card fu-client" aria-labelledby="fu-name">'+
      '<div class="fu-who"><span class="fu-ava" aria-hidden="true">'+letters(c.name)+'</span>'+
        '<div class="fu-id"><h2 id="fu-name">'+Q.esc(c.name)+' <span class="fu-no num">#'+c.no+'</span></h2>'+(who?'<p>'+who+'</p>':'')+'</div></div>'+
      '<dl class="fu-facts">'+
        fact('Sent', Q.icon('file','i-sm')+'<span>'+sentWhat(c)+'</span>')+
        fact('Goal', c.goal ? Q.esc(c.goal) : '')+
        fact('Worry', c.worry ? '<q>'+Q.esc(c.worry)+'</q>' : '', 'fu-worry')+
        fact('Your note', c.timing ? Q.esc(c.timing)+'<span class="fu-q"> · quiet after 21:00</span>' : '<span class="muted">No timing note</span>')+
      '</dl>'+
      '<div class="fu-foot"><span class="fu-count"><span class="fu-dots" aria-hidden="true">'+dots+'</span>'+(quiet ? maxN()+' of '+maxN()+' nudges sent · case quiet' : 'Nudge '+no+' of '+maxN())+'</span>'+
        '<a class="fu-open" href="#case-'+key+'">Open full case'+Q.icon('next','i-sm')+'</a></div></section>';
  }

  /* ---------- S16 Nudge ---------- */
  function render(p){
    var key = D.cases[p.parts[0]] ? p.parts[0] : 'priya', c = D.cases[key];
    if(location.hash!==ui.hash){ ui.hash = location.hash; var s0 = p.parts[1]==='three' ? 'quiet' : p.parts[1];
      ui.st = s0==='draft' ? '' : s0 || (c.quiet ? 'quiet' : c.nudged ? 'sent' : c.snoozedTo ? 'snoozed' : ''); ui.snooze = '1'; ui.draft = draftFor(key, c); ui.copied = false; ui.cal = false; }
    var st = p.state==='empty' ? 'nodraft' : p.state==='error' ? 'error' : p.state==='loading' ? 'loading' : ui.st;
    var chips = demo('nudge-'+key, [['nodraft','No draft yet'],['draft','Draft'],['sent','Sent'],['snoozed','Snoozed'],['reply','Log a reply'],['quiet','Case quiet']], ui.st || 'draft');
    var head = '<header><a class="back" href="#case-'+key+'">'+Q.icon('back','i-sm')+'Back to '+Q.esc(c.name)+'</a>'+
      '<h1 class="h1 display">Follow up with '+Q.esc(c.first)+'</h1>'+
      '<p class="ng-sub"><span class="num">#'+c.no+'</span><span class="dot-sep"></span>no reply for '+(c.quietDays||3)+' days</p></header>';
    var top = '', body, card = clientCard(key, c, st==='quiet');
    if(st==='snoozed') top = '<div class="banner" role="status">'+Q.icon('bell')+'<p>Snoozed until '+(c.snoozedTo||SNOOZE[ui.snooze])+'. We\'ll remind you on Telegram.</p><button class="btn-link" data-act="unsnooze">Undo</button></div>';
    if(st==='error') top = '<div class="banner banner-error" role="alert">'+Q.icon('alert')+'<p>Couldn\'t draft the nudge. Nothing else was sent.</p><button class="btn-link" data-go="#gate-'+key+'">Try again</button></div>';

    if(st==='nodraft' || st==='error') body = card+'<section class="card hero ng-hero" aria-labelledby="ng-d"><p class="eyebrow">Follow-up</p><h2 id="ng-d">Draft a short nudge for '+Q.esc(c.first)+'</h2>'+
      '<p>Only '+Q.esc(c.first)+'\'s worry, one page of what you sent and placeholders like <span class="ph">[CLIENT]</span> are sent. Names go back in on this device.</p>'+
      '<div><a class="btn btn-primary" href="#gate-'+key+'">Draft a nudge'+Q.icon('arrow','i-sm')+'</a></div></section>';
    else if(st==='loading') body = '<div class="card" aria-busy="true"><span class="skel" style="width:30%"></span><span class="skel skel-lg" style="width:100%;margin-top:16px;height:96px"></span></div>';
    else if(st==='sent'){
      var n = c.nudgesSent || 1, quiet = !!c.quiet;
      body = '<div class="banner banner-success" role="status">'+Q.icon('check')+'<p>'+(quiet
          ? 'Nudge '+n+' of '+maxN()+' sent. That\'s the last one: case #'+c.no+' is now quiet and reminders stop.'
          : 'Nudge '+n+' of '+maxN()+' sent · next reminder '+((c.nudged&&c.nudged.next)||N.next))+'</p></div>'+
        '<section class="card ng-draft" aria-labelledby="ng-s"><h2 class="h3" id="ng-s">What you sent · '+D.today.date+'</h2><p class="ng-sent">'+Q.esc(ui.draft)+'</p>'+
        '<p class="ng-log">'+Q.icon('device','i-sm')+'Sent from your own WhatsApp. We only note that you sent it.</p></section>'+
        '<section class="card fu-cal" aria-labelledby="fu-cal-h"><span class="fu-cal-ico" aria-hidden="true">'+Q.icon('meetings')+'</span>'+
          '<div><h2 class="h3" id="fu-cal-h">Add the follow-up to your calendar</h2><p>'+(quiet?'Thu 19 Nov':N.next)+', 9:00 · the event links back to case #'+c.no+'.</p></div>'+
          (ui.cal ? '<span class="chip chip-ok chip-dot">Added</span>' : '<button class="btn btn-secondary" data-act="cal">Add follow-up to Google Calendar</button>')+'</section>'+
        '<div class="ng-acts"><a class="btn btn-primary" href="#case-'+key+'">Done</a><button class="btn btn-secondary" data-act="reply">Log a reply</button></div>';
    }
    else if(st==='quiet') body = card+'<section class="card fu-quiet" aria-labelledby="fu-q"><p class="eyebrow">Case quiet</p><h2 class="h3" id="fu-q">'+maxN()+' nudges sent, so we stopped reminding you</h2>'+
        '<p>That\'s the limit you set in <a href="#prefs">Settings</a>. '+Q.esc(c.first)+' may just be busy. You can still reach out any time, or log a reply if one comes in.</p>'+
        '<div class="row"><button class="btn btn-secondary" data-act="reply">Log a reply</button><button class="btn btn-secondary" data-act="wake">Nudge once more</button><button class="btn btn-ghost" data-act="lost">Mark lost</button></div></section>'+
      '<div class="ng-acts"><a class="btn btn-primary" href="#case-'+key+'">Done</a></div>';
    else if(st==='reply') body = '<section class="card ng-draft" aria-labelledby="ng-r"><h2 class="h3" id="ng-r">What did '+Q.esc(c.first)+' say?</h2>'+
      '<div class="ng-opts" role="radiogroup" aria-labelledby="ng-r">'+['Wants to go ahead','Has questions','Wants a revised quote','Not interested'].map(function(o,i){
        return '<label class="check"><input type="radio" name="ng-why" value="'+o+'"'+(i===1?' checked':'')+'> '+o+'</label>'; }).join('')+'</div>'+
      '<div class="field"><label class="label" for="ng-note">Note <span class="muted" style="font-weight:400">(optional)</span></label><textarea class="textarea" id="ng-note" rows="3" placeholder="What they asked or said"></textarea></div></section>'+
      '<div class="ng-acts"><button class="btn btn-primary" data-act="savereply">Save reply</button><button class="btn btn-ghost" data-act="back">Cancel</button></div>';
    else {
      body = card+'<section class="card ng-draft" aria-labelledby="ng-l"><div class="fu-dhead"><label class="h3" id="ng-l" for="ng-txt">Your message</label><span class="small muted">Edit anything</span></div>'+
        '<textarea class="textarea" id="ng-txt" rows="6">'+Q.esc(ui.draft)+'</textarea>'+
        '<p class="ng-from"><span class="chip chip-device">'+Q.icon('device','i-sm')+'<span>Drafted from '+Q.esc(c.first)+'\'s worry + one page of what you sent, with <b>[CLIENT]</b> · names added on this device</span></span><a href="#sent-'+key+'">See what was sent</a></p>'+
        '<div class="fu-ask" role="status"'+(ui.copied?'':' hidden')+'><p><b>Sent it in WhatsApp?</b> We can\'t see your chats, so tell us once it\'s sent.</p>'+
          '<div class="row"><button class="btn btn-secondary btn-sm" data-act="sent">'+Q.icon('check','i-sm')+'Yes, sent</button><button class="btn btn-ghost btn-sm" data-act="notyet">Not yet</button></div></div></section>'+
        '<div class="ng-acts"><button class="btn btn-primary" data-act="copy">'+I_COPY+'Copy message</button><button class="btn btn-secondary" data-act="wa">'+I_CHAT+'Open WhatsApp chat</button></div>'+
        '<div class="fu-more"><button class="btn btn-secondary" data-act="replied">Already replied</button>'+
          '<div class="menu"><button class="btn btn-secondary" data-menu aria-haspopup="true" aria-expanded="false">'+Q.icon('bell','i-sm')+'Snooze</button><div class="menu-pop" role="menu">'+
            '<button role="menuitem" data-snooze="1">1 day · until '+SNOOZE['1']+'</button><button role="menuitem" data-snooze="3">3 days · until '+SNOOZE['3']+'</button></div></div>'+
          '<div class="menu"><button class="btn btn-ghost" data-menu aria-haspopup="true" aria-expanded="false" aria-label="More actions">'+Q.icon('more')+'<span class="desk-only">More</span></button><div class="menu-pop" role="menu">'+
            '<button role="menuitem" data-act="won">Mark won</button><button role="menuitem" class="danger" data-act="lost">Mark lost</button></div></div></div>';
    }
    return '<div class="page ng fu">'+chips+head+top+body+'</div>';
  }

  /* One nudge sent: count goes up; at the max the case goes quiet and reminders stop (Settings > Gentle timing). */
  function markSent(c){
    var n = c.nudgeNo || 1;
    c.nudgesSent = n; c.nudgeNo = n + 1; delete c.snoozedTo;
    c.quiet = n >= maxN();
    c.nudged = { on:D.today.date, next: c.quiet ? 'none · case quiet' : N.next };
  }

  // Copy synchronously first (works on file:// and keeps the click's user activation); the async API is the backup.
  function copyText(text, ta){
    var done = function(){ Q.toast('Copied. Paste it in WhatsApp.'); }, fail = function(){ Q.toast('Couldn\'t copy. Select the text and copy it.'); };
    try{ ta.select(); if(document.execCommand('copy')){ ta.setSelectionRange(0,0); ta.blur(); return done(); } }catch(e){}
    try{ if(navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(text).then(done, fail); }catch(e){}
    fail();
  }

  function mount(el, p){
    var key = D.cases[p.parts[0]] ? p.parts[0] : 'priya', c = D.cases[key], pg = el.querySelector('.page');
    var ta = pg.querySelector('#ng-txt'); if(ta) ta.addEventListener('input', function(){ ui.draft = ta.value; ta.removeAttribute('aria-invalid'); });
    function ask(){ ui.copied = true; var a = pg.querySelector('.fu-ask'); if(a) a.hidden = false; }
    pg.addEventListener('click', function(e){
      var sz = e.target.closest('[data-snooze]'); if(sz){ ui.snooze = sz.dataset.snooze; ui.st = 'snoozed'; c.snoozedTo = SNOOZE[ui.snooze]; delete c.nudged; Q.refresh(); Q.toast('Snoozed until '+SNOOZE[ui.snooze]); return; }
      var a = e.target.closest('[data-act]'); if(!a) return;
      var act = a.dataset.act;
      if(act==='copy' || act==='wa'){
        if(!ui.draft.trim()){ ta.setAttribute('aria-invalid','true'); ta.focus(); return; }
        if(act==='copy') copyText(ui.draft, ta);
        else Q.toast('Opening your WhatsApp chat with '+c.first+'. Paste the message there.');
        ask(); return;
      }
      if(act==='notyet'){ ui.copied = false; pg.querySelector('.fu-ask').hidden = true; return; }
      if(act==='sent'){ markSent(c); ui.st = 'sent'; Q.refresh(); Q.toast(c.quiet ? 'Nudge sent · case #'+c.no+' is now quiet' : 'Nudge sent · next reminder '+N.next); }
      if(act==='cal'){ ui.cal = true; Q.refresh(); Q.toast('Added to Google Calendar · links back to case #'+c.no); }
      if(act==='wake'){ c.quiet = false; c.nudgeNo = maxN(); delete c.nudged; ui.st = ''; Q.refresh(); }
      if(act==='unsnooze' || act==='back'){ if(act==='unsnooze') delete c.snoozedTo; ui.st = ''; Q.refresh(); }
      if(act==='replied' || act==='reply'){ ui.st = 'reply'; Q.refresh(); var r = document.querySelector('.ng input[type=radio]:checked'); if(r) r.focus(); }
      if(act==='savereply'){ var r2 = pg.querySelector('input[name=ng-why]:checked');
        if(c.now<3){ c.now = 3; c.dates.replied = D.today.date; } c.quiet = false;
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
    var c = D.cases[N.c], ad = D.adviser, st = tg.st;
    var text = '<b>Case #'+c.no+' · '+initials(c.name)+'</b><br>No reply for '+(c.quietDays||3)+' days since you shared. A draft nudge is ready.'+
      '<a class="tg-link" href="#nudge-'+N.c+'">'+Q.esc(N.link+c.no)+'</a>';
    var msgs = '<span class="tg-day">Today</span>'+bubble(text, false, '09:00', kb([['open','Open case'],['replied','Replied'],['snooze','Snooze']], !!st));
    if(st==='replied') msgs += bubble('Replied', true, '09:02')+bubble('Got it. No more reminders for case #'+c.no+'. Add what they said when you open the case.', false, '09:02', kb([['log','Open case #'+c.no]]));
    if(st==='snooze' || st==='snoozed') msgs += bubble('Snooze', true, '09:02')+bubble('Snooze case #'+c.no+' for how long?', false, '09:02', kb([['d1','1 day'],['d3','3 days']], st==='snoozed'));
    if(st==='snoozed') msgs += bubble(tg.days==='1'?'1 day':'3 days', true, '09:03')+bubble('Snoozed. We\'ll remind you on '+SNOOZE[tg.days]+'.', false, '09:03');
    var logo = (QD.a && QD.a.logo && QD.a.logo.telegram) || '<span class="tg-ava">'+Q.icon('bell')+'</span>';
    var phone = '<div class="tg-phone" role="region" aria-label="Telegram chat mock"><div class="tg-top">'+Q.icon('back')+logo+'<div><b>Quotient reminders</b><small>bot · '+Q.esc(BOT)+'</small></div></div>'+
      '<div class="tg-chat" aria-live="polite">'+msgs+'</div><div class="tg-bar"><span>Message</span>'+Q.icon('mic')+'</div></div>';
    var when = ad.remindTime+(ad.weekdaysOnly?' on weekdays':'')+(ad.quietAfter21?', never after 21:00':'')+(ad.quietSunday?' or on Sunday':'');
    return '<div class="page">'+demo('telegram', [['','Reminder'],['snooze','Snooze: how long?'],['snoozed','Snoozed'],['replied','Replied']], st)+
      '<div class="tg fu-tg" style="margin-top:var(--s-6)"><div class="tg-copy"><p class="eyebrow">Telegram reminder · on your phone</p><h1 class="h1 display">A reminder with no names</h1>'+
      '<p class="lede">After the follow-up wait, Quotient reminds you on Telegram. The message carries the case number and initials only.</p>'+
      '<ul><li>Case numbers only, plus initials. Never a full name, phone number or plan detail in Telegram.</li><li><b>Open case</b> opens the client card and the drafted message in Quotient, after you sign in.</li><li><b>Replied</b> and <b>Snooze</b> answer right in the chat.</li></ul>'+
      '<p class="small muted">Sent at '+Q.esc(when)+'. Wait set to '+ad.waitDays+' days. Change it in <a href="#prefs">Settings</a>.</p></div>'+phone+'</div></div>';
  }
  function mountTg(el){
    el.querySelector('.page').addEventListener('click', function(e){
      var b = e.target.closest('[data-tg]'); if(!b || b.disabled) return;
      var v = b.dataset.tg;
      if(v==='open'){ var c = D.cases[N.c]; return Q.go('#nudge-'+N.c+(c.nudged && !c.quiet ? '-draft' : '')); } // after a sent nudge, the reminder opens the next draft
      if(v==='log') return Q.go('#nudge-'+N.c+'-reply');
      if(v==='replied') tg.st = 'replied';
      if(v==='snooze') tg.st = 'snooze';
      if(v==='d1' || v==='d3'){ tg.days = v.slice(1); tg.st = 'snoozed'; D.cases[N.c].snoozedTo = SNOOZE[tg.days]; delete D.cases[N.c].nudged; }
      Q.refresh();
    });
  }
  Q.screen('telegram', { title:'Telegram reminder', nav:'today', render:renderTg, mount:mountTg });
})();
