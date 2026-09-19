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
const MIX_PAYMENT_URL = 'https://wallet.wearemarz.com/p/mixes-driu8x';

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
  { t: 'DJ Course', u: '/dj-course/' },
  { t: 'Repairs', u: '/dj-gear-repair/' },
  { t: 'Gear 4 Hire', u: '/gear-4-hire/' },
  { t: 'Maintenance', u: '/maintenance/' },
  { t: 'Mixes', u: '/mixes/' },
  { t: 'Shop', u: '/shop/' },
  { t: 'Gallery', u: '/gallery/' },
  { t: 'YouTube', u: '/youtube/' },
  { t: 'TikTok', u: '/tiktok/' },
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
    ? `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${esc(ads.client)}" crossorigin="anonymous"></script>
<script>(adsbygoogle=window.adsbygoogle||[]).push({google_ad_client:"${esc(ads.client)}",enable_page_level_ads:true});</script>`
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
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/favicon.svg">
<link rel="manifest" href="/site.webmanifest">
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
<link rel="stylesheet" href="/assets/site.css?v=20260919-icons">
${adsHead}
<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': graph })}</script>
</head>
<body>
<div class="cursor-ring" aria-hidden="true"></div>
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
(function(){
  var ring=document.querySelector('.cursor-ring');
  if(!ring || matchMedia('(pointer: coarse)').matches) return;
  document.addEventListener('pointermove',function(e){ring.style.transform='translate3d('+(e.clientX-16)+'px,'+(e.clientY-16)+'px,0)';});
  document.addEventListener('pointerdown',function(){ring.classList.add('active');});
  document.addEventListener('pointerup',function(){ring.classList.remove('active');});
})();
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
  ${socialList()}
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
${enquiryForm(strip(s.title), `Leave a number or email after reading the details and the studio will send a price or booking option.`)}
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

function enquiryForm(kind, intro) {
  return `<section class="enquiry"><div class="w"><div class="enquiry-box"><p class="eyeb"><i></i> Get a quote</p><h2>${esc(kind)}</h2><p class="sub">${esc(intro)}</p><form class="enquiry-form" data-kind="${esc(kind)}"><div class="form-grid"><label>Name<input name="name" required autocomplete="name"></label><label>Email<input name="email" type="email" autocomplete="email"></label><label>Phone<input name="phone" autocomplete="tel"></label><label>What do you need?<select name="kind"><option>${esc(kind)}</option><option>DJ course</option><option>Gear repair</option><option>Gear swap or top-up</option><option>Gear hire</option><option>Studio consultation</option></select></label></div><label>Details<textarea name="message" required placeholder="Tell the studio what you need, the gear model or the dates."></textarea></label><button class="bt bp" type="submit">Send enquiry &rarr;</button><p class="form-status" aria-live="polite"></p></form></div></div></section><script>(function(){document.querySelectorAll('.enquiry-form').forEach(function(f){f.addEventListener('submit',function(e){e.preventDefault();var s=f.querySelector('.form-status');s.textContent='Sending…';var b=Object.fromEntries(new FormData(f));fetch('/api/enquire',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(b)}).then(function(r){return r.json().then(function(x){if(!r.ok||!x.ok)throw Error(x.error||'Could not send');return x;});}).then(function(x){s.textContent=x.message;f.reset();}).catch(function(x){s.textContent=x.message;});});});})();</script>`;
}

function pageCourse(c) {
  const body = `<header class="phead"><div class="w"><p class="crumb"><a href="/">Home</a> / DJ Course</p><h1>${raw(c.title)}</h1><p class="lede">${raw(c.intro)}</p></div></header><main><section><div class="w"><div class="feats">${c.lessons.map(x => `<div class="feat"><h3>${raw(x.t)}</h3><p>${raw(x.d)}</p></div>`).join('')}</div><div class="platforms"><p class="meta">Explore the course</p>${(c.videoCategories || []).map(x => `<a class="platform-tab" href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.title)} <span>&rarr;</span></a>`).join('')}</div></div></section>${enquiryForm('DJ course', 'Leave your email or number and we will send the current price, schedule and next intake.')}${visitSection()}</main>`;
  return layout({ title: `${strip(c.title)} in Kampala | ${S.brand}`, desc: strip(c.excerpt), url: `/${c.slug}/`, active: `/${c.slug}/`, body, image: c.image, extraSchema: [{ '@type':'Course', name:strip(c.title), description:strip(c.intro), provider:{'@id':`${S.domain}/#organization`}, url:`${S.domain}/${c.slug}/` }] });
}

