import http from 'node:http';
import {prioritize} from './priority.js';
const send=(res,status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(data));};
http.createServer(async(req,res)=>{
  if(req.url==='/health' && req.method==='GET') return send(res,200,{status:'ok',service:'priority'});
  if(req.url!=='/prioritize' || req.method!=='POST') return send(res,404,{error:'Маршрут не найден'});
  try {
    let body='';
    for await(const chunk of req){body+=chunk;if(Buffer.byteLength(body)>1000000) return send(res,413,{error:'Слишком большой запрос'});}
    const {tasks}=JSON.parse(body);
    if(!Array.isArray(tasks) || tasks.length>2000 || tasks.some(t=>!Number.isInteger(t.id)||!Number.isInteger(t.importance)||t.importance<1||t.importance>5||!['todo','doing','done'].includes(t.status)||!/^\d{4}-\d{2}-\d{2}$/.test(t.due_date)||!Number.isFinite(Date.parse(t.due_date)))) return send(res,400,{error:'Некорректный список задач'});
    send(res,200,{algorithm:'importance-and-deadline-v1',generated_at:new Date().toISOString(),tasks:prioritize(tasks)});
  } catch {send(res,400,{error:'Некорректный JSON'});}
}).listen(Number(process.env.PORT||4000),'0.0.0.0');
