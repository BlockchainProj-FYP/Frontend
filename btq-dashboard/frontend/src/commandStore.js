let commands = [];
let listeners = [];
const MAX = 300;

export function pushCommand(entry) {
  commands = [{ ...entry, id: crypto.randomUUID() }, ...commands].slice(0, MAX);
  listeners.forEach(l => l());
}
export function getCommands() { return commands; }
export function subscribe(listener) {
  listeners.push(listener);
  return () => { listeners = listeners.filter(l => l !== listener); };
}