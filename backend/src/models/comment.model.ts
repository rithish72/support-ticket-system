import { HydratedDocument, Schema, Types, model } from "mongoose";

export interface IComment {
  ticketId: Types.ObjectId;
  userId: Types.ObjectId;
  message: string;
  isAdminResponse: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type CommentDocument = HydratedDocument<IComment>;

const commentSchema = new Schema<IComment>(
  {
    ticketId: { type: Schema.Types.ObjectId, ref: "Ticket", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    message: { type: String, required: true, trim: true, minlength: 1, maxlength: 2000 },
    isAdminResponse: { type: Boolean, default: false },
  },
  { timestamps: true },
);

commentSchema.index({ ticketId: 1, createdAt: 1 });

export const Comment = model<IComment>("Comment", commentSchema);
