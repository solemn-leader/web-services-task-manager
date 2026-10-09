import test from 'node:test';
import assert from 'node:assert/strict';
import {prioritize} from '../web-service/priority.js';
import {validateTask,InputError} from '../backend/validation.js';
const today=new Date('2026-10-09T15:00:00Z');
test('Просроченная важная задача стоит раньше несрочной; завершённая стоит последней',()=>{
 const rows=prioritize([{id:1,importance:5,due_date:'2026-10-08',status:'todo'},{id:2,importance:1,due_date:'2026-10-20',status:'todo'},{id:3,importance:5,due_date:'2026-10-01',status:'done'}],today);
 assert.deepEqual(rows.map(r=>r.id),[1,2,3]);assert.equal(rows[0].score,100);assert.equal(rows[0].days_left,-1);assert.equal(rows[2].score,0);
});
test('Срок сегодня и срок через два дня имеют разные веса',()=>{
 const rows=prioritize([{id:1,importance:3,due_date:'2026-10-09',status:'todo'},{id:2,importance:3,due_date:'2026-10-11',status:'todo'}],today);
 assert.equal(rows[0].score,69);assert.equal(rows[1].score,54);
});
test('Пустой список обрабатывается без ошибок',()=>assert.deepEqual(prioritize([],today),[]));
test('Проверка данных отсекает пустые названия, неверную важность и несуществующие даты',()=>{
 const valid={title:'  Защита  ',description:'  Описание ',importance:3,due_date:'2026-10-10'};
 assert.equal(validateTask(valid).title,'Защита');
 for(const patch of [{title:''},{importance:'3'},{importance:6},{due_date:'2026-02-30'},{due_date:'2026-13-01'},{title:'x'.repeat(121)}]) assert.throws(()=>validateTask({...valid,...patch}),InputError);
 for(const body of [null,[],42,'task']) assert.throws(()=>validateTask(body),InputError);
});
