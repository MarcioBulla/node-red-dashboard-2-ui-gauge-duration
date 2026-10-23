# Configurable Duration Gauge for FlowFuse Dashboard

A third-party widget derived from the official `ui-gauge`. It retains the upstream
components, styles, gauge types (Half, 3/4, Tile, Battery, and Tank), segments,
typed inputs, and dynamic properties. It adds a **Duration (ms)** editor setting
for the Half and 3/4 gauges, with both Needle and Rounded styles.

- Default: `1000` ms, matching the original behavior.
- `0`: update without animation.
- Accepts finite numbers greater than or equal to zero.
- Duration controls the D3 arc and needle transitions. It does not change the
  Tank waves or animations in other gauge types.
- Initial rendering and resizing continue to use duration `0`.

## Installation

Requires Node-RED 3+ and an existing installation of
`@flowfuse/node-red-dashboard` 1.34.0 or later.
This package supports FlowFuse Dashboard (Dashboard 2).

Until the package is published on npm, install the compiled `.tgz` downloaded from
[GitHub Releases](https://github.com/MarcioBulla/node-red-dashboard-2-ui-gauge-duration/releases)
from your Node-RED user directory:

```sh
cd ~/.node-red
npm install /path/to/node-red-dashboard-2-ui-gauge-duration-0.1.1.tgz
```

Restart Node-RED. Add **gauge duration** from the Dashboard category, select a group,
and set **Duration (ms)**. The node uses the independent `ui-gauge-duration` type
and can coexist with the original gauge.

To reuse settings from an exported flow, change `type` from `ui-gauge` to
`ui-gauge-duration` on the desired nodes and add `"duration": 1000`.
When importing a copy, let Node-RED generate new IDs.

## Runtime Updates

The editor setting is sufficient. Optionally, use the Dashboard dynamic property
convention:

```js
msg.payload = 75;
msg.ui_update = { duration: 250 };
return msg;
```

This sets the duration for this and subsequent updates. You can also send
`msg.ui_update = { duration: 0 }`. Dynamic duration is stored in Dashboard state
for new clients; invalid values are ignored with a warning.

The original method remains `update(value, duration = 1000)`. The main change
is in the `UIGaugeDial.vue` value watcher:

```js
this.update(val, this.props.duration ?? 1000)
```

Duration flows from the editor to the runtime, parent component, and dial.
Changing only `duration` does not remount the dial or move its value; the setting
takes effect on the next value change.

## Development

```sh
npm ci
npm run build
npm test
npm pack
```

Node.js 20.19+ is required to build. The bundle at
`resources/ui-gauge-duration.umd.js` includes D3 and CSS; Dashboard provides
Vue and Vuex.

Source details and changes are documented in [UPSTREAM.md](UPSTREAM.md).
The Apache-2.0 license is preserved. The reference is the upstream `main` code
downloaded on 2026-10-23, with manifest version 1.34.0.

### Layout Compatibility

In the Grid layout, Dashboard has an internal automatic height rule specific to
the native `ui-gauge` type in 3/4 mode. For the same height with this widget,
explicitly set the height to **3** instead of automatic in that case.

Automated tests cover the runtime with a simulated Dashboard API and the compiled
Vue components in a simulated DOM. Appearance and integration in a real Node-RED
instance still need to be checked in your environment.
