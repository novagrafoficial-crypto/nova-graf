'use strict';


exports.config = {
 
  app_name: ['Nova Graf Backend'],  

  license_key: '038d359dc0be8f7b3e9f831a4a1953bdFFFFNRAL', 
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