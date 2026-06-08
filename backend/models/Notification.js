import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, enum: ['info', 'warning', 'success', 'danger'], default: 'info' },
    category: { type: String, enum: ['performance', 'result', 'improvement', 'general'], default: 'general' },
    isRead: { type: Boolean, default: false },
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    relatedStudent: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  },
  { timestamps: true }
);

export default mongoose.model('Notification', notificationSchema);
