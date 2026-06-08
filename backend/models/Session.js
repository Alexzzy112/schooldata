import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    startYear: { type: Number, required: true },
    endYear: { type: Number, required: true },
    isActive: { type: Boolean, default: false },
    isCurrent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model('Session', sessionSchema);
