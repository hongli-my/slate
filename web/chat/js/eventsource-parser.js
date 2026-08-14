// eventsource-parser v3.1.0 - Browser IIFE bundle
// Source: https://github.com/rexxars/eventsource-parser
// License: MIT
(function(global) {
  'use strict';

  class ParseError extends Error {
    constructor(message, options) {
      super(message);
      this.name = 'ParseError';
      this.type = options.type;
      this.field = options.field;
      this.value = options.value;
      this.line = options.line;
    }
  }

  const LF = 10, CR = 13, SPACE = 32;

  function noop(_arg) {}

  function createParser(config) {
    if (typeof config === 'function') {
      throw new TypeError(
        '`config` must be an object, got a function instead. Did you mean `createParser({onEvent: fn})`?'
      );
    }

    const { onEvent = noop, onError = noop, onRetry = noop, onComment, maxBufferSize } = config;
    const pendingFragments = [];
    let pendingFragmentsLength = 0,
      isFirstChunk = true,
      id,
      data = '',
      dataLines = 0,
      eventType,
      terminated = false;

    function feed(chunk) {
      if (terminated) {
        throw new Error(
          'Cannot feed parser: it was terminated after exceeding the configured max buffer size. Call `reset()` to resume parsing.'
        );
      }

      if (isFirstChunk) {
        isFirstChunk = false;
        if (chunk.charCodeAt(0) === 239 && chunk.charCodeAt(1) === 187 && chunk.charCodeAt(2) === 191) {
          chunk = chunk.slice(3);
        }
      }

      if (pendingFragments.length === 0) {
        const trailing = processLines(chunk);
        if (trailing !== '') {
          pendingFragments.push(trailing);
          pendingFragmentsLength = trailing.length;
        }
        checkBufferSize();
        return;
      }

      if (chunk.indexOf('\n') === -1 && chunk.indexOf('\r') === -1) {
        pendingFragments.push(chunk);
        pendingFragmentsLength += chunk.length;
        checkBufferSize();
        return;
      }

      pendingFragments.push(chunk);
      const input = pendingFragments.join('');
      pendingFragments.length = 0;
      pendingFragmentsLength = 0;

      const trailing = processLines(input);
      if (trailing !== '') {
        pendingFragments.push(trailing);
        pendingFragmentsLength = trailing.length;
      }
      checkBufferSize();
    }

    function checkBufferSize() {
      if (maxBufferSize !== undefined && pendingFragmentsLength + data.length > maxBufferSize) {
        terminated = true;
        pendingFragments.length = 0;
        pendingFragmentsLength = 0;
        id = undefined;
        data = '';
        dataLines = 0;
        eventType = undefined;
        onError(
          new ParseError(
            `Buffered data exceeded max buffer size of ${maxBufferSize} characters`,
            { type: 'max-buffer-size-exceeded' }
          )
        );
      }
    }

    function processLines(chunk) {
      let searchIndex = 0;

      if (chunk.indexOf('\r') === -1) {
        let lfIndex = chunk.indexOf('\n', searchIndex);
        while (lfIndex !== -1) {
          if (searchIndex === lfIndex) {
            dispatchEvent();
            searchIndex = lfIndex + 1;
            lfIndex = chunk.indexOf('\n', searchIndex);
            continue;
          }
          const firstCharCode = chunk.charCodeAt(searchIndex);
          if (isDataPrefix(chunk, searchIndex, firstCharCode)) {
            const valueStart = chunk.charCodeAt(searchIndex + 5) === SPACE ? searchIndex + 6 : searchIndex + 5;
            const value = chunk.slice(valueStart, lfIndex);
            if (dataLines === 0 && chunk.charCodeAt(lfIndex + 1) === LF) {
              onEvent({ id, event: eventType, data: value });
              id = undefined;
              data = '';
              eventType = undefined;
              searchIndex = lfIndex + 2;
              lfIndex = chunk.indexOf('\n', searchIndex);
              continue;
            }
            data = dataLines === 0 ? value : data + '\n' + value;
            dataLines++;
          } else if (isEventPrefix(chunk, searchIndex, firstCharCode)) {
            eventType = chunk.slice(
              chunk.charCodeAt(searchIndex + 6) === SPACE ? searchIndex + 7 : searchIndex + 6,
              lfIndex
            ) || undefined;
          } else {
            parseLine(chunk, searchIndex, lfIndex);
          }
          searchIndex = lfIndex + 1;
          lfIndex = chunk.indexOf('\n', searchIndex);
        }
        return chunk.slice(searchIndex);
      }

      while (searchIndex < chunk.length) {
        const crIndex = chunk.indexOf('\r', searchIndex);
        const lfIndex = chunk.indexOf('\n', searchIndex);
        let lineEnd = -1;

        if (crIndex !== -1 && lfIndex !== -1) {
          lineEnd = crIndex < lfIndex ? crIndex : lfIndex;
        } else if (crIndex !== -1) {
          lineEnd = crIndex === chunk.length - 1 ? -1 : crIndex;
        } else if (lfIndex !== -1) {
          lineEnd = lfIndex;
        }

        if (lineEnd === -1) break;
        parseLine(chunk, searchIndex, lineEnd);
        searchIndex = lineEnd + 1;
        if (chunk.charCodeAt(searchIndex - 1) === CR && chunk.charCodeAt(searchIndex) === LF) {
          searchIndex++;
        }
      }
      return chunk.slice(searchIndex);
    }

    function parseLine(chunk, start, end) {
      if (start === end) {
        dispatchEvent();
        return;
      }
      const firstCharCode = chunk.charCodeAt(start);

      if (isDataPrefix(chunk, start, firstCharCode)) {
        const valueStart = chunk.charCodeAt(start + 5) === SPACE ? start + 6 : start + 5;
        const value = chunk.slice(valueStart, end);
        data = dataLines === 0 ? value : data + '\n' + value;
        dataLines++;
        return;
      }

      if (isEventPrefix(chunk, start, firstCharCode)) {
        eventType = chunk.slice(
          chunk.charCodeAt(start + 6) === SPACE ? start + 7 : start + 6,
          end
        ) || undefined;
        return;
      }

      if (firstCharCode === 105 && chunk.charCodeAt(start + 1) === 100 && chunk.charCodeAt(start + 2) === 58) {
        const value = chunk.slice(
          chunk.charCodeAt(start + 3) === SPACE ? start + 4 : start + 3,
          end
        );
        id = value.includes('\0') ? undefined : value;
        return;
      }

      if (firstCharCode === 58) {
        if (onComment) {
          const line = chunk.slice(start, end);
          onComment(line.slice(chunk.charCodeAt(start + 1) === SPACE ? 2 : 1));
        }
        return;
      }

      const line = chunk.slice(start, end);
      const fieldSeparatorIndex = line.indexOf(':');
      if (fieldSeparatorIndex === -1) {
        processField(line, '', line);
        return;
      }
      const field = line.slice(0, fieldSeparatorIndex);
      const offset = line.charCodeAt(fieldSeparatorIndex + 1) === SPACE ? 2 : 1;
      const value = line.slice(fieldSeparatorIndex + offset);
      processField(field, value, line);
    }

    function processField(field, value, line) {
      switch (field) {
        case 'event':
          eventType = value || undefined;
          break;
        case 'data':
          data = dataLines === 0 ? value : data + '\n' + value;
          dataLines++;
          break;
        case 'id':
          id = value.includes('\0') ? undefined : value;
          break;
        case 'retry':
          if (/^\d+$/.test(value)) {
            onRetry(parseInt(value, 10));
          } else {
            onError(new ParseError('Invalid `retry` value: "' + value + '"', {
              type: 'invalid-retry',
              value,
              line
            }));
          }
          break;
        default:
          onError(new ParseError(
            'Unknown field "' + (field.length > 20 ? field.slice(0, 20) + '\u2026' : field) + '"',
            { type: 'unknown-field', field, value, line }
          ));
          break;
      }
    }

    function dispatchEvent() {
      if (dataLines > 0) {
        onEvent({ id, event: eventType, data });
      }
      id = undefined;
      data = '';
      dataLines = 0;
      eventType = undefined;
    }

    function reset(options) {
      options = options || {};
      if (options.consume && pendingFragments.length > 0) {
        const incompleteLine = pendingFragments.join('');
        parseLine(incompleteLine, 0, incompleteLine.length);
      }
      isFirstChunk = true;
      id = undefined;
      data = '';
      dataLines = 0;
      eventType = undefined;
      pendingFragments.length = 0;
      pendingFragmentsLength = 0;
      terminated = false;
    }

    return { feed, reset };
  }

  function isDataPrefix(chunk, i, firstCharCode) {
    return firstCharCode === 100 &&
      chunk.charCodeAt(i + 1) === 97 &&
      chunk.charCodeAt(i + 2) === 116 &&
      chunk.charCodeAt(i + 3) === 97 &&
      chunk.charCodeAt(i + 4) === 58;
  }

  function isEventPrefix(chunk, i, firstCharCode) {
    return firstCharCode === 101 &&
      chunk.charCodeAt(i + 1) === 118 &&
      chunk.charCodeAt(i + 2) === 101 &&
      chunk.charCodeAt(i + 3) === 110 &&
      chunk.charCodeAt(i + 4) === 116 &&
      chunk.charCodeAt(i + 5) === 58;
  }

  global.EventSourceParser = {
    createParser: createParser,
    ParseError: ParseError
  };
})(typeof window !== 'undefined' ? window : this);
