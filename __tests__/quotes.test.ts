import { QUOTES, emptyQuoteState, pickQuote, pinQuote, rateQuote, ratedList, hash, quoteById, type QuoteState } from '../src/core/quotes';
import { mergeWidgetRatings, parsePending, widgetProps } from '../src/core/widgetSync';

const dayN = (n: number) => {
  const d = new Date(Date.UTC(2026, 10, 1 + n));
  return d.toISOString().slice(0, 10);
};

describe('quotes', () => {
  test('every quote has a unique id, text and a reason', () => {
    const ids = new Set(QUOTES.map((q) => q.id));
    expect(ids.size).toBe(QUOTES.length);
    expect(QUOTES.length).toBeGreaterThanOrEqual(30);
    for (const q of QUOTES) {
      expect(q.text.length).toBeGreaterThan(10);
      expect(q.text.length).toBeLessThanOrEqual(110); // fits a medium widget
      expect(q.why.length).toBeGreaterThan(10);
    }
    expect(QUOTES[0].text).toMatch(/I can't.*I can/);
  });

  test('the same day gives the same quote', () => {
    const s = emptyQuoteState();
    expect(pickQuote('2026-11-14', s).id).toBe(pickQuote('2026-11-14', s).id);
    expect(hash('abc')).toBe(hash('abc'));
  });

  test('a pinned day keeps its quote even after ratings change', () => {
    let s = emptyQuoteState();
    const { state, quote } = pinQuote(s, '2026-11-14');
    s = rateQuote(state, quote.id, 'down', '2026-11-14T08:00:00Z');
    expect(pickQuote('2026-11-14', s).id).toBe(quote.id);
    expect(pickQuote('2026-11-15', s).id).not.toBe(quote.id);
  });

  test('"Not for me" quotes never come back while others remain', () => {
    let s: QuoteState = emptyQuoteState();
    const banned = QUOTES.slice(0, 30).map((q) => q.id);
    banned.forEach((id) => { s = rateQuote(s, id, 'down', '2026-11-01T00:00:00Z'); });
    for (let i = 0; i < 60; i++) {
      const r = pinQuote(s, dayN(i));
      s = r.state;
      expect(banned).not.toContain(r.quote.id);
    }
  });

  test('if every quote is "Not for me", it still shows one', () => {
    let s = emptyQuoteState();
    QUOTES.forEach((q) => { s = rateQuote(s, q.id, 'down', '2026-11-01T00:00:00Z'); });
    expect(quoteById(pickQuote('2026-11-14', s).id)).not.toBeNull();
  });

  test('no repeats within 14 days while fresh quotes remain', () => {
    let s = emptyQuoteState();
    const ids: string[] = [];
    for (let i = 0; i < 15; i++) {
      const r = pinQuote(s, dayN(i));
      s = r.state;
      ids.push(r.quote.id);
    }
    expect(new Set(ids).size).toBe(15);
  });

  test('"Helps" quotes come back more often than unrated ones', () => {
    let s = emptyQuoteState();
    const liked = QUOTES.slice(0, 10).map((q) => q.id);
    liked.forEach((id) => { s = rateQuote(s, id, 'up', '2026-11-01T00:00:00Z'); });
    let likedDays = 0;
    // Without pinning, so the no-repeat rule does not hide the effect of the weights.
    for (let i = 0; i < 400; i++) if (liked.includes(pickQuote(dayN(i), s).id)) likedDays++;
    // 10 liked of 40: weight 30 of 90 → about a third of the days, against a quarter without ratings.
    expect(likedDays / 400).toBeGreaterThan(0.28);
  });

  test('pinQuote keeps 60 days of history', () => {
    let s = emptyQuoteState();
    for (let i = 0; i < 70; i++) s = pinQuote(s, dayN(i)).state;
    expect(s.shown.length).toBe(60);
    expect(s.shown[59].day).toBe(dayN(69));
  });

  test('rateQuote: newer wins, older is ignored, null clears, unknown ids are ignored', () => {
    let s = emptyQuoteState();
    s = rateQuote(s, 'q01', 'up', '2026-11-14T10:00:00Z');
    s = rateQuote(s, 'q01', 'down', '2026-11-14T09:00:00Z', 'widget');
    expect(s.ratings.q01.rating).toBe('up');
    s = rateQuote(s, 'q01', 'down', '2026-11-14T11:00:00Z', 'widget');
    expect(s.ratings.q01).toEqual({ id: 'q01', rating: 'down', at: '2026-11-14T11:00:00Z', from: 'widget' });
    s = rateQuote(s, 'q01', null, '2026-11-14T12:00:00Z');
    expect(s.ratings.q01).toBeUndefined();
    expect(rateQuote(s, 'nope', 'up', '2026-11-14T12:00:00Z')).toBe(s);
  });

  test('ratedList lists the newest first', () => {
    let s = emptyQuoteState();
    s = rateQuote(s, 'q02', 'up', '2026-11-10T00:00:00Z');
    s = rateQuote(s, 'q03', 'up', '2026-11-12T00:00:00Z');
    s = rateQuote(s, 'q04', 'down', '2026-11-11T00:00:00Z');
    expect(ratedList(s, 'up').map((r) => r.id)).toEqual(['q03', 'q02']);
    expect(ratedList(s, 'down')[0].quote.id).toBe('q04');
  });
});

describe('widget sync', () => {
  test('widgetProps carries the quote, the saved rating and an empty pending list', () => {
    let s = emptyQuoteState();
    s = rateQuote(s, 'q05', 'up', '2026-11-14T00:00:00Z');
    expect(widgetProps(quoteById('q05')!, '2026-11-14', s)).toEqual({
      quoteId: 'q05', text: quoteById('q05')!.text, day: '2026-11-14', rating: 'up', pending: '', url: 'cbtlog://today',
    });
    expect(widgetProps(quoteById('q06')!, '2026-11-14', s).rating).toBe('');
  });

  test('parsePending reads widget taps and skips broken parts', () => {
    const t = Date.parse('2026-11-14T07:00:00Z');
    expect(parsePending(`q01:up:${t};bad;q99:up:${t};q02:meh:${t};q03:down:x;q04:down:${t + 1000}`)).toEqual([
      { id: 'q01', rating: 'up', at: '2026-11-14T07:00:00.000Z' },
      { id: 'q04', rating: 'down', at: '2026-11-14T07:00:01.000Z' },
    ]);
    expect(parsePending('')).toEqual([]);
    expect(parsePending(undefined)).toEqual([]);
  });

  test('mergeWidgetRatings applies taps oldest first, so the last tap wins', () => {
    const t = Date.parse('2026-11-14T07:00:00Z');
    const props = [{ pending: `q01:down:${t + 2000}` }, { pending: `q01:up:${t}` }, null];
    const { state, added } = mergeWidgetRatings(emptyQuoteState(), props);
    expect(state.ratings.q01.rating).toBe('down');
    expect(state.ratings.q01.from).toBe('widget');
    expect(added).toBe(2);
  });

  test('a rating made in the app after the widget tap is kept', () => {
    const t = Date.parse('2026-11-14T07:00:00Z');
    let s = rateQuote(emptyQuoteState(), 'q01', 'up', new Date(t + 60000).toISOString());
    const r = mergeWidgetRatings(s, [{ pending: `q01:down:${t}` }]);
    expect(r.state.ratings.q01.rating).toBe('up');
    expect(r.added).toBe(0);
    s = r.state;
    // Syncing the same props twice adds nothing new.
    expect(mergeWidgetRatings(s, [{ pending: `q01:down:${t}` }]).added).toBe(0);
  });
});
