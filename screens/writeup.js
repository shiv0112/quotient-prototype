/* S14 Write-up (#writeup-<case>[-<state>]). States: notdrafted, drafting, default (blanks), ticked, copied, chose, error.
   Parts follow MAS Notice FAA-N16 para 35 (with 31 and 36): (a) objectives, finances and needs (para 11 items), (b) why this plan,
   (c) disadvantages, then optional "Other plans considered" and conditional parts (replacing a policy §42 to §44, client chose differently §32).
   Missing facts are yellow blanks, never guessed. Every sentence carries its source. A part can't be ticked while it has blanks or is empty.
   Copy unlocks when every required part is ticked. Progress counts come from Q.writeupProgress (core.js), shared with Today, Cases and Case. */
(function(){
  'use strict';
  var D = Q.data, W = D.writeup, ui = { hash:null };

  /* "i" info button with a rule-reference popover (shared by write-up and MAS; first loaded copy wires the listeners) */
  function info(t){ return '<span class="u2-i"><button type="button" class="u2-ib" aria-label="Rule reference" aria-expanded="false">'+Q.icon('info','i-sm')+'</button><span class="u2-tip" role="tooltip">'+Q.esc(t)+'</span></span>'; }
  function rule(r){ return /^§/.test(r) ? 'MAS Notice FAA-N16 '+r : /^FAQ/.test(r) ? 'MAS '+r : r; }
  function lnk(s){ return s.replace(/ ?\((?:§|FAQ )[^()]*(?:\([^()]*\))?[^()]*\)([.,:;])?/g, function(m, p){ return (p||'')+' '+info(rule(m.trim().replace(/[.,:;]$/,'').slice(1,-1))); }); }
  function strip(s){ return s.replace(/ ?\((?:§|FAQ )[^()]*(?:\([^()]*\))?[^()]*\)/g, ''); }
  if(!window.__u2tip){ window.__u2tip = 1;
    var shut = function(except){ document.querySelectorAll('.u2-i.open').forEach(function(w){ if(w!==except){ w.classList.remove('open'); w.firstChild.setAttribute('aria-expanded','false'); } }); };
    var place = function(w){ var t = w.lastChild, b = w.firstChild.getBoundingClientRect(), tw = t.offsetWidth, th = t.offsetHeight; t.style.left = t.style.top = '0px'; var o = t.getBoundingClientRect(); /* a transformed ancestor (dialog) moves the fixed origin */ t.style.left = Math.max(8, Math.min(b.left, window.innerWidth-8-tw))-o.left+'px'; t.style.top = (b.bottom+th+8>window.innerHeight && b.top-th-4>8 ? b.top-th-4 : b.bottom-6)-o.top+'px'; };
    document.addEventListener('click', function(e){ var b = e.target.closest('.u2-ib'), w = b && b.parentNode; shut(w); if(!w) return; e.preventDefault(); e.stopPropagation(); var o = w.classList.toggle('open'); b.setAttribute('aria-expanded', o); place(w); });
    document.addEventListener('keydown', function(e){ if(e.key==='Escape'){ var o = document.querySelector('.u2-i.open'); if(o){ shut(); o.firstChild.focus(); } } });
    ['mouseover','focusin'].forEach(function(n){ document.addEventListener(n, function(e){ var w = e.target.closest && e.target.closest('.u2-i'); if(w) place(w); }); });
  }
  var LIST = { needs:true, switch:true, chose:true }; // parts shown as one line per item

  /* sentence: [text, srcLabel, srcRef, {blank}] or [{blank}] -> {t, src, ref, blank} */
  function norm(x){ return typeof x[0]==='object' ? { t:'', src:null, ref:null, blank:x[0].blank } : { t:strip(x[0]), src:x[1], ref:x[2], blank:x[3]?x[3].blank:null }; }
  function reset(st){
    ui.parts = W.parts.map(function(p){ return { key:p.key, title:p.title, ref:p.ref, need:p.need, s:p.s.map(norm) }; });
    ui.ticked = W.parts.map(function(p){ return !!p.ticked; });
    ui.on = W.parts.map(function(p){ return !!p.on; });
    ui.fills = st ? {} : (W.fills = W.fills || {}); // the real write-up shares its fills and ticks with the case
    ui.editing = null; ui.editPart = null; ui.copied = false; ui.st = st;
    if(st==='chose') ui.on[idx('chose')] = true;
    if(st==='ticked' || st==='copied'){
      var sample = { '0-1':'Low to medium. Prefers guaranteed values.', '2-3':'about S$310 a year', '3-1':'no critical illness rider, which Siti asked for.' };
      ui.parts.forEach(function(P,i){ if(P.need==='cond') return; P.s.forEach(function(x,j){ if(x.blank) ui.fills[i+'-'+j] = sample[i+'-'+j] ? { v:sample[i+'-'+j] } : { nd:true }; }); ui.ticked[i] = true; });
      ui.copied = st==='copied';
    }
  }
  function idx(key){ return ui.parts.map(function(p){ return p.key; }).indexOf(key); }
  function sync(){ if(!ui.st && ui.key===W.c) ui.ticked.forEach(function(t,i){ W.parts[i].ticked = t; W.parts[i].on = ui.on[i]; }); }
  function counts(i){ var P = ui.parts[i]; return P.need==='req' || (P.need==='cond' && ui.on[i]); }
  function shown(i){ return ui.parts[i].need!=='cond' || ui.on[i]; }
  function blanksLeft(i){ return ui.parts[i].s.filter(function(x,j){ return x.blank && !ui.fills[i+'-'+j]; }).length; }
  function empty(i){ return !plain(i).trim(); }
  function req(){ return ui.parts.map(function(p,i){ return i; }).filter(counts); }
  function tickedCount(){ return req().filter(function(i){ return ui.ticked[i]; }).length; }

  function demo(key, cur){
    var list = [['notdrafted','Not drafted'],['drafting','Drafting'],['','With blanks'],['ticked','All ticked'],['copied','Copied'],['chose','Client chose differently'],['error','Error']];
    return '<nav class="switcher" aria-label="Demo states"><span class="eyebrow">Demo states</span><div class="switcher-chips">'+list.map(function(x){
      return '<button class="chip" data-go="#writeup-'+key+(x[0]?'-'+x[0]:'')+'" aria-pressed="'+(x[0]===cur)+'">'+x[1]+'</button>'; }).join('')+'</div></nav>';
  }

  function srcChip(x){
    if(!x.src) return '';
    if(x.src==='Edited by you' || x.src==='Added by you') return '<span class="source wu-you">'+Q.esc(x.src)+'</span>';
    var mic = x.ref.indexOf('m:')===0;
    var attr = mic ? 'data-src="'+x.ref.slice(2)+'"' : 'data-sheet="'+x.ref+'"';
    return '<button class="source" '+attr+' aria-label="Source: '+Q.esc(mic?'meeting '+x.src:x.src)+'">'+Q.icon(mic?'mic':'file','i-sm')+Q.esc(x.src)+'</button>';
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
    return x.t + (x.blank ? (f ? (f.nd?'Not discussed.':f.v) : '['+x.blank+']') : ''); }).join(LIST[ui.parts[i].key]?'\n':' '); }

  function part(i, n){
    var P = ui.parts[i], t = ui.ticked[i], left = blanksLeft(i), none = empty(i), editing = ui.editPart===i, blocked = !t && (left || none);
    var status = !t && left ? '<span class="chip chip-warn">'+left+' blank'+(left>1?'s':'')+'</span>' : '';
    var fill = '';
    if(ui.editing && ui.editing.indexOf(i+'-')===0){ var x = P.s[+ui.editing.split('-')[1]], f = ui.fills[ui.editing];
      fill = '<div class="wu-fill"><label class="label" for="wu-in">'+Q.esc(x.blank)+'</label><input class="input" id="wu-in" value="'+Q.esc(f&&f.v||'')+'" placeholder="Type what was said">'+
        '<button class="btn btn-secondary btn-sm" data-act="save">Save</button><button class="btn-link" data-act="nd">Not discussed</button><button class="btn-link" data-act="cancel">Cancel</button></div>'; }
    var text = LIST[P.key] ? '<ul class="wu-body wu-list">'+P.s.map(function(x,j){ return '<li>'+sentence(i,j,x)+'</li>'; }).join('')+'</ul>'
      : '<p class="wu-body">'+P.s.map(function(x,j){ return sentence(i,j,x); }).join(' ')+'</p>';
    var body = editing
      ? '<div class="field"><label class="label" for="wu-ed">Edit part '+n+'</label><textarea class="textarea" id="wu-ed" rows="5">'+Q.esc(plain(i))+'</textarea>'+
        '<span class="hint">Sources stay on sentences you don\'t change. Edited text shows "Edited by you".</span>'+
        '<div class="row"><button class="btn btn-secondary btn-sm" data-act="saveedit">Save</button><button class="btn-link" data-act="canceledit">Cancel</button></div></div>'
      : (none ? '<p class="wu-body muted">Nothing written yet.</p>' : text)+fill;
    var why = left ? 'Fill or mark the blank first.' : 'This part is required. Write at least one point first.';
    var off = P.key==='switch' ? '<button class="btn-link" data-act="switch-off">Not replacing a policy</button>' : '';
    return '<section class="card wu-part'+(t?' ticked':'')+'" aria-labelledby="wu-h'+i+'">'+
      '<header class="wu-ph"><span class="wu-n" aria-hidden="true">'+(t?Q.icon('check','i-sm'):n)+'</span><h2 class="h3" id="wu-h'+i+'"><span class="sr">Part '+n+': </span>'+Q.esc(P.title)+' '+info(rule(P.ref))+'</h2>'+
        (P.need==='opt'?'<span class="chip chip-outline">Optional</span>':'')+status+
        (editing?'':'<button class="btn btn-ghost btn-sm" data-edit="'+i+'">Edit</button>')+'</header>'+body+
      '<footer class="wu-pf"><label class="check"><input type="checkbox" data-tick="'+i+'"'+(t?' checked':'')+(blocked?' disabled aria-describedby="wu-why'+i+'"':'')+'> This part is right</label>'+
        (blocked?'<span class="hint" id="wu-why'+i+'">'+Q.icon('info','i-sm')+why+'</span>':'')+off+'</footer></section>';
  }
  /* Replacing a policy, collapsed when the notes don't mention one. */
  function switchRow(i){
    return '<section class="card wu-cond" aria-label="Replacing an existing policy"><p><b>Not replacing a policy</b><span class="dot-sep"></span><button class="btn-link" data-act="switch-on">Change</button></p>'+
      info(rule(ui.parts[i].ref))+'</section>';
  }

  function aside(key, c, st){
    var drafted = !(st==='notdrafted'||st==='drafting'||st==='error'), r = req(), n = tickedCount(), all = n===r.length, sel = c.selected;
    var copy = ui.copied ? '<button class="btn btn-primary btn-block" data-act="copy">'+Q.icon('check','i-sm')+'Copied</button>'
      : '<button class="btn btn-primary btn-block" data-act="copy"'+(all?'':' aria-disabled="true" title="Tick all '+r.length+' required parts first"')+'>Copy for firm portal</button>';
    var mp = Q.masProgress(key);
    var mas = sel ? '<b>Selected Client · firm review needed</b><span class="small muted">'+mp.done+' of '+mp.total+' checks done</span>'
      : '<b>Not a Selected Client</b><span class="small muted">0 of 3 "no"</span>';
    return '<aside class="wu-aside">'+(!drafted?'':
      '<section class="card wu-ready" aria-labelledby="wu-r"><p class="eyebrow" id="wu-r">For the firm portal</p>'+
        '<p class="big">'+n+' of '+r.length+'<small>required parts ticked</small></p><div class="wu-meter" style="grid-template-columns:repeat('+r.length+',1fr)" aria-hidden="true">'+r.map(function(i){ return '<i class="'+(ui.ticked[i]?'on':'')+'"></i>'; }).join('')+'</div>'+
        '<div class="u2-dock">'+copy+'</div><p class="small muted">'+(all?'Paste each part into your firm\'s portal. Nothing is sent from here.':'Tick each part when it reads right.')+'</p></section>')+
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
    var plan = c.chose || W.plan, n = tickedCount(), total = req().length;
    var head = '<header>'+'<a class="back" href="#case-'+key+'">'+Q.icon('back','i-sm')+'Back to '+Q.esc(c.name)+'</a>'+
      '<h1 class="h1 display">Write-up · '+Q.esc(c.name)+' <span class="case-no" style="font-family:var(--f-text);font-size:var(--t-lg);letter-spacing:0">#'+c.no+'</span></h1>'+
      '<p class="wu-sub">'+Q.esc(plan)+(st==='notdrafted'||st==='drafting'||st==='error'?'':'<span class="dot-sep"></span>drafted '+W.drafted+'<span class="dot-sep"></span><span aria-live="polite">'+n+' of '+total+' parts ticked</span>')+'</p>'+
      '<p class="wu-note">'+Q.icon('info','i-sm')+'A draft for you to check, laid out the way MAS expects. It is not advice and not a sign-off.'+info('MAS Notice FAA-N16 §35')+'</p></header>';
    var main;
    if(st==='notdrafted') main = '<section class="card hero wu-gate" aria-labelledby="wu-g"><div><p class="eyebrow">Next step</p><h2 id="wu-g">Draft the write-up from your notes and '+Q.esc(plan.replace('Harbour Assurance','Harbour'))+'</h2>'+
        '<p>It goes through the privacy gate first. You see exactly what leaves your device before anything is sent.</p></div>'+
        '<div class="acts u2-dock"><a class="btn btn-primary" href="#gate-'+key+'">Draft write-up'+Q.icon('arrow','i-sm')+'</a></div></section>';
    else if(st==='drafting') main = '<section class="card" aria-busy="true" aria-labelledby="wu-d"><h2 class="h3" id="wu-d">Drafting the write-up…</h2>'+
        '<ul class="wu-steps" style="margin-top:var(--s-4)"><li>'+Q.icon('check','i-sm')+'Names replaced</li><li>'+Q.icon('check','i-sm')+'Sent '+QB.view(key).charsLabel+' characters</li>'+
        '<li><span class="wu-spin" aria-hidden="true"></span>Writing each part</li><li><span class="todo-dot" aria-hidden="true"></span>Putting names back</li></ul>'+
        '<p class="small" style="margin-top:var(--s-4)"><a href="#sent-'+key+'">See what was sent</a></p></section>'+
        [1,2].map(function(){ return '<div class="card"><span class="skel" style="width:35%"></span><span class="skel" style="width:92%;margin-top:16px"></span><span class="skel" style="width:70%;margin-top:10px"></span></div>'; }).join('');
    else if(st==='error') main = '<div class="banner banner-error" role="alert">'+Q.icon('alert')+'<p>Couldn\'t draft. Nothing else was sent.</p><button class="btn-link" data-go="#gate-'+key+'">Try again</button></div>';
    else { var k = 0; main = ui.parts.map(function(P,i){ if(P.key==='switch' && !ui.on[i]) return switchRow(i); return shown(i) ? part(i, ++k) : ''; }).join('')+
      '<div class="wu-foot">'+
        '<p>'+Q.icon('info','i-sm')+'<span>Your firm\'s form follows the LIA Minimum Standard for Life Insurance Advisory Process. Paste each part into the matching section.'+info('MAS Notice FAA-N16 §34')+'</span></p>'+
        '<p>'+Q.icon('info','i-sm')+'<span>Give the client a summary of their information and this recommendation before they sign.'+info('MAS Notice FAA-N16 §36')+'</span></p></div>'; }
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
        if(txt!==plain(i)){ ui.parts[i].s = txt ? [{ t:txt, src:'Edited by you', ref:null, blank:null }] : []; Object.keys(ui.fills).forEach(function(k){ if(k.indexOf(i+'-')===0) delete ui.fills[k]; }); ui.ticked[i] = false; }
        ui.editPart = null; Q.refresh(); }
      if(a==='canceledit'){ ui.editPart = null; Q.refresh(); }
      if(a==='switch-on' || a==='switch-off'){ var s = idx('switch'); ui.on[s] = a==='switch-on'; if(!ui.on[s]) ui.ticked[s] = false; Q.refresh();
        var f = document.querySelector(a==='switch-on' ? '[data-act="switch-off"]' : '[data-act="switch-on"]'); if(f) f.focus({preventScroll:true}); }
      if(a==='copy'){
        var k = 0, all = ui.parts.map(function(P,i){ if(!shown(i) || (P.need==='opt' && !ui.ticked[i])) return ''; return (++k)+'. '+P.title+' ('+P.ref+')\n'+plain(i); }).filter(Boolean).join('\n\n');
        try{ navigator.clipboard && navigator.clipboard.writeText(all).catch(function(){}); }catch(e){}
        ui.copied = true; Q.refresh(); Q.toast('Copied. Paste each part into your firm portal.');
        var h = ui.hash; setTimeout(function(){ if(ui.hash===h && ui.st!=='copied'){ ui.copied = false; Q.refresh(); } }, 2000);
      }
    }
    pg.addEventListener('click', function(e){
      var b = e.target.closest('[data-blank]'); if(b){ ui.editing = b.dataset.blank; Q.refresh(); return; }
      var s = e.target.closest('[data-src]'); if(s){ var z = s.dataset.src.split('@'); transcript(z[0], z[1]); return; }
      var ed = e.target.closest('[data-edit]'); if(ed){ ui.editPart = +ed.dataset.edit; ui.editing = null; Q.refresh(); return; }
      var a = e.target.closest('[data-act]'); if(a && a.getAttribute('aria-disabled')!=='true') act(a.dataset.act);
    });
    pg.addEventListener('change', function(e){
      var t = e.target.closest('[data-tick]'); if(!t) return;
      var i = +t.dataset.tick; if(t.checked && (blanksLeft(i) || empty(i))){ t.checked = false; return; }
      ui.ticked[i] = t.checked; Q.refresh();
      var again = document.querySelector('[data-tick="'+i+'"]'); if(again) again.focus({preventScroll:true});
    });
  }

  /* Source chip -> the meeting transcript on this device, the quoted line highlighted. */
  function transcript(mid, at){
    var x = Q.meetingById(mid), tr = D.transcripts[mid]; if(!x || !tr) return;
    var c = x.m.c ? D.cases[x.m.c] : null;
    Q.sheet({ title:'Meeting with '+x.m.who+' · '+x.m.date, body:'<p class="small muted">Transcript · '+(tr.labels?'You and Client':'mic only')+(c?' · Case #'+c.no:'')+'</p><ul class="transcript">'+tr.lines.map(function(l){
      var t = tr.labels ? l[1] : l[0], txt = tr.labels ? l[0]+': '+l[2] : l[1], hit = t===at;
      return '<li style="grid-template-columns:52px 1fr;'+(hit?'background:var(--ph-bg);color:var(--ph-ink);border-radius:6px;padding:6px 8px;margin:0 -8px':'padding:6px 0')+'"><span class="num'+(hit?'':' muted')+'">'+t+'</span><span>'+Q.esc(txt)+'</span></li>'; }).join('')+'</ul>',
      foot:'<a class="btn btn-secondary" href="#meeting-'+mid+'">Open meeting</a><button class="btn btn-ghost" data-close>Close</button>' });
  }

  Q.screen('writeup', { title:function(p){ var c = D.cases[p.parts[0]]; return 'Write-up'+(c?' · '+c.name:''); }, nav:'cases', render:render, mount:mount });
})();
