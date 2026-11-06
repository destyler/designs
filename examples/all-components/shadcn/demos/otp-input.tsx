// Demo composition is application code. Imports preserve original pinned shadcn source.
import { useState } from 'react'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/registry/new-york-v4/ui/input-otp'
import { Label } from '@/registry/new-york-v4/ui/label'

export default function Example() {
  const [value, setValue] = useState('')
  return <div className="space-y-3"><Label htmlFor="reference-otp">Label</Label><InputOTP id="reference-otp" maxLength={3} value={value} onChange={setValue}><InputOTPGroup>{[0, 1, 2].map(index => <InputOTPSlot key={index} index={index} />)}</InputOTPGroup></InputOTP><p role="status" className="text-sm text-muted-foreground">{value.length}/3 characters</p></div>
}
