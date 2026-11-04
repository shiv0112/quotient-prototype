/* Demo only: a stand-in for WhatsApp, so the prototype never leaves the page.
   The real app opens Q.waLink(case, text): the client's chat with the message typed (or WhatsApp's own chat picker when
   no mobile is saved), and the adviser presses Send in WhatsApp. Here we show that step: phone = full-screen chat,
   web/desktop = a WhatsApp Desktop-style window. Pressing Send closes it and calls onSent().
   Q.waDemo({ c, text, file, pick, onSent })  file = PDF name to attach (share); pick = force the chat picker. */
(function(){
  'use strict';
  var D = Q.data, el = null, opener = null;
  var SEND = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 20.5 21 12 3 3.5l2.6 7L15 12l-9.4 1.5z"/></svg>';
  var BACK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  function ini(n){ return String(n).split(' ').map(function(w){ return w[0]; }).join('').slice(0,2).toUpperCase(); }
  function phone(){ return window.innerWidth < 480; }

  function close(){ if(!el) return; document.removeEventListener('keydown', esc); el.remove(); el = null; document.body.classList.remove('wa-on');
    if(opener && document.contains(opener)) opener.focus({preventScroll:true}); }
  function esc(e){ if(e.key==='Escape') close(); }

  function picker(){
    var keys = D.caseOrder.filter(function(k){ return !D.cases[k].result; });
    return '<div class="wa-pane"><header class="wa-head"><button class="wa-ib" data-wa-x aria-label="Back to Quotient">'+BACK+'</button><div><b>Send to…</b><small>WhatsApp asks who gets it</small></div></header>'+
      '<div class="wa-search">Search name or number</div><p class="wa-sec">Recent chats</p><ul class="wa-list">'+
      keys.map(function(k){ var x = D.cases[k]; return '<li><button data-wa-pick="'+k+'"><span class="wa-av">'+ini(x.name)+'</span><span><b>'+Q.esc(x.name)+'</b><small>'+Q.esc(x.mobile||'In your phone contacts')+'</small></span></button></li>'; }).join('')+
      '</ul></div>';
  }

  function chat(o){
    var c = o.c, file = o.file ? '<div class="wa-file"><span class="wa-pdf">PDF</span><span><b>'+Q.esc(o.file)+'</b><small>3 pages</small></span></div>' : '';
    var prev = c.shareSent || c.nudged || c.now>=2 ? '<div class="wa-msg me"><div class="wa-file in"><span class="wa-pdf">PDF</span><span><b>Plan comparison · '+Q.esc(c.name)+'.pdf</b><small>Sat 31 Oct</small></span></div><time>Sat 21:14 ✓✓</time></div>' : '';
    return '<div class="wa-pane"><header class="wa-head"><button class="wa-ib" data-wa-x aria-label="Back to Quotient">'+BACK+'</button><span class="wa-av">'+ini(c.name)+'</span>'+
        '<div><b>'+Q.esc(c.name)+'</b><small>'+Q.esc(c.mobile||'')+'</small></div></header>'+
      '<div class="wa-body" aria-live="polite">'+prev+'</div>'+
      '<div class="wa-compose">'+file+'<div class="wa-row"><textarea class="wa-input" rows="4" aria-label="Message">'+Q.esc(o.text||'')+'</textarea>'+
        '<button class="wa-send" data-wa-send aria-label="Send">'+SEND+'</button></div></div></div>';
  }

  function render(o, step){
    var desk = !phone(), body = step==='pick' ? picker() : chat(o);
    el.innerHTML = '<div class="wa-scrim" data-wa-x></div>'+
      '<div class="wa-win'+(desk?' desk':'')+'" role="dialog" aria-modal="true" aria-label="WhatsApp (demo)">'+
      (desk ? '<div class="wa-title"><span class="wa-dots" aria-hidden="true"><i></i><i></i><i></i></span><span>WhatsApp</span></div>' : '')+
      '<p class="wa-demo">Demo · the real app opens WhatsApp '+(step==='pick' ? 'and asks for the chat' : 'in '+Q.esc(o.c.first)+'\'s chat')+'. You press Send there.</p>'+body+'</div>';
    var f = el.querySelector(step==='pick' ? '[data-wa-pick]' : '[data-wa-send]'); if(f) f.focus({preventScroll:true});
  }

  Q.waDemo = function(o){
    if(el) close();
    opener = document.activeElement;
    el = document.createElement('div'); el.className = 'wa-wrap'; document.body.appendChild(el); document.body.classList.add('wa-on');
    var step = (o.pick || !Q.waDigits(o.c.mobile)) ? 'pick' : 'chat';
    render(o, step);
    document.addEventListener('keydown', esc);
    el.addEventListener('click', function(e){
      if(e.target.closest('[data-wa-x]')){ close(); return; }
      var p = e.target.closest('[data-wa-pick]');
      if(p){ o = Object.assign({}, o, { c: D.cases[p.dataset.waPick] }); render(o, 'chat'); return; }
      if(e.target.closest('[data-wa-send]')){
        var t = el.querySelector('.wa-input'), b = el.querySelector('.wa-body'), comp = el.querySelector('.wa-compose');
        b.insertAdjacentHTML('beforeend', (o.file ? '<div class="wa-msg me"><div class="wa-file in"><span class="wa-pdf">PDF</span><span><b>'+Q.esc(o.file)+'</b><small>3 pages</small></span></div></div>' : '')+
          '<div class="wa-msg me"><p>'+Q.esc(t.value).replace(/\n/g,'<br>')+'</p><time>now ✓</time></div>');
        comp.hidden = true; b.scrollTop = b.scrollHeight;
        setTimeout(function(){ close(); if(o.onSent) o.onSent(); }, 900);
      }
    });
  };
})();
