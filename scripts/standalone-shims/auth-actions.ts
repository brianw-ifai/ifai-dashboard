export type AuthState = { error?: string; notice?: string } | null;

export async function logout(): Promise<void> {
  return;
}

export async function login(): Promise<AuthState> {
  return { error: "Sign-in is not available in this export." };
}

export async function signUp(): Promise<AuthState> {
  return { error: "Sign-up is not available in this export." };
}
