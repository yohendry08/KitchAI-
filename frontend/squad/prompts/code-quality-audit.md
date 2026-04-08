# Prompt - Code Quality Audit

Usa este prompt con el agente `Explore`.

---

Analiza este proyecto Next.js (TypeScript, app router) y genera una auditoria tecnica enfocada en:

1. Bugs potenciales y riesgos de regresion.
2. Manejo de errores en rutas API (`app/api/**`).
3. Tipado TypeScript debil o inseguro.
4. Duplicacion de logica entre paginas/componentes.
5. Riesgos de performance (renders innecesarios, payload, imports).
6. Seguridad basica en endpoints y validaciones de entrada.

Formato de salida obligatorio:

- Findings ordenados por severidad (Alta, Media, Baja).
- Cada finding con archivo, razon y recomendacion concreta.
- Lista final de quick wins (<= 1 hora cada uno).

No reescribas todo; prioriza cambios incrementales y seguros.
