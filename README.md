# Movie Dataset Insight Database

An end-to-end SQL analytics project built on a Netflix-style movie and TV show dataset. The project demonstrates advanced SQL query design, a normalized relational schema, and an interactive analytics dashboard that visualizes query results in real time.

## Overview

This project was designed to showcase applied SQL data engineering — from schema design and data ingestion, through complex analytical queries using window functions and CTEs, to a production-ready visualization layer. It is suitable as a portfolio piece for data science and data engineering roles.

The dataset contains **800 titles** (500 Movies + 300 TV Shows) spanning **1995–2023**, across **15 genres** and **20 countries**.

## Tech Stack

| Layer | Technology |
|---|---|
| Database | SQLite (via `better-sqlite3`) |
| API Server | Node.js · Express 5 · TypeScript |
| Frontend | React 19 · Vite · Tailwind CSS v4 |
| Charts | Recharts |
| Data Tables | TanStack React Table |
| API Contract | OpenAPI 3.1 · Orval codegen |
| Package Manager | pnpm workspaces (monorepo) |

## Database Schema

```sql
-- Main content table
CREATE TABLE movies (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  title        TEXT    NOT NULL,
  type         TEXT    NOT NULL CHECK(type IN ('Movie', 'TV Show')),
  release_year INTEGER NOT NULL,
  rating       TEXT,
  duration     TEXT,
  country      TEXT,
  description  TEXT
);

-- Normalised many-to-many genres
CREATE TABLE movie_genres (
  movie_id INTEGER NOT NULL REFERENCES movies(id),
  genre    TEXT    NOT NULL,
  PRIMARY KEY (movie_id, genre)
);
```

Indexes are applied on `release_year`, `type`, `country`, and `genre` for optimal query performance.

## SQL Queries

### 1. Top Genres by Popularity

```sql
-- Rank genres by total content count.
-- Uses JOIN, GROUP BY, HAVING, and conditional aggregation (CASE WHEN)
-- to split counts between Movies and TV Shows.
SELECT
  mg.genre,
  COUNT(*) AS count,
  SUM(CASE WHEN m.type = 'Movie'   THEN 1 ELSE 0 END) AS movieCount,
  SUM(CASE WHEN m.type = 'TV Show' THEN 1 ELSE 0 END) AS tvShowCount
FROM movie_genres mg
JOIN movies m ON m.id = mg.movie_id
GROUP BY mg.genre
HAVING COUNT(*) >= 5
ORDER BY count DESC
LIMIT 15;
```

### 2. Yearly Content Trends

```sql
-- Show how content production has changed year-over-year.
-- Conditional aggregation splits totals into Movies vs TV Shows per year.
SELECT
  release_year AS year,
  COUNT(*) AS total,
  SUM(CASE WHEN type = 'Movie'   THEN 1 ELSE 0 END) AS movies,
  SUM(CASE WHEN type = 'TV Show' THEN 1 ELSE 0 END) AS tvShows
FROM movies
WHERE release_year IS NOT NULL
GROUP BY release_year
ORDER BY release_year ASC;
```

### 3. Country-Based Distribution

```sql
-- Identify which countries produce the most content.
-- Uses a CTE and the RANK() window function to assign a global rank.
WITH country_counts AS (
  SELECT
    country,
    COUNT(*) AS count
  FROM movies
  WHERE country IS NOT NULL AND country != ''
  GROUP BY country
  HAVING COUNT(*) >= 2
)
SELECT
  country,
  count,
  RANK() OVER (ORDER BY count DESC) AS rank
FROM country_counts
ORDER BY count DESC
LIMIT 20;
```

### 4. Genre Rankings with Window Functions

```sql
-- Rank movies within each genre by release year using RANK() and ROW_NUMBER().
-- PARTITION BY genre resets the rank counter for each genre.
-- Demonstrates: CTE + PARTITION BY + ORDER BY inside OVER()
WITH ranked AS (
  SELECT
    m.id,
    m.title,
    mg.genre,
    m.release_year                                          AS releaseYear,
    m.type,
    m.rating,
    m.country,
    RANK()       OVER (PARTITION BY mg.genre ORDER BY m.release_year DESC) AS rankInGenre,
    ROW_NUMBER() OVER (PARTITION BY mg.genre ORDER BY m.release_year DESC) AS rowNum
  FROM movies m
  JOIN movie_genres mg ON mg.movie_id = m.id
)
SELECT * FROM ranked
WHERE rankInGenre <= 5
ORDER BY genre ASC, rankInGenre ASC;
```

