import { markViewportMatches, MAX_VIEWPORT_MARKS } from './markingUtils';

const makeEditor = () => ({
  operation: jest.fn((fn) => fn()),
  getViewport: jest.fn(() => ({ from: 0, to: 10 })),
  markText: jest.fn((from, to, opts) => ({ from, to, className: opts.className, clear: jest.fn() }))
});

const sameLineMatches = (count, line = 0) =>
  Array.from({ length: count }, (_, index) => ({
    from: { line, ch: index * 2 },
    to: { line, ch: index * 2 + 1 }
  }));

describe('markViewportMatches', () => {
  it('marks every viewport match when there are few of them', () => {
    const editor = makeEditor();
    const marks = [];

    markViewportMatches(editor, sameLineMatches(3), 1, marks);

    expect(marks.map((mark) => mark.className)).toEqual(['cm-search-match', 'cm-search-current', 'cm-search-match']);
  });

  it('marks inside a single editor operation', () => {
    const editor = makeEditor();

    markViewportMatches(editor, sameLineMatches(3), 0, []);

    expect(editor.operation).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['at the start of the line', 0, 0],
    ['in the middle of the line', 5_000, 5_000 - MAX_VIEWPORT_MARKS / 2],
    ['at the end of the line', 9_999, 10_000 - MAX_VIEWPORT_MARKS]
  ])('caps marks on one long line to a window around the active match %s', (_, activeIndex, firstMarkedIndex) => {
    const editor = makeEditor();
    const matches = sameLineMatches(10_000);
    const marks = [];

    markViewportMatches(editor, matches, activeIndex, marks);

    expect(marks).toHaveLength(MAX_VIEWPORT_MARKS);
    expect(marks[0].from).toBe(matches[firstMarkedIndex].from);
    expect(marks.filter((mark) => mark.className === 'cm-search-current')).toHaveLength(1);
    expect(marks.find((mark) => mark.className === 'cm-search-current').from).toBe(matches[activeIndex].from);
  });

  it('still marks the active match when it is outside the viewport', () => {
    const editor = makeEditor();
    const matches = [...sameLineMatches(2), { from: { line: 500, ch: 0 }, to: { line: 500, ch: 1 } }];
    const marks = [];

    markViewportMatches(editor, matches, 2, marks);

    expect(marks).toHaveLength(3);
    expect(marks[2]).toMatchObject({ from: matches[2].from, className: 'cm-search-current' });
  });

  it('clears the previous marks before drawing new ones', () => {
    const editor = makeEditor();
    const stale = { clear: jest.fn() };
    const marks = [stale];

    markViewportMatches(editor, sameLineMatches(1), 0, marks);

    expect(stale.clear).toHaveBeenCalled();
    expect(marks).not.toContain(stale);
  });
});
