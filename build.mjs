/* ============================================================
   DERRICK FILES STUDIO — static site generator
   Reads content.json → writes dist/ as plain static HTML.
   No dependencies. Run:  node build.mjs
   ============================================================ */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.dirname(new URL(import.meta.url).pathname);
const C = JSON.parse(fs.readFileSync(path.join(ROOT, 'content.json'), 'utf8'));
const S = C.site;
const OUT = path.join(ROOT, 'dist');

const esc = s => String(s ?? '').replace(/&(?!#?\w+;)/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const raw = s => String(s ?? '');
const wa = `https://wa.me/${S.whatsapp}`;
const tel = `tel:${S.phone}`;

/* ---------- navigation ---------- */
/* ---------- social icons ----------
   assets/icons.json is a flat map of "instagram": "<svg path d>" entries
   (official marks from Simple Icons). A missing file or key falls back to
   a plain text label, so the site never breaks waiting on it. */
const ICONS = (() => {
  const p = path.join(ROOT, 'assets', 'icons.json');
  try { return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : {}; }
  catch { return {}; }
})();

const NICE = { x: 'X', tiktok: 'TikTok', youtube: 'YouTube', soundcloud: 'SoundCloud',
  mixcloud: 'Mixcloud', instagram: 'Instagram', facebook: 'Facebook', whatsapp: 'WhatsApp' };
const sname = k => NICE[k] || (k.charAt(0).toUpperCase() + k.slice(1));

function socialList(only) {
  const entries = Object.entries(S.social).filter(([k]) => !only || only.includes(k));
  return '<ul class="soc">' + entries.map(([k, v]) => {
    const inner = ICONS[k]
      ? '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="' + ICONS[k] + '"/></svg>'
      : '<span class="soc-txt">' + esc(sname(k)) + '</span>';
    return '<li><a href="' + esc(v) + '" rel="me noopener" target="_blank"' +
      ' aria-label="' + esc(S.person) + ' on ' + esc(sname(k)) + '">' + inner +
      '<span class="sr">' + esc(sname(k)) + '</span></a></li>';
  }).join('') + '</ul>';
}

const NAV = [
  { t: 'Home', u: '/' },
  { t: 'About', u: '/about/' },
  { t: 'Gear 4 Hire', u: '/gear-4-hire/' },
  { t: 'Maintenance', u: '/maintenance/' },
  { t: 'Mixes', u: '/mixes/' },
  { t: 'Shop', u: '/shop/' },
  { t: 'Gallery', u: '/gallery/' },
  { t: 'YouTube', u: '/youtube/' },
  { t: 'Blog', u: '/blog/' },
];

/* ---------- shared schema graph ---------- */
function schemaGraph() {
  return {
    '@type': ['Organization', 'LocalBusiness', 'EntertainmentBusiness'],
    '@id': `${S.domain}/#organization`,
    name: S.brand,
    alternateName: ['Derrick Files', 'DFS'],
    description: `${S.brand} is a music gear, event solutions and DJ training centre in ${S.city}, ${S.country}, founded by ${S.person}. Services include DJ classes, DJ gear hire and repair, audio production, stage, sound, lighting, LED screens, events management, wedding planning and computer sales and repair.`,
    slogan: S.tagline,
    url: `${S.domain}/`,
    telephone: S.phone,
    email: S.email,
    priceRange: '$$',
    currenciesAccepted: 'UGX',
    founder: { '@id': `${S.domain}/#person` },
    employee: { '@id': `${S.domain}/#person` },
    address: {
      '@type': 'PostalAddress', streetAddress: S.street,
      addressLocality: S.city, addressRegion: 'Central Region', addressCountry: 'UG',
    },
    areaServed: [
      { '@type': 'City', name: S.city },
      { '@type': 'Country', name: S.country },
      { '@type': 'Place', name: 'East Africa' },
    ],
    openingHoursSpecification: [
      { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday'], opens: '08:00', closes: '22:00' },
      { '@type': 'OpeningHoursSpecification', dayOfWeek: 'Friday', opens: '08:00', closes: '23:00' },
      { '@type': 'OpeningHoursSpecification', dayOfWeek: 'Saturday', opens: '10:00', closes: '23:00' },
      { '@type': 'OpeningHoursSpecification', dayOfWeek: 'Sunday', opens: '12:00', closes: '20:00' },
    ],
    aggregateRating: { '@type': 'AggregateRating', ratingValue: S.rating, reviewCount: S.reviews, bestRating: '5' },
    sameAs: Object.values(S.social),
    hasOfferCatalog: {
      '@type': 'OfferCatalog', name: `${S.brand} Services`,
      itemListElement: C.services.map(s => ({
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service', name: strip(s.title), description: strip(s.excerpt),
          url: `${S.domain}/${s.slug}/`,
          provider: { '@id': `${S.domain}/#organization` },
        },
      })),
    },
  };
}
function strip(s) { return String(s).replace(/&amp;/g, '&').replace(/<[^>]+>/g, ''); }

function personNode() {
  return {
    '@type': ['Person', 'MusicGroup'],
    '@id': `${S.domain}/#person`,
    name: S.person,
    alternateName: ['Derrick Files', 'Dj Derrick Files', 'derrickfiles'],
    description: `${S.person} is a Ugandan DJ, personality, artiste, producer, events tech and stage manager based in ${S.city}, and the founder of ${S.brand}.`,
    disambiguatingDescription: `Ugandan DJ and producer based in ${S.city}, ${S.country}. Founder of ${S.brand}.`,
    jobTitle: ['DJ', 'Personality', 'Artiste', 'Producer', 'Events Tech', 'Stage Manager'],
    nationality: { '@type': 'Country', name: S.country },
    url: `${S.domain}/`,
    mainEntityOfPage: `${S.domain}/about/`,
    image: `${S.domain}${C.home.heroImage}`,
    telephone: S.phone,
    email: S.email,
    genre: ['Afrobeats', 'Amapiano', 'Dancehall', 'Ragga', 'Kompa', 'R&B'],
    knowsAbout: ['DJing', 'Audio production', 'Sound engineering', 'Event production',
      'Stage management', 'Lighting design', 'LED screen supply', 'DJ training', 'DJ equipment repair'],
    homeLocation: {
      '@type': 'Place', name: `${S.city}, ${S.country}`,
      address: { '@type': 'PostalAddress', addressLocality: S.city, addressCountry: 'UG' },
    },
    worksFor: { '@id': `${S.domain}/#organization` },
    founder: { '@id': `${S.domain}/#organization` },
    sameAs: Object.values(S.social),
  };
}

/* ---------- layout ---------- */
function layout({ title, desc, url, extraSchema = [], body, image, active }) {
  const ads = C.adsense || {};
  const adsHead = ads.enabled && ads.client
    ? `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${esc(ads.client)}" crossorigin="anonymous"></script>`
    : '';
  const graph = [personNode(), schemaGraph(),
    { '@type': 'WebSite', '@id': `${S.domain}/#website`, url: `${S.domain}/`, name: S.brand, publisher: { '@id': `${S.domain}/#organization` } },
    ...extraSchema];

  const promo = C.promo?.enabled ? `
<div class="promo"><div class="w">
  <span class="k">${esc(C.promo.kind)}</span>
  <span>${raw(C.promo.text)}</span>
  ${C.promo.ctaLink ? `<a href="${esc(C.promo.ctaLink)}">${esc(C.promo.ctaLabel)} &rarr;</a>` : ''}
</div></div>` : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${S.domain}${url}">
<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1">
<meta name="theme-color" content="#000000">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${S.domain}${url}">
<meta property="og:site_name" content="${esc(S.brand)}">
<meta property="og:locale" content="en_UG">
<meta property="og:image" content="${S.domain}${image || C.home.heroImage}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:site" content="@derrickfiles">
<meta name="geo.region" content="UG-102"><meta name="geo.placename" content="${esc(S.city)}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;600;700;800;900&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/site.css">
${adsHead}
<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': graph })}</script>
</head>
<body>
${promo}
<nav class="nav"><div class="w">
  ${S.logo ? `<a class="lgo lgo-img" href="/"><img src="${esc(S.logo)}" alt="${esc(S.brand)}"></a>` : `<a class="lgo" href="/">DERRICK<b>FILES</b><small>STUDIO</small></a>`}
  <ul class="nl" id="nl">
    ${NAV.map(n => `<li><a href="${n.u}"${active === n.u ? ' class="on"' : ''}>${esc(n.t)}</a></li>`).join('\n    ')}
  </ul>
  <button class="burger" id="burger" aria-label="Menu">MENU</button>
  <a class="nb" href="${tel}">Book &middot; ${esc(S.phoneDisplay)}</a>
</div></nav>
${body}
<footer>
  <div class="w">
    <div class="fgrid">
      <div class="fb">
        <strong>DERRICK <b>FILES</b> STUDIO</strong>
        Founded by ${esc(S.person)}<br>
        ${esc(S.street)}<br>${esc(S.city)}, ${esc(S.country)}<br><br>
        ${esc(S.tagline)}.<br>
        <a href="${tel}">${esc(S.phoneDisplay)}</a> &middot; <a href="mailto:${esc(S.email)}">${esc(S.email)}</a>
      </div>
      <div>
        <h4>Services</h4>
        <ul>${C.services.slice(0, 6).map(s => `<li><a href="/${s.slug}/">${raw(s.short || s.title)}</a></li>`).join('')}</ul>
      </div>
      <div>
        <h4>Explore</h4>
        <ul>${NAV.map(n => `<li><a href="${n.u}">${esc(n.t)}</a></li>`).join('')}</ul>
      </div>
    </div>
    <div class="fsoc">
      <div class="fsoc-t">Follow the studio</div>
      ${socialList()}
    </div>
    <div class="fbot">
      <span>&copy; ${new Date().getFullYear()} ${esc(S.brand)}. All rights reserved.</span>
      <span class="fbot-l">
        <a href="/about/">About</a>
        <a href="/blog/">Blog</a>
        <a href="${tel}">Bookings</a>
      </span>
    </div>
  </div>
</footer>
<script>
document.getElementById('burger')?.addEventListener('click',function(){
  document.getElementById('nl').classList.toggle('open');
});
</script>
</body>
</html>`;
}

/* ---------- shared blocks ---------- */
const credStrip = () => `
<div class="cred"><div class="w">
  <span><b class="st">${esc(S.rating)}&#9733;</b> &nbsp;${esc(S.reviews)} Google reviews</span>
  <span class="sep"></span><span>Operating since <b>${esc(S.founded)}</b></span>
  <span class="sep"></span><span><b>60+</b> published mixes</span>
  <span class="sep"></span><span><b>${C.services.length}</b> services in-house</span>
  <span class="sep"></span><span>${esc(S.street)}, ${esc(S.city)}</span>
</div></div>`;

const adSlot = (slot) => {
  const a = C.adsense || {};
  if (!a.enabled || !a.client || !slot) return '';
  return `<div class="adslot"><ins class="adsbygoogle" style="display:block" data-ad-client="${esc(a.client)}" data-ad-slot="${esc(slot)}" data-ad-format="auto" data-full-width-responsive="true"></ins><script>(adsbygoogle=window.adsbygoogle||[]).push({});</script></div>`;
};

const visitSection = () => `
<section id="visit"><div class="w">
  <p class="eyeb"><i></i> Visit &amp; book</p>
  <h2>${esc(S.street.split('(')[0].trim())}</h2>
  <p class="sub">Next to Acacia Mall, ${esc(S.city)}, ${esc(S.country)}. Walk in for gear and classes, or call ahead for bookings and hire.</p>
  <div class="info">
    <div class="box">
      <h3>Contact</h3>
      <a class="tel" href="${tel}">+256 789 191 660</a>
      <div class="row"><span>Email</span><b><a href="mailto:${esc(S.email)}">${esc(S.email)}</a></b></div>
      <div class="row"><span>WhatsApp</span><b><a href="${wa}" rel="noopener" target="_blank">wa.me/${esc(S.whatsapp)}</a></b></div>
      <div class="row"><span>Address</span><b>${esc(S.street)},<br>${esc(S.city)}</b></div>
      <div class="row"><span>Serving</span><b>${esc(S.city)} &middot; ${esc(S.country)} &middot; East Africa</b></div>
    </div>
    <div class="box">
      <h3>Opening hours</h3>
      ${S.hours.map(h => `<div class="row"><span>${esc(h.days)}</span><b>${esc(h.time)}</b></div>`).join('')}
      <div class="row"><span>Rating</span><b>${esc(S.rating)} &#9733; &middot; ${esc(S.reviews)} Google reviews</b></div>
    </div>
  </div>
  <ul class="soc">${Object.entries(S.social).map(([k, v]) => `<li><a href="${esc(v)}" rel="me noopener" target="_blank">${k}</a></li>`).join('')}</ul>
</div></section>`;

/* ---------- pages ---------- */
function pageHome() {
  const h = C.home;
  const body = `
<header class="hero"><div class="w">
  <div>
    <p class="kick"><i></i> ${esc(h.heroKicker)}</p>
    <h1>${raw(h.heroTitle)}<em>${raw(h.heroTitleAccent)}</em></h1>
    <ul class="roles">${S.roles.split('/').map(r => `<li>${esc(r.trim())}</li>`).join('')}</ul>
    <p class="lede">${raw(h.heroText)}</p>
    <div class="btns">
      <a class="bt bp" href="/dj-bookings/">Book the DJ</a>
      <a class="bt bs" href="#lanes">Hire the Studio</a>
    </div>
  </div>
  <div class="pf"><img src="${esc(h.heroImage)}" alt="${esc(S.person)}, Ugandan DJ and producer, founder of ${esc(S.brand)}" width="1200" height="1500"></div>
</div></header>
${credStrip()}
<main>
<section id="lanes"><div class="w">
  <p class="eyeb"><i></i> One founder, two things to book</p>
  <h2>${raw(h.introTitle)}</h2>
  <p class="sub">${raw(h.introText)}</p>
  <div class="fork">
    <article class="lane">
      <div class="lpic"><img src="${esc(h.laneDjImage)}" alt="${esc(S.person)}" loading="lazy"><span class="badge">The artist</span></div>
      <div class="lbody">
        <h3>${esc(S.person)}</h3>
        <p class="who">DJ &middot; Personality &middot; Artiste &middot; Producer</p>
        <p>The name behind the decks. Open-format sets across Afrobeats, Amapiano, Dancehall, Ragga, Kompa and R&amp;B, with a catalogue of more than sixty mixes published since ${esc(S.founded)}.</p>
        <ul><li>Club nights &amp; residencies</li><li>Weddings, corporate &amp; private events</li><li>Brand activations &amp; festival sets</li><li>Mixtapes, mashups &amp; guest mixes</li></ul>
        <a class="go" href="/dj-bookings/">Book the DJ &rarr;</a>
      </div>
    </article>
    <article class="lane co">
      <div class="lpic"><img src="${esc(h.laneCoImage)}" alt="${esc(S.brand)}" loading="lazy"><span class="badge">The company</span></div>
      <div class="lbody">
        <h3>${esc(S.brand)}</h3>
        <p class="who">Gear &middot; Training &middot; Event Solutions</p>
        <p>The business he founded and runs. A music gear, event solutions and DJ training centre where people learn to DJ, get their gear fixed, hire equipment, or book full sound and lighting for an event.</p>
        <ul><li>DJ Academy &mdash; beginner to advanced</li><li>Gear hire, sales &amp; repair</li><li>Recording &amp; production studio</li><li>Stage, sound, lighting &amp; LED screens</li></ul>
        <a class="go" href="#services">All services &rarr;</a>
      </div>
    </article>
  </div>
</div></section>

<section id="services"><div class="w">
  <p class="eyeb"><i></i> ${esc(S.brand)}</p>
  <h2>Everything, one roof</h2>
  <p class="sub">${C.services.length} services from one address — so a promoter books the set, the PA, the stage and the LED wall in a single conversation instead of chasing four vendors.</p>
  <div class="grid">
    ${C.services.map(s => `
    <a class="card" href="/${s.slug}/">
      <div class="cpic"><img src="${esc(s.image)}" alt="${strip(s.title)}" loading="lazy"></div>
      <div class="cbody"><h3>${raw(s.title)}</h3><p>${raw(s.excerpt)}</p><span class="go">View &rarr;</span></div>
    </a>`).join('')}
  </div>
</div></section>
${adSlot(C.adsense?.slotInArticle)}
<div class="band">
  <img src="${esc(h.bandImage)}" alt="${esc(S.person)} performing live" loading="lazy">
  <div class="w"><blockquote>${raw(h.bandQuote)}</blockquote>
  <cite>${esc(S.brand)} &middot; ${esc(S.street)}, ${esc(S.city)}</cite></div>
</div>

<section><div class="w">
  <p class="eyeb"><i></i> Latest from the studio</p>
  <h2>Blog</h2>
  <p class="sub">Gear guides, event know-how and notes from the room.</p>
  <div class="grid">
    ${C.blog.slice(0, 3).map(p => `
    <a class="card" href="/blog/${p.slug}/">
      <div class="cpic"><img src="${esc(p.cover)}" alt="${esc(p.title)}" loading="lazy"></div>
      <div class="cbody"><p class="meta">${esc(fmtDate(p.date))}</p><h3>${esc(p.title)}</h3><p>${esc(p.excerpt)}</p><span class="go">Read &rarr;</span></div>
    </a>`).join('')}
  </div>
</div></section>
${visitSection()}
</main>`;
  return layout({
    title: `${S.person} — DJ, Producer & Events Tech | ${S.brand}, ${S.city}`,
    desc: `${S.person} is a Ugandan DJ, personality, artiste, producer, events tech and stage manager based in ${S.city}, and the founder of ${S.brand} — DJ classes, gear hire and repair, production, stage, sound, lighting and LED screens. ${S.street}. Bookings ${S.phoneDisplay}.`,
    url: '/', active: '/', body, image: C.home.heroImage,
    extraSchema: [{
      '@type': 'FAQPage', '@id': `${S.domain}/#faq`,
      mainEntity: [
        { '@type': 'Question', name: `Who is ${S.person}?`, acceptedAnswer: { '@type': 'Answer', text: `${S.person} is a Ugandan DJ, personality, artiste, producer, events tech and stage manager based in ${S.city}. He is the founder of ${S.brand} at ${S.street}.` } },
        { '@type': 'Question', name: `What is ${S.brand}?`, acceptedAnswer: { '@type': 'Answer', text: `${S.brand} is the company founded by ${S.person} — a music gear, event solutions and DJ training centre in ${S.city} offering DJ classes, gear hire and repair, recording and production, sound, stage, lighting, LED screens, events management and computer sales and repair.` } },
        { '@type': 'Question', name: `How do I book ${S.person}?`, acceptedAnswer: { '@type': 'Answer', text: `Call or WhatsApp ${S.phoneDisplay}, or email ${S.email}. The studio is at ${S.street}, ${S.city}, ${S.country}.` } },
        { '@type': 'Question', name: `Where is ${S.brand} located?`, acceptedAnswer: { '@type': 'Answer', text: `${S.street}, ${S.city}, ${S.country}. Open Monday to Thursday 8am-10pm, Friday 8am-11pm, Saturday 10am-11pm and Sunday 12pm-8pm.` } },
      ],
    }],
  });
}

