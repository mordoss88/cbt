import { QUOTES, emptyQuoteState, pickQuote, pinQuote, quotesForSet, rateQuote, setSayingSet, type QuoteState } from '../src/core/quotes';
import { WIDGET_DAYS, nextDayKeys, widgetDayFor, widgetProps, widgetSchedule, type WidgetDay } from '../src/core/widgetSync';

/* The Android widget body. expo-widgets turns it into source text that runs in the widget runtime, with the
   components, modifiers and _jsx as globals. Run that same text here with plain stubs. */
jest.mock('expo-widgets', () => ({ createWidget: (_name: string, src: unknown) => src }));
jest.mock('@expo/ui/jetpack-compose', () => ({}));
jest.mock('@expo/ui/jetpack-compose/modifiers', () => ({}));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const widgetSource = require('../src/widgets/QuoteWidget.android').default as string;
const el = (type: string) => ({ type });
const COMPONENTS = ['Button', 'Column', 'OutlinedButton', 'Row', 'Spacer', 'Text'];
const MODIFIERS = ['background', 'cornerRadius', 'fillMaxSize', 'fillMaxWidth', 'height', 'padding', 'width'];
const jsx = (c: { type: string }, props: Record<string, unknown>) => ({ type: c.type, props });
const AndroidWidget = new Function('_jsx', '_jsxs', ...COMPONENTS, ...MODIFIERS, 'return (' + widgetSource + ')')(
  jsx, jsx, ...COMPONENTS.map(el), ...MODIFIERS.map(() => () => ({})),
) as (p: object, env?: object) => any;

/* Collects every string in the rendered tree. */
function texts(node: any): string[] {
  if (node == null || typeof node === 'boolean') return [];
  if (typeof node === 'string') return [node];
  if (Array.isArray(node)) return node.flatMap(texts);
  if (typeof node === 'object' && 'props' in node) return texts(node.props.children);
  return [];
}
function findTexts(node: any, out: any[] = []): any[] {
  if (!node || typeof node !== 'object') return out;
  if (Array.isArray(node)) { node.forEach((n) => findTexts(n, out)); return out; }
  if (node.type === 'Text') out.push(node);
  findTexts(node.props?.children, out);
  return out;
}
function findButtons(node: any, out: any[] = []): any[] {
  if (!node || typeof node !== 'object') return out;
  if (Array.isArray(node)) { node.forEach((n) => findButtons(n, out)); return out; }
  if (node.props?.onClick) out.push(node);
  findButtons(node.props?.children, out);
  return out;
}

const NOW = new Date(2026, 10, 17, 9, 0).getTime(); // 17 Nov 2026, local time

describe('daily sayings on the widget', () => {
  test('nextDayKeys gives today and the next days in local time, across month ends and the clock change', () => {
    expect(nextDayKeys(NOW, 3)).toEqual(['2026-11-17', '2026-11-18', '2026-11-19']);
    expect(nextDayKeys(new Date(2026, 11, 30, 23, 59).getTime(), 3)).toEqual(['2026-12-30', '2026-12-31', '2027-01-01']);
    expect(nextDayKeys(new Date(2026, 2, 28, 0, 30).getTime(), 3)).toEqual(['2026-03-28', '2026-03-29', '2026-03-30']);
    expect(nextDayKeys(NOW)).toHaveLength(WIDGET_DAYS);
  });

  test('the schedule starts with the pinned saying of today and has no repeats in 14 days', () => {
    const keys = nextDayKeys(NOW);
    const s = pinQuote(emptyQuoteState(), keys[0]).state;
    const days = widgetSchedule(s, keys);
    expect(days.map((d) => d[0])).toEqual(keys);
    expect(days[0][1]).toBe(pickQuote(keys[0], s).id);
    expect(new Set(days.map((d) => d[1])).size).toBe(WIDGET_DAYS);
    // Nothing is pinned for real.
    expect(s.shown).toHaveLength(1);
  });

  test('the schedule carries ratings and leaves out "Not for me" sayings', () => {
    const keys = nextDayKeys(NOW);
    let s: QuoteState = emptyQuoteState();
    s = rateQuote(s, 'p01', 'up', '2026-11-16T10:00:00Z');
    s = rateQuote(s, 's01', 'down', '2026-11-16T10:00:00Z');
    const days = widgetSchedule(s, keys);
    expect(days.some((d) => d[1] === 's01')).toBe(false);
    for (const d of days) expect(d[3]).toBe(d[1] === 'p01' ? 'up' : '');
  });

  test('widgetDayFor picks today, else the last day before today, else the first', () => {
    const days: WidgetDay[] = [['2026-11-17', 'p01', 'a', ''], ['2026-11-18', 'p02', 'b', ''], ['2026-11-19', 'p03', 'c', '']];
    expect(widgetDayFor(days, '2026-11-18')?.[1]).toBe('p02');
    expect(widgetDayFor(days, '2026-11-25')?.[1]).toBe('p03');
    expect(widgetDayFor(days, '2026-11-10')?.[1]).toBe('p01');
    expect(widgetDayFor([], '2026-11-18')).toBeNull();
  });
});

