import * as migration_20251230_002158_init from './20251230_002158_init';

export const migrations = [
  {
    up: migration_20251230_002158_init.up,
    down: migration_20251230_002158_init.down,
    name: '20251230_002158_init'
  },
];