function pageRepair(r) {
  const body = `<header class="phead"><div class="w"><p class="crumb"><a href="/">Home</a> / Repairs</p><h1>${raw(r.title)}</h1><p class="lede">${raw(r.intro)}</p></div></header><main><section><div class="w"><h2>What we check</h2><div class="feats">${r.checks.map(x => `<div class="feat"><h3>${raw(x)}</h3><p>We inspect the fault, explain the options and confirm the quote before work starts.</p></div>`).join('')}</div>${r.faq?.length ? `<div class="faq">${r.faq.map(f => `<details><summary>${raw(f.q)}</summary><p>${raw(f.a)}</p></details>`).join('')}</div>` : ''}</div></section>${enquiryForm('Gear repair', 'Send the make, model and symptoms. Add your phone or email so the bench can call you back.')}${visitSection()}</main>`;
  return layout({ title: `${strip(r.title)} in Kampala | ${S.brand}`, desc:strip(r.excerpt), url:`/${r.slug}/`, active:`/${r.slug}/`, body, image:r.image, extraSchema:[{'@type':'Service',name:strip(r.title),description:strip(r.intro),provider:{'@id':`${S.domain}/#organization`},url:`${S.domain}/${r.slug}/`}] });
}

function pageReviews() {
  const reviews = C.reviewsList || [];
  const cards = reviews.length ? reviews.map(r => `<blockquote class="review-card"><div class="stars">${'★'.repeat(Number(r.rating || 5))}</div><p>“${raw(r.quote)}”</p><cite>${esc(r.name)} · ${esc(r.source || 'Google review')}</cite></blockquote>`).join('') : '<p class="sub">Verified client reviews will appear here as they are added in the studio panel.</p>';
  const body = `<header class="phead"><div class="w"><p class="crumb"><a href="/">Home</a> / Reviews</p><h1>Good work, said plainly</h1><p class="lede">A few words from people who have trained, booked, hired and repaired with the studio.</p></div></header><main><section><div class="w"><div class="review-grid">${cards}</div></div></section>${visitSection()}</main>`;
  return layout({title:`Reviews | ${S.brand}`,desc:'Reviews from Derrick Files Studio clients and students in Kampala.',url:'/reviews/',active:'/reviews/',body,extraSchema:reviews.map(r=>({'@type':'Review',reviewBody:strip(r.quote),reviewRating:{'@type':'Rating',ratingValue:r.rating||5},author:{'@type':'Person',name:r.name||'Studio client'}}))});
}

function simplePage({ slug, title, h1, intro, inner, desc, nav, extraSchema = [] }) {
  const body = `
<header class="phead"><div class="w">
  <p class="crumb"><a href="/">Home</a> / ${esc(h1)}</p>
  <h1>${esc(h1)}</h1>
  <p class="lede">${raw(intro)}</p>
</div></header>
${credStrip()}
<main>${inner}${visitSection()}</main>`;
  return layout({ title, desc, url: slug, active: nav || slug, body, extraSchema });
}

