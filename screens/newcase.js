/* S07 New case (#new-case, #new-case-<case>). Drop 3 to 5 policy illustration PDFs (2 allowed), pick notes, Compare plans. */
(function(){
  'use strict';
  var D = Q.data, F = QD.b.files, st = null;


  var PRESET = { empty:[], one:['harbour'], three:['harbour','meridian','orchid'], many:['harbour','meridian','orchid','harbour2','fifth','sixth'],
    notpdf:['harbour','meridian','notpdf'], scanned:['harbour','meridian','scanned'], ilp:['harbour','orchid','ilp'], newlayout:['harbour','meridian','newlayout'] };
  var STATES = [['empty','Empty'],['one','1 PDF'],['three','3 PDFs'],['many','Too many'],['notpdf','Not a PDF'],['scanned','Scanned'],['ilp','ILP'],['newlayout','New insurer layout']];

  function prefill(key){
    if(key==='daniel') return { name:'Daniel Lee', notes:'meeting', files:[] };
    if(key==='alvin' || (key && D.cases[key].revising)) return { name:D.cases[key].name, notes:'meeting', files:['harbour2'] };
    if(key && D.cases[key]) return { name:D.cases[key].name, notes:'meeting', files:[] };
    return { name:'', notes:'meeting', files:[] };
  }

  function render(p){
    var key = D.cases[p.parts[0]] ? p.parts[0] : '', c = key ? D.cases[key] : null;
    var s = QB.local('new-case', STATES.map(function(z){ return z[0]; }), 'none', p);
    if(s.fresh || !st){ var pf = prefill(key); st = { name:pf.name, notes:pf.notes, files:(s.s!=='none' ? PRESET[s.s] : pf.files).map(function(k){ return F[k]; }), over:false, tooMany: false }; if(s.s==='three' && !key) st.name = 'Wei Tan'; }
    var cur = s.s==='none' ? '' : s.s;
    var good = st.files.filter(function(f){ return !f.err; }), bad = st.files.filter(function(f){ return f.err; });
    var tooMany = st.files.length>5;
    var rev = c && c.revising, ok = (good.length>=2 || (rev && good.length===1)) && good.length<=5 && !bad.length && !tooMany; // a revision needs only the new PDF
    var why = tooMany ? 'Up to 5 plans at a time.' : bad.length ? 'Remove the files marked in red.' : good.length===1 && !rev ? 'Add at least one more PDF to compare.' : good.length===0 ? 'Add 3 to 5 PDFs to compare (2 allowed).' : '';
    var title = rev ? 'Add the new illustration · '+c.name+' #'+c.no : c ? 'Add plans · '+c.name+' #'+c.no : 'New case';
    var drop = '<div class="s07-drop'+(st.files.length?' small':'')+(st.over?' over':'')+'" data-drop>'+
      '<span class="ic">'+Q.icon('file')+'</span>'+
      '<span class="big">'+(st.files.length?'Add another PDF':'Drop 3 to 5 policy illustration PDFs (2 allowed)')+'</span>'+
      '<span class="small muted"><label>or choose files<input class="sr" type="file" accept="application/pdf,.pdf" multiple data-pick></label></span>'+
      (st.files.length?'':'<button class="btn-link s07-sample" data-act="sample">Use the 3 sample PDFs</button>')+'</div>';
    var files = st.files.length ? '<ul class="s07-files" aria-label="Files">'+st.files.map(function(f,i){
      var over = i>=5;
      if(f.err || over) return '<li class="bad"><span class="ic">'+Q.icon('alert')+'</span><span><b>'+Q.esc(f.name)+'</b><small>'+Q.esc(f.err || 'Up to 5 plans at a time.')+'</small></span><span></span>'+
        '<button class="icon-btn" data-rm="'+i+'" aria-label="Remove '+Q.esc(f.name)+'">'+Q.icon('close')+'</button></li>';
      var info = f.newLayout ? '<b>'+Q.esc(f.name)+'</b><small>New layout · we\'ll need to read the table pages</small>' : '<b>'+Q.esc(f.ins)+'</b><small>'+Q.esc(f.plan)+' · '+Q.esc(f.name)+'</small>';
      return '<li><span class="ic">'+Q.icon('file')+'</span><span>'+info+'</span><span class="pg">'+(f.pages==='?'?'':f.pages+' pages')+'</span>'+
        '<button class="icon-btn" data-rm="'+i+'" aria-label="Remove '+Q.esc(f.name)+'">'+Q.icon('close')+'</button></li>'; }).join('')+'</ul>' : '';
    var banner = tooMany ? '<div class="banner banner-error" role="alert">'+Q.icon('alert')+'<p>Up to 5 plans at a time. Remove one to continue.</p></div>' : '';
    return '<div class="page s07">'+QB.demo(STATES, cur)+
      (c?'<a class="back" href="#case-'+key+'">'+Q.icon('back','i-sm')+'Back to '+Q.esc(c.name)+'</a>':'')+
      '<header class="page-head rise"><div><h1 class="h1">'+Q.esc(title)+'</h1><p class="sub">Known insurer layouts are read on this device. Nothing is sent until you see exactly what goes.</p></div></header>'+
      '<form class="s07-form rise" novalidate onsubmit="return false">'+
        (c?'':'<div class="field s07-name"><label class="label" for="nc-name">Client name</label><input class="input" id="nc-name" autocomplete="off" aria-describedby="nc-name-e" value="'+Q.esc(st.name)+'"><span class="field-error" id="nc-name-e" hidden>Add the client\'s name.</span></div>'+
          '<div class="field s07-name"><label class="label" for="nc-mobile">Mobile · optional</label><input class="input" id="nc-mobile" type="tel" inputmode="tel" autocomplete="off" placeholder="+65 9123 4567" value="'+Q.esc(st.mobile||'')+'">'+
          '<span class="hint">Opens their WhatsApp chat directly</span></div>')+
        '<div class="field"><span class="label" id="pdf-l">Policy illustrations</span>'+drop+'</div>'+banner+files+
        notesPicker(key)+
        '<div class="s07-acts u2-dock"><button class="btn btn-primary" data-act="compare"'+(ok?'':' aria-disabled="true" title="'+Q.esc(why)+'"')+'>Compare plans</button>'+
        '<a class="btn btn-ghost" href="'+(c?'#case-'+key:'#today')+'">Cancel</a>'+(why?'<span class="why" aria-live="polite">'+Q.esc(why)+'</span>':'')+'</div>'+
      '</form></div>';
    // keep dest for mount
  }

  /* Which meetings and notes to use (default: all held meetings on the case). Shared with the privacy gate through QB.pick. */
  function notesPicker(key){
    var list = key ? Q.caseMeetings(key).filter(function(x){ return !x.upcoming && x.m.notesReady; }).map(function(x){ return x.m; })
                   : D.meetings.past.filter(function(m){ return !m.c && m.notesReady; });
    var pick = QB.pick(key);
    var rows = list.map(function(m){
      return '<label class="check"><input type="checkbox" data-nc-pick="'+m.id+'"'+(pick.indexOf(m.id)>=0?' checked':'')+'> '+
        Q.esc(m.kind==='notes' ? m.who : (m.date+' '+m.time+' · '+(m.app||'Meeting')))+' <span class="muted small">'+(m.kind==='notes'?'quick notes':'meeting')+(m.len?' · '+Q.esc(m.len):'')+'</span></label>'; }).join('');
    return '<fieldset class="field s07-notes"><legend class="label">Use notes from</legend>'+
      (rows || '<p class="small muted">'+(key?'No notes on this case yet.':'No unfiled notes.')+'</p>')+
      '<button type="button" class="btn-link" data-act="paste" style="align-self:flex-start">Paste notes instead</button></fieldset>';
  }

  function fromFile(f){
    var n = f.name, low = n.toLowerCase();
    if(!/\.pdf$/.test(low) && f.type!=='application/pdf') return { name:n, err:'This isn\'t a PDF.' };
    if(/scan/.test(low)) return { name:n, err:F.scanned.err };
    if(/ilp|invest/.test(low)) return { name:n, err:F.ilp.err };
    var hit = ['harbour','meridian','orchid'].filter(function(k){ return low.indexOf(k)>=0; })[0];
    return hit ? { name:n, ins:F[hit].ins, plan:F[hit].plan, pages:F[hit].pages } : { name:n, pages:'?', newLayout:true };
  }

  /* "Wants changes": the new illustration becomes the next table version; the case is ready to share it. */
  function revise(key){
    var c = D.cases[key], vs = Object.keys(c.tables), last = c.tables[vs[vs.length-1]], cells = JSON.parse(JSON.stringify(last.cells)), v = 'v'+(vs.length+1);
    cells.harbour = JSON.parse(JSON.stringify(D.cases.alvin.tables.v2.cells.harbour)); // shortcut: the demo revision is always the lower-premium Harbour PDF (harbour2)
    c.tables[v] = { plans:last.plans.slice(), cells:cells, changed:'harbour' }; delete c.revising;
    Q.toast(v+' ready · share it with '+c.first); Q.go('#case-'+key);
  }

  function mount(el, p){
    var key = D.cases[p.parts[0]] ? p.parts[0] : '', pg = el.querySelector('.page'), drop = pg.querySelector('[data-drop]');
    function add(list){ Array.prototype.forEach.call(list, function(f){ st.files.push(fromFile(f)); }); Q.refresh(); }
    pg.addEventListener('click', function(e){
      var rm = e.target.closest('[data-rm]'); if(rm){ st.files.splice(+rm.dataset.rm,1); Q.refresh(); var d = document.querySelector('[data-drop] label'); if(d) d.focus(); return; }
      var a = e.target.closest('[data-act]'); if(!a) return;
      if(a.dataset.act==='paste'){ QD.b.pasteSheet(key); return; }
      if(a.dataset.act==='sample'){ st.files = ['harbour','meridian','orchid'].map(function(k){ return F[k]; }); if(!st.name) st.name = 'Wei Tan'; Q.refresh(); }
      if(a.dataset.act==='compare'){ if(a.getAttribute('aria-disabled')==='true') return;
        QB.newLayout = (st.files.filter(function(f){ return f.newLayout && !f.err; })[0] || {}).name || null; // the gate adds one outgoing line for it
        if(!key && !String(st.name||'').trim()){ var nm = pg.querySelector('#nc-name'); nm.setAttribute('aria-invalid','true'); pg.querySelector('#nc-name-e').hidden = false; nm.focus(); return; }
        // Each case goes to its own gate. A case that already has plans has no demo gate for new ones.
        if(key && D.cases[key].revising){ revise(key); return; }
        if(!key){ // demo: a new case continues as Wei's sample case. Notes picked here go with it; Wei's saved mobile is never overwritten.
          var picked = QB.pick('').slice(); picked.forEach(function(id){ var x = Q.meetingById(id); if(x && !x.m.c) x.m.c = 'wei'; });
          QB.pick('wei', QB.pick('wei').concat(picked.filter(function(id){ return QB.pick('wei').indexOf(id)<0; })));
          if(st.name.trim()!=='Wei Tan') Q.toast('Demo: continues with the sample case for Wei Tan');
          Q.go('#gate-wei-compare'); }
        else if(QB.gateFor(key, 'compare')) Q.go('#gate-'+key+'-compare');
        else { Q.toast('Demo: plans added to case #'+D.cases[key].no); Q.go('#case-'+key); } }
    });
    pg.addEventListener('change', function(e){
      if(e.target.matches('[data-pick]')) add(e.target.files);
      var pk = e.target.closest('[data-nc-pick]');
      if(pk){ var cur = QB.pick(key), i = cur.indexOf(pk.dataset.ncPick); if(pk.checked && i<0) cur.push(pk.dataset.ncPick); if(!pk.checked && i>=0) cur.splice(i,1); }
    });
    pg.addEventListener('input', function(e){ if(e.target.id==='nc-name') st.name = e.target.value; if(e.target.id==='nc-mobile') st.mobile = e.target.value; });
    ['dragenter','dragover'].forEach(function(t){ drop.addEventListener(t, function(e){ e.preventDefault(); drop.classList.add('over'); }); });
    ['dragleave','drop'].forEach(function(t){ drop.addEventListener(t, function(e){ e.preventDefault(); drop.classList.remove('over'); }); });
    drop.addEventListener('drop', function(e){ if(e.dataTransfer && e.dataTransfer.files.length) add(e.dataTransfer.files); });
  }

  QB.onState['new-case'] = function(){ st = null; }; // a demo chip loads its preset files
  Q.screen('new-case', { title:function(p){ var c = D.cases[p.parts[0]]; return c ? 'Add plans · '+c.name : 'New case'; }, nav:'cases', render:render, mount:mount });
})();
