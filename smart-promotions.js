/**
 * SDTH Smart Promotions — optional, advertisement-only offers.
 * Fail closed: no approved valid offer = no homepage promotion.
 * Restaurant approval and coordination with external ordering channels are mandatory.
 * The schedule lives in smart-promotions.json (currently empty).
 */
(() => {
  'use strict';
  const section = document.getElementById('sdth-promo');
  if (!section) return;
  section.hidden = true;

  const el = key => section.querySelector('[data-promo="' + key + '"]');
  const picker = document.querySelector('[data-language-picker]');
  const allowedImages = new Set([
    'small-pou.webp', 'chicken-pou.webp', 'hdcom.webp', 'Vpoutinc.webp',
    '8w.webp', 'poutinewithhd.webp', 'beefp.webp', 'chickp.webp',
    'turkeyp.webp', 'tusand.webp', 'dbsalad.webp'
  ]);
  const copy = {
    'en-CA': { eyebrow:'D&B Poutine Special Offer', heading:"Today's Special",
      save:'Save', valid:'Offer valid through', link:'View Menu' },
    'en-GB': { eyebrow:'D&B Poutine Special Offer', heading:"Today's Special",
      save:'Save', valid:'Offer valid through', link:'View Menu' },
    'fr-CA': { eyebrow:'Offre spéciale D&B Poutine', heading:'Offre du jour',
      save:'Économisez', valid:"Offre valable jusqu'au", link:'Voir le menu' },
    es: { eyebrow:'Oferta especial de D&B Poutine', heading:'Oferta del día',
      save:'Ahorra', valid:'Oferta válida hasta el', link:'Ver menú' }
  };
  let activeOffer = null;
  let activeZone = 'America/Toronto';

  function ottawaParts(timeZone) {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone, year:'numeric', month:'2-digit', day:'2-digit', weekday:'long'
    });
    const parts = Object.fromEntries(formatter.formatToParts(new Date())
      .filter(p => p.type !== 'literal').map(p => [p.type, p.value]));
    const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return { date:parts.year+'-'+parts.month+'-'+parts.day,
      weekday:weekdays.indexOf(parts.weekday) };
  }

  function isValidOffer(offer, today) {
    if (!offer || offer.approved !== true || offer.enabled !== true) return false;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(offer.startDate || '') ||
        !/^\d{4}-\d{2}-\d{2}$/.test(offer.endDate || '') ||
        offer.startDate > offer.endDate ||
        today.date < offer.startDate || today.date > offer.endDate) return false;
    if (!Array.isArray(offer.weekdays) ||
        !offer.weekdays.includes(today.weekday) ||
        !offer.weekdays.every(day => Number.isInteger(day) && day >= 0 && day <= 6)) return false;
    if (!offer.name || typeof offer.name['en-CA'] !== 'string' ||
        !offer.name['en-CA'].trim() || !allowedImages.has(offer.image)) return false;
    if (!Number.isSafeInteger(offer.originalCents) ||
        !Number.isSafeInteger(offer.discountedCents) ||
        offer.originalCents <= 0 || offer.discountedCents < 0 ||
        offer.discountedCents >= offer.originalCents) return false;
    return true;
  }

  function show() {
    if (!activeOffer) { section.hidden = true; return; }
    const locale = picker && copy[picker.value] ? picker.value : 'en-CA';
    const text = copy[locale];
    const amount = cents => new Intl.NumberFormat(locale, {
      style:'currency', currency:'CAD'
    }).format(cents / 100);
    el('eyebrow').textContent = text.eyebrow;
    el('heading').textContent = text.heading;
    el('meal').textContent = activeOffer.name[locale] || activeOffer.name['en-CA'];
    el('image').src = activeOffer.image;
    el('image').alt = activeOffer.name[locale] || activeOffer.name['en-CA'];
    el('original').textContent = amount(activeOffer.originalCents);
    el('discounted').textContent = amount(activeOffer.discountedCents);
    el('saving').textContent = text.save + ' ' +
      amount(activeOffer.originalCents - activeOffer.discountedCents);
    el('validity').textContent = text.valid + ' ' + activeOffer.endDate;
    el('link').textContent = text.link;
    section.hidden = false;
  }

  async function refresh() {
    // Hide immediately when the schedule is missing, malformed or unavailable.
    section.hidden = true;
    activeOffer = null;
    try {
      const result = await fetch('smart-promotions.json', { cache:'no-store' });
      if (!result.ok) return;
      const config = await result.json();
      if (!config || config.timeZone !== 'America/Toronto' ||
          !Array.isArray(config.offers)) return;
      const today = ottawaParts(activeZone);
      activeOffer = config.offers.find(offer => isValidOffer(offer, today)) || null;
      show();
    } catch (_error) {
      section.hidden = true;
    }
  }

  if (picker) picker.addEventListener('change', show);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) refresh();
  });
  window.setInterval(() => {
    if (!document.hidden) refresh();
  }, 60000);
  refresh();
})();
