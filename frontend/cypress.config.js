const { defineConfig } = require("cypress");
const { exec } = require("child_process");
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
        "db:reset"() {
          return new Promise((resolve, reject) => {
            exec("python ../backend/scripts/reset_db.py", (err, stdout, stderr) => {
              if (err) {
                console.error(stderr);
                return reject(err);
              }
              console.log(stdout);
              resolve(null);
            });
          });
        },
        "db:seed"() {
          return new Promise((resolve, reject) => {
            exec("python ../backend/scripts/seed_db.py", (err, stdout, stderr) => {
              if (err) {
                console.error(stderr);
                return reject(err);
              }
              console.log(stdout);
              resolve(null);
            });
          });
        },
      });

      return config;
    }
  },
  experimentalStudio: true,
});
