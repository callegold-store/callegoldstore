# Callegold — Tienda virtual

Tienda virtual estática construida con HTML5, CSS3 y JavaScript. Incluye las 32 referencias del catálogo Callegold, fotografías extraídas del PDF suministrado, búsqueda, filtros por colección y carrito de selección con consulta por WhatsApp.

## Funcionalidades
- Diseño premium negro, dorado y beige.
- Adaptación a escritorio, tabletas y celulares.
- Catálogo de 32 productos con imágenes y referencias.
- Buscador y filtros por categoría.
- Carrito persistente mediante `localStorage`.
- Envío de la selección al WhatsApp de Callegold.
- Precios consultables por WhatsApp; no se muestran importes.

## Ejecutar en local
1. Descarga y descomprime el proyecto.
2. Abre la carpeta `callegold-store` en Visual Studio Code.
3. Instala la extensión **Live Server** (recomendado).
4. Haz clic derecho en `index.html` y selecciona **Open with Live Server**.

## Estructura
- `index.html`: estructura de la tienda.
- `css/styles.css`: estilos principales e identidad visual.
- `css/responsive.css`: adaptación a pantallas pequeñas.
- `js/products.js`: datos de las 32 referencias.
- `js/cart.js`: lógica del carrito y almacenamiento local.
- `js/main.js`: renderizado, filtros, búsqueda y WhatsApp.
- `assets/products/`: fotografías del catálogo.

## Configuración de contacto
El número de WhatsApp está configurado como `573504272105` (Colombia). Si se cambia, actualiza el número en `js/main.js` y en los enlaces de WhatsApp de `index.html`. Utiliza formato internacional, solo números y sin el signo `+`.

Instagram configurado: `@callegold.store`.

## Publicar gratis con GitHub Pages
1. Sube todos los archivos a la rama `main` del repositorio.
2. En GitHub entra a **Settings → Pages**.
3. En **Build and deployment**, selecciona **Deploy from a branch**.
4. Elige la rama `main` y la carpeta `/ (root)`.
5. Pulsa **Save** y espera a que GitHub genere la URL pública.

## Alcance de esta versión
Es una tienda tipo catálogo con carrito de selección y envío de consultas por WhatsApp. No procesa pagos, no descuenta inventario ni tiene panel administrativo o base de datos. Esas capacidades pueden incorporarse en una siguiente versión.
