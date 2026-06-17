'use strict';

const CONFIG = {
  // MSAL Config (Mismas credenciales y App Registration)
  msal: {
    auth: {
      clientId: 'febe226c-0265-4fb2-b34e-3beebbb9fee8',
      authority: 'https://login.microsoftonline.com/af1a17b2-5d34-4f58-8b6c-6b94c6cd87ea',
      redirectUri: window.location.origin + window.location.pathname,
      navigateToLoginRequestUrl: true
    },
    cache: {
      cacheLocation: 'sessionStorage',
      storeAuthStateInCookie: false
    }
  },
  
  // Áreas de accesos y dominios autorizados
  authScopes: ['openid', 'profile', 'email', 'User.Read'],
  allowedDomain: 'lineacom.co',
  sessionDuration: 1 * 60 * 60 * 1000, // 1 hora
  
  // URLs de Datos (Indicadores)
  dataSources: {
    indicadores: 'indicadores_bancodebogota.json.gz'
  }
};

// Exponer la configuración a nivel global
window.APP_CONFIG = CONFIG;
