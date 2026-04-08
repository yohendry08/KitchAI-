# Avances de la Interfaz de Toma de Pedidos (`/orders/new`)

## 1. Estructura y Diseño Inicial (CA1)
- Se creó la página principal `/orders/new` optimizada para tablets y pantallas táctiles.
- Se implementó un selector de tipo de pedido (Salón, Para Llevar, Delivery) prominente en la parte superior.
- Para Salón: selector visual de mesas con estados (disponible = verde, ocupada = rojo).
- Para Para Llevar: campos de nombre y teléfono del cliente.
- Para Delivery: campos de nombre, teléfono y dirección completa.

## 2. Panel de Selección de Productos y Resumen (CA2)
- Panel izquierdo (60%): menú con tabs de categorías (Entradas, Platos Principales, Bebidas, Postres).
- Productos mostrados como tarjetas grandes con foto, nombre, precio, descripción y estado de stock.
- Panel derecho (40%): resumen del pedido actual (placeholder inicial).

## 3. Lógica de Pedido Interactiva
- Permite agregar productos al pedido con un solo click.
- Ajuste de cantidades (+/-) y eliminación de productos desde el resumen.
- Cálculo en tiempo real de subtotal, impuestos (18%) y total.
- Input para notas especiales por producto.
- Tipado estricto en TypeScript para los items del pedido y handlers.

## 4. Integración visual y componentes reutilizables
- Uso de componentes UI de KitchAI (`@/components/ui/button`, `card`, `tabs`, `badge`, etc.) para mantener coherencia visual.
- Diseño responsive y optimizado para touch.

## 5. Panel de Resumen Interactivo (CA4)
- El panel de resumen muestra la lista de productos agregados, permite editar cantidad (+/-) y eliminar items.
- Input para notas especiales del pedido completo.
- Cálculo en tiempo real de subtotal, impuestos (18%) y total.
- Botones de acción: Cancelar Pedido, Guardar Borrador, Enviar a Cocina.
- Diseño visual coherente con KitchAI, feedback inmediato y responsive.

## 6. Validaciones, Confirmación y Envío a Cocina (CA5)
- Validaciones automáticas según tipo de pedido (mesa, datos cliente, dirección).
- Modal de confirmación antes de enviar el pedido.
- Envío simulado vía API, feedback visual de éxito y número de pedido generado.
- Limpieza automática de la interfaz tras el envío.
- Opción de imprimir ticket tras el envío.

---

**Próximos pasos:**
- Implementar búsqueda rápida de productos (CA6).
- Guardado automático de borradores (CA7).
- Validaciones y manejo de errores robusto (CA9).
- Acciones de envío a cocina, impresión y gestión de pedidos recientes.