function pageAbout() {
  const a = C.about;
  const body = `
<header class="phead"><div class="w">
  <p class="crumb"><a href="/">Home</a> / About</p>
  <h1>About</h1>
  <ul class="roles">${S.roles.split('/').map(r => `<li>${esc(r.trim())}</li>`).join('')}</ul>
  <p class="lede">${raw(a.lead)}</p>
</div></header>
${credStrip()}
<main>
<section><div class="w">
  <p class="eyeb"><i></i> The operation</p>
  <h2>A DJ who built the studio</h2>
  <div class="prose">${a.body.map(p => `<p>${raw(p)}</p>`).join('')}</div>
  <div class="feats">
    ${C.services.slice(0, 4).map(s => `<div class="feat"><h3>${raw(s.title)}</h3><p>${raw(s.excerpt)}</p></div>`).join('')}
  </div>
</div></section>
<div class="band">
  <img src="${esc(C.home.bandImage)}" alt="${esc(S.person)} performing live" loading="lazy">
  <div class="w"><blockquote>${raw(C.home.bandQuote)}</blockquote>
  <cite>${esc(S.brand)} &middot; ${esc(S.street)}</cite></div>
</div>
${visitSection()}
</main>`;
  return layout({
    title: `About ${S.person} & ${S.brand} | ${S.city}`,
    desc: raw(a.lead), url: '/about/', active: '/about/', body, image: a.image,
    extraSchema: [{ '@type': 'AboutPage', '@id': `${S.domain}/about/`, url: `${S.domain}/about/`, name: `About ${S.person}`, about: [{ '@id': `${S.domain}/#person` }, { '@id': `${S.domain}/#organization` }] }],
  });
}

