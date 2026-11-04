/* Record notes (no calendar meeting). Any [data-quick-notes] button starts it; data-quick-notes="<case>" pre-picks that case.
   Same permission dialog every time, same mic-only bar. After Stop: transcribe (on the device in desktop, speech service on web), then "Save these notes":
   title, attach to a case, start a new case, or keep unfiled (shows in Meetings under "Notes"). */
(function(){
  'use strict';
  var D = Q.data, active = null;
  var NOW = { date:'Tue 3 Nov', time:'14:20', at:'2026-11-03 14:20' }; // demo clock for new notes

  function start(k){
    if(Q.recording.get()) return Q.dialog({ title:'Already recording', body:'<p>Stop the current recording first.</p>', actions:[{label:'OK',value:null}], safe:null });
    Q.dialog({ title:'Before you record', body:'<p>You must have the client\'s permission to record this meeting. Do you wish to continue?</p>',
      actions:[{label:'Cancel',value:null},{label:'Continue',value:'go',kind:'primary'}], safe:null })
    .then(function(ok){ if(!ok) return; Q.recording.start({ callAudio:false }); Q.recording.get().quick = true; active = { c:k||'', t0:Date.now() }; });
  }

  Q.on('recording-stopped', function(){
    if(!active) return;
    var a = active; active = null;
    Q.sheet({ title:'Save these notes', body:'<p class="qn-busy" aria-live="polite"><span class="wu-spin" aria-hidden="true"></span>Writing up the transcript'+(Q.edition()==='desktop'?' on this device':'')+'…</p>' });
    setTimeout(function(){ openSave(a.c, Math.max(1, Math.round((Date.now()-a.t0)/60000))); }, 1800);
  });

  function openSave(c, mins){
    var saved = false, where = c ? 'case' : 'none', len = (mins||1)+' min';
    var opts = D.caseOrder.map(function(k){ var x = D.cases[k]; return '<option value="'+k+'"'+(k===c?' selected':'')+'>'+Q.esc(x.name)+' #'+x.no+'</option>'; }).join('');
    function radio(v, label, extra){ return '<label class="check"><input type="radio" name="qn-where" value="'+v+'"'+(v===where?' checked':'')+'> '+label+'</label>'+(extra||''); }
    Q.sheet({ title:'Save these notes',
      body:'<p class="small muted">Quick notes · microphone only · '+len+'</p>'+
        '<div class="field"><label class="label" for="qn-title">Title</label><input class="input" id="qn-title" value="Notes · '+NOW.date+' '+NOW.time+'"></div>'+
        '<fieldset class="field qn-opts"><legend class="label">Where should they go?</legend>'+
          radio('case', 'Add to a case', '<label class="sr" for="qn-case">Case</label><select class="select" id="qn-case">'+opts+'</select>')+
          radio('new', 'Start a new case')+
          radio('none', 'Keep unfiled · find them in Meetings under Notes')+'</fieldset>'+
        '<p class="device-line small">'+Q.icon('device','i-sm')+(Q.recCopy()?Q.recCopy()+' ':'')+Q.aiRule+'</p>',
      foot:'<button class="btn btn-primary" data-qn="save">Save notes</button><button class="btn btn-ghost" data-close>Close</button>',
      onClose:function(){ if(!saved){ save('', 'none'); Q.toast('Saved in Meetings · Notes'); } }, // never lose a recording
      mount:function(sh){
        var sel = sh.querySelector('#qn-case');
        sel.disabled = where!=='case';
        sh.addEventListener('change', function(e){ if(e.target.name==='qn-where') sel.disabled = e.target.value!=='case'; });
        sh.querySelector('[data-qn="save"]').addEventListener('click', function(){
          var t = sh.querySelector('#qn-title'), w = sh.querySelector('input[name=qn-where]:checked').value;
          if(!t.value.trim()){ t.setAttribute('aria-invalid','true'); t.focus(); return; }
          saved = true; var k = w==='case' ? sel.value : '', id = save(t.value.trim(), w, k, len);
          Q.closeSheet();
          if(w==='case'){ Q.toast('Notes added to case #'+D.cases[k].no); Q.go('#case-'+k); }
          else if(w==='new'){ QB.pick('', [id]); Q.toast('Notes saved · add PDFs to start the case'); Q.go('#new-case'); }
          else { Q.toast('Saved in Meetings · Notes'); Q.refresh(); }
        });
      } });
  }

  function save(title, w, k, len){
    var id = 'notes-'+Date.now();
    D.meetings.past.unshift({ id:id, kind:'notes', date:NOW.date, time:NOW.time, at:NOW.at, who:title||('Notes · '+NOW.date+' '+NOW.time), c:k||null, len:len||'1 min', notesReady:true });
    D.transcripts[id] = { labels:false, lines:QD.b.live.slice(0,3).map(function(l,i){ return ['00:'+String(5+i*20).padStart(2,'0'), l[1]]; }) };
    Q.save();
    return id;
  }

  document.addEventListener('click', function(e){
    var b = e.target.closest('[data-quick-notes]'); if(b){ e.preventDefault(); start(b.dataset.quickNotes); }
  });
  window.QN = { start:start, openSave:openSave };
})();
