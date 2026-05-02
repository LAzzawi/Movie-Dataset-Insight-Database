/**
 * Seeds a SQLite database with a realistic Netflix-style movie/TV show dataset.
 * Run once on startup if the DB file doesn't exist.
 */
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "../../data");
const DB_PATH = path.join(DATA_DIR, "movies.db");

const GENRES = [
  "Drama", "Comedy", "Action", "Thriller", "Romance", "Documentary",
  "Horror", "Sci-Fi", "Animation", "Crime", "Fantasy", "Biography",
  "Adventure", "Family", "Mystery",
];

const COUNTRIES = [
  "United States", "United Kingdom", "India", "France", "Germany",
  "Japan", "South Korea", "Canada", "Australia", "Spain", "Italy",
  "Brazil", "Mexico", "China", "Nigeria", "Sweden", "Denmark",
  "Turkey", "Argentina", "Netherlands",
];

const RATINGS = ["TV-MA", "TV-14", "TV-PG", "TV-G", "TV-Y7", "R", "PG-13", "PG", "G", "NR"];
const RATING_WEIGHTS = [30, 25, 15, 5, 5, 8, 6, 4, 1, 1];

const MOVIE_TITLES: Record<string, string[]> = {
  Drama:       ["Echoes of Tomorrow", "The Last Chapter", "Silent Waters", "Broken Wings", "A Quiet Storm", "The Weight of Words", "Fading Light", "Crimson Sunset", "The Inheritance", "Two Worlds"],
  Comedy:      ["Laugh Track", "Happy Accidents", "The Funny Bone", "Misadventures Inc", "Comedy of Errors", "Weekend Chaos", "Office Shenanigans", "Family Circus", "Love Actually Not", "Totally Normal"],
  Action:      ["Strike Force", "Code Red", "Iron Fist", "Thunder Road", "Black Hawk", "Steel Rain", "Fury Road Rising", "Double Impact", "Ghost Protocol", "Zero Hour"],
  Thriller:    ["Dark Passenger", "The Watcher", "Paranoia", "Shadow Play", "Dead Reckoning", "Mind Games", "Final Witness", "The Setup", "Cold Case Files", "Blind Spot"],
  Romance:     ["Summer Hearts", "When We Met", "Love in Paris", "Starlight Romance", "The Promise", "Second Chances", "Forever After", "Heart & Soul", "The Long Way Home", "Sweet Surrender"],
  Documentary: ["Planet in Crisis", "Human Stories", "The Truth About", "Inside the Machine", "Wild Kingdom", "Deep Dive", "The Making Of", "Behind Closed Doors", "Untold Stories", "The Real Story"],
  Horror:      ["Nightmare House", "The Cursed", "Dark Awakening", "Fear Factor", "The Haunting", "Blood Moon", "Dread Night", "Last Scream", "The Entity", "Wicked Game"],
  "Sci-Fi":    ["Galactic Odyssey", "Future State", "Quantum Leap", "The Expanse Beyond", "Neural Network", "Time Paradox", "Void Walker", "Digital Mind", "Star Chaser", "Event Horizon 2"],
  Animation:   ["Tiny Adventures", "The Magic Kingdom", "Animated World", "Cartoon Universe", "Dream Factory", "Color Land", "The Great Journey", "Little Heroes", "Pixel Quest", "Fantasy Isle"],
  Crime:       ["The Godfather Legacy", "Heist Masters", "Dark Money", "The Syndicate", "Crime Wave", "Cold Blood", "The Cartel Files", "Law Breakers", "The Inside Job", "Street Justice"],
  Fantasy:     ["Kingdom of Shadows", "The Dragon's Call", "Enchanted Realms", "Myth & Magic", "The Sorcerer's Path", "Ancient Prophecy", "Realm of Fire", "The Quest", "Wizard's Keep", "Dark Forest"],
  Biography:   ["Against All Odds", "The Visionary", "Rising Star", "The Pioneer", "Legacy of Greatness", "Unbreakable Will", "Behind the Name", "The Untold Life", "A Life Well Lived", "Portrait of Courage"],
  Adventure:   ["Into the Wild Blue", "Expedition Unknown", "Beyond the Horizon", "The Grand Journey", "Lost World", "Treasure Hunt", "Into the Deep", "Mountain Challenge", "River Run", "Desert Crossing"],
  Family:      ["Together We Stand", "Family Ties", "Home for the Holidays", "Growing Pains", "The Big Adventure", "Family Road Trip", "Our Story", "The Reunion", "Childhood Dreams", "Back to Basics"],
  Mystery:     ["The Missing Piece", "Who Done It", "The Secret Room", "Vanishing Act", "The Lost Clue", "Unravel", "Detective Files", "The Cold Case", "Hidden Truth", "The Riddle"],
};

