import { Router } from "express";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, "../../data/movies.db");

let _db: Database.Database | null = null;

function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH, { readonly: true });
    _db.pragma("journal_mode = WAL");
  }
  return _db;
}

const router = Router();

// ─── KPI stats ───────────────────────────────────────────────────────────────
router.get("/movies/stats", (req, res): void => {
  const db = getDb();

  /*
   * PURPOSE: High-level summary statistics for the dataset.
   * Uses COUNT, MIN, MAX aggregates with a subquery for distinct genre counts.
   */
  const row = db.prepare(`
    SELECT
      COUNT(*)                                      AS totalTitles,
      SUM(CASE WHEN type = 'Movie'   THEN 1 ELSE 0 END) AS totalMovies,
      SUM(CASE WHEN type = 'TV Show' THEN 1 ELSE 0 END) AS totalTvShows,
      COUNT(DISTINCT country)                       AS totalCountries,
      MIN(release_year)                             AS oldestYear,
      MAX(release_year)                             AS newestYear
    FROM movies
  `).get() as Record<string, number>;

  const genreRow = db.prepare(`
    SELECT COUNT(DISTINCT genre) AS totalGenres FROM movie_genres
  `).get() as { totalGenres: number };

  res.json({
    totalTitles:   row.totalTitles,
    totalMovies:   row.totalMovies,
    totalTvShows:  row.totalTvShows,
    totalCountries: row.totalCountries,
    totalGenres:   genreRow.totalGenres,
    oldestYear:    row.oldestYear,
    newestYear:    row.newestYear,
  });
});

// ─── Top genres ───────────────────────────────────────────────────────────────
router.get("/movies/genres", (req, res): void => {
  const db = getDb();

  /*
   * PURPOSE: Rank genres by total content count.
   * Uses JOIN between movies and movie_genres, GROUP BY genre,
   * HAVING to filter genres with at least 5 titles,
   * and conditional aggregation to split by type.
   */
  const rows = db.prepare(`
    SELECT
      mg.genre,
      COUNT(*)                                           AS count,
      SUM(CASE WHEN m.type = 'Movie'   THEN 1 ELSE 0 END) AS movieCount,
      SUM(CASE WHEN m.type = 'TV Show' THEN 1 ELSE 0 END) AS tvShowCount
    FROM movie_genres mg
    JOIN movies m ON m.id = mg.movie_id
    GROUP BY mg.genre
    HAVING COUNT(*) >= 5
    ORDER BY count DESC
    LIMIT 15
  `).all();

  res.json(rows);
});

// ─── Yearly trends ────────────────────────────────────────────────────────────
router.get("/movies/yearly-trends", (req, res): void => {
  const db = getDb();

  /*
   * PURPOSE: Show how content production has changed year-over-year.
   * Uses GROUP BY release_year with conditional aggregation (CASE WHEN)
   * to split totals into Movies vs TV Shows per year.
   */
  const rows = db.prepare(`
    SELECT
      release_year                                       AS year,
      COUNT(*)                                           AS total,
      SUM(CASE WHEN type = 'Movie'   THEN 1 ELSE 0 END) AS movies,
      SUM(CASE WHEN type = 'TV Show' THEN 1 ELSE 0 END) AS tvShows
    FROM movies
    WHERE release_year IS NOT NULL
    GROUP BY release_year
    ORDER BY release_year ASC
  `).all();

  res.json(rows);
});

// ─── Country distribution ─────────────────────────────────────────────────────
router.get("/movies/countries", (req, res): void => {
  const db = getDb();

  /*
   * PURPOSE: Identify which countries produce the most content.
   * Uses GROUP BY country, a window function RANK() OVER to assign
   * a global rank, and HAVING to exclude null/empty countries.
   */
  const rows = db.prepare(`
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
    LIMIT 20
  `).all();

  res.json(rows);
});

// ─── Window-function rankings ─────────────────────────────────────────────────
router.get("/movies/rankings", (req, res): void => {
  const db = getDb();

  /*
   * PURPOSE: Demonstrate advanced window functions — RANK() and ROW_NUMBER().
   * Each movie is ranked within its genre by release_year DESC,
   * so rank 1 = the most recent title in that genre.
   * ROW_NUMBER() provides a unique sequential number within the partition.
   */
  const rows = db.prepare(`
    WITH ranked AS (
      SELECT
        m.id,
        m.title,
        mg.genre,
        m.release_year   AS releaseYear,
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
    ORDER BY genre ASC, rankInGenre ASC
  `).all();

  res.json(rows);
});

// ─── Rating breakdown ─────────────────────────────────────────────────────────
router.get("/movies/rating-breakdown", (req, res): void => {
  const db = getDb();

  /*
   * PURPOSE: Distribution of content across audience rating categories.
   * Uses GROUP BY rating with a calculated percentage using a
   * subquery for total row count — a common analytic pattern.
   */
  const rows = db.prepare(`
    SELECT
      rating,
      COUNT(*)                                    AS count,
      ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM movies), 2) AS percentage
    FROM movies
    WHERE rating IS NOT NULL AND rating != ''
    GROUP BY rating
    ORDER BY count DESC
  `).all();

  res.json(rows);
});

// ─── Top movie per genre ──────────────────────────────────────────────────────
router.get("/movies/top-by-genre", (req, res): void => {
  const db = getDb();

  /*
   * PURPOSE: Show the most recently released title in each genre.
   * Uses ROW_NUMBER() window function partitioned by genre, ordered by
   * release_year DESC — then filters to row_num = 1 to get the top entry.
   */
  const rows = db.prepare(`
    WITH numbered AS (
      SELECT
        mg.genre,
        m.title,
        m.release_year   AS releaseYear,
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
    ORDER BY genre ASC
  `).all();

  res.json(rows);
});

export default router;
