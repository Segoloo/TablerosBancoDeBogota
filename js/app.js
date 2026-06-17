'use strict';

document.addEventListener('DOMContentLoaded', () => {
  const app = new window.AppController();
  app.init().then(() => {
    console.log('[App] Plataforma inicializada correctamente.');
  }).catch((err) => {
    console.error('[App] Fallo crítico al inicializar la aplicación:', err);
  });
});