describe('the Android widget picks the day itself', () => {
  const keys = nextDayKeys(NOW);
  const s = pinQuote(emptyQuoteState(), keys[0]).state;
  const days = widgetSchedule(s, keys);
  const props = widgetProps(pickQuote(keys[0], s), keys[0], s, days);
  afterEach(() => jest.useRealTimers());

  test('shows a new saying the next day without the app', () => {
    jest.useFakeTimers().setSystemTime(NOW);
    expect(texts(AndroidWidget(props))).toContain(days[0][2]);
    jest.setSystemTime(new Date(2026, 10, 18, 0, 10));
    expect(texts(AndroidWidget(props))).toContain(days[1][2]);
    jest.setSystemTime(new Date(2026, 10, 30, 8, 0));
    expect(texts(AndroidWidget(props))).toContain(days[13][2]);
    // Past the end of the list it keeps the last one, until the app sends a new list.
    jest.setSystemTime(new Date(2026, 11, 5, 8, 0));
    expect(texts(AndroidWidget(props))).toContain(days[13][2]);
  });

  test('a rating tap rates the saying shown today, and marks it in the list', () => {
    jest.useFakeTimers().setSystemTime(new Date(2026, 10, 19, 8, 0));
    const helps = findButtons(AndroidWidget(props))[0];
    const next = helps.props.onClick();
    expect(next.pending).toMatch(new RegExp('^' + days[2][1] + ':up:\\d+$'));
    const after = JSON.parse(next.days) as WidgetDay[];
    expect(after[2][3]).toBe('up');
    expect(texts(AndroidWidget(next))).toContain('Helps ✓');
  });

  test('each button label is its own Text with a color that differs from the pill (blank pills on the phone)', () => {
    jest.useFakeTimers().setSystemTime(NOW);
    for (const tree of [AndroidWidget(props), AndroidWidget({ ...props, days: JSON.stringify(days.map((d) => [d[0], d[1], d[2], 'up'])) })]) {
      const buttons = findButtons(tree);
      expect(buttons).toHaveLength(2);
      for (const b of buttons) {
        expect(b.type).toBe('Button');
        expect(b.props.target).toMatch(/^rate-(up|down)$/);
        const inner = b.props.children;
        expect(inner.type).toBe('Row'); // not a bare Text, so expo-widgets draws our Text, not a Glance button label
        const label = inner.props.children;
        expect(label.type).toBe('Text');
        expect(label.props.color).not.toBe(b.props.colors.containerColor);
      }
    }
  });

  test('the layout follows the widget size', () => {
    jest.useFakeTimers().setSystemTime(NOW);
    const saying = (env?: object) => findTexts(AndroidWidget(props, env)).find((t) => t.props.children === days[0][2]);
    // No size known (older build, or a button press): the compact 2-line layout.
    expect(saying()?.props.maxLines).toBe(2);
    // 4x1: one or two lines, small text, full button labels.
    const small = AndroidWidget(props, { width: 320, height: 90 });
    expect(saying({ width: 320, height: 90 })?.props.maxLines).toBe(2);
    expect(texts(small)).toContain('Not for me');
    expect(texts(small)).not.toContain('Saying for today');
    // 4x2 and bigger: more lines, bigger text, a title.
    const big = saying({ width: 320, height: 220 });
    expect(big?.props.maxLines).toBeGreaterThan(4);
    expect(big?.props.style.fontSize).toBe(18);
    expect(texts(AndroidWidget(props, { width: 320, height: 220 }))).toContain('Saying for today');
    // Narrow (2 cells): short labels, same button targets.
    const narrow = AndroidWidget(props, { width: 150, height: 90 });
    expect(texts(narrow)).toContain('👍');
    expect(findButtons(narrow).map((b) => b.props.target)).toEqual(['rate-up', 'rate-down']);
    // Never less than one line.
    expect(saying({ width: 150, height: 40 })?.props.maxLines).toBe(1);
  });

  test('old props without a list still work', () => {
    const { days: _d, ...old } = props;
    expect(texts(AndroidWidget(old))).toContain(props.text);
  });
});

