let sdkPromise;

export function loadGoogleSDK() {
  if (!sdkPromise) {
    sdkPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.onload = resolve;
      script.onerror = () => reject(new Error('Failed to load Google Sign-In SDK'));
      document.body.appendChild(script);
    });
  }
  return sdkPromise;
}
