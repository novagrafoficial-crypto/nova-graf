'use strict';

/**
 * New Relic agent configuration.
 *
 * Este archivo debe colocarse en la raíz del backend.
 */

exports.config = {
  /**
   * Nombre de la aplicación (como aparecerá en el dashboard de New Relic)
   */
  app_name: ['Nova Graf Backend'],  // Cambia el nombre si quieres
  /**
   * Tu licencia de New Relic
   */
  license_key: '038d359dc0be8f7b3e9f831a4a1953bdFFFFNRAL', // <- pega tu License Key aquí 92B027F5C8D689166B85BD2152B7A1E4F9FD21E63FDFD1D92504F0BA252628B8
  logging: {
    /**
     * Nivel de logging: 'trace', 'debug', 'info', 'warn', 'error', 'fatal'
     */
    level: 'info',
  },
  /**
   * Habilitar IAST
   */
  iast: {
    enabled: true,
  },
};