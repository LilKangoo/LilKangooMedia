/* LilKangooMedia pricing presentation/estimate utilities.
   No payment processing here. Server must independently validate all amounts. */
(function (global) {
  'use strict';
  const MODE = Object.freeze({
    fixed: { label: 'Fixed package', suffix: '', singular: 'package' },
    hour: { label: 'Per hour', suffix: '/hour', singular: 'hour' },
    day: { label: 'Per day', suffix: '/day', singular: 'day' },
    person: { label: 'Per person', suffix: '/person', singular: 'person' },
    item: { label: 'Per item', suffix: '/item', singular: 'item' },
    month: { label: 'Monthly subscription', suffix: '/month', singular: 'month' },
    year: { label: 'Annual subscription', suffix: '/year', singular: 'year' },
    quote: { label: 'Custom quotation', suffix: '', singular: 'project' }
  });
  const ADDON_MODE = Object.freeze({
    once: 'One-time', unit: 'Per selected unit', month: 'Per month', year: 'Per year'
  });
  const money = cents => new Intl.NumberFormat('en-IE', {
    style: 'currency', currency: 'EUR', maximumFractionDigits: Math.round(Number(cents)) % 100 ? 2 : 0
  }).format(Number(cents || 0) / 100);
  const mode = pkg => MODE[pkg?.pricing_model] ? pkg.pricing_model : 'fixed';
  const addonMode = addon => ADDON_MODE[addon?.billing_model] ? addon.billing_model : 'once';
  const variable = pkg => ['hour','day','person','item'].includes(mode(pkg));
  const recurring = pkg => ['month','year'].includes(mode(pkg));
  const pluralUnit = (pkg, count) => { const n = MODE[mode(pkg)].singular; return Number(count)===1?n:(n==='person'?'people':n+'s'); };
  const validCents = n => Number.isSafeInteger(Number(n)) && Number(n) >= 0 && Number(n) <= 1e9;
  function safeQty(pkg, value) {
    const minimum = Number(pkg?.min_quantity) > 0 ? Number(pkg.min_quantity) : 1;
    const maximum = Number(pkg?.max_quantity) >= minimum ? Number(pkg.max_quantity) : null;
    const step = Number(pkg?.quantity_step) > 0 ? Number(pkg.quantity_step) : 1;
    let qty = Number(value);
    if (!Number.isFinite(qty)) qty = minimum;
    qty = Math.max(minimum, maximum == null ? qty : Math.min(maximum, qty));
    // Quantize starting from minimum to keep e.g. 1.5h / 0.5h increment sensible.
    const steps = Math.round((qty - minimum) / step);
    return Number(Math.max(minimum, Math.min(maximum == null ? Infinity : maximum, minimum + steps * step)).toFixed(4));
  }
  const priceText = pkg => {
    if (!pkg || mode(pkg) === 'quote' || !validCents(pkg.price_cents)) return 'Custom quote';
    return `${pkg.show_from ? 'From ' : ''}${money(pkg.price_cents)}${MODE[mode(pkg)].suffix}`;
  };
  function servicePrice(service) {
    const packages = Array.isArray(service?.packages) ? service.packages : [];
    const firstPriced = packages.find(p => mode(p) !== 'quote' && validCents(p.price_cents));
    return firstPriced ? priceText(firstPriced) : 'Custom quote';
  }
  function servicePriceLabel(service) {
    const p = (service?.packages || []).find(x => mode(x) !== 'quote' && validCents(x.price_cents));
    if (!p) return 'Individually quoted';
    if (p.show_from || service.packages.length > 1) return 'Packages from';
    return MODE[mode(p)].label;
  }
  function addonText(a, pkg) {
    const am = addonMode(a);
    if (am === 'once') return money(a.price_cents);
    if (am === 'month') return `${money(a.price_cents)}/month`;
    if (am === 'year') return `${money(a.price_cents)}/year`;
    return `${money(a.price_cents)}/${MODE[mode(pkg)].singular}`;
  }
  function estimate(pkg, addons = [], chosenAddonIds = [], quantity) {
    if (!pkg || mode(pkg) === 'quote' || !validCents(pkg.price_cents)) return {
      available: false, oneTime: 0, monthly: 0, yearly: 0, qty: 1, lineItems: []
    };
    const m = mode(pkg), qty = variable(pkg) ? safeQty(pkg, quantity) : 1;
    const result = {available:true, oneTime:0, monthly:0, yearly:0, qty, lineItems:[]};
    const addLine = (label, amount, billing) => {
      if (!validCents(amount)) return;
      amount = Math.round(amount);
      if (billing === 'monthly') result.monthly += amount;
      else if (billing === 'yearly') result.yearly += amount;
      else result.oneTime += amount;
      result.lineItems.push({label, amount, billing});
    };
    const base = Math.round(Number(pkg.price_cents) * qty);
    addLine((pkg.name || 'Package') + (variable(pkg) ? ` × ${qty}` : ''), base, m === 'month' ? 'monthly' : m === 'year' ? 'yearly' : 'once');
    if (validCents(pkg.setup_fee_cents) && Number(pkg.setup_fee_cents) > 0)
      addLine('One-time setup fee', Number(pkg.setup_fee_cents), 'once');
    for (const a of addons) {
      if (!chosenAddonIds.includes(a.id) || !validCents(a.price_cents)) continue;
      const am = addonMode(a);
      if (am === 'month') addLine(a.name, a.price_cents, 'monthly');
      else if (am === 'year') addLine(a.name, a.price_cents, 'yearly');
      else if (am === 'unit') addLine(a.name + (variable(pkg) ? ` × ${qty}` : ''), Math.round(a.price_cents * qty), m === 'month' ? 'monthly' : m === 'year' ? 'yearly' : 'once');
      else addLine(a.name, a.price_cents, 'once');
    }
    return result;
  }
  function directPaymentEligible(pkg, addons = [], ids = []) {
    // Current Checkout Function only knows fixed one-time package amounts and fixed addons.
    return mode(pkg) === 'fixed' && !Number(pkg?.setup_fee_cents || 0) && addons.every(a => !ids.includes(a.id) || addonMode(a) === 'once');
  }
  global.LKMPricing = {MODE, ADDON_MODE, money, mode, addonMode, variable, recurring, safeQty,
    validCents, pluralUnit, priceText, servicePrice, servicePriceLabel, addonText, estimate, directPaymentEligible};
})(window);
