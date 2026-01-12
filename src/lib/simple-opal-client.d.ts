declare const opal: {
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  setToken: (token: string) => void;
  getStatus: () => string;
  getTools: () => any[];
  ready: () => boolean;
  waitForReady: (timeout?: number) => Promise<void>;
  autoConnect: () => void;
  on: (event: string, callback: (...args: any[]) => void) => void;
  off: (event: string, callback: (...args: any[]) => void) => void;
  callTool: (name: string, args?: Record<string, any>) => Promise<any>;
  tool: (name: string) => {
    call: (args?: Record<string, any>) => Promise<any>;
  };
  getSessionId: () => string | null;
};

export default opal;
