/* ==========================================================================
   Site behaviour — nav, drawer, scroll reveals, contact form, GL mounting.
   Everything here is an enhancement; the pages are fully usable without it.
   ========================================================================== */

import { shouldRenderGL, addPass } from './gl.js';
import { SHAFT, SHEEN, DRIFT } from './shaders.js';

/* ---------- Nav: stick, hide on scroll down, drawer ---------- */

function initNav() {
  const nav = document.querySelector('.nav');
  if (!nav) return;

  const burger = nav.querySelector('.burger');
  const drawer = document.querySelector('.drawer');
  const scrim = document.querySelector('.scrim');
  let last = 0;

  addEventListener('scroll', () => {
    const y = scrollY;
    nav.classList.toggle('is-stuck', y > 8);
    if (!nav.classList.contains('is-open')) {
      nav.classList.toggle('is-hidden', y > 240 && y > last);
    }
    last = y;
  }, { passive: true });

  if (!burger || !drawer || !scrim) return;

  const focusable = () =>
    drawer.querySelectorAll('a[href], button:not([disabled])');

  function setOpen(open) {
    nav.classList.toggle('is-open', open);
    drawer.dataset.open = String(open);
    scrim.dataset.open = String(open);
    burger.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) {
      nav.classList.remove('is-hidden');
      const first = focusable()[0];
      if (first) first.focus();
    } else {
      burger.focus();
    }
  }

  burger.addEventListener('click', () =>
    setOpen(drawer.dataset.open !== 'true'));
  scrim.addEventListener('click', () => setOpen(false));

  drawer.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    const items = [...focusable()];
    if (!items.length) return;
    const first = items[0];
    const last_ = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault(); last_.focus();
    } else if (!e.shiftKey && document.activeElement === last_) {
      e.preventDefault(); first.focus();
    }
  });

  addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer.dataset.open === 'true') setOpen(false);
  });

  // A resize past the desktop breakpoint must not leave the drawer latched open.
  matchMedia('(min-width: 1024px)').addEventListener('change', (e) => {
    if (e.matches && drawer.dataset.open === 'true') setOpen(false);
  });
}

/* ---------- Scroll reveal ---------- */

function initReveals() {
  const items = document.querySelectorAll('.reveal, .reveal-wipe');
  if (!items.length) return;

  if (!('IntersectionObserver' in window)) {
    items.forEach((el) => el.classList.add('is-in'));
    return;
  }

  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      e.target.classList.add('is-in');
      io.unobserve(e.target); // reveals once, never re-triggers on scroll back
    }
  }, { rootMargin: '0px 0px -12% 0px' });

  for (const group of document.querySelectorAll('[data-stagger]')) {
    [...group.children].forEach((child, i) => {
      // Capped at 6 steps — the 7th child lands with the 6th, never queues on.
      child.style.setProperty('--reveal-delay', `${Math.min(i, 5) * 60}ms`);
    });
  }

  items.forEach((el) => io.observe(el));
}

/* ---------- Contact form ---------- */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^[+()\d\s.-]{7,}$/;

function initForm() {
  const form = document.querySelector('form[data-contact]');
  if (!form) return;

  const status = form.querySelector('.form__status');

  const rules = {
    name:    (v) => (v.trim() ? '' : 'Enter your full name.'),
    email:   (v) => (!v.trim() ? 'Enter your email address.'
                    : EMAIL_RE.test(v.trim()) ? '' : 'Enter a valid email address.'),
    phone:   (v) => (!v.trim() || PHONE_RE.test(v.trim()) ? '' : 'Enter a valid phone number.'),
    project: (v) => (v ? '' : 'Select a project type.'),
    message: (v) => (v.trim() ? '' : 'Add a few details about your project.'),
  };

  function check(field) {
    const rule = rules[field.name];
    if (!rule) return true;
    const msg = rule(field.value);
    const box = form.querySelector(`#err-${field.name}`);
    if (box) {
      box.textContent = msg;
      box.dataset.show = msg ? 'true' : 'false';
    }
    field.setAttribute('aria-invalid', msg ? 'true' : 'false');
    return !msg;
  }

  for (const field of form.querySelectorAll('input, select, textarea')) {
    field.addEventListener('blur', () => check(field));
    field.addEventListener('input', () => {
      if (field.getAttribute('aria-invalid') === 'true') check(field);
    });
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const fields = [...form.querySelectorAll('input, select, textarea')];
    const bad = fields.filter((f) => !check(f));

    if (bad.length) {
      status.dataset.tone = 'err';
      status.textContent = 'Check the highlighted fields and try again.';
      bad[0].focus();
      return;
    }

    // There is no backend on a static host, so submission degrades to the
    // user's own mail client with the message pre-composed.
    const val = (n) => (form.elements[n] ? form.elements[n].value.trim() : '');
    const body = [
      `Name: ${val('name')}`,
      `Email: ${val('email')}`,
      `Phone: ${val('phone') || '—'}`,
      `Location: ${val('location') || '—'}`,
      `Project type: ${val('project')}`,
      '',
      val('message'),
    ].join('\n');

    const href =
      'mailto:info@shaiconstruction.ca'
      + `?subject=${encodeURIComponent('Quote request — ' + val('project'))}`
      + `&body=${encodeURIComponent(body)}`;

    status.dataset.tone = 'ok';
    status.textContent = "Message sent. We'll be in touch soon to talk through your project.";
    location.href = href;
  });
}

/* ---------- WebGL mounting — strictly a layer on top of the CSS fallback ---------- */

function initGL() {
  if (!shouldRenderGL()) return;
  const map = { shaft: SHAFT, sheen: SHEEN, drift: DRIFT };
  for (const canvas of document.querySelectorAll('canvas[data-fx]')) {
    const src = map[canvas.dataset.fx];
    if (src) addPass(canvas, src);
  }
}

/* ---------- Boot ---------- */

initNav();
initReveals();
initForm();
initGL();
