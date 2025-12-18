// utils/requestLock.js
const LOCK_TIMEOUT = 30000;

const createRequestLock = (timeout = 30000) => {
    const locks = new Map();
    
    // Limpieza periódica opcional
    const cleanup = () => {
        const now = Date.now();
        for (const [key, time] of locks) {
            if (now - time >= timeout) {
                locks.delete(key);
            }
        }
    };
    
    // Limpiar cada minuto si tienes muchos usuarios
    const cleanupInterval = setInterval(cleanup, 60000);
    
    return {
        acquire(key) {
            if (!key) return true; // Permitir si no hay key
            
            const now = Date.now();
            const lockTime = locks.get(key);
            
            if (lockTime && (now - lockTime) < timeout) {
                return false;
            }
            
            locks.set(key, now);
            return true;
        },
        
        release(key) {
            if (key) locks.delete(key);
        },
        
        destroy() {
            clearInterval(cleanupInterval);
            locks.clear();
        }
    };
};

module.exports = { createRequestLock };