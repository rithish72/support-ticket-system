import { listActivities } from "../services/activity.service";
import { asyncHandler } from "../utils/asyncHandler";

// GET /api/tickets/:id/activities
export const getTicketActivities = asyncHandler(async (req, res) => {
  const data = await listActivities(req.user!, req.params.id);
  res.status(200).json({ success: true, count: data.length, data });
});
