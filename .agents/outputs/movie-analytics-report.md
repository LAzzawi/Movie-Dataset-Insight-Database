# Movie Dataset Insight Database — Analysis Report

**Dataset:** 800 titles · 15 genres · 20 countries · 1995–2023  
**Generated:** May 2, 2026

---

## Executive Summary

This report analyzes a Netflix-style streaming catalog of 800 titles using advanced SQL queries across six analytical dimensions: genre popularity, content type distribution, production trends, geographic reach, audience rating segmentation, and within-genre rankings. The dataset spans nearly three decades (1995–2023) and reveals a catalog that is heavily drama-led, mature-audience-oriented, and genuinely global in production origin.

---

## 1. Genre Landscape

### Findings

| Rank | Genre | Total | Movies | TV Shows |
|------|-------|-------|--------|----------|
| 1 | Drama | 179 | 128 | 51 |
| 2 | Thriller | 141 | 102 | 39 |
| 3 | Sci-Fi | 140 | 88 | 52 |
| 4 | Comedy | 100 | 71 | 29 |
| 5 | Horror | 93 | 63 | 30 |
| 6 | Documentary | 92 | 66 | 26 |
| 7 | Family | 86 | 62 | 24 |
| 8 | Mystery | 84 | 58 | 26 |
| 9 | Romance | 83 | 48 | 35 |
| 10 | Adventure | 80 | 57 | 23 |
| 11 | Biography | 80 | 57 | 23 |
| 12 | Action | 78 | 54 | 24 |
| 13 | Animation | 70 | 46 | 24 |
| 14 | Fantasy | 67 | 43 | 24 |
| 15 | Crime | 62 | 44 | 18 |

**SQL technique:** `JOIN` + `GROUP BY` + `HAVING COUNT(*) >= 5` + conditional `SUM(CASE WHEN type = 'Movie' THEN 1 ELSE 0 END)`.

### Insights

- **Drama is dominant** with 179 titles — 22.4% more than Thriller (2nd place, 141) and nearly 3x Crime (last place, 62). Drama titles cover both long-form TV storytelling and theatrical films, making it the most versatile genre.
- **Thriller and Sci-Fi are effectively tied** at 141 vs 140, suggesting equal commercial appetite for suspense-driven and speculative narratives.
- **Sci-Fi leans more TV** (52 TV shows vs 88 movies, a 37% TV share) compared to Drama (28% TV share), reflecting the episodic world-building that streaming has enabled for science-fiction.
- **Romance skews toward TV Shows** more than any other genre — 35 TV shows vs 48 movies, a 42% TV share. Serial romantic arcs suit episodic formats better than one-off films.
- **Crime is the least-represented genre** (62 titles) despite high viewer demand globally. This may indicate a content gap or acquisition opportunity.
- The **top 3 genres (Drama, Thriller, Sci-Fi) account for 460 titles** — 57.5% of the entire catalog — suggesting the catalog is not evenly distributed and mid-tier genres may be underinvested.

### Recommendation

Diversify the catalog toward underrepresented genres — Crime (62), Fantasy (67), and Animation (70) — which have proven streaming audiences but low catalog depth. A 20% increase in Crime titles alone could move it from 15th to 10th place.

---

## 2. Yearly Content Production Trends

### Findings

| Period | Avg Titles/Year | Notable |
|--------|----------------|---------|
| 1995–1999 | 20.4 | Early catalog, movies only (1995–97) |
| 2000–2007 | 31.5 | Peak of 39 titles in 2007 |
| 2008–2016 | 26.6 | Dip to 17 in 2016 |
| 2017–2023 | 29.9 | Strong recovery |

TV Shows first appear in **1998** and grow steadily, becoming a consistent 30–45% of annual output from 2003 onward.

**SQL technique:** `GROUP BY release_year` with `SUM(CASE WHEN type = ... THEN 1 ELSE 0 END)` for per-type splits.

### Insights

