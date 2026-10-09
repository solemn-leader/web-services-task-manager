import http from 'node:http';
import pg from 'pg';
import {InputError,validateTask} from './validation.js';
const pool=new pg.Pool({connectionString:process.env.DATABASE_URL,connectionTimeoutMillis:3000,query_timeout:5000,max:10});
pool.on('error',e=>console.error('Database pool error:',e.message));
const fields="id,title,description,importance,to_char(due_date,'YYYY-MM-DD') AS due_date,status,created_at";
const send=(res,status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
async function read(req){let raw='';for await(const chunk of req){raw+=chunk;if(Buffer.byteLength(raw)>16384) throw new InputError('Слишком большой запрос');}try{return JSON.parse(raw);}catch{throw new InputError('Некорректный JSON');}}
const server=http.createServer(async(req,res)=>{
  const pathname=new URL(req.url,'http://localhost').pathname;
  try {
    if(req.method==='GET'&&pathname==='/api/health'){
      await pool.query('SELECT 1');
      const r=await fetch(`${process.env.WEB_SERVICE_URL}/health`,{signal:AbortSignal.timeout(3000)});
      if(!r.ok) throw new Error('Priority unavailable');
      return send(res,200,{status:'ok',database:'ok',web_service:'ok'});
    }
    if(req.method==='GET'&&pathname==='/api/tasks') return send(res,200,{tasks:(await pool.query(`SELECT ${fields} FROM tasks ORDER BY id DESC`)).rows});
    if(req.method==='GET'&&pathname==='/api/priorities'){
      const tasks=(await pool.query(`SELECT ${fields} FROM tasks ORDER BY id`)).rows;
      try {
        const r=await fetch(`${process.env.WEB_SERVICE_URL}/prioritize`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({tasks}),signal:AbortSignal.timeout(5000)});
        if(!r.ok) throw new Error('Priority unavailable');
        return send(res,200,await r.json());
      } catch {return send(res,502,{error:'Сервис приоритезации недоступен. Попробуйте позже.'});}
    }
    if(req.method==='POST'&&pathname==='/api/tasks'){
      const t=validateTask(await read(req));
      const result=await pool.query(`INSERT INTO tasks(title,description,importance,due_date) VALUES($1,$2,$3,$4) RETURNING ${fields}`,[t.title,t.description,t.importance,t.due_date]);
      return send(res,201,{task:result.rows[0]});
    }
    const match=pathname.match(/^\/api\/tasks\/(\d+)$/);
    if(match && ['PATCH','DELETE'].includes(req.method)){
      const id=Number(match[1]);
      if(!Number.isSafeInteger(id)||id<1||id>2147483647) throw new InputError('Некорректный номер задачи');
      let result;
      if(req.method==='PATCH'){
        const {status}=await read(req);
        if(!['todo','doing','done'].includes(status)) throw new InputError('Некорректный статус');
        result=await pool.query(`UPDATE tasks SET status=$1 WHERE id=$2 RETURNING ${fields}`,[status,id]);
      }else result=await pool.query('DELETE FROM tasks WHERE id=$1 RETURNING id',[id]);
      return result.rowCount?send(res,200,{task:result.rows[0]}):send(res,404,{error:'Задача не найдена'});
    }
    send(res,404,{error:'Маршрут не найден'});
  }catch(e){if(e instanceof InputError) return send(res,400,{error:e.message});console.error(e.message);send(res,503,{error:'База данных временно недоступна'});}
});
server.listen(Number(process.env.PORT||3000),'0.0.0.0');
for(const signal of ['SIGTERM','SIGINT']) process.on(signal,()=>server.close(()=>pool.end().then(()=>process.exit(0))));
