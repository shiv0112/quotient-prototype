/* S13 Share (#share-<case>[-<state>]). States: email (default), share, making, sent (did-you-send prompt), unsupported, error.
   The PDF is made on the device and goes from the adviser to the client. Share stays blocked while yellow numbers remain. */
(function(){
  'use strict';
  var D = Q.data, C = QD.c, ui = { hash:null, st:'', method:'email', page:0 };


  function demo(key, cur){
    if(cur===''||cur==='share') cur = ui.method==='share' ? 'share' : '';
    var list = [['','Email'],['share','Share'],['making','Making PDF'],['sent','Did you send it?'],['unsupported','Share unsupported']];
    // Blocked is Wei's real state while 2 numbers are yellow; it is reached from here, never the default.
    var blocked = Q.toCheck('wei').length ? '<button class="chip" data-go="#share-wei" aria-pressed="'+(key==='wei' && !cur)+'">Blocked · Wei has numbers to check</button>' : '';
    return '<nav class="switcher" aria-label="Demo states"><span class="eyebrow">Demo states</span><div class="switcher-chips">'+list.map(function(x){
      return '<button class="chip" data-go="#share-'+key+(x[0]?'-'+x[0]:'')+'" aria-pressed="'+(x[0]===cur && !(key==='wei' && !cur && blocked))+'">'+x[1]+'</button>'; }).join('')+blocked+'</div></nav>';
  }

  function message(key, c){
    if(key==='wei') return D.share.message;
    if(key==='alvin') return 'Hi Alvin, here\'s the revised Harbour plan next to the other two. Illustrated values are not guaranteed. Happy to go through it on a call.';
    return 'Hi '+c.first+', here\'s the side-by-side of the plans we talked about. Illustrated values are not guaranteed. Happy to go through it on a call.';
  }

  /* ---------- mock PDF pages (paper in both themes) ---------- */
  function rowsOf(t, keys){
    return keys.map(function(k){ var r = D.rows.filter(function(z){ return z.key===k; })[0];
      return '<tr><td>'+Q.esc(r.label)+'</td>'+t.plans.map(function(ins){ var x = t.cells[ins][k];
        if(x.v==null) return '<td class="miss">Not shown</td>';
        return '<td>'+(r.kind==='money'?Q.money(x.v):Q.esc(x.v))+'</td>'; }).join('')+'</tr>'; }).join('');
  }
  function head(t, ver){ return '<thead><tr><th></th>'+t.plans.map(function(ins){ return '<th>'+Q.esc(D.insurers[ins].short)+(t.changed===ins?' v2':'')+'</th>'; }).join('')+'</tr></thead>'; }
  function pdfPage(key, c, i){
    var vers = Object.keys(c.tables), ver = vers[vers.length-1], t = c.tables[ver], body;
    if(i===0) body = '<h4>Plan summary</h4><table>'+head(t)+'<tbody>'+rowsOf(t,['premium','term','sa','riders'])+'</tbody></table>'+
      '<h4>Guaranteed value</h4><table>'+head(t)+'<tbody>'+rowsOf(t,['g10','g20','g65'])+'</tbody></table>';
    else if(i===1) body = '<h4>Illustrated total at 3.00% a year<span class="sh-ng">Not guaranteed</span></h4><table>'+head(t)+'<tbody>'+rowsOf(t,['a10','a20','a65'])+'</tbody></table>'+
      '<h4>Illustrated total at 4.25% a year<span class="sh-ng">Not guaranteed</span></h4><table>'+head(t)+'<tbody>'+rowsOf(t,['b10','b20','b65'])+'</tbody></table>';
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
    if(location.hash!==ui.hash){ ui.hash = location.hash; ui.st = p.parts[1]||''; ui.page = 0; ui.method = (ui.st==='share'||ui.st==='unsupported')?'share':'email'; }
    var st = p.state==='loading' ? 'making' : p.state==='error' ? 'error' : ui.st;
    var demoSet = p.parts[1]; // explicit demo state: show as if numbers are checked
    var left = demoSet ? 0 : Q.toCheck(key).length, isWeb = p.edition!=='desktop';
    var back = '<a class="back" href="#case-'+key+'">'+Q.icon('back','i-sm')+'Back to '+Q.esc(c.name)+'</a>';
    var plans = c.tables[Object.keys(c.tables).pop()] ? c.tables[Object.keys(c.tables).pop()].plans.length : 0;

    var top = '';
    if(st==='error') top = '<div class="banner banner-error" role="alert">'+Q.icon('alert')+'<p>Couldn\'t make the PDF. Nothing was sent.</p><button class="btn-link" data-act="retry">Try again</button></div>';
    else if(left) top = '<div class="banner banner-warn">'+Q.icon('alert')+'<p>Check '+left+' number'+(left>1?'s':'')+' before you share. Yellow numbers can\'t go to a client.</p><button class="btn btn-sm" data-sheet="'+Q.toCheck(key)[0]+'">Check first number</button></div>';

    var form;
    if(st==='sent') form = '<section class="card hero sh-ask" aria-labelledby="ask-h"><div><p class="eyebrow">Back from '+(ui.method==='email'?'your email':'the share menu')+'</p>'+
        '<h2 id="ask-h">Did you send it?</h2><p>We can\'t see your email or apps, so we ask. Nothing is marked as shared until you say so.</p></div>'+
        '<div class="acts"><button class="btn btn-secondary" data-act="notyet">Not yet</button><button class="btn btn-primary" data-act="yes">'+Q.icon('check','i-sm')+'Yes, sent</button></div></section>';
    else {
      var making = st==='making', share = ui.method==='share', unsupported = share && st==='unsupported';
      var primary = unsupported ? '<button class="btn btn-primary" data-act="download">'+Q.icon('file','i-sm')+'Download PDF</button>'
        : making ? '<button class="btn btn-primary sh-busy" aria-disabled="true" aria-live="polite"><span class="sh-spin" aria-hidden="true"></span>Making the PDF…</button>'
        : '<button class="btn btn-primary" data-act="send"'+(left?' aria-disabled="true" title="Check '+left+' number'+(left>1?'s':'')+' first"':'')+'>'+Q.icon(share?'share':'arrow','i-sm')+(share?'Share…':'Open email')+'</button>';
      form = '<section class="card sh-form" aria-label="How to send">'+
        '<div class="field"><span class="label" id="m-l">Send with</span><div class="seg" role="group" aria-labelledby="m-l">'+
          '<button data-method="email" aria-pressed="'+!share+'">Email</button><button data-method="share" aria-pressed="'+share+'">Share</button></div></div>'+
        (share ? '<p class="sh-hint">'+(isWeb?'Opens your browser\'s share menu.':'Opens the system share sheet.')+' WhatsApp, Telegram and others are there.</p>'
               : '<div class="field"><label class="label" for="sh-to">To</label><input class="input" id="sh-to" type="email" value="'+Q.esc(C.emails[key]||'')+'" autocomplete="off"></div>')+
        (unsupported ? '<div class="banner banner-info">'+Q.icon('info')+'<p>Your browser can\'t open the share menu. Download the PDF instead and send it from any app.</p></div>' : '')+
        '<div class="field"><label class="label" for="sh-msg">Message</label><textarea class="textarea" id="sh-msg" rows="4">'+Q.esc(message(key,c))+'</textarea></div>'+
        '<p class="sh-private">'+Q.icon('device','i-sm')+'<span>This PDF is made on this device and goes from you to '+Q.esc(c.first)+'. Nothing is uploaded.</span></p>'+
        '<div class="sh-acts">'+primary+(unsupported||making?'':'<button class="btn-link" data-act="download">Download PDF</button>')+'<span class="spacer"></span><a class="btn btn-ghost" href="#case-'+key+'">Cancel</a></div></section>';
    }

    return '<div class="page sh">'+demo(key, ui.st)+
      '<header>'+back+'<h1 class="h1 display">Share with '+Q.esc(c.name)+'</h1>'+
        '<p class="lede" style="margin-top:var(--s-2)">'+plans+' plans side by side'+(c.tables.v2?' · Harbour v2':'')+'<span class="dot-sep"></span>case #'+c.no+'</p></header>'+
      top+'<div class="sh-grid">'+form+preview(key, c)+'</div></div>';
  }

  function mount(el, p){
    var key = D.cases[p.parts[0]] ? p.parts[0] : 'wei', c = D.cases[key], pg = el.querySelector('.page');
    pg.addEventListener('click', function(e){
      var m = e.target.closest('[data-method]'); if(m){ ui.method = m.dataset.method; if(ui.st==='unsupported'&&ui.method==='email') ui.st=''; Q.refresh(); return; }
      var t = e.target.closest('[data-page]'); if(t){ ui.page = +t.dataset.page; Q.refresh(); return; }
      var a = e.target.closest('[data-act]'); if(!a || a.getAttribute('aria-disabled')==='true') return;
      var act = a.dataset.act;
      if(act==='send'){
        if(ui.method==='share' && p.edition!=='desktop' && !navigator.share){ ui.st='unsupported'; Q.refresh(); return; }
        ui.st='making'; Q.refresh(); setTimeout(function(){ if(ui.hash===location.hash){ ui.st='sent'; Q.refresh(); } }, 1400);
      }
      if(act==='download'){ Q.toast('PDF saved to Downloads'); ui.st='sent'; Q.refresh(); }
      if(act==='retry'){ Q.state('normal'); }
      if(act==='notyet'){ ui.st=''; Q.refresh(); }
      if(act==='yes'){
        if(c.now<2){ c.now = 2; c.dates.shared = D.today.date; }
        else c.shareSent = D.today.date; // e.g. Alvin's revised plan: the case moves on to shared, waiting for a reply
        Q.toast('Shared with '+c.first+' · we\'ll remind you on '+D.share.remindOn+' if there\'s no reply');
        Q.go('#case-'+key);
      }
    });
  }

  Q.screen('share', { title:function(p){ var c = D.cases[p.parts[0]]; return 'Share'+(c?' with '+c.name:''); }, nav:'cases', render:render, mount:mount });
})();
