# Runbook del Squad

## Objetivo

Elevar calidad tecnica y experiencia de usuario del proyecto Next.js sin romper funcionalidades existentes.

## Fase 1: Diagnostico (1 ciclo)

1. Usa `squad/prompts/code-quality-audit.md` con `Explore`.
2. Usa `squad/prompts/ux-ui-audit.md` con `Explore`.
3. Consolida findings en `squad/sprint-board.md`.

Entregable: lista priorizada por severidad e impacto.

## Fase 2: Diseno de mejoras (1 ciclo)

1. Ejecuta `squad/prompts/ux-ui-spec.md` con `modernize-design`.
2. Ajusta alcance (MVP de 1 sprint).
3. Convierte la especificacion a tareas con `modernize-task`.

Entregable: plan por tareas y criterios de aceptacion.

## Fase 3: Implementacion controlada (iterativo)

1. Selecciona 3-6 tareas.
2. Ejecuta `modernize-implementation` por lote.
3. Corre validacion (lint/build/tests manuales disponibles).
4. Repite hasta cerrar sprint.

Entregable: lote implementado + checklist de validacion.

## Fase 4: Gate final

1. Ejecuta `modernize-gatekeep`.
2. Confirma:
- no regresiones visuales criticas,
- navegacion principal estable,
- formularios clave funcionales,
- accesibilidad basica respetada.

Entregable: decision go/no-go.

## KPI sugeridos

- Tiempo de carga percibido de home.
- Tasa de errores UI en consola.
- Hallazgos de accesibilidad por pantalla.
- Numero de componentes duplicados eliminados.
