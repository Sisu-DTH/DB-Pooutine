/**
 * SDTH Smart Promotions: DEMONSTRATION ONLY.
 * No restaurant-approved prices or offers. Existing menu and ordering are untouched.
 * Uses Ottawa's America/Toronto timezone (including daylight-saving transitions).
 * The preview-day selector is for QA; in production it should be removed.
 */
(() => {
  'use strict';
  const container = document.getElementById('sdth-promo');
  if (!container) return;
  const find = name => container.querySelector('[data-promo="' + name + '"]');
  const DEMO = Object.freeze({
    1: { meal: 'classic', image: 'small-pou.webp', originalCents: 1499, percentage: 10 },
    3: { meal: 'chicken', image: 'chicken-pou.webp', originalCents: 1699, fixedCents: 300 },
    5: { meal: 'hotdog', image: 'hdcom.webp', originalCents: 1899, percentage: 15 }
  });
  const names = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const translations = {
    'en-CA': {
      eyebrow:'SDTH Smart Promotions · Internal preview', heading:'Today’s Special — Demonstration',
      warning:'DEMO ONLY: All prices and offers shown are fictional. No discount is valid for orders.',
      intro:'See how an approved meal promotion could appear here. Your existing menu prices are unchanged.',
      label:'Preview an Ottawa day:', auto:'Automatic (today in Ottawa)', dayNames:names,
      noOffer:'No example special scheduled for this day.', link:'View the existing menu',
      saved:'Example saving', sample:'Fictional meal offer', note:'Prototype only. Actual offers require restaurant approval and must be coordinated with ordering platforms.',
      meal:{ classic:'Classic Poutine',chicken:'Chicken Poutine',hotdog:'Hot Dog Combo' },
      clock:'Ottawa day'
    },
    'fr-CA': {
      eyebrow:'SDTH Smart Promotions · Démonstration interne',heading:'Offre du jour — Démonstration',
      warning:'DÉMO UNIQUEMENT : Tous les prix et rabais sont fictifs. Aucune offre n’est valide pour les commandes.',
      intro:'Voici comment une promotion approuvée pourrait apparaître ici. Les prix du menu actuel ne changent pas.',
      label:'Prévisualiser un jour à Ottawa :',auto:'Automatique (aujourd’hui à Ottawa)',
      dayNames:['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'],
      noOffer:'Aucune offre fictive prévue ce jour-là.',link:'Voir le menu actuel',
      saved:'Économie fictive',sample:'Offre fictive',note:'Prototype seulement. Les offres réelles exigent l’approbation du restaurant et une coordination avec les plateformes de commande.',
      meal:{classic:'Poutine classique',chicken:'Poutine au poulet',hotdog:'Combo hot-dog'},clock:'Jour à Ottawa'
    },
    es: {
      eyebrow:'SDTH Smart Promotions · Demostración interna',heading:'Especial del día — Demostración',
      warning:'SOLO DEMOSTRACIÓN: Los precios y descuentos son ficticios. Ninguna oferta es válida para pedidos.',
      intro:'Así podría aparecer una promoción aprobada. Los precios del menú actual no cambian.',
      label:'Previsualizar un día de Ottawa:',auto:'Automático (hoy en Ottawa)',
      dayNames:['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'],
      noOffer:'No hay ninguna oferta ficticia programada para este día.',link:'Ver menú actual',
      saved:'Ahorro ficticio',sample:'Oferta ficticia',note:'Solo prototipo. Las ofertas reales requieren aprobación del restaurante y coordinación con las plataformas de pedidos.',
      meal:{classic:'Poutine clásica',chicken:'Poutine de pollo',hotdog:'Combo de perrito caliente'},clock:'Día en Ottawa'
    }
  };
  translations['en-GB'] = translations['en-CA'];
  const picker = find('day');
  const locale = document.querySelector('[data-language-picker]');
  function ottawaDay() {
    const dayName = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Toronto', weekday: 'long' }).format(new Date());
    return names.indexOf(dayName);
  }
  function money(cents, code) {
    return new Intl.NumberFormat(code, { style:'currency', currency:'CAD' }).format(cents / 100);
  }
  function calculate(offer) {
    const saving = offer.fixedCents !== undefined
      ? offer.fixedCents
      : Math.round(offer.originalCents * offer.percentage / 100);
    return { saving: Math.min(offer.originalCents, saving),
      discounted: Math.max(0, offer.originalCents - saving) };
  }
  function render() {
    const lang = locale && translations[locale.value] ? locale.value : 'en-CA';
    const text = translations[lang];
    const today = ottawaDay();
    const day = picker.value === 'auto' ? today : Number(picker.value);
    const offer = DEMO[day];
    const translationsByNode = {
      eyebrow:text.eyebrow, heading:text.heading, warning:text.warning, intro:text.intro,
      label:text.label, link:text.link, emptyLink:text.link, noOffer:text.noOffer,
      note:text.note
    };
    Object.entries(translationsByNode).forEach(([name, value]) => { find(name).textContent = value; });
    [...picker.options].forEach((option, index) => {
      option.textContent = index === 0 ? text.auto : text.dayNames[index - 1];
    });
    find('clock').textContent = text.clock + ': ' + text.dayNames[today];
    find('offer').hidden = !offer;
    find('empty').hidden = Boolean(offer);
    if (!offer) return;
    const price = calculate(offer);
    find('meal').textContent = text.meal[offer.meal];
    find('sample').textContent = text.sample;
    find('image').src = offer.image;
    find('image').alt = text.meal[offer.meal];
    find('original').textContent = money(offer.originalCents, lang);
    find('discounted').textContent = money(price.discounted, lang);
    find('saving').textContent = text.saved + ': ' + money(price.saving, lang);
  }
  picker.addEventListener('change', render);
  if (locale) locale.addEventListener('change', render);
  // Update the automatic day if a visitor leaves the page open across Ottawa midnight.
  window.setInterval(() => { if (picker.value === 'auto' && !document.hidden) render(); }, 60000);
  render();
})();
