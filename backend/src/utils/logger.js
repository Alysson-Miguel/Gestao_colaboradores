/**
 * Sistema de Logs
 * Gerencia logs de aplicação com diferentes níveis
 */

const config = require('../config/config');

// Cores para console
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Formata data/hora
const formatDateTime = () => {
  const now = new Date();
  return now.toISOString();
};

// Logger básico
const logger = {
  info: (message, ...args) => {
    if (['info', 'debug'].includes(config.log.level)) {
      console.log(
        `${colors.blue}[INFO]${colors.reset} ${formatDateTime()} -`,
        message,
        ...args
      );
    }
  },

  success: (message, ...args) => {
    console.log(
      `${colors.green}[SUCCESS]${colors.reset} ${formatDateTime()} -`,
      message,
      ...args
    );
  },

  warn: (message, ...args) => {
    if (['info', 'warn', 'debug'].includes(config.log.level)) {
      console.warn(
        `${colors.yellow}[WARN]${colors.reset} ${formatDateTime()} -`,
        message,
        ...args
      );
    }
  },

  error: (message, ...args) => {
    console.error(
      `${colors.red}[ERROR]${colors.reset} ${formatDateTime()} -`,
      message,
      ...args
    );
  },

  debug: (message, ...args) => {
    if (config.log.level === 'debug') {
      console.log(
        `${colors.magenta}[DEBUG]${colors.reset} ${formatDateTime()} -`,
        message,
        ...args
      );
    }
  },

  http: (message, ...args) => {
    console.log(
      `${colors.cyan}[HTTP]${colors.reset} ${formatDateTime()} -`,
      message,
      ...args
    );
  },
};

module.exports = logger;
