import { Router, type IRouter } from "express";
import { desc, sql } from "drizzle-orm";
import { db, worksTable, episodesTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/analytics/top10", async (_req, res): Promise<void> => {
  const works = await db
    .select({
      id: worksTable.id,
      tmdbId: worksTable.tmdbId,
      title: worksTable.title,
      posterPath: worksTable.posterPath,
      customThumbnailUrl: worksTable.customThumbnailUrl,
      type: worksTable.type,
      viewCount: worksTable.viewCount,
    })
    .from(worksTable)
    .orderBy(desc(worksTable.viewCount))
    .limit(10);

  const result = works.map((w, i) => ({ ...w, rank: i + 1 }));
  res.json(result);
});

router.get("/analytics/stats", async (_req, res): Promise<void> => {
  const [worksStats, episodeCount, viewsResult] = await Promise.all([
    db.select({
      total: sql<number>`count(*)`,
      ongoing: sql<number>`count(*) filter (where status = 'ongoing')`,
      completed: sql<number>`count(*) filter (where status = 'completed')`,
    }).from(worksTable),
    db.select({ count: sql<number>`count(*)` }).from(episodesTable),
    db.select({ total: sql<number>`sum(view_count)` }).from(worksTable),
  ]);

  res.json({
    totalWorks: Number(worksStats[0]?.total ?? 0),
    totalEpisodes: Number(episodeCount[0]?.count ?? 0),
    totalViews: Number(viewsResult[0]?.total ?? 0),
    ongoingCount: Number(worksStats[0]?.ongoing ?? 0),
    completedCount: Number(worksStats[0]?.completed ?? 0),
  });
});

export default router;
