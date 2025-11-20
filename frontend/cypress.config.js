const { defineConfig } = require("cypress");
const fs = require('fs');
const path = require('path');

// Load .env.test if available, otherwise fallback to .env
const envPath = fs.existsSync(path.join(__dirname, '.env.test'))
  ? path.join(__dirname, '.env.test')
  : path.join(__dirname, '.env');
require('dotenv').config({ path: envPath });

module.exports = defineConfig({
  e2e: {
    baseUrl: process.env.VITE_FRONTEND_URL,
    specPattern: "cypress/e2e/**/*.cy.{js,jsx,ts,tsx}",
    supportFile: "cypress/support/e2e.js",
    setupNodeEvents(on, config) {
      const resultsPath = path.join(__dirname, 'cypress', 'results.xml');
      const collectedSuites = [];

      const escapeXml = (value) => {
        if (value === null || value === undefined) {
          return '';
        }

        return String(value)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&apos;');
      };

      const msToSeconds = (ms) => {
        if (typeof ms !== 'number' || Number.isNaN(ms)) {
          return '0.000';
        }

        return (ms / 1000).toFixed(3);
      };

      const normalizeTestName = (titleParts = []) => {
        if (!Array.isArray(titleParts) || titleParts.length === 0) {
          return 'Unnamed test';
        }

        return titleParts.join(' > ');
      };

      on('before:run', () => {
        collectedSuites.length = 0;
        if (fs.existsSync(resultsPath)) {
          fs.unlinkSync(resultsPath);
        }
      });

      on('after:spec', (spec, results) => {
        collectedSuites.push({ spec, results });
      });

      on('after:run', () => {
        if (!collectedSuites.length) {
          return;
        }

        const aggregateStats = { tests: 0, failures: 0, skipped: 0, duration: 0 };

        const lines = [];
        lines.push('<?xml version="1.0" encoding="UTF-8"?>');
        lines.push('<testsuites name="Cypress E2E">');

        collectedSuites.forEach(({ spec, results }) => {
          const stats = results?.stats || {};
          const suiteDuration =
            stats.wallClockDuration ??
            stats.duration ??
            0;
          const timestamp = stats.wallClockStartedAt || '';
          const suiteName = spec?.name || spec?.relative || 'Cypress suite';
          const suiteFile = spec?.relative || suiteName;
          const testcases = results?.tests || [];
          const summary = { tests: 0, failures: 0, skipped: 0, duration: 0 };
          const testcaseLines = [];

          testcases.forEach((test) => {
            summary.tests += 1;

            const testName = normalizeTestName(test?.title);
            const classname = (spec?.relative || '').replace(/[\\/]/g, '.');
            const attempts = test?.attempts || [];
            const lastAttempt = attempts[attempts.length - 1] || {};
            const duration =
              lastAttempt.wallClockDuration ??
              lastAttempt.duration ??
              test?.duration ??
              0;
            summary.duration += typeof duration === 'number' ? duration : 0;
            const state = test?.state;

            if (state === 'failed') {
              summary.failures += 1;
            }

            if (state === 'pending' || state === 'skipped') {
              summary.skipped += 1;
            }

            testcaseLines.push(
              `    <testcase name="${escapeXml(testName)}" classname="${escapeXml(classname || 'cypress')}" time="${msToSeconds(duration)}">`
            );

            if (state === 'failed') {
              const error = lastAttempt.error || {};
              const message =
                error.message ||
                (test?.displayError ? test.displayError.split('\n')[0] : 'Test failed');
              const failureBody = test?.displayError || error.stack || message;

              testcaseLines.push(
                `      <failure message="${escapeXml(message)}">${escapeXml(failureBody)}</failure>`
              );
            } else if (state === 'pending' || state === 'skipped') {
              testcaseLines.push('      <skipped/>');
            }

            testcaseLines.push('    </testcase>');
          });

          aggregateStats.tests += summary.tests;
          aggregateStats.failures += summary.failures;
          aggregateStats.skipped += summary.skipped;
          aggregateStats.duration +=
            typeof suiteDuration === 'number' && !Number.isNaN(suiteDuration)
              ? suiteDuration
              : summary.duration;

          lines.push(
            `  <testsuite name="${escapeXml(suiteName)}" file="${escapeXml(suiteFile)}" tests="${summary.tests}" failures="${summary.failures}" skipped="${summary.skipped}" time="${msToSeconds(suiteDuration || summary.duration)}"${timestamp ? ` timestamp="${escapeXml(timestamp)}"` : ''}>`
          );

          testcaseLines.forEach((testcaseLine) => lines.push(testcaseLine));

          lines.push('  </testsuite>');
        });

        lines[1] = `<testsuites name="Cypress E2E" tests="${aggregateStats.tests}" failures="${aggregateStats.failures}" skipped="${aggregateStats.skipped}" time="${msToSeconds(aggregateStats.duration)}">`;
        lines.push('</testsuites>');

        fs.mkdirSync(path.dirname(resultsPath), { recursive: true });
        fs.writeFileSync(resultsPath, lines.join('\n'), 'utf8');
      });

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

