// An iterable WeakMap polyfill described in the following proposal:
// https://github.com/tc39/proposal-weakrefs#iterable-weakmaps


export class IterableWeakMap<K extends object, V> implements Iterable<[K, V]> {
  #weakMap = new WeakMap<K, { value: V; ref: WeakRef<K> }>();
  #refSet = new Set<WeakRef<K>>();
  #finalizationGroup = new FinalizationRegistry(IterableWeakMap.#cleanup);

  static #cleanup({
    set,
    ref,
  }: {
    set: Set<WeakRef<object>>;
    ref: WeakRef<object>;
  }) {
    set.delete(ref);
  }

  constructor(iterable: Iterable<[K, V]> = []) {
    for (const [key, value] of iterable) {
      this.set(key, value);
    }
  }

  set(key: K, value: V) {
    const ref = new WeakRef(key);

    this.#weakMap.set(key, { value, ref });
    this.#refSet.add(ref);
    this.#finalizationGroup.register(
      key,
      {
        set: this.#refSet,
        ref,
      },
      ref
    );
  }

  get(key: K) {
    const entry = this.#weakMap.get(key);
    return entry && entry.value;
  }

  delete(key: K) {
    const entry = this.#weakMap.get(key);
    if (!entry) {
      return false;
    }

    this.#weakMap.delete(key);
    this.#refSet.delete(entry.ref);
    this.#finalizationGroup.unregister(entry.ref);
    return true;
  }

  *[Symbol.iterator](): Generator<[K, V], void, unknown> {
    for (const ref of this.#refSet) {
      const key = ref.deref();
      if (!key) continue;
      const { value } = this.#weakMap.get(key)!;
      yield [key, value];
    }
  }

  entries() {
    return this[Symbol.iterator]();
  }

  *keys() {
    for (const [key, _value] of this) {
      yield key;
    }
  }

  *values() {
    for (const [_key, value] of this) {
      yield value;
    }
  }
}
