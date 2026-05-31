import { Router, type IRouter } from "express";
import healthRouter from "./health";
import worksRouter from "./works";
import analyticsRouter from "./analytics";
import linksRouter from "./links";

const router: IRouter = Router();

router.use(healthRouter);
router.use(worksRouter);
router.use(analyticsRouter);
router.use(linksRouter);

export default router;
