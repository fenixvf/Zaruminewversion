import { pgTable, text, serial, timestamp, integer, boolean, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const worksTable = pgTable("works", {
  id: serial("id").primaryKey(),
  tmdbId: integer("tmdb_id").notNull(),
  title: text("title").notNull(),
  originalTitle: text("original_title"),
  synopsis: text("synopsis"),
  posterPath: text("poster_path"),
  backdropPath: text("backdrop_path"),
  customBannerUrl: text("custom_banner_url"),
  customThumbnailUrl: text("custom_thumbnail_url"),
  type: text("type").notNull().default("tv"),
  status: text("status").notNull().default("ongoing"),
  genres: text("genres").array().notNull().default([]),
  releaseYear: integer("release_year"),
  totalEpisodes: integer("total_episodes"),
  rating: real("rating"),
  isFeatured: boolean("is_featured").notNull().default(false),
  viewCount: integer("view_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertWorkSchema = createInsertSchema(worksTable).omit({ id: true, viewCount: true, createdAt: true });
export type InsertWork = z.infer<typeof insertWorkSchema>;
export type Work = typeof worksTable.$inferSelect;
