'use strict';

/**
 * Utilidad para mapeo de prioridades
 * Función pura - NO accede a BD ni tiene lógica de negocio
 */
class PriorityMapper {
  static PRIORITY_MAP = {
    low: 3,
    normal: 5,
    high: 8,
    urgent: 10
  };

  static PRIORITY_NAMES = {
    3: 'low',
    5: 'normal',
    8: 'high',
    10: 'urgent'
  };

  /**
   * Mapea prioridad de string a número
   * @param {string} priority - 'low', 'normal', 'high', 'urgent'
   * @returns {number} Valor numérico de la prioridad
   */
  static toNumber(priority) {
    if (typeof priority === 'number') {
      return priority;
    }

    const lowerPriority = priority?.toLowerCase();
    return this.PRIORITY_MAP[lowerPriority] || this.PRIORITY_MAP.normal;
  }

  /**
   * Mapea prioridad de número a string
   * @param {number} priorityNumber
   * @returns {string} Nombre de la prioridad
   */
  static toString(priorityNumber) {
    return this.PRIORITY_NAMES[priorityNumber] || 'normal';
  }

  /**
   * Verifica si una prioridad es alta
   * @param {string|number} priority
   * @returns {boolean}
   */
  static isHigh(priority) {
    const numericPriority = this.toNumber(priority);
    return numericPriority >= this.PRIORITY_MAP.high;
  }

  /**
   * Verifica si una prioridad es urgente
   * @param {string|number} priority
   * @returns {boolean}
   */
  static isUrgent(priority) {
    const numericPriority = this.toNumber(priority);
    return numericPriority >= this.PRIORITY_MAP.urgent;
  }

  /**
   * Verifica si una prioridad es baja
   * @param {string|number} priority
   * @returns {boolean}
   */
  static isLow(priority) {
    const numericPriority = this.toNumber(priority);
    return numericPriority <= this.PRIORITY_MAP.low;
  }

  /**
   * Compara dos prioridades
   * @param {string|number} priority1
   * @param {string|number} priority2
   * @returns {number} -1 si priority1 < priority2, 0 si iguales, 1 si priority1 > priority2
   */
  static compare(priority1, priority2) {
    const num1 = this.toNumber(priority1);
    const num2 = this.toNumber(priority2);

    if (num1 < num2) return -1;
    if (num1 > num2) return 1;
    return 0;
  }

  /**
   * Obtiene todas las prioridades disponibles
   * @returns {Array<{name: string, value: number}>}
   */
  static getAll() {
    return Object.entries(this.PRIORITY_MAP).map(([name, value]) => ({
      name,
      value
    }));
  }

  /**
   * Valida si una prioridad es válida
   * @param {string|number} priority
   * @returns {boolean}
   */
  static isValid(priority) {
    if (typeof priority === 'number') {
      return Object.values(this.PRIORITY_MAP).includes(priority);
    }

    const lowerPriority = priority?.toLowerCase();
    return lowerPriority in this.PRIORITY_MAP;
  }
}

module.exports = PriorityMapper;
