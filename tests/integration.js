import assert from 'node:assert/strict';
const base=process.env.TEST_URL||'http://127.0.0.1:8088';
async function api(path,options={}){const res=await fetch(base+'/api'+path,{...options,headers:{'Content-Type':'application/json'},signal:AbortSignal.timeout(10000)});return{status:res.status,body:await res.json()};}
let id;
try {
 assert.equal((await api('/health')).status,200);
 const created=await api('/tasks',{method:'POST',body:JSON.stringify({title:'Проверка '+Date.now(),description:'Автоматическая проверка полного пути',importance:5,due_date:'2030-01-01'})});
 assert.equal(created.status,201);id=created.body.task.id;
 assert.ok((await api('/tasks')).body.tasks.some(t=>t.id===id));
 const ranked=await api('/priorities');assert.equal(ranked.status,200);assert.ok(ranked.body.tasks.some(t=>t.id===id&&Number.isInteger(t.score)));
 assert.equal((await api('/tasks/'+id,{method:'PATCH',body:JSON.stringify({status:'done'})})).body.task.status,'done');
 assert.equal((await api('/tasks',{method:'POST',body:'{"title":""}'})).status,400);
 assert.equal((await api('/tasks/'+id,{method:'PATCH',body:'{"status":"invalid"}'})).status,400);
 console.log('OK: здоровье сервисов, создание, выборка, приоритет, смена статуса и валидация');
} finally {if(id){const deleted=await api('/tasks/'+id,{method:'DELETE'});assert.equal(deleted.status,200);assert.equal((await api('/tasks/'+id,{method:'DELETE'})).status,404);console.log('OK: тестовая запись удалена');}}
