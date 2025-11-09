import { jest } from '@jest/globals';

export const mockSignJWT = jest.fn(async (payload: unknown) => {
  return 'mock-jwt-token-' + JSON.stringify(payload ?? {});
});

export class SignJWT {
  private payload: unknown;

  constructor(payload: unknown) {
    this.payload = payload;
  }

  setProtectedHeader() {
    return this;
  }

  setIssuedAt() {
    return this;
  }

  setExpirationTime() {
    return this;
  }

  sign() {
    return mockSignJWT(this.payload);
  }
}

export const mockJwtVerify = jest.fn(async (token: string) => {
  if (token.startsWith('mock-jwt-token-')) {
    const payloadStr = token.replace('mock-jwt-token-', '');
    return {
      payload: JSON.parse(payloadStr),
    };
  }
  throw new Error('Invalid token');
});

export const jwtVerify = mockJwtVerify;
