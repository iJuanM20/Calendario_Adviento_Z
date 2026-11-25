# Calendario_Adviento_Z

**Calendario de Adviento para Zaret** es una Navidad en Hogwarts con 24 sorpresas. Las puertas se habilitan del 1 al 24 de diciembre de 2026 a medianoche, hora de Colombia.

## Abrir o editar

- Abre `dist/index.html` en el navegador y pulsa **Abrir mi carta** para entrar al calendario. El proyecto funciona sin instalar dependencias.
- Abre la carpeta en Visual Studio Code y edita `dist/sorpresas.js` para cambiar los títulos, textos y tipos de sorpresa. El primer elemento corresponde al día 1, el segundo al día 2 y así sucesivamente.
- Usa **Vista previa** al abrir el proyecto local para leer todas las sorpresas antes de diciembre. En el sitio publicado, añade `?vista=previa` al enlace para ver el botón. Las aperturas en esta vista no modifican el progreso.
- El progreso se guarda en el navegador que abre el calendario. La fecha controla la interfaz. El contenido se distribuye con los archivos del sitio estático.

La portada está en `dist/assets/hogwarts-navidad.webp` y los estilos en `dist/estilos.css`. La música ambiental empieza al abrir la carta. El botón **Sonido** controla tanto la música como los efectos de las sorpresas. Los tres audios están en `dist/assets/`.
