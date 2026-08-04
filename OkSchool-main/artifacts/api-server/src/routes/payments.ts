import { Router, type IRouter } from "express";
import Razorpay from "razorpay";
import crypto from "crypto";
import { eq, and, sql } from "drizzle-orm";
import { db, paymentsTable, documentsTable } from "@workspace/db";

const router: IRouter = Router();

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
  console.error("Missing Razorpay credentials. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables.");
}

const razorpay = new Razorpay({
  key_id: RAZORPAY_KEY_ID || "",
  key_secret: RAZORPAY_KEY_SECRET || "",
});

router.post("/razorpay/create-order", async (req, res): Promise<void> => {
  try {
    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      res.status(500).json({ error: "Payment gateway not configured" });
      return;
    }

    const { documentId, amount, userId } = req.body;

    if (!documentId || !amount || !userId) {
      res.status(400).json({ error: "documentId, amount, and userId are required" });
      return;
    }

    const amountNum = Number(amount);
    if (Number.isNaN(amountNum) || amountNum < 100) {
      res.status(400).json({ error: "Minimum amount is 100 paise (₹1)" });
      return;
    }

    const [doc] = await db.select().from(documentsTable).where(eq(documentsTable.id, Number(documentId)));
    if (!doc) {
      res.status(404).json({ error: "Document not found" });
      return;
    }

    const receipt = `doc_${documentId}_user_${userId}`;

    const order = await razorpay.orders.create({
      amount: amountNum,
      currency: "INR",
      receipt: receipt.slice(0, 40),
      notes: {
        documentId: String(documentId),
        userId: String(userId),
        documentTitle: doc.title,
      },
    });

    res.json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key: RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error("Failed to create Razorpay order:", err);
    res.status(500).json({ error: "Failed to create order" });
  }
});

router.post("/razorpay/verify-payment", async (req, res): Promise<void> => {
  try {
    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      res.status(500).json({ error: "Payment gateway not configured" });
      return;
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, documentId, userId, amount } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !documentId || !userId) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      res.status(400).json({ error: "Invalid signature" });
      return;
    }

    const [existing] = await db
      .select()
      .from(paymentsTable)
      .where(and(
        eq(paymentsTable.documentId, Number(documentId)),
        eq(paymentsTable.userId, String(userId))
      ));

    if (existing) {
      res.json({ success: true, message: "Payment already verified", payment: existing });
      return;
    }

    const [payment] = await db.insert(paymentsTable).values({
      documentId: Number(documentId),
      userId: String(userId),
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      amount: Number(amount) || 0,
      currency: "INR",
    }).returning();

    res.json({ success: true, payment });
  } catch (err) {
    console.error("Failed to verify payment:", err);
    res.status(500).json({ error: "Failed to verify payment" });
  }
});

router.get("/payments/check/:documentId", async (req, res): Promise<void> => {
  try {
    const { documentId } = req.params;
    const userId = req.query.userId as string | undefined;

    if (!userId) {
      res.status(400).json({ error: "userId query parameter is required" });
      return;
    }

    const [payment] = await db
      .select()
      .from(paymentsTable)
      .where(and(
        eq(paymentsTable.documentId, Number(documentId)),
        eq(paymentsTable.userId, String(userId))
      ));

    res.json({ hasPaid: !!payment });
  } catch (err) {
    console.error("Failed to check payment:", err);
    res.status(500).json({ error: "Failed to check payment" });
  }
});

export default router;
