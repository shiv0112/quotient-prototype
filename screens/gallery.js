/* Component gallery (#gallery). Every component, live on the current theme. Prototype only. */
(function(){
  'use strict';
  var I = Q.icon;
  var TOKENS = [['bg','Page'],['surface','Surface'],['surface-2','Quiet fill'],['line','Hairline'],['ink','Marine ink'],['text-2','Text 2'],['text-3','Text 3'],
    ['accent','Coral · action'],['link','Teal · link, on device'],['ph-bg','Placeholder'],['confirm-bg','Confirm'],['ok','Success'],['err','Error'],['hero','Hero']];

  function sec(title, note, body){ return '<section class="g-sec"><div class="g-h"><h2 class="h3">'+title+'</h2>'+(note?'<p class="small muted">'+note+'</p>':'')+'</div><div class="g-body">'+body+'</div></section>'; }

  Q.screen('gallery', {
    title:'Components', nav:'',
    render:function(){
      return '<div class="page gallery">'+
      '<header class="page-head"><div><p class="eyebrow">Prototype</p><h1 class="h1 display">Components</h1><p class="sub">Everything here reads from tokens.css. Switch the theme in the Demo menu.</p></div></header>'+

      sec('Colour', 'Coral is for actions only. Teal is for links and things that stay on the device. Yellow means you must check.',
        '<div class="g-swatches">'+TOKENS.map(function(t){ return '<div class="g-sw"><i style="background:var(--'+t[0]+')"></i><b>'+t[1]+'</b><small class="num" data-tok="'+t[0]+'">--'+t[0]+'</small></div>'; }).join('')+'</div>')+

      sec('Type', 'Bricolage Grotesque for display, Plus Jakarta Sans for everything else. Figures are tabular.',
        '<div class="g-type"><p class="display" style="font-size:var(--t-4xl)">Wei Tan #402</p><p class="h1">What leaves your device</p><p class="h2">Plan comparison</p>'+
        '<p class="h3">Check 2 numbers before you share</p><p>Names go back in on your device when the answer returns.</p><p class="small muted">Illustrated values are not guaranteed.</p>'+
        '<p class="eyebrow">Next step</p><p class="num" style="font-size:var(--t-xl);font-weight:600">S$72,760 · S$68,821 · S$65,866</p></div>')+

      sec('Buttons', 'One primary per screen. 44px tall minimum.',
        '<div class="row"><button class="btn btn-primary">Send this text</button><button class="btn btn-secondary">Edit what is sent</button><button class="btn btn-ghost">Back</button>'+
        '<button class="btn btn-danger">Delete case</button><button class="btn-link">Try again</button><button class="btn btn-primary" disabled>Share</button></div>'+
        '<div class="row" style="margin-top:12px"><button class="btn btn-secondary btn-sm">Nudge</button><button class="btn btn-secondary btn-sm">Share v2</button><button class="icon-btn" aria-label="Close">'+I('close')+'</button></div>')+

      sec('Inputs', '',
        '<div class="g-form"><div class="field"><label class="label" for="g1">Email</label><input class="input" id="g1" placeholder="rachel.lim@kallangadvisers.sg"></div>'+
        '<div class="field"><label class="label" for="g2">Use notes from</label><select class="select" id="g2"><option>Wei Tan · Today 11:00 · transcript</option><option>Paste notes</option><option>No notes</option></select></div>'+
        '<div class="field"><label class="label" for="g3">Password</label><input class="input" id="g3" type="password" value="abc" aria-invalid="true" aria-describedby="g3e"><span class="field-error" id="g3e">Use 8 or more characters.</span></div>'+
        '<div class="field"><label class="label" for="g4">Your notes</label><textarea class="textarea" id="g4">Wants cover to 65.</textarea></div>'+
        '<div class="row"><label class="check"><input type="checkbox" checked> I\'ve saved these words somewhere safe</label></div>'+
        '<div class="row"><label class="switch"><input type="checkbox" checked> Take notes</label><label class="switch"><input type="checkbox"> Call audio · off</label></div></div>')+

      sec('Chips', 'Status chips, proof chips (page refs), placeholders, blanks, source links.',
        '<div class="row"><span class="chip">Compared</span><span class="chip chip-ok chip-dot">Won</span><span class="chip chip-warn">Selected Client</span><span class="chip chip-err">Couldn\'t send</span>'+
        '<span class="chip chip-device">'+I('device','i-sm')+'Stays on this device</span><span class="chip chip-outline">S08</span><span class="chip">Not guaranteed</span></div>'+
        '<p style="margin-top:16px"><span class="ph">[CLIENT]</span>, age 35, project manager at <span class="ph">[EMPLOYER]</span>. Two children, <span class="ph">[CHILD 1]</span> (8) and <span class="ph">[CHILD 2]</span> (11).</p>'+
        '<p style="margin-top:12px">Existing cover: <span class="blank">blank</span> Harbour v2 costs S$3,300 a year.<a class="source" href="#gallery">Table · Harbour v2 · premium</a><a class="source" href="#gallery">Meeting 12:04</a></p>'+
        '<div class="row" style="margin-top:12px"><button class="proof" data-sheet="wei/v1/harbour/premium">p.3</button><span class="small muted">Proof chip: opens the PDF page</span></div>')+

      sec('Table', 'Ledger: figures right-aligned and tabular, proof chip before each number, hairline rules. Yellow cells must be checked.',
        '<div class="card"><div class="tbl-wrap"><table class="tbl"><colgroup><col style="width:30%"><col><col><col></colgroup><thead><tr><th scope="col"><small>Whole life par</small></th><th scope="col">Harbour Assurance</th><th scope="col">Meridian Life</th><th scope="col">Orchid Mutual</th></tr></thead><tbody>'+
        '<tr><th scope="row">Annual premium</th><td><button class="fig" data-sheet="wei/v1/harbour/premium"><span class="proof">p.3</span><span class="v">S$4,200</span></button></td><td><button class="fig" data-sheet="wei/v1/meridian/premium"><span class="proof">p.2</span><span class="v">S$3,600</span></button></td><td><button class="fig" data-sheet="wei/v1/orchid/premium"><span class="proof">p.4</span><span class="v">S$3,150</span></button></td></tr>'+
        '<tr class="grp"><th colspan="4">Illustrated total at 4.25% a year<span class="chip">Not guaranteed</span></th></tr>'+
        '<tr><th scope="row">Year 20</th><td><button class="fig confirm-cell" data-sheet="wei/v1/harbour/b20"><span class="tag">Check</span><span class="v">S$72,760</span><span class="proof">p.6</span></button></td><td><button class="fig"><span class="proof">p.6</span><span class="v">S$68,821</span><span class="ok">'+I('check','i-sm')+'</span></button></td><td><button class="fig confirm-cell" data-sheet="wei/v1/orchid/b65"><span class="tag">Not found</span><span class="proof">p.9</span></button></td></tr>'+
        '<tr><th scope="row">Annual premium <small>v2</small></th><td><button class="fig"><span class="was">was S$4,200</span><span class="proof">p.3</span><span class="v">S$3,300</span></button></td><td></td><td></td></tr>'+
        '</tbody></table></div></div>')+

      sec('Banners', 'One at a time, one sentence, one action.',
        '<div class="stack" style="gap:8px"><div class="banner banner-info">'+I('info')+'<p>Harbour Assurance, Meridian Life · read on this device, nothing sent.</p></div>'+
        '<div class="banner banner-warn">'+I('alert')+'<p><b>Orchid Mutual:</b> illustrated total at 4.25% a year · age 65 was not found in the PDF.</p><button class="btn btn-sm">Add value</button></div>'+
        '<div class="banner banner-error">'+I('alert')+'<p>Couldn\'t check this text. Nothing was sent.</p><button class="btn-link">Try again</button></div>'+
        '<div class="banner banner-success">'+I('check')+'<p>Nudge sent · next reminder Mon 9 Nov.</p></div></div>')+

      sec('Cards', 'Surface card, hero next-step card, closed card.',
        '<div class="stack"><div class="card"><div class="card-head"><h3 class="h3">Needs you</h3><span class="small muted">5 cases</span></div><ul class="list"><li><div class="who"><b>Priya Krishnan</b> <span class="case-no">#398</span><small>No reply for 3 days</small></div><button class="btn btn-secondary btn-sm">Nudge</button></li></ul></div>'+
        '<section class="card next-card hero"><div><p class="eyebrow">Next step</p><h2>Check 2 numbers before you share</h2><p>Share unlocks when they are checked.</p></div><div class="acts"><button class="btn btn-secondary" aria-disabled="true">Share</button><button class="btn btn-primary">Check first number</button></div></section>'+
        '<section class="card next-card done"><div><p class="eyebrow">Closed</p><h2>Won · policy with Meridian Life</h2></div><div class="acts"><a class="btn-link" href="#sent-kevin">See what left your device</a></div></section></div>')+

      sec('Timeline', 'Done, now, skipped (Firm review not needed), future.',
        '<div class="tl-wrap"><ol class="timeline"><li class="tl done"><i></i><b>Met</b><small>Wed 28 Oct</small></li><li class="tl done"><i></i><b>Compared</b><small>Mon 2 Nov</small></li><li class="tl now"><i></i><b>Shared</b><small>Now</small></li><li class="tl"><i></i><b>Client replied</b><small> </small></li><li class="tl"><i></i><b>Chosen</b><small> </small></li><li class="tl"><i></i><b>Write-up</b><small> </small></li><li class="tl skip"><i></i><b>Firm review</b><small>Not needed</small></li><li class="tl won"><i></i><b>Won</b><small>Tue 20 Oct</small></li></ol></div>')+

      sec('Tabs and segmented', '',
        '<div class="tabs" role="tablist"><button role="tab" aria-selected="true">Your notes</button><button role="tab" aria-selected="false">Transcript</button><button role="tab" aria-selected="false">Draft</button></div>'+
        '<div class="row" style="margin-top:16px"><div class="seg"><button aria-pressed="true">Email</button><button aria-pressed="false">Share</button></div>'+
        '<div class="seg"><button aria-pressed="false">1 day</button><button aria-pressed="true">3 days</button></div>'+
        '<button class="chip" aria-pressed="true">Needs you · 5</button><button class="chip" aria-pressed="false">In progress</button><button class="chip" aria-pressed="false">Closed</button></div>')+

      sec('Recording bar', 'Pinned to the top of every screen while recording. Start one to see it live.',
        '<div class="stack" style="gap:8px"><div class="recbar" style="position:static;border-radius:var(--r-md)"><span class="live"></span><span class="level"><i></i><i></i><i></i><i></i></span><span>Recording your microphone only · call audio is not recorded</span><span class="t">12:40</span><button class="btn btn-secondary">Pause</button><button class="btn btn-primary">Stop</button></div>'+
        '<div class="recbar paused" style="position:static;border-radius:var(--r-md)"><span class="live"></span><span class="level"><i></i><i></i><i></i><i></i></span><span>Paused</span><span class="t">12:40</span><button class="btn btn-secondary">Resume</button><button class="btn btn-primary">Stop</button></div>'+
        '<div class="row"><button class="btn btn-secondary" data-g="rec">'+I('mic','i-sm')+'Start live bar</button><button class="btn btn-ghost" data-rec="stop">Stop live bar</button></div></div>')+

      sec('Overlays', 'Side sheet (PDF page), dialog (focus starts on the safe button), toast.',
        '<div class="row"><button class="btn btn-secondary" data-sheet="wei/v1/harbour/b20">Open PDF sheet</button><button class="btn btn-secondary" data-g="dialog">Open dialog</button>'+
        '<button class="btn btn-secondary" data-toast="Copied. Paste it into your firm portal.">Show toast</button>'+
        '<div class="menu"><button class="btn btn-secondary" data-menu aria-haspopup="true" aria-expanded="false">'+I('more')+'More</button><div class="menu-pop" role="menu"><button role="menuitem">Mark won</button><button role="menuitem">Mark lost</button><button role="menuitem" class="danger">Delete case</button></div></div></div>')+

      sec('Empty and loading', '',
        '<div class="g-two"><div class="empty"><h2>No cases yet</h2><p>Start one from a meeting or from PDFs.</p><button class="btn btn-primary">'+I('plus')+'New case</button></div>'+
        '<div class="card" aria-busy="true"><span class="skel skel-lg" style="width:40%"></span><span class="skel" style="width:85%;margin-top:16px"></span><span class="skel" style="width:70%;margin-top:10px"></span><span class="skel" style="width:55%;margin-top:10px"></span></div></div>')+
      '</div>';
    },
    mount:function(el){
      var cs = getComputedStyle(document.documentElement);
      el.querySelectorAll('[data-tok]').forEach(function(s){ s.textContent = cs.getPropertyValue('--'+s.dataset.tok).trim().toUpperCase(); });
      el.querySelector('.page').addEventListener('click', function(e){
        var g = e.target.closest('[data-g]'); if(!g) return;
        if(g.dataset.g==='rec' && !Q.recording.get()) Q.recording.start({ callAudio:false });
        if(g.dataset.g==='dialog') Q.dialog({ title:'Before you record', body:'<p>You must have the client\'s permission to record this meeting. Do you wish to continue?</p>',
          actions:[{label:'Cancel',value:null},{label:'Continue',value:'go',kind:'primary'}], safe:null });
      });
    }
  });
})();
