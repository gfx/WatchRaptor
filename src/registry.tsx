type ItemsType<V> = Record<string, V | undefined>;

export class Registry<V extends string> {
  private async getItems(): Promise<ItemsType<V>> {
    return new Promise<Record<string, V>>((resolve, _reject) => {
      chrome.runtime.sendMessage({ type: "get-registry-items" }, (items) => {
        resolve(items);
      });
    });
  }

  private async setItems(items: ItemsType<V>): Promise<void> {
    return new Promise((resolve, _reject) => {
      chrome.runtime.sendMessage({ type: "set-registry-items", items }, () => {
        resolve();
      });
    });
  }

  public async get(key: string): Promise<V | undefined> {
    const items = await this.getItems();
    return (items.hasOwnProperty(key) ? items[key] : undefined);
  }

  public async has(key: string): Promise<boolean> {
    const items = await this.getItems();
    return items.hasOwnProperty(key);
  }

  public async set(key: string, value: V): Promise<void> {
    const items = await this.getItems();
    items[key] = value;
    return this.setItems(items);
  }

  public async delete(key: string): Promise<void> {
    const items = await this.getItems();
    delete items[key];
    return this.setItems(items);
  }

  async *[Symbol.asyncIterator](): AsyncIterator<readonly [string, V], void, void> {
    const items = await this.getItems();
    for (const entry of Object.entries(items)) {
      yield entry as [string, V];
    }
  }
}
