import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export function HeroSection() {
  return (
    <section className="relative min-h-[640px] w-full overflow-hidden pt-20 sm:pt-24 lg:min-h-[760px] lg:pt-28">
      <Image
        src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/hero-dish-CZPJxNVmXOebBdaU3hlJrEt0x5ltXX.jpg"
        alt="Plato gourmet elegante"
        fill
        className="object-cover"
        priority
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/25 to-black/55" />
      
      <div className="relative z-10 mx-auto flex min-h-[640px] max-w-7xl flex-col justify-center px-6 text-center lg:min-h-[760px] lg:px-8 lg:text-left">
        <p className="mb-5 text-xs font-medium uppercase tracking-[0.4em] text-white/80">
          KitchAI Presenta
        </p>
        <h1 className="max-w-4xl font-serif text-5xl font-normal leading-tight text-white md:text-6xl lg:text-7xl italic">
          El Arte de la Mesa
        </h1>
        <p className="mt-6 max-w-2xl text-sm leading-6 text-white/80 md:text-base">
          Una experiencia gastronómica pensada para convertir cada visita en una reserva sencilla, un recorrido claro y una mesa lista sin fricción.
        </p>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center lg:justify-start sm:gap-5">
          <Button
            asChild
            className="rounded-none bg-primary px-8 py-3 text-xs font-medium uppercase tracking-[0.15em] text-primary-foreground h-auto hover:bg-primary/90"
          >
            <Link href="#reservar">Reservar Ahora</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="rounded-none border-white/40 bg-transparent px-8 py-3 text-xs font-medium uppercase tracking-[0.15em] text-white h-auto hover:bg-white/10 hover:text-white"
          >
            <Link href="#menu">Explorar Menú</Link>
          </Button>
        </div>
      </div>

      {/* Decorative scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
        <div className="w-px h-12 bg-gradient-to-b from-white/60 to-transparent" />
      </div>
    </section>
  )
}
