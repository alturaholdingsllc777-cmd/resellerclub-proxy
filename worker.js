export default {
  async fetch(request) {
    const url = new URL(request.url);
    const target = "https://httpapi.com" + url.pathname + url.search;

    const headers = new Headers(request.headers);
    headers.set("Accept", "application/json");

    const newRequest = new Request(target, {
      method: request.method,
      headers: headers,
      body: request.method !== "GET" && request.method !== "HEAD" ? request.body : null,
    });

    return fetch(newRequest);
  },
};