const TV_SHOW_TITLES: Record<string, string[]> = {
  Drama:       ["The Long Game", "Seasons Turn", "Breaking Point", "The Firm", "Blood & Sand", "Revelations", "The Alliance", "Power Play", "Dark Secrets", "Inner Circle"],
  Comedy:      ["Sitcom Life", "The Office Hours", "Happy Days Again", "Neighborhood Watch", "Party Line", "The Side Hustle", "Between Friends", "Rooftop Views", "The Flatmates", "Lunch Break"],
  Action:      ["Strike Team", "Covert Ops", "Danger Zone", "Night Shift", "Red Unit", "Tactical Response", "The Agency", "Field Ops", "Combat Ready", "The Division"],
  Thriller:    ["Mind Control", "The Informant", "Dead Air", "False Flag", "Sleeper Cell", "The Protocol", "Black Site", "Internal Affairs", "Double Agent", "The Network"],
  Documentary: ["Our Planet", "Humanity Explored", "The World According To", "Nature's Way", "Science Explained", "History Revealed", "The Investigation", "Society Today", "Future World", "People & Places"],
  Horror:      ["Haunted Hollow", "The Darkness Within", "Fear Street Chronicles", "Nightmare Season", "Cursed Town", "The Visitor", "After Dark", "The Awakening", "Sinister Six", "Evil Returns"],
  "Sci-Fi":    ["Space Colony", "Future Earth", "The Grid", "Parallel Lives", "AI Rising", "The Upload", "Altered States", "New Worlds", "The Simulation", "Beyond Terra"],
  Animation:   ["Toon Squad", "Animated Adventures", "The Cartoon Files", "Pixel Pals", "Drawing Board", "Color Crew", "Art Attack", "Sketch Show", "The Line", "Frame by Frame"],
  Crime:       ["The Precinct", "Cold Case Unit", "Murder Board", "The Detective", "Crime Scene", "Blue Code", "The Squad", "Undercover", "The Witness", "Missing Persons"],
  Family:      ["Family Matters Again", "Growing Up", "The Household", "Parents Know Best", "Sibling Rivalry", "Home Rules", "The Kids Are Alright", "Family Business", "Together Time", "House Rules"],
  Mystery:     ["Cold Open", "The Investigator", "Unsolved Files", "Deeper Secrets", "Clue Hunters", "The Puzzle", "Hidden Agenda", "The Conspiracy", "Trail Goes Cold", "Open Case"],
};

function pickWeighted(items: string[], weights: number[]): string {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickGenres(count: number): string[] {
  const shuffled = [...GENRES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export function seedDatabase(): void {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

  if (fs.existsSync(DB_PATH)) return; // already seeded

  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");

  // ── Schema ─────────────────────────────────────────────────────────────────
  db.exec(`
    -- Main content table
    CREATE TABLE IF NOT EXISTS movies (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      title        TEXT    NOT NULL,
      type         TEXT    NOT NULL CHECK(type IN ('Movie', 'TV Show')),
      release_year INTEGER NOT NULL,
      rating       TEXT,
      duration     TEXT,
      country      TEXT,
      description  TEXT
    );

    -- Normalised genres (many-to-many)
    CREATE TABLE IF NOT EXISTS movie_genres (
      movie_id INTEGER NOT NULL REFERENCES movies(id),
      genre    TEXT    NOT NULL,
      PRIMARY KEY (movie_id, genre)
    );

    CREATE INDEX IF NOT EXISTS idx_movies_year    ON movies(release_year);
    CREATE INDEX IF NOT EXISTS idx_movies_type    ON movies(type);
    CREATE INDEX IF NOT EXISTS idx_movies_country ON movies(country);
    CREATE INDEX IF NOT EXISTS idx_genres_genre   ON movie_genres(genre);
  `);

  const insertMovie = db.prepare(`
    INSERT INTO movies (title, type, release_year, rating, duration, country, description)
    VALUES (@title, @type, @release_year, @rating, @duration, @country, @description)
  `);
  const insertGenre = db.prepare(`
    INSERT OR IGNORE INTO movie_genres (movie_id, genre) VALUES (?, ?)
  `);

  const seed = db.transaction(() => {
    // Generate ~500 movies and ~300 TV shows spanning 1995–2023
    for (let i = 0; i < 500; i++) {
      const releaseYear = 1995 + Math.floor(Math.random() * 29);
      const rating = pickWeighted(RATINGS, RATING_WEIGHTS);
      const genres = pickGenres(1 + Math.floor(Math.random() * 3));
      const primaryGenre = genres[0];
      const titlePool = MOVIE_TITLES[primaryGenre] ?? MOVIE_TITLES["Drama"];
      const title = `${pick(titlePool)} (${i % 30 === 0 ? "Part 2" : releaseYear})`;
      const duration = `${70 + Math.floor(Math.random() * 90)} min`;
      const country = pick(COUNTRIES);
      const country2 = Math.random() > 0.7 ? `, ${pick(COUNTRIES)}` : "";

      const { lastInsertRowid } = insertMovie.run({
        title,
        type: "Movie",
        release_year: releaseYear,
        rating,
        duration,
        country: country + country2,
        description: `A compelling ${primaryGenre.toLowerCase()} film released in ${releaseYear}.`,
      });

      for (const g of genres) insertGenre.run(lastInsertRowid, g);
    }

    for (let i = 0; i < 300; i++) {
      const releaseYear = 1998 + Math.floor(Math.random() * 26);
      const rating = pickWeighted(RATINGS, RATING_WEIGHTS);
      const genres = pickGenres(1 + Math.floor(Math.random() * 2));
      const primaryGenre = genres[0];
      const titlePool = TV_SHOW_TITLES[primaryGenre] ?? TV_SHOW_TITLES["Drama"];
      const title = `${pick(titlePool)} S${1 + Math.floor(Math.random() * 5)}`;
      const seasons = 1 + Math.floor(Math.random() * 8);
      const country = pick(COUNTRIES);

      const { lastInsertRowid } = insertMovie.run({
        title,
        type: "TV Show",
        release_year: releaseYear,
        rating,
        duration: `${seasons} Season${seasons > 1 ? "s" : ""}`,
        country,
        description: `An engaging ${primaryGenre.toLowerCase()} series with ${seasons} season(s).`,
      });

      for (const g of genres) insertGenre.run(lastInsertRowid, g);
    }
  });

  seed();
  db.close();
  console.log("✅ Movie database seeded at", DB_PATH);
}
