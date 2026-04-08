# Sprint Goal
Mejorar la claridad, orientación y fricción operativa de las áreas pública, cliente, empleado y admin del restaurante sin cambiar la marca ni rehacer la interfaz. El foco de este sprint es cerrar inconsistencias visibles de navegación, jerarquía visual, formularios y comportamiento mobile para que el usuario entienda dónde está, qué puede hacer y cómo completar tareas clave con menos errores.

# User Experience Outcomes
- La home y las pantallas de entrada muestran una jerarquía clara: una acción principal, una secundaria y acceso visible a los flujos por rol.
- Cada área (`/cliente`, `/empleado`, `/admin`) transmite contexto inmediato mediante encabezado, estado activo de navegación y señales de ubicación consistentes.
- Los formularios críticos reducen fricción con etiquetas claras, errores legibles en español, foco visible y confirmaciones de éxito o fallo.
- La experiencia en mobile evita desbordes, mantiene targets táctiles utilizables y conserva la legibilidad de CTA y navegación.
- Las pantallas vacías, de carga y de error dejan de ser estados mudos y pasan a orientar con acciones siguientes concretas.

# Task List

## 1. Reforzar jerarquía de entrada y CTA en la home pública
- Prioridad: Alta
- Esfuerzo estimado: M
- Alcance: revisar la pantalla principal pública y normalizar el orden visual de hero, navegación y llamadas a la acción para que exista una acción primaria única por pantalla.
- Criterio de done: en desktop y mobile la home presenta un CTA principal evidente, un CTA secundario de apoyo y navegación inicial con estados activos legibles; no hay más de una jerarquía competidora en el primer viewport.
- Impacto esperado: mejora de conversion y orientación inicial.
- Riesgos: sobrecargar la portada con demasiadas opciones o romper el layout actual.
- Mitigación: limitar cambios a espaciado, tamaños, orden visual y estilo de estados; no introducir nuevos bloques de contenido.
- Dependencias: ninguna.

## 2. Unificar el shell de navegación por rol
- Prioridad: Alta
- Esfuerzo estimado: L
- Alcance: alinear la experiencia de navegación entre `cliente`, `empleado` y `admin` usando un patrón compartido de header/sidebar/topbar con estado activo, ruta actual y salida clara entre áreas.
- Criterio de done: cada área muestra el rol actual de forma explícita, el elemento activo está resaltado en todas las secciones y el usuario puede identificar desde cualquier subpantalla cómo volver al nivel anterior o salir del módulo.
- Impacto esperado: mejora de usabilidad y reducción de errores de navegación entre roles.
- Riesgos: inconsistencias visuales entre layouts existentes y regresiones en rutas anidadas.
- Mitigación: reutilizar componentes de navegación existentes y tocar solo el patrón de contenedor, no la lógica de ruta.
- Dependencias: depende de la tarea 1 para definir jerarquía visual base.

## 3. Endurecer formularios críticos con validación visible y microcopy claro
- Prioridad: Alta
- Esfuerzo estimado: M
- Alcance: aplicar un patrón uniforme a login, registro, reservas, pedidos, chat y formularios de administración donde corresponda: labels persistentes, ayuda contextual, mensajes de error en español, estado de carga y confirmación final.
- Criterio de done: todos los campos intervenidos tienen label visible, el error se anuncia junto al campo, el foco se ve sin depender del color y la acción de envío muestra feedback inequívoco.
- Impacto esperado: mejora de conversion, accesibilidad y reducción de abandonos por error.
- Riesgos: duplicar validaciones o introducir mensajes demasiado largos en mobile.
- Mitigación: usar un copy breve y uniforme; mantener un solo mensaje por error y priorizar errores bloqueantes.
- Dependencias: depende de la tarea 1 para alinear estilos de CTA y de la tarea 4 para asegurar comportamiento mobile de los formularios.

## 4. Corregir navegación mobile y targets táctiles
- Prioridad: Alta
- Esfuerzo estimado: M
- Alcance: revisar navegación, botones, tabs, cards clicables y tablas en pantallas estrechas para evitar desbordes horizontales, mejorar lectura y asegurar áreas táctiles utilizables.
- Criterio de done: en 360 px de ancho no hay scroll horizontal accidental; los controles interactivos principales mantienen un tamaño táctil suficiente; los bloques densos usan apilado, scroll interno o colapso cuando aplica.
- Impacto esperado: mejora de usabilidad mobile y accesibilidad táctil.
- Riesgos: pérdida de densidad de información en admin y reportes.
- Mitigación: priorizar legibilidad y permitir scroll interno solo en zonas de datos densos, sin esconder acciones principales.
- Dependencias: ninguna, pero debe validarse con la tarea 2 en layouts por rol.

## 5. Diseñar estados vacíos, de carga y de error para las pantallas operativas
- Prioridad: Media
- Esfuerzo estimado: M
- Alcance: normalizar mensajes y acciones en listados y módulos que dependan de datos en cliente, empleado y admin para que cada estado indique qué ocurrió y qué hacer después.
- Criterio de done: cada pantalla intervenida muestra al menos un estado claro para carga, vacío y error con una acción siguiente visible, sin texto técnico expuesto al usuario final.
- Impacto esperado: mejora de usabilidad y reducción de incertidumbre en tareas operativas.
- Riesgos: dispersión si cada pantalla inventa su propio empty state.
- Mitigación: definir un patrón reutilizable de copy, iconografía y acción primaria secundaria.
- Dependencias: depende de la tarea 2 para integrarse dentro del shell y de la tarea 3 para mantener consistencia de feedback.

# Validation Checklist
- Verificar que la home carga con una única CTA primaria visible sin necesidad de hacer scroll.
- Confirmar que la navegación por rol muestra estado activo correcto en rutas principales y subrutas.
- Revisar login, registro, reservas, pedidos y chat con teclado completo: tab, shift+tab, enter y escape donde aplique.
- Comprobar que los mensajes de error se leen junto al campo correspondiente y no solo por color.
- Validar contraste suficiente en CTA, estados activos y textos auxiliares.
- Probar mobile en anchos de 360 px y 390 px sin scroll horizontal ni controles cortados.
- Revisar que los targets táctiles principales sean fáciles de pulsar y que los elementos densos no bloqueen acciones clave.
- Confirmar que los estados de carga, vacío y error no muestran texto técnico ni rompen el layout.
- Probar al menos un flujo por rol: navegación pública, reserva o pedido en cliente, consulta operativa en empleado y acceso a panel en admin.
- Revisar que no se introduzcan cambios de marca ni un rediseño global: solo ajustes incrementales de jerarquía, navegación, formularios y estados.