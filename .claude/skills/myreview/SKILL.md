---
name: myreview
description: Revisa código sin usar, código repetido y código mal optimizado. Usar cuando el usuario pida "myreview", "código muerto", "código sin usar", "código repetido", "mal optimizado" o invoque /myreview.
---

# myreview

Revisa lo que indique el usuario (ruta, carpeta, rama o PR). Solo genera un informe: no modifica código salvo que se pida después.

## Qué buscar
- haz review de código muerto, repetido o mal optimizado.
- **Repetido**: lógica copiada en 2+ sitios
- **Mal optimizado**: N+1, consultas que devuelven más de lo necesario, bucles innecesarios, etc.