const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const express = require('express');
const jwt = require('jsonwebtoken');

test('user management validates changes, protects admins and linked records, and commits allowed edits', async t => {
    let linked = false, committed = 0, rolledBack = 0;
    const mutations = [];
    const connection = {beginTransaction:async()=>{},commit:async()=>{committed++;},rollback:async()=>{rolledBack++;},release(){},async query(sql,args){
        if (sql.includes('FOR UPDATE') && sql.includes('role')) return [[{id:1,role:'admin'},{id:2,role:'user'},{id:3,role:'admin'}]];
        if (sql.startsWith('SELECT user_id')) return [linked ? [{user_id:2}] : []];
        mutations.push({sql,args}); return [{affectedRows:1}];
    }};
    const context = {module:{exports:{}},console,require(name){if(name==='express')return express;return {promise:()=>({getConnection:async()=>connection})};}};
    vm.runInNewContext(fs.readFileSync(require.resolve('../routes/adminUsers'),'utf8'), context);
    const app=express(); app.use(express.json());app.use((req,res,next)=>{req.user={id:1,role:'admin'};next();});app.use('/users',context.module.exports);
    const server=app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));t.after(()=>new Promise(resolve=>server.close(resolve)));
    const request=(path,method,body)=>fetch(`http://127.0.0.1:${server.address().port}/users/${path}`,{method,headers:{'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});
    assert.equal((await request('2','PUT',{username:'Name',email:'invalid'})).status,400);
    assert.equal((await request('2/permissions','PUT',{role:'owner'})).status,400);
    assert.equal((await request('1/permissions','PUT',{role:'user'})).status,409);
    assert.equal((await request('3','DELETE')).status,409);
    linked=true;assert.equal((await request('2','DELETE')).status,409);
    assert.equal(mutations.length,0);
    assert.equal((await request('2','PUT',{username:' Updated ',email:'NEW@example.com'})).status,200);
    assert.deepEqual(Array.from(mutations[0].args),['Updated','new@example.com','2']);
    assert.equal((await request('2/permissions','PUT',{role:'admin'})).status,200);
    linked=false;assert.equal((await request('2','DELETE')).status,200);
    assert.equal(committed,3);assert.equal(rolledBack,3);
});

test('deleted users cannot reuse valid tokens and current roles replace stale token roles', () => {
    const secret='local-test-only';let rows=[];let status;let nextUser;
    const context={module:{exports:{}},console,process:{env:{JWT_SECRET:secret}},require(name){return name==='jsonwebtoken'?jwt:{query(sql,args,cb){cb(null,rows);}};}};
    vm.runInNewContext(fs.readFileSync(require.resolve('../middleware/auth'),'utf8'),context);
    const req={headers:{authorization:'Bearer '+jwt.sign({id:2,role:'admin'},secret)}};
    const res={status(n){status=n;return this;},json(){}};
    context.module.exports(req,res,()=>assert.fail('Deleted user was authorized'));
    assert.equal(status,401);
    rows=[{id:2,role:'user',username:'Reader',email:'reader@example.com'}];
    context.module.exports(req,res,()=>{nextUser=req.user;});
    assert.equal(nextUser.role,'user');
});
