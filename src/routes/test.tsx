import { createFileRoute } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'


export const Route = createFileRoute('/test')({ component: Test })

function Test() {
  return (
    <div>
        <Button>Click Me</Button>
    </div>
  )
}