export type Listener = (arg: string) => void;

export interface ServerConnection {
    on(channel: string, listener: Listener): void;
    send(channel: string, ...args: string[]): void;
}