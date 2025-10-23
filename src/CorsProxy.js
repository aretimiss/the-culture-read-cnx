// Alternative CORS solution
export const fetchWithCorsProxy = async (url) => {
  const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
  return fetch(proxyUrl + url);
};

// หรือใช้ proxy อื่น
export const fetchWithAllOrigins = async (url) => {
  const proxyUrl = 'https://api.allorigins.win/get?url=';
  const response = await fetch(proxyUrl + encodeURIComponent(url));
  const data = await response.json();
  return JSON.parse(data.contents);
};