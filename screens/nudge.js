/* S16 Follow-up nudge (#nudge-<case>[-<state>]) and S16t reminder notification mock (#reminder[-<state>]). Phone-first.
   Nudge states: nodraft, default (client card + draft), sent, snoozed, reply (log a reply), quiet (max nudges reached).
   "Send on WhatsApp" opens a click-to-chat link (Q.waLink) with the draft typed in; the rep presses Send. Quotient never sends.
   Reminders are Quotient's own notifications: case number only. */
(function(){
  'use strict';
  var D = Q.data, N = D.nudge, ui = { hash:null }, rm = { hash:null };
  var SNOOZE = { '1':'Wed 4 Nov', '3':'Fri 6 Nov' }; // today is Tue 3 Nov
  var SVG = function(d){ return '<svg class="i i-sm" viewBox="0 0 24 24" aria-hidden="true">'+d+'</svg>'; };
  var I_COPY = SVG('<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h8"/>');
  var I_CHAT = SVG('<path d="M20.5 12a8.5 8.5 0 0 1-12.4 7.5L3.5 20.5l1.1-4.4A8.5 8.5 0 1 1 20.5 12z"/>');

  function demo(base, list, cur){
    return '<nav class="switcher" aria-label="Demo states"><span class="eyebrow">Demo states</span><div class="switcher-chips">'+list.map(function(x){
      return '<button class="chip" data-go="#'+base+(x[0]?'-'+x[0]:'')+'" aria-pressed="'+(x[0]===cur)+'">'+x[1]+'</button>'; }).join('')+'</div></nav>';
  }
  function letters(name){ return name.split(' ').map(function(w){ return w.charAt(0).toUpperCase(); }).join(''); }
  function maxN(){ return D.adviser.nudgeMax || 2; }
  function sentWhat(c){
    var d = c.shareSent || c.dates.shared;
    return d ? (c.shareSent ? 'Revised comparison PDF' : 'Comparison PDF')+' · <span class="fu-nw">sent '+Q.esc(d)+'</span>' : 'Nothing shared yet';
  }
  /* Draft in UPDATE-2 style. Named drafts live in data.js; the rest use the client's own worry and page 1 of what was sent. */
  function draftFor(key, c){
    if(N.drafts && N.drafts[key]) return N.drafts[key];
    if(key===N.c) return N.draft;
    return 'Hi '+c.first+'! '+(Q.worry(c) ? 'You said "'+Q.worry(c)+'" matters most to you. ' : '')+
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
        fact('Worry', Q.worry(c) ? '<q>'+Q.esc(Q.worry(c))+'</q>' : '', 'fu-worry')+
        fact('Your note', c.timing ? Q.esc(c.timing)+'<span class="fu-q"> · quiet after 21:00</span>' : '<span class="muted">No timing note</span>')+
      '</dl>'+
      '<div class="fu-foot"><span class="fu-count"><span class="fu-dots" aria-hidden="true">'+dots+'</span>'+(quiet ? maxN()+' of '+maxN()+' nudges sent · case quiet' : 'Nudge '+no+' of '+maxN())+'</span>'+
        '<a class="fu-open" href="#case-'+key+'">Open full case'+Q.icon('next','i-sm')+'</a></div></section>';
  }

  /* ---------- S16 Nudge ---------- */
  function render(p){
    var key = D.cases[p.parts[0]] ? p.parts[0] : 'priya', c = D.cases[key];
    if(location.hash!==ui.hash){ ui.hash = location.hash; var s0 = p.parts[1]==='three' ? 'quiet' : p.parts[1];
      ui.st = s0==='draft' ? '' : s0 || (c.quiet ? 'quiet' : c.nudged ? 'sent' : c.snoozedTo ? 'snoozed' : ''); ui.snooze = '1'; ui.draft = draftFor(key, c); ui.asked = false; ui.cal = false; }
    var st = p.state==='empty' ? 'nodraft' : p.state==='error' ? 'error' : p.state==='loading' ? 'loading' : ui.st;
    var chips = demo('nudge-'+key, [['nodraft','No draft yet'],['draft','Draft'],['sent','Sent'],['snoozed','Snoozed'],['reply','Log a reply'],['quiet','Case quiet']], ui.st || 'draft');
    var head = '<header><a class="back" href="#case-'+key+'">'+Q.icon('back','i-sm')+'Back to '+Q.esc(c.name)+'</a>'+
      '<h1 class="h1 display">Follow up with '+Q.esc(c.first)+'</h1>'+
      '<p class="ng-sub"><span class="num">#'+c.no+'</span><span class="dot-sep"></span>no reply for '+(c.quietDays||3)+' days</p></header>';
    var top = '', body, card = clientCard(key, c, st==='quiet');
    if(st==='snoozed') top = '<div class="banner" role="status">'+Q.icon('bell')+'<p>Snoozed until '+(c.snoozedTo||SNOOZE[ui.snooze])+'. We\'ll remind you then.</p><button class="btn-link" data-act="unsnooze">Undo</button></div>';
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
        '<p class="ng-route">'+I_CHAT+'<span>'+(c.mobile ? 'Opens '+Q.esc(c.first)+'\'s WhatsApp chat' : 'WhatsApp will ask you to pick the chat')+'</span>'+
          '<button type="button" class="btn-link" data-act="copy">'+I_COPY+'Copy</button></p>'+
        '<div class="fu-ask" role="status"'+(ui.asked?'':' hidden')+'><p><b>Sent it on WhatsApp?</b> We can\'t see your chats, so tell us once it\'s sent.</p>'+
          '<div class="row"><button class="btn btn-secondary btn-sm" data-act="sent">'+Q.icon('check','i-sm')+'Yes, sent</button><button class="btn btn-ghost btn-sm" data-act="notyet">Not yet</button></div></div></section>'+
        '<div class="ng-acts"><a class="btn btn-primary" data-act="wa" href="'+Q.esc(Q.waLink(c, ui.draft))+'" target="_blank" rel="noopener">'+I_CHAT+'Send on WhatsApp</a>'+
          '<a class="btn-link ng-email" data-act="email" href="'+Q.esc(mailto(key, c, ui.draft))+'">Email instead</a></div>'+
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

  function mailto(key, c, text){
    var to = (QD.c && QD.c.emails && QD.c.emails[key]) || '';
    return 'mailto:'+to+'?subject='+encodeURIComponent('Following up · '+c.first)+'&body='+encodeURIComponent(text);
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
    var ta = pg.querySelector('#ng-txt'), wa = pg.querySelector('[data-act="wa"]'), em = pg.querySelector('[data-act="email"]');
    if(ta) ta.addEventListener('input', function(){ ui.draft = ta.value; ta.removeAttribute('aria-invalid');
      if(wa) wa.href = Q.waLink(c, ui.draft); if(em) em.href = mailto(key, c, ui.draft); }); // links always carry the edited draft
    function ask(by){ ui.asked = true; var a = pg.querySelector('.fu-ask'); if(a){ a.hidden = false; a.querySelector('b').textContent = 'Sent it '+(by==='email'?'by email':'on WhatsApp')+'?'; } }
    pg.addEventListener('click', function(e){
      var sz = e.target.closest('[data-snooze]'); if(sz){ ui.snooze = sz.dataset.snooze; ui.st = 'snoozed'; c.snoozedTo = SNOOZE[ui.snooze]; delete c.nudged; Q.refresh(); Q.toast('Snoozed until '+SNOOZE[ui.snooze]); return; }
      var a = e.target.closest('[data-act]'); if(!a) return;
      var act = a.dataset.act;
      if(act==='copy' || act==='wa' || act==='email'){
        if(!ui.draft.trim()){ e.preventDefault(); ta.setAttribute('aria-invalid','true'); ta.focus(); return; }
        if(act==='copy') copyText(ui.draft, ta); // wa / email: the real link opens; we only ask afterwards
        ask(act); return;
      }
      if(act==='notyet'){ ui.asked = false; pg.querySelector('.fu-ask').hidden = true; return; }
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

  /* ---------- S16t Reminder: Quotient's own phone notification (Update 2e). Case numbers only. ---------- */
  function renderRm(p){
    if(location.hash!==rm.hash){ rm.hash = location.hash; rm.st = p.parts[0]||''; rm.days = '3'; }
    var c = D.cases[N.c], ad = D.adviser, st = rm.st, after = '';
    if(st==='snooze') after = '<div class="rm-pick" role="group" aria-label="Snooze for how long?"><button type="button" class="btn btn-secondary btn-sm" data-rn="d1">1 day</button><button type="button" class="btn btn-secondary btn-sm" data-rn="d3">3 days</button></div>';
    if(st==='snoozed') after = '<p class="rm-done" role="status">'+Q.icon('bell','i-sm')+'Snoozed. We\'ll remind you on '+SNOOZE[rm.days]+'.</p>';
    if(st==='replied') after = '<p class="rm-done" role="status">'+Q.icon('check','i-sm')+'Got it. No more reminders for case #'+c.no+'.</p>';
    var phone = '<div class="rm-phone" role="region" aria-label="Phone lock screen mock"><div class="rm-lock"><span class="rm-day">'+Q.esc(D.today.long)+'</span><span class="rm-time num">09:00</span></div>'+
      '<div class="rm-stack" aria-live="polite">'+Q.notice(c, { live:true, used:!!st, time:'09:00' })+after+'</div></div>';
    var when = ad.remindTime+(ad.weekdaysOnly?' on weekdays':'')+(ad.quietAfter21?', never after 21:00':'')+(ad.quietSunday?' or on Sunday':'');
    return '<div class="page">'+demo('reminder', [['','Reminder'],['snooze','Snooze: how long?'],['snoozed','Snoozed'],['replied','Already replied']], st)+
      '<div class="rm" style="margin-top:var(--s-6)"><div class="rm-copy"><p class="eyebrow">Reminder · on your phone</p><h1 class="h1 display">A reminder with no names</h1>'+
      '<p class="lede">After the follow-up wait, Quotient sends you its own notification. It carries the case number only.</p>'+
      '<ul><li>Case numbers only. Never a client name, phone number or plan detail.</li><li><b>Open</b> opens the client card and the drafted message, after you sign in.</li><li><b>Already replied</b> and <b>Snooze</b> answer right from the notification.</li><li>The same reminders show on Today and in your morning digest.</li></ul>'+
      '<p class="small muted">Sent at '+Q.esc(when)+'. Wait set to '+ad.waitDays+' days. Change it in <a href="#prefs">Settings</a>.</p></div>'+phone+'</div></div>';
  }
  function mountRm(el){
    el.querySelector('.page').addEventListener('click', function(e){
      var b = e.target.closest('[data-rn]'); if(!b || b.disabled) return;
      var v = b.dataset.rn, c = D.cases[N.c];
      if(v==='open') return Q.go('#nudge-'+N.c+(c.nudged && !c.quiet ? '-draft' : '')); // after a sent nudge, the reminder opens the next draft
      if(v==='replied') rm.st = 'replied';
      if(v==='snooze') rm.st = 'snooze';
      if(v==='d1' || v==='d3'){ rm.days = v.slice(1); rm.st = 'snoozed'; c.snoozedTo = SNOOZE[rm.days]; delete c.nudged; }
      Q.refresh();
    });
  }
  Q.screen('reminder', { title:'Reminder', nav:'today', render:renderRm, mount:mountRm });
})();