- **2007 is the single highest-output year** (39 titles), likely coinciding with the early streaming expansion era when digital licensing created fresh demand for back-catalog content.
- **2016 is a notable trough** (17 titles — the lowest since 1997), possibly reflecting content consolidation or licensing changes during a mid-decade platform restructuring.
- **TV Show production consistently grows** after 1998. By 2006, TV shows represent over 50% of new additions in some years, confirming the industry-wide pivot toward serialized content that streaming platforms accelerated.
- **2017–2023 shows a stable, mature cadence** — averaging ~30 titles/year — suggesting the catalog reached steady-state acquisition rather than rapid expansion.
- **No year exceeds 40 titles**, indicating a curated, quality-first approach rather than volume-based acquisition.

### Recommendation

Analyze why 2016 saw such a sharp drop. If this corresponds to a licensing contract gap, proactive multi-year licensing agreements can prevent similar gaps in future years. Also consider establishing a minimum annual acquisition floor of 25 titles per year to maintain catalog freshness.

---

## 3. Geographic Distribution

### Findings

| Rank | Country | Titles |
|------|---------|--------|
| 1 | Mexico | 47 |
| 2 | Japan | 40 |
| 3 | Italy | 39 |
| 4 | Sweden | 38 |
| 5 | China | 36 |
| 6 | France | 35 |
| 7 | Netherlands | 34 |
| 8 | Brazil | 33 |
| 8 | Nigeria | 33 |
| 10 | Australia | 32 |
| 10 | Turkey | 32 |
| 12 | United Kingdom | 31 |
| 13 | Argentina | 30 |
| 13 | Denmark | 30 |
| 13 | India | 30 |
| 13 | South Korea | 30 |
| 17 | Canada | 28 |
| 17 | Spain | 28 |
| 19 | Germany | 27 |
| 20 | United States | 26 |

**SQL technique:** CTE with `RANK() OVER (ORDER BY count DESC)` applied to pre-aggregated country counts.

### Insights

- **Mexico leads with 47 titles** — a counterintuitive finding given that US-produced content traditionally dominates global streaming. This signals a strong Latin American content strategy.
- **The United States ranks last (20th) among top producers** with 26 titles. This is a striking inversion of the typical Hollywood-first model and suggests an intentional focus on international originals.
- **Europe is strongly represented** — Italy (3rd), Sweden (4th), France (6th), Netherlands (7th), UK (12th), Denmark (13th), Spain (17th), Germany (19th) — showing deep European licensing relationships.
- **Asia has significant presence**: Japan (2nd), China (5th), South Korea (13th — tied). The South Korean wave (Hallyu) is reflected in a catalog that gives Korea equal footing with major Western markets.
- **Africa appears via Nigeria (8th tied)** — Nollywood's growing global footprint is acknowledged in the catalog, positioning the platform ahead of competitors on African content.
- **The rankings cluster tightly** between 26–47 titles per country, suggesting a deliberately balanced geographic spread rather than heavy concentration in any single region.

### Recommendation

The deliberate de-emphasis of US content is a differentiating strategy worth amplifying in marketing. Grouping titles by geographic origin in the UI (e.g., "Nordic Noir," "K-Drama," "Latin Stories") can improve discoverability and signal diversity to subscribers.

---

## 4. Audience Rating Segmentation

### Findings

| Rating | Count | % of Catalog |
|--------|-------|--------------|
| TV-MA (Mature) | 250 | 31.25% |
| TV-14 | 207 | 25.88% |
| TV-PG | 124 | 15.50% |
| R | 67 | 8.38% |
| PG-13 | 42 | 5.25% |
| TV-G | 41 | 5.13% |
| TV-Y7 | 30 | 3.75% |
| PG | 29 | 3.63% |
| G | 6 | 0.75% |
| NR | 4 | 0.50% |

**SQL technique:** `GROUP BY rating` with scalar subquery `(SELECT COUNT(*) FROM movies)` for percentage calculation.

### Insights

