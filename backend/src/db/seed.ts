/**
 * Seed script for development/testing.
 *
 * Usage:
 *   DATABASE_URL=postgres://... npx tsx src/db/seed.ts
 */

import { db } from "./index.js";
import { users, movies, ratings } from "./schema.js";

async function seed() {
  console.log("🌱 Seeding database...");

  // ── Users ──
  const [alice, bob] = await db
    .insert(users)
    .values([
      { email: "alice@example.com", username: "alice" },
      { email: "bob@example.com", username: "bob", avatarUrl: "https://i.pravatar.cc/150?u=bob" },
    ])
    .returning();

  // ── Movies ──
  const [inception, parasite, moonlight] = await db
    .insert(movies)
    .values([
      {
        tmdbId: 27205,
        title: "Inception",
        year: 2010,
        posterUrl: "https://image.tmdb.org/t/p/w500/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg",
        overview: "A thief who steals corporate secrets through dream-sharing technology.",
        genres: ["Action", "Science Fiction", "Adventure"],
      },
      {
        tmdbId: 496243,
        title: "Parasite",
        year: 2019,
        posterUrl: "https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg",
        overview: "All unemployed, Ki-taek's family takes peculiar interest in the wealthy Park family.",
        genres: ["Comedy", "Thriller", "Drama"],
      },
      {
        tmdbId: 376867,
        title: "Moonlight",
        year: 2016,
        posterUrl: "https://image.tmdb.org/t/p/w500/4911T5FbJ9eD2Faz5Z8cT3SUhU3.jpg",
        overview: "The tender, heartbreaking story of a young man's struggle to find himself.",
        genres: ["Drama"],
      },
    ])
    .returning();

  // ── Ratings ──
  await db.insert(ratings).values([
    { userId: alice.id, movieId: inception.id, sentiment: "loved", score: 9.2, rankPos: 1 },
    { userId: alice.id, movieId: parasite.id, sentiment: "loved", score: 9.0, rankPos: 2 },
    { userId: alice.id, movieId: moonlight.id, sentiment: "liked", score: 7.5, rankPos: 3 },
    { userId: bob.id, movieId: parasite.id, sentiment: "loved", score: 9.5, rankPos: 1 },
    { userId: bob.id, movieId: inception.id, sentiment: "meh", score: 5.0, rankPos: 2 },
  ]);

  console.log("✅ Seeded 2 users, 3 movies, 5 ratings");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
