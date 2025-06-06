const getApiUrl = () => {
    const host = window.location.host;
    const isProd = host.includes('nice-rock'); // Ajusta según tus URLs
  
    const apiUrlQa = import.meta.env.VITE_API_URL_QA;
    const apiUrlProd = import.meta.env.VITE_API_URL_PROD;
  
    if (!apiUrlQa || !apiUrlProd) {
      console.error('Missing API URL configuration in .env');
      return null;
    }
  
    return isProd ? apiUrlProd : apiUrlQa;
  };
  
  export const API_URL = getApiUrl();

  export const NODE_ENV = import.meta.env.VITE_NODE_ENV || 'development';