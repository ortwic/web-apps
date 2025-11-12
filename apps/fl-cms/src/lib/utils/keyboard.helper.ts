  export function confirmed(event: Event) {
    if (event instanceof KeyboardEvent) {
        return event.key === undefined || event.key.toLowerCase() === 'enter';
    }
  }