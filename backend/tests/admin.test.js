const {test} = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const jwt = require('jsonwebtoken');
const source = fs.readFileSync(require.resolve('../middleware/admin'), 'utf8');
function run(user, rows, error) {
  let status = 200, next = false, queried = false;
  const context = {module:{exports:{}}, require:() => ({query(sql, args, callback) { queried = true; assert.match(sql,/WHERE id = \?/); assert.equal(args[0],user.id); callback(error, rows); }})};
  vm.runInNewContext(source,context);
  const res = {setHeader(){},status(value){status=value;return this;},json(){return this;}};
  context.module.exports({user},res,()=>{next=true;});
  return {status,next,queried};
}
test('unauthenticated callers cannot reach admin data',()=>assert.deepEqual(run(null,[]),{status:401,next:false,queried:false}));
test('customer is rejected even with a token claiming admin',()=>assert.equal(run({id:1,role:'admin'},[{id:1,role:'user'}]).status,403));
test('removed administrator is rejected',()=>assert.equal(run({id:1,role:'admin'},[]).status,403));
test('database failure fails closed',()=>assert.equal(run({id:1},[],new Error('offline')).status,503));
test('database administrator is authorized',()=>assert.equal(run({id:1},[{id:1,role:'admin'}]).next,true));
test('forged and expired tokens are rejected by authentication middleware',()=>{
  const secret = 'test-only-secret';
  const authSource = fs.readFileSync(require.resolve('../middleware/auth'),'utf8');
  const context = {module:{exports:{}}, require:()=>jwt,process:{env:{JWT_SECRET:secret}},console:{error(){}}};
  vm.runInNewContext(authSource, context);
  for(const token of [jwt.sign({id:1,role:'admin'},'wrong-secret'),jwt.sign({id:1,role:'admin'},secret,{expiresIn:-1})]) {
    let status;
    context.module.exports({headers:{authorization:'Bearer '+token}}, {status(n){status=n;return this;},json(){}},()=>assert.fail('Must not authorize'));
    assert.equal(status,401);
  }
});
