export interface ServerConnection {
    on(channel: string, listener: (...args: string[])=>void): void;
    send(channel: string, ...args: string[]): void;
}