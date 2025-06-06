const { defineConfig } = require("cypress");
require('dotenv').config({ path: process.env.VITE_NODE_ENV === 'test' ? '.env.test' : '.env' });

module.exports = defineConfig({
  reporter: 'mocha-junit-reporter',
  reporterOptions: {
    mochaFile: 'cypress/results-[hash].xml',
  },
  e2e: {
    baseUrl: process.env.VITE_FRONTEND_URL,
    supportFile: 'cypress/support/e2e.js',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    viewportWidth: 1280,
    viewportHeight: 720,
    defaultCommandTimeout: 20000,
    requestTimeout: 20000,
    responseTimeout: 30000,
    setupNodeEvents(on, config) {
      console.log('VITE_NODE_ENV:', process.env.VITE_NODE_ENV);
      console.log('VITE_FRONTEND_URL:', process.env.VITE_FRONTEND_URL);
    },
  },
  experimentalStudio: true,
});