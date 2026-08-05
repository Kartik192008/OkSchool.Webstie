import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, mockTestResultsTable, mockTestsTable, paymentsTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/mock-test/history/:userId", async (req, res): Promise<void> => {
  try {
    const userId = String(req.params.userId);
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

router.get("/payments/history/:userId", async (req, res): Promise<void> => {
  try {
    const userId = String(req.params.userId);
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
      })
      .from(paymentsTable)
      .where(eq(paymentsTable.userId, userId))
      .orderBy(desc(paymentsTable.createdAt))
      .limit(50);

    res.json(results);
  } catch (err) {
    console.error("Failed to fetch payment history:", err);
    res.status(500).json({ error: "Failed to fetch history" });
  }
});

router.post("/mock-test/results", async (req, res): Promise<void> => {
  try {
    const { userId, mockTestId, score, maxScore, correct, incorrect, unattempted, timeTaken, answers } = req.body;

    if (!userId || !mockTestId) {
      res.status(400).json({ error: "userId and mockTestId are required" });
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

export default router;
