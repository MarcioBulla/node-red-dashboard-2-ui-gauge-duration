const { test, after } = require('node:test')
const assert = require('node:assert/strict')
const { JSDOM } = require('jsdom')
const dom = new JSDOM('<!doctype html><html><head></head><body></body></html>')
for (const key of ['window', 'document', 'Element', 'HTMLElement', 'SVGElement', 'Node']) global[key] = dom.window[key]
global.ResizeObserver = class { observe () {} disconnect () {} }
Object.defineProperty(Element.prototype, 'clientWidth', { get: () => 300 })
Object.defineProperty(Element.prototype, 'clientHeight', { get: () => 200 })
SVGElement.prototype.getBBox = () => ({ x: -140, y: -140, width: 280, height: 140 })
const { createApp, reactive, nextTick } = require('vue')
const { createStore } = require('vuex')
const { UIGaugeDuration } = require('../resources/ui-gauge-duration.umd.js')
const wait = ms => new Promise(resolve => setTimeout(resolve, ms))

function mountGauge (duration) {
    const host = document.createElement('div')
    document.body.append(host)
    const state = reactive({})
    const props = reactive({ duration, gtype: 'gauge-half', gstyle: 'needle',
        valueType: 'msg', min: 0, max: 100, width: 3, height: 3,
        segments: [{ from: 0, color: '#00ff00' }], sizeThickness: 16, sizeGap: 4, sizeKeyThickness: 8 })
    const store = createStore({ modules: { data: { namespaced: true, state: () => ({ messages: { gauge: { payload: 0 } } }),
        mutations: { bind: (state, { widgetId, msg }) => { state.messages[widgetId] = msg } } } } })
    const app = createApp(UIGaugeDuration, { id: 'gauge', props, state })
    app.use(store)
    app.provide('$socket', { emit () {} })
    app.provide('$dataTracker', () => {})
    app.component('v-icon', { template: '<i />' })
    app.directive('resize', {})
    app.mixin({ methods: {
        getProperty (key) { return this.state[key] === undefined ? this.props[key] : this.state[key] },
        updateDynamicProperty (key, value) { if (value !== undefined) this.state[key] = value }
    } })
    const vm = app.mount(host)
    return { app, vm, host, state, props, store, cleanup () { app.unmount(); host.remove() } }
}
function durations (element) {
    return Object.values(element.__transition || {}).map(transition => transition.duration)
}

test('compiled widget sends configured duration to both D3 transitions; initial draw remains 0', async () => {
    for (const [duration, expected] of [[undefined, 1000], [0, 0], [250, 250], [1000, 1000]]) {
        const ctx = mountGauge(duration)
        await nextTick()
        assert.deepEqual(durations(ctx.host.querySelector('#arc path')), [0])
        assert.deepEqual(durations(ctx.host.querySelector('#needle-container')), [0])
        await wait(40)
        ctx.vm.onInput({ payload: 75 })
        await nextTick()
        assert.ok(durations(ctx.host.querySelector('#arc path')).includes(expected))
        assert.ok(durations(ctx.host.querySelector('#needle-container')).includes(expected))
        // Stop transitions before removing the DOM.
        ctx.vm.$.subTree.component.proxy.update(75, 0)
        await wait(40)
        ctx.cleanup()
    }
})

test('duration and value in one message animate without replacing the dial', async () => {
    const ctx = mountGauge(1000)
    await nextTick()
    await wait(40)
    const dial = ctx.vm.$.subTree.component.proxy
    const element = ctx.host.querySelector('#arc path')
    ctx.vm.onDynamicProperties({ ui_update: { duration: 250 } })
    ctx.vm.onInput({ payload: 80 })
    await nextTick()
    assert.equal(ctx.vm.$.subTree.component.proxy, dial)
    assert.equal(ctx.host.querySelector('#arc path'), element)
    assert.equal(ctx.vm.dynamicProps.duration, 250)
    assert.ok(durations(element).includes(250))
    dial.update(80, 0)
    await wait(40)
    ctx.vm.onDynamicProperties({ ui_update: { duration: 0 } })
    ctx.vm.onInput({ payload: 100 })
    await nextTick()
    await wait(40)
    assert.ok(Math.abs(dial.lastAngle - Math.PI / 2) < 0.0001)
    ctx.cleanup()
})

test('invalid dynamic duration preserves current duration', async () => {
    const ctx = mountGauge(250)
    await nextTick()
    for (const duration of [-1, null, '', ' ', 'bad', Infinity]) {
        ctx.vm.onDynamicProperties({ ui_update: { duration } })
        assert.equal(ctx.vm.dynamicProps.duration, 250)
    }
    await wait(40)
    ctx.cleanup()
})

after(() => dom.window.close())
