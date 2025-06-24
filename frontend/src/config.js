const getApiUrl = () => {
  const isProd = window.location.host.includes('nice-rock');
  const apiUrl = import.meta.env[`VITE_API_URL_${isProd ? 'PROD' : 'QA'}`];

  if (!apiUrl) {
    console.error('Missing API URL configuration in .env');
    return null;
  }

  return apiUrl;
};

const getFirebaseConfig = () => {
  const isProd = window.location.host.includes('nice-rock');
  const config = import.meta.env[`VITE_FIREBASE_CONFIG_${isProd ? 'PROD' : 'QA'}`];

  if (!config) {
    console.error('Missing Firebase configuration in .env');
    return null;
  }

  return JSON.parse(config);
};

const getGoogleClient = () => {
  const isProd = window.location.host.includes('nice-rock');
  const clientId = import.meta.env[`VITE_GOOGLE_CLIENT_ID_${isProd ? 'PROD' : 'QA'}`];

  if (!clientId) {
    console.error('Missing Google Client ID configuration in .env');
    return null;
  }

  return clientId;
};

export const API_URL = getApiUrl();
export const firebaseConfig = getFirebaseConfig();
export const googleClientId = getGoogleClient();