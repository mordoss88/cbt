/* Android widgets from expo-widgets set updatePeriodMillis="0", so the system never redraws them on its own
   and the saying only changes when the app opens. This sets a redraw about once an hour (Android allows 30 minutes
   at the least). Each redraw runs the widget layout again, and it picks today's saying from the list the app sent.
   Runs as a finalized mod, after expo-widgets wrote its files. */
const fs = require('fs');
const path = require('path');
const { withFinalizedMod } = require('expo/config-plugins');

const HOUR = 60 * 60 * 1000;

function setUpdatePeriod(xml, ms) {
  return xml.replace(/android:updatePeriodMillis="\d+"/, `android:updatePeriodMillis="${ms}"`);
}

const withWidgetRefresh = (config, { periodMillis = HOUR } = {}) =>
  withFinalizedMod(config, ['android', async (cfg) => {
    const dir = path.join(cfg.modRequest.platformProjectRoot, 'app/src/main/res/xml');
    if (fs.existsSync(dir)) {
      for (const f of fs.readdirSync(dir)) {
        if (!f.endsWith('_info.xml')) continue;
        const file = path.join(dir, f);
        const xml = fs.readFileSync(file, 'utf8');
        if (xml.includes('<appwidget-provider')) fs.writeFileSync(file, setUpdatePeriod(xml, Math.max(30 * 60 * 1000, periodMillis)));
      }
    }
    return cfg;
  }]);

module.exports = withWidgetRefresh;
module.exports.setUpdatePeriod = setUpdatePeriod;