function pageService(s) {
  const body = `
<header class="phead"><div class="w">
  <p class="crumb"><a href="/">Home</a> / ${raw(s.title)}</p>
  <h1>${raw(s.title)}</h1>
  <p class="lede">${raw(s.intro)}</p>
  <div class="btns" style="margin-top:28px">
    <a class="bt bp" href="${tel}">Call ${esc(S.phoneDisplay)}</a>
    <a class="bt bs" href="${wa}" rel="noopener" target="_blank">WhatsApp</a>
  </div>
</div></header>
${credStrip()}
<main>
<section><div class="w">
  <p class="eyeb"><i></i> ${raw(s.tagline)}</p>
  <h2>What you get</h2>
  <div class="feats">${s.features.map(f => `<div class="feat"><h3>${raw(f.t)}</h3><p>${raw(f.d)}</p></div>`).join('')}</div>
  ${s.faq?.length ? `<div class="faq">${s.faq.map(f => `<details><summary>${raw(f.q)}</summary><p>${raw(f.a)}</p></details>`).join('')}</div>` : ''}
</div></section>
${adSlot(C.adsense?.slotInArticle)}
<section><div class="w">
  <p class="eyeb"><i></i> More from the studio</p>
  <h2>Other services</h2>
  <div class="grid g4">
    ${C.services.filter(x => x.slug !== s.slug).slice(0, 4).map(x => `
    <a class="card" href="/${x.slug}/">
      <div class="cpic"><img src="${esc(x.image)}" alt="${strip(x.title)}" loading="lazy"></div>
      <div class="cbody"><h3>${raw(x.title)}</h3><p>${raw(x.excerpt)}</p><span class="go">View &rarr;</span></div>
    </a>`).join('')}
  </div>
</div></section>
${visitSection()}
</main>`;
  return layout({
    title: `${strip(s.title)} in ${S.city} | ${S.brand}`,
    desc: `${strip(s.excerpt)} ${S.brand}, ${S.street}, ${S.city}. Call ${S.phoneDisplay}.`,
    url: `/${s.slug}/`, body, image: s.image,
    extraSchema: [
      {
        '@type': 'Service', '@id': `${S.domain}/${s.slug}/#service`,
        name: strip(s.title), description: strip(s.intro),
        provider: { '@id': `${S.domain}/#organization` },
        areaServed: [{ '@type': 'City', name: S.city }, { '@type': 'Country', name: S.country }],
        url: `${S.domain}/${s.slug}/`,
      },
      ...(s.faq?.length ? [{
        '@type': 'FAQPage', '@id': `${S.domain}/${s.slug}/#faq`,
        mainEntity: s.faq.map(f => ({ '@type': 'Question', name: strip(f.q), acceptedAnswer: { '@type': 'Answer', text: strip(f.a) } })),
      }] : []),
    ],
  });
}