function pageMixes() {
  const m = C.mixes;
  const items = m.items || [];
  const platforms = [
    ['SoundCloud', S.social.soundcloud],
    ['Mixcloud', S.social.mixcloud],
    ['HearThis', S.social.hearthis],
  ].filter(x => x[1]);
  const inner = `
<section><div class="w">
  <p class="eyeb"><i></i> The sound</p>
  <h2>Mixes, mashups &amp; downloads</h2>
  <p class="sub">${raw(m.intro)}</p>
  <ul class="tags">${m.genres.map(g => `<li>${raw(g)}</li>`).join('')}</ul>
  <div class="sound-list">
    ${items.map((i, n) => `
    <article class="sound-card" data-media-item="${esc(i.title)}">
      ${i.cover ? `<img class="sound-cover" src="${esc(i.cover)}" alt="${strip(i.title)}" loading="lazy">` : '<div class="sound-cover sound-cover-fallback">DF</div>'}
      <div class="sound-main">
        <p class="meta">${esc(i.type || 'Mix')} ${i.genre ? `&middot; ${esc(i.genre)}` : ''}</p>
        <div class="sound-title"><h3>${raw(i.title)}</h3><button class="fav" type="button" aria-label="Favourite ${esc(i.title)}" aria-pressed="false" data-favorite="${esc(i.title)}">&#9733;</button></div>
        <p>${raw(i.desc || '')}</p>
        ${i.audio ? `<audio controls preload="none" data-track="${esc(i.title)}" src="${esc(i.audio)}">Your browser cannot play this audio.</audio>` : ''}
        <div class="sound-actions">
          <a class="bt bs mix-payment-link" href="${MIX_PAYMENT_URL}" data-track-buy="${esc(i.title)}" rel="noopener" target="_blank">Get this mix &rarr;</a>
          ${i.free === false && !i.paymentEnabled ? `<a class="bt bp" href="${wa}?text=${encodeURIComponent(`I want ${strip(i.title)} (${i.price || 'price on request'})`)}" data-track-buy="${esc(i.title)}" rel="noopener" target="_blank">${esc(i.price || 'Get this pack')} &rarr;</a>` : ''}
          ${i.paymentEnabled && i.price ? `<button class="bt bp pay-button" type="button" data-pay-item="${esc(i.title)}" data-pay-amount="${i.price}">Buy ${i.price} UGX &rarr;</button>` : ''}
          ${i.link ? `<a class="sound-link platform-outbound" href="${esc(i.link)}" data-track-outbound="${esc(i.title)}" rel="noopener" target="_blank">Open source &rarr;</a>` : ''}
        </div>
      </div>
    </article>`).join('')}
  </div>
  <div class="platforms"><p class="meta">Listen on your favourite platform — you stay on our catalogue until you choose to leave</p>${platforms.map(x => `<a class="platform-tab" href="${esc(x[1])}" data-track-outbound="${esc(x[0])}" rel="noopener" target="_blank">${esc(x[0])}<span>&rarr;</span></a>`).join('')}</div>
</div></section>`;
  const gate = `
<div class="gate-modal" id="gate-modal" hidden>
  <div class="gate-shade" data-gate-close></div>
  <div class="gate-box" role="dialog" aria-modal="true" aria-labelledby="gate-title">
    <button class="gate-close" type="button" data-gate-close aria-label="Close">&times;</button>
    <p class="eyeb"><i></i> Free studio download</p><h2 id="gate-title">Join the list first</h2>
    <p class="sub">Get the mix link, new uploads and studio news. Follow our socials too — that is how you keep up with the next drop.</p>
    <form id="download-gate"><label for="gate-email">Email address</label><input id="gate-email" name="email" type="email" required autocomplete="email" placeholder="you@example.com"><input id="gate-item" name="item" type="hidden"><button class="bt bp" type="submit">Unlock download &rarr;</button><p class="gate-status" id="gate-status" aria-live="polite"></p></form>
    <div class="gate-socials">${[['Instagram',S.social.instagram],['TikTok',S.social.tiktok],['YouTube',S.social.youtube],['SoundCloud',S.social.soundcloud]].map(x => `<a href="${esc(x[1])}" target="_blank" rel="noopener">${esc(x[0])}</a>`).join('')}</div>
  </div>
</div>
<div class="gate-modal" id="pay-modal" hidden>
  <div class="gate-shade" data-pay-close></div>
  <div class="gate-box" role="dialog" aria-modal="true" aria-labelledby="pay-title">
    <button class="gate-close" type="button" data-pay-close aria-label="Close">&times;</button>
    <p class="eyeb"><i></i> Mobile money payment</p><h2 id="pay-title">Complete your purchase</h2>
    <form id="payment-form"><input id="pay-item" name="item" type="hidden"><input id="pay-amount" name="amount" type="hidden"><label for="pay-phone">Mobile money number</label><input id="pay-phone" name="phone" type="tel" required placeholder="07XX XXXXXX" pattern="[0-9\\-\\s+]{9,}"><label for="pay-network">Network</label><select id="pay-network" name="network"><option value="MTN">MTN Mobile Money</option><option value="Airtel">Airtel Money</option><option value="Stanbic">Stanbic Loans</option><option value="Other">Other</option></select><button class="bt bp" type="submit">Send payment request &rarr;</button><p class="gate-status" id="pay-status" aria-live="polite"></p></form>
  </div>
</div>
<script>
(function(){
  var gateModal=document.getElementById('gate-modal'), payModal=document.getElementById('pay-modal'), form=document.getElementById('download-gate'), payForm=document.getElementById('payment-form'), status=document.getElementById('gate-status'), payStatus=document.getElementById('pay-status'), active=null;
  function track(event,item){fetch('/api/track',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({event:event,item:item})}).catch(function(){});}
  document.querySelectorAll('[data-favorite]').forEach(function(b){var k='dfs-fav-'+b.dataset.favorite, on=localStorage.getItem(k)==='1'; b.setAttribute('aria-pressed',on); b.classList.toggle('is-fav',on); b.addEventListener('click',function(){on=!on;localStorage.setItem(k,on?'1':'0');b.setAttribute('aria-pressed',on);b.classList.toggle('is-fav',on);track('favorite',b.dataset.favorite);});});
  document.querySelectorAll('audio[data-track]').forEach(function(a){a.addEventListener('play',function(){track('play',a.dataset.track);},{once:true});});
  document.querySelectorAll('[data-track-buy],[data-track-outbound]').forEach(function(a){a.addEventListener('click',function(){track(a.dataset.trackBuy?'buy':'outbound',a.dataset.trackBuy||a.dataset.trackOutbound);});});
  document.querySelectorAll('.gate-download').forEach(function(a){a.addEventListener('click',function(e){if(localStorage.getItem('dfs-subscriber')==='1')return; e.preventDefault();active=a;document.getElementById('gate-item').value=a.dataset.item;gateModal.hidden=false;document.getElementById('gate-email').focus();});});
  document.querySelectorAll('.pay-button').forEach(function(b){b.addEventListener('click',function(){payModal.hidden=false;document.getElementById('pay-item').value=b.dataset.payItem;document.getElementById('pay-amount').value=b.dataset.payAmount;document.getElementById('pay-phone').focus();});});
  function closeGate(){gateModal.hidden=true;active=null;} function closePay(){payModal.hidden=true;} 
  document.querySelectorAll('[data-gate-close]').forEach(function(x){x.addEventListener('click',closeGate);}); 
  document.querySelectorAll('[data-pay-close]').forEach(function(x){x.addEventListener('click',closePay);});
  document.addEventListener('keydown',function(e){if(e.key==='Escape'){if(!gateModal.hidden)closeGate();if(!payModal.hidden)closePay();}});
  form.addEventListener('submit',function(e){e.preventDefault();status.textContent='Saving your signup…';var data={email:document.getElementById('gate-email').value,item:document.getElementById('gate-item').value,source:'mix-download'};fetch('/api/subscribe',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)}).then(function(r){return r.json().then(function(x){if(!r.ok||!x.ok)throw new Error(x.error||'Could not subscribe');return x;});}).then(function(){localStorage.setItem('dfs-subscriber','1');track('download',data.item);status.textContent='Unlocked — starting your download.';if(active){var href=active.href;active=null;setTimeout(function(){closeGate();location.href=href;},350);}}).catch(function(err){status.textContent=err.message;});});
  payForm.addEventListener('submit',function(e){e.preventDefault();payStatus.textContent='Sending your payment request…';var data={item:document.getElementById('pay-item').value,amount:parseInt(document.getElementById('pay-amount').value),phone:document.getElementById('pay-phone').value,network:document.getElementById('pay-network').value};fetch('/api/pay',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)}).then(function(r){return r.json().then(function(x){if(!r.ok||!x.ok)throw new Error(x.error||'Could not send payment request');return x;});}).then(function(x){track('buy',data.item);payStatus.innerHTML='✓ <strong>Request received.</strong> The studio will confirm payment via '+data.phone+'. Reference: <code>'+x.reference+'</code>';setTimeout(function(){closePay();document.getElementById('pay-phone').value='';payStatus.textContent='';},3000);}).catch(function(err){payStatus.textContent=err.message;});});
})();
</script>`;
  return simplePage({ slug: '/mixes/', title: `Mixes, mashups &amp; sound packs — ${S.person} | ${S.brand}`, h1: 'Mixes &amp; downloads', intro: m.intro, inner: inner + gate, desc: strip(m.intro), nav: '/mixes/',
    extraSchema: items.map(i => ({ '@type': 'AudioObject', name: strip(i.title), description: strip(i.desc || ''), contentUrl: i.audio || undefined, url: i.link || `${S.domain}/mixes/` })) });
}

