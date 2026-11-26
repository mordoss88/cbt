/* Android widgets from expo-widgets set updatePeriodMillis="0", so the system never redraws them on its own
   and the saying only changes when the app opens. This sets a redraw about once an hour (Android allows 30 minutes
   at the least). Each redraw runs the widget layout again, and it picks today's saying from the list the app sent.
   It also makes the widget resizable in small steps: expo-widgets writes only minWidth/minHeight, which Android also uses
   as the smallest resize size (250dp wide is 4 cells, so it could not shrink). This adds minResizeWidth/Height
   (2x1 cells) and maxResizeWidth/Height (about a whole phone screen). The layout follows the size, see QuoteWidget.android.tsx.
   Runs as a finalized mod, after expo-widgets wrote its files. */
const fs = require('fs');
const path = require('path');
const { withFinalizedMod } = require('expo/config-plugins');

const HOUR = 60 * 60 * 1000;

function setUpdatePeriod(xml, ms) {
  return xml.replace(/android:updatePeriodMillis="\d+"/, `android:updatePeriodMillis="${ms}"`);
}

const RESIZE = { minResizeWidth: 110, minResizeHeight: 40, maxResizeWidth: 530, maxResizeHeight: 600 };

/* Sets (or replaces) the resize sizes in dp and makes sure the widget can be resized both ways. */
function setResize(xml, sizes = RESIZE) {
  let out = xml;
  for (const [k, v] of Object.entries(sizes)) {
    const attr = `android:${k}="${v}dp"`;
    const re = new RegExp(`android:${k}="[^"]*"`);
    out = re.test(out) ? out.replace(re, attr) : out.replace('<appwidget-provider', `<appwidget-provider\n  ${attr}`)
      .replace(/(<appwidget-provider)\n  ([^\n]*)(\s+xmlns:android="[^"]*")/, '$1$3\n  $2');
  }
  return out.replace(/android:resizeMode="[^"]*"/, 'android:resizeMode="horizontal|vertical"');
}

const withWidgetRefresh = (config, { periodMillis = HOUR } = {}) =>
  withFinalizedMod(config, ['android', async (cfg) => {
    const dir = path.join(cfg.modRequest.platformProjectRoot, 'app/src/main/res/xml');
    if (fs.existsSync(dir)) {
      for (const f of fs.readdirSync(dir)) {
        if (!f.endsWith('_info.xml')) continue;
        const file = path.join(dir, f);
        const xml = fs.readFileSync(file, 'utf8');
        if (xml.includes('<appwidget-provider')) fs.writeFileSync(file, setResize(setUpdatePeriod(xml, Math.max(30 * 60 * 1000, periodMillis))));
      }
    }
    return cfg;
  }]);

module.exports = withWidgetRefresh;
module.exports.setUpdatePeriod = setUpdatePeriod;
module.exports.setResize = setResize;
module.exports.RESIZE = RESIZE;
