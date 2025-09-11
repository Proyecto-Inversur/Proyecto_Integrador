const isProd = window.location.host.includes('nice-rock');

const getApiUrl = () => {
  const apiUrl = import.meta.env[`VITE_API_URL_${isProd ? 'PROD' : 'QA'}`];

  if (!apiUrl) {
    console.error('Missing API URL configuration in .env');
    return null;
  }

  return apiUrl;
};

const getFirebaseConfig = () => {
  const config = import.meta.env[`VITE_FIREBASE_CONFIG_${isProd ? 'PROD' : 'QA'}`];

  if (!config) {
    console.error('Missing Firebase configuration in .env');
    return null;
  }

  return JSON.parse(config);
};

const getMapsApiKey = () => {
  const config = import.meta.env[`VITE_GOOGLE_MAPS_API_KEY_${isProd ? 'PROD' : 'QA'}`];

  if (!config) {
    console.error('Missing Maps api key in .env');
    return null;
  }

  return config;
};

const getWebPushPublicKey = () => {
  const key = import.meta.env[`VITE_WEB_PUSH_PUBLIC_KEY_${isProd ? 'PROD' : 'QA'}`];

  if (!key) {
    console.error('Missing web push public key in .env');
    return null;
  }

  return key;
};

const getGoogleClient = () => {
  const clientId = import.meta.env[`VITE_GOOGLE_CLIENT_ID_${isProd ? 'PROD' : 'QA'}`];

  if (!clientId) {
    console.error('Missing Google Client ID configuration in .env');
    return null;
  }

  return clientId;
};

export const config = {
  API_URL: getApiUrl(),
  firebaseConfig: getFirebaseConfig(),
  mapsApiKey: getMapsApiKey(),
  googleClientId: getGoogleClient(),
  webPushPublicKey: getWebPushPublicKey(),
};
