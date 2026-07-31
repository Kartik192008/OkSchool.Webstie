import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, mockTestsTable, questionsTable } from "@workspace/db";
import {
  CreateMockTestBody,
  GetMockTestParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/mock-tests", async (_req, res): Promise<void> => {
  const tests = await db.select().from(mockTestsTable).orderBy(mockTestsTable.createdAt);
  res.json(tests);
});

router.post("/mock-tests", async (req, res): Promise<void> => {
  console.log("Received body:", JSON.stringify(req.body, null, 2));
  const parsed = CreateMockTestBody.safeParse(req.body);
  if (!parsed.success) {
    console.log("Validation error:", parsed.error);
    res.status(400).json({ error: parsed.error.message, details: parsed.error });
    return;
  }

  const { questions, ...testData } = parsed.data;
  
  const [test] = await db.insert(mockTestsTable).values({
    ...testData,
    questionCount: 0,
  }).returning();
  
  if (questions && questions.length > 0) {
    await db.insert(questionsTable).values(
      questions.map(q => ({
        ...q,
        mockTestId: test.id,
      }))
    );
    
    await db.update(mockTestsTable)
      .set({ questionCount: questions.length })
      .where(eq(mockTestsTable.id, test.id));
  }
  
  const [updatedTest] = await db.select().from(mockTestsTable).where(eq(mockTestsTable.id, test.id));
  res.status(201).json(updatedTest);
});

router.get("/mock-tests/:id", async (req, res): Promise<void> => {
  const params = GetMockTestParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [test] = await db.select().from(mockTestsTable).where(eq(mockTestsTable.id, params.data.id));
  if (!test) {
    res.status(404).json({ error: "Mock test not found" });
    return;
  }

  const questions = await db
    .select()
    .from(questionsTable)
    .where(eq(questionsTable.mockTestId, params.data.id));

  res.json({ ...test, questions });
});

router.delete("/mock-tests/:id", async (req, res): Promise<void> => {
  const params = GetMockTestParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  await db.delete(questionsTable).where(eq(questionsTable.mockTestId, params.data.id));
  await db.delete(mockTestsTable).where(eq(mockTestsTable.id, params.data.id));
  
  res.status(204).send();
});

export default router;
