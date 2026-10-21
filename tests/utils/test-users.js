import { randomUUID } from 'node:crypto';

export function createTestUser() {
  const id = randomUUID();
  return {
    name: `Eco Test ${id.slice(0, 8)}`,
    email: `eco-test-${id}@example.test`,
    password: `EcoTest-${id.slice(0, 8)}!`,
  };
}
