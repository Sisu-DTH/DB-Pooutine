/**
 * SDTH Smart Promotions — public, advertisement-only homepage widget.
 * The Railway feed is intentionally DISABLED unless smart-promotions-source.json
 * explicitly enables it. No local fallback, credentials, checkout or payments.
 * Railway returns only offers approved and active in Ottawa local time.
 */
(() => {
  'use strict';
  const section = document.getElementById('sdth-promo');
  if (!section) return;
  section.hidden = true;
  const get = name => section.querySelector('[data-promo="' + name + '"]');
  const picker = document.querySelector('[data-language-picker]');
  const API_ORIGIN = 'https://promotions-manager-api-production.up.railway.app';
  const API_PATH = '/api/promotions';
  const PHOTO_ALLOWLIST = new Set(["14w.webp","1spring.webp","8spicew.webp","8w.webp","Fountedrink.webp","IMG_2221.webp","Veggiep.webp","Vpoutinc.webp","baconhd.webp","beefhd.webp","beefp.webp","bottle.webp","cappuccino.webp","cara.webp","cauliflower.webp","cheescard.webp","chicken-pou.webp","chickp.webp","chicksand.webp","chilli.webp","coffee.webp","dbsalad.webp","espresso.webp","fishandChips.webp","fries.webp","gravey.webp","gtea.webp","hdcom.webp","latte.webp","loadedhd.webp","macchiato.webp","nuggets.webp","onionr.webp","pepsi.webp","poutandhd.webp","poutinewingcombo.webp","poutinewithhd.webp","sanbusa.webp","sauces.webp","small-pou.webp","sparkw.webp","sproll.webp","stillw.webp","sweetp.webp","turkeyp.webp","tusand.webp","veganhd.webp","vsproll.webp"]);
  const wording = {
    'en-CA': { eyebrow:'D&B Poutine Special Offer', heading:"Today's Special",
      save:'You save', through:'Offer ends', terms:'How to redeem', link:'View Menu',
      time:'Ottawa time' },
    'en-GB': { eyebrow:'D&B Poutine Special Offer', heading:"Today's Special",
      save:'You save', through:'Offer ends', terms:'How to redeem', link:'View Menu',
      time:'Ottawa time' },
    'fr-CA': { eyebrow:'Offre spéciale D&B Poutine', heading:'Offre du jour',
      save:'Vous économisez', through:"Fin de l’offre", terms:'Modalités',
      link:'Voir le menu', time:"Heure d’Ottawa" },
    es: { eyebrow:'Oferta especial de D&B Poutine', heading:'Oferta del día',
      save:'Ahorras', through:'La oferta termina', terms:'Cómo canjear',
      link:'Ver menú', time:'Hora de Ottawa' }
  };
  let selected = null;
  let checking = false;

  function ottawaDay() {
    const parts = Object.fromEntries(
      new Intl.DateTimeFormat('en-US', {
        timeZone:'America/Toronto',year:'numeric',month:'2-digit',day:'2-digit',
        weekday:'long'
      }).formatToParts(new Date())
        .filter(part => part.type !== 'literal').map(part => [part.type,part.value])
    );
    const names = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    return { date:parts.year+'-'+parts.month+'-'+parts.day,
      weekday:names.indexOf(parts.weekday) };
  }

  function valid(offer, today) {
    if (!offer || offer.approved !== true || offer.enabled !== true) return false;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(offer.startDate || '') ||
        !/^\d{4}-\d{2}-\d{2}$/.test(offer.endDate || '') ||
        offer.startDate > offer.endDate ||
        today.date < offer.startDate || today.date > offer.endDate) return false;
    if (!Array.isArray(offer.weekdays) || !offer.weekdays.includes(today.weekday) ||
        !offer.weekdays.every(d => Number.isInteger(d) && d >= 0 && d <= 6)) return false;
    if (!offer.name || typeof offer.name['en-CA'] !== 'string' ||
        !offer.name['en-CA'].trim() || !PHOTO_ALLOWLIST.has(offer.image)) return false;
    if (!Number.isSafeInteger(offer.originalCents) ||
        !Number.isSafeInteger(offer.discountedCents) ||
        offer.originalCents <= 0 || offer.discountedCents < 0 ||
        offer.discountedCents >= offer.originalCents) return false;
    // Offers require explicit redemption instructions to avoid promising
    // discounts on unrelated delivery / ordering platforms.
    if (typeof offer.redemption !== 'string' || !offer.redemption.trim()) return false;
    return true;
  }

  function paint() {
    if (!selected) { section.hidden = true; return; }
    const language = picker && wording[picker.value] ? picker.value : 'en-CA';
    const words = wording[language];
    const itemName = selected.name[language] || selected.name['en-CA'];
    const cad = cents => new Intl.NumberFormat(language, {
      style:'currency',currency:'CAD'
    }).format(cents/100);

    get('eyebrow').textContent = words.eyebrow;
    get('heading').textContent = words.heading;
    get('meal').textContent = itemName;
    get('image').src = selected.image;
    get('image').alt = itemName;
    get('original').textContent = cad(selected.originalCents);
    get('discounted').textContent = cad(selected.discountedCents);
    get('saving').textContent = words.save + ': ' +
      cad(selected.originalCents-selected.discountedCents);
    get('validity').textContent = words.through + ': ' +
      selected.endDate + ' (' + words.time + ')';
    get('redemption').textContent = words.terms + ': ' + selected.redemption;
    get('link').textContent = words.link;
    section.hidden = false;
  }

  async function jsonFrom(url, signal) {
    const response = await fetch(url, {
      cache:'no-store',mode:'cors',credentials:'omit',signal
    });
    if (!response.ok) throw new Error('Promotion feed unavailable');
    return response.json();
  }

  async function refresh() {
    if (checking) return;
    checking = true;
    // Fail closed even for formerly displayed offers: pause, expiry or
    // network errors must not leave a stale advertisement visible.
    selected = null;
    section.hidden = true;
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 7000);
    try {
      const source = await jsonFrom('smart-promotions-source.json',controller.signal);
      if (!source || source.enabled !== true ||
          source.apiUrl !== API_ORIGIN+API_PATH) return;
      const response = await jsonFrom(source.apiUrl,controller.signal);
      if (!response || response.timeZone !== 'America/Toronto' ||
          !Array.isArray(response.offers)) return;
      const today = ottawaDay();
      selected = response.offers.find(offer => valid(offer,today)) || null;
      paint();
    } catch (_error) {
      selected = null;
      section.hidden = true;
    } finally {
      window.clearTimeout(timer);
      checking = false;
    }
  }

  if (picker) picker.addEventListener('change',paint);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) refresh();
  });
  window.setInterval(() => {
    if (!document.hidden) refresh();
  },60000);
  refresh();
})();
