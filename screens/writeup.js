/* S14 Write-up (#writeup-<case>[-<state>]). States: notdrafted, drafting, default (blanks, 2 of 4 ticked), ticked, copied, error.
   Four parts. Missing facts are yellow blanks, never guessed. Every sentence carries its source. A part can't be ticked
   until its blanks are filled or marked "Not discussed". Copy unlocks when all 4 are ticked. */
(function(){
  'use strict';
  var D = Q.data, C = QD.c, W = D.writeup, ui = { hash:null };


  /* sentence: [text, srcLabel, srcRef, {blank}] or [{blank}] -> {t, src, ref, blank} */
  function norm(x){ return typeof x[0]==='object' ? { t:'', src:null, ref:null, blank:x[0].blank } : { t:x[0], src:x[1], ref:x[2], blank:x[3]?x[3].blank:null }; }
  function reset(st){
    ui.parts = W.parts.map(function(p){ return { title:p.title, s:p.s.map(norm) }; });
    ui.ticked = W.parts.map(function(p){ return p.ticked; });
    ui.fills = st ? {} : (W.fills = W.fills || {}); // the real write-up shares its fills and ticks with the case ui.editing = null; ui.editPart = null; ui.copied = false; ui.st = st;
    if(st==='ticked' || st==='copied'){
      ui.fills['2-1'] = { v:'Orchid Mutual has no critical illness rider, which Siti asked for.' };
      ui.fills['3-1'] = { nd:true };
      ui.ticked = [true,true,true,true]; ui.copied = st==='copied';
    }
  }
  function sync(){ if(!ui.st && ui.key===W.c) ui.ticked.forEach(function(t,i){ W.parts[i].ticked = t; }); }
  function blanksLeft(i){ return ui.parts[i].s.filter(function(x,j){ return x.blank && !ui.fills[i+'-'+j]; }).length; }
  function tickedCount(){ return ui.ticked.filter(Boolean).length; }

  function demo(key, cur){
    var list = [['notdrafted','Not drafted'],['drafting','Drafting'],['','With blanks'],['ticked','All ticked'],['copied','Copied'],['error','Error']];
    return '<nav class="switcher" aria-label="Demo states"><span class="eyebrow">Demo states</span><div class="switcher-chips">'+list.map(function(x){
      return '<button class="chip" data-go="#writeup-'+key+(x[0]?'-'+x[0]:'')+'" aria-pressed="'+(x[0]===cur)+'">'+x[1]+'</button>'; }).join('')+'</div></nav>';
  }

  function srcChip(x){
    if(!x.src) return '';
    if(x.src==='Edited by you' || x.src==='Added by you') return '<span class="source wu-you">'+Q.esc(x.src)+'</span>';
    var ic = x.ref.indexOf('m:')===0 ? 'mic' : 'file';
    var attr = ic==='mic' ? 'data-src="'+x.ref.slice(2)+'"' : 'data-sheet="'+x.ref+'"';
    return '<button class="source" '+attr+' aria-label="Source: '+Q.esc(x.src)+'">'+Q.icon(ic,'i-sm')+Q.esc(x.src)+'</button>';
  }
  function sentence(i, j, x){
    var k = i+'-'+j, f = ui.fills[k], out = Q.esc(x.t);
    if(x.blank){
      if(!f) out += '<button class="blank" data-blank="'+k+'" aria-label="'+Q.esc(x.blank)+': blank. Fill it in or mark not discussed.">'+Q.esc(x.blank)+' · blank</button>';
      else if(f.nd) out += '<span class="chip">Not discussed</span>';
      else out += '<button class="wu-fb" data-blank="'+k+'" aria-label="Edit: '+Q.esc(f.v)+'"><span class="wu-filled">'+Q.esc(f.v)+'</span></button>';
      return out+' '+(f&&!f.nd?'<span class="source wu-you">Added by you</span>':'');
    }
    return out+srcChip(x);
  }
  function plain(i){ return ui.parts[i].s.map(function(x,j){ var f = ui.fills[i+'-'+j];
    return x.t + (x.blank ? (f ? (f.nd?'Not discussed.':f.v) : '['+x.blank+']') : ''); }).join(' '); }

  function part(i){
    var P = ui.parts[i], t = ui.ticked[i], left = blanksLeft(i), editing = ui.editPart===i;
    var status = !t && left ? '<span class="chip chip-warn">'+left+' blank'+(left>1?'s':'')+'</span>' : '';
    var fill = '';
    if(ui.editing && ui.editing.indexOf(i+'-')===0){ var x = P.s[+ui.editing.split('-')[1]], f = ui.fills[ui.editing];
      fill = '<div class="wu-fill"><label class="label" for="wu-in">'+Q.esc(x.blank)+'</label><input class="input" id="wu-in" value="'+Q.esc(f&&f.v||'')+'" placeholder="Type what was said">'+
        '<button class="btn btn-secondary btn-sm" data-act="save">Save</button><button class="btn-link" data-act="nd">Not discussed</button><button class="btn-link" data-act="cancel">Cancel</button></div>'; }
    var body = editing
      ? '<div class="field"><label class="label" for="wu-ed">Edit part '+(i+1)+'</label><textarea class="textarea" id="wu-ed" rows="4">'+Q.esc(plain(i))+'</textarea>'+
        '<span class="hint">Sources stay on sentences you don\'t change. Edited text shows "Edited by you".</span>'+
        '<div class="row"><button class="btn btn-secondary btn-sm" data-act="saveedit">Save</button><button class="btn-link" data-act="canceledit">Cancel</button></div></div>'
      : '<p class="wu-body">'+P.s.map(function(x,j){ return sentence(i,j,x); }).join(' ')+'</p>'+fill;
    return '<section class="card wu-part'+(t?' ticked':'')+'" aria-labelledby="wu-h'+i+'">'+
      '<header class="wu-ph"><span class="wu-n" aria-hidden="true">'+(t?Q.icon('check','i-sm'):(i+1))+'</span><h2 class="h3" id="wu-h'+i+'"><span class="sr">Part '+(i+1)+': </span>'+Q.esc(P.title)+'</h2>'+status+
        (editing?'':'<button class="btn btn-ghost btn-sm" data-edit="'+i+'">Edit</button>')+'</header>'+body+
      '<footer class="wu-pf"><label class="check"><input type="checkbox" data-tick="'+i+'"'+(t?' checked':'')+(left&&!t?' disabled aria-describedby="wu-why'+i+'"':'')+'> This part is right</label>'+
        (left&&!t?'<span class="hint" id="wu-why'+i+'">'+Q.icon('info','i-sm')+'Fill or mark the blank first.</span>':'')+'</footer></section>';
  }

  function aside(key, c, st){
    var drafted = !(st==='notdrafted'||st==='drafting'||st==='error'), n = tickedCount(), all = n===4, sel = c.selected;
    var copy = ui.copied ? '<button class="btn btn-primary btn-block" data-act="copy">'+Q.icon('check','i-sm')+'Copied</button>'
      : '<button class="btn btn-primary btn-block" data-act="copy"'+(all?'':' aria-disabled="true" title="Tick all 4 parts first"')+'>Copy for firm portal</button>';
    var masDone = D.mas.c===key ? D.mas.checklist.filter(function(x){ return x.done; }).length : 0;
    var mas = sel ? '<b>Selected Client · firm review needed</b><span class="small muted">'+masDone+' of 5 checks done</span>'
      : '<b>Not a Selected Client</b><span class="small muted">0 of 3 "no"</span>';
    return '<aside class="wu-aside">'+(!drafted?'':
      '<section class="card wu-ready" aria-labelledby="wu-r"><p class="eyebrow" id="wu-r">For the firm portal</p>'+
        '<p class="big">'+n+' of 4<small>parts ticked</small></p><div class="wu-meter" aria-hidden="true">'+ui.ticked.map(function(t){ return '<i class="'+(t?'on':'')+'"></i>'; }).join('')+'</div>'+
        copy+'<p class="small muted">'+(all?'Paste it into your firm\'s portal. Nothing is sent from here.':'Tick each part when it reads right.')+'</p></section>')+
      '<section class="card wu-mas" aria-labelledby="wu-m"><p class="eyebrow" id="wu-m">Selected Client check</p>'+mas+
        '<p class="wu-dev">'+Q.icon('device','i-sm')+'<span>Checked on this device · plain rules · nothing sent</span></p>'+
        '<a href="#mas-'+key+'" class="small" style="font-weight:600">Open MAS checks</a></section>'+
      '<p class="wu-dev" style="padding:0 var(--s-2)">'+Q.icon('device','i-sm')+'<a href="#sent-'+key+'">What left your device for this case</a></p></aside>';
  }

  function render(p){
    var key = D.cases[p.parts[0]] ? p.parts[0] : 'siti', c = D.cases[key];
    if(location.hash!==ui.hash){ ui.hash = location.hash; reset(p.parts[1]||''); }
    ui.key = key; sync();
    var st = p.state==='error' ? 'error' : p.state==='loading' ? 'drafting' : p.state==='empty' ? 'notdrafted' : ui.st;
    var plan = c.chose || W.plan, n = tickedCount();
    var head = '<header>'+'<a class="back" href="#case-'+key+'">'+Q.icon('back','i-sm')+'Back to '+Q.esc(c.name)+'</a>'+
      '<h1 class="h1 display">Write-up · '+Q.esc(c.name)+' <span class="case-no" style="font-family:var(--f-text);font-size:var(--t-lg);letter-spacing:0">#'+c.no+'</span></h1>'+
      '<p class="wu-sub">'+Q.esc(plan)+(st==='notdrafted'||st==='drafting'||st==='error'?'':'<span class="dot-sep"></span>drafted '+W.drafted+'<span class="dot-sep"></span><span aria-live="polite">'+n+' of 4 parts ticked</span>')+'</p>'+
      '<p class="wu-note">'+Q.icon('info','i-sm')+'A draft for you to check. It is not advice and not a sign-off.</p></header>';
    var main;
    if(st==='notdrafted') main = '<section class="card hero wu-gate" aria-labelledby="wu-g"><div><p class="eyebrow">Next step</p><h2 id="wu-g">Draft the write-up from your notes and '+Q.esc(plan.replace('Harbour Assurance','Harbour'))+'</h2>'+
        '<p>It goes through the privacy gate first. You see exactly what leaves your device before anything is sent.</p></div>'+
        '<div class="acts"><a class="btn btn-primary" href="#gate-'+key+'">Draft write-up'+Q.icon('arrow','i-sm')+'</a></div></section>';
    else if(st==='drafting') main = '<section class="card" aria-busy="true" aria-labelledby="wu-d"><h2 class="h3" id="wu-d">Drafting the write-up…</h2>'+
        '<ul class="wu-steps" style="margin-top:var(--s-4)"><li>'+Q.icon('check','i-sm')+'Names replaced on this device</li><li>'+Q.icon('check','i-sm')+'Sent '+QB.view(key).charsLabel+' characters</li>'+
        '<li><span class="wu-spin" aria-hidden="true"></span>Writing the 4 parts</li><li><span class="todo-dot" aria-hidden="true"></span>Putting names back on this device</li></ul>'+
        '<p class="small" style="margin-top:var(--s-4)"><a href="#sent-'+key+'">See what was sent</a></p></section>'+
        [1,2].map(function(){ return '<div class="card"><span class="skel" style="width:35%"></span><span class="skel" style="width:92%;margin-top:16px"></span><span class="skel" style="width:70%;margin-top:10px"></span></div>'; }).join('');
    else if(st==='error') main = '<div class="banner banner-error" role="alert">'+Q.icon('alert')+'<p>Couldn\'t draft. Nothing else was sent.</p><button class="btn-link" data-go="#gate-'+key+'">Try again</button></div>';
    else main = ui.parts.map(function(x,i){ return part(i); }).join('');
    return '<div class="page wu">'+demo(key, ui.st)+head+'<div class="wu-grid"><div class="wu-parts">'+main+'</div>'+aside(key, c, st)+'</div></div>';
  }

  function mount(el, p){
    var key = D.cases[p.parts[0]] ? p.parts[0] : 'siti', pg = el.querySelector('.page');
    var inp = pg.querySelector('#wu-in'); if(inp){ inp.focus(); inp.addEventListener('keydown', function(e){ if(e.key==='Enter') act('save'); if(e.key==='Escape') act('cancel'); }); }
    var ed = pg.querySelector('#wu-ed'); if(ed) ed.focus();
    function act(a){
      if(a==='save'){ var v = pg.querySelector('#wu-in').value.trim(); if(!v){ pg.querySelector('#wu-in').setAttribute('aria-invalid','true'); return; } ui.fills[ui.editing] = { v:v }; ui.editing = null; Q.refresh(); }
      if(a==='nd'){ ui.fills[ui.editing] = { nd:true }; ui.editing = null; Q.refresh(); }
      if(a==='cancel'){ ui.editing = null; Q.refresh(); }
      if(a==='saveedit'){ var i = ui.editPart, txt = pg.querySelector('#wu-ed').value.trim();
        if(txt && txt!==plain(i)){ ui.parts[i].s = [{ t:txt, src:'Edited by you', ref:null, blank:null }]; Object.keys(ui.fills).forEach(function(k){ if(k.indexOf(i+'-')===0) delete ui.fills[k]; }); ui.ticked[i] = false; }
        ui.editPart = null; Q.refresh(); }
      if(a==='canceledit'){ ui.editPart = null; Q.refresh(); }
      if(a==='copy'){
        var all = ui.parts.map(function(P,i){ return (i+1)+'. '+P.title+'\n'+plain(i); }).join('\n\n');
        try{ navigator.clipboard && navigator.clipboard.writeText(all).catch(function(){}); }catch(e){}
        ui.copied = true; Q.refresh(); Q.toast('Copied. Paste it into your firm portal.');
        var h = ui.hash; setTimeout(function(){ if(ui.hash===h && ui.st!=='copied'){ ui.copied = false; Q.refresh(); } }, 2000);
      }
    }
    pg.addEventListener('click', function(e){
      var b = e.target.closest('[data-blank]'); if(b){ ui.editing = b.dataset.blank; Q.refresh(); return; }
      var s = e.target.closest('[data-src]'); if(s){ transcript(s.dataset.src); return; }
      var ed = e.target.closest('[data-edit]'); if(ed){ ui.editPart = +ed.dataset.edit; ui.editing = null; Q.refresh(); return; }
      var a = e.target.closest('[data-act]'); if(a && a.getAttribute('aria-disabled')!=='true') act(a.dataset.act);
    });
    pg.addEventListener('change', function(e){
      var t = e.target.closest('[data-tick]'); if(!t) return;
      var i = +t.dataset.tick; if(t.checked && blanksLeft(i)){ t.checked = false; return; }
      ui.ticked[i] = t.checked; Q.refresh();
      var again = document.querySelector('[data-tick="'+i+'"]'); if(again) again.focus({preventScroll:true});
    });
  }

  function transcript(at){
    var m = C.sitiMeeting;
    Q.sheet({ title:m.title, body:'<p class="small muted">'+Q.icon('device','i-sm')+' Transcript on this device · mic only</p><ul class="transcript">'+m.lines.map(function(l){
      var hit = l[0]===at; return '<li style="grid-template-columns:52px 1fr;'+(hit?'background:var(--ph-bg);color:var(--ph-ink);border-radius:6px;padding:6px 8px;margin:0 -8px':'padding:6px 0')+'"><span class="num'+(hit?'':' muted')+'">'+l[0]+'</span><span>'+Q.esc(l[1])+'</span></li>'; }).join('')+'</ul>',
      foot:'<button class="btn btn-secondary" data-close>Close</button>' });
  }

  Q.screen('writeup', { title:function(p){ var c = D.cases[p.parts[0]]; return 'Write-up'+(c?' · '+c.name:''); }, nav:'cases', render:render, mount:mount });
})();