function simplePage({ slug, title, h1, intro, inner, desc, nav }) {
  const body = `
<header class="phead"><div class="w">
  <p class="crumb"><a href="/">Home</a> / ${esc(h1)}</p>
  <h1>${esc(h1)}</h1>
  <p class="lede">${raw(intro)}</p>
</div></header>
${credStrip()}
<main>${inner}${visitSection()}</main>`;
  return layout({ title, desc, url: slug, active: nav || slug, body });
}

function pageMixes() {
  const m = C.mixes;
  const inner = `
<section><div class="w">
  <p class="eyeb"><i></i> The sound</p>
  <h2>Sixty-plus mixes</h2>
  <ul class="tags">${m.genres.map(g => `<li>${raw(g)}</li>`).join('')}</ul>
  <div class="grid">
    ${m.items.map(i => `
    <a class="card" href="${esc(i.link)}" rel="noopener" target="_blank">
      <div class="cbody"><p class="meta">Series</p><h3>${raw(i.title)}</h3><p>${raw(i.desc)}</p><span class="go">Listen &rarr;</span></div>
    </a>`).join('')}
  </div>
  <ul class="soc">
    <li><a href="${esc(S.social.mixcloud)}" rel="noopener" target="_blank">All mixes on Mixcloud</a></li>
    <li><a href="${esc(S.social.soundcloud)}" rel="noopener" target="_blank">SoundCloud</a></li>
  </ul>
</div></section>`;
  return simplePage({ slug: '/mixes/', title: `Mixes — ${S.person} | Afrobeats, Amapiano, Dancehall`, h1: 'Mixes', intro: m.intro, inner, desc: strip(m.intro) });
}

