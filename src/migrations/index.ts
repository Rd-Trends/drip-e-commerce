import * as migration_20260105_022523_init from './20260105_022523_init';
import * as migration_20260111_100336 from './20260111_100336';
import * as migration_20260111_110044 from './20260111_110044';
import * as migration_20260315_194041_order_coupon_attribution from './20260315_194041_order_coupon_attribution';
import * as migration_20260408_181128_whatsapp_sessions from './20260408_181128_whatsapp_sessions';
import * as migration_20260414_135242_user_permissions from './20260414_135242_user_permissions';
import * as migration_20260415_005103_add_payload_jobs from './20260415_005103_add_payload_jobs';

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
    name: '20260111_110044',
  },
  {
    up: migration_20260315_194041_order_coupon_attribution.up,
    down: migration_20260315_194041_order_coupon_attribution.down,
    name: '20260315_194041_order_coupon_attribution',
  },
  {
    up: migration_20260408_181128_whatsapp_sessions.up,
    down: migration_20260408_181128_whatsapp_sessions.down,
    name: '20260408_181128_whatsapp_sessions',
  },
  {
    up: migration_20260414_135242_user_permissions.up,
    down: migration_20260414_135242_user_permissions.down,
    name: '20260414_135242_user_permissions',
  },
  {
    up: migration_20260415_005103_add_payload_jobs.up,
    down: migration_20260415_005103_add_payload_jobs.down,
    name: '20260415_005103_add_payload_jobs'
  },
];
