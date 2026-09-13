const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

test('coupon initialization retries after a database outage and shares successful initialization', async () => {
    let calls = 0;
    const offline = new Error('Database temporarily unavailable');
    const context = { module: { exports: {} }, require: () => ({
        query(sql, values, callback) {
            const attempt = ++calls;
            setImmediate(() => callback(attempt === 1 ? offline : null, []));
        }
    }) };
    vm.runInNewContext(fs.readFileSync(require.resolve('../services/couponService'), 'utf8'), context);
    const { ensureCouponsTable } = context.module.exports;
    await assert.rejects(ensureCouponsTable(), offline);
    await Promise.all([ensureCouponsTable(), ensureCouponsTable()]);
    await ensureCouponsTable();
    assert.equal(calls, 2);
});
