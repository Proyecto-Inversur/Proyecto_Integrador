const { defineConfig } = require("cypress");
const fs = require('fs');
const path = require('path');

// Load .env.test if available, otherwise fallback to .env
const envPath = fs.existsSync(path.join(__dirname, '.env.test'))
  ? path.join(__dirname, '.env.test')
  : path.join(__dirname, '.env');
require('dotenv').config({ path: envPath });

module.exports = defineConfig({
  reporter: 'mocha-junit-reporter',
  reporterOptions: {
    mochaFile: 'cypress/results-[hash].xml',
  },
  e2e: {
    baseUrl: process.env.VITE_FRONTEND_URL,
    specPattern: "cypress/e2e/**/*.cy.{js,jsx,ts,tsx}",
    supportFile: "cypress/support/e2e.js",
    setupNodeEvents(on, config) {
      on('task', {
        readFixture(filename) {
          const fixturePath = path.join(__dirname, 'cypress', 'fixtures', filename);
          return fs.readFileSync(fixturePath, 'utf8');
        },
      });

      return config;
    }
  },
  experimentalStudio: true,
});
