# Source and Changes

Code copied from https://github.com/FlowFuse/node-red-dashboard/tree/main
on 2026-10-23; upstream package.json version: 1.34.0.
Downloaded archive: https://codeload.github.com/FlowFuse/node-red-dashboard/tar.gz/refs/heads/main
Archive SHA-256: `58f194433f6645964a0855e6bf9a25c13f697adde63cd62edfbec50c7239315a`.

Files: `ui/src/widgets/ui-gauge/**`, `ui/src/components/icons/BatteryIcon.vue`,
`nodes/widgets/ui_gauge.{js,html}`, en-US translations/help, the icon, and
`asyncEvaluateNodeProperty`, `appendTopic`, and `getTopic` from `nodes/utils/index.js`.
The original license is preserved in LICENSE.

Integration structure based on https://github.com/FlowFuse/node-red-dashboard-2-ui-example
(Apache-2.0 license).

Changes: independent `ui-gauge-duration` registration, a `duration` editor field,
propagation to the UIGaugeDial value watcher, and `msg.ui_update.duration` support.
The dial component key excludes duration so duration and value can change in the
same message without remounting the component. Explicit `update(value, 0)` calls
and the original `update(value, duration = 1000)` method are preserved.
The runtime uses `group.getBase().stores.state`, as in the official example.
Original gauge CSS classes are retained on the root to preserve upstream styles.

Version 0.1.1 translates the added editor labels, help, and documentation to English.
