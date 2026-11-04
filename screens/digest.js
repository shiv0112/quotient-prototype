/* S20 Morning digest notification (#digest). Builder A. A mock of the device notification, built from the cases that need you (Q.needs).
   Case numbers only by default. Settings > Morning digest "Show client names on the lock screen" (adviser.digestNames, off)
   adds first names, filled in on the device. Click opens the first case that needs action.
   States: normal · empty (nothing to report, or the digest is off, so nothing is sent). Time = Settings (adviser.digestTime). */
(function(){
  'use strict';
  var D = Q.data;

  Q.screen('digest', {
    title:'Morning digest', nav:'', rail:false,
    render:function(p){
      var ad = D.adviser, on = !ad.pf || ad.pf.digest!==false, names = !!ad.digestNames;
      var needs = p.state==='empty' || !on ? [] : Q.needs(), k = needs[0], c = k && D.cases[k], n = needs.length;
      function item(x){ var why = Q.status(x).why; return (names ? D.cases[x].first+' ' : '')+'#'+D.cases[x].no+' '+why.charAt(0).toLowerCase()+why.slice(1); }
      var body = !c ? '' : n+' case'+(n>1?'s':'')+' need'+(n>1?'':'s')+' you today · '+needs.slice(0,2).map(item).join(' · ')+(n>2?' · '+(n-2)+' more':'');
      var open = !c ? '' : names ? 'Open '+c.name+' #'+c.no : 'Open case #'+c.no;
      var note = !c
        ? '<div class="dgst-quiet"><p>'+(on ? 'Nothing to report today,<br>so no notification was sent.' : 'The morning digest is off.<br>Turn it on in Settings.')+'</p></div>'
        : '<a class="dgst-note" href="'+Q.status(k).go+'" aria-label="Quotient notification. '+Q.esc(body)+'. '+Q.esc(open)+'.">'+
            '<header><span class="wordmark">Quotient</span><span>·</span><span>Notification</span><span class="num">'+Q.esc(ad.digestTime)+'</span></header>'+
            '<b>Quotient · '+D.today.date+'</b><p>'+Q.esc(body)+'</p>'+
            '<span class="dgst-open">'+Q.esc(open)+Q.icon('arrow','i-sm')+'</span></a>';
      var line = (names ? 'Names come from this device, not from our server.' : 'Case numbers only. Names show when you open Quotient.')+' Nothing to report means no notification.';
      return '<div class="page dgst">'+
        '<header class="dgst-top"><a class="back" href="#today">'+Q.icon('back','i-sm')+'Back to Today</a><span class="chip chip-outline desk-only">Notification · mock</span></header>'+
        '<div class="dgst-body">'+
          '<div class="dgst-copy rise"><p class="eyebrow">Morning digest</p><h1 class="h1">Your day, before you open Quotient</h1>'+
            '<p class="lede">Sent at '+Q.esc(ad.digestTime)+'. Click it to open the first case that needs you.</p>'+
            '<p class="small device-line">'+Q.icon('device','i-sm')+' '+line+'</p>'+
            '<p class="small"><a href="#prefs">Change it in Settings</a></p></div>'+
          '<div class="dgst-screen rise"><div class="dgst-bar" aria-hidden="true"><span>'+D.today.date+'</span><span class="num">'+Q.esc(ad.digestTime)+'</span></div>'+note+'</div>'+
        '</div></div>';
    }
  });
})();
