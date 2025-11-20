# Inversur App
Sistema de gestión de cuadrillas para obras de mantenimiento.

## Tecnologías
- Backend: Python (FastAPI)
- Frontend: React
- Bases de datos: PostgreSQL, Firebase
- CI/CD: GitHub Actions
- Despliegue: Azure

## Instalación
1. Clona el repositorio: git clone <url>
2. Configura las variables de entorno en Backend/src/env.config y Frontend/.env
3. Docker: docker-compose up -d
4. Backend: cd backend && pip install -r requirements.txt && cd src && uvicorn main:app --host 0.0.0.0 --port 8000
5. Frontend: cd frontend && npm install && npm run dev

## Tests con code coverage
1. Backend: cd backend && pytest -v --cov=src --cov-report=xml --junitxml=pytest-report.xml
2. Frontend: cd frontend && npm test -- --coverage --ci
3. Cypress (Necesita estar corriendo el backend y frontend en local): cd frontend && npm run cy:run --reporter mocha-junit-reporter --reporter-options "mochaFile=cypress/results.xml"