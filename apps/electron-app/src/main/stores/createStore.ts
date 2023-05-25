import { WebContents, ipcMain } from "electron";

type StoreOptions = {
  name: string;
  listeners?: WebContents[];
};

export class Store<T extends Record<string, any>> {
  private state: T;
  private name: string;
  private listeners: Set<WebContents>;

  constructor(initialState: T, options: StoreOptions) {
    this.state = initialState;
    this.name = options.name;
    this.listeners = new Set(options.listeners);

    // Get
    ipcMain.on(`SYNCSTORE:${this.name}:GET`, (event) => {
      // Add subscriber
      this.addListener(event.sender);

      event.sender.send(`SYNCSTORE:${this.name}:ONCHANGE`, this.state);
    });

    // Update
    ipcMain.on(
      `SYNCSTORE:${this.name}:UPDATE`,
      (event, partialState: Partial<T>) => {
        // Add subscriber
        this.addListener(event.sender);

        this.setState(partialState);
      }
    );

    // Remove subscriber
    ipcMain.on(`SYNCSTORE:${this.name}:UNSUBSCRIBE`, (event) => {
      this.removeListener(event.sender);
    });
  }

  getState() {
    return this.state;
  }

  setState(partialState: Partial<T>) {
    for (const key in partialState) {
      this.state[key as keyof T] = partialState[key] as T[keyof T];
    }

    for (const window of this.listeners) {
      window.send(`SYNCSTORE:${this.name}:ONCHANGE`, partialState);
    }
  }

  addListener(webContents: WebContents) {
    this.listeners.add(webContents);
    console.log("LibraryStore:addListener", this.listeners);
  }

  removeListener(webContents: WebContents) {
    this.listeners.delete(webContents);
    console.log("LibraryStore:removeListener", this.listeners);
  }
}