function pageShop() {
  const sh = C.shop;
  const inner = `
<section><div class="w">
  <p class="eyeb"><i></i> Shop</p>
  <h2>Gear &amp; merch</h2>
  <div class="grid">
    ${sh.items.map(i => `
    <a class="card" href="${wa}" rel="noopener" target="_blank">
      <div class="cpic"><img src="${esc(i.image)}" alt="${strip(i.title)}" loading="lazy"></div>
      <div class="cbody"><p class="meta">${raw(i.price)}</p><h3>${raw(i.title)}</h3><p>${raw(i.desc)}</p><span class="go">Enquire on WhatsApp &rarr;</span></div>
    </a>`).join('')}
  </div>
</div></section>`;
  return simplePage({ slug: '/shop/', title: `Shop — DJ gear, computers & merch | ${S.brand}`, h1: 'Shop', intro: sh.intro, inner, desc: strip(sh.intro) });
}

function pageGallery() {
  const g = C.gallery;
  const inner = `
<section><div class="w">
  <p class="eyeb"><i></i> Gallery</p>
  <h2>On the floor</h2>
  <div class="gal">${g.items.map(i => `<figure><img src="${esc(i.image)}" alt="${esc(i.caption)}" loading="lazy"><figcaption>${esc(i.caption)}</figcaption></figure>`).join('')}</div>
</div></section>`;
  return simplePage({ slug: '/gallery/', title: `Gallery | ${S.brand}, ${S.city}`, h1: 'Gallery', intro: g.intro, inner, desc: strip(g.intro) });
}

