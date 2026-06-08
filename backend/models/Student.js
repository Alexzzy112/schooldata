import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema(
  {
    studentId: { type: String, required: true, unique: true },
    name: { type: String, required: true, trim: true },
    gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
    age: { type: Number, required: true },
    class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
    department: { type: String, trim: true },
    session: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

studentSchema.index({ class: 1 });
studentSchema.index({ session: 1 });

export default mongoose.model('Student', studentSchema);
