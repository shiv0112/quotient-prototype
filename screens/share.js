/* S13 Share (#share-<case>[-<state>]). States: default (WhatsApp), email, making, sent (did-you-send prompt), error.
   WhatsApp is the default, "Email instead" the small secondary (Update 2e). Phone: system share sheet. Desktop: download the PDF and open
   the click-to-chat link (Q.waLink) with the message typed; the adviser drags the PDF in and presses Send.
   The PDF is made on the device and goes from the adviser to the client. Share stays blocked while yellow numbers remain.
   The share sheet is simulated so the demo is the same everywhere; "More apps" uses navigator.share when the browser has it. */
(function(){
  'use strict';
  var D = Q.data, C = QD.c, ui = { hash:null, st:'', method:'whatsapp', page:0 };
  var isPhone = function(){ return window.innerWidth < 480; };
  Q.on('render', function(p){ if(p.id!=='share') ui.hash = null; }); // coming back (browser Back) starts fresh, never a stale "Did you send it?"
  var NG = /not guaranteed/i;
  function ngWarn(){ return NG.test(ui.msg||'') ? '<span class="hint" data-ng>Keeps the line "Illustrated values are not guaranteed."</span>'
    : '<span class="hint sh-ngwarn" data-ng role="status">'+Q.icon('alert','i-sm')+'Your message no longer says illustrated values are not guaranteed. The PDF footer still says it on every page.</span>'; }
  var I_CHAT = '<svg class="i i-sm" viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 12a8.5 8.5 0 0 1-12.4 7.5L3.5 20.5l1.1-4.4A8.5 8.5 0 1 1 20.5 12z"/></svg>';


  function demo(key, cur){
    if(cur===''||cur==='email') cur = ui.method==='email' ? 'email' : '';
    var list = [['','WhatsApp'],['sheet','Share sheet'],['email','Email'],['making','Making PDF'],['sent','Did you send it?']];
    // Blocked is Wei's real state while 2 numbers are yellow; it is reached from here, never the default.
    var blocked = Q.toCheck('wei').length ? '<button class="chip" data-go="#share-wei" aria-pressed="'+(key==='wei' && !cur)+'">Blocked · Wei has numbers to check</button>' : '';
    return '<nav class="switcher" aria-label="Demo states"><span class="eyebrow">Demo states</span><div class="switcher-chips">'+list.map(function(x){
      return '<button class="chip" data-go="#share-'+key+(x[0]?'-'+x[0]:'')+'" aria-pressed="'+(x[0]===cur && !(key==='wei' && !cur && blocked))+'">'+x[1]+'</button>'; }).join('')+blocked+'</div></nav>';
  }

  function message(key, c){
    if(key==='wei') return D.share.message;
    if(D.share.messages && D.share.messages[key]) return D.share.messages[key];
    return 'Hi '+c.first+'! Here are the plans we talked about, side by side. '+(Q.worry(c) ? 'You said "'+Q.worry(c)+'" matters most: page 1' : 'Page 1')+
      ' shows the cover and premium for each one. Illustrated values are not guaranteed. Happy to go through it on a call, no rush to decide.';
  }

  /* ---------- mock PDF pages (paper in both themes) ---------- */
  function rowsOf(t, keys){
    return keys.map(function(k){ var r = D.rows.filter(function(z){ return z.key===k; })[0];
      return '<tr><td>'+Q.esc(r.label)+'</td>'+t.plans.map(function(ins){ var x = t.cells[ins][k];
        if(x.v==null) return '<td class="miss">Not shown</td>';
        return '<td>'+(r.kind==='money'?Q.money(x.v):Q.esc(x.v))+'</td>'; }).join('')+'</tr>'; }).join('');
  }
  function head(t, ver){ return '<thead><tr><th></th>'+t.plans.map(function(ins){ return '<th>'+Q.esc(D.insurers[ins].short)+(t.changed===ins?' '+ver:'')+'</th>'; }).join('')+'</tr></thead>'; }
  function pdfPage(key, c, i){
    var vers = Object.keys(c.tables), ver = vers[vers.length-1], t = c.tables[ver], body;
    if(i===0) body = '<h4>Plan summary</h4><table>'+head(t, ver)+'<tbody>'+rowsOf(t,['premium','term','sa','riders'])+'</tbody></table>'+
      '<h4>Guaranteed value</h4><table>'+head(t, ver)+'<tbody>'+rowsOf(t,['g10','g20','g65'])+'</tbody></table>'+(Q.u2Chart ? Q.u2Chart(key, ver) : '');
    else if(i===1) body = '<h4>Illustrated total at 3.00% a year<span class="sh-ng">Not guaranteed</span></h4><table>'+head(t, ver)+'<tbody>'+rowsOf(t,['a10','a20','a65'])+'</tbody></table>'+
      '<h4>Illustrated total at 4.25% a year<span class="sh-ng">Not guaranteed</span></h4><table>'+head(t, ver)+'<tbody>'+rowsOf(t,['b10','b20','b65'])+'</tbody></table>';
    else body = '<h4>How to read this</h4><p class="lead">Every figure comes from the insurer\'s own policy illustration.</p>'+
      '<p class="lead">Guaranteed values are what the policy pays at least. <span class="ngline">Illustrated values depend on future returns and are not guaranteed.</span></p>'+
      '<h4>Sources</h4><table><tbody>'+t.plans.map(function(ins){ var n = D.insurers[ins]; return '<tr><td>'+Q.esc(n.name)+'</td><td>'+Q.esc(n.file)+' · '+n.pages+' pages</td></tr>'; }).join('')+'</tbody></table>';
    return '<div class="pdf" role="img" aria-label="Comparison PDF for '+Q.esc(c.name)+', page '+(i+1)+' of 3">'+
      '<div class="pdf-top"><b>Plan comparison for '+Q.esc(c.name)+'</b><span>3 Nov 2026</span></div>'+
      '<p class="pm">Prepared by '+Q.esc(D.adviser.name)+', '+Q.esc(D.adviser.firm)+' · whole life participating · age '+c.age+'</p>'+body+
      '<div class="pdf-foot"><span>Illustrated values at 3.00% and 4.25% are not guaranteed.</span><span>Page '+(i+1)+' of 3</span></div></div>';
  }
  function preview(key, c){
    return '<aside class="sh-preview" aria-label="PDF preview"><p class="eyebrow"><span>PDF preview</span><span>3 pages</span></p>'+
      '<div class="sh-scroll">'+pdfPage(key, c, ui.page)+'</div>'+
      '<div class="sh-thumbs" role="group" aria-label="Pages">'+[0,1,2].map(function(i){
        return '<button class="sh-thumb" data-page="'+i+'" aria-pressed="'+(ui.page===i)+'" aria-label="Show page '+(i+1)+'"><i></i><i></i><i></i><i></i><b>'+(i+1)+'</b></button>'; }).join('')+
      '<small>Same footer on every page</small></div></aside>';
  }

  function render(p){
    var key = D.cases[p.parts[0]] ? p.parts[0] : 'wei', c = D.cases[key];
    if(!Object.keys(c.tables).length) return '<div class="page sh"><header><a class="back" href="#case-'+key+'">'+Q.icon('back','i-sm')+'Back to '+Q.esc(c.name)+'</a>'+
      '<h1 class="h1 display">Share with '+Q.esc(c.name)+'</h1></header><section class="empty rise"><h2>No plans to share yet.</h2>'+
      '<p>Add 3 to 5 policy illustration PDFs (2 allowed) to build the comparison first.</p><a class="btn btn-primary" href="#new-case-'+key+'">'+Q.icon('plus')+'Add plans</a></section></div>';
    if(location.hash!==ui.hash){ ui.hash = location.hash; ui.st = p.parts[1]||''; if(ui.st==='share'||ui.st==='unsupported') ui.st = ''; ui.openSheet = ui.st==='sheet'; ui.page = 0; ui.method = ui.st==='email' ? 'email' : 'whatsapp'; ui.msg = message(key, c); }
    var st = p.state==='loading' ? 'making' : p.state==='error' ? 'error' : ui.st;
    var left = Q.toCheck(key).length, isWeb = p.edition!=='desktop'; // yellow numbers block every way to share, demo states included
    if(left && st==='sent') st = '';
    var back = '<a class="back" href="#case-'+key+'">'+Q.icon('back','i-sm')+'Back to '+Q.esc(c.name)+'</a>';
    var plans = c.tables[Object.keys(c.tables).pop()] ? c.tables[Object.keys(c.tables).pop()].plans.length : 0;

    var top = '';
    if(st==='error') top = '<div class="banner banner-error" role="alert">'+Q.icon('alert')+'<p>Couldn\'t make the PDF. Nothing was sent.</p><button class="btn-link" data-act="retry">Try again</button></div>';
    else if(left) top = '<div class="banner banner-warn">'+Q.icon('alert')+'<p>Check '+left+' number'+(left>1?'s':'')+' before you share. Yellow numbers can\'t go to a client.</p><button class="btn btn-sm" data-sheet="'+Q.toCheck(key)[0]+'">Check first number</button></div>';

    var form;
    var wa = ui.method==='whatsapp', via = wa ? 'WhatsApp' : 'your email';
    if(st==='sent') form = '<section class="card hero sh-ask" aria-labelledby="ask-h"><div><p class="eyebrow">Back from '+via+'</p>'+
        '<h2 id="ask-h">Did you send it?</h2><p>We can\'t see your chats or email, so we ask. Nothing is marked as shared until you say so.</p></div>'+
        '<div class="acts"><button class="btn btn-secondary" data-act="notyet">Not yet</button><button class="btn btn-primary" data-act="yes">'+Q.icon('check','i-sm')+'Yes, sent</button></div></section>';
    else {
      var making = st==='making', dis = left?' aria-disabled="true" title="Check '+left+' number'+(left>1?'s':'')+' first"':'';
      var phone = isPhone(), deskWa = wa && !phone;
      var primary = making ? '<button class="btn btn-primary sh-busy" aria-disabled="true" aria-live="polite"><span class="sh-spin" aria-hidden="true"></span>Making the PDF…</button>'
        : deskWa ? '<button type="button" class="btn btn-primary" data-act="dlwa"'+dis+'>'+I_CHAT+'Download PDF and open WhatsApp</button>'
        : '<button class="btn btn-primary" data-act="send"'+dis+'>'+(wa?I_CHAT+'Share to WhatsApp':Q.icon('arrow','i-sm')+'Open email')+'</button>';
      var hint = !wa ? '' : phone ? 'Opens the share sheet with the PDF and this message. Pick WhatsApp, then '+Q.esc(c.first)+'\'s chat.'
        : 'Saves the PDF and opens '+(c.mobile ? Q.esc(c.first)+'\'s WhatsApp chat' : 'WhatsApp (pick the chat)')+' with this message typed. Drag the PDF into the chat, then press Send.';
      form = '<section class="card sh-form" aria-label="How to send">'+
        '<div class="field"><span class="label">Send with '+(wa?'WhatsApp':'email')+'</span>'+
          (hint ? '<span class="hint">'+hint+'</span>' : '')+
          '<button type="button" class="btn-link sh-switch" data-method="'+(wa?'email':'whatsapp')+'">'+(wa?'Email instead':'Use WhatsApp instead')+'</button></div>'+
        (wa ? '' : '<div class="field"><label class="label" for="sh-to">To</label><input class="input" id="sh-to" type="email" value="'+Q.esc(C.emails[key]||'')+'" autocomplete="off"></div>')+
        '<div class="field"><label class="label" for="sh-msg">Message</label><textarea class="textarea" id="sh-msg" rows="5">'+Q.esc(ui.msg)+'</textarea>'+
          ngWarn()+'</div>'+
        '<p class="sh-private">'+Q.icon('device','i-sm')+'<span>This PDF is made on this device and goes from you to '+Q.esc(c.first)+'. Nothing is uploaded.</span></p>'+
        '<div class="sh-acts">'+primary+(making||deskWa?'':(wa?'<button class="btn-link" data-act="sheet"'+dis+'>Share…</button>':'')+'<button class="btn-link" data-act="download"'+dis+'>Download PDF</button>')+
          '<span class="spacer"></span><a class="btn btn-ghost" href="#case-'+key+'">Cancel</a></div></section>';
    }

    return '<div class="page sh">'+demo(key, ui.st)+
      '<header>'+back+'<h1 class="h1 display">Share with '+Q.esc(c.name)+'</h1>'+
        '<p class="lede" style="margin-top:var(--s-2)">'+plans+' plans side by side'+(function(){ var vs = Object.keys(c.tables), t = c.tables[vs[vs.length-1]]; return t.changed ? ' · '+Q.esc(D.insurers[t.changed].short)+' '+vs[vs.length-1] : ''; })()+'<span class="dot-sep"></span>case #'+c.no+'</p></header>'+
      top+'<div class="sh-grid">'+form+preview(key, c)+'</div></div>';
  }

  /* Simulated system share sheet: the PDF plus the message, WhatsApp first. */
  function shareSheet(c, done){
    var apps = [['WhatsApp','wa',I_CHAT.replace('i-sm','')],['Mail','mail',Q.icon('file')],['Copy','copy','<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h8"/></svg>'],['More','more',Q.icon('more')]];
    var opener = document.activeElement, wrap = document.createElement('div');
    wrap.className = 'fu-ss-wrap';
    wrap.innerHTML = '<div class="fu-ss-scrim" data-x></div><div class="fu-ss" role="dialog" aria-modal="true" aria-label="Share">'+
      '<span class="fu-ss-grab" aria-hidden="true"></span>'+
      '<div class="fu-ss-file"><span class="fu-ss-pdf" aria-hidden="true">PDF</span><div><b>Plan comparison · '+Q.esc(c.name)+'.pdf</b><small>3 pages · with your message</small></div></div>'+
      '<div class="fu-ss-apps">'+apps.map(function(a){ return '<button data-app="'+a[1]+'" class="fu-ss-app'+(a[1]==='wa'?' wa':'')+'"><span>'+a[2]+'</span>'+a[0]+'</button>'; }).join('')+'</div>'+
      '<button class="btn btn-secondary btn-block" data-x>Cancel</button></div>';
    document.body.appendChild(wrap);
    function close(){ document.removeEventListener('keydown', esc); wrap.remove(); if(opener && document.contains(opener)) opener.focus({preventScroll:true}); }
    function esc(e){ if(e.key==='Escape') close(); }
    document.addEventListener('keydown', esc);
    wrap.addEventListener('click', function(e){
      if(e.target.closest('[data-x]')) return close();
      var b = e.target.closest('[data-app]'); if(!b) return;
      var app = b.dataset.app;
      if(app==='copy'){ try{ navigator.clipboard.writeText(ui.msg).then(function(){ Q.toast('Message copied'); }, function(){ Q.toast('Couldn\'t copy. Select the text and copy it.'); }); }catch(err){ Q.toast('Couldn\'t copy. Select the text and copy it.'); } return close(); }
      if(app==='more'){
        close();
        Q.toast('Your device\'s own share menu opens here');
        return;
      }
      close();
      if(app==='wa') Q.waDemo({ c:c, text:ui.msg, file:'Plan comparison · '+c.name+'.pdf', pick:true, onSent:done }); // a share sheet always asks for the chat
      else { Q.toast('Your email app opens with the PDF and message attached'); done(); }
    });
    wrap.querySelector('.fu-ss-app').focus();
  }

  function mount(el, p){
    var key = D.cases[p.parts[0]] ? p.parts[0] : 'wei', c = D.cases[key], pg = el.querySelector('.page');
    if(!Object.keys(c.tables).length) return;
    function blocked(){ return Q.toCheck(key).length > 0; }
    // Phone: lay the preview out at 440px and zoom it to the column width, so no column is cut off (same as the PDF sheet).
    var pdf = pg.querySelector('.sh-scroll .pdf'), pw = pdf && pdf.parentNode.clientWidth;
    if(pdf && pw && pw < 440){ pdf.style.minWidth = pdf.style.width = '440px'; pdf.style.zoom = pw/440; }
    var msg = pg.querySelector('#sh-msg'), dl = pg.querySelector('[data-act="dlwa"]');
    if(msg) msg.addEventListener('input', function(){ var had = NG.test(ui.msg||''); ui.msg = msg.value;
      if(had!==NG.test(ui.msg)){ var h = pg.querySelector('[data-ng]'); if(h) h.outerHTML = ngWarn(); } });
    function sent(){ if(ui.hash===location.hash){ ui.st='sent'; Q.refresh(); } }
    if(ui.openSheet){ ui.openSheet = false; if(!blocked()) shareSheet(c, sent); } // demo state: open the sheet straight away
    pg.addEventListener('click', function(e){
      var m = e.target.closest('[data-method]'); if(m){ ui.method = m.dataset.method; Q.refresh(); return; }
      var t = e.target.closest('[data-page]'); if(t){ ui.page = +t.dataset.page; Q.refresh(); return; }
      var a = e.target.closest('[data-act]'); if(!a) return;
      if(a.getAttribute('aria-disabled')==='true'){ e.preventDefault(); return; }
      var act = a.dataset.act;
      if(blocked() && /^(dlwa|sheet|send|download|yes)$/.test(act)) return; // yellow numbers can't go to a client
      // Desktop: the real link opens WhatsApp in a new tab; the PDF download is simulated. Then ask, as with the share sheet.
      // Demo: the PDF download is simulated and WhatsApp is shown by Q.waDemo; the real app opens Q.waLink(c, ui.msg).
      if(act==='dlwa'){ Q.toast('PDF saved to Downloads'); Q.waDemo({ c:c, text:ui.msg, file:'Plan comparison · '+c.name+'.pdf', onSent:sent }); return; }
      if(act==='sheet') return shareSheet(c, sent);
      if(act==='send'){
        ui.st='making'; Q.refresh();
        setTimeout(function(){ if(ui.hash!==location.hash) return;
          if(ui.method==='whatsapp'){ ui.st=''; Q.refresh(); shareSheet(c, sent); } else sent(); }, 1200);
      }
      if(act==='download'){ Q.toast('PDF saved to Downloads'); ui.st='sent'; Q.refresh(); }
      if(act==='retry'){ Q.state('normal'); }
      if(act==='notyet'){ ui.st=''; Q.refresh(); }
      if(act==='yes'){
        c.sharedVia = ui.method;
        if(c.now<2){ c.now = 2; c.dates.shared = D.today.date; }
        else if(c.now===4) c.shareSent = D.today.date; // e.g. Alvin's revised plan: the case moves on to shared, waiting for a reply
        Q.toast('Shared with '+c.first+' · we\'ll remind you on '+D.share.remindOn+' if there\'s no reply');
        Q.go('#case-'+key);
      }
    });
  }

  Q.screen('share', { caseArg:true, title:function(p){ var c = D.cases[p.parts[0]]; return 'Share'+(c?' with '+c.name:''); }, nav:'cases', render:render, mount:mount });
})();
