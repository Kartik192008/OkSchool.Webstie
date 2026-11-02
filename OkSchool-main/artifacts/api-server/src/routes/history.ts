import { Router, type IRouter } from "express";
import { requireAuth } from "../lib/auth";
import { eq, desc } from "drizzle-orm";
import { db, mockTestResultsTable, mockTestsTable, paymentsTable, documentsTable, questionsTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/mock-test/history/:userId", requireAuth, async (req, res): Promise<void> => {
  try {
    const userId = String(req.params.userId);
    if (req.user?.id !== userId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    const results = await db
      .select({
        id: mockTestResultsTable.id,
        mockTestId: mockTestResultsTable.mockTestId,
        title: mockTestsTable.title,
        score: mockTestResultsTable.score,
        maxScore: mockTestResultsTable.maxScore,
        correct: mockTestResultsTable.correct,
        incorrect: mockTestResultsTable.incorrect,
        unattempted: mockTestResultsTable.unattempted,
        timeTaken: mockTestResultsTable.timeTaken,
        createdAt: mockTestResultsTable.createdAt,
      })
      .from(mockTestResultsTable)
      .leftJoin(mockTestsTable, eq(mockTestResultsTable.mockTestId, mockTestsTable.id))
      .where(eq(mockTestResultsTable.userId, userId))
      .orderBy(desc(mockTestResultsTable.createdAt))
      .limit(50);

    res.json(results);
  } catch (err) {
    console.error("Failed to fetch mock test history:", err);
    res.status(500).json({ error: "Failed to fetch history" });
  }
});

router.get("/payments/history/:userId", requireAuth, async (req, res): Promise<void> => {
  try {
    const userId = String(req.params.userId);
    if (req.user?.id !== userId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    const results = await db
      .select({
        id: paymentsTable.id,
        documentId: paymentsTable.documentId,
        amount: paymentsTable.amount,
        currency: paymentsTable.currency,
        status: paymentsTable.status,
        razorpayOrderId: paymentsTable.razorpayOrderId,
        razorpayPaymentId: paymentsTable.razorpayPaymentId,
        createdAt: paymentsTable.createdAt,
        documentTitle: documentsTable.title,
        documentThumbnailUrl: documentsTable.thumbnailUrl,
      })
      .from(paymentsTable)
      .leftJoin(documentsTable, eq(paymentsTable.documentId, documentsTable.id))
      .where(eq(paymentsTable.userId, userId))
      .orderBy(desc(paymentsTable.createdAt))
      .limit(50);

    res.json(results);
  } catch (err) {
    console.error("Failed to fetch payment history:", err);
    res.status(500).json({ error: "Failed to fetch history" });
  }
});

router.post("/mock-test/results", requireAuth, async (req, res): Promise<void> => {
  try {
    const { userId, mockTestId, score, maxScore, correct, incorrect, unattempted, timeTaken, answers } = req.body;
    if (!userId || !mockTestId) {
      res.status(400).json({ error: "userId and mockTestId are required" });
      return;
    }
    if (String(userId) !== req.user?.id) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const [result] = await db.insert(mockTestResultsTable).values({
      userId: String(userId),
      mockTestId: Number(mockTestId),
      score: Number(score) || 0,
      maxScore: Number(maxScore) || 0,
      correct: Number(correct) || 0,
      incorrect: Number(incorrect) || 0,
      unattempted: Number(unattempted) || 0,
      timeTaken: Number(timeTaken) || 0,
      answers: answers || {},
    }).returning();

    res.status(201).json(result);
  } catch (err) {
    console.error("Failed to save mock test result:", err);
    res.status(500).json({ error: "Failed to save result" });
  }
});

router.get("/mock-test/results/:resultId", requireAuth, async (req, res): Promise<void> => {
  try {
    const resultId = Number(req.params.resultId);
    if (!resultId) {
      res.status(400).json({ error: "resultId is required" });
      return;
    }

    const [result] = await db
      .select()
      .from(mockTestResultsTable)
      .where(eq(mockTestResultsTable.id, resultId));

    if (!result) {
      res.status(404).json({ error: "Result not found" });
      return;
    }

    if (String(result.userId) !== req.user?.id) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const [test] = await db
      .select()
      .from(mockTestsTable)
      .where(eq(mockTestsTable.id, result.mockTestId));

    if (!test) {
      res.status(404).json({ error: "Mock test not found" });
      return;
    }

    const questions = await db
      .select()
      .from(questionsTable)
      .where(eq(questionsTable.mockTestId, test.id))
      .orderBy(questionsTable.id);

    res.json({ result, test: { ...test, questions } });
  } catch (err) {
    console.error("Failed to fetch mock test result:", err);
    res.status(500).json({ error: "Failed to fetch result" });
  }
});

export default router;
