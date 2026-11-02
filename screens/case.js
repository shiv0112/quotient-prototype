/* S11 Case (#case-<key>) and S12 PDF side sheet (#source-<key>). Reference screen.
   One next-step card per lifecycle state (ux-spec §2). Every figure is a button that opens its PDF page. */
(function(){
  'use strict';
  var D = Q.data, verOf = {}, shownFor = null;
  Q.on('render', function(p){ if(p.id!=='source') shownFor = null; });

  function stepLabel(c,i){ return i===4 && c.chosenLabel ? c.chosenLabel : D.steps[i].label; }

  function timeline(c){
    return '<div class="tl-wrap"><ol class="timeline" aria-label="Case progress">'+D.steps.map(function(s,i){
      var cls = 'tl', label = stepLabel(c,i), small = c.dates[s.key] || '';
      var reached = c.result==='lost' ? i<=c.lostAt : i<c.now;
      if(i===6 && !c.selected){ cls += ' skip'; small = 'Not needed'; }
      else if(i===7 && c.result){ cls += ' '+c.result; label = c.result==='won'?'Won':'Lost'; small = c.dates.closed; }
      else if(i===c.now && !c.result){ cls += ' now'; small = 'Now'; }
      else if(reached){ cls += ' done'; }
      else small = '';
      var cur = (i===c.now || (i===7&&c.result)) ? ' aria-current="step"' : '';
      return '<li class="'+cls+'"'+cur+'><i></i><b>'+Q.esc(label)+'</b><small>'+Q.esc(small||' ')+'</small></li>'; }).join('')+'</ol></div>';
  }

  /* The next-step card is derived from the shared case data, so it moves on after every action (nudge, ticks, checks). */
  function nextStep(key, c){
    var first = c.first, h, p = '', btn = '', done = false, n;
    function a(href, label, kind, icon){ return '<a class="btn btn-'+(kind||'primary')+'" href="'+href+'">'+(icon?Q.icon(icon,'i-sm'):'')+label+'</a>'; }
    if(c.result==='won'){ done = true; h='Won · policy with '+(c.chose||'the chosen insurer'); p='Closed on '+c.dates.closed+'.'; btn='<a class="btn-link" href="#sent-'+key+'">See what left your device</a>'; }
    else if(c.result==='lost'){ done = true; h='Lost · '+(c.reason||'no reason').toLowerCase(); p='Closed on '+c.dates.closed+'.'; btn='<button class="btn-link" data-act="reopen">Reopen case</button>'; }
    else switch(c.now){
      case 0: h='Add the plans you\'re comparing'; p='Drop 2 to 4 policy illustration PDFs.'+(c.dates.met?' Your notes from '+c.dates.met+' are ready.':''); btn=a('#new-case-'+key, Q.icon('plus')+'Add PDFs'); break;
      case 1: n = Q.toCheck(key);
        if(n.length){ h='Check '+n.length+' number'+(n.length>1?'s':'')+' before you share'; p='Yellow numbers were read with low confidence or not found. Share unlocks when they are checked.';
          btn='<button class="btn btn-primary" data-sheet="'+n[0]+'">Check first number</button>'; }
        else { h='Ready to share with '+first; p='Every number is checked against its PDF page.'; btn=a('#share-'+key, 'Share comparison', 'primary', 'share'); }
        break;
      case 2:
        if(c.nudged){ h='Nudge sent · next reminder '+c.nudged.next; p='You nudged '+first+' on '+c.nudged.on+'. Log it here when '+first+' replies.'; btn=a('#nudge-'+key+'-reply', 'Log a reply', 'secondary'); }
        else if(c.snoozedTo){ h='Snoozed until '+c.snoozedTo; p='We\'ll remind you on Telegram.'; btn=a('#nudge-'+key, 'Open nudge', 'secondary'); }
        else if((c.quietDays||0) >= D.adviser.waitDays){ h=first+' hasn\'t replied in '+c.quietDays+' days'; p='You shared the comparison on '+c.dates.shared+'. A short nudge is drafted.'; btn=a('#nudge-'+key, 'Send a nudge'); }
        else { h='Shared with '+first; p='We\'ll remind you on '+D.share.remindOn+' if there\'s no reply.'; btn=a('#nudge-'+key+'-reply', 'Log a reply', 'secondary'); }
        break;
      case 3: h=first+' replied'; p='Note which plan '+first+' chose, then draft the write-up.'; break;
      case 4:
        if(c.shareSent){ h='Revised plan shared with '+first; p='We\'ll remind you on '+D.share.remindOn+' if there\'s no reply.'; btn=a('#nudge-'+key+'-reply', 'Log a reply', 'secondary'); }
        else { h='Share the revised plan with '+first; p='Harbour v2 is S$3,300 a year, down from S$4,200.'; btn=a('#share-'+key, 'Share v2', 'primary', 'share'); }
        break;
      case 5: n = Q.writeupProgress(key);
        if(n.done<n.total){ h='Finish the write-up · '+n.done+' of '+n.total+' parts ticked'; p=first+' chose '+(c.chose||'a plan')+'.'; btn=a('#writeup-'+key, 'Continue write-up'); }
        else { h='Write-up ready · copy it to your firm portal'; p='All '+n.total+' required parts are ticked.'; btn=a('#writeup-'+key, 'Open write-up'); }
        break;
      case 6: n = Q.masProgress(key); var left = n.total-n.done;
        if(left){ h='Firm review · '+left+' check'+(left>1?'s':'')+' left'; p=first+' is a Selected Client. '+n.done+' of '+n.total+' checks are done.'; btn=a('#mas-'+key, 'Open checklist'); }
        else { h='Firm review done · Mark won when the policy starts'; p='All '+n.total+' checks are ticked. Your firm decides when the policy starts.'; btn='<button class="btn btn-primary" data-act="won">Mark won</button>'; }
        break;
      default: h='No next step';
    }
    return '<section class="card next-card '+(done?'done':'hero')+' rise" aria-labelledby="ns-h"><div><p class="eyebrow">'+(done?'Closed':'Next step')+'</p>'+
      '<h2 id="ns-h">'+Q.esc(h)+'</h2>'+(p?'<p>'+Q.esc(p)+'</p>':'')+'</div>'+(btn?'<div class="acts">'+btn+'</div>':'')+'</section>';
  }

  function cellHtml(key, ver, t, ins, row){
    var c = t.cells[ins][row.key], ref = key+'/'+ver+'/'+ins+'/'+row.key, insName = D.insurers[ins].name;
    var val = row.kind==='money' ? Q.money(c.v) : Q.esc(c.v), pg = '<span class="proof">p.'+c.p+'</span>';
    var label = insName+', '+Q.rowLabel(row)+', ';
    if(c.flag==='check') return '<button class="fig confirm-cell" data-sheet="'+ref+'" aria-label="'+Q.esc(label+val)+', page '+c.p+'. Needs your check.">'+
      '<span class="tag">Check</span>'+pg+'<span class="v">'+val+'</span></button>';
    if(c.flag==='missing') return '<button class="fig confirm-cell" data-sheet="'+ref+'" aria-label="'+Q.esc(label)+'not found on page '+c.p+'. Needs your check.">'+
      '<span class="tag">Not found</span>'+pg+'</button>';
    if(c.by==='na') return '<button class="fig text" data-sheet="'+ref+'" aria-label="'+Q.esc(label)+'not shown in this PDF"><span class="muted">Not shown</span>'+pg+'</button>';
    var was = '';
    if(t.changed===ins && c.v!==D.cases[key].tables.v1.cells[ins][row.key].v){ var o = D.cases[key].tables.v1.cells[ins][row.key].v; was = '<span class="was">was '+(row.kind==='money'?Q.money(o):Q.esc(o))+'</span>'; }
    var ok = c.by ? '<span class="ok" title="Checked by you">'+Q.icon('check','i-sm')+'</span>' : '';
    return '<button class="fig'+(row.kind==='text'?' text':'')+'" data-sheet="'+ref+'" aria-label="'+Q.esc(label+val)+', page '+c.p+'. Open PDF page.">'+was+pg+'<span class="v">'+val+'</span>'+ok+'</button>';
  }

  function table(key, ver){
    var t = D.cases[key].tables[ver], n = t.plans.length, lastGrp = 'summary';
    var head = '<thead><tr><th scope="col"><span class="sr">Item</span><small>Whole life par · LIA order</small></th>'+t.plans.map(function(ins){ var i = D.insurers[ins];
      var v2 = t.changed===ins || (ver==='v2' && !t.changed && (D.cases[key].chose||'').indexOf(i.name)===0);
      return '<th scope="col">'+Q.esc(i.name)+(v2?' v2':'')+'<small>'+Q.icon('file','i-sm')+' '+Q.esc(i.file)+'</small></th>'; }).join('')+'</tr></thead>';
    var body = D.rows.map(function(r){
      var g = '';
      if(r.grp!==lastGrp){ var G = D.groups[r.grp]; lastGrp = r.grp;
        g = '<tr class="grp"><th colspan="'+(n+1)+'" scope="colgroup">'+Q.esc(G.label)+(G.ng?'<span class="chip">Not guaranteed</span>':'')+'</th></tr>'; }
      return g+'<tr><th scope="row">'+Q.esc(r.label)+'</th>'+t.plans.map(function(ins){ return '<td>'+cellHtml(key, ver, t, ins, r)+'</td>'; }).join('')+'</tr>';
    }).join('');
    return '<div class="tbl-wrap"><table class="tbl"><colgroup><col style="width:25%">'+t.plans.map(function(){return '<col>';}).join('')+'</colgroup>'+head+'<tbody>'+body+'</tbody></table></div>';
  }

  function comparison(key, c, state){
    var vers = Object.keys(c.tables);
    if(state==='loading') return '<section class="card rise" aria-busy="true"><span class="skel skel-lg" style="width:30%"></span>'+
      [1,2,3,4,5,6].map(function(){ return '<div class="skel-row"><span class="skel" style="width:22%"></span><span class="skel" style="width:14%"></span><span class="skel" style="width:14%"></span><span class="skel" style="width:14%"></span></div>'; }).join('')+'</section>';
    if(!vers.length || state==='empty') return '<section class="empty rise"><h2>No plans yet.</h2><p>Add 2 to 4 policy illustration PDFs to build the comparison.</p></section>';
    var ver = verOf[key] && c.tables[verOf[key]] ? verOf[key] : vers[vers.length-1];
    var tabs = vers.length>1 ? '<div class="tabs" role="tablist" aria-label="Version">'+vers.map(function(v){
      return '<button role="tab" data-ver="'+v+'" aria-selected="'+(v===ver)+'">'+v+(c.tables[v].changed?' · '+D.insurers[c.tables[v].changed].short+' revised':'')+'</button>'; }).join('')+'</div>' : '';
    return '<section class="card cmp rise" aria-labelledby="cmp-h"><div class="cmp-head"><h2 class="h3" id="cmp-h">Plan comparison</h2>'+
      '<p class="small muted">Click any number to see it on its PDF page.</p></div>'+tabs+table(key, ver)+'</section>';
  }

  /* Meetings and notes: every calendar meeting and quick note on this case, oldest first. */
  function meetingsSec(key, c){
    var list = Q.caseMeetings(key);
    var rows = list.map(function(x, i){
      var m = x.m, tr = D.transcripts[m.id], quick = m.kind==='notes';
      var type = quick ? 'Quick notes' : 'Calendar meeting · '+Q.esc(m.app||'');
      var lab = x.upcoming ? 'Upcoming' : !tr && !m.notesReady ? 'No notes' : (tr && tr.labels ? 'You and Client' : 'Mic only');
      var ti = c.selected ? (m.ti ? '<span class="cm-ti">Trusted individual: '+Q.esc(m.ti)+' present</span>' : x.upcoming ? '<span class="cm-ti muted">Trusted individual needed at this meeting (§10D)</span>' : '') : '';
      return '<li><span class="cm-when num"><b>'+Q.esc(x.upcoming && m.day==='Today' ? 'Today' : m.date)+'</b><small>'+Q.esc(m.time)+'</small></span>'+
        '<span class="cm-what"><span>'+(quick?Q.icon('mic','i-sm'):Q.icon(m.app==='In person'?'meetings':'video','i-sm'))+type+'</span>'+
        '<small class="muted">Meeting '+(i+1)+' of '+list.length+(m.len?'<span class="dot-sep"></span>'+Q.esc(m.len):'')+'<span class="dot-sep"></span>'+lab+'</small>'+ti+'</span>'+
        '<a class="btn btn-ghost btn-sm" href="#meeting-'+m.id+'">'+(x.upcoming?'Open':'Transcript')+'</a></li>'; }).join('');
    return '<section class="card cm rise" aria-labelledby="cm-h"><div class="cm-head"><div><h2 class="h3" id="cm-h">Meetings and notes</h2>'+
      '<p class="small muted">'+(list.length ? list.length+' on this case · transcripts stay on this device' : 'No meetings yet')+'</p></div>'+
      '<button class="btn btn-secondary btn-sm" data-quick-notes="'+key+'">'+Q.icon('mic','i-sm')+'Record notes for this case</button></div>'+
      (rows ? '<ol class="cm-list">'+rows+'</ol>' : '')+'</section>';
  }

  function switcher(key){
    return '<nav class="switcher" aria-label="Demo cases"><span class="eyebrow">Demo cases</span><div class="switcher-chips">'+D.caseOrder.map(function(k){ var c = D.cases[k];
      return '<button class="chip" data-go="#case-'+k+'" aria-pressed="'+(k===key)+'">'+Q.esc(c.first)+' · '+Q.esc(c.result?(c.result==='won'?'Won':'Lost'):stepLabel(c,c.now))+'</button>'; }).join('')+'</div></nav>';
  }

  function render(p){
    var key = D.cases[p.parts[0]] ? p.parts[0] : 'wei', c = D.cases[key];
    // Empty state = the case as it was at Met: no plans, no checks, no share.
    if(p.state==='empty') c = Object.assign({}, c, { now:0, result:null, tables:{}, dates:{ met:c.dates.met } });
    if(p.state==='error') return '<div class="page">'+switcher(key)+'<div class="banner banner-error" role="alert">'+Q.icon('alert')+'<p>Couldn\'t load this case. Nothing was changed.</p><button class="btn-link" data-go="#case-'+key+'">Try again</button></div></div>';
    var plans = Object.keys(c.tables).length ? c.tables[Object.keys(c.tables)[0]].plans.length : 0;
    var status = c.selected ? '<span class="chip chip-outline">Selected Client</span>' : c.result==='won' ? '<span class="chip chip-ok chip-dot">Won</span>' : c.result==='lost' ? '<span class="chip chip-dot">Lost</span>' : '';
    var sends = (D.log[key]||[]).length || c.sends;
    return '<div class="page case">'+switcher(key)+
      '<header class="card case-head tiled rise"><div><h1 class="h1 display">'+Q.esc(c.name)+' <span class="case-no">#'+c.no+'</span></h1>'+
        '<p class="case-meta">'+c.age+'<span class="dot-sep"></span>'+c.product+'<span class="dot-sep"></span>'+(plans?plans+' plans':'No plans yet')+(status?' '+status:'')+'</p></div>'+
        '<div class="menu"><button class="btn btn-secondary" data-menu aria-haspopup="true" aria-expanded="false">'+Q.icon('more')+'More</button><div class="menu-pop" role="menu">'+
          '<button role="menuitem" data-act="won">Mark won</button><button role="menuitem" data-act="lost">Mark lost</button>'+
          '<button role="menuitem" data-go="#new-case-'+key+'">Add plans</button><button role="menuitem" class="danger" data-act="delete">Delete case</button></div></div></header>'+
      '<section class="rise" aria-label="Progress">'+timeline(c)+'</section>'+
      nextStep(key, c)+comparison(key, c, p.state)+meetingsSec(key, c)+
      '<p class="case-foot rise">'+Q.icon('device','i-sm')+'<a href="#sent-'+key+'">What left your device for this case</a><span class="muted">'+(sends?sends+' send'+(sends>1?'s':''):'Nothing sent')+'</span></p>'+
    '</div>';
  }

  function mount(el, p){
    var key = D.cases[p.parts[0]] ? p.parts[0] : 'wei', c = D.cases[key];
    el.querySelector('.page').addEventListener('click', function(e){
      var v = e.target.closest('[data-ver]'); if(v){ verOf[key] = v.dataset.ver; Q.refresh(); return; }
      var a = e.target.closest('[data-act]'); if(!a) return;
      if(a.dataset.act==='won'){ c.result='won'; c.now=7; c.dates.closed=D.today.date; Q.refresh(); Q.toast('Marked as won'); }
      if(a.dataset.act==='reopen'){ c.result=null; c.now=Math.min(c.lostAt||2,6); delete c.dates.closed; Q.refresh(); Q.toast('Case reopened'); }
      if(a.dataset.act==='lost') Q.dialog({ title:'Why was '+c.first+'\'s case lost?',
        body:'<div class="opts" role="radiogroup">'+['Budget changed','Chose another adviser','Not ready','Other'].map(function(r,i){
          return '<label class="check"><input type="radio" name="why" value="'+r+'"'+(i===0?' checked':'')+'> '+r+'</label>'; }).join('')+'</div>',
        actions:[{label:'Cancel',value:null},{label:'Mark lost',value:'ok',kind:'danger'}], safe:null
      }).then(function(v){ if(!v) return; var r = document.querySelector('.dialog input[name=why]:checked');
        c.reason = r ? r.value : 'Other'; c.lostAt = Math.min(c.now,6); c.result='lost'; c.now=7; c.dates.closed=D.today.date; Q.refresh(); Q.toast('Marked as lost'); });
      if(a.dataset.act==='delete') Q.dialog({ title:'Delete case #'+c.no+'?', body:'<p>This removes '+Q.esc(c.name)+'\'s case, PDFs and notes from this device.</p>',
        actions:[{label:'Cancel',value:null},{label:'Delete case',value:'del',kind:'danger'}], safe:null }).then(function(v){ if(v) Q.toast('Demo only: case kept'); });
    });
    if(p.id==='source' && shownFor!==location.hash){ shownFor = location.hash; var refs = Q.toCheck(key); Q.openSheet(refs[0] || key+'/'+Object.keys(c.tables)[0]+'/harbour/b20'); }
  }

  Q.screen('case', { title:function(p){ var c = D.cases[p.parts[0]]; return c ? c.name+' #'+c.no : 'Case'; }, nav:'cases', render:render, mount:mount });
  Q.screen('source', { title:'PDF page', nav:'cases', render:render, mount:mount });
})();
