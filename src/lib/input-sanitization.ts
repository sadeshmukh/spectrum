export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

export function sanitizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

export function sanitizeString(
  input: string,
  maxLength: number = 1000
): string {
  return input.trim().substring(0, maxLength);
}

export function isValidNumber(value: any, min?: number, max?: number): boolean {
  const num = Number(value);
  if (isNaN(num)) return false;
  if (min !== undefined && num < min) return false;
  if (max !== undefined && num > max) return false;
  return true;
}

export function sanitizeInteger(
  value: any,
  min?: number,
  max?: number
): number | null {
  const num = Math.floor(Number(value));
  if (isNaN(num)) return null;
  if (min !== undefined && num < min) return null;
  if (max !== undefined && num > max) return null;
  return num;
}
