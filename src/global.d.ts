export {};

declare global {
  interface Window {
    Telegram: {
      WebApp: {
        initData: string;
        initDataUnsafe: any;
        headerColor: string;
        backgroundColor: string;
        version: string;
        isExpanded: boolean;
        platform: string;
        themeParams: any;
        close: () => void;
        expand: () => void;
        sendData: (data: string) => void;
        MainButton: {
          isVisible: boolean;
          setText: (text: string) => void;
          show: () => void;
          hide: () => void;
          onClick: (cb: () => void) => void;
        };
        ready: () => void;
      };
    };
  }
}
