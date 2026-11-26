/* Gives the Android widget its size. expo-widgets draws Android widgets with Glance in SizeMode.Exact, so the
   layout runs again for every size the person resizes the widget to, but it does not pass that size to the layout.
   This adds `width` and `height` (in dp) to the widget environment, so QuoteWidget.android.tsx can show more
   text when the widget is bigger. Runs after every install (package.json "postinstall"), so EAS builds get it.
   Safe to run twice. If expo-widgets changes this file, it prints a warning and the widget keeps its compact layout. */
const fs = require('fs');
const path = require('path');

const FROM = 'val environment = getWidgetEnvironment(appContext)\n';
const TO = 'val environment = getWidgetEnvironment(appContext) +\n'
  + '      mapOf("width" to size.width.value.toDouble(), "height" to size.height.value.toDouble()) // patched: widget size\n';

function patchSource(src) {
  if (src.includes('// patched: widget size')) return { src, status: 'already' };
  if (!src.includes(FROM) || !src.includes('size: DpSize')) return { src, status: 'missing' };
  return { src: src.replace(FROM, TO), status: 'patched' };
}

function run(root = path.join(__dirname, '..')) {
  const file = path.join(root, 'node_modules/expo-widgets/android/src/main/java/expo/modules/widgets/ExpoWidgetsPeekWidget.kt');
  if (!fs.existsSync(file)) return 'no-file';
  const { src, status } = patchSource(fs.readFileSync(file, 'utf8'));
  if (status === 'patched') fs.writeFileSync(file, src);
  if (status === 'missing') console.warn('[patch-expo-widgets] expo-widgets changed: the widget will not know its size.');
  return status;
}

if (require.main === module) run();
module.exports = { patchSource, run };
