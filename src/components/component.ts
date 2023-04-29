type EventName = keyof GlobalEventHandlersEventMap;

type EventHandler<Name extends EventName> = (
  event: GlobalEventHandlersEventMap[Name]
) => void;

interface EventDispatcher {
  addEventListener<Name extends EventName>(
    name: Name,
    handler: EventHandler<Name>
  ): void;
  removeEventListener<Name extends EventName>(
    name: Name,
    handler: EventHandler<Name>
  ): void;
}

type EventListener<in out Name extends EventName> = {
  target: EventDispatcher;
  name: Name;
  handler: EventHandler<Name>;
};

export type ChildNode = string | Node;

export abstract class Component {
  #eventListeners: Array<EventListener<EventName>> = [];

  protected addEventListener<Name extends EventName>(
    target: EventDispatcher,
    name: Name,
    handler: EventHandler<Name>
  ) {
    target.addEventListener(name, handler);
    this.#eventListeners.push({
      target,
      name,
      handler,
    } as EventListener<EventName>);
  }

  disconnect() {
    for (const handler of this.#eventListeners)
      handler.target.removeEventListener(handler.name, handler.handler);

    this.#eventListeners = [];
  }
}
