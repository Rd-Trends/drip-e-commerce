import * as migration_20251230_002158_init from './20251230_002158_init';
import * as migration_20260103_071935_add_category_image from './20260103_071935_add_category_image';

export const migrations = [
  {
    up: migration_20251230_002158_init.up,
    down: migration_20251230_002158_init.down,
    name: '20251230_002158_init',
  },
  {
    up: migration_20260103_071935_add_category_image.up,
    down: migration_20260103_071935_add_category_image.down,
    name: '20260103_071935_add_category_image'
  },
];