function pageYouTube() {
  const y = C.youtube;
  const inner = `
<section><div class="w">
  <p class="eyeb"><i></i> YouTube</p>
  <h2>Watch</h2>
  <div id="ytgrid" class="grid yt-grid" data-loading="1">
    <p class="sub" id="ytmsg">Loading the latest from the channel&hellip;</p>
  </div>
  <div class="btns"><a class="bt bp" href="${esc(y.channel)}" rel="noopener" target="_blank">Subscribe on YouTube</a></div>
</div></section>

<div class="ytm" id="ytm" hidden>
  <div class="ytm-bg" data-close></div>
  <div class="ytm-box" role="dialog" aria-modal="true" aria-label="Video player">
    <button class="ytm-x" id="ytx" aria-label="Close player">&times;</button>
    <div class="ytm-frame" id="ytframe"></div>
    <p class="ytm-cap" id="ytcap"></p>
  </div>
</div>

<script>
(function(){
  var grid=document.getElementById('ytgrid'), msg=document.getElementById('ytmsg');
  var modal=document.getElementById('ytm'), frame=document.getElementById('ytframe'), cap=document.getElementById('ytcap');
  function esc(s){var e=document.createElement('div');e.textContent=s||'';return e.innerHTML;}

  function open(id,title){
    frame.innerHTML='<iframe src="https://www.youtube-nocookie.com/embed/'+encodeURIComponent(id)+
      '?autoplay=1&rel=0&modestbranding=1" title="'+esc(title)+
      '" allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture" allowfullscreen></iframe>';
    cap.textContent=title||'';
    modal.hidden=false; document.body.style.overflow='hidden';
    document.getElementById('ytx').focus();
  }
  function close(){ modal.hidden=true; frame.innerHTML=''; document.body.style.overflow=''; }

  modal.addEventListener('click',function(e){ if(e.target.hasAttribute('data-close')) close(); });
  document.getElementById('ytx').addEventListener('click',close);
  document.addEventListener('keydown',function(e){ if(e.key==='Escape'&&!modal.hidden) close(); });

  fetch('/api/youtube').then(function(r){return r.json();}).then(function(data){
    grid.removeAttribute('data-loading');
    if(!data.videos||!data.videos.length){
      msg.textContent='New uploads land on the channel first. Subscribe to catch sets, tutorials and gear breakdowns as they drop.';
      return;
    }
    grid.innerHTML=data.videos.map(function(v){
      return '<button class="card yt-card" data-id="'+esc(v.id)+'" data-title="'+esc(v.title)+'">'+
        '<div class="cpic"><img src="'+esc(v.thumb)+'" alt="" loading="lazy">'+
        '<span class="yt-play" aria-hidden="true"></span></div>'+
        '<div class="cbody"><h3>'+esc(v.title)+'</h3><span class="go">Play here &rarr;</span></div></button>';
    }).join('');
    grid.querySelectorAll('.yt-card').forEach(function(b){
      b.addEventListener('click',function(){ open(b.dataset.id, b.dataset.title); });
    });
  }).catch(function(){
    grid.removeAttribute('data-loading');
    msg.textContent='Could not load the feed right now. The channel link below still works.';
  });
})();
</script>`;
  return simplePage({ slug: '/youtube/', title: `YouTube — ${S.person} | ${S.brand}`, h1: 'YouTube', intro: y.intro, inner, desc: strip(y.intro) });
}

