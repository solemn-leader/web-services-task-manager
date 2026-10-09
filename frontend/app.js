const $=id=>document.getElementById(id);
let ranked=false, pendingDelete=null;
const labels={high:'Высокий',medium:'Средний',low:'Низкий'};
function notice(text,error=false){$('notice').textContent=text;$('notice').className=error?'error':'';}
async function api(path,options={}){const r=await fetch('/api'+path,{...options,headers:{'Content-Type':'application/json'},signal:AbortSignal.timeout(10000)});const body=await r.json();if(!r.ok)throw new Error(body.error||'Не удалось выполнить запрос');return body;}
function el(tag,text,className){const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(className)e.className=className;return e;}
function render(tasks){
  $('tasks').replaceChildren();$('total').textContent=tasks.length;$('active').textContent=tasks.filter(t=>t.status!=='done').length;$('done').textContent=tasks.filter(t=>t.status==='done').length;
  if(!tasks.length)$('tasks').append(el('p','Пока нет задач. Добавь первую задачу слева.','empty'));
  for(const t of tasks){
    const card=el('article',undefined,'task'+(t.status==='done'?' is-done':''));const top=el('div',undefined,'task-top');top.append(el('h3',t.title));
    top.append(el('span',ranked?`${labels[t.priority]} · ${t.score}`:`Важность ${t.importance}/5`,'badge'+(ranked?' '+t.priority:'')));card.append(top);
    if(t.description)card.append(el('p',t.description));const meta=el('div',undefined,'meta');meta.append(el('span','Срок: '+new Date(t.due_date+'T12:00:00').toLocaleDateString('ru-RU')));if(ranked)meta.append(el('span',t.reason));card.append(meta);
    const controls=el('div',undefined,'task-controls');const select=el('select');select.setAttribute('aria-label','Статус задачи '+t.title);
    for(const [value,label] of [['todo','В планах'],['doing','В работе'],['done','Завершена']]){const option=el('option',label);option.value=value;select.append(option);}select.value=t.status;
    select.addEventListener('change',async()=>{select.disabled=true;try{await api('/tasks/'+t.id,{method:'PATCH',body:JSON.stringify({status:select.value})});await load(ranked);notice('Статус сохранён');}catch(e){select.value=t.status;notice(e.message,true);}finally{select.disabled=false;}});
    const remove=el('button','Удалить','delete');remove.setAttribute('aria-label','Удалить задачу '+t.title);remove.onclick=()=>{pendingDelete=t.id;$('delete-dialog').showModal();};controls.append(select,remove);card.append(controls);$('tasks').append(card);
  }
}
async function load(withPriority=false){const buttons=[$('load'),$('prioritize')];buttons.forEach(b=>b.disabled=true);notice('Загружаю…');try{const data=await api(withPriority?'/priorities':'/tasks');ranked=withPriority;render(data.tasks);$('mode').textContent=ranked?'Сортировка отдельным сервисом по важности и сроку':'Записи из базы данных';notice(ranked?'Приоритет рассчитан веб-сервисом':'Задачи загружены из PostgreSQL');}catch(e){notice(e.message,true);}finally{buttons.forEach(b=>b.disabled=false);}}
$('load').onclick=()=>load(false);$('prioritize').onclick=()=>load(true);
const date=new Date();$('task-form').elements.due_date.value=[date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-');
$('task-form').addEventListener('submit',async event=>{event.preventDefault();const form=event.target;const button=form.querySelector('button');button.disabled=true;try{const data=Object.fromEntries(new FormData(form));data.importance=Number(data.importance);await api('/tasks',{method:'POST',body:JSON.stringify(data)});form.elements.title.value='';form.elements.description.value='';await load(ranked);notice('Задача добавлена в базу данных');}catch(e){notice(e.message,true);}finally{button.disabled=false;}});
$('cancel-delete').onclick=()=>{$('delete-dialog').close();pendingDelete=null;};
$('confirm-delete').onclick=async()=>{const id=pendingDelete;$('delete-dialog').close();pendingDelete=null;try{await api('/tasks/'+id,{method:'DELETE'});await load(ranked);notice('Задача удалена');}catch(e){notice(e.message,true);}};
