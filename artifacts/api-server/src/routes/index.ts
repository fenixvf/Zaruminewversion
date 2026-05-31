import { Router, type IRouter } from "express";
import healthRouter from "./health";
import worksRouter from "./works";
import analyticsRouter from "./analytics";

const router: IRouter = Router();

router.use(healthRouter);
router.use(worksRouter);
router.use(analyticsRouter);

export default router;
