import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, userProfilesTable, userVisitsTable } from "@workspace/db";

const router: IRouter = Router();

router.post("/visits", async (req, res): Promise<void> => {
  try {
    const { userId, page, action, metadata } = req.body;

    if (!userId || !page) {
      res.status(400).json({ error: "userId and page are required" });
      return;
    }

    await db.insert(userVisitsTable).values({
      userId: Number(userId),
      page,
      action,
      metadata: metadata || {},
    });

    res.status(201).json({ success: true });
  } catch (error) {
    console.error("Error tracking visit:", error);
    res.status(500).json({ error: "Failed to track visit" });
  }
});

router.get("/visits/:userId", async (req, res): Promise<void> => {
  try {
    const userId = Number(req.params.userId);
    
    const visits = await db
      .select()
      .from(userVisitsTable)
      .where(eq(userVisitsTable.userId, userId))
      .orderBy(userVisitsTable.createdAt)
      .limit(100);

    res.json(visits);
  } catch (error) {
    console.error("Error fetching visits:", error);
    res.status(500).json({ error: "Failed to fetch visits" });
  }
});

export default router;
