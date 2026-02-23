import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  real,
  timestamp,
  jsonb,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

// ── Users ──────────────────────────────────────────────
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  supabaseId: text("supabase_id").unique(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ── Movies (TMDB cache) ───────────────────────────────
export const movies = pgTable(
  "movies",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tmdbId: integer("tmdb_id").notNull().unique(),
    title: varchar("title", { length: 500 }).notNull(),
    year: integer("year"),
    posterUrl: text("poster_url"),
    overview: text("overview"),
    genres: jsonb("genres").$type<string[]>(),
    tmdbData: jsonb("tmdb_data"),
    cachedAt: timestamp("cached_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("movies_tmdb_id_idx").on(table.tmdbId),
  ],
);

// ── Ratings ───────────────────────────────────────────
export const ratings = pgTable(
  "ratings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    movieId: uuid("movie_id")
      .notNull()
      .references(() => movies.id, { onDelete: "cascade" }),
    sentiment: varchar("sentiment", { length: 20 }).notNull(), // e.g. "loved", "liked", "meh", "disliked"
    score: real("score"), // computed ranking score
    rankPos: integer("rank_pos"), // position in user's ranked list
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("ratings_user_movie_idx").on(table.userId, table.movieId),
    index("ratings_user_id_idx").on(table.userId),
  ],
);
