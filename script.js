'use strict';

/* ─── SCREEN SWITCHER ───────────────────────────────────────────────── */
const screens = {
  register: document.getElementById('screen-register'),
  signin:   document.getElementById('screen-signin')
};

function showScreen(name) {
  Object.entries(screens).forEach(([k, el]) => {
    el.classList.toggle('active', k === name);
  });
  /* announce screen change to screen readers */
  announce(name === 'register' ? 'Showing registration form.' : 'Showing sign in form.');
}

document.getElementById('goto-signin').addEventListener('click', () => showScreen('signin'));
document.getElementById('goto-register-from-signin').addEventListener('click', () => showScreen('register'));
document.getElementById('goto-register-foot').addEventListener('click', () => showScreen('register'));


/* ─── ARIA LIVE ANNOUNCER (PDF p.15 — polite region) ─────────────────
   "A polite live region waits until the user pauses, exits the field
   (blur), or attempts submission before announcing the change."        */
const announcer = document.getElementById('announcer');
function announce(msg) {
  announcer.textContent = '';
  requestAnimationFrame(() => { announcer.textContent = msg; });
}


/* ─── REGEX LOGIC GATES (PDF p.10-12) ────────────────────────────────

   PDF p.12 — Email Reality Check:
   "A general-purpose regex ensures an email has text, an @ symbol,
   and a domain dot. Do not over-engineer — it incorrectly rejects
   valid addresses."
   Regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
*/
const RE_EMAIL    = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/*
   PDF p.11 — Anatomy of a Strict Password Policy:
   Full pattern: /^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[#?!@$%^&*-]).{8,}/
   Each lookahead is a separate gate, tested individually for precise feedback.
*/
const RE_PW_FULL    = /^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[#?!@$%^&*-]).{8,}/;
const RE_PW_UPPER   = /(?=.*[A-Z])/;
const RE_PW_LOWER   = /(?=.*[a-z])/;
const RE_PW_DIGIT   = /(?=.*[0-9])/;
const RE_PW_SPECIAL = /(?=.*[#?!@$%^&*-])/;

/* Additional field regex gates */
const RE_NAME     = /^[A-Za-z\u00C0-\u017E\s'\-]{2,50}$/;
const RE_PHONE    = /^[0-9]{7,15}$/;


/* ─── SVG PATHS for rule icons ────────────────────────────────────── */
const PATH_CHECK = '<polyline points="20 6 9 17 4 12"/>';
const PATH_PLUS  = '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>';
const PATH_X     = '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>';


/* ─── FIELD HELPERS ──────────────────────────────────────────────────

   PDF p.14 — The Accessibility Tether:
   "aria-invalid='true' alerts assistive technology that current
   input violates constraints."
   "aria-describedby physically links the input field directly to
   the ID of the error message, ensuring the precise error is read
   aloud the moment the field gains focus."
*/
function setError(inputEl, errEl, msg) {
  /* Rejected Payload path (PDF p.13) */
  inputEl.setAttribute('aria-invalid', 'true');
  inputEl.classList.remove('valid');
  inputEl.classList.add('invalid');
  errEl.querySelector('.msg-text').textContent = msg;
  errEl.classList.add('show');
  errEl.setAttribute('aria-hidden', 'false');
  /* status icon → X */
  const ico = document.getElementById(inputEl.id + '-ico');
  if (ico) {
    ico.innerHTML = PATH_X;
    ico.classList.add('show','bad');
    ico.classList.remove('ok');
  }
}

function clearError(inputEl, errEl) {
  inputEl.setAttribute('aria-invalid', 'false');
  inputEl.classList.remove('invalid');
  errEl.querySelector('.msg-text').textContent = '';
  errEl.classList.remove('show');
  errEl.setAttribute('aria-hidden', 'true');
  const ico = document.getElementById(inputEl.id + '-ico');
  if (ico) ico.classList.remove('show','bad','ok');
}

function setValid(inputEl, errEl) {
  /* Approved Payload path (PDF p.13) */
  clearError(inputEl, errEl);
  inputEl.classList.add('valid');
  const ico = document.getElementById(inputEl.id + '-ico');
  if (ico) {
    ico.innerHTML = PATH_CHECK;
    ico.classList.add('show','ok');
    ico.classList.remove('bad');
  }
}


/* ─── PASSWORD STRENGTH METER & RULE UPDATER (PDF p.11) ─────────── */
function updatePwStrength(val) {
  const bar    = document.getElementById('pw-bar');
  const slabel = document.getElementById('pw-slabel');

  bar.className = 'pw-bar';
  slabel.className = 'pw-slabel';

  if (!val) { slabel.textContent = ''; return; }

  const has = {
    len:  val.length >= 8,
    up:   RE_PW_UPPER.test(val),
    lo:   RE_PW_LOWER.test(val),
    di:   RE_PW_DIGIT.test(val),
    sp:   RE_PW_SPECIAL.test(val)
  };

  const score = Object.values(has).filter(Boolean).length;
  const level = score <= 1 ? 1 : score <= 2 ? 2 : score <= 3 ? 3 : 4;
  const labels = ['','Very weak','Weak','Fair','Strong'];

  bar.classList.add('s' + level);
  slabel.classList.add('s' + level);
  slabel.textContent = labels[level];

  /* Update each rule row (PDF p.11 diagram) */
  updateRule('rl-len', 'rl-len-i', has.len);
  updateRule('rl-up',  'rl-up-i',  has.up);
  updateRule('rl-lo',  'rl-lo-i',  has.lo);
  updateRule('rl-di',  'rl-di-i',  has.di);
  updateRule('rl-sp',  'rl-sp-i',  has.sp);
}

function updateRule(rowId, iconId, isMet) {
  const row  = document.getElementById(rowId);
  const icon = document.getElementById(iconId);
  if (!row || !icon) return;
  row.classList.toggle('met', isMet);
  row.classList.toggle('fail', !isMet && !!document.getElementById('r-pw').value);
  icon.innerHTML = isMet ? PATH_CHECK : PATH_PLUS;
}


/* ─── PASSWORD TOGGLE VISIBILITY ────────────────────────────────── */
function makePwToggle(btnId, inputEl, eyeId, eyeOffId) {
  document.getElementById(btnId).addEventListener('click', function() {
    const showing = inputEl.type === 'text';
    inputEl.type  = showing ? 'password' : 'text';
    document.getElementById(eyeId).style.display    = showing ? '' : 'none';
    document.getElementById(eyeOffId).style.display = showing ? 'none' : '';
    this.setAttribute('aria-pressed', String(!showing));
    this.setAttribute('aria-label', showing ? 'Show password' : 'Hide password');
    announce(showing ? 'Password hidden.' : 'Password visible.');
  });
}

makePwToggle('tgl-pw',    document.getElementById('r-pw'),  'eye1',  'eye1off');
makePwToggle('tgl-cpw',   document.getElementById('r-cpw'), 'eye2',  'eye2off');
makePwToggle('tgl-si-pw', document.getElementById('si-pw'), 'eye3',  'eye3off');


/* ══════════════════════════════════════════════════════════════════
   REGISTRATION VALIDATORS
   (PDF p.3 — input fields: name, email, etc.)
══════════════════════════════════════════════════════════════════ */

function vFname() {
  const el  = document.getElementById('r-fname');
  const err = document.getElementById('r-fname-err');
  const v   = el.value.trim();
  if (!v)             { setError(el, err, 'First name is required.'); return false; }
  if (!RE_NAME.test(v)){ setError(el, err, 'Letters, spaces, hyphens, and apostrophes only.'); return false; }
  setValid(el, err); return true;
}

function vLname() {
  const el  = document.getElementById('r-lname');
  const err = document.getElementById('r-lname-err');
  const v   = el.value.trim();
  if (!v)             { setError(el, err, 'Last name is required.'); return false; }
  if (!RE_NAME.test(v)){ setError(el, err, 'Letters, spaces, hyphens, and apostrophes only.'); return false; }
  setValid(el, err); return true;
}

function vEmail(inputId, errId) {
  const el  = document.getElementById(inputId);
  const err = document.getElementById(errId);
  const v   = el.value.trim();
  if (!v)                  { setError(el, err, 'Email address is required.'); return false; }
  /*
    PDF p.12 — Email Regex Inspector:
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    "catches obvious formatting errors and typos"
    Does NOT over-engineer — would incorrectly reject RFC 5322 valid addresses
  */
  if (!RE_EMAIL.test(v))   { setError(el, err, 'Enter a valid email (e.g. user@domain.com).'); return false; }
  setValid(el, err); return true;
}

function vPhone() {
  const el  = document.getElementById('r-phone');
  const err = document.getElementById('r-phone-err');
  const v   = el.value.trim();
  if (!v)               { setError(el, err, 'Phone number is required.'); return false; }
  if (!RE_PHONE.test(v)){ setError(el, err, 'Digits only, 7–15 characters (no spaces or dashes).'); return false; }
  setValid(el, err); return true;
}

function vTrack() {
  const el  = document.getElementById('r-track');
  const err = document.getElementById('r-track-err');
  if (!el.value) {
    el.setAttribute('aria-invalid','true');
    el.classList.add('invalid');
    err.querySelector('.msg-text').textContent = 'Please select a training track.';
    err.classList.add('show');
    return false;
  }
  el.setAttribute('aria-invalid','false');
  el.classList.remove('invalid');
  el.classList.add('valid');
  err.classList.remove('show');
  return true;
}

function vPassword() {
  const el  = document.getElementById('r-pw');
  const err = document.getElementById('r-pw-err');
  const v   = el.value;
  if (!v) { setError(el, err, 'Password is required.'); return false; }

  /*
    PDF p.11 — Strict Password Policy Regex:
    /^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[#?!@$%^&*-]).{8,}/
    Test each lookahead separately for precise textual feedback (PDF p.13)
    "Relying solely on color is insufficient; precise textual feedback is required"
  */
  if (v.length < 8)            { setError(el, err, 'Password must be at least 8 characters.'); return false; }
  if (!RE_PW_UPPER.test(v))    { setError(el, err, 'Add at least one uppercase letter (A–Z).'); return false; }
  if (!RE_PW_LOWER.test(v))    { setError(el, err, 'Add at least one lowercase letter (a–z).'); return false; }
  if (!RE_PW_DIGIT.test(v))    { setError(el, err, 'Add at least one number (0–9).'); return false; }
  if (!RE_PW_SPECIAL.test(v))  { setError(el, err, 'Add one special character: #?!@$%^&*-'); return false; }
  if (!RE_PW_FULL.test(v))     { setError(el, err, 'Password does not meet all requirements.'); return false; }

  setValid(el, err); return true;
}

function vConfirmPw() {
  const el  = document.getElementById('r-cpw');
  const err = document.getElementById('r-cpw-err');
  const v   = el.value;
  const pw  = document.getElementById('r-pw').value;
  if (!v)     { setError(el, err, 'Please confirm your password.'); return false; }
  /*
    PDF p.7 — Complex Logic (cross-field rule):
    "Infinite. Easily handles cross-field rules like
    'Confirm Password must match Password'."
    This is WHY custom JS validation beats HTML5-only — HTML5 cannot
    cross-reference fields natively.
  */
  if (v !== pw) { setError(el, err, 'Passwords do not match.'); return false; }
  setValid(el, err); return true;
}

function vTerms() {
  const cb  = document.getElementById('r-terms');
  const err = document.getElementById('r-terms-err');
  if (!cb.checked) {
    cb.setAttribute('aria-invalid','true');
    err.textContent = 'You must accept the Terms of Service to continue.';
    err.classList.add('show');
    return false;
  }
  cb.setAttribute('aria-invalid','false');
  err.textContent = '';
  err.classList.remove('show');
  return true;
}


/* ─── REAL-TIME BLUR VALIDATION (PDF p.15 — "blur event or submission") ─ */
document.getElementById('r-fname').addEventListener('blur', vFname);
document.getElementById('r-lname').addEventListener('blur', vLname);
document.getElementById('r-email').addEventListener('blur', () => vEmail('r-email','r-email-err'));
document.getElementById('r-phone').addEventListener('blur', vPhone);
document.getElementById('r-track').addEventListener('change', vTrack);
document.getElementById('r-pw').addEventListener('blur', vPassword);
document.getElementById('r-cpw').addEventListener('blur', vConfirmPw);

/* Real-time fix: clear error as user corrects a field */
['r-fname','r-lname','r-phone'].forEach(id => {
  document.getElementById(id).addEventListener('input', function() {
    if (this.classList.contains('invalid')) {
      this.id === 'r-fname' ? vFname() :
      this.id === 'r-lname' ? vLname() : vPhone();
    }
  });
});
document.getElementById('r-email').addEventListener('input', function() {
  if (this.classList.contains('invalid')) vEmail('r-email','r-email-err');
});
document.getElementById('r-cpw').addEventListener('input', function() {
  if (this.classList.contains('invalid')) vConfirmPw();
});

/* Live password strength on every keystroke */
document.getElementById('r-pw').addEventListener('input', function() {
  updatePwStrength(this.value);
  if (this.classList.contains('invalid')) vPassword();
  if (document.getElementById('r-cpw').value) vConfirmPw();
});


/* ══════════════════════════════════════════════════════════════════
   REGISTRATION SUBMIT HANDLER

   PDF p.8-9 — Phase 2: The Default Threat / Preventing the Memory Wipe
   ─────────────────────────────────────────────────────────────────
   Implementation Checklist (PDF p.9):
   1. Add listener to the submit event ✓
   2. Capture the event object ✓
   3. Call event.preventDefault() to stop the memory wipe ✓
   4. Execute validation logic safely in the browser's memory ✓
══════════════════════════════════════════════════════════════════ */
document.getElementById('reg-form').addEventListener('submit', function(event) {

  /* ── STEP 3: event.preventDefault() (PDF p.9) ── */
  event.preventDefault();

  /* ── STEP 4: Run all validators (PDF p.16 — "Scan: Pass the payload
     through precise mathematical pattern matchers") ── */
  const results = [
    vFname(),
    vLname(),
    vEmail('r-email','r-email-err'),
    vPhone(),
    vTrack(),
    vPassword(),
    vConfirmPw(),
    vTerms()
  ];

  const allValid = results.every(Boolean);

  if (!allValid) {
    /*
      PDF p.13 — The Rejected Payload:
      "Block submission & provide feedback"
      "The goal is not just to block the submission, but to provide
      an actionable, highly visible path to correction."
      "Relying solely on color is insufficient — precise textual feedback."
    */
    announce('Registration failed. Please correct the highlighted errors and try again.');
    /* Focus first invalid field for keyboard users */
    const first = document.querySelector('#reg-form [aria-invalid="true"]:not([type="checkbox"])');
    if (first) first.focus();
    return;
  }

  /*
    PDF p.13 — The Approved Payload:
    "If the data passes all logic gates, it is packaged (e.g., JSON)
    and transmitted."
  */
  const payload = {
    firstName:    document.getElementById('r-fname').value.trim(),
    lastName:     document.getElementById('r-lname').value.trim(),
    email:        document.getElementById('r-email').value.trim(),
    phone:        document.getElementById('r-pcode').value + document.getElementById('r-phone').value.trim(),
    track:        document.getElementById('r-track').value,
    termsAccepted: document.getElementById('r-terms').checked,
    registeredAt: new Date().toISOString(),
    status:       'APPROVED'
  };

  document.getElementById('json-out').innerHTML = syntaxHL(JSON.stringify(payload, null, 2));

  /* Hide form, reveal success panel (PDF p.13 — System Success State) */
  document.getElementById('reg-form').style.display = 'none';
  const sp = document.getElementById('reg-success');
  sp.style.display = 'block';
  sp.setAttribute('aria-hidden', 'false');

  /* PDF p.15 — announce via polite live region */
  announce('Registration successful! Welcome to DecodeLabs, ' + payload.firstName + '.');
  sp.focus();
});


/* ─── REGISTRATION RESET ────────────────────────────────────────── */
document.getElementById('btn-reg-reset').addEventListener('click', function() {
  const form = document.getElementById('reg-form');
  form.reset();

  /* Clear all validation states */
  form.querySelectorAll('input,select').forEach(el => {
    el.classList.remove('valid','invalid');
    el.setAttribute('aria-invalid','false');
  });
  form.querySelectorAll('.err-msg').forEach(el => {
    el.classList.remove('show');
    el.querySelector('.msg-text').textContent = '';
  });
  form.querySelectorAll('.ico-right').forEach(el => {
    el.classList.remove('show','ok','bad');
  });
  document.getElementById('r-terms-err').classList.remove('show');
  document.getElementById('r-terms-err').textContent = '';

  /* Reset password tools */
  updatePwStrength('');
  ['rl-len','rl-up','rl-lo','rl-di','rl-sp'].forEach(id => {
    const r = document.getElementById(id);
    if (r) { r.classList.remove('met','fail'); r.querySelector('svg').innerHTML = PATH_PLUS; }
  });

  /* Reset eye icons */
  document.getElementById('r-pw').type  = 'password';
  document.getElementById('r-cpw').type = 'password';
  document.getElementById('eye1').style.display    = '';
  document.getElementById('eye1off').style.display = 'none';
  document.getElementById('eye2').style.display    = '';
  document.getElementById('eye2off').style.display = 'none';

  /* Show form, hide success */
  document.getElementById('reg-success').style.display = 'none';
  document.getElementById('reg-success').setAttribute('aria-hidden','true');
  form.style.display = '';

  announce('Form reset. Ready for a new registration.');
  document.getElementById('r-fname').focus();
});


/* ══════════════════════════════════════════════════════════════════
   SIGN-IN VALIDATORS
   Same IPO architecture applied to sign-in form (PDF p.5)
══════════════════════════════════════════════════════════════════ */

function vSiEmail() {
  return vEmail('si-email','si-email-err');
}

function vSiPassword() {
  const el  = document.getElementById('si-pw');
  const err = document.getElementById('si-pw-err');
  const v   = el.value;
  if (!v) { setError(el, err, 'Password is required.'); return false; }
  if (v.length < 8) { setError(el, err, 'Password must be at least 8 characters.'); return false; }
  setValid(el, err); return true;
}

document.getElementById('si-email').addEventListener('blur', vSiEmail);
document.getElementById('si-pw').addEventListener('blur', vSiPassword);
document.getElementById('si-email').addEventListener('input', function() {
  if (this.classList.contains('invalid')) vSiEmail();
});
document.getElementById('si-pw').addEventListener('input', function() {
  if (this.classList.contains('invalid')) vSiPassword();
});


/* ══════════════════════════════════════════════════════════════════
   SIGN-IN SUBMIT HANDLER (same IPO pipeline — PDF p.5)
══════════════════════════════════════════════════════════════════ */
let siAttempts = 0;

document.getElementById('signin-form').addEventListener('submit', function(event) {
  /*
    Phase 2 — PDF p.8-9: event.preventDefault() fires first,
    stopping the browser's default HTTP request and page reload.
  */
  event.preventDefault();

  /* Hide any previous alert */
  document.getElementById('signin-alert').classList.remove('show');

  const emailOk = vSiEmail();
  const pwOk    = vSiPassword();

  if (!emailOk || !pwOk) {
    siAttempts++;
    announce('Sign in failed. Please check your email and password.');

    /* After 2 failed attempts, show an additional error banner */
    if (siAttempts >= 2) {
      const alertEl = document.getElementById('signin-alert');
      document.getElementById('signin-alert-text').textContent =
        'Having trouble? Make sure Caps Lock is off and your credentials are correct.';
      alertEl.classList.add('show');
    }

    const first = document.querySelector('#signin-form [aria-invalid="true"]');
    if (first) first.focus();
    return;
  }

  /* ─ Approved Payload (PDF p.13) ─ */
  siAttempts = 0;
  const payload = {
    email:       document.getElementById('si-email').value.trim(),
    rememberMe:  document.getElementById('si-remember').checked,
    signedInAt:  new Date().toISOString(),
    sessionToken:'dl_' + Math.random().toString(36).slice(2,18).toUpperCase(),
    status:      'APPROVED'
  };

  document.getElementById('signin-json-out').innerHTML = syntaxHL(JSON.stringify(payload, null, 2));

  document.getElementById('signin-form').style.display   = 'none';
  document.getElementById('signin-alert').classList.remove('show');
  const sp = document.getElementById('signin-success');
  sp.style.display = 'block';
  sp.setAttribute('aria-hidden','false');

  announce('Sign in successful! Welcome back.');
  sp.focus();
});


/* ─── SIGN-IN RESET ─────────────────────────────────────────────── */
document.getElementById('btn-signin-reset').addEventListener('click', function() {
  const form = document.getElementById('signin-form');
  form.reset();
  siAttempts = 0;

  form.querySelectorAll('input').forEach(el => {
    el.classList.remove('valid','invalid');
    el.setAttribute('aria-invalid','false');
  });
  form.querySelectorAll('.err-msg').forEach(el => {
    el.classList.remove('show');
    el.querySelector('.msg-text').textContent = '';
  });
  form.querySelectorAll('.ico-right').forEach(el => el.classList.remove('show','ok','bad'));
  document.getElementById('signin-alert').classList.remove('show');

  document.getElementById('si-pw').type = 'password';
  document.getElementById('eye3').style.display    = '';
  document.getElementById('eye3off').style.display = 'none';

  document.getElementById('signin-success').style.display = 'none';
  document.getElementById('signin-success').setAttribute('aria-hidden','true');
  form.style.display = '';

  announce('Signed out.');
  document.getElementById('si-email').focus();
});


/* ─── FORGOT PASSWORD (UI hint only — no backend) ─────────────────── */
document.getElementById('btn-forgot').addEventListener('click', function() {
  const emailVal = document.getElementById('si-email').value.trim();
  if (!emailVal || !RE_EMAIL.test(emailVal)) {
    vSiEmail();
    announce('Enter your email address first, then click Forgot password.');
    document.getElementById('si-email').focus();
    return;
  }
  announce('Password reset instructions would be sent to ' + emailVal + '. (Demo only — no backend.)');
  alert('Demo: Password reset link would be sent to:\n' + emailVal);
});


/* ─── JSON SYNTAX HIGHLIGHTER ────────────────────────────────────── */
function syntaxHL(json) {
  return json
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
      m => {
        let c = 'jn';
        if (/^"/.test(m))     c = /:$/.test(m) ? 'jk' : 'js';
        else if (/true|false/.test(m)) c = 'jb';
        return '<span class="' + c + '">' + m + '</span>';
      }
    );
}