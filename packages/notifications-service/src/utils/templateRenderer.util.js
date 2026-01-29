'use strict';

/**
 * Utilidad para renderizar templates con variables
 * Función pura - NO accede a BD ni tiene lógica de negocio
 */
class TemplateRenderer {
  /**
   * Reemplaza variables en un template usando el formato {{variable}}
   * @param {string} template - Template con variables en formato {{variable}}
   * @param {Object} data - Objeto con los valores para reemplazar
   * @returns {string} Template con variables reemplazadas
   */
  static render(template, data) {
    if (!template) return '';
    if (!data || typeof data !== 'object') return template;
    
    return template.replace(/\{\{(\w+)\}\}/g, (match, variable) => {
      return data[variable] !== undefined ? data[variable] : match;
    });
  }

  /**
   * Valida que un template tenga el formato correcto
   * @param {string} template
   * @returns {boolean}
   */
  static isValid(template) {
    if (!template || typeof template !== 'string') return false;
    
    // Verificar que las llaves estén balanceadas
    const openBraces = (template.match(/\{\{/g) || []).length;
    const closeBraces = (template.match(/\}\}/g) || []).length;
    
    return openBraces === closeBraces;
  }

  /**
   * Extrae las variables de un template
   * @param {string} template
   * @returns {Array<string>} Array de nombres de variables
   */
  static extractVariables(template) {
    if (!template) return [];
    
    const matches = template.matchAll(/\{\{(\w+)\}\}/g);
    const variables = [...matches].map(match => match[1]);
    
    // Remover duplicados
    return [...new Set(variables)];
  }

  /**
   * Verifica que todos los datos requeridos estén presentes
   * @param {string} template
   * @param {Object} data
   * @returns {{valid: boolean, missing: Array<string>}}
   */
  static validateData(template, data) {
    const requiredVars = this.extractVariables(template);
    const missing = requiredVars.filter(varName => !(varName in data));
    
    return {
      valid: missing.length === 0,
      missing
    };
  }
}

module.exports = TemplateRenderer;
