export interface Credentials {
  username: string;
  password: string;
}

export interface AuthStorage {
  getCredentials(): Credentials | null;
  setCredentials(credentials: Credentials): void;
  clear(): void;
}

/**
 * In-memory credentials store.
 * Data lives only while the process is running and is wiped on logout.
 */
class InMemoryAuthStorage implements AuthStorage {
  #value: Credentials | null = null;

  getCredentials(): Credentials | null {
    return this.#value;
  }

  setCredentials(credentials: Credentials): void {
    this.#value = { ...credentials };
  }

  clear(): void {
    this.#value = null;
  }
}

export const authStorage: AuthStorage = new InMemoryAuthStorage();

export function buildBasicAuthHeader(credentials: Credentials): string {
  const token = window.btoa(`${credentials.username}:${credentials.password}`);
  return `Basic ${token}`;
}

export function hasCredentials(credentials: Credentials | null): credentials is Credentials {
  return Boolean(credentials?.username && credentials?.password);
}