function pageShop() {
  const sh = C.shop;
  const inner = `
<section><div class="w">
  <p class="eyeb"><i></i> Shop</p>
  <h2>Gear, software &amp; merch</h2>
  <div class="grid">
    ${sh.items.map(i => `
    <article class="card product-card">
      <div class="cpic"><img src="${esc(i.image)}" alt="${strip(i.title)}" loading="lazy"></div>
      <div class="cbody"><p class="meta">${raw(i.category || 'Studio shop')} ${i.sku ? `&middot; ${esc(i.sku)}` : ''}</p><h3>${raw(i.title)}</h3><p>${raw(i.desc)}</p>
      ${i.details ? `<div class="product-details">${raw(i.details)}</div>` : ''}
      <div class="product-meta"><b>${raw(i.price || 'Enquire')}</b><span>${esc(i.availability || 'Ask for current stock')}</span></div>
      ${i.paymentEnabled && i.price ? `<button class="bt bp pay-button" type="button" data-pay-item="${esc(i.title)}" data-pay-amount="${i.price}">Buy ${i.price} UGX &rarr;</button>` : ''}
      ${!i.paymentEnabled ? `<a class="go" href="${wa}?text=${encodeURIComponent(`I want to enquire about ${strip(i.title)}`)}" rel="noopener" target="_blank">Enquire / pay by mobile money &rarr;</a>` : ''}</div>
    </article>`).join('')}
  </div>
</div></section>`;
  return simplePage({ slug: '/shop/', title: `Shop — DJ gear, software & merch | ${S.brand}`, h1: 'Shop', intro: sh.intro, inner, desc: strip(sh.intro), nav: '/shop/',
    extraSchema: sh.items.map(i => ({ '@type': 'Product', name: strip(i.title), description: strip(i.desc || ''), image: i.image ? `${S.domain}${i.image}` : undefined, brand: { '@type': 'Brand', name: S.brand }, offers: { '@type': 'Offer', priceCurrency: 'UGX', price: String(i.price || '').replace(/[^0-9.]/g, '') || undefined, availability: 'https://schema.org/InStock', url: `${S.domain}/shop/` } })) });
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

function pageTikTok() {
  const t = C.tiktok || {
    handle: 'derrickfiles',
    profile: S.social.tiktok,
    intro: `Short-form sets, behind-the-scenes clips and studio updates from ${S.person}.`,
  };
  const inner = `
<section><div class="w">
  <p class="eyeb"><i></i> TikTok</p>
  <h2>Watch the latest clips</h2>
  <p class="sub">${esc(t.intro)}</p>
  <div class="tiktok-profile">
    <blockquote class="tiktok-embed" cite="${esc(t.profile)}" data-unique-id="${esc(t.handle)}" data-embed-type="creator">
      <section><a target="_blank" href="${esc(t.profile)}">@${esc(t.handle)}</a></section>
    </blockquote>
  </div>
  <div class="btns">
    <a class="bt bp" href="${esc(t.profile)}" rel="noopener" target="_blank">Follow @${esc(t.handle)}</a>
  </div>
</div></section>
<script async src="https://www.tiktok.com/embed.js"></script>`;
  return simplePage({
    slug: '/tiktok/',
    title: `TikTok — ${S.person} | ${S.brand}`,
    h1: 'TikTok',
    intro: t.intro,
    inner,
    desc: strip(t.intro),
  });
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
write('tiktok', pageTikTok());
write('dj-course', pageCourse(C.courses[0]));
write('dj-gear-repair', pageRepair(C.repairs[0]));
write('reviews', pageReviews());
write('blog', pageBlogIndex());
C.services.forEach(s => write(s.slug, pageService(s)));
C.blog.forEach(p => write(`blog/${p.slug}`, pagePost(p)));

copyDir(path.join(ROOT, 'assets'), path.join(OUT, 'assets'));
copyDir(path.join(ROOT, 'admin'), path.join(OUT, 'admin'));
fs.copyFileSync(path.join(ROOT, 'content.json'), path.join(OUT, 'content.json'));
fs.copyFileSync(path.join(ROOT, 'assets', 'favicon.svg'), path.join(OUT, 'favicon.svg'));
fs.copyFileSync(path.join(ROOT, 'assets', 'site.webmanifest'), path.join(OUT, 'site.webmanifest'));

/* sitemap + robots */
const urls = ['/', '/about/', '/mixes/', '/shop/', '/gallery/', '/youtube/', '/tiktok/', '/dj-course/', '/dj-gear-repair/', '/reviews/', '/blog/',
  ...C.services.map(s => `/${s.slug}/`), ...C.blog.map(p => `/blog/${p.slug}/`)];
fs.writeFileSync(path.join(OUT, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  urls.map(u => `  <url><loc>${S.domain}${u}</loc><changefreq>weekly</changefreq></url>`).join('\n') +
  `\n</urlset>\n`);
fs.writeFileSync(path.join(OUT, 'robots.txt'),
  `User-agent: *\nAllow: /\nDisallow: /admin/\n\nSitemap: ${S.domain}/sitemap.xml\n`);
fs.writeFileSync(path.join(OUT, 'ads.txt'),
  `google.com, ${C.adsense?.client?.replace(/^ca-/, '') || ''}, DIRECT, f08c47fec0942fa0\n`);
fs.writeFileSync(path.join(OUT, '_headers'),
  `/*\n  Cache-Control: no-cache\n/assets/*\n  Cache-Control: public, max-age=31536000, immutable\n/admin/*\n  X-Robots-Tag: noindex\n`);

console.log(`✅ Built ${urls.length} pages → dist/`);
urls.forEach(u => console.log('   ' + u));