function fmtDate(d) {
  const dt = new Date(d + 'T00:00:00Z');
  return dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

function pageBlogIndex() {
  const inner = `
<section><div class="w">
  <p class="eyeb"><i></i> Journal</p>
  <h2>Studio notes</h2>
  <div class="grid">
    ${C.blog.map(p => `
    <a class="card" href="/blog/${p.slug}/">
      <div class="cpic"><img src="${esc(p.cover)}" alt="${esc(p.title)}" loading="lazy"></div>
      <div class="cbody"><p class="meta">${esc(fmtDate(p.date))}</p><h3>${esc(p.title)}</h3><p>${esc(p.excerpt)}</p><span class="go">Read &rarr;</span></div>
    </a>`).join('')}
  </div>
</div></section>
${adSlot(C.adsense?.slotFooter)}`;
  return simplePage({
    slug: '/blog/', title: `Blog — gear guides & event know-how | ${S.brand}`, h1: 'Blog',
    intro: 'Gear guides, event know-how and notes from the room at Plot 1 Bukoto Street.',
    inner, desc: `DJ gear guides, wedding and event advice, and studio notes from ${S.brand} in ${S.city}.`,
  });
}

function pagePost(p) {
  const body = `
<header class="phead"><div class="w">
  <p class="crumb"><a href="/">Home</a> / <a href="/blog/">Blog</a></p>
  <h1>${esc(p.title)}</h1>
  <p class="artmeta">${esc(fmtDate(p.date))} &middot; ${esc(p.author)} &middot; ${(p.tags || []).join(' &middot; ')}</p>
</div></header>
<main>
<section><div class="w">
  <figure class="artcover"><img src="${esc(p.cover)}" alt="${esc(p.title)}"></figure>
  <div class="article">${p.body.map(x => `<p>${raw(x)}</p>`).join('')}</div>
  ${adSlot(C.adsense?.slotInArticle)}
  <div class="btns" style="margin-top:40px">
    <a class="bt bp" href="${tel}">Call the studio</a>
    <a class="bt bs" href="/blog/">More posts</a>
  </div>
</div></section>
${visitSection()}
</main>`;
  return layout({
    title: `${p.title} | ${S.brand}`, desc: p.excerpt, url: `/blog/${p.slug}/`, active: '/blog/', body, image: p.cover,
    extraSchema: [{
      '@type': 'BlogPosting', '@id': `${S.domain}/blog/${p.slug}/#post`,
      headline: p.title, description: p.excerpt, datePublished: p.date, dateModified: p.date,
      image: `${S.domain}${p.cover}`,
      author: { '@id': `${S.domain}/#person` },
      publisher: { '@id': `${S.domain}/#organization` },
      mainEntityOfPage: `${S.domain}/blog/${p.slug}/`,
      keywords: (p.tags || []).join(', '),
    }],
  });
}

/* ---------- write ---------- */
function write(rel, html) {
  const f = path.join(OUT, rel, 'index.html');
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, html);
}
function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const e of fs.readdirSync(from, { withFileTypes: true })) {
    const s = path.join(from, e.name), d = path.join(to, e.name);
    e.isDirectory() ? copyDir(s, d) : fs.copyFileSync(s, d);
  }
}

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

