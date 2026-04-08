export function PressSection() {
  const publications = [
    { name: "The Food Journal", className: "font-serif italic" },
    { name: "EATER", className: "font-sans font-black uppercase tracking-wider" },
    { name: "The Gourmet Times", className: "font-serif" },
    { name: "Epicure", className: "font-serif italic tracking-wide" },
  ]

  return (
    <section className="border-b border-border bg-card py-12">
      <div className="mx-auto max-w-5xl px-6">
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16">
          {publications.map((pub) => (
            <span
              key={pub.name}
              className={`text-lg text-muted-foreground/60 md:text-xl ${pub.className}`}
            >
              {pub.name}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
