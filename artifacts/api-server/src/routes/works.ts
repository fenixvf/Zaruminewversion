import { Router, type IRouter } from "express";
import { eq, desc, sql, ilike, or } from "drizzle-orm";
import { db, worksTable, episodesTable } from "@workspace/db";
import {
  ListWorksQueryParams,
  CreateWorkBody,
  GetWorkParams,
  UpdateWorkParams,
  UpdateWorkBody,
  DeleteWorkParams,
  ListEpisodesParams,
  AddEpisodeParams,
  AddEpisodeBody,
  UpdateEpisodeParams,
  UpdateEpisodeBody,
  DeleteEpisodeParams,
  RecordViewParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/works", async (req, res): Promise<void> => {
  const parsed = ListWorksQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { page, limit, genre } = parsed.data;
  const offset = ((page ?? 1) - 1) * (limit ?? 20);

  let query = db.select().from(worksTable).$dynamic();

  if (genre) {
    query = query.where(sql`${genre} = ANY(${worksTable.genres})`);
  }

  const [works, countResult] = await Promise.all([
    query.orderBy(desc(worksTable.createdAt)).limit(limit ?? 20).offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(worksTable),
  ]);

  res.json({
    works,
    total: Number(countResult[0]?.count ?? 0),
    page: page ?? 1,
    limit: limit ?? 20,
  });
});

router.post("/works", async (req, res): Promise<void> => {
  const parsed = CreateWorkBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [work] = await db.insert(worksTable).values({
    tmdbId: parsed.data.tmdbId,
    title: parsed.data.title,
    originalTitle: parsed.data.originalTitle ?? null,
    synopsis: parsed.data.synopsis ?? null,
    posterPath: parsed.data.posterPath ?? null,
    backdropPath: parsed.data.backdropPath ?? null,
    customBannerUrl: parsed.data.customBannerUrl ?? null,
    customThumbnailUrl: parsed.data.customThumbnailUrl ?? null,
    type: parsed.data.type ?? "tv",
    status: parsed.data.status ?? "ongoing",
    genres: parsed.data.genres ?? [],
    releaseYear: parsed.data.releaseYear ?? null,
    totalEpisodes: parsed.data.totalEpisodes ?? null,
    rating: parsed.data.rating ?? null,
    isFeatured: parsed.data.isFeatured ?? false,
  }).returning();

  res.status(201).json(work);
});

router.get("/works/recent", async (req, res): Promise<void> => {
  const limit = Number(req.query.limit) || 12;
  const works = await db
    .select()
    .from(worksTable)
    .orderBy(desc(worksTable.createdAt))
    .limit(limit);
  res.json(works);
});

router.get("/works/featured", async (req, res): Promise<void> => {
  const works = await db
    .select()
    .from(worksTable)
    .where(eq(worksTable.isFeatured, true))
    .orderBy(desc(worksTable.createdAt))
    .limit(10);
  res.json(works);
});

router.get("/works/:id", async (req, res): Promise<void> => {
  const params = GetWorkParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [work] = await db
    .select()
    .from(worksTable)
    .where(eq(worksTable.id, params.data.id));

  if (!work) {
    res.status(404).json({ error: "Work not found" });
    return;
  }

  res.json(work);
});

router.put("/works/:id", async (req, res): Promise<void> => {
  const params = UpdateWorkParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateWorkBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.title != null) updateData.title = parsed.data.title;
  if (parsed.data.synopsis != null) updateData.synopsis = parsed.data.synopsis;
  if (parsed.data.customBannerUrl != null) updateData.customBannerUrl = parsed.data.customBannerUrl;
  if (parsed.data.customThumbnailUrl != null) updateData.customThumbnailUrl = parsed.data.customThumbnailUrl;
  if (parsed.data.status != null) updateData.status = parsed.data.status;
  if (parsed.data.isFeatured != null) updateData.isFeatured = parsed.data.isFeatured;
  if (parsed.data.posterPath != null) updateData.posterPath = parsed.data.posterPath;
  if (parsed.data.backdropPath != null) updateData.backdropPath = parsed.data.backdropPath;
  if (parsed.data.genres != null) updateData.genres = parsed.data.genres;
  if (parsed.data.rating != null) updateData.rating = parsed.data.rating;
  if (parsed.data.viewCount != null) updateData.viewCount = parsed.data.viewCount;

  const [work] = await db
    .update(worksTable)
    .set(updateData)
    .where(eq(worksTable.id, params.data.id))
    .returning();

  if (!work) {
    res.status(404).json({ error: "Work not found" });
    return;
  }

  res.json(work);
});

