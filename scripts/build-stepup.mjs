import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const prices = JSON.parse(readFileSync(resolve(root, 'landing-sl/prices.json'), 'utf8'));
const checkOnly = process.argv.includes('--check');
const preview = 'https://preview.kordex.org';
const canonical = 'https://kordex.org/sl/';
const format = value => String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
const euro = value => `${format(value)} €`;

if (prices.currency !== 'EUR' || prices.vatIncluded !== false ||
    prices.purchase.length !== 3 ||
    prices.purchase[0].min !== 1 || prices.purchase[0].max !== 19 ||
    prices.purchase[1].min !== 20 || prices.purchase[1].max !== 49 ||
    prices.purchase[2].min !== 50 ||
    !prices.purchase.every(tier => Number.isInteger(tier.eur) && tier.eur > 0) ||
    !Number.isInteger(prices.rentalWeeklyEur) || !Number.isInteger(prices.rentalMinimumWeeks) ||
    !Number.isInteger(prices.assessmentEur)) {
  throw new Error('Invalid StepUp NEO price data');
}

const [first, second, third] = prices.purchase;
const fourTotal = first.eur * 4;
const dailyCeiling = Math.floor(fourTotal / (4 * 2 * 230)) + 1;
const exampleCaseCost = 26 * 0.8 * (2681 / 21) * 1.161 + 26 * 8 * 29.7;
const values = {
  'tier-1': euro(first.eur),
  'tier-20': euro(second.eur),
  'tier-50': euro(third.eur),
  'four-total': euro(fourTotal),
  'daily-ceiling': euro(dailyCeiling),
  'rental-week': euro(prices.rentalWeeklyEur),
  'rental-min': euro(prices.rentalWeeklyEur * prices.rentalMinimumWeeks),
  assessment: euro(prices.assessmentEur),
  'calc-unit-four': `4 × ${euro(first.eur)}`,
  'calc-four-rent': euro(4 * prices.rentalWeeklyEur * prices.rentalMinimumWeeks),
  'calc-day-four': `≈ ${String((first.eur / (2 * 220)).toFixed(2)).replace('.', ',')} € na delovni dan na delavca`,
  'calc-cases-four': (fourTotal / exampleCaseCost).toFixed(1).replace('.', ','),
  'calc-price-list': `Nakup: ${euro(first.eur)} na kos (1–19), ${euro(second.eur)} (od 20), ${euro(third.eur)} (od 50). Najem: ${euro(prices.rentalWeeklyEur)} na teden na eksoskelet, najmanj ${prices.rentalMinimumWeeks} tednov.`
};

function replacePriceMarkers(html, file) {
  let count = 0;
  const result = html.replace(/<(dd|strong|span|p|b|li)\b([^>]*\bdata-price="([a-z0-9-]+)"[^>]*)>[^<]*<\/\1>/g,
    (match, tag, attributes, key) => {
      if (!(key in values)) throw new Error(`Unknown price marker ${key} in ${file}`);
      count++;
      return `<${tag}${attributes}>${values[key]}</${tag}>`;
    });
  if (!count) throw new Error(`No price markers found in ${file}`);
  return result;
}

function plain(html) {
  return html.replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ').trim();
}

function visibleFaq(html) {
  const section = html.match(/<div class="faq-list">([\s\S]*?)<\/div>/);
  if (!section) throw new Error('Landing FAQ section not found');
  const entries = [...section[1].matchAll(/<details[^>]*>([\s\S]*?)<\/details>/g)].map(match => {
    const question = match[1].match(/<summary>([\s\S]*?)<\/summary>/);
    const answers = [...match[1].matchAll(/<p(?: [^>]*)?>([\s\S]*?)<\/p>/g)];
    if (!question || !answers.length) throw new Error('FAQ question or answer missing');
    return { '@type': 'Question', name: plain(question[1]), acceptedAnswer: {
      '@type': 'Answer', text: answers.map(answer => plain(answer[1])).join(' ')
    } };
  });
  if (entries.length !== 8) throw new Error(`Expected 8 visible landing FAQ entries, got ${entries.length}`);
  return entries;
}

