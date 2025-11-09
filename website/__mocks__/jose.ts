export class SignJWT {
  private payload: any;

  constructor(payload: any) {
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

  async sign() {
    return 'mock-jwt-token-' + JSON.stringify(this.payload);
  }
}

export async function jwtVerify(token: string, secret: any) {
  if (token.startsWith('mock-jwt-token-')) {
    const payloadStr = token.replace('mock-jwt-token-', '');
    return {
      payload: JSON.parse(payloadStr)
    };
  }
  throw new Error('Invalid token');
}
