# Prompt - UX/UI Spec to Tasks

Usa este prompt con el agente `modernize-design` y luego `modernize-task`.

---

A partir de los findings UX/UI ya detectados, crea una especificacion accionable para 1 sprint.

Requisitos de la especificacion:

1. Alcance limitado a mejoras incrementales (sin rediseno completo).
2. Criterios de aceptacion verificables por tarea.
3. Riesgos y mitigaciones por cambio.
4. Impacto esperado por tarea (usabilidad, conversion, accesibilidad).
5. Dependencias entre tareas.

Despues, descompone en tareas tecnicas listas para implementar en lotes pequenos (3-6 tareas por lote).

Formato de salida:

- Seccion "Sprint Goal".
- Seccion "User Experience Outcomes".
- Seccion "Task List" con prioridad, esfuerzo estimado y criterio de done.
- Seccion "Validation Checklist" para QA visual y funcional.
