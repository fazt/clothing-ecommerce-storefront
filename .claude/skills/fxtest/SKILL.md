---
name: fxtest
description: Prueba la app como lo haría un usuario real para comprobar que los últimos cambios funcionan, y al terminar deja todo limpio. Usar cuando el usuario pida "prueba que funcione", "testea", "revisa los cambios", "comprueba lo que hiciste" o escriba /fxtest.
---

# fxtest

Prueba la app en el navegador, como un usuario real, para comprobar que lo último que se cambió funciona.

**Cómo usarlo:** escribe `/fxtest` o pide algo como "prueba que funcione".

## Pasos

1. **Mira qué cambió.** Revisa los últimos cambios del proyecto y conviértelos en cosas que haría un usuario, por ejemplo "crear una cuenta" o "añadir un producto al carrito". Antes de empezar, anota qué archivos hay en el proyecto.

2. **Abre la app.** Si ya está abierta, úsala; si no, arráncala tú. Si hace falta iniciar sesión, usa un usuario de prueba. Pide datos al usuario solo si no hay otra opción.

3. **Pruébala en el navegador.** Usa Playwright CLI; si no está disponible, usa Chrome DevTools. No instales nada sin permiso.
   - Haz lo que haría un usuario: navegar, rellenar formularios y pulsar botones.
   - Prueba también un error común, como enviar un formulario vacío.
   - Si el cambio afecta a lo que se ve, revísalo también en tamaño móvil.

4. **Decide si funciona.** Funciona si se ve lo que se pidió y no hay errores, ni en pantalla ni ocultos (en la consola de la página o en la comunicación con el servidor).

5. **Deja todo limpio**, siempre, aunque algo falle:
   - Cierra el navegador.
   - Borra los archivos que creó la herramienta de pruebas: capturas, grabaciones, informes y carpetas como `.playwright-cli`.
   - Borra los datos de prueba que creaste, como cuentas o productos.
   - Apaga solo lo que encendiste tú.
   - Comprueba que el proyecto queda como estaba, sin archivos de más.

6. **Cuenta el resultado** con palabras sencillas, sin términos técnicos ni código:
   - ✅ Lo que funciona.
   - ❌ Lo que falla y qué notaría un usuario. Ofrece arreglarlo.
   - ⚠️ Lo que no se pudo probar y por qué.

### Reglas

- si usas playwright-cli usa el modo --headed