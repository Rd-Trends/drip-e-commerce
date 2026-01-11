import * as migration_20260105_022523_init from './20260105_022523_init';
import * as migration_20260111_100336 from './20260111_100336';
import * as migration_20260111_110044 from './20260111_110044';

export const migrations = [
  {
    up: migration_20260105_022523_init.up,
    down: migration_20260105_022523_init.down,
    name: '20260105_022523_init',
  },
  {
    up: migration_20260111_100336.up,
    down: migration_20260111_100336.down,
    name: '20260111_100336',
  },
  {
    up: migration_20260111_110044.up,
    down: migration_20260111_110044.down,
    name: '20260111_110044'
  },
];
