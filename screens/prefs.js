/* S19 Settings (#prefs). Builder A. One page, no primary button: each row saves on change with a quiet "Saved".
   Edition section differs for web and desktop (Q.edition()). States via ?state= : disconnect | loading | error */
(function(){
  'use strict';
  var D = Q.data, A = QD.a, ad = D.adviser;
  var pf = { cal:true, outlook:false, tg:true, digest:true };
  var autoOpened = false;
  Q.on('render', function(r){ if(r.id!=='prefs') autoOpened = false; });


  function sec(id, title, hint, body){
    return '<section class="pf-sec rise" aria-labelledby="pf-'+id+'"><header><div class="pf-h"><h2 id="pf-'+id+'">'+title+'</h2>'+
      '<span class="pf-saved" data-saved="'+id+'" role="status">'+Q.icon('check','i-sm')+'Saved</span></div>'+(hint?'<p class="hint">'+hint+'</p>':'')+'</header>'+
      '<div class="pf-body">'+body+'</div></section>';
  }
  function conn(logo, title, sub, chip, btn){
    return '<div class="pf-conn">'+logo+'<span class="who"><b>'+title+'</b><small>'+sub+'</small></span>'+chip+btn+'</div>';
  }
  var on = '<span class="chip chip-ok chip-dot desk-only">Connected</span>';
  function dayLine(d){ return 'Remind me <b class="num">'+d+' day'+(d>1?'s':'')+'</b> after I share.'; }

  function render(p){
    var web = p.edition!=='desktop';
    var head = '<header class="page-head rise"><div><h1 class="h1">Settings</h1><p class="sub">Changes save as you go.</p></div></header>';
    if(p.state==='loading') return '<div class="page pf">'+head+'<div class="pf-list" aria-busy="true">'+[1,2,3,4].map(function(){
      return '<div class="pf-sec"><span class="skel" style="width:60%"></span><div class="stack" style="gap:12px"><span class="skel skel-lg" style="width:80%"></span><span class="skel" style="width:50%"></span></div></div>'; }).join('')+'</div></div>';
    var banner = p.state==='error' ? '<div class="banner banner-error rise" role="alert" style="margin-bottom:var(--s-6)">'+Q.icon('alert')+'<p>Can\'t reach Quotient. Your last change didn\'t save.</p><button class="btn-link" data-toast="Saved">Try again</button></div>' : '';

    var account = sec('acct','Account','',
      '<dl class="pf-rows"><dt>Name</dt><dd>'+Q.esc(ad.name)+'</dd><dt>Email</dt><dd>'+Q.esc(ad.email)+'</dd><dt>Firm</dt><dd>'+Q.esc(ad.firm)+'</dd><dt>Sign-in</dt><dd>Signed in with '+Q.esc(ad.signin)+'</dd></dl>'+
      '<div><a class="btn btn-secondary" href="#signin">Sign out</a></div>');

    var calendar = sec('cal','Calendar','Your meetings show up in Quotient.',
      '<div class="pf-stack">'+
      (pf.cal ? conn(A.logo.google,'Google Calendar',Q.esc(ad.email),on,'<button class="btn btn-secondary btn-sm" data-act="cal-off">Disconnect</button>')
              : conn(A.logo.google,'Google Calendar','Not connected','','<button class="btn btn-secondary btn-sm" data-act="cal-on">Connect Google Calendar</button>'))+
      (pf.outlook ? conn(A.logo.microsoft,'Microsoft Outlook',Q.esc(ad.email),on,'<button class="btn btn-secondary btn-sm" data-act="ol-off">Disconnect</button>')
                  : conn(A.logo.microsoft,'Microsoft Outlook','Not connected','','<button class="btn btn-secondary btn-sm" data-act="ol-on">Connect Microsoft Outlook</button>'))+
      '</div>');

    var telegram = sec('tg','Telegram','Reminders show case numbers and initials, never full client names.',
      (pf.tg ? conn(A.logo.telegram,'Connected · '+Q.esc(ad.telegram),'Reminders from '+A.bot,'','<button class="btn btn-secondary btn-sm" data-act="tg-off">Disconnect</button>')
             : conn(A.logo.telegram,'Not connected','Get follow-up reminders on your phone','','<button class="btn btn-secondary btn-sm" data-act="tg-on">Connect Telegram</button>'))+
      '<p class="hint phone-only">Reminders show case numbers and initials, never full client names.</p>');

    function sw(id, on, text){ return '<label class="switch"><input type="checkbox" id="'+id+'"'+(on?' checked':'')+'> '+text+'</label>'; }
    var wait = sec('wait','Gentle timing','When we remind you to follow up. Never pushy, never late at night.',
      '<div class="fu-tm">'+
      '<div class="fu-tm-row"><span class="label" id="pf-wait-l">Wait after sharing</span><div>'+
        '<div class="pf-days" role="group" aria-labelledby="pf-wait-l">'+[1,2,3,4,5,6,7].map(function(i){
          return '<button aria-pressed="'+(i===ad.waitDays)+'" data-day="'+i+'" aria-label="'+i+' day'+(i>1?'s':'')+'">'+i+'</button>'; }).join('')+'</div>'+
        '<p class="pf-line" id="pf-dayline" aria-live="polite">'+dayLine(ad.waitDays)+'</p></div></div>'+
      '<div class="fu-tm-row"><label class="label" for="pf-rt">Reminder time</label><div class="fu-tm-ctl">'+
        '<select class="select" id="pf-rt">'+['8:00','8:30','9:00','9:30','10:00'].map(function(t){ return '<option'+(t===ad.remindTime?' selected':'')+'>'+t+'</option>'; }).join('')+'</select>'+
        sw('pf-wd', ad.weekdaysOnly, 'Weekdays only')+'</div></div>'+
      '<div class="fu-tm-row"><span class="label">Quiet hours</span><div class="fu-tm-ctl">'+sw('pf-q21', ad.quietAfter21, 'Never after 21:00')+sw('pf-qsun', ad.quietSunday, 'Never on Sunday')+'</div></div>'+
      '<div class="fu-tm-row"><label class="label" for="pf-max">Nudges per client</label><div class="fu-tm-ctl"><select class="select" id="pf-max">'+[1,2,3].map(function(n){
          return '<option value="'+n+'"'+(n===(ad.nudgeMax||2)?' selected':'')+'>'+n+'</option>'; }).join('')+'</select>'+
        '<span class="pf-line">at most, then mark the case quiet and stop.</span></div></div>'+
      '</div><p class="hint">'+Q.icon('info','i-sm')+' Per-client timing notes are set on each case.</p>');

    var digest = sec('dg','Morning digest','Today\'s meetings and who needs you, in one notification.',
      '<label class="switch"><input type="checkbox" id="pf-dg"'+(pf.digest?' checked':'')+'> Send me a morning digest</label>'+
      '<div class="pf-time"><label class="label" for="pf-time">Time</label><select class="select" id="pf-time"'+(pf.digest?'':' disabled')+'>'+A.digestTimes.map(function(t){
        return '<option'+(t===ad.digestTime?' selected':'')+'>'+t+'</option>'; }).join('')+'</select></div>'+
      '<p class="small device-line">'+Q.icon('device','i-sm')+' Shown on this device only. <a href="#digest">See an example</a></p>');

    var edition = sec('ed','Edition','',
      (web ? '<p class="pf-line">You\'re using the web app. The desktop app adds call audio.</p>'+
             '<div class="pf-dl"><button class="btn btn-secondary" data-toast="Downloading Quotient for Mac">'+Q.icon('device','i-sm')+'Download for Mac</button>'+
             '<button class="btn btn-secondary" data-toast="Downloading Quotient for Windows">'+Q.icon('device','i-sm')+'Download for Windows</button></div>'
           : '<p class="pf-line"><b>Desktop app · version '+A.version+'</b></p><p class="hint">Call audio is available on each meeting. It starts off every time.</p>')+
      '<div class="pf-proto"><span>Prototype only · Preview as</span><div class="seg"><button data-ed="web" aria-pressed="'+web+'">Web</button><button data-ed="desktop" aria-pressed="'+!web+'">Desktop</button></div></div>');

    return '<div class="page pf">'+head+banner+'<div class="pf-list">'+account+calendar+telegram+wait+digest+edition+'</div></div>';
  }

  function saved(pg, id){
    var s = pg.querySelector('[data-saved="'+id+'"]'); if(!s) return;
    s.classList.add('on'); clearTimeout(s._t); s._t = setTimeout(function(){ s.classList.remove('on'); }, 2000);
  }
  function refreshSaved(id){ Q.refresh(); var pg = document.querySelector('#screen .page'); if(pg) saved(pg, id); }

  function disconnect(kind){
    var cal = kind==='cal' || kind==='ol', name = kind==='cal' ? 'Google Calendar' : kind==='ol' ? 'Microsoft Outlook' : 'Telegram';
    return Q.dialog({ title:'Disconnect '+name+'?',
      body:'<p>'+(cal?'Meetings will stop updating. Your cases stay.':'Reminders will stop. Your cases stay.')+'</p>',
      actions:[{label:'Cancel',value:'no',kind:'secondary'},{label:'Disconnect',value:'yes',kind:'danger'}], safe:'no' })
    .then(function(v){ if(v!=='yes') return; pf[kind==='ol'?'outlook':kind] = false; refreshSaved(cal?'cal':'tg'); });
  }
  Q.screen('prefs', {
    title:'Settings', nav:'prefs',
    render:render,
    mount:function(el, p){
      var pg = el.querySelector('.page'); if(!pg) return;
      pg.addEventListener('click', function(e){
        var d = e.target.closest('[data-day]');
        if(d){ ad.waitDays = +d.dataset.day;
          pg.querySelectorAll('[data-day]').forEach(function(b){ b.setAttribute('aria-pressed', String(b===d)); });
          pg.querySelector('#pf-dayline').innerHTML = dayLine(ad.waitDays); saved(pg,'wait'); return; }
        var ed = e.target.closest('[data-ed]'); if(ed){ Q.edition(ed.dataset.ed); return; }
        var a = e.target.closest('[data-act]'); if(!a) return;
        var act = a.dataset.act;
        if(act==='cal-off') disconnect('cal');
        if(act==='ol-off') disconnect('ol');
        if(act==='tg-off') disconnect('tg');
        if(act==='cal-on'){ pf.cal = true; refreshSaved('cal'); }
        if(act==='ol-on'){ pf.outlook = true; refreshSaved('cal'); }
        if(act==='tg-on'){ pf.tg = true; refreshSaved('tg'); }
      });
      pg.addEventListener('change', function(e){
        if(e.target.id==='pf-dg'){ pf.digest = e.target.checked; pg.querySelector('#pf-time').disabled = !pf.digest; saved(pg,'dg'); }
        if(e.target.id==='pf-time'){ ad.digestTime = e.target.value; saved(pg,'dg'); }
        var tm = { 'pf-rt':'remindTime', 'pf-wd':'weekdaysOnly', 'pf-q21':'quietAfter21', 'pf-qsun':'quietSunday', 'pf-max':'nudgeMax' }[e.target.id];
        if(tm){ ad[tm] = e.target.type==='checkbox' ? e.target.checked : tm==='nudgeMax' ? +e.target.value : e.target.value; saved(pg,'wait'); }
      });
      if(!autoOpened && p.state==='disconnect'){ autoOpened = true; disconnect('cal'); }
    }
  });
})();
