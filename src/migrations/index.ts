import * as migration_20251214_153942_init from './20251214_153942_init';

export const migrations = [
  {
    up: migration_20251214_153942_init.up,
    down: migration_20251214_153942_init.down,
    name: '20251214_153942_init'
  },
];
