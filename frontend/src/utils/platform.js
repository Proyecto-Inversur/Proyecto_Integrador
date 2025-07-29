export const isIOS = () =>
  /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());

export const isInStandaloneMode = () =>
  'standalone' in window.navigator && window.navigator.standalone;