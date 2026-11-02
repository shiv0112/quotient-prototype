/* S07 New case (#new-case, #new-case-<case>). Drop 2 to 4 policy illustration PDFs, pick notes, Compare plans. */
(function(){
  'use strict';
  var D = Q.data, F = QD.b.files, st = null;


  var PRESET = { empty:[], one:['harbour'], three:['harbour','meridian','orchid'], many:['harbour','meridian','orchid','harbour2','fifth'],
    notpdf:['harbour','meridian','notpdf'], scanned:['harbour','meridian','scanned'], ilp:['harbour','orchid','ilp'] };
  var STATES = [['empty','Empty'],['one','1 PDF'],['three','3 PDFs'],['many','Too many'],['notpdf','Not a PDF'],['scanned','Scanned'],['ilp','ILP']];

  function prefill(key){
    if(key==='daniel') return { name:'Daniel Lee', notes:'meeting', files:[] };
    if(key==='alvin') return { name:'Alvin Lim', notes:'meeting', files:['harbour2'] };
    if(key && D.cases[key]) return { name:D.cases[key].name, notes:'meeting', files:[] };
    return { name:'', notes:'meeting', files:[] };
  }

  function render(p){
    var key = D.cases[p.parts[0]] ? p.parts[0] : '', c = key ? D.cases[key] : null;
    var s = QB.local('new-case', STATES.map(function(z){ return z[0]; }), 'none', p);
    if(s.fresh || !st){ var pf = prefill(key); st = { name:pf.name, notes:pf.notes, files:(s.s!=='none' ? PRESET[s.s] : pf.files).map(function(k){ return F[k]; }), over:false, tooMany: false }; if(s.s==='three' && !key) st.name = 'Wei Tan'; }
    var cur = s.s==='none' ? '' : s.s;
    var good = st.files.filter(function(f){ return !f.err; }), bad = st.files.filter(function(f){ return f.err; });
    var tooMany = st.files.length>4;
    var ok = good.length>=2 && good.length<=4 && !bad.length && !tooMany;
    var why = tooMany ? 'Up to 4 plans at a time.' : bad.length ? 'Remove the files marked in red.' : good.length===1 ? 'Add at least one more PDF to compare.' : good.length===0 ? 'Add 2 to 4 PDFs to compare.' : '';
    var mtg = key==='daniel' ? 'Daniel Lee · Mon 2 Nov 16:00 · transcript' : key==='alvin' ? 'Alvin Lim · Mon 26 Oct · transcript' : 'Wei Tan · Today 11:00 · transcript';
    var title = c ? 'Add plans · '+c.name+' #'+c.no : 'New case';
    var drop = '<div class="s07-drop'+(st.files.length?' small':'')+(st.over?' over':'')+'" data-drop>'+
      '<span class="ic">'+Q.icon('file')+'</span>'+
      '<span class="big">'+(st.files.length?'Add another PDF':'Drop 2 to 4 policy illustration PDFs')+'</span>'+
      '<span class="small muted"><label>or choose files<input class="sr" type="file" accept="application/pdf,.pdf" multiple data-pick></label></span>'+
      (st.files.length?'':'<button class="btn-link s07-sample" data-act="sample">Use the 3 sample PDFs</button>')+'</div>';
    var files = st.files.length ? '<ul class="s07-files" aria-label="Files">'+st.files.map(function(f,i){
      var over = i>=4;
      if(f.err || over) return '<li class="bad"><span class="ic">'+Q.icon('alert')+'</span><span><b>'+Q.esc(f.name)+'</b><small>'+Q.esc(f.err || 'Up to 4 plans at a time.')+'</small></span><span></span>'+
        '<button class="icon-btn" data-rm="'+i+'" aria-label="Remove '+Q.esc(f.name)+'">'+Q.icon('close')+'</button></li>';
      return '<li><span class="ic">'+Q.icon('file')+'</span><span><b>'+Q.esc(f.ins)+'</b><small>'+Q.esc(f.plan)+' · '+Q.esc(f.name)+'</small></span><span class="pg">'+f.pages+' pages</span>'+
        '<button class="icon-btn" data-rm="'+i+'" aria-label="Remove '+Q.esc(f.name)+'">'+Q.icon('close')+'</button></li>'; }).join('')+'</ul>' : '';
    var banner = tooMany ? '<div class="banner banner-error" role="alert">'+Q.icon('alert')+'<p>Up to 4 plans at a time. Remove one to continue.</p></div>' : '';
    return '<div class="page s07">'+QB.demo(STATES, cur)+
      (c?'<a class="back" href="#case-'+key+'">'+Q.icon('back','i-sm')+'Back to '+Q.esc(c.name)+'</a>':'')+
      '<header class="page-head rise"><div><h1 class="h1">'+Q.esc(title)+'</h1><p class="sub">Your PDFs are read on this device. Nothing is sent until you see exactly what goes.</p></div></header>'+
      '<form class="s07-form rise" novalidate onsubmit="return false">'+
        (c?'':'<div class="field s07-name"><label class="label" for="nc-name">Client name</label><input class="input" id="nc-name" autocomplete="off" value="'+Q.esc(st.name)+'"><span class="hint">'+Q.icon('device','i-sm')+'Stays on this device until you choose to share</span></div>')+
        '<div class="field"><span class="label" id="pdf-l">Policy illustrations</span>'+drop+'</div>'+banner+files+
        '<div class="field" style="max-width:420px"><label class="label" for="nc-notes">Use notes from</label><select class="select" id="nc-notes">'+
          '<option value="meeting"'+(st.notes==='meeting'?' selected':'')+'>'+Q.esc(mtg)+'</option><option value="paste"'+(st.notes==='paste'?' selected':'')+'>Paste notes</option><option value="none"'+(st.notes==='none'?' selected':'')+'>No notes</option></select></div>'+
        '<div class="s07-acts"><button class="btn btn-primary" data-act="compare"'+(ok?'':' aria-disabled="true" title="'+Q.esc(why)+'"')+'>Compare plans</button>'+
        '<a class="btn btn-ghost" href="'+(c?'#case-'+key:'#today')+'">Cancel</a>'+(why?'<span class="why" aria-live="polite">'+Q.esc(why)+'</span>':'')+'</div>'+
      '</form></div>';
    // keep dest for mount
  }

  function fromFile(f){
    var n = f.name, low = n.toLowerCase();
    if(!/\.pdf$/.test(low) && f.type!=='application/pdf') return { name:n, err:'This isn\'t a PDF.' };
    if(/scan/.test(low)) return { name:n, err:F.scanned.err };
    if(/ilp|invest/.test(low)) return { name:n, err:F.ilp.err };
    var hit = ['harbour','meridian','orchid'].filter(function(k){ return low.indexOf(k)>=0; })[0];
    return hit ? { name:n, ins:F[hit].ins, plan:F[hit].plan, pages:F[hit].pages } : { name:n, ins:'Insurer not recognised', plan:'Read on this device', pages:'?' };
  }

  function mount(el, p){
    var key = D.cases[p.parts[0]] ? p.parts[0] : '', pg = el.querySelector('.page'), drop = pg.querySelector('[data-drop]');
    function add(list){ Array.prototype.forEach.call(list, function(f){ st.files.push(fromFile(f)); }); Q.refresh(); }
    pg.addEventListener('click', function(e){
      var rm = e.target.closest('[data-rm]'); if(rm){ st.files.splice(+rm.dataset.rm,1); Q.refresh(); var d = document.querySelector('[data-drop] label'); if(d) d.focus(); return; }
      var a = e.target.closest('[data-act]'); if(!a) return;
      if(a.dataset.act==='sample'){ st.files = ['harbour','meridian','orchid'].map(function(k){ return F[k]; }); if(!st.name) st.name = 'Wei Tan'; Q.refresh(); }
      if(a.dataset.act==='compare'){ if(a.getAttribute('aria-disabled')==='true') return;
        // Each case goes to its own gate. A case that already has plans has no demo gate for new ones.
        if(!key) Q.go('#gate-wei');
        else if(/^compare/.test(QB.feature(key)||'')) Q.go('#gate-'+key);
        else { Q.toast('Demo: plans added to case #'+D.cases[key].no); Q.go('#case-'+key); } }
    });
    pg.addEventListener('change', function(e){
      if(e.target.matches('[data-pick]')) add(e.target.files);
      if(e.target.id==='nc-notes') st.notes = e.target.value;
    });
    pg.addEventListener('input', function(e){ if(e.target.id==='nc-name') st.name = e.target.value; });
    ['dragenter','dragover'].forEach(function(t){ drop.addEventListener(t, function(e){ e.preventDefault(); drop.classList.add('over'); }); });
    ['dragleave','drop'].forEach(function(t){ drop.addEventListener(t, function(e){ e.preventDefault(); drop.classList.remove('over'); }); });
    drop.addEventListener('drop', function(e){ if(e.dataTransfer && e.dataTransfer.files.length) add(e.dataTransfer.files); });
  }

  Q.screen('new-case', { title:function(p){ var c = D.cases[p.parts[0]]; return c ? 'Add plans · '+c.name : 'New case'; }, nav:'cases', render:render, mount:mount });
})();
