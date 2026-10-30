const VIEWPORT_BUFFER = 100;

// The viewport is measured in lines, so one long line (a base64 blob, minified JSON) can hold
// thousands of matches. Each mark re-renders its line, so the window of marks is capped and
// centred on the active match.
export const MAX_VIEWPORT_MARKS = 500;

const firstMatchIndexFromLine = (matches, line) => {
  let lo = 0, hi = matches.length - 1, start = matches.length;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (matches[mid].from.line >= line) {
      start = mid;
      hi = mid - 1;
    } else {
      lo = mid + 1;
    }
  }
  return start;
};

const markedRange = (matches, activeIndex, fromLine, toLine) => {
  const start = firstMatchIndexFromLine(matches, fromLine);
  let end = start;
  while (end < matches.length && matches[end].from.line <= toLine) end++;

  if (end - start <= MAX_VIEWPORT_MARKS) return { start, end };

  const anchor = Math.min(Math.max(activeIndex, start), end - 1);
  const windowStart = Math.min(
    Math.max(start, anchor - Math.floor(MAX_VIEWPORT_MARKS / 2)),
    end - MAX_VIEWPORT_MARKS
  );
  return { start: windowStart, end: windowStart + MAX_VIEWPORT_MARKS };
};

/**
 * Clears all existing marks and redraws only matches visible in the current
 * viewport ± VIEWPORT_BUFFER lines, at most MAX_VIEWPORT_MARKS of them. Always
 * marks the active match regardless of scroll position.
 *
 * @param {CodeMirror.Editor} editor
 * @param {Array}  matches      - full sorted match list
 * @param {number} activeIndex  - index of the current match
 * @param {Array}  marksRef     - mutable ref array to track active marks
 */
export function markViewportMatches(editor, matches, activeIndex, marksRef) {
  editor.operation(() => {
    marksRef.forEach((mark) => mark.clear());
    marksRef.length = 0;

    if (!matches.length) return;

    const viewport = editor.getViewport();
    const fromLine = Math.max(0, viewport.from - VIEWPORT_BUFFER);
    const toLine = viewport.to + VIEWPORT_BUFFER;
    const { start, end } = markedRange(matches, activeIndex, fromLine, toLine);

    for (let i = start; i < end; i++) {
      marksRef.push(editor.markText(matches[i].from, matches[i].to, {
        className: i === activeIndex ? 'cm-search-current' : 'cm-search-match',
        clearOnEnter: true
      }));
    }

    if ((activeIndex < start || activeIndex >= end) && matches[activeIndex]) {
      marksRef.push(editor.markText(matches[activeIndex].from, matches[activeIndex].to, {
        className: 'cm-search-current',
        clearOnEnter: true
      }));
    }
  });
}

/**
 * Clears all active marks.
 *
 * @param {Array} marksRef - mutable ref array tracking active marks
 */
export function clearMarks(marksRef) {
  marksRef.forEach((mark) => mark.clear());
  marksRef.length = 0;
}
