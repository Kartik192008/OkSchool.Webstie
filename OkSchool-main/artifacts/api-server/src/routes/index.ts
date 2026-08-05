import { Router, type IRouter } from "express";
import healthRouter from "./health";
import documentsRouter from "./documents";
import amazonProductsRouter from "./amazon-products";
import mockTestsRouter from "./mock-tests";
import adminRouter from "./admin";
import searchRouter from "./search";
import visitsRouter from "./visits";
import paymentsRouter from "./payments";
import historyRouter from "./history";

const router: IRouter = Router();

router.use(healthRouter);
router.use(documentsRouter);
router.use(amazonProductsRouter);
router.use(mockTestsRouter);
router.use(adminRouter);
router.use(searchRouter);
router.use(visitsRouter);
router.use(paymentsRouter);
router.use(historyRouter);

export default router;
