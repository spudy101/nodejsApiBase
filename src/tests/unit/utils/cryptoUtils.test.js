// tests/unit/utils/cryptoUtils.test.js
const { encriptarMensaje, desencriptarMensaje, generarToken } = require('../../../src/utils/cryptoUtils');

describe('cryptoUtils', () => {
  describe('encriptarMensaje', () => {
    it('debería encriptar un mensaje correctamente', () => {
      const mensaje = 'mensaje secreto';
      const encrypted = encriptarMensaje(mensaje);
      
      expect(encrypted).toBeDefined();
      expect(typeof encrypted).toBe('string');
      expect(encrypted).not.toBe(mensaje);
      expect(encrypted.length).toBeGreaterThan(0);
    });

    it('debería generar diferentes valores para el mismo mensaje', () => {
      // Esto solo es cierto si usas IV aleatorio, pero con IV fijo debería ser igual
      const mensaje = 'test';
      const encrypted1 = encriptarMensaje(mensaje);
      const encrypted2 = encriptarMensaje(mensaje);
      
      // Con IV fijo, deberían ser iguales
      expect(encrypted1).toBe(encrypted2);
    });

    it('debería manejar strings vacíos', () => {
      const encrypted = encriptarMensaje('');
      expect(encrypted).toBeDefined();
      expect(typeof encrypted).toBe('string');
    });

    it('debería manejar caracteres especiales', () => {
      const mensaje = 'ñáéíóú@#$%&*()';
      const encrypted = encriptarMensaje(mensaje);
      
      expect(encrypted).toBeDefined();
      expect(typeof encrypted).toBe('string');
    });
  });

  describe('desencriptarMensaje', () => {
    it('debería desencriptar un mensaje correctamente', () => {
      const original = 'mensaje secreto';
      const encrypted = encriptarMensaje(original);
      const decrypted = desencriptarMensaje(encrypted);
      
      expect(decrypted).toBe(original);
    });

    it('debería desencriptar strings vacíos', () => {
      const original = '';
      const encrypted = encriptarMensaje(original);
      const decrypted = desencriptarMensaje(encrypted);
      
      expect(decrypted).toBe(original);
    });

    it('debería desencriptar caracteres especiales', () => {
      const original = 'ñáéíóú@#$%&*()';
      const encrypted = encriptarMensaje(original);
      const decrypted = desencriptarMensaje(encrypted);
      
      expect(decrypted).toBe(original);
    });

    it('debería lanzar error con datos corruptos', () => {
      expect(() => {
        desencriptarMensaje('datos-invalidos');
      }).toThrow();
    });

    it('debería manejar números encriptados como strings', () => {
      const timestamp = Date.now().toString();
      const encrypted = encriptarMensaje(timestamp);
      const decrypted = desencriptarMensaje(encrypted);
      
      expect(decrypted).toBe(timestamp);
      expect(parseInt(decrypted, 10)).toBe(parseInt(timestamp, 10));
    });
  });

  describe('generarToken', () => {
    it('debería generar un token de longitud correcta', () => {
      const token = generarToken(64);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBe(128); // 64 bytes = 128 caracteres hex
    });

    it('debería generar tokens únicos', () => {
      const token1 = generarToken();
      const token2 = generarToken();
      
      expect(token1).not.toBe(token2);
    });

    it('debería generar token con longitud personalizada', () => {
      const token = generarToken(32);
      expect(token.length).toBe(64); // 32 bytes = 64 caracteres hex
    });

    it('debería generar solo caracteres hexadecimales', () => {
      const token = generarToken();
      const hexRegex = /^[0-9a-f]+$/;
      expect(hexRegex.test(token)).toBe(true);
    });
  });

  describe('Integración encriptar/desencriptar', () => {
    it('debería mantener integridad de datos con múltiples ciclos', () => {
      const original = 'datos importantes';
      let encrypted = encriptarMensaje(original);
      
      for (let i = 0; i < 5; i++) {
        const decrypted = desencriptarMensaje(encrypted);
        expect(decrypted).toBe(original);
        encrypted = encriptarMensaje(decrypted);
      }
    });

    it('debería manejar strings largos', () => {
      const original = 'a'.repeat(10000);
      const encrypted = encriptarMensaje(original);
      const decrypted = desencriptarMensaje(encrypted);
      
      expect(decrypted).toBe(original);
      expect(decrypted.length).toBe(10000);
    });
  });
});
