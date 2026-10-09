export class InputError extends Error {}
export function validateTask(body) {
  const title=typeof body.title==='string'?body.title.trim():'';
  const description=typeof body.description==='string'?body.description.trim():'';
  const importance=body.importance;
  const due_date=body.due_date;
  if(!title||title.length>120) throw new InputError('Название должно содержать от 1 до 120 символов');
  if(description.length>2000) throw new InputError('Описание должно быть не длиннее 2000 символов');
  if(!Number.isInteger(importance)||importance<1||importance>5) throw new InputError('Важность должна быть целым числом от 1 до 5');
  if(typeof due_date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(due_date)||!Number.isFinite(Date.parse(due_date))||new Date(due_date).toISOString().slice(0,10)!==due_date||due_date<'2000-01-01'||due_date>'2100-12-31') throw new InputError('Укажите существующую дату от 2000 до 2100 года');
  return {title,description,importance,due_date};
}
