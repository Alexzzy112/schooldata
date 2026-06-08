import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Class from './models/Class.js';
import Subject from './models/Subject.js';
import Session from './models/Session.js';
import Student from './models/Student.js';
import Result from './models/Result.js';

dotenv.config();

const subjectsList = [
  'Mathematics', 'English', 'Biology', 'Chemistry', 'Physics', 'Computer Science',
  'History', 'Geography', 'Economics', 'Literature',
];

const classList = ['SS1', 'SS2', 'SS3', 'JSS1', 'JSS2', 'JSS3'];

const firstNames = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emma', 'James', 'Olivia', 'Robert', 'Sophia',
  'William', 'Isabella', 'Richard', 'Mia', 'Joseph', 'Charlotte', 'Thomas', 'Amelia', 'Daniel', 'Harper'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
  'Anderson', 'Taylor', 'Thomas', 'Hernandez', 'Moore', 'Martin', 'Jackson', 'Thompson', 'White', 'Lee'];

function randomItem(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randomScore() { return Math.floor(Math.random() * 61) + 20; }

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    await Promise.all([
      User.deleteMany({}), Class.deleteMany({}), Subject.deleteMany({}),
      Session.deleteMany({}), Student.deleteMany({}), Result.deleteMany({}),
    ]);

    const admin = await User.create({ username: 'admin', email: 'admin@school.com', password: 'admin123', role: 'admin' });
    const teacher = await User.create({ username: 'teacher', email: 'teacher@school.com', password: 'teacher123', role: 'teacher' });
    const viewer = await User.create({ username: 'principal', email: 'principal@school.com', password: 'principal123', role: 'viewer' });
    console.log('Users created');

    const classes = await Class.insertMany(classList.map((name) => ({ name, code: name })));
    console.log('Classes created');

    const subjects = await Subject.insertMany(subjectsList.map((name) => ({ name, code: name.substring(0, 3).toUpperCase() })));
    console.log('Subjects created');

    const session = await Session.create({ name: '2024/2025', startYear: 2024, endYear: 2025, isActive: true, isCurrent: true });
    console.log('Session created');

    const students = [];
    for (let i = 1; i <= 50; i++) {
      const gender = Math.random() > 0.5 ? 'Male' : 'Female';
      students.push({
        studentId: `STU${String(i).padStart(4, '0')}`,
        name: `${randomItem(firstNames)} ${randomItem(lastNames)}`,
        gender,
        age: Math.floor(Math.random() * 6) + 13,
        class: randomItem(classes)._id,
        session: session._id,
      });
    }
    const createdStudents = await Student.insertMany(students);
    console.log(`${createdStudents.length} students created`);

    const terms = ['First', 'Second', 'Third'];
    const results = [];
    for (const student of createdStudents) {
      for (const term of terms) {
        const numSubjects = Math.floor(Math.random() * 4) + 4;
        const selectedSubjects = [...subjects].sort(() => Math.random() - 0.5).slice(0, numSubjects);
        for (const subject of selectedSubjects) {
          results.push({
            student: student._id,
            subject: subject._id,
            score: randomScore(),
            term,
            session: session._id,
            enteredBy: teacher._id,
          });
        }
      }
    }
    const createdResults = await Result.insertMany(results);
    console.log(`${createdResults.length} results created`);

    console.log('\nSeed completed!');
    console.log('Login credentials:');
    console.log('  Admin:   admin@school.com / admin123');
    console.log('  Teacher: teacher@school.com / teacher123');
    console.log('  Viewer:  principal@school.com / principal123');

    await mongoose.disconnect();
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
}

seed();
