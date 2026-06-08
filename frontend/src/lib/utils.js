export function getInitials(name) {
  return name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function getScoreColor(score) {
  if (score >= 70) return 'text-green-600 dark:text-green-400';
  if (score >= 50) return 'text-blue-600 dark:text-blue-400';
  if (score >= 40) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-red-600 dark:text-red-400';
}

export function getGradeColor(grade) {
  const colors = { A: 'badge-success', B: 'badge-info', C: 'badge-info', D: 'badge-warning', E: 'badge-warning', F: 'badge-danger' };
  return colors[grade] || 'badge-info';
}

export function calculateGPA(scores) {
  if (!scores?.length) return 0;
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  if (avg >= 70) return 4.0;
  if (avg >= 60) return 3.5;
  if (avg >= 50) return 3.0;
  if (avg >= 45) return 2.5;
  if (avg >= 40) return 2.0;
  return 0.0;
}
