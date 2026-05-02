export const CHART_COLORS = {
  blue: "#0079F2",
  purple: "#795EFF",
  green: "#009118",
  red: "#A60808",
  pink: "#ec4899",
};

export const CHART_COLOR_LIST = [
  CHART_COLORS.blue,
  CHART_COLORS.purple,
  CHART_COLORS.green,
  CHART_COLORS.red,
  CHART_COLORS.pink,
];

export const DATA_SOURCES: string[] = ["Netflix App DB"];

export const SQL_QUERIES = {
  topGenres: `SELECT mg.genre, COUNT(*) AS count, SUM(CASE WHEN m.type='Movie' THEN 1 ELSE 0 END) AS movieCount, SUM(CASE WHEN m.type='TV Show' THEN 1 ELSE 0 END) AS tvShowCount FROM movie_genres mg JOIN movies m ON m.id=mg.movie_id GROUP BY mg.genre HAVING COUNT(*) >= 5 ORDER BY count DESC LIMIT 15`,
  yearlyTrends: `SELECT release_year AS year, COUNT(*) AS total, SUM(CASE WHEN type='Movie' THEN 1 ELSE 0 END) AS movies, SUM(CASE WHEN type='TV Show' THEN 1 ELSE 0 END) AS tvShows FROM movies WHERE release_year IS NOT NULL GROUP BY release_year ORDER BY release_year ASC`,
  countryDistribution: `WITH country_counts AS (SELECT country, COUNT(*) AS count FROM movies WHERE country IS NOT NULL GROUP BY country HAVING COUNT(*) >= 2) SELECT country, count, RANK() OVER (ORDER BY count DESC) AS rank FROM country_counts ORDER BY count DESC LIMIT 20`,
  movieRankings: `WITH ranked AS (SELECT m.id, m.title, mg.genre, m.release_year, m.type, m.rating, m.country, RANK() OVER (PARTITION BY mg.genre ORDER BY m.release_year DESC) AS rankInGenre, ROW_NUMBER() OVER (PARTITION BY mg.genre ORDER BY m.release_year DESC) AS rowNum FROM movies m JOIN movie_genres mg ON mg.movie_id=m.id) SELECT * FROM ranked WHERE rankInGenre <= 5 ORDER BY genre, rankInGenre`,
  ratingBreakdown: `SELECT rating, COUNT(*) AS count, ROUND(COUNT(*)*100.0/(SELECT COUNT(*) FROM movies),2) AS percentage FROM movies WHERE rating IS NOT NULL GROUP BY rating ORDER BY count DESC`,
  topByGenre: `WITH numbered AS (SELECT mg.genre, m.title, m.release_year, m.type, m.rating, m.country, ROW_NUMBER() OVER (PARTITION BY mg.genre ORDER BY m.release_year DESC) AS rn FROM movies m JOIN movie_genres mg ON mg.movie_id=m.id) SELECT genre, title, releaseYear, type, rating, country FROM numbered WHERE rn=1 ORDER BY genre`,
};