- **Mature content dominates**: TV-MA (31.25%) + R (8.38%) = **39.6% of the catalog** is adult-only. Combined with TV-14 (25.88%), content for audiences 14+ accounts for **65% of all titles**.
- **Family-friendly content is thin**: TV-G (5.13%) + TV-Y7 (3.75%) + G (0.75%) + PG (3.63%) + TV-PG (15.5%) = ~29% of the catalog. Of this, only ~13% is genuinely child-appropriate (G/PG/TV-G/TV-Y7).
- **TV ratings dominate film ratings**: TV-MA+TV-14+TV-PG+TV-G+TV-Y7 = 81% of the catalog, suggesting the catalog's 300 TV shows carry disproportionate rating variety compared to movies.
- **The R-rating gap** (8.38%) is notably lower than the 12–15% typically seen in theatrical film slates, suggesting that film acquisition favors TV-style ratings (TV-MA) over traditional MPAA classifications.

### Recommendation

If the platform has family subscription tiers, the content gap is significant — only ~100 titles are appropriate for children under 14. A targeted acquisition of 50–75 family-friendly titles would meaningfully shift this balance. Additionally, consider adding PG-13 films to bridge the teen gap between TV-14 and TV-MA.

---

## 5. Window Function Rankings — Genre Analysis

**SQL technique:** `RANK() OVER (PARTITION BY genre ORDER BY release_year DESC)` combined with `ROW_NUMBER()` — demonstrating classic analytical SQL patterns.

### Key observations

- **2023 is heavily represented at Rank 1** across almost every genre. This confirms consistent recent-year acquisition and suggests the catalog is kept up-to-date.
- **RANK() vs ROW_NUMBER() divergence is visible in Action**: three titles share Rank 1 (ties in release year), while ROW_NUMBER() forces a unique sequential number. This is the practical difference between the two functions in a real dataset.
- **Biography and Drama have the longest ranked lists** — 7+ entries at the top 5 ranks — reflecting their high volume in the dataset and the density of recent releases.
- **Fantasy shows a gap**: only one 2023 title (Rank 1), then a jump to 2021 (Rank 2). This two-year gap may indicate reduced Fantasy acquisitions in 2022.

---

## 6. Latest Title per Genre (ROW_NUMBER Dedup Pattern)

The top title in each of the 15 genres as of 2023:

| Genre | Latest Title | Year | Type |
|-------|-------------|------|------|
| Action | Zero Hour | 2023 | Movie |
| Adventure | Last Scream | 2023 | Movie |
| Animation | The Grand Journey | 2021 | Movie |
| Biography | A Life Well Lived | 2023 | Movie |
| Comedy | Broken Wings | 2023 | Movie |
| Crime | Cold Blood | 2023 | Movie |
| Documentary | The Real Story | 2023 | Movie |
| Drama | The Big Adventure | 2023 | Movie |
| Family | Dead Reckoning | 2023 | Movie |
| Fantasy | Shadow Play | 2023 | Movie |
| Horror | Last Scream | 2023 | Movie |
| Mystery | Cold Open S2 | 2023 | TV Show |
| Romance | The Real Story | 2023 | Movie |
| Sci-Fi | Rising Star | 2023 | Movie |
| Thriller | Dead Reckoning | 2023 | Movie |

**Notable:** Animation's most recent title is from 2021 — a two-year gap that stands out against every other genre having a 2023 entry. This points to a specific gap in animated content acquisition over the past two years.

---

## Summary of Findings & Strategic Recommendations

| Priority | Finding | Action |
|----------|---------|--------|
| High | Crime, Fantasy, Animation are underrepresented | Prioritize acquisition in these genres |
| High | Animation gap: no new titles since 2021 | Immediate acquisition of 10–15 animated titles |
| High | Family/children content is only ~13% of catalog | Targeted family content acquisition program |
| Medium | US content ranks last among top 20 producers | Leverage this as a marketing differentiator |
| Medium | 2016 production trough needs investigation | Audit licensing contracts for gap-risk years |
| Low | TV-MA is 31% of catalog | Monitor subscriber age demographics to validate fit |
| Low | South Korea & Nigeria at parity with major markets | Expand African and Korean content further |

---

*Analysis based on 800-title SQLite dataset. All SQL queries are documented in the dashboard with Show SQL toggles.*
