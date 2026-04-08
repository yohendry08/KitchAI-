import { Clock, MapPin, Phone, Mail } from "lucide-react"

export function ContactSection() {
  return (
    <section id="contacto" className="bg-background py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-12 lg:grid-cols-2">
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-muted">
            <iframe
              title="Ubicación del restaurante"
              src="https://www.openstreetmap.org/export/embed.html?bbox=-99.175%2C19.41%2C-99.165%2C19.42&layer=mapnik"
              className="h-full w-full border-0"
              loading="lazy"
            />
          </div>

          <div className="flex flex-col justify-center gap-6">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Lunes - Domingo</p>
                <p className="text-muted-foreground">11:00 AM - 10:00 PM</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Calle Bonita 4:45, Ciudad Gourmet</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Phone className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">+1 234 557 880</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">contacto@kitchai.com</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