### 5. Audience Rating Breakdown

```sql
-- Distribution of content across rating categories.
-- Uses a scalar subquery to calculate percentage of the total.
SELECT
  rating,
  COUNT(*) AS count,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM movies), 2) AS percentage
FROM movies
WHERE rating IS NOT NULL AND rating != ''
GROUP BY rating
ORDER BY count DESC;
```

### 6. Latest Title per Genre (ROW_NUMBER dedup pattern)

```sql
-- Return the most recently released title in each genre.
-- Classic use of ROW_NUMBER() OVER (PARTITION BY ...) to deduplicate to one row per group.
WITH numbered AS (
  SELECT
    mg.genre,
    m.title,
    m.release_year AS releaseYear,
    m.type,
    m.rating,
    m.country,
    ROW_NUMBER() OVER (PARTITION BY mg.genre ORDER BY m.release_year DESC) AS rn
  FROM movies m
  JOIN movie_genres mg ON mg.movie_id = m.id
)
SELECT genre, title, releaseYear, type, rating, country
FROM numbered
WHERE rn = 1
ORDER BY genre ASC;
```

## Project Structure

```
.
├── artifacts/
│   ├── api-server/          # Express API server (TypeScript)
│   │   ├── src/
│   │   │   ├── routes/
│   │   │   │   └── movies.ts     # All SQL query endpoints
│   │   │   ├── db/
│   │   │   │   └── seed-movies.ts  # Database creation & seeding
│   │   │   └── app.ts
│   │   └── data/
│   │       └── movies.db         # SQLite database (auto-generated)
│   └── movie-analytics/     # React + Vite dashboard
│       └── src/
│           ├── pages/
│           │   └── dashboard.tsx # Main analytics dashboard
│           ├── components/
│           │   ├── sql-block.tsx # Collapsible SQL viewer
│           │   └── kpi-card.tsx  # KPI metric card
│           └── lib/
│               └── constants.ts  # SQL query strings & chart colors
├── lib/
│   ├── api-spec/            # OpenAPI 3.1 specification
│   │   └── openapi.yaml
│   ├── api-client-react/    # Auto-generated React Query hooks
│   └── api-zod/             # Auto-generated Zod schemas
└── README.md
```

## Dashboard Features

- **KPI Strip** — Total titles, movies, TV shows, and countries covered
- **Top Genres Chart** — Stacked bar chart (movies vs TV shows) with data table
- **Yearly Trends** — Area chart spanning 1995–2023, split by content type
- **Country Distribution** — Ranked bar chart with window-function rank column
- **Window Function Rankings** — Filterable table showing `RANK()` and `ROW_NUMBER()` in action per genre
- **Rating Breakdown** — Donut chart showing audience rating distribution
- **Top Title per Genre** — Clean table using the ROW_NUMBER dedup pattern
- **Show SQL toggle** — Every section exposes its exact SQL query in a collapsible code block
- **CSV export** per chart, **PDF export**, **dark mode toggle**, **auto-refresh**

## Running Locally

### Prerequisites

- Node.js 20+
- pnpm 9+

### Setup

```bash
# Install dependencies
pnpm install

# Start the API server (seeds SQLite DB on first run)
pnpm --filter @workspace/api-server run dev

# Start the frontend dashboard (in a separate terminal)
pnpm --filter @workspace/movie-analytics run dev
```

The dashboard will be available at `http://localhost:<PORT>/`.

### Regenerate API client from spec

```bash
pnpm --filter @workspace/api-spec run codegen
```

## Key SQL Concepts Demonstrated

| Concept | Where Used |
|---|---|
| `JOIN` (INNER) | Genres, Rankings, Top-by-Genre |
| `GROUP BY` + `HAVING` | Genres (filter groups with < 5 titles) |
| Conditional aggregation (`CASE WHEN`) | Genres, Yearly Trends |
| CTE (`WITH ... AS`) | Country Distribution, Rankings, Top-by-Genre |
| `RANK() OVER (PARTITION BY ...)` | Country Distribution, Rankings |
| `ROW_NUMBER() OVER (PARTITION BY ...)` | Rankings, Top-by-Genre |
| Scalar subquery | Rating Breakdown (percentage calc) |
| Index-backed filtering | All queries (release_year, type, country) |

## License

MIT
