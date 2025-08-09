// Global type declarations for Grand Warden frontend

interface Window {
  ethereum?: {
    isMetaMask?: boolean;
    selectedAddress?: string;
    request: (args: { method: string; params?: any[] }) => Promise<any>;
    on: (event: string, handler: (...args: any[]) => void) => void;
    removeListener: (event: string, handler: (...args: any[]) => void) => void;
  };
}

// Extend the global chrome type for extension development
declare const chrome: {
  runtime: {
    onMessage: {
      addListener: (callback: (message: any, sender: any, sendResponse: (response?: any) => void) => void) => void;
    };
    onInstalled: {
      addListener: (callback: () => void) => void;
    };
    onSuspend: {
      addListener: (callback: () => void) => void;
    };
    sendMessage: (message: any) => Promise<any>;
  };
  tabs: {
    onUpdated: {
      addListener: (callback: (tabId: number, changeInfo: any, tab: any) => void) => void;
    };
    query: (queryInfo: { active?: boolean }) => Promise<any[]>;
    sendMessage: (tabId: number, message: any) => Promise<any>;
  };
  action: {
    setBadgeText: (details: { tabId?: number; text: string }) => void;
    setBadgeBackgroundColor: (details: { tabId?: number; color: string }) => void;
    setTitle: (details: { tabId?: number; title: string }) => void;
  };
  storage: {
    local: {
      get: (keys?: string | string[] | null) => Promise<{ [key: string]: any }>;
      set: (items: { [key: string]: any }) => Promise<void>;
    };
  };
};
