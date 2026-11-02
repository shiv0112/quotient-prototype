/* S20 Morning digest notification (#digest). Builder A. A mock of the device notification.
   Names are allowed: it is made and shown on this device only. Click opens the first case that needs action.
   States: normal (3 items) · empty (nothing to report, so nothing is sent). */
(function(){
  'use strict';
  var D = Q.data, A = QD.a;


  Q.screen('digest', {
    title:'Morning digest', nav:'', rail:false,
    render:function(p){
      var empty = p.state==='empty', body = 'Today: '+D.digest.items.map(function(i){ return Q.esc(i.text); }).join(' · ');
      var note = empty
        ? '<div class="dgst-quiet"><p>Nothing to report today,<br>so no notification was sent.</p></div>'
        : '<a class="dgst-note" href="'+A.digestOpens+'" aria-label="Quotient notification. '+Q.esc(body)+'. Opens Wei Tan\'s meeting.">'+
            '<header><span class="wordmark">Quotient</span><span>·</span><span>This device</span><span class="num">'+D.digest.sent+'</span></header>'+
            '<b>Quotient · '+D.today.date+'</b><p>'+body+'</p>'+
            '<span class="dgst-open">Open Wei Tan #'+D.cases.wei.no+Q.icon('arrow','i-sm')+'</span></a>';
      return '<div class="page dgst">'+
        '<header class="dgst-top"><a class="back" href="#today">'+Q.icon('back','i-sm')+'Back to Today</a><span class="chip chip-outline desk-only">Device notification · mock</span></header>'+
        '<div class="dgst-body">'+
          '<div class="dgst-copy rise"><p class="eyebrow">Morning digest</p><h1 class="h1">Your day, before you open Quotient</h1>'+
            '<p class="lede">Sent at '+D.digest.sent+' to this device. Click it to open the first case that needs you.</p>'+
            '<p class="small device-line">'+Q.icon('device','i-sm')+' Made and shown on this device only, so names are fine. Nothing to report means no notification.</p>'+
            '<p class="small"><a href="#prefs">Change the time in Settings</a></p></div>'+
          '<div class="dgst-screen rise"><div class="dgst-bar" aria-hidden="true"><span>'+D.today.date+'</span><span class="num">'+D.digest.sent+'</span></div>'+note+'</div>'+
        '</div></div>';
    }
  });
})();
