import { createFileRoute } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/test')({ component: Test })

function Test() {
  return (
    <div className='bg-primary text-foreground'><Button variant={'destructive'}>Button</Button></div>
  )
}