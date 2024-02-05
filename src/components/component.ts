type EventType = keyof GlobalEventHandlersEventMap;

type EventHandler<Type extends EventType> = (
  event: GlobalEventHandlersEventMap[Type]
) => void;

interface EventDispatcher extends EventTarget {
  addEventListener<Type extends EventType>(
    name: Type,
    handler: EventHandler<Type>,
    options?: EventListenerOptions | boolean
  ): void;
  removeEventListener<Type extends EventType>(
    name: Type,
    handler: EventHandler<Type>,
    options?: EventListenerOptions | boolean
  ): void;
}

type EventListener<in out Type extends EventType> = {
  target: EventDispatcher;
  type: Type;
  options?: EventListenerOptions | boolean;
  handler: EventHandler<Type>;
};

export type ChildNode = string | Node;

/** Maintains a list of registered event listeners and unregisters them upon disconnect. */
export abstract class Component {
  #eventListeners: Array<EventListener<EventType>> = [];

  protected addEventListener<Type extends EventType>(
    target: EventDispatcher,
    type: Type,
    handler: EventHandler<Type>,
    options?: EventListenerOptions | boolean
  ) {
    target.addEventListener(type, handler, options);
    this.#eventListeners.push({
      target,
      type,
      options,
      handler,
    } as EventListener<EventType>);
  }

  disconnect() {
    for (const {target, type, options, handler} of this.#eventListeners)
      target.removeEventListener(type, handler, options);

    this.#eventListeners = [];
  }
}
