import { Spinner } from '@/components/Spinner'

export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F3EFE7]">
      <Spinner className="h-8 w-8 text-[#4C8266]" />
    </div>
  )
}