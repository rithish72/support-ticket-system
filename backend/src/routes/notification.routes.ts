import { Router } from "express";
import { getNotifications, markAllNotificationsRead, markNotificationRead } from "../controllers/notification.controller";
import { protect } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { idParams } from "../validators/common.validator";
import { listNotificationsQuery } from "../validators/notification.validator";

const router = Router();
router.use(protect);

router.get("/", validate({ query: listNotificationsQuery }), getNotifications);
router.patch("/read-all", markAllNotificationsRead); // must stay above "/:id/read"
router.patch("/:id/read", validate({ params: idParams }), markNotificationRead);

export default router;