function structuredData(faq) {
  const organization = {
    '@type': 'Organization', '@id': `${canonical}#organization`,
    name: 'KORDEX d.o.o.', url: 'https://kordex.org/',
    email: 'enquiries@kordex.org',
    logo: `${preview}/sl/media/kordex-logo.webp`,
    identifier: { '@type': 'PropertyValue', propertyID: 'matična številka', value: '7614624000' },
    vatID: 'SI60274409',
    address: { '@type': 'PostalAddress', streetAddress: 'Trg komandanta Staneta 8',
      postalCode: '1000', addressLocality: 'Ljubljana', addressCountry: 'SI' }
  };
  const product = {
    '@type': 'Product', '@id': `${canonical}#stepup-neo`,
    name: 'StepUp NEO',
    description: 'Pasivni eksoskelet za podporo hrbtu pri dvigovanju in delu v predklonu. Tehta 3,6 kg, omogoča ravni pomoči 10, 12 ali 14 kgf in deluje brez baterije.',
    image: `${preview}/sl/media/stepup-neo-og.jpg`,
    brand: { '@type': 'Brand', name: 'FRT Robotics' },
    manufacturer: { '@type': 'Organization', name: 'FRT Robotics Co., Ltd.', address: { '@type': 'PostalAddress', addressCountry: 'KR' } },
    offers: {
      '@type': 'AggregateOffer', priceCurrency: 'EUR',
      lowPrice: Math.min(...prices.purchase.map(tier => tier.eur)),
      highPrice: Math.max(...prices.purchase.map(tier => tier.eur)),
      offerCount: prices.purchase.length,
      priceSpecification: { '@type': 'PriceSpecification', valueAddedTaxIncluded: false },
      seller: { '@id': organization['@id'] },
      offers: prices.purchase.map(tier => ({
        '@type': 'Offer', url: canonical, price: tier.eur, priceCurrency: 'EUR',
        eligibleQuantity: { '@type': 'QuantitativeValue', minValue: tier.min,
          ...(tier.max ? { maxValue: tier.max } : {}), unitCode: 'C62' },
        priceSpecification: { '@type': 'UnitPriceSpecification', price: tier.eur,
          priceCurrency: 'EUR', valueAddedTaxIncluded: false },
        seller: { '@id': organization['@id'] }
      }))
    }
  };
  return { '@context': 'https://schema.org', '@graph': [organization, product, {
    '@type': 'FAQPage', '@id': `${canonical}#faq`, mainEntity: faq
  }] };
}

function updateJsonLd(html) {
  const start = '<!-- stepup:jsonld:start -->';
  const end = '<!-- stepup:jsonld:end -->';
  const a = html.indexOf(start), b = html.indexOf(end);
  if (a < 0 || b < a) throw new Error('JSON-LD markers missing');
  const json = JSON.stringify(structuredData(visibleFaq(html)), null, 2).replace(/</g, '\\u003c');
  return html.slice(0, a + start.length) +
    `\n  <script type="application/ld+json">\n${json}\n  </script>\n  ` + html.slice(b);
}

function update(file, output) {
  const path = resolve(root, file);
  const current = existsSync(path) ? readFileSync(path, 'utf8') : null;
  if (current === output) return;
  if (checkOnly) throw new Error(`${file} is out of date; run npm run build:stepup`);
  writeFileSync(path, output);
  console.log(`Updated ${file}`);
}

function updateCalculatorPriceJson(html) {
  const json = JSON.stringify({
    currency: prices.currency,
    vatIncluded: prices.vatIncluded,
    buy: prices.purchase.map(tier => ({ from: tier.min, price: tier.eur })),
    rentWeek: prices.rentalWeeklyEur,
    rentMinWeeks: prices.rentalMinimumWeeks
  });
  const pattern = /(<script type="application\/json" id="kordex-prices">)[\s\S]*?(<\/script>)/;
  if (!pattern.test(html)) throw new Error('Calculator price JSON missing');
  return html.replace(pattern, `$1\n    ${json}\n  $2`);
}

for (const file of ['landing-sl/index.html', 'landing-sl/izracun/index.html', 'sl/vprasanja/index.html', 'sl/viri/index.html']) {
  const current = readFileSync(resolve(root, file), 'utf8');
  let next = replacePriceMarkers(current, file);
  if (file === 'landing-sl/index.html') next = updateJsonLd(next);
  if (file === 'landing-sl/izracun/index.html') next = updateCalculatorPriceJson(next);
  update(file, next);
}

const llms = `# KORDEX — StepUp NEO\n\n> KORDEX d.o.o. v Sloveniji predstavlja, prodaja in oddaja v najem pasivni eksoskelet StepUp NEO proizvajalca FRT Robotics Co., Ltd.\n\nStepUp NEO podpira hrbet pri dvigovanju in delu v predklonu. Tehta 3,6 kg, deluje brez baterije in ima ravni pomoči 10, 12 ali 14 kgf. Ni medicinski pripomoček in ne zdravi. Primernost in učinek ocenimo na dejanskem delu pri stranki.\n\n## Cene brez DDV\n\n- Nakup 1–19 kosov: ${euro(first.eur)} na kos.\n- Nakup od 20 kosov: ${euro(second.eur)} na kos.\n- Nakup od 50 kosov: ${euro(third.eur)} na kos.\n- Najem: ${euro(prices.rentalWeeklyEur)} na teden na eksoskelet; najmanj ${prices.rentalMinimumWeeks} tednov (${euro(prices.rentalWeeklyEur * prices.rentalMinimumWeeks)}).\n\n## Strani\n\n- [StepUp NEO](${canonical}stepup-neo/): značilnosti, uporaba in omejitve.\n- [Zakon](${canonical}zakon/): ročno premeščanje bremen in ocena tveganja.\n- [Vprašanja](${canonical}vprasanja/): vprašanja in odgovori.\n- [Viri](${canonical}viri/): viri navedb in številk.\n\n## Kontakt\n\n- E-pošta: enquiries@kordex.org\n- [Brezplačna predstavitev](${canonical}): pokažite nam delo.\n`;
update('llms.txt', llms.replace('## Kontakt', `- [Izračun](${canonical}izracun/): izračun stroška odsotnosti zaradi bolečin v hrbtu in cene StepUp NEO.\n\n## Kontakt`));
