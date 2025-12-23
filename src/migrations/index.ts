import * as migration_20251215_222500_init from './20251215_222500_init';
import * as migration_20251223_232436 from './20251223_232436';

export const migrations = [
  {
    up: migration_20251215_222500_init.up,
    down: migration_20251215_222500_init.down,
    name: '20251215_222500_init',
  },
  {
    up: migration_20251223_232436.up,
    down: migration_20251223_232436.down,
    name: '20251223_232436'
  },
];