write('', pageHome());
write('about', pageAbout());
write('mixes', pageMixes());
write('shop', pageShop());
write('gallery', pageGallery());
write('youtube', pageYouTube());
write('blog', pageBlogIndex());
C.services.forEach(s => write(s.slug, pageService(s)));
C.blog.forEach(p => write(`blog/${p.slug}`, pagePost(p)));

copyDir(path.join(ROOT, 'assets'), path.join(OUT, 'assets'));
copyDir(path.join(ROOT, 'admin'), path.join(OUT, 'admin'));
fs.copyFileSync(path.join(ROOT, 'content.json'), path.join(OUT, 'content.json'));

/* sitemap + robots */
const urls = ['/', '/about/', '/mixes/', '/shop/', '/gallery/', '/youtube/', '/blog/',
  ...C.services.map(s => `/${s.slug}/`), ...C.blog.map(p => `/blog/${p.slug}/`)];
fs.writeFileSync(path.join(OUT, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  urls.map(u => `  <url><loc>${S.domain}${u}</loc><changefreq>weekly</changefreq></url>`).join('\n') +
  `\n</urlset>\n`);
fs.writeFileSync(path.join(OUT, 'robots.txt'),
  `User-agent: *\nAllow: /\nDisallow: /admin/\n\nSitemap: ${S.domain}/sitemap.xml\n`);
fs.writeFileSync(path.join(OUT, '_headers'),
  `/assets/*\n  Cache-Control: public, max-age=31536000, immutable\n/admin/*\n  X-Robots-Tag: noindex\n`);

console.log(`✅ Built ${urls.length} pages → dist/`);
urls.forEach(u => console.log('   ' + u));
