# Discoverability notes (SEO + GEO) — desksprite

Verified research synthesis (2026-06). 25 sources → 120 claims → adversarial 3-vote
verification → 20 confirmed / 5 killed. Sources cited inline.

## What demonstrably works (do these)

1. **GitHub repo metadata carries search — not the README body.** GitHub's default repo
   search matches **name + About/description + topics** (+ stars as a signal). README is
   only searched with `in:readme`, so it is *not* a primary ranking factor.
   → Keep a keyword-rich description + real topics. README is for humans (and stars).
   *Sources:* docs.github.com/searching-for-repositories; markepear.dev/github-search-engine-optimization; star-history.com playbook.

2. **Use real, populated GitHub topics:** `desktop-pet` (363 repos), `shimeji`, `oneko`,
   `desktop-mascot`, `virtual-pet`. Tagging adds the repo to the (Google-indexable) topic
   index; it does **not** by itself outrank star-heavy leaders.
   *Sources:* github.com/topics/{desktop-pet,oneko,shimeji,virtual-pet}.

3. **npm search = pure keyword match** on **title, description, README, keywords**
   (OpenSearch; the Dec-2024 overhaul removed popularity/quality/maintenance scoring).
   → Fill package.json `keywords`/`description` + a root-level README before publishing.
   *Sources:* docs.npmjs.com/searching-…; github.blog/2024-12-02 npm search GA; socket.dev.

4. **npm hides new/thin packages** (may take ~2 weeks to surface; minimal de-boost for
   sparse content). → Ship a rich description + README *at* publish, expect a lag.
   *Sources:* docs.npmjs.com; npm community discussion #144952.

5. **README screenshot/GIF at the top** drives stars; stars are a ranking signal.
   *Sources:* star-history.com playbook; corroborated by multiple README guides.

6. **Targeted distribution, not broadcast:** post where users already are (Reddit, Dev.to,
   Lobsters, Hacker News, Product Hunt) per each community's self-promo norms; get into
   awesome-lists. *Sources:* opensource.guide/finding-users; zenika promote-open-source.

## What does NOT work / myths (don't spend effort)

- **`llms.txt` is unproven.** Real, precisely-formatted standard (root `/llms.txt` markdown,
  + `llms-full.txt`), **but**: 0.3% adoption (3/1,000 top sites, Jun 2025); **no LLM provider
  confirmed reading it**; SE Ranking (~300k domains) found no citation relationship; Ahrefs
  (137k domains) found 97% got zero traffic; Google said it won't support it; OpenAI/Anthropic
  control bots via robots.txt and never mention llms.txt. → cheap to add, but not a lever.
  *Sources:* llmstxt.org; rankability.com/data/llms-txt-adoption; searchengineland.com; searchenginejournal.com; ahrefs.com.
- **Refuted (do not act on):** README is *not* the single highest-leverage asset (0-3);
  a repo-name keyword does *not* outweigh stars (0-3); single-word topics are *not* better
  than hyphenated (0-3); the new npm sort does *not* rank by usage/dependents/recency by
  default — those are optional sorts (1-2).

## LLM reality

No proven way to "inject" into a trained model. The real lever is **presence in the corpora
LLMs train on / retrieve from** (GitHub, npm, articles) **+ good classic SEO** so
retrieval-augmented LLMs (Perplexity, ChatGPT-search, Claude) find the page. Verified evidence
covers what does *not* work (llms.txt); no GEO tactic was *confirmed* to work.

## Measure

- GitHub **Insights → Traffic** (views, referrers, clones) + stars over time.
- npm download stats / npmtrends; check the package's npm search rank for target terms.
- **Google Search Console** for the GitHub Pages site (impressions/queries/clicks).
- Per-channel referral attribution (GitHub traffic referrers, UTM links in posts).
- LLM spot-check: periodically ask ChatGPT/Claude/Perplexity "JavaScript desktop pet
  libraries" and see whether desksprite is named.

## Caveats

Time-sensitive: npm's Dec-2024 search behavior may keep shifting; the whole GEO/llms.txt
landscape is volatile (re-verify before investing). GitHub ranking field-weighting (how much
stars vs name/description) is directional, not quantified. GitHub Pages meta/OG/JSON-LD
specifics were not independently verified — applied as reasonable standard SEO.