router.delete("/works/:id", async (req, res): Promise<void> => {
  const params = DeleteWorkParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [work] = await db
    .delete(worksTable)
    .where(eq(worksTable.id, params.data.id))
    .returning();

  if (!work) {
    res.status(404).json({ error: "Work not found" });
    return;
  }

  res.sendStatus(204);
});

router.get("/works/:id/episodes", async (req, res): Promise<void> => {
  const params = ListEpisodesParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const episodes = await db
    .select()
    .from(episodesTable)
    .where(eq(episodesTable.workId, params.data.id))
    .orderBy(episodesTable.seasonNumber, episodesTable.episodeNumber);

  res.json(episodes);
});

router.post("/works/:id/episodes", async (req, res): Promise<void> => {
  const params = AddEpisodeParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = AddEpisodeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [episode] = await db.insert(episodesTable).values({
    workId: params.data.id,
    episodeNumber: parsed.data.episodeNumber,
    seasonNumber: parsed.data.seasonNumber ?? null,
    title: parsed.data.title,
    synopsis: parsed.data.synopsis ?? null,
    thumbnailPath: parsed.data.thumbnailPath ?? null,
    customThumbnailUrl: parsed.data.customThumbnailUrl ?? null,
    videoSlug: parsed.data.videoSlug ?? null,
    duration: parsed.data.duration ?? null,
    airDate: parsed.data.airDate ?? null,
    tmdbEpisodeId: parsed.data.tmdbEpisodeId ?? null,
  }).returning();

  res.status(201).json(episode);
});

router.put("/works/:workId/episodes/:episodeId", async (req, res): Promise<void> => {
  const params = UpdateEpisodeParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateEpisodeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.episodeNumber !== undefined && parsed.data.episodeNumber != null) updateData.episodeNumber = parsed.data.episodeNumber;
  if (parsed.data.title !== undefined && parsed.data.title != null) updateData.title = parsed.data.title;
  if (parsed.data.synopsis !== undefined) updateData.synopsis = parsed.data.synopsis ?? null;
  if (parsed.data.customThumbnailUrl !== undefined) updateData.customThumbnailUrl = parsed.data.customThumbnailUrl ?? null;
  if (parsed.data.videoSlug !== undefined) updateData.videoSlug = parsed.data.videoSlug ?? null;
  if (parsed.data.duration !== undefined) updateData.duration = parsed.data.duration ?? null;

  const [episode] = await db
    .update(episodesTable)
    .set(updateData)
    .where(
      eq(episodesTable.id, params.data.episodeId)
    )
    .returning();

  if (!episode) {
    res.status(404).json({ error: "Episode not found" });
    return;
  }

  res.json(episode);
});

router.delete("/works/:workId/episodes/:episodeId", async (req, res): Promise<void> => {
  const params = DeleteEpisodeParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [episode] = await db
    .delete(episodesTable)
    .where(eq(episodesTable.id, params.data.episodeId))
    .returning();

  if (!episode) {
    res.status(404).json({ error: "Episode not found" });
    return;
  }

  res.sendStatus(204);
});

router.post("/works/:id/view", async (req, res): Promise<void> => {
  const params = RecordViewParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [work] = await db
    .update(worksTable)
    .set({ viewCount: sql`${worksTable.viewCount} + 1` })
    .where(eq(worksTable.id, params.data.id))
    .returning({ viewCount: worksTable.viewCount });

  if (!work) {
    res.status(404).json({ error: "Work not found" });
    return;
  }

  res.json({ viewCount: work.viewCount });
});

export default router;
