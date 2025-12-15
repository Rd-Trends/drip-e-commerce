import * as migration_20251215_222500_init from './20251215_222500_init';

export const migrations = [
  {
    up: migration_20251215_222500_init.up,
    down: migration_20251215_222500_init.down,
    name: '20251215_222500_init'
  },
];