describe('saying sets', () => {
  test('each set has its own sayings plus the ones that fit both', () => {
    const p = quotesForSet('procrastination');
    const so = quotesForSet('social');
    expect(quotesForSet('mix')).toHaveLength(QUOTES.length);
    expect(p.every((q) => q.topic !== 'social')).toBe(true);
    expect(so.every((q) => q.topic !== 'procrastination')).toBe(true);
    expect(p.length).toBeGreaterThanOrEqual(20);
    expect(so.length).toBeGreaterThanOrEqual(20);
  });

  test('switching the set changes today when today is not in the set, and the widget list follows', () => {
    const keys = nextDayKeys(NOW);
    let s = emptyQuoteState();
    for (let i = 0; i < 30; i++) s = pinQuote(s, nextDayKeys(NOW - (30 - i) * 864e5, 1)[0]).state;
    s = pinQuote(s, keys[0]).state;
    const before = pickQuote(keys[0], s);
    const other = before.topic === 'social' ? 'procrastination' : 'social';
    const t = setSayingSet(s, other);
    const now = pinQuote(t, keys[0]).quote;
    expect(now.topic === undefined || now.topic === other).toBe(true);
    for (const d of widgetSchedule(t, keys)) {
      const q = QUOTES.find((x) => x.id === d[1])!;
      expect(q.topic === undefined || q.topic === other).toBe(true);
    }
    expect(setSayingSet(t, other)).toBe(t);
  });

  test('a saying that fits the new set stays for today', () => {
    let s = emptyQuoteState();
    s = { ...s, shown: [{ day: '2026-11-17', id: 'q07' }] };
    expect(pickQuote('2026-11-17', setSayingSet(s, 'social')).id).toBe('q07');
  });
});

describe('widget refresh plugin', () => {
  test('sets an hourly redraw in the widget info xml', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { setUpdatePeriod } = require('../plugins/with-widget-refresh');
    expect(setUpdatePeriod('<appwidget-provider android:updatePeriodMillis="0" />', 3600000))
      .toBe('<appwidget-provider android:updatePeriodMillis="3600000" />');
  });

  test('makes the widget resizable from 2x1 cells, both ways, and runs twice safely', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { setResize } = require('../plugins/with-widget-refresh');
    const xml = '<?xml version="1.0" encoding="utf-8"?>\n<appwidget-provider xmlns:android="http://schemas.android.com/apk/res/android"\n'
      + '  android:minWidth="250dp"\n  android:minHeight="50dp"\n  android:resizeMode="horizontal"\n  android:widgetCategory="home_screen" />\n';
    const out = setResize(xml);
    expect(out).toContain('android:minResizeWidth="110dp"');
    expect(out).toContain('android:minResizeHeight="40dp"');
    expect(out).toContain('android:maxResizeWidth="530dp"');
    expect(out).toContain('android:maxResizeHeight="600dp"');
    expect(out).toContain('android:resizeMode="horizontal|vertical"');
    expect(out).toMatch(/<appwidget-provider xmlns:android=/); // the namespace stays first
    expect(setResize(out)).toBe(out);
  });

  test('the expo-widgets patch passes the widget size to the layout', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { patchSource } = require('../scripts/patch-expo-widgets');
    const src = 'override fun provideRoot(\n    size: DpSize\n  ): Emittable {\n    val environment = getWidgetEnvironment(appContext)\n    val node = 1\n';
    const a = patchSource(src);
    expect(a.status).toBe('patched');
    expect(a.src).toContain('"width" to size.width.value.toDouble()');
    expect(patchSource(a.src).status).toBe('already');
    expect(patchSource('something else').status).toBe('missing');
  });
});
