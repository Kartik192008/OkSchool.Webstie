import { Router, type IRouter } from "express";
import { sql } from "drizzle-orm";
import { db, documentsTable, amazonProductsTable, mockTestsTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/admin/stats", async (_req, res): Promise<void> => {
  const [totals] = await db
    .select({
      totalViews: sql<number>`COALESCE(SUM(${documentsTable.viewCount}), 0)`.mapWith(Number),
      pdfDownloads: sql<number>`COALESCE(SUM(${documentsTable.pdfDownloads}), 0)`.mapWith(Number),
      wordDownloads: sql<number>`COALESCE(SUM(${documentsTable.wordDownloads}), 0)`.mapWith(Number),
      totalDocuments: sql<number>`COUNT(*)`.mapWith(Number),
    })
    .from(documentsTable);

  const recentDocuments = await db
    .select()
    .from(documentsTable)
    .orderBy(sql`${documentsTable.createdAt} DESC`)
    .limit(5);

  const sectionCounts = await db
    .select({
      category: documentsTable.category,
      count: sql<number>`COUNT(*)`.mapWith(Number),
    })
    .from(documentsTable)
    .groupBy(documentsTable.category);

  // Also add amazon products count
  const [amazonCount] = await db
    .select({ count: sql<number>`COUNT(*)`.mapWith(Number) })
    .from(amazonProductsTable);

  res.json({
    totalViews: totals?.totalViews ?? 0,
    pdfDownloads: totals?.pdfDownloads ?? 0,
    wordDownloads: totals?.wordDownloads ?? 0,
    totalDocuments: totals?.totalDocuments ?? 0,
    recentDocuments,
    sectionCounts: [
      ...sectionCounts,
      { category: "materials", count: amazonCount?.count ?? 0 },
    ],
  });
});

export default router;
