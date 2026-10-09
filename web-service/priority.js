export function prioritize(tasks, now = new Date()) {
  const day = 86400000;
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const ranked = tasks.map(task => {
    const daysLeft = Math.round((Date.parse(task.due_date) - today) / day);
    const urgency = daysLeft < 0 ? 60 : daysLeft === 0 ? 45 : daysLeft <= 2 ? 30 : daysLeft <= 7 ? 15 : 0;
    const score = task.status === 'done' ? 0 : Math.min(100, task.importance * 8 + urgency);
    const reason = task.status === 'done' ? 'Задача завершена' : daysLeft < 0 ? `Просрочена на ${-daysLeft} дн.` : daysLeft === 0 ? 'Срок сегодня' : `До срока ${daysLeft} дн.`;
    return {...task, days_left: daysLeft, score, priority: score >= 65 ? 'high' : score >= 35 ? 'medium' : 'low', reason};
  });
  return ranked.sort((a,b) => Number(a.status === 'done') - Number(b.status === 'done') || b.score - a.score || a.due_date.localeCompare(b.due_date) || a.id-b.id);
}
