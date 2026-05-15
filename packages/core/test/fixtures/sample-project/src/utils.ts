import { greet } from './index.js';

export function welcomeUser(name: string): string {
  return greet(name);
}

console.log("Utility module loaded");
