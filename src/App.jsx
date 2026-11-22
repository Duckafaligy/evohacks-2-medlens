import { Pill } from 'lucide-react'

export default function App() {
  return (
    <main className="min-h-screen grid place-items-center bg-white text-slate-900">
      <h1 className="flex items-center gap-3 text-4xl font-bold">
        <Pill aria-hidden="true" className="size-10" /> MedLens
      </h1>
    </main>
  )
}
