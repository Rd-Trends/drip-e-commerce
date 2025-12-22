import { useState } from 'react'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group'
import { EyeIcon, EyeOffIcon } from 'lucide-react'

export function PasswordInput({ ...props }: React.ComponentProps<'input'>) {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <InputGroup>
      <InputGroupInput type={showPassword ? 'text' : 'password'} {...props} />
      <InputGroupAddon align="inline-end">
        <InputGroupButton size="icon-xs" onClick={() => setShowPassword((prev) => !prev)}>
          {showPassword ? <EyeOffIcon /> : <EyeIcon />}
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  )
}
