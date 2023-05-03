type EventName = keyof GlobalEventHandlersEventMap;

type EventHandler<Name extends EventName> = (
  event: GlobalEventHandlersEventMap[Name]
) => void;

interface EventDispatcher {
  addEventListener<Name extends EventName>(
    name: Name,
    handler: EventHandler<Name>,
    capture?: boolean
  ): void;
  removeEventListener<Name extends EventName>(
    name: Name,
    handler: EventHandler<Name>,
    capture?: boolean
  ): void;
}

type EventListener<in out Name extends EventName> = {
  target: EventDispatcher;
  name: Name;
  capture?: boolean;
  handler: EventHandler<Name>;
};

export type ChildNode = string | Node;

export abstract class Component {
  #eventListeners: Array<EventListener<EventName>> = [];

  protected addEventListener<Name extends EventName>(
    target: EventDispatcher,
    name: Name,
    handler: EventHandler<Name>,
    capture?: boolean
  ) {
    target.addEventListener(name, handler, capture);
    this.#eventListeners.push({
      target,
      name,
      capture,
      handler,
    } as EventListener<EventName>);
  }

  disconnect() {
    for (const {target, name, capture, handler} of this.#eventListeners)
      target.removeEventListener(name, handler, capture);

    this.#eventListeners = [];
  }
}
