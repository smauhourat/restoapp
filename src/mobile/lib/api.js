export async function getProducts() {
  const URL_API = "http://localhost:3001/api/productos";
  const rawData = await fetch(URL_API);
  const json = await rawData.json();
  return json;
}
