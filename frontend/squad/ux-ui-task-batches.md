# UX/UI Task Batches - Sprint 1

## Lote 1 (Quick Wins)

### 1) Jerarquia de CTA en home publica
- Archivos objetivo: app/page.tsx, components/public/hero-section.tsx, components/public/navbar.tsx
- Cambio tecnico: definir un CTA primario unico en el hero y dejar el CTA del navbar como secundario.
- Done: en desktop y mobile se identifica un solo CTA dominante en primer viewport y anchors correctos.
- Riesgo: bajo.
- Prueba: revision visual en 375 px y 1440 px + clic manual en anchors.

### 2) Targets tactiles y densidad mobile
- Archivos objetivo: components/public/navbar.tsx, components/dashboard/topbar.tsx, components/dashboard/sidebar-nav.tsx
- Cambio tecnico: ampliar zonas clicables y separacion vertical en menus y controles mobile.
- Done: controles clave tienen area tactil comoda y no hay solapamientos.
- Riesgo: medio.
- Prueba: validacion manual en viewport mobile y navegacion por teclado.

### 3) Microcopy claro en login y registro
- Archivos objetivo: app/login/page.tsx, app/register/page.tsx
- Cambio tecnico: mejorar labels, ayudas y texto de botones sin cambiar estructura base.
- Done: campos y CTAs son claros para usuario final.
- Riesgo: bajo.
- Prueba: submit vacio y lectura de copy en mobile.

### 4) Normalizacion visual minima
- Archivos objetivo: app/globals.css, components/ui/button.tsx, components/ui/input.tsx
- Cambio tecnico: ajustar contraste/focus/consistencia de botones e inputs.
- Done: coherencia visual entre home, login y register.
- Riesgo: bajo.
- Prueba: comparativa visual entre rutas.

## Lote 2 (Estructura)

### 1) Shell unificado por rol
- Archivos objetivo: components/dashboard/dashboard-layout.tsx, components/dashboard/sidebar-nav.tsx, components/dashboard/topbar.tsx, app/admin/page.tsx, app/empleado/page.tsx, app/cliente/page.tsx
- Cambio tecnico: navegacion declarativa por rol y comportamiento consistente de shell.
- Done: estructura base comun en cliente/empleado/admin y estado activo correcto.
- Riesgo: medio.
- Prueba: recorrido de rutas por los tres roles.

### 2) Validacion visible en formularios
- Archivos objetivo: app/login/page.tsx, app/register/page.tsx, helper compartido en components/ui/
- Cambio tecnico: aplicar react-hook-form + zod con errores inline y estado de envio.
- Done: errores por campo, loading visible y submit confiable.
- Riesgo: medio.
- Prueba: casos de email invalido, contrasena invalida y submit vacio.

### 3) Primitivas compartidas para vacio/carga/error
- Archivos objetivo: componente nuevo en components/ui/ o components/dashboard/; uso en app/admin/reportes/page.tsx, app/cliente/pedidos/page.tsx, app/empleado/inventario/page.tsx
- Cambio tecnico: estandarizar estados de datos en componente reutilizable.
- Done: minimo dos rutas usan la misma primitiva con copy coherente.
- Riesgo: bajo.
- Prueba: forzar estado vacio y error en una pantalla por rol.

### 4) Encabezados y accion primaria por pantalla
- Archivos objetivo: app/admin/*/page.tsx, app/cliente/*/page.tsx, app/empleado/*/page.tsx
- Cambio tecnico: estandarizar titulo, subtitulo y accion principal arriba del contenido.
- Done: vistas clave muestran contexto y accion principal consistente.
- Riesgo: bajo.
- Prueba: revision visual de cada ruta principal.

## Lote 3 (Acabado y QA)

### 1) Cobertura total de estados vacio/carga/error
- Archivos objetivo: rutas operativas con datos dinamicos
- Cambio tecnico: aplicar patron compartido en todos los modulos relevantes.
- Done: no quedan vistas de datos sin estado explicito.
- Riesgo: medio.
- Prueba: recorrido manual con datos ausentes/fallidos.

### 2) Pulido responsive final
- Archivos objetivo: components/public/navbar.tsx, components/public/hero-section.tsx, components/dashboard/sidebar-nav.tsx, components/dashboard/topbar.tsx, app/login/page.tsx, app/register/page.tsx
- Cambio tecnico: corregir cortes, espaciados y desbordes entre 320 y desktop.
- Done: sin cortes de texto ni scroll horizontal inesperado.
- Riesgo: medio.
- Prueba: 320 px, 375 px, 768 px y 1440 px.

### 3) Accesibilidad funcional y foco
- Archivos objetivo: navbar, sidebar, login, register, app/globals.css
- Cambio tecnico: orden de tabulacion, foco visible, labels asociadas y teclas de escape donde aplique.
- Done: flujo clave operable solo con teclado.
- Riesgo: bajo/medio.
- Prueba: recorrido completo con teclado.

### 4) QA de regresion y cierre de microcopy
- Archivos objetivo: rutas intervenidas y pruebas/manual checklist
- Cambio tecnico: smoke test de navegacion, CTA principal, shell por rol, formularios y estados.
- Done: checklist de regresion completo y cero regresiones criticas.
- Riesgo: bajo.
- Prueba: home + login + register + una ruta por rol.
