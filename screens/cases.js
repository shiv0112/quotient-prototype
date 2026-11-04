/* S18 Cases (#cases[-<state>]). Filters: Needs you (default) / In progress / Closed. Search filters the list.
   States: needs, progress, closed, noresults, empty, loading, error. */
(function(){
  'use strict';
  var D = Q.data, C = QD.c, ui = { hash:null };
  var TABS = [['all','All'],['needs','Needs you'],['progress','In progress'],['closed','Closed']];


  function stage(c){ return c.result ? (c.result==='won'?'Won':'Lost') : (c.now===4 && c.chosenLabel ? c.chosenLabel : D.steps[c.now].label); }
  function chip(c){ var t = stage(c); return '<span class="chip'+(c.result==='won'?' chip-ok chip-dot':c.result==='lost'?' chip-dot':'')+'">'+Q.esc(t)+'</span>'; }
  // Same source as Today and the Case card: Q.status() in core.js.
  function tabOf(k){ return D.cases[k].result ? 'closed' : Q.status(k).needs ? 'needs' : 'progress'; }

  function row(k){
    var c = D.cases[k], r = Q.status(k);
    return '<li class="cs-row"><div class="who"><a class="who-link" href="#case-'+k+'"><b>'+Q.esc(c.name)+'</b> <span class="case-no">#'+c.no+'</span></a></div>'+
      chip(c)+'<span class="cs-next">'+Q.esc(r.why)+'</span><span class="cs-last">'+Q.esc(c.last)+'</span>'+
      '<a class="btn btn-secondary btn-sm" href="'+r.go+'" aria-label="'+Q.esc(r.btn+', '+c.name)+'">'+Q.esc(r.btn)+'</a></li>';
  }

  function render(p){
    if(location.hash!==ui.hash){ ui.hash = location.hash; var a = p.parts[0]||'';
      ui.tab = a==='progress'||a==='closed'||a==='needs' ? a : 'all'; ui.q = a==='noresults' ? 'Goh' : ''; ui.empty = a==='empty'; }
    var st = p.state==='empty' || ui.empty ? 'empty' : p.state;
    var chips = '<nav class="switcher" aria-label="Demo states"><span class="eyebrow">Demo states</span><div class="switcher-chips">'+
      [['','All'],['needs','Needs you'],['progress','In progress'],['closed','Closed'],['noresults','No results'],['empty','Empty']].map(function(x){
        return '<button class="chip" data-go="#cases'+(x[0]?'-'+x[0]:'')+'" aria-pressed="'+((p.parts[0]||'')===x[0])+'">'+x[1]+'</button>'; }).join('')+'</div></nav>';
    var head = '<div class="page-head"><div><h1 class="h1 display">Cases</h1><p class="sub">'+D.caseOrder.length+' cases'+'<span class="dot-sep"></span>'+Q.needs().length+' need you</p></div>'+
      '</div>';
    if(st==='empty') return '<div class="page">'+chips+'<div class="page-head"><h1 class="h1 display">Cases</h1></div>'+
      '<div class="empty"><h2>No cases yet</h2><p>Start one from a meeting or from PDFs.</p><a class="btn btn-primary" href="#new-case">'+Q.icon('plus')+'New case</a></div></div>';
    if(st==='error') return '<div class="page">'+chips+head+'<div class="banner banner-error" role="alert">'+Q.icon('alert')+'<p>Couldn\'t load your cases. Nothing was changed.</p><button class="btn-link" data-go="#cases">Try again</button></div></div>';
    var q = ui.q.trim().toLowerCase();
    var keys = q ? D.caseOrder.filter(function(k){ var c = D.cases[k]; return c.name.toLowerCase().indexOf(q)>=0 || String(c.no).indexOf(q.replace('#',''))>=0; })
                 : Q.needs().concat(D.caseOrder.filter(function(k){ return Q.needs().indexOf(k)<0; })).filter(function(k){ return ui.tab==='all' || tabOf(k)===ui.tab; });
    var counts = {}; TABS.forEach(function(t){ counts[t[0]] = D.caseOrder.filter(function(k){ return t[0]==='all' || tabOf(k)===t[0]; }).length; });
    var tools = '<div class="cs-tools"><div class="cs-search">'+Q.icon('search')+'<label class="sr" for="cs-q">Search cases</label>'+
      '<input class="input" id="cs-q" type="search" placeholder="Search by name or case number" value="'+Q.esc(ui.q)+'" autocomplete="off"><kbd aria-hidden="true">/</kbd></div>'+
      '<div class="cs-filters" role="group" aria-label="Filter">'+TABS.map(function(t){
        return '<button class="chip" data-tab="'+t[0]+'" aria-pressed="'+(!q && ui.tab===t[0])+'">'+t[1]+' <span class="n">'+counts[t[0]]+'</span></button>'; }).join('')+'</div></div>';
    var list;
    if(st==='loading') list = '<div class="card cs-card" aria-busy="true">'+[1,2,3,4,5].map(function(){ return '<div class="skel-row"><span class="skel" style="width:28%"></span><span class="skel" style="width:12%"></span><span class="skel" style="width:20%"></span><span class="skel" style="width:10%"></span></div>'; }).join('')+'</div>';
    else if(!keys.length && q) list = '<div class="empty"><h2>No case matches ‘'+Q.esc(ui.q)+'’.</h2><p>Try a first name, a surname or a case number like 402.</p><button class="btn btn-secondary" data-act="clear">Clear search</button></div>';
    else if(!keys.length) list = '<div class="empty"><h2>Nothing here</h2><p>Cases show here as they move along.</p></div>';
    else list = (q?'<p class="cs-scope" aria-live="polite">'+keys.length+' result'+(keys.length>1?'s':'')+' in all cases</p>':'')+
      '<div class="card cs-card"><div class="cs-row cs-headrow" aria-hidden="true"><span>Client</span><span>Stage</span><span>Next step</span><span class="cs-last">Last activity</span><span></span></div>'+
      '<ul class="list cs-list">'+keys.map(row).join('')+'</ul></div>';
    return '<div class="page">'+chips+head+tools+'<div id="cs-res">'+list+'</div></div>';
  }

  function mount(el){
    var pg = el.querySelector('.page'), inp = pg.querySelector('#cs-q');
    if(inp){ inp.addEventListener('input', function(){ ui.q = inp.value; var pos = inp.selectionStart; Q.refresh(); var n = document.getElementById('cs-q'); if(n){ n.focus(); n.setSelectionRange(pos,pos); } }); }
    pg.addEventListener('click', function(e){
      var t = e.target.closest('[data-tab]'); if(t){ ui.tab = t.dataset.tab; ui.q = ''; Q.refresh(); return; }
      var a = e.target.closest('[data-act="clear"]'); if(a){ ui.q = ''; Q.refresh(); var n = document.getElementById('cs-q'); if(n) n.focus(); }
    });
  }
  document.addEventListener('keydown', function(e){
    if(e.key!=='/' || Q.route().id!=='cases' || /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) return;
    var n = document.getElementById('cs-q'); if(n){ e.preventDefault(); n.focus(); }
  });

  Q.screen('cases', { title:'Cases', nav:'cases', render:render, mount:mount });
})();
