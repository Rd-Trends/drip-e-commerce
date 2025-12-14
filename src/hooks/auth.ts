/**
 * Auth hooks - centralized exports
 * Import from here for convenience: import { useAuth, useLogin, useLogout } from '@/hooks/auth'
 */

export { useUser } from './use-user'
export {
  useLogin,
  useLogout,
  useCreateUser,
  useForgotPassword,
  useResetPassword,
  useSetUser,
} from './use-auth-mutations'
