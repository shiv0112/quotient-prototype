# Building screens for the Quotient prototype

Read first: `docs/design/BRIEF.md` (wins on facts), `docs/design/ux-spec.md` (screens, copy, states), `docs/design/DIRECTION.md` (look). Reference screens: `screens/today.js`, `screens/case.js`. All components: open `index.html#gallery`.

## Add a screen
1. Make `screens/<name>.js`:
```js
(function(){
  var D = Q.data;
  Q.screen('share', {                    // route #share or #share-<arg>
    title: function(p){ return 'Share'; },
    nav: 'cases',                        // today | meetings | cases | prefs | '' (none)
    rail: true,                          // false = focus mode (gate, edit, processing, sign-in, onboarding)
    render: function(p){                 // p = {id, arg, parts, state, edition}
      if(p.state==='empty')   return '...';
      if(p.state==='error')   return '...';
      if(p.state==='loading') return '...';
      return '<div class="page">...</div>';
    },
    mount: function(el, p){              // attach listeners to el.querySelector('.page'), not el (el is reused)
    }
  });
})();
```
2. Add `<script src="screens/<name>.js"></script>` at the end of `index.html`. Do not edit `core.js`.
3. Route ids already listed in the demo jump menu (`Q.inventory` in core.js): `signin`, `signup`, `welcome-1..4`, `meetings`, `meeting-<meetingId>`, `new-case[-<case>]`, `gate-<case>-<compare|writeup|nudge|mas>` (plain `gate-<case>` opens the case's own gate; a case with no text for that feature shows "Nothing to send"), `gate-edit-<case>-<feature>`, `processing-<case>-<feature>`, `share-<case>`, `writeup-<case>`, `mas-<case>`, `nudge-<case>`, `reminder` (old `#telegram` redirects here), `sent-<case>`, `cases`, `prefs` (Settings; never `#settings`), `digest`. Longest id wins, so `gate-edit` beats `gate`.
4. Layout CSS for your screen goes at the end of `components.css` under "Screen layouts", using tokens only.

## Core API (full list at the top of core.js)
`Q.data` · `Q.go(hash)` · `Q.refresh()` · `Q.state()` · `Q.edition()` · `Q.theme()` · `Q.openSheet('wei/v1/harbour/b20')` · `Q.sheet({title, body, foot, mount})` · `Q.closeSheet()` · `Q.dialog({title, body, actions, safe})` → Promise · `Q.toast(msg)` · `Q.recording.start({callAudio}) / pause / resume / stop` · `Q.toCheck(case, ver)` · `Q.waLink(case, text)` (WhatsApp click-to-chat) · `Q.notice(case, opts)` (reminder notification card) · `Q.cell(ref)` · `Q.rowLabel(row)` · `Q.money(n)` · `Q.esc(s)` · `Q.icon(name)`.
Markup shortcuts: `data-go="#hash"`, `data-sheet="ref"`, `data-toast="text"`, `data-menu` (toggles parent `.menu`), `data-rec="stop"`.
Icons: today, meetings, cases, prefs, plus, back, next, close, check, more, mic, file, info, alert, search, device, arrow, share, video, bell.

## Component classes
- Layout: `.page`, `.page-head` (+ `.sub`), `.back`, `.stack`, `.row`, `.spacer`, `.tiled` (header tile motif), `.phone-only`, `.desk-only`.
- Type: `.h1`, `.h2`, `.h3`, `.display`, `.eyebrow`, `.lede`, `.muted`, `.small`, `.num`, `.dot-sep`, `.wordmark`.
- Buttons: `.btn` + `.btn-primary | .btn-secondary | .btn-ghost | .btn-danger`, `.btn-sm`, `.btn-block`, `.btn-link`, `.icon-btn`. Disabled: `disabled` or `aria-disabled="true"` + `title` with the reason.
- Form: `.field`, `.label`, `.hint`, `.field-error`, `.input`, `.select`, `.textarea`, `.check` (label wrapping input), `.switch` (label wrapping checkbox).
- Chips: `.chip` + `.chip-ok | .chip-warn | .chip-err | .chip-device | .chip-outline | .chip-dot`; `button.chip[aria-pressed]` for filters. `.proof` (page ref), `.ph` (placeholder), `.blank` (yellow blank), `.source` (sentence source link).
- Table: `.tbl-wrap > table.tbl`, `tr.grp` group rows, `.fig` figure button (`.v` value, `.was`, `.ok`), `.confirm-cell` (+ `.tag`).
- Feedback: `.banner` + `.banner-info | -warn | -error | -success`, `.empty`, `.skel` (+ `.skel-lg`), `.toast` (via Q.toast), `.recbar` (via Q.recording).
- Containers: `.card` (+ `.card-head`, `.card-foot`, `.hero`), `.next-card` (+ `.hero` or `.done`, `.acts`), `.list > li` (+ `.who`, `.case-no`), `.timeline > .tl` (+ `.done | .now | .skip | .won | .lost`), `.tabs`, `.seg`, `.menu > .menu-pop`, `.sheet`, `.dialog`, `.pdf`, `.readout`.

## Copy rules
- Plain, short words. **No em-dashes** in UI copy (use " · " or a full stop).
- Never "vault". Never "Telegram": reminders are Quotient's own notifications, case numbers only. Clients get WhatsApp, "Email instead" is secondary. Never "laptop" or "Mac" (say "device").
- Never claim the client consented. Never claim guaranteed returns; illustrated values always say "not guaranteed".
- Never frame clients, seniors or advisers dismissively.
- Money: `Q.money(n)` gives "S$72,760".
- Use exact copy from ux-spec.md. Demo data only from `Q.data` (Wei has two children, aged 8 and 11).
- Brand: **wordmark only, no logo mark** (`<span class="wordmark">Quotient</span>`).

## Checklist before you hand over
- [ ] One primary (coral) button on the screen. Coral only for actions; yellow only for must-confirm; teal for links and on-device.
- [ ] All states from the ux-spec inventory render, including `Q.state()` empty / error / loading.
- [ ] Web vs Desktop differences use `Q.edition()`.
- [ ] Works at 400px: no horizontal page scroll, 16px gutters, 44px targets.
- [ ] Light and dark both checked; no raw colours, tokens only.
- [ ] Keyboard: every action reachable by Tab, visible focus, Esc closes overlays, dialogs focus the safe button.
- [ ] `node --check screens/<name>.js` passes; screenshots via `_shots/shoot.sh` look right.
- [ ] Self-checks: `_shots/flow.html` (confirm flow) and `_shots/check.html` (400px overflow); run headless with `--allow-file-access-from-files --dump-dom`.

## Demo
- Demo state chips for a screen are written inside the page as `<nav class="switcher">`; core.js moves them into the Demo panel ("States for this screen"). Never style them as part of the screen.
- Shared case state: mutate `Q.data` (cases, writeup, mas, meetings) and it is saved to sessionStorage on every render, so Today, Cases and Case agree. `Q.status(key)` is the one short next step. `Q.masFor(key)` holds each case's MAS answers, §10B reason and checks (`c.selected` follows the verdict). `Q.canWin(key)` gates Mark won. Screens with `caseArg:true` show a 404 for an unknown case. Demo params (`?reset`, `?state`, `?edition`, `?theme`) are dropped from the URL once applied. `?reset` or Demo > Reset demo data starts fresh.
