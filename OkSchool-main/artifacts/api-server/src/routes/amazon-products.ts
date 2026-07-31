import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, amazonProductsTable } from "@workspace/db";
import {
  CreateAmazonProductBody,
  UpdateAmazonProductParams,
  UpdateAmazonProductBody,
  DeleteAmazonProductParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/amazon-products", async (_req, res): Promise<void> => {
  const products = await db.select().from(amazonProductsTable).orderBy(amazonProductsTable.createdAt);
  res.json(products);
});

router.post("/amazon-products", async (req, res): Promise<void> => {
  const parsed = CreateAmazonProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [product] = await db.insert(amazonProductsTable).values(parsed.data).returning();
  res.status(201).json(product);
});

router.patch("/amazon-products/:id", async (req, res): Promise<void> => {
  const params = UpdateAmazonProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateAmazonProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [product] = await db
    .update(amazonProductsTable)
    .set(parsed.data)
    .where(eq(amazonProductsTable.id, params.data.id))
    .returning();

  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  res.json(product);
});

router.delete("/amazon-products/:id", async (req, res): Promise<void> => {
  const params = DeleteAmazonProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [product] = await db.delete(amazonProductsTable).where(eq(amazonProductsTable.id, params.data.id)).returning();
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
