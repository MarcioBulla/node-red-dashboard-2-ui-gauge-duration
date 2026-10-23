<template>
    <component :is="`ui-${gtype}`" v-if="['gauge-tile', 'gauge-battery', 'gauge-tank'].includes(gtype)" class="nrdb-ui-gauge" :id="id" :props="dynamicProps" :value="value" />
    <ui-gauge-dial v-else class="nrdb-ui-gauge" :id="id" :key="updateGaugeDial" :props="dynamicProps" :value="value" />
</template>

<script>
import { mapState } from 'vuex' // eslint-disable-line import/order

import UIGaugeBattery from './types/UIGaugeBattery.vue'
import UIGaugeDial from './types/UIGaugeDial.vue'
import UIGaugeTank from './types/UIGaugeTank.vue'
import UIGaugeTile from './types/UIGaugeTile.vue'

export default {
    name: 'UIGaugeDuration',
    components: {
        'ui-gauge-battery': UIGaugeBattery,
        'ui-gauge-tank': UIGaugeTank,
        'ui-gauge-dial': UIGaugeDial,
        'ui-gauge-tile': UIGaugeTile
    },
    inject: ['$socket', '$dataTracker'],
    props: {
        id: { type: String, required: true },
        props: { type: Object, default: () => ({}) },
        state: { type: Object, default: () => ({}) }
    },
    computed: {
        ...mapState('data', ['messages']),
        value: function () {
            // if the value field is of type number or string then fetch the value from the properties
            // rather than the payload, so that the value is displayed immediately
            return (this.props.valueType === 'num' || this.props.valueType === 'str')
                ? this.props.value
                : this.messages[this.id]?.payload
        },
        label () {
            return this.getProperty('label')
        },
        gtype () {
            return this.getProperty('gtype')
        },
        gstyle () {
            return this.getProperty('gstyle')
        },
        prefix () {
            return this.getProperty('prefix')
        },
        suffix () {
            return this.getProperty('suffix')
        },
        units () {
            return this.getProperty('units')
        },
        icon () {
            return this.getProperty('icon')
        },
        segments () {
            return this.getProperty('segments')
        },
        min () {
            return this.getProperty('min')
        },
        max () {
            return this.getProperty('max')
        },
        duration () {
            const raw = this.getProperty('duration')
            const value = Number(raw)
            return raw !== null && raw !== '' && Number.isFinite(value) && value >= 0 ? value : 1000
        },
        dynamicProps () {
            const props = {
                ...this.props,
                label: this.label || this.props.title, // Get dynamic label or fallback to legacy title
                gtype: this.gtype,
                gstyle: this.gstyle,
                prefix: this.prefix,
                suffix: this.suffix,
                units: this.units,
                icon: this.icon,
                segments: this.segments,
                min: this.min,
                max: this.max,
                duration: this.duration
            }
            delete props.title
            return props
        },
        updateGaugeDial () {
            // Duration changes must not remount the dial: that would skip the animation.
            const { duration, ...appearance } = this.dynamicProps
            return JSON.stringify(appearance)
        }
    },
    created () {
        this.$dataTracker(this.id, this.onInput, null, this.onDynamicProperties)
    },
    methods: {
        onDynamicProperties (msg) {
            const updates = msg.ui_update
            if (!updates) {
                return
            }
            const hasLabelKey = Object.keys(updates).includes('label')
            const hasTitleKey = Object.keys(updates).includes('title')
            if (!hasLabelKey && hasTitleKey) {
                updates.label = updates.title
            }
            this.updateDynamicProperty('label', updates.label)
            this.updateDynamicProperty('gtype', updates.gtype)
            this.updateDynamicProperty('gstyle', updates.gstyle)
            this.updateDynamicProperty('prefix', updates.prefix)
            this.updateDynamicProperty('suffix', updates.suffix)
            this.updateDynamicProperty('units', updates.units)
            this.updateDynamicProperty('icon', updates.icon)
            this.updateDynamicProperty('segments', updates.segments)
            this.updateDynamicProperty('min', updates.min)
            this.updateDynamicProperty('max', updates.max)
            const duration = Number(updates.duration)
            if (updates.duration !== undefined && updates.duration !== null &&
                String(updates.duration).trim() !== '' && Number.isFinite(duration) && duration >= 0) {
                this.updateDynamicProperty('duration', duration)
            }
        },
        onInput (msg) {
            if (typeof msg.payload !== 'undefined') {
                this.$store.commit('data/bind', {
                    widgetId: this.id,
                    msg
                })
            }
        }
    }
}
</script>

<style>
.nrdb-ui-gauge {
    position: relative;
}
</style>
