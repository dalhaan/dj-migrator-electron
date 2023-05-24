import { WebContents, ipcMain } from "electron";

type StoreOptions = {
  name: string;
  windows?: WebContents[];
};

export class Store<T extends Record<string, any>> {
  private state: T;
  private name: string;
  private windows: Set<WebContents>;

  constructor(initialState: T, options: StoreOptions) {
    this.state = initialState;
    this.name = options.name;
    this.windows = new Set(options.windows);

    // Get
    ipcMain.on(`SYNCSTORE:${this.name}:GET`, (event) => {
      // Add subscriber
      this.addWindow(event.sender);

      event.sender.send(`SYNCSTORE:${this.name}:ONCHANGE`, this.state);
    });

    // Update
    ipcMain.on(
      `SYNCSTORE:${this.name}:UPDATE`,
      (event, partialState: Partial<T>) => {
        // Add subscriber
        this.addWindow(event.sender);

        this.setState(partialState);
      }
    );

    // Remove subscriber
    ipcMain.on(`SYNCSTORE:${this.name}:UNSUBSCRIBE`, (event) => {
      this.windows.delete(event.sender);
    });
  }

  getState() {
    return this.state;
  }

  setState(partialState: Partial<T>) {
    for (const key in partialState) {
      this.state[key as keyof T] = partialState[key] as T[keyof T];
    }

    for (const window of this.windows) {
      window.send(`SYNCSTORE:${this.name}:ONCHANGE`, partialState);
    }
  }

  addWindow(window: WebContents) {
    this.windows.add(window);
    console.log("LibraryStore:addWindow", this.windows);
  }
}
