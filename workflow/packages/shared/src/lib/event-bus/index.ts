type EventHandler<T = any> = (event: T) => void;

type EventMap = {
    [eventType: string]: any;
};

function EventBus<Events extends EventMap = Record<string, any>>() {
    const allHandlers = new Map<keyof Events, EventHandler<any>[]>();

    return {
        on<K extends keyof Events>(type: K, handler: EventHandler<Events[K]>): void {
            let handlers = allHandlers.get(type);
            if (!handlers) {
                handlers = [handler];
            } else {
                handlers.push(handler);
            }
            allHandlers.set(type, handlers);
        },
        off<K extends keyof Events>(type: K, handler: EventHandler<Events[K]>): void {
            const handlers = allHandlers.get(type);
            if (handlers) {
                const index = handlers.indexOf(handler);
                if (index !== -1) {
                    handlers.splice(index, 1);
                }
            }
        },
        emit<K extends keyof Events>(type: K, evt: Events[K]): void {
            const handlers = allHandlers.get(type);
            if (handlers) {
                handlers.slice().forEach((handler) => handler(evt));
            }
        },
    };
}

export enum EventBusTypes {
    OUTPUT_STEP_DATA = 'OUTPUT_STEP_DATA'
}

// Use to communicate between Independent Components
export const eventBus = EventBus();
