export function setToken(token: string) {
  localStorage.setItem("jwt", token);
}

export function getToken(): string | null {
  // Check if we're in a browser environment
  if (typeof window !== 'undefined' && window.localStorage) {
    return localStorage.getItem("jwt");
  }
  return null;
}

export function removeToken() {
  localStorage.removeItem("jwt");
} 