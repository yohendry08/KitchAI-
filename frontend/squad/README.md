# Copilot Squad - Mej

Este Squad te permite trabajar en dos frentes a la vez:

1. Calidad de codigo (bugs, arquitectura, mantenibilidad, performance)
2. UX/UI experto (jerarquia visual, accesibilidad, conversion y responsive)

## Agentes recomendados

- `Explore`: descubrimiento rapido del codigo y deteccion de hotspots.
- `modernize-design`: convertir hallazgos UX/UI en especificacion accionable.
- `modernize-task`: descomponer especificacion en tareas pequenas.
- `modernize-implementation`: ejecutar cambios por lotes con enfoque seguro.
- `modernize-gatekeep`: control de calidad final y verificacion cruzada.

## Flujo sugerido

1. Ejecuta diagnostico inicial con prompts en `squad/prompts/`.
2. Crea backlog en `squad/sprint-board.md`.
3. Implementa por lotes pequenos (3-6 tareas por ciclo).
4. Revisa riesgos y regresiones antes de pasar al siguiente ciclo.

## Regla operativa

No mezcles cambios de UX/UI grandes con refactors profundos en el mismo lote. Mantener lotes pequenos simplifica rollback y pruebas.
