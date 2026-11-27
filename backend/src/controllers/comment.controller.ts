import * as comments from "../services/comment.service";
import { asyncHandler } from "../utils/asyncHandler";

// POST /api/tickets/:id/comments
export const addComment = asyncHandler(async (req, res) => {
  const comment = await comments.addComment(req.user!, req.params.id, req.body.message);
  res.status(201).json({ success: true, message: "Comment added successfully", data: comment });
});

// GET /api/tickets/:id/comments
export const getComments = asyncHandler(async (req, res) => {
  const data = await comments.listComments(req.user!, req.params.id);
  res.status(200).json({ success: true, count: data.length, data });
});
