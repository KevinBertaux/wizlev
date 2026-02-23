function fallbackRandom() {
  return Math.random();
}

export function randomIndex(length, randomFn = fallbackRandom) {
  if (!Number.isInteger(length) || length <= 0) {
    return 0;
  }
  return Math.floor(randomFn() * length);
}

export function shuffleList(items, randomFn = fallbackRandom) {
  const list = Array.isArray(items) ? [...items] : [];
  for (let i = list.length - 1; i > 0; i -= 1) {
    const j = randomIndex(i + 1, randomFn);
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

export function pullNextItem(items, isAllowed = () => true, allowFallback = true) {
  if (!Array.isArray(items) || items.length === 0) {
    return null;
  }

  const index = items.findIndex((item) => isAllowed(item));
  if (index === -1) {
    return allowFallback ? items.shift() || null : null;
  }

  const [item] = items.splice(index, 1);
  return item || null;
}

export function createRefillBag({ refill, fallback } = {}) {
  let queue = [];

  function refillQueue() {
    const next = typeof refill === 'function' ? refill() : [];
    queue = Array.isArray(next) ? [...next] : [];
  }

  return {
    next() {
      if (queue.length === 0) {
        refillQueue();
      }

      if (queue.length === 0) {
        return typeof fallback === 'function' ? fallback() : null;
      }

      return queue.shift() || null;
    },
    clear() {
      queue = [];
    },
    get size() {
      return queue.length;
    },
  };
}
