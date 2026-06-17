'use strict';

class AuthModel {
  constructor() {
    this.config = window.APP_CONFIG.msal;
    this.scopes = window.APP_CONFIG.authScopes;
    this.allowedDomain = window.APP_CONFIG.allowedDomain;
    this.msalInstance = null;
    this.userProfile = null;
    this.sessionTimer = null;
  }

  // Cargar la librería MSAL desde los CDN configurados
  async loadMSAL() {
    if (window.msal) return window.msal;
    const urls = [
      'https://alcdn.msauth.net/browser/2.38.3/js/msal-browser.min.js',
      'https://alcdn.msftauth.net/browser/2.38.3/js/msal-browser.min.js',
      'https://cdn.jsdelivr.net/npm/@azure/msal-browser@2.38.3/lib/msal-browser.min.js'
    ];
    for (const url of urls) {
      try {
        await new Promise((resolve, reject) => {
          const s = document.createElement('script');
          s.src = url; s.onload = resolve; s.onerror = reject;
          document.head.appendChild(s);
        });
        if (window.msal) return window.msal;
      } catch (err) {
        console.warn(`[AuthModel] Fallo al cargar MSAL desde: ${url}`);
      }
    }
    throw new Error('No se pudo cargar la librería MSAL. Verifica tu conexión a internet.');
  }

  // Inicializar la instancia de MSAL
  async initialize() {
    const msalLib = await this.loadMSAL();
    this.msalInstance = new msalLib.PublicClientApplication(this.config);
    await this.msalInstance.initialize();
  }

  // Retorna el perfil del usuario autenticado actual si está guardado en sesión
  getCurrentUser() {
    if (this.userProfile) return this.userProfile;
    const stored = sessionStorage.getItem('bdb_user_profile');
    if (stored) {
      this.userProfile = JSON.parse(stored);
      return this.userProfile;
    }
    return null;
  }

  // Ejecuta el flujo de Login con ventana emergente
  async login() {
    if (!this.msalInstance) await this.initialize();
    
    const result = await this.msalInstance.loginPopup({
      scopes: this.scopes,
      prompt: 'select_account'
    });

    const email = result.account?.username || '';
    const domain = email.split('@')[1]?.toLowerCase();

    if (domain !== this.allowedDomain) {
      // Intentar logout inmediato si no es un dominio permitido
      await this.msalInstance.logoutPopup({ account: result.account }).catch(() => {});
      throw new Error(`Acceso denegado. Solo se permiten cuentas del dominio @${this.allowedDomain}. Tu cuenta actual es ${email}`);
    }

    let displayName = result.account.name || email;
    let jobTitle = 'Colaborador';
    let photo = null;

    // Obtener perfil y foto desde Microsoft Graph
    try {
      const graphToken = await this.msalInstance.acquireTokenSilent({
        scopes: ['User.Read'],
        account: result.account
      });

      const profileRes = await fetch('https://graph.microsoft.com/v1.0/me?$select=displayName,jobTitle,mail', {
        headers: { Authorization: `Bearer ${graphToken.accessToken}` }
      });
      if (profileRes.ok) {
        const p = await profileRes.json();
        displayName = p.displayName || displayName;
        jobTitle = p.jobTitle || jobTitle;
      }

      const photoRes = await fetch('https://graph.microsoft.com/v1.0/me/photo/$value', {
        headers: { Authorization: `Bearer ${graphToken.accessToken}` }
      });
      if (photoRes.ok) {
        const blob = await photoRes.blob();
        photo = await new Promise(resolve => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        });
      }
    } catch (graphErr) {
      console.warn('[AuthModel] Error parcial al consultar Microsoft Graph:', graphErr.message);
    }

    this.userProfile = {
      nombre: displayName,
      cargo: jobTitle,
      email: email,
      foto: photo
    };

    sessionStorage.setItem('bdb_user_profile', JSON.stringify(this.userProfile));
    return this.userProfile;
  }

  // Cerrar sesión
  async logout() {
    sessionStorage.removeItem('bdb_user_profile');
    this.userProfile = null;
    if (this.msalInstance) {
      try {
        const accounts = this.msalInstance.getAllAccounts();
        if (accounts.length) {
          await this.msalInstance.logoutPopup({ account: accounts[0] }).catch(() => {});
        }
      } catch (err) {
        console.error('[AuthModel] Error al hacer logout en MSAL:', err);
      }
    }
  }
}

// Exponer la clase a nivel global
window.AuthModel = AuthModel;
