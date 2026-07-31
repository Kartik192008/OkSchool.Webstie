import { Router, type IRouter } from "express";
import { ilike, or } from "drizzle-orm";
import { db, documentsTable, amazonProductsTable, mockTestsTable } from "@workspace/db";
import { GlobalSearchQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/search", async (req, res): Promise<void> => {
  const parsed = GlobalSearchQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { q } = parsed.data;

  const [documents, amazonProducts, mockTests] = await Promise.all([
    db
      .select()
      .from(documentsTable)
      .where(
        or(
          ilike(documentsTable.title, `%${q}%`),
          ilike(documentsTable.description, `%${q}%`)
        )
      )
      .limit(10),
    db
      .select()
      .from(amazonProductsTable)
      .where(
        or(
          ilike(amazonProductsTable.title, `%${q}%`),
          ilike(amazonProductsTable.description, `%${q}%`)
        )
      )
      .limit(5),
    db
      .select()
      .from(mockTestsTable)
      .where(
        or(
          ilike(mockTestsTable.title, `%${q}%`),
          ilike(mockTestsTable.description, `%${q}%`),
          ilike(mockTestsTable.subject, `%${q}%`)
        )
      )
      .limit(5),
  ]);

  res.json({ documents, amazonProducts, mockTests });
});

export default router;
