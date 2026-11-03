/* S01 Sign in (#signin) and S02 Create account (#signup). Builder A.
   States via ?state= : signin  loading | error | cancelled | offline | oauth
                        signup  loading | inuse | weak | oauth
   Full-bleed focus layout: brand panel (wordmark, promise, gate specimen, tile motif) + form column. */
(function(){
  'use strict';
  var D = Q.data, A = QD.a, ad = D.adviser;
  var mode = null, provider = 'Google', timer = null, focusId = null, errs = {};
  var v = { email:ad.email, pw:'kallang-2026', name:'', semail:'', spw:'', firm:'' };
  var last = null;
  function later(fn, ms){ var h = Q.route().hash; return setTimeout(function(){ if(Q.route().hash===h) fn(); }, ms); }
  // core renders before our own hashchange listener would run, so reset per-screen state when the route changes
  function fresh(){ var h = Q.route().hash; if(h!==last){ last = h; mode = null; errs = {}; clearTimeout(timer); } }


  function brand(){
    return '<aside class="au-brand" aria-label="About Quotient">'+
      '<span class="wordmark">Quotient</span>'+
      '<div class="au-pitch rise">'+
        '<h2>Client files, made on your device. <em>Nothing leaves without you seeing it.</em></h2>'+
        '<dl class="au-spec" aria-label="Example of what the AI sees">'+
          '<div><dt>Your notes</dt><dd>Wei Tan, born 14 Mar 1991, works at Straits Freight. Children Jia Hui and Jia Le.</dd></div>'+
          '<div><dt>What the AI sees</dt><dd><span class="ph">[CLIENT]</span>, age 35, works at <span class="ph">[EMPLOYER]</span>. Children <span class="ph">[CHILD 1]</span> and <span class="ph">[CHILD 2]</span>.</dd></div>'+
        '</dl>'+
        '<ul class="au-facts">'+
          '<li>'+Q.icon('check','i-sm')+'Every number links to its PDF page</li>'+
          '<li>'+Q.icon('check','i-sm')+'MAS Selected Client checks run on this device</li>'+
          '<li>'+Q.icon('check','i-sm')+'Web app, or desktop app for Mac and Windows</li>'+
        '</ul>'+
      '</div></aside>';
  }
  function shell(top, inner){ return '<div class="page au">'+brand()+'<div class="au-main">'+inner+'</div></div>'; }
  function sso(dis){
    return '<div class="au-or" aria-hidden="true">or</div><div class="au-sso">'+
      '<button type="button" class="btn btn-secondary btn-block" data-oauth="Google"'+dis+'>'+A.logo.google+'Continue with Google</button>'+
      '<button type="button" class="btn btn-secondary btn-block" data-oauth="Microsoft"'+dis+'>'+A.logo.microsoft+'Continue with Microsoft</button></div>';
  }
  function busyBtn(loading, idle, busy){
    return '<button class="btn btn-primary btn-block'+(loading?' au-busy':'')+'" type="submit"'+(loading?' disabled aria-busy="true"':'')+'>'+
      (loading?'<span class="au-spin" aria-hidden="true"></span>'+busy:idle)+'</button>';
  }
  function wait(){
    return '<div class="au-form" role="status"><div class="au-wait rise">'+
      '<span class="au-pulse">'+A.logo[provider.toLowerCase()]+'</span>'+
      '<h1 class="h2">Finish in the window that opened</h1>'+
      '<p class="muted">Waiting for '+Q.esc(provider)+'…</p>'+
      '<button type="button" class="btn btn-secondary" data-act="cancel">Cancel</button></div></div>';
  }
  function field(id, label, type, val, auto, dis, err, extra){
    return '<div class="field">'+(extra&&extra.labelRow ? extra.labelRow : '<label class="label" for="'+id+'">'+label+'</label>')+
      '<input class="input" id="'+id+'" type="'+type+'" autocomplete="'+auto+'" value="'+Q.esc(val)+'"'+dis+
      (err?' aria-invalid="true" aria-describedby="'+id+'-e"':'')+(extra&&extra.ph?' placeholder="'+extra.ph+'"':'')+'>'+
      (err?'<p class="field-error" id="'+id+'-e">'+err+'</p>':'')+(extra&&extra.after||'')+'</div>';
  }

  /* ---------- S01 ---------- */
  function signin(p){
    fresh();
    var s = mode || p.state;
    if(s==='oauth') return shell('', wait());
    var loading = s==='loading', dis = loading?' disabled':'';
    var banner = s==='cancelled' ? '<div class="banner banner-error" role="alert">'+Q.icon('alert')+'<p>Sign-in was cancelled. Try again.</p></div>'
               : s==='offline' ? '<div class="banner banner-error" role="alert">'+Q.icon('alert')+'<p>Can\'t reach Quotient. Check your connection.</p></div>' : '';
    var wrong = s==='error' ? 'Email or password is not right.' : '';
    return shell('New to Quotient? <a href="#signup">Create an account</a>',
      '<form class="au-form" novalidate data-form="signin"'+(loading?' aria-busy="true"':'')+'>'+
        '<header class="au-head rise"><h1 class="h1">Welcome back</h1><p class="lede">Sign in to your cases</p></header>'+banner+
        field('au-email','Email','email',v.email,'email',dis,'',null)+
        field('au-pw','Password','password',v.pw,'current-password',dis,wrong,
          { labelRow:'<div class="au-labelrow"><label class="label" for="au-pw">Password</label><a href="#signin" data-toast="Reset link sent to '+Q.esc(v.email||ad.email)+'">Forgot password?</a></div>' })+
        busyBtn(loading,'Sign in','Signing in…')+sso(dis)+
        '<p class="au-foot">New to Quotient? <a href="#signup">Create an account</a></p></form>');
  }

  /* ---------- S02 ---------- */
  function signup(p){
    fresh();
    var s = mode || p.state;
    if(s==='oauth') return shell('', wait());
    var e = errs;
    if(!mode){ if(p.state==='inuse'){ e = { semail:'inuse' }; v.semail = v.semail || ad.email; } if(p.state==='weak' || p.state==='error'){ e = { spw:'weak' }; v.spw = v.spw || 'maple1'; } }
    var loading = s==='loading', dis = loading?' disabled':'';
    var met = v.spw.length>=8;
    var rule = e.spw==='weak' ? '' : '<p class="hint au-rule'+(met?' met':'')+'" id="au-rule"><span class="tk">'+Q.icon('check')+'</span>8 or more characters</p>';
    return shell('Have an account? <a href="#signin">Sign in</a>',
      '<form class="au-form" novalidate data-form="signup"'+(loading?' aria-busy="true"':'')+'>'+
        '<header class="au-head rise"><h1 class="h1">Create your account</h1><p class="lede">For financial advisers in Singapore</p></header>'+
        field('au-name','Your name','text',v.name,'name',dis,e.name?'Fill this in.':'',{ph:'Rachel Lim'})+
        field('au-semail','Work email','email',v.semail,'email',dis,
          e.semail==='inuse' ? 'That email already has an account. <a href="#signin">Sign in</a> instead?' : e.semail?'Fill this in.':'', {ph:'you@yourfirm.sg'})+
        field('au-spw','Password','password',v.spw,'new-password',dis,e.spw==='weak'?'Use 8 or more characters.':'',{after:rule})+
        field('au-firm','Firm','text',v.firm,'organization',dis,e.firm?'Fill this in.':'',{ph:'Kallang Advisers'})+
        busyBtn(loading,'Create account','Creating account…')+sso(dis)+
        '<p class="au-foot">Have an account? <a href="#signin">Sign in</a></p></form>');
  }

  function wire(kind){
    return function(el, p){
      var pg = el.querySelector('.page'); if(!pg) return;
      pg.addEventListener('input', function(e){
        var id = e.target.id.replace('au-','');
        if(id in v) v[id] = e.target.value;
        if(id==='spw'){ var r = pg.querySelector('#au-rule'), met = e.target.value.length>=8;
          if(r) r.classList.toggle('met', met);
          var er = pg.querySelector('#au-spw-e');
          if(er && met){ delete errs.spw; e.target.removeAttribute('aria-invalid'); er.outerHTML = '<p class="hint au-rule met" id="au-rule"><span class="tk">'+Q.icon('check')+'</span>8 or more characters</p>'; } }
      });
      pg.addEventListener('click', function(e){
        var o = e.target.closest('[data-oauth]');
        if(o){ provider = o.dataset.oauth; mode = 'oauth'; Q.refresh();
          timer = later(function(){ mode = null; Q.go(kind==='signin' ? '#today' : '#welcome-1'); }, 1800); return; }
        var a = e.target.closest('[data-act]');
        if(a && a.dataset.act==='cancel'){ clearTimeout(timer); mode = 'cancelled'; Q.refresh(); }
      });
      pg.addEventListener('submit', function(e){
        e.preventDefault();
        var f = e.target.dataset.form;
        if(f==='signin'){
          if(!v.email.trim() || !v.pw){ mode = 'error'; focusId = 'au-pw'; Q.refresh(); return; }
          mode = 'loading'; Q.refresh();
          timer = later(function(){ mode = null; Q.go('#today'); }, 1000);
        } else if(f==='signup'){
          errs = {};
          ['name','semail','firm'].forEach(function(k){ if(!v[k].trim()) errs[k] = 'empty'; });
          if(v.semail.trim().toLowerCase()===ad.email) errs.semail = 'inuse';
          if(v.spw.length<8) errs.spw = 'weak';
          var first = ['name','semail','spw','firm'].filter(function(k){ return errs[k]; })[0];
          if(first){ mode = 'error'; focusId = 'au-'+first; Q.refresh(); return; }
          mode = 'loading'; Q.refresh();
          timer = later(function(){ mode = null; Q.go('#welcome-1'); }, 1000);
        }
      });
      if(focusId){ var fi = pg.querySelector('#'+focusId); focusId = null; if(fi) fi.focus(); }
    };
  }

  Q.screen('signin', { title:'Sign in', nav:'', rail:false, render:signin, mount:wire('signin') });
  Q.screen('signup', { title:'Create account', nav:'', rail:false, render:signup, mount:wire('signup') });
})();
