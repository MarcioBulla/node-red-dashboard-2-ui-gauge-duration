const { test } = require('node:test')
const assert = require('node:assert/strict')
const register = require('../nodes/ui-gauge-duration.js')

function setup (overrides = {}, missingGroup = false) {
    let Constructor, registered
    const saved = [], warnings = [], errors = []
    const base = { stores: { state: { set: (...args) => saved.push(args) } } }
    const group = { getBase: () => base, register: (node, config, events) => { registered = { node, config, events } } }
    register({
        nodes: {
            registerType: (type, ctor) => { assert.equal(type, 'ui-gauge-duration'); Constructor = ctor },
            createNode: (node) => { node.warn = text => warnings.push(text); node.error = text => errors.push(text) },
            getNode: () => missingGroup ? undefined : group
        },
        util: { evaluateNodeProperty: (value, type, node, msg, callback) => {
            if (value === 'error') return callback(new Error('test error'))
            callback(null, type === 'msg' ? msg[value] : type === 'num' ? Number(value) : value)
        } }
    })
    new Constructor({ group: 'group', min: '0', max: '100', sizeThickness: '16',
        sizeGap: '4', sizeKeyThickness: '8', segments: [{ from: '0', color: '#00ff00' }], ...overrides })
    return { ...registered, base, saved, warnings, errors }
}

test('defaults, zero, and invalid configuration durations', () => {
    for (const [duration, expected] of [[undefined, 1000], [0, 0], ['250', 250], [-1, 1000], ['', 1000], [null, 1000], [Infinity, 1000]]) {
        assert.equal(setup({ duration }).config.duration, expected)
    }
})

test('dynamic duration persists with the original client-scoped message and keeps payload', async () => {
    const ctx = setup()
    const msg = { payload: 75, _client: { socketId: 'client' }, ui_update: { duration: '250', min: 10, title: 'Speed' } }
    assert.equal(await ctx.events.beforeSend(msg), msg)
    const saved = Object.fromEntries(ctx.saved.map(args => [args[3], args[4]]))
    assert.equal(saved.duration, 250)
    assert.equal(saved.min, 10)
    assert.equal(saved.label, 'Speed')
    assert.equal(ctx.saved[0][2], msg)
    assert.equal(msg.payload, 75)
    await ctx.events.beforeSend({ ui_update: { duration: 0 } })
    assert.equal(ctx.saved.at(-1)[4], 0)
})

test('invalid updates cannot poison persisted duration or outgoing ui_update', async () => {
    const ctx = setup()
    for (const duration of [-1, NaN, Infinity, '', ' ', null, 'invalid']) {
        const msg = { payload: 50, ui_update: { duration } }
        await ctx.events.beforeSend(msg)
        assert.equal('duration' in msg.ui_update, false)
    }
    assert.equal(ctx.saved.length, 0)
    assert.equal(ctx.warnings.length, 7)
})

test('typed values retain original evaluation and error behavior', async () => {
    const ctx = setup({ value: 'reading', valueType: 'msg' })
    assert.equal((await ctx.events.beforeSend({ reading: 42, payload: 1 })).payload, 42)
    const failed = setup({ value: 'error', valueType: 'msg' })
    assert.equal((await failed.events.beforeSend({ payload: 9 })).payload, 9)
    assert.equal(failed.warnings.length, 1)
})

test('missing group reports a Node-RED error', () => {
    assert.deepEqual(setup({}, true).errors, ['No group configured'])
})
