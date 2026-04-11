import * as argon2 from 'argon2';

export async function hash(password: string): Promise<string> {
  return argon2.hash(password);
}

export async function verify(hash: string, password: string): Promise<boolean> {
  return argon2.verify(hash, password);
}
