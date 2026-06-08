import mongoose from 'mongoose';

const resultSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
    score: { type: Number, required: true, min: 0, max: 100 },
    term: { type: String, enum: ['First', 'Second', 'Third'], required: true },
    session: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true },
    grade: { type: String },
    remarks: { type: String },
    enteredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

resultSchema.index({ student: 1, subject: 1, term: 1, session: 1 }, { unique: true });
resultSchema.index({ session: 1, term: 1 });

resultSchema.pre('save', function (next) {
  if (this.score >= 70) this.grade = 'A';
  else if (this.score >= 60) this.grade = 'B';
  else if (this.score >= 50) this.grade = 'C';
  else if (this.score >= 45) this.grade = 'D';
  else if (this.score >= 40) this.grade = 'E';
  else this.grade = 'F';
  next();
});

export default mongoose.model('Result', resultSchema);
