const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const { createRequire } = require('node:module');
const express = require('express');

test('admin comics callback queries send one response and survive database failures', async (t) => {
    const filename = require.resolve('../routes/admin');
    const routeRequire = createRequire(filename);
    let databaseError = null;
    let promiseAttempts = 0;
    const comics = [{ id: 1, title: 'Test comic' }];
    const db = {
        query(sql, callback) {
            setImmediate(() => callback(databaseError, comics));
            return { then() {
                promiseAttempts++;
                throw new Error('Callback query is not a promise');
            } };
        }
    };
    const context = {
        module: { exports: {} }, __dirname: path.dirname(filename),
        require(name) {
            if (name === '../config/db') return db;
            if (name === '../config/cloudinary') return {};
            if (name === 'pdf-lib') return {};
            if (name === '../middleware/auth' || name === '../middleware/admin') return (req, res, next) => next();
            if (name === 'fs') return { existsSync: () => true };
            return routeRequire(name);
        }
    };
    vm.runInNewContext(fs.readFileSync(filename, 'utf8'), context, { filename });
    const app = express();
    app.use('/api/admin', context.module.exports);
    const server = app.listen(0, '127.0.0.1');
    await new Promise(resolve => server.once('listening', resolve));
    t.after(() => new Promise(resolve => server.close(resolve)));
    const url = `http://127.0.0.1:${server.address().port}/api/admin/comics`;

    for (const error of [null, new Error('Database unavailable'), null]) {
        databaseError = error;
        const response = await fetch(url);
        assert.equal(response.status, error ? 503 : 200);
        assert.deepEqual(await response.json(), error
            ? { success: false, message: 'Could not load comics.' }
            : { success: true, comics });
    }
    assert.equal(promiseAttempts, 0);
});
