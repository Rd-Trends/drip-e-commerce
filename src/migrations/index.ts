import * as migration_20260105_022523_init from './20260105_022523_init';

export const migrations = [
  {
    up: migration_20260105_022523_init.up,
    down: migration_20260105_022523_init.down,
    name: '20260105_022523_init'
  },
];
