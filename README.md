# Derrick Files Studio — website

**Live:** https://www.derrickfiles.com · **Control panel:** https://www.derrickfiles.com/admin/
**Hosting:** Cloudflare Pages project `derrickfiles-site` — every push to `main` rebuilds and deploys.

Static site for **derrickfiles.com**. Content lives in one file (`content.json`),
a small Node script turns it into plain HTML, and a browser-based control panel
lets you edit everything and publish without touching code.

```
content.json   ← all the words, prices, pictures, posts  (this is what you edit)
build.mjs      ← turns content.json into dist/           (no dependencies)
assets/        ← site.css + images
admin/         ← the control panel
dist/          ← generated output (never edit by hand, never commit)
```

---

## 1. One-time setup

### a) Put this on GitHub

```bash
cd derrickfiles-site
git init
git add .
git commit -m "Derrick Files Studio website"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

### b) Connect Cloudflare Pages

In the Cloudflare dashboard → **Workers & Pages → Create → Pages → Connect to Git**,
pick the repo and set:

| Setting | Value |
|---|---|
| Framework preset | None |
| Build command | `node build.mjs` |
| Build output directory | `dist` |
| Node version (env var `NODE_VERSION`) | `20` |

Then **Custom domains → Set up a custom domain →** `www.derrickfiles.com`,
and add `derrickfiles.com` as well so both spellings resolve.

> The BMS already on this domain keeps working — give it its own subdomain or
> path so the two projects do not fight over the root.

From this point every push to `main` rebuilds and redeploys automatically.

### c) Open the control panel

Go to **derrickfiles.com/admin/** and connect it once:

1. Create a token at **github.com/settings/personal-access-tokens/new**
2. Repository access: **only** this repo
3. Permissions → Repository permissions → **Contents: Read and write**
4. Paste the owner, repo name, branch (`main`) and token into the panel

The token is stored in that browser only and is sent nowhere except GitHub.
`/admin/` is excluded from search engines via `robots.txt` and `X-Robots-Tag`.

---

## 2. Day-to-day: editing the site

Open **derrickfiles.com/admin/**, change what you need, press
**Save & publish**. That writes `content.json` back to GitHub, Cloudflare
notices the commit and rebuilds. The live site updates in about a minute.

What you can change without any code:

| Panel section | Controls |
|---|---|
| **Studio details** | Company + artist name, role line, phone, WhatsApp, email, address, hours, rating, social links |
| **Promo & ads** | The gold bar at the top of every page — sponsor, upcoming event or promotion. Google AdSense publisher ID and slot IDs |
| **Home** | Hero text and picture, the quote band, the two lanes |
| **About** | Lead sentence and body paragraphs |
| **Services** | Add, remove, reorder and rewrite service pages. Each one gets its own URL |
| **Blog** | Write posts, set cover pictures, tags and dates |
| **Mixes / Shop / Gallery / YouTube** | Everything on those pages |

**Pictures:** every picture field has an *Upload new picture* button. The file is
committed into `assets/img/` when you press Save & publish. Keep uploads under 4MB.

### Mix media and R2

The Mixes editor can upload audio files directly to Cloudflare R2. Create an R2 bucket named
`derrickfiles-media` and bind it to the Pages project with the `MEDIA_BUCKET` binding from
`wrangler.toml`. The upload endpoint is admin-only; public media is streamed through
`/api/media?key=...`, so the catalogue retains first-party play and download traffic.

Free downloads open a newsletter signup gate and record play, download, favourite, buy and
outbound-platform events in D1. Favourites are deliberately browser-local; no personal
profile is created without consent. The platform tabs link to SoundCloud, Mixcloud and HearThis
only after the visitor chooses to leave the site.

### Courses, repairs, appointments and reviews

The admin panel now edits course lessons/tutorial categories, repair and gear-swap checks,
appointment copy, reviews, services, products and media metadata. The generated `/dj-course/`,
`/dj-gear-repair/` and `/reviews/` landing pages include quote forms that collect a phone or
email plus a client description in D1 through `/api/enquire`. Only publish genuine reviews that
you have permission to quote; the starter review list is intentionally empty.

### Mobile money purchases

Mixes, effects packs and shop products can each have a UGX price and a
`paymentEnabled` switch in the admin panel. When enabled, the customer enters a
mobile-money number and network; the request is stored in D1 and appears under
**Payment requests** in the private admin panel with a reference and `pending`
status. No payment is described as successful until the studio confirms it.

The current flow is a secure payment-request queue, not an automatic debit.
Automatic deductions require a supported provider account and server-side
credentials (for example MTN MoMo, Airtel Money, Flutterwave or Pesapal), plus
their API/webhook configuration. Never place those credentials in
`content.json`, `admin/index.html`, or the browser. Once a provider is chosen,
its encrypted Cloudflare secret can be wired into `/api/pay` and the webhook
can update `payments.status` from `pending` to `paid` or `failed`.

### Mobile money purchases

Mixes, effects packs and shop products can each have a UGX price and a
`paymentEnabled` switch in the admin panel. When enabled, the customer enters a
mobile-money number and network; the request is stored in D1 and appears under
**Payment requests** in the private admin panel with a reference and `pending`
status. No payment is described as successful until the studio confirms it.

The current flow is a secure payment-request queue, not an automatic debit.
Automatic deductions require a supported provider account and server-side
credentials (for example MTN MoMo, Airtel Money, Flutterwave or Pesapal), plus
their API/webhook configuration. Never place those credentials in
`content.json`, `admin/index.html`, or the browser. Once a provider is chosen,
its encrypted Cloudflare secret can be wired into `/api/pay` and the webhook
can update `payments.status` from `pending` to `paid` or `failed`.

---

## 3. Adding a new service page

Panel → **Services → + Add a service**. Fill in the title, a URL slug
(`lowercase-with-dashes`), the summary, the intro, the "what you get" points and
the questions. Save. The page appears at `derrickfiles.com/<slug>/`, gets added to
the home grid, the footer, the sitemap and the structured data automatically.

---

## 4. Turning on AdSense

1. Get the site approved in your AdSense account first
2. Create the ad units you want and copy the publisher ID (`ca-pub-…`) and slot IDs
3. Panel → **Promo & ads** → paste them in → tick **Enable AdSense** → Save

The AdSense script and Auto ads bootstrap are injected on every page automatically.
Auto ads lets Google select responsive in-page, anchor and vignette placements based
on each page and device. Leave manual slot IDs blank unless you have created specific
ad units in AdSense and want to add them as well.
Leave it off until approval comes through.

---

## 5. Running it locally

```bash
node build.mjs          # writes dist/
cd dist && python3 -m http.server 8080
```

Then open <http://localhost:8080>. The control panel at
<http://localhost:8080/admin/> also has a **Preview without saving** mode.

---

## 6. Search visibility — what is already done

- Every page carries `Person` + `Organization`/`LocalBusiness` structured data,
  cross-linked founder ↔ founded, so search engines can tell the DJ apart from
  the company and show the right one for each query
- Every service page carries its own `Service` schema and `FAQPage`
- Every blog post carries `BlogPosting` schema
- Opening hours, rating and review count are published as structured data
- `sitemap.xml` and `robots.txt` are generated on every build
- Canonical URLs, Open Graph and Twitter cards on every page

After the first deploy, submit `https://www.derrickfiles.com/sitemap.xml`
in Google Search Console, and put the same address on the Google Business Profile.
