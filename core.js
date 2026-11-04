/* Quotient prototype core. No framework, no build. Loaded after data.js, before screens/*.js.

   ADD A SCREEN (one file in screens/, one <script> tag in index.html):
     Q.screen('share', {
       title: 'Share',                 // document title (string or fn(params))
       rail: true,                     // false = focus mode (rail and tab bar hidden)
       nav: 'cases',                   // which rail item lights up: today|meetings|cases|prefs
       render: function(p){ return '<div class="page">...</div>'; },   // returns an HTML string
       mount:  function(el, p){ ... }  // optional: wire events after render
     });

   ROUTES: '#<id>' or '#<id>-<arg>'. Longest registered id wins, so '#gate-edit-wei' -> id 'gate-edit', arg 'wei'.
     p = { id, arg, parts:arg.split('-'), state, edition }
     Hash names: ASCII letters, digits, hyphens. Settings is '#prefs'.
     Query string (works on file://): ?theme=light|dark|system  ?edition=web|desktop  ?state=normal|empty|error|loading

   HELPERS
     Q.data                 demo data (data.js). Mutate it, then Q.refresh() or Q.go(): every render saves
                            cases, writeup, mas and meetings to sessionStorage, so the state is shared by all screens.
                            ?reset (or Demo > Reset demo data) starts fresh.
     Q.status(caseKey)      {why, btn, go, needs}: the one short next step, used by Today, Cases and Case.
     Q.writeupProgress(k) / Q.masProgress(k)  {done,total}: the one count for write-up parts and firm review checks.
     Q.worry(case)          the kept worry text ('' if none or only suggested).
     Q.phonePreview(on?)    prototype only: wide screens show the app in an iPhone frame (iframe ?frame=phone). [data-phone] opens it.
     Q.caseMeetings(k)      [{m, upcoming}] every meeting and quick note on a case, oldest first.  Q.meetingById(id) -> {m, past}.
     [data-quick-notes]     any button starts Record notes (screens/quicknotes.js); ='<case>' pre-picks that case.
     Q.go('#case-wei')      navigate.          Q.refresh()   re-render current screen, keeps scroll, no entrance motion.
     Q.state()              'normal'|'empty'|'error'|'loading'  (demo toolbar). Render the matching state.
     Q.edition()            'web'|'desktop'.   Q.theme(t?) get/set 'light'|'dark'|'system'.
     Q.openSheet(ref)       PDF page viewer for a table cell. ref = 'wei/v1/harbour/b20' (case/version/insurer/row).
                            Low-confidence or missing cells get Confirm / Fix number / Type the number. Resolving calls Q.refresh().
     Q.sheet({title, body, foot, onClose})   generic right-hand sheet.   Q.closeSheet()
     Q.dialog({title, body, actions:[{label, value, kind:'primary'|'secondary'|'danger'}], safe:value}) -> Promise(value|null)
                            Focus starts on the safe action. Esc / backdrop = null.
     Q.toast(msg)           confirmation only, 4 s. Never for errors.
     Q.recording.start({callAudio}) / pause() / resume() / stop()   pinned recording bar on every screen.
     Q.toCheck(caseKey, ver) -> array of refs still yellow.
     Q.money(n) 'S$72,760'   Q.esc(s)   Q.icon(name, cls)   Q.on(evt, fn) / Q.emit(evt, data)
   MARKUP SHORTCUTS (no mount needed): data-go="#hash" navigates, data-sheet="ref" opens the PDF sheet,
     data-toast="text" shows a toast, data-menu on a button toggles its parent .menu.
*/
(function(){
  'use strict';
  var Q = window.Q = {};
  Q.data = window.QDATA;
  var screens = {}, current = null, listeners = {};
  var qs = new URLSearchParams(location.search);

  /* ---------- shared case state (one store, all screens) ---------- */
  var SAVED = ['cases','writeup','mas','meetings','transcripts','adviser'], VER = 5; // bump VER when the data shape changes
  try{
    if(qs.has('reset')) sessionStorage.removeItem('q-data');
    var saved = JSON.parse(sessionStorage.getItem('q-data') || 'null');
    if(saved && saved.v===VER) SAVED.forEach(function(k){ if(saved[k]) Q.data[k] = saved[k]; });
  }catch(e){}
  Q.save = function(){ try{ var o = { v:VER }; SAVED.forEach(function(k){ o[k] = Q.data[k]; }); sessionStorage.setItem('q-data', JSON.stringify(o)); }catch(e){} };
  Q.resetData = function(){ try{ sessionStorage.removeItem('q-data'); }catch(e){} location.reload(); };

  /* ---------- small utils ---------- */
  Q.esc = function(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); };
  Q.money = function(n){ return n==null ? '' : 'S$' + Number(n).toLocaleString('en-SG'); };
  Q.on = function(e,fn){ (listeners[e]=listeners[e]||[]).push(fn); };
  Q.emit = function(e,d){ (listeners[e]||[]).forEach(function(fn){ fn(d); }); };
  function store(k,v){ try{ if(v===undefined) return localStorage.getItem(k); if(v===null) localStorage.removeItem(k); else localStorage.setItem(k,v); }catch(e){ return null; } }

  /* The client's main worry, only once the rep kept it (UPDATE-2 2b: never shown as fact until kept). */
  Q.worry = function(c){ var w = c && c.worry; return w && w.kept && w.text ? w.text : ''; };

  /* One short next step per case, derived from the shared data. Today, Cases and Case all read this. */
  Q.status = function(k){
    var D = Q.data, c = D.cases[k], n;
    function s(why, btn, go, needs){ return { why:why, btn:btn, go:go, needs:!!needs }; }
    if(c.result==='won') return s('Policy with '+(c.chose||'the chosen insurer'), 'Open', '#case-'+k);
    if(c.result==='lost') return s(c.reason||'Lost', 'Open', '#case-'+k);
    switch(c.now){
      case 0: return s('Add plans', 'Add plans', '#new-case-'+k);
      case 1: n = Q.toCheck(k).length;
        return n ? s(n+' number'+(n>1?'s':'')+' to check', 'Check', '#case-'+k, true) : s('Ready to share', 'Share', '#share-'+k, true);
      case 2:
        if(c.quiet) return s('Quiet · '+(c.nudgesSent||c.nudgeNo||2)+' nudges sent, reminders stopped', 'Open', '#case-'+k);
        if(c.nudged) return s('Nudge sent · next reminder '+c.nudged.next, 'Log reply', '#nudge-'+k+'-reply');
        if(c.snoozedTo) return s('Snoozed until '+c.snoozedTo, 'Open', '#nudge-'+k);
        if((c.quietDays||0) >= D.adviser.waitDays) return s('No reply for '+c.quietDays+' days', 'Nudge', '#nudge-'+k, true);
        return s('Shared · reminder '+D.share.remindOn, 'Open', '#case-'+k);
      case 3: return s('Replied · note the plan '+c.first+' chose', 'Open', '#case-'+k, true);
      case 4: return c.shareSent ? s('Revised plan shared · reminder '+D.share.remindOn, 'Log reply', '#nudge-'+k+'-reply')
                                 : s('Revised plan ready to share', 'Share v2', '#share-'+k, true);
      case 5: n = Q.writeupProgress(k);
        return n.done<n.total ? s('Write-up · '+n.done+' of '+n.total+' parts done', 'Continue', '#writeup-'+k, true) : s('Write-up ready to copy', 'Copy', '#writeup-'+k, true);
      case 6: n = Q.masProgress(k); n = n.total - n.done;
        return n ? s('Firm review · '+n+' check'+(n>1?'s':'')+' left', 'Open', '#mas-'+k, true) : s('Firm review done · mark won when the policy starts', 'Open', '#case-'+k);
    }
    return s('Open case', 'Open', '#case-'+k);
  };
  /* Write-up progress: required parts (plus conditional parts that apply) ticked. Optional parts never count. */
  Q.wuCounts = function(p){ return p.need==='req' || (p.need==='cond' && p.on); };
  Q.writeupProgress = function(k){
    var W = Q.data.writeup; if(W.c!==k) return { done:0, total:3 };
    var req = W.parts.filter(Q.wuCounts);
    return { done:req.filter(function(p){ return p.ticked; }).length, total:req.length };
  };
  /* Firm review progress (FAA-N16 safeguards). A call-back not needed because a supervisor was there throughout counts as done. */
  Q.masDone = function(x){ return x.done || (x.id==='call' && x.sup); };
  Q.masProgress = function(k){
    var M = Q.data.mas; if(M.c!==k) return { done:5, total:5 };
    return { done:M.checklist.filter(Q.masDone).length, total:M.checklist.length };
  };
  /* All meetings and quick notes for a case, oldest first. Each: {m, upcoming}. */
  Q.caseMeetings = function(k){
    var M = Q.data.meetings, out = [];
    M.past.forEach(function(m){ if(m.c===k) out.push({ m:m, upcoming:false }); });
    M.upcoming.forEach(function(m){ if(m.c===k && !m.internal) out.push({ m:m, upcoming:true }); });
    return out.sort(function(a,b){ return (a.m.at||'') < (b.m.at||'') ? -1 : 1; });
  };
  Q.meetingById = function(id){
    var M = Q.data.meetings, u = M.upcoming.filter(function(m){ return m.id===id; })[0];
    if(u) return { m:u, past:false };
    var p = M.past.filter(function(m){ return m.id===id; })[0];
    return p ? { m:p, past:true } : null;
  };
  /* Cases that need the adviser, most urgent first. */
  Q.needs = function(){
    var rank = ['priya','alvin','wei','marcus','siti'], D = Q.data;
    return D.caseOrder.filter(function(k){ return Q.status(k).needs; })
      .sort(function(a,b){ var x = rank.indexOf(a), y = rank.indexOf(b); return (x<0?99:x) - (y<0?99:y); });
  };

  var ICONS = {
    today:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    meetings:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',
    cases:'<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
    prefs:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    plus:'<path d="M12 5v14M5 12h14"/>', back:'<path d="M15 18l-6-6 6-6"/>', next:'<path d="M9 18l6-6-6-6"/>',
    close:'<path d="M18 6L6 18M6 6l12 12"/>', check:'<path d="M20 6L9 17l-5-5"/>', more:'<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
    mic:'<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0M12 17v5"/>', file:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>',
    info:'<circle cx="12" cy="12" r="9"/><path d="M12 16v-4M12 8h.01"/>', alert:'<path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
    search:'<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>', device:'<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>',
    arrow:'<path d="M5 12h14M13 6l6 6-6 6"/>', share:'<path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7M16 6l-4-4-4 4M12 2v13"/>',
    video:'<rect x="2" y="6" width="14" height="12" rx="2"/><path d="M22 8l-6 4 6 4z"/>', bell:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0"/>'
  };
  Q.icon = function(n,cls){ return '<svg class="i '+(cls||'')+'" viewBox="0 0 24 24" aria-hidden="true">'+(ICONS[n]||'')+'</svg>'; };

  /* ---------- screen inventory (ux-spec §6) for the demo jump menu ---------- */
  Q.inventory = [
    ['S01','Sign in','signin'], ['S02','Create account','signup'],
    ['S03a','Onboarding: how it works','welcome-1'], ['S03b','Onboarding: client channel','welcome-2'], ['S03c','Onboarding: reminders','welcome-3'],
    ['S03d','Onboarding: calendar','welcome-4'], ['S03e','Onboarding: follow-up wait','welcome-5'],
    ['S04','Today','today'], ['S05','Meetings','meetings'],
    ['S06','Meeting: Wei Tan, today','meeting-wei-today'], ['S06','Meeting: Daniel Lee, done','meeting-daniel-past'],
    ['S07','New case','new-case'],
    ['S08','Privacy gate: comparison','gate-wei'], ['S08','Privacy gate: write-up','gate-siti'], ['S08','Privacy gate: nudge','gate-priya'], ['S08','Privacy gate: MAS suggestions','gate-marcus'],
    ['S09','Edit what is sent','gate-edit-wei'], ['S10','Processing','processing-wei'],
    ['S11','Case: Wei Tan (compared)','case-wei'], ['S11','Case: Daniel Lee (met)','case-daniel'], ['S11','Case: Priya Krishnan (shared)','case-priya'], ['S11','Case: Alvin Lim (revised)','case-alvin'],
    ['S11','Case: Siti Nur (write-up)','case-siti'], ['S11','Case: Marcus Raj (firm review)','case-marcus'], ['S11','Case: Kevin Ong (won)','case-kevin'], ['S11','Case: Jasmine Ong (lost)','case-jasmine'],
    ['S12','PDF side sheet','source-wei'], ['S13','Share','share-alvin'], ['S13','Share: blocked (Wei, 2 to check)','share-wei'], ['S14','Write-up','writeup-siti'], ['S15','MAS checks','mas-marcus'],
    ['S16','Follow-up nudge','nudge-priya'], ['S16t','Telegram reminder','telegram'], ['S17','What left your device','sent-wei'],
    ['S18','Cases','cases'], ['S19','Settings','prefs'], ['S20','Morning digest','digest'], ['', 'Component gallery','gallery']
  ];
  var NAV_OF = { today:'today', meetings:'meetings', meeting:'meetings', cases:'cases', prefs:'prefs', digest:'today', telegram:'today' };

  /* ---------- registry and router ---------- */
  Q.screen = function(id, def){ def.id = id; screens[id] = def; if(booted) { buildJump(); if(Q.route().id===id) render(true); } };
  Q.route = function(){
    var h = decodeURIComponent(location.hash.replace(/^#\/?/,'')) || 'today';
    if(screens[h]) return { id:h, arg:'', hash:h };
    var best = null;
    Object.keys(screens).forEach(function(id){ if(h.indexOf(id+'-')===0 && (!best || id.length>best.length)) best=id; });
    if(best) return { id:best, arg:h.slice(best.length+1), hash:h };
    return { id:null, arg:'', hash:h };
  };
  Q.go = function(h){ if(location.hash===h) render(true); else location.hash = h; };
  Q.refresh = function(){ render(false); };

  function params(r){ return { id:r.id, arg:r.arg, parts:r.arg?r.arg.split('-'):[], state:Q.state(), edition:Q.edition() }; }

  function render(enter){
    var r = Q.route(), el = document.getElementById('screen'), def = screens[r.id];
    var y = window.scrollY, same = current && current.hash===r.hash;
    if(!def){
      var inv = Q.inventory.filter(function(i){ return i[2]===r.hash; })[0];
      def = { id:'todo', rail:true, title:'Coming soon', render:function(){ return '<div class="page"><div class="todo">'+
        '<span class="chip chip-outline">'+Q.esc(inv?inv[0]:'404')+'</span><h1 class="h2">'+Q.esc(inv?inv[1]:'Page not found')+'</h1>'+
        '<p class="muted">'+(inv?'This screen is being built.':'There is no screen at #'+Q.esc(r.hash)+'.')+'</p>'+
        '<a class="btn btn-secondary" href="#today">Back to Today</a></div></div>'; } };
    }
    var p = params(r);
    document.body.classList.toggle('focus', def.rail===false);
    el.classList.remove('enter');
    try{ el.innerHTML = def.render(p); }
    catch(err){ el.innerHTML = '<div class="page"><div class="banner banner-error">'+Q.icon('alert')+'<p>This screen failed to render: '+Q.esc(err.message)+'</p></div></div>'; console.error(err); }
    // Demo state chips never sit on the screen: they move into the Demo panel ("States for this screen").
    var ds = document.getElementById('demo-screen');
    if(ds){ ds.innerHTML = ''; el.querySelectorAll('nav.switcher').forEach(function(n){ n.classList.remove('rise'); ds.appendChild(n); }); ds.hidden = !ds.children.length; }
    if(enter && !same){ void el.offsetWidth; el.classList.add('enter'); setTimeout(function(){ el.classList.remove('enter'); }, 1800); }
    if(def.mount) try{ def.mount(el, p); }catch(err){ console.error(err); }
    var t = typeof def.title==='function' ? def.title(p) : def.title;
    document.title = (t ? t+' · ' : '') + 'Quotient';
    var nav = ('nav' in def) ? def.nav : (NAV_OF[def.id] || (def.id==='todo'?'':'cases'));
    document.querySelectorAll('[data-nav]').forEach(function(a){ if(a.dataset.nav===nav) a.setAttribute('aria-current','page'); else a.removeAttribute('aria-current'); });
    var jump = document.getElementById('demo-jump'); if(jump) jump.value = r.hash;
    document.querySelectorAll('.nav .count').forEach(function(n){ n.textContent = Q.state()==='empty' ? 0 : Q.data.caseOrder.length; });
    if(enter && !same) window.scrollTo(0,0); else window.scrollTo(0,y);
    current = r;
    Q.save();
    Q.emit('render', p);
  }

  /* ---------- theme, edition, states ---------- */
  Q.theme = function(t){
    if(t===undefined) return store('q-theme') || 'system';
    store('q-theme', t==='system'?null:t);
    if(t==='system') document.documentElement.removeAttribute('data-theme'); else document.documentElement.setAttribute('data-theme', t);
    syncDemo(); if(booted) Q.refresh();
  };
  Q.edition = function(v){
    if(v===undefined) return store('q-edition') || 'web';
    store('q-edition', v); paintUser(); syncDemo(); Q.refresh();
  };
  Q.state = function(v){
    if(v===undefined) return store('q-state') || 'normal';
    store('q-state', v==='normal'?null:v); syncDemo(); Q.refresh();
  };
  function paintUser(){
    var a = Q.data.adviser, ed = Q.edition()==='desktop'?'Desktop':'Web';
    document.querySelectorAll('[data-user]').forEach(function(u){ u.innerHTML = '<span class="avatar">'+a.initials+'</span><span><b>'+Q.esc(a.name)+'</b><small>'+a.initials+' · '+ed+'</small></span>'; });
  }

  /* ---------- cells and the PDF sheet ---------- */
  function cellAt(ref){
    var s = ref.split('/'), c = Q.data.cases[s[0]], t = c && c.tables[s[1]], cell = t && t.cells[s[2]] && t.cells[s[2]][s[3]];
    var row = Q.data.rows.filter(function(r){ return r.key===s[3]; })[0];
    return cell ? { ref:ref, caseKey:s[0], c:c, ver:s[1], table:t, ins:s[2], insurer:Q.data.insurers[s[2]], rowKey:s[3], row:row, cell:cell } : null;
  }
  Q.cell = cellAt;
  Q.toCheck = function(ck, ver){
    var c = Q.data.cases[ck], out = [];
    Object.keys(c.tables).forEach(function(v){ if(ver && v!==ver) return; var t=c.tables[v];
      Q.data.rows.forEach(function(r){ t.plans.forEach(function(ins){ var x=t.cells[ins][r.key]; if(x && x.flag) out.push(ck+'/'+v+'/'+ins+'/'+r.key); }); }); });
    return out;
  };
  function rowLabel(row){ var g = Q.data.groups[row.grp]; return row.grp==='summary' ? row.label : g.label+' · '+row.label.toLowerCase(); }
  Q.rowLabel = rowLabel;

  function pdfPage(x){
    var plan = x.table.cells[x.ins], ins = x.insurer, prem = plan.premium.v, term = parseInt(plan.term.v,10)||20, body;
    if(x.row.grp==='summary'){
      body = '<h4>Plan summary</h4><table><tbody>'+['premium','term','sa','riders'].map(function(k){
        var r = Q.data.rows.filter(function(z){return z.key===k;})[0], v = plan[k].v, hl = k===x.rowKey;
        return '<tr'+(hl?' class="hl"':'')+'><td>'+r.label+'</td><td'+(hl?' class="target"':'')+'>'+(r.kind==='money'?Q.money(v):Q.esc(v))+'</td></tr>'; }).join('')+'</tbody></table>';
    } else {
      var cols = { guaranteed:'g', i300:'a', i425:'b' }, want = cols[x.row.grp];
      body = '<h4>Benefit illustration</h4><table><thead><tr><th>End of</th><th>Premiums paid</th><th>Guaranteed</th><th>Total at 3.00%</th><th>Total at 4.25%</th></tr></thead><tbody>'+
        [['10','Year 10',10],['20','Year 20',Math.min(20,term)],['65','Age 65',term]].map(function(y){
          var hl = y[0]===x.row.yr;
          return '<tr'+(hl?' class="hl"':'')+'><td>'+y[1]+'</td><td>'+Q.money(prem*y[2])+'</td>'+['g','a','b'].map(function(k){
            var c = plan[k+y[0]], tgt = hl && k===want;
            var txt = c.flag==='missing' || c.v==null ? '<span class="gone">not shown</span>' : Q.money(c.v);
            return '<td'+(tgt?' class="target"':'')+'>'+txt+'</td>'; }).join('')+'</tr>'; }).join('')+
        '</tbody></table><p class="pm" style="margin-top:8px">Illustrated values at 3.00% and 4.25% are not guaranteed.</p>';
    }
    return '<div class="pdf" role="img" aria-label="'+Q.esc(ins.name)+' PDF, page '+x.cell.p+'"><div class="pdf-top"><b>'+Q.esc(ins.name)+'</b><span>Policy illustration</span></div>'+
      '<p class="pm">Whole life participating · Life assured: '+Q.esc(x.c.name)+', age '+x.c.age+'</p>'+body+
      '<div class="pdf-foot"><span>'+Q.esc(ins.file)+'</span><span>Page '+x.cell.p+' of '+ins.pages+'</span></div></div>';
  }

  Q.openSheet = function(ref, opts){
    var x = cellAt(ref); if(!x) return;
    var queue = Q.toCheck(x.caseKey, x.ver), qi = queue.indexOf(ref), flag = x.cell.flag, mode = (opts&&opts.mode)||'';
    var val = x.row.kind==='money' ? Q.money(x.cell.v) : x.cell.v;
    var read = '<div class="readout"><span class="small muted">'+Q.esc(rowLabel(x.row))+'</span>'+
      '<span class="v">'+(flag==='missing'?'Not found':Q.esc(val))+'</span><span class="small muted">'+Q.esc(x.insurer.name)+' · page '+x.cell.p+'</span></div>';
    var ask = '', foot = '<button class="btn btn-secondary" data-close>Close</button>';
    if(flag==='check'){
      ask = mode==='fix'
        ? '<div class="field"><label class="label" for="fixv">Correct number</label><input class="input num" id="fixv" inputmode="numeric" value="'+x.cell.v+'"></div>'
        : '<p class="h3">Is this number right?</p><p class="small muted">We read it with low confidence. Compare it with the highlighted line.</p>';
      foot = mode==='fix' ? '<button class="btn btn-primary" data-act="save">Save</button><button class="btn btn-ghost" data-act="cancelfix">Cancel</button>'
                          : '<button class="btn btn-primary" data-act="confirm">Confirm</button><button class="btn btn-secondary" data-act="fix">Fix number</button>';
    } else if(flag==='missing'){
      ask = mode==='fix'
        ? '<div class="field"><label class="label" for="fixv">Number from the PDF</label><input class="input num" id="fixv" inputmode="numeric" placeholder="e.g. 158400"></div>'
        : '<p class="h3">We couldn\'t find this on the PDF.</p><p class="small muted">Type it if you can see it, or mark it as not shown.</p>';
      foot = mode==='fix' ? '<button class="btn btn-primary" data-act="save">Save</button><button class="btn btn-ghost" data-act="cancelfix">Cancel</button>'
                          : '<button class="btn btn-primary" data-act="fix">Type the number</button><button class="btn btn-secondary" data-act="na">Not shown in this PDF</button>';
    } else if(x.cell.by){ ask = '<p class="small" style="color:var(--ok)">'+Q.icon('check','i-sm')+' '+(x.cell.by==='na'?'Marked as not shown in this PDF.':'Checked by you.')+'</p>'; }
    var nav = (flag && queue.length) ? '<span class="small muted num" style="margin-left:auto">'+(qi+1)+' of '+queue.length+' to check</span>'+
      '<button class="icon-btn" data-act="prev" aria-label="Previous number to check"'+(qi<=0?' disabled':'')+'>'+Q.icon('back')+'</button>'+
      '<button class="icon-btn" data-act="nextc" aria-label="Next number to check"'+(qi>=queue.length-1?' disabled':'')+'>'+Q.icon('next')+'</button>' : '';
    Q.sheet({ title: x.insurer.name+' · page '+x.cell.p+' of '+x.insurer.pages, ref:ref,
      body: pdfPage(x) + read + ask, foot: foot + nav,
      mount: function(sh){
        // Phone: lay the page out at 440px and zoom it down to the sheet width, so no column is cut off (pinch to zoom in).
        // shortcut: fitted once on open, not on rotate; reopen the sheet after rotating.
        var pdf = sh.querySelector('.sheet-body .pdf');
        if(pdf){ var bd = pdf.parentNode, cs = getComputedStyle(bd), w = bd.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
          if(w < 440){ pdf.style.width = '440px'; pdf.style.zoom = w/440; } }
        var inp = sh.querySelector('#fixv'); if(inp){ inp.focus(); inp.select && inp.select(); inp.addEventListener('keydown',function(e){ if(e.key==='Enter') act('save'); }); }
        sh.querySelector('.sheet-foot').addEventListener('click', function(e){ var b=e.target.closest('[data-act]'); if(b) act(b.dataset.act); });
      } });
    function resolve(by){
      x.cell.flag = null; x.cell.by = by; Q.refresh(); Q.emit('cell', x);
      var left = Q.toCheck(x.caseKey, x.ver);
      if(left.length) Q.openSheet(left[0]);
      else { Q.closeSheet(); Q.toast('All numbers checked'); }
    }
    function act(a){
      if(a==='confirm') resolve('you');
      else if(a==='na'){ x.cell.v = null; resolve('na'); }
      else if(a==='fix') Q.openSheet(ref,{mode:'fix'});
      else if(a==='cancelfix') Q.openSheet(ref);
      else if(a==='save'){ var inp=document.getElementById('fixv'), n=parseInt(String(inp.value).replace(/[^0-9]/g,''),10);
        if(!n){ inp.setAttribute('aria-invalid','true'); return; } x.cell.v = n; resolve('you'); }
      else if(a==='prev') Q.openSheet(queue[qi-1]);
      else if(a==='nextc') Q.openSheet(queue[qi+1]);
    }
  };

  /* ---------- generic sheet ---------- */
  var sheetEl, scrimEl, sheetOpener, sheetRef, sheetClose;
  Q.sheet = function(o){
    var reuse = !!sheetEl; // closeSheet nulls it, so a sheet still opening (class not yet added) is reused, not doubled
    if(!reuse){
      sheetOpener = document.activeElement;
      scrimEl = document.createElement('div'); scrimEl.className = 'scrim'; scrimEl.addEventListener('click', Q.closeSheet);
      sheetEl = document.createElement('aside'); sheetEl.className = 'sheet'; sheetEl.setAttribute('role','dialog'); sheetEl.setAttribute('aria-modal','true');
      document.body.append(scrimEl, sheetEl);
    }
    sheetRef = o.ref || null; sheetClose = o.onClose || null;
    sheetEl.setAttribute('aria-label', o.title);
    sheetEl.innerHTML = '<div class="sheet-head"><h2>'+Q.esc(o.title)+'</h2><button class="icon-btn" data-close aria-label="Close">'+Q.icon('close')+'</button></div>'+
      '<div class="sheet-body">'+o.body+'</div>'+(o.foot?'<div class="sheet-foot">'+o.foot+'</div>':'');
    sheetEl.querySelectorAll('[data-close]').forEach(function(b){ b.addEventListener('click', Q.closeSheet); });
    if(!reuse){ var s0 = sheetEl, c0 = scrimEl; requestAnimationFrame(function(){ if(sheetEl===s0){ c0.classList.add('open'); s0.classList.add('open'); } }); }
    if(o.mount) o.mount(sheetEl);
    if(!sheetEl.contains(document.activeElement)) (sheetEl.querySelector('.sheet-foot .btn') || sheetEl.querySelector('[data-close]')).focus({preventScroll:true});
  };
  Q.closeSheet = function(){
    if(!sheetEl) return;
    var s = sheetEl, sc = scrimEl, ref = sheetRef; sheetEl = scrimEl = null;
    s.classList.remove('open'); sc.classList.remove('open');
    setTimeout(function(){ s.remove(); sc.remove(); }, 340);
    var back = (ref && document.querySelector('[data-sheet="'+ref+'"]')) || (document.contains(sheetOpener) ? sheetOpener : null);
    if(back) back.focus({preventScroll:true});
    if(sheetClose) sheetClose();
  };

  /* ---------- dialog ---------- */
  Q.dialog = function(o){
    return new Promise(function(done){
      var opener = document.activeElement, w = document.createElement('div');
      w.className = 'dialog-wrap';
      w.innerHTML = '<div class="dialog" role="dialog" aria-modal="true" aria-labelledby="dlg-t"><h2 id="dlg-t">'+Q.esc(o.title)+'</h2>'+
        (o.body?'<div>'+o.body+'</div>':'')+'<div class="acts">'+(o.actions||[]).map(function(a,i){
          return '<button class="btn btn-'+(a.kind||'secondary')+'" data-i="'+i+'">'+Q.esc(a.label)+'</button>'; }).join('')+'</div></div>';
      document.body.appendChild(w);
      requestAnimationFrame(function(){ w.classList.add('open'); });
      function close(v){ document.removeEventListener('keydown', key, true); w.classList.remove('open'); setTimeout(function(){ w.remove(); }, 220); if(opener && document.contains(opener)) opener.focus(); done(v); }
      function key(e){ if(e.key==='Escape'){ e.stopPropagation(); close(null); }
        if(e.key==='Tab'){ var f=w.querySelectorAll('button,input,select,textarea'), a=f[0], z=f[f.length-1];
          if(e.shiftKey && document.activeElement===a){ e.preventDefault(); z.focus(); } else if(!e.shiftKey && document.activeElement===z){ e.preventDefault(); a.focus(); } } }
      document.addEventListener('keydown', key, true);
      w.addEventListener('click', function(e){ if(e.target===w) return close(null); var b=e.target.closest('[data-i]'); if(b) close(o.actions[+b.dataset.i].value); });
      var safe = (o.actions||[]).map(function(a){return a.value;}).indexOf(o.safe);
      (w.querySelector('[data-i="'+(safe<0?0:safe)+'"]') || w.querySelector('button')).focus();
      if(o.mount) o.mount(w, close);
    });
  };

  /* ---------- toast ---------- */
  Q.toast = function(msg){
    var host = document.getElementById('toasts'), t = document.createElement('div');
    t.className = 'toast'; t.innerHTML = Q.icon('check','i-sm')+'<span>'+Q.esc(msg)+'</span>';
    host.appendChild(t); setTimeout(function(){ t.remove(); }, 4000);
  };

  /* ---------- recording bar ---------- */
  var rec = null;
  Q.recording = {
    get: function(){ return rec; },
    start: function(o){ rec = { call: !!(o&&o.callAudio) && Q.edition()==='desktop', secs:0, paused:false }; rec.timer = setInterval(function(){ if(!rec.paused){ rec.secs++; paintRec(); } }, 1000); paintRec(); },
    pause: function(){ if(rec){ rec.paused = true; paintRec(); } },
    resume: function(){ if(rec){ rec.paused = false; paintRec(); } },
    stop: function(){ if(rec){ clearInterval(rec.timer); rec = null; paintRec(); Q.emit('recording-stopped'); } }
  };
  function paintRec(){
    var bar = document.getElementById('recbar'); if(!bar) return;
    if(!rec){ bar.hidden = true; bar.innerHTML = ''; return; }
    var t = String(Math.floor(rec.secs/60)).padStart(2,'0')+':'+String(rec.secs%60).padStart(2,'0');
    var msg = rec.paused ? 'Paused' : rec.call ? 'Recording your microphone + call audio' : 'Recording your microphone only · call audio is not recorded';
    bar.hidden = false; bar.className = 'recbar'+(rec.paused?' paused':'');
    bar.innerHTML = '<span class="live" aria-hidden="true"></span><span class="level" aria-hidden="true"><i></i><i></i><i></i><i></i></span><span role="status">'+msg+'</span>'+
      '<span class="t">'+t+'</span><button class="btn btn-secondary" data-rec="'+(rec.paused?'resume':'pause')+'">'+(rec.paused?'Resume':'Pause')+'</button><button class="btn btn-primary" data-rec="stop">Stop</button>';
  }

  /* ---------- demo toolbar ---------- */
  function buildJump(){
    var s = document.getElementById('demo-jump'); if(!s) return;
    s.innerHTML = Q.inventory.map(function(i){ var built = Q.routeFor(i[2]);
      return '<option value="'+i[2]+'">'+(i[0]?i[0]+'  ':'')+Q.esc(i[1])+(built?'':' (soon)')+'</option>'; }).join('');
    s.value = Q.route().hash;
  }
  Q.routeFor = function(h){ return Object.keys(screens).some(function(id){ return h===id || h.indexOf(id+'-')===0; }); };
  function syncDemo(){
    var d = document.getElementById('demo'); if(!d) return;
    [['theme',Q.theme()],['edition',Q.edition()],['state',Q.state()]].forEach(function(p){
      d.querySelectorAll('[data-'+p[0]+']').forEach(function(b){ b.setAttribute('aria-pressed', String(b.getAttribute('data-'+p[0])===p[1])); }); });
  }

  /* ---------- Preview as Phone (prototype only, wide screens). The same app in an iframe with ?frame=phone, which never nests. ---------- */
  var framed = qs.get('frame')==='phone', ppEl = null;
  if(framed) document.documentElement.classList.add('in-phone-frame');
  function ss(k,v){ try{ if(v===undefined) return sessionStorage.getItem(k); if(v===null) sessionStorage.removeItem(k); else sessionStorage.setItem(k,v); }catch(e){ return null; } }
  if(qs.get('preview')==='phone' && !framed) ss('q-phone','1');
  var SYS = '<svg viewBox="0 0 18 12" aria-hidden="true"><rect x="0" y="8" width="3" height="4" rx="1"/><rect x="5" y="5.5" width="3" height="6.5" rx="1"/><rect x="10" y="3" width="3" height="9" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1"/></svg>'+
    '<svg viewBox="0 0 16 12" aria-hidden="true"><path d="M8 2.6c2.3 0 4.4.9 6 2.4l1.3-1.4A10.6 10.6 0 0 0 8 .7 10.6 10.6 0 0 0 .7 3.6L2 5c1.6-1.5 3.7-2.4 6-2.4zm0 3.8c1.3 0 2.5.5 3.4 1.3l1.3-1.4A6.8 6.8 0 0 0 8 4.5c-1.8 0-3.5.7-4.7 1.8l1.3 1.4C5.5 6.9 6.7 6.4 8 6.4zm0 3.8L10.2 8a3.2 3.2 0 0 0-4.4 0z"/></svg>'+
    '<svg viewBox="0 0 27 12" aria-hidden="true"><rect x=".5" y=".5" width="22" height="11" rx="3.5" fill="none" stroke="currentColor" opacity=".4"/><rect x="2" y="2" width="19" height="8" rx="2"/><path d="M24.5 4v4c.8-.3 1.3-1.1 1.3-2s-.5-1.7-1.3-2z" opacity=".5"/></svg>';
  function fitPhone(){ if(ppEl) ppEl.style.setProperty('--pp-scale', Math.min(1, (window.innerHeight - 96) / 868, (window.innerWidth - 32) / 414).toFixed(3)); }
  function openPhone(){
    if(ppEl || framed) return;
    ppEl = document.createElement('div'); ppEl.className = 'pp'; ppEl.setAttribute('role','dialog'); ppEl.setAttribute('aria-modal','true'); ppEl.setAttribute('aria-label','Phone preview');
    ppEl.innerHTML = '<div class="pp-bar"><span class="pp-cap">Prototype only<span class="dot-sep"></span>Phone preview<span class="dot-sep"></span><span class="num">390 × 844</span></span>'+
      '<button class="btn btn-secondary btn-sm" type="button" data-pp-close>'+Q.icon('close','i-sm')+'Close phone preview</button></div>'+
      '<div class="pp-stage"><div class="pp-device"><i class="pp-btn pp-b1"></i><i class="pp-btn pp-b2"></i><i class="pp-btn pp-b3"></i><i class="pp-btn pp-b4"></i>'+
      '<div class="pp-screen"><div class="pp-status"><span class="pp-time num">9:41</span><i class="pp-island"></i><span class="pp-sys">'+SYS+'</span></div>'+
      '<iframe title="Quotient on a phone" src="'+location.pathname+'?frame=phone'+location.hash+'"></iframe><i class="pp-home"></i></div></div></div>';
    document.body.appendChild(ppEl); document.body.classList.add('pp-on'); fitPhone();
    ppEl.querySelector('[data-pp-close]').focus({preventScroll:true});
  }
  /* Closing reloads on the frame's screen, so data the frame saved to sessionStorage shows here too. */
  function closePhone(){
    if(!ppEl) return;
    var h = location.hash; try{ h = ppEl.querySelector('iframe').contentWindow.location.hash || h; }catch(e){}
    history.replaceState(null, '', location.pathname + location.search.replace(/[?&]preview=phone/,'') + h); location.reload();
  }
  Q.phonePreview = function(on){
    if(on===undefined) return !framed && ss('q-phone')==='1';
    if(framed) return;
    ss('q-phone', on ? '1' : null);
    if(on) openPhone(); else closePhone();
  };
  window.addEventListener('resize', fitPhone);
  // Theme picked inside the phone frame: keep the device status bar in step.
  window.addEventListener('storage', function(e){ if(e.key==='q-theme'){ if(e.newValue) document.documentElement.setAttribute('data-theme', e.newValue); else document.documentElement.removeAttribute('data-theme'); } });

  /* ---------- global events ---------- */
  document.addEventListener('click', function(e){
    var t = e.target;
    var go = t.closest('[data-go]'); if(go){ e.preventDefault(); Q.go(go.dataset.go); return; }
    var sh = t.closest('[data-sheet]'); if(sh){ e.preventDefault(); Q.openSheet(sh.dataset.sheet); return; }
    var to = t.closest('[data-toast]'); if(to){ Q.toast(to.dataset.toast); }
    var r = t.closest('[data-rec]'); if(r){ Q.recording[r.dataset.rec](); return; }
    var m = t.closest('[data-menu]');
    document.querySelectorAll('.menu.open').forEach(function(x){ if(!m || x!==m.parentElement) { x.classList.remove('open'); var b=x.querySelector('[data-menu]'); if(b) b.setAttribute('aria-expanded','false'); } });
    if(m){ var open = m.parentElement.classList.toggle('open'); m.setAttribute('aria-expanded', String(open)); }
    var d = t.closest('#demo [data-theme],#demo [data-edition],#demo [data-state]');
    if(d){ if(d.dataset.theme) Q.theme(d.dataset.theme); if(d.dataset.edition) Q.edition(d.dataset.edition); if(d.dataset.state) Q.state(d.dataset.state); }
    if(t.closest('[data-reset]')){ Q.resetData(); return; }
    if(t.closest('[data-phone]')){ Q.phonePreview(true); return; }
    if(t.closest('[data-pp-close]')){ Q.phonePreview(false); return; }
    if(t.closest('.demo-toggle')){ var dm=document.getElementById('demo'); var o=dm.classList.toggle('open'); t.closest('.demo-toggle').setAttribute('aria-expanded', String(o)); }
  });
  document.addEventListener('keydown', function(e){
    if(e.key==='Escape' && ppEl){ Q.phonePreview(false); return; }
    if(e.key==='Escape'){ if(sheetEl) Q.closeSheet(); document.querySelectorAll('.menu.open,.demo.open').forEach(function(x){ x.classList.remove('open'); }); }
    var typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) || document.activeElement.isContentEditable;
    if(!typing && !e.metaKey && !e.ctrlKey && !e.altKey && (e.key==='n'||e.key==='N') && !document.body.classList.contains('focus') && !sheetEl) Q.go('#new-case');
  });
  window.addEventListener('hashchange', function(){ if(sheetEl) Q.closeSheet(); render(true); });

  /* ---------- boot ---------- */
  var booted = false;
  ['theme','edition','state'].forEach(function(k){ var v = qs.get(k); if(v) store('q-'+k, (v==='system'||v==='normal')?null:v); });
  var th = Q.theme(); if(th!=='system') document.documentElement.setAttribute('data-theme', th);
  document.addEventListener('DOMContentLoaded', function(){
    booted = true; paintUser(); buildJump(); syncDemo();
    // Phone tab bar (UPDATE-2 C): 4 tabs. Calendar = #meetings. Record notes lives on Today and in each case.
    var tb = document.querySelector('.tabbar');
    if(tb) tb.innerHTML = [['today','today','Today'],['cases','cases','Cases'],['meetings','meetings','Calendar'],['prefs','prefs','Settings']].map(function(t){
      return '<a href="#'+t[0]+'" data-nav="'+t[0]+'">'+Q.icon(t[1])+'<span>'+t[2]+'</span></a>'; }).join('');
    var j = document.getElementById('demo-jump'); if(j) j.addEventListener('change', function(){ Q.go('#'+j.value); });
    render(true);
    if(Q.phonePreview() && window.innerWidth > 760) openPhone();
  });
})();
