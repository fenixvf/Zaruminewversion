import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { worksTable } from "./works";

export const episodesTable = pgTable("episodes", {
  id: serial("id").primaryKey(),
  workId: integer("work_id").notNull().references(() => worksTable.id, { onDelete: "cascade" }),
  episodeNumber: integer("episode_number").notNull(),
  seasonNumber: integer("season_number"),
  title: text("title").notNull(),
  synopsis: text("synopsis"),
  thumbnailPath: text("thumbnail_path"),
  customThumbnailUrl: text("custom_thumbnail_url"),
  videoSlug: text("video_slug"),
  duration: integer("duration"),
  airDate: text("air_date"),
  tmdbEpisodeId: integer("tmdb_episode_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertEpisodeSchema = createInsertSchema(episodesTable).omit({ id: true, createdAt: true });
export type InsertEpisode = z.infer<typeof insertEpisodeSchema>;
export type Episode = typeof episodesTable.$inferSelect;
