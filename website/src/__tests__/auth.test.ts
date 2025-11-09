import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import type { UserSession } from '../lib/auth';

const createSignJWTInstance = (payload: unknown, token?: string) => {
  const sign = jest.fn().mockResolvedValue(
    token ?? `mock-jwt-token-${JSON.stringify(payload)}`
  );

  return {
    setProtectedHeader: jest.fn().mockReturnThis(),
    setIssuedAt: jest.fn().mockReturnThis(),
    setExpirationTime: jest.fn().mockReturnThis(),
    sign,
  };
};

jest.mock('jose', () => ({
  SignJWT: jest.fn().mockImplementation((payload: unknown) =>
    createSignJWTInstance(payload)
  ),
  jwtVerify: jest.fn(),
}));

const { SignJWT: mockSignJWT, jwtVerify: mockJwtVerify } = jest.mocked(
  jest.requireMock<typeof import('jose')>('jose')
);

// Mock next/headers
const mockCookiesGet = jest.fn();
const mockCookiesDelete = jest.fn();
const mockCookies = jest.fn(() =>
  Promise.resolve({
    get: mockCookiesGet,
    delete: mockCookiesDelete,
  })
);
const mockHeadersGet = jest.fn();
const mockHeaders = jest.fn(() =>
  Promise.resolve({
    get: mockHeadersGet,
  })
);

jest.mock('next/headers', () => ({
  cookies: mockCookies,
  headers: mockHeaders,
}));

// Mock Prisma
const mockPrismaUserFindUnique = jest.fn();
const mockPrismaSessionCreate = jest.fn();
const mockPrismaSessionFindUnique = jest.fn();
const mockPrismaSessionDelete = jest.fn();

jest.mock('../lib/prisma.ts', () => ({
  __esModule: true,
  prisma: {
    user: {
      findUnique: mockPrismaUserFindUnique,
    },
    session: {
      create: mockPrismaSessionCreate,
      findUnique: mockPrismaSessionFindUnique,
      delete: mockPrismaSessionDelete,
    },
  },
}));

let bcrypt: typeof import('bcryptjs').default;
let hashPassword: typeof import('../lib/auth').hashPassword;
let verifyPassword: typeof import('../lib/auth').verifyPassword;
let createSession: typeof import('../lib/auth').createSession;
let getSession: typeof import('../lib/auth').getSession;
let destroySession: typeof import('../lib/auth').destroySession;
let requireAuth: typeof import('../lib/auth').requireAuth;

beforeAll(async () => {
  const bcryptModule = await import('bcryptjs');
  bcrypt = bcryptModule.default;

  const authModule = await import('../lib/auth');
  ({
    hashPassword,
    verifyPassword,
    createSession,
    getSession,
    destroySession,
    requireAuth,
  } = authModule);
});

describe('Authentication Module', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    plan: 'free',
  };

  const mockUserSession: UserSession = {
    id: mockUser.id,
    email: mockUser.email,
    firstName: mockUser.firstName,
    lastName: mockUser.lastName,
    plan: mockUser.plan,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'dev-secret-key-change-in-production';
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Password Hashing', () => {
    describe('hashPassword', () => {
      it('should hash a password successfully', async () => {
        const password = 'SecurePassword123!';
        const hashedPassword = await hashPassword(password);

        expect(hashedPassword).toBeDefined();
        expect(hashedPassword).not.toBe(password);
        expect(hashedPassword.length).toBeGreaterThan(50);
        expect(hashedPassword).toMatch(/^\$2[aby]\$/); // bcrypt hash format
      });

      it('should generate different hashes for the same password', async () => {
        const password = 'SamePassword123!';
        const hash1 = await hashPassword(password);
        const hash2 = await hashPassword(password);

        expect(hash1).not.toBe(hash2);
      });

      it('should handle empty password', async () => {
        const hashedPassword = await hashPassword('');
        expect(hashedPassword).toBeDefined();
      });
    });

    describe('verifyPassword', () => {
      it('should verify correct password', async () => {
        const password = 'CorrectPassword123!';
        const hashedPassword = await bcrypt.hash(password, 12);

        const isValid = await verifyPassword(password, hashedPassword);
        expect(isValid).toBe(true);
      });

      it('should reject incorrect password', async () => {
        const correctPassword = 'CorrectPassword123!';
        const incorrectPassword = 'WrongPassword123!';
        const hashedPassword = await bcrypt.hash(correctPassword, 12);

        const isValid = await verifyPassword(incorrectPassword, hashedPassword);
        expect(isValid).toBe(false);
      });

      it('should reject password with wrong case', async () => {
        const password = 'CaseSensitivePassword!';
        const hashedPassword = await bcrypt.hash(password, 12);

        const isValid = await verifyPassword('casesensitivepassword!', hashedPassword);
        expect(isValid).toBe(false);
      });

      it('should handle empty password comparison', async () => {
        const hashedPassword = await bcrypt.hash('password', 12);
        const isValid = await verifyPassword('', hashedPassword);
        expect(isValid).toBe(false);
      });
    });
  });

  describe('Session Management', () => {
    describe('createSession', () => {
      it('should create a valid session with JWT token', async () => {
        const userId = 'user-123';

        mockPrismaUserFindUnique.mockResolvedValueOnce(mockUser);
        mockPrismaSessionCreate.mockResolvedValueOnce({
          id: 'session-456',
          userId,
          sessionToken: 'mock-token',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        });

        const token = await createSession(userId);

        expect(token).toBeDefined();
        expect(typeof token).toBe('string');
        expect(token).toContain('mock-jwt-token-');

        // Verify Prisma calls
        expect(mockPrismaUserFindUnique).toHaveBeenCalledWith({
          where: { id: userId },
          select: { id: true, email: true, firstName: true, lastName: true, plan: true },
        });

        expect(mockPrismaSessionCreate).toHaveBeenCalledWith({
          data: {
            userId,
            sessionToken: token,
            expiresAt: expect.any(Date),
          },
        });
      });

      it('should throw error when user not found', async () => {
        const userId = 'non-existent-user';

        mockPrismaUserFindUnique.mockResolvedValueOnce(null);

        await expect(createSession(userId)).rejects.toThrow('User not found');

        expect(mockPrismaUserFindUnique).toHaveBeenCalled();
        expect(mockPrismaSessionCreate).not.toHaveBeenCalled();
      });

      it('should create session with correct expiration time (7 days)', async () => {
        const userId = 'user-123';
        const mockToken = 'mock-jwt-token';
        const beforeCreate = Date.now();

        mockSignJWT.mockImplementationOnce((payload) =>
          createSignJWTInstance(payload, mockToken)
        );
        mockPrismaUserFindUnique.mockResolvedValueOnce(mockUser);
        mockPrismaSessionCreate.mockResolvedValueOnce({
          id: 'session-456',
          userId,
          sessionToken: mockToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        });

        await createSession(userId);

        const createCall = mockPrismaSessionCreate.mock.calls[0][0];
        const expiresAt = createCall.data.expiresAt;
        const expectedExpiry = beforeCreate + 7 * 24 * 60 * 60 * 1000;
        const afterCreate = Date.now() + 7 * 24 * 60 * 60 * 1000;

        expect(expiresAt.getTime()).toBeGreaterThanOrEqual(expectedExpiry - 1000);
        expect(expiresAt.getTime()).toBeLessThanOrEqual(afterCreate + 1000);
      });

      it('should handle database errors gracefully', async () => {
        const userId = 'user-123';

        mockPrismaUserFindUnique.mockRejectedValueOnce(new Error('Database connection failed'));

        await expect(createSession(userId)).rejects.toThrow('Database connection failed');
      });
    });

    describe('getSession', () => {
      it('should return user session with valid token', async () => {
        const validToken = 'valid-jwt-token';

        mockCookiesGet.mockReturnValueOnce({ value: validToken });
        mockJwtVerify.mockResolvedValueOnce({ payload: mockUserSession });
        mockPrismaSessionFindUnique.mockResolvedValueOnce({
          id: 'session-456',
          userId: mockUser.id,
          sessionToken: validToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        });

        const session = await getSession();

        expect(session).toEqual(mockUserSession);
        expect(mockCookiesGet).toHaveBeenCalledWith('session');
        expect(mockPrismaSessionFindUnique).toHaveBeenCalledWith({
          where: { sessionToken: validToken },
        });
      });

      it('should return null when no session cookie exists', async () => {
        mockCookiesGet.mockReturnValueOnce(undefined);

        const session = await getSession();

        expect(session).toBeNull();
        expect(mockPrismaSessionFindUnique).not.toHaveBeenCalled();
      });

      it('should return null with invalid JWT token', async () => {
        const invalidToken = 'invalid.jwt.token';

        mockCookiesGet.mockReturnValueOnce({ value: invalidToken });
        mockJwtVerify.mockRejectedValueOnce(new Error('Invalid token'));

        const session = await getSession();

        expect(session).toBeNull();
        expect(mockPrismaSessionFindUnique).not.toHaveBeenCalled();
      });

      it('should return null when session not found in database', async () => {
        const validToken = 'valid-jwt-token';

        mockCookiesGet.mockReturnValueOnce({ value: validToken });
        mockJwtVerify.mockResolvedValueOnce({ payload: mockUserSession });
        mockPrismaSessionFindUnique.mockResolvedValueOnce(null);

        const session = await getSession();

        expect(session).toBeNull();
      });

      it('should return null and delete expired session', async () => {
        const validToken = 'valid-jwt-token';
        const expiredDate = new Date(Date.now() - 1000); // 1 second ago

        mockCookiesGet.mockReturnValueOnce({ value: validToken });
        mockJwtVerify.mockResolvedValueOnce({ payload: mockUserSession });
        mockPrismaSessionFindUnique.mockResolvedValueOnce({
          id: 'session-456',
          userId: mockUser.id,
          sessionToken: validToken,
          expiresAt: expiredDate,
        });
        mockPrismaSessionDelete.mockResolvedValueOnce({
          id: 'session-456',
          userId: mockUser.id,
          sessionToken: validToken,
          expiresAt: expiredDate,
        });

        const session = await getSession();

        expect(session).toBeNull();
        expect(mockPrismaSessionDelete).toHaveBeenCalledWith({
          where: { id: 'session-456' },
        });
      });

      it('should handle expired session deletion errors gracefully', async () => {
        const validToken = 'valid-jwt-token';
        const expiredDate = new Date(Date.now() - 1000);

        mockCookiesGet.mockReturnValueOnce({ value: validToken });
        mockJwtVerify.mockResolvedValueOnce({ payload: mockUserSession });
        mockPrismaSessionFindUnique.mockResolvedValueOnce({
          id: 'session-456',
          userId: mockUser.id,
          sessionToken: validToken,
          expiresAt: expiredDate,
        });
        mockPrismaSessionDelete.mockRejectedValueOnce(new Error('Delete failed'));

        const session = await getSession();

        expect(session).toBeNull(); // Should still return null despite delete error
      });

      it('should handle expired JWT token', async () => {
        const expiredToken = 'expired-jwt-token';

        mockCookiesGet.mockReturnValueOnce({ value: expiredToken });
        mockJwtVerify.mockRejectedValueOnce(new Error('Token expired'));

        const session = await getSession();

        expect(session).toBeNull();
      });
    });

    describe('destroySession', () => {
      it('should delete session from database and cookies', async () => {
        const sessionToken = 'valid-session-token';

        mockCookiesGet.mockReturnValueOnce({ value: sessionToken });
        mockPrismaSessionDelete.mockResolvedValueOnce({
          id: 'session-456',
          userId: mockUser.id,
          sessionToken,
          expiresAt: new Date(),
        });

        await destroySession();

        expect(mockCookiesGet).toHaveBeenCalledWith('session');
        expect(mockPrismaSessionDelete).toHaveBeenCalledWith({
          where: { sessionToken },
        });
        expect(mockCookiesDelete).toHaveBeenCalledWith('session');
      });

      it('should handle missing session token gracefully', async () => {
        mockCookiesGet.mockReturnValueOnce(undefined);

        await destroySession();

        expect(mockPrismaSessionDelete).not.toHaveBeenCalled();
        expect(mockCookiesDelete).toHaveBeenCalledWith('session');
      });

      it('should handle database deletion errors gracefully', async () => {
        const sessionToken = 'valid-session-token';

        mockCookiesGet.mockReturnValueOnce({ value: sessionToken });
        mockPrismaSessionDelete.mockRejectedValueOnce(new Error('Session not found'));

        await expect(destroySession()).resolves.not.toThrow();

        expect(mockCookiesDelete).toHaveBeenCalledWith('session');
      });
    });

    describe('requireAuth', () => {
      it('should return user session when authenticated', async () => {
        const validToken = 'valid-jwt-token';

        mockCookiesGet.mockReturnValueOnce({ value: validToken });
        mockJwtVerify.mockResolvedValueOnce({ payload: mockUserSession });
        mockPrismaSessionFindUnique.mockResolvedValueOnce({
          id: 'session-456',
          userId: mockUser.id,
          sessionToken: validToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        });

        const session = await requireAuth();

        expect(session).toEqual(mockUserSession);
      });

      it('should throw error when not authenticated', async () => {
        mockCookiesGet.mockReturnValueOnce(undefined);

        await expect(requireAuth()).rejects.toThrow('Unauthorized');
      });

      it('should throw error when session is expired', async () => {
        const validToken = 'valid-jwt-token';
        const expiredDate = new Date(Date.now() - 1000);

        mockCookiesGet.mockReturnValueOnce({ value: validToken });
        mockJwtVerify.mockResolvedValueOnce({ payload: mockUserSession });
        mockPrismaSessionFindUnique.mockResolvedValueOnce({
          id: 'session-456',
          userId: mockUser.id,
          sessionToken: validToken,
          expiresAt: expiredDate,
        });
        mockPrismaSessionDelete.mockResolvedValueOnce({
          id: 'session-456',
          userId: mockUser.id,
          sessionToken: validToken,
          expiresAt: expiredDate,
        });

        await expect(requireAuth()).rejects.toThrow('Unauthorized');
      });

      it('should throw error when session not in database', async () => {
        const validToken = 'valid-jwt-token';

        mockCookiesGet.mockReturnValueOnce({ value: validToken });
        mockJwtVerify.mockResolvedValueOnce({ payload: mockUserSession });
        mockPrismaSessionFindUnique.mockResolvedValueOnce(null);

        await expect(requireAuth()).rejects.toThrow('Unauthorized');
      });
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete login flow', async () => {
      // Step 1: User registers with hashed password
      const password = 'SecurePassword123!';
      const hashedPassword = await hashPassword(password);
      expect(hashedPassword).toBeDefined();

      // Step 2: User logs in and password is verified
      const isValidPassword = await verifyPassword(password, hashedPassword);
      expect(isValidPassword).toBe(true);

      // Step 3: Session is created
      const mockToken = 'session-token-abc';
      mockSignJWT.mockImplementationOnce((payload) =>
        createSignJWTInstance(payload, mockToken)
      );
      mockPrismaUserFindUnique.mockResolvedValueOnce(mockUser);
      mockPrismaSessionCreate.mockResolvedValueOnce({
        id: 'session-456',
        userId: mockUser.id,
        sessionToken: mockToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      const sessionToken = await createSession(mockUser.id);
      expect(sessionToken).toBeDefined();

      // Step 4: Session is retrieved
      mockCookiesGet.mockReturnValueOnce({ value: sessionToken });
      mockJwtVerify.mockResolvedValueOnce({ payload: mockUserSession });
      mockPrismaSessionFindUnique.mockResolvedValueOnce({
        id: 'session-456',
        userId: mockUser.id,
        sessionToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      const session = await getSession();
      expect(session).toEqual(mockUserSession);
    });

    it('should handle complete logout flow', async () => {
      const sessionToken = 'active-session-token';

      // Step 1: Verify session exists
      mockCookiesGet.mockReturnValueOnce({ value: sessionToken });
      mockJwtVerify.mockResolvedValueOnce({ payload: mockUserSession });
      mockPrismaSessionFindUnique.mockResolvedValueOnce({
        id: 'session-456',
        userId: mockUser.id,
        sessionToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      let session = await getSession();
      expect(session).toBeDefined();

      // Step 2: Destroy session
      mockCookiesGet.mockReturnValueOnce({ value: sessionToken });
      mockPrismaSessionDelete.mockResolvedValueOnce({
        id: 'session-456',
        userId: mockUser.id,
        sessionToken,
        expiresAt: new Date(),
      });

      await destroySession();

      // Step 3: Verify session is gone
      mockCookiesGet.mockReturnValueOnce(undefined);
      session = await getSession();
      expect(session).toBeNull();
    });

    it('should reject invalid credentials', async () => {
      const correctPassword = 'CorrectPassword123!';
      const wrongPassword = 'WrongPassword123!';

      const hashedPassword = await hashPassword(correctPassword);
      const isValid = await verifyPassword(wrongPassword, hashedPassword);

      expect(isValid).toBe(false);
    });

    it('should handle session expiration gracefully', async () => {
      const validToken = 'valid-jwt-token';

      mockCookiesGet.mockReturnValueOnce({ value: validToken });
      mockJwtVerify.mockResolvedValueOnce({ payload: mockUserSession });
      mockPrismaSessionFindUnique.mockResolvedValueOnce({
        id: 'session-456',
        userId: mockUser.id,
        sessionToken: validToken,
        expiresAt: new Date(Date.now() - 1000), // Expired
      });
      mockPrismaSessionDelete.mockResolvedValueOnce({
        id: 'session-456',
        userId: mockUser.id,
        sessionToken: validToken,
        expiresAt: new Date(Date.now() - 1000),
      });

      const session = await getSession();

      expect(session).toBeNull();
      expect(mockPrismaSessionDelete).toHaveBeenCalled();
    });
  });

  describe('Security Tests', () => {
    it('should not accept tampered JWT tokens', async () => {
      const tamperedToken = 'tampered.jwt.token';

      mockCookiesGet.mockReturnValueOnce({ value: tamperedToken });
      mockJwtVerify.mockRejectedValueOnce(new Error('Invalid signature'));

      const session = await getSession();
      expect(session).toBeNull();
    });

    it('should properly salt password hashes', async () => {
      const password = 'TestPassword123!';

      // Generate multiple hashes
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);
      const hash3 = await hashPassword(password);

      // All should be different due to salt
      expect(hash1).not.toBe(hash2);
      expect(hash2).not.toBe(hash3);
      expect(hash1).not.toBe(hash3);

      // But all should verify correctly
      expect(await verifyPassword(password, hash1)).toBe(true);
      expect(await verifyPassword(password, hash2)).toBe(true);
      expect(await verifyPassword(password, hash3)).toBe(true);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle malformed JWT token', async () => {
      const malformedToken = 'not.a.valid.jwt.token.format';

      mockCookiesGet.mockReturnValueOnce({ value: malformedToken });
      mockJwtVerify.mockRejectedValueOnce(new Error('Malformed token'));

      const session = await getSession();
      expect(session).toBeNull();
    });

    it('should handle empty string token', async () => {
      mockCookiesGet.mockReturnValueOnce({ value: '' });

      const session = await getSession();
      expect(session).toBeNull();
    });

    it('should handle concurrent session creations', async () => {
      const mockToken1 = 'token-1';
      const mockToken2 = 'token-2';
      const mockToken3 = 'token-3';

      mockSignJWT
        .mockImplementationOnce((payload) =>
          createSignJWTInstance(payload, mockToken1)
        )
        .mockImplementationOnce((payload) =>
          createSignJWTInstance(payload, mockToken2)
        )
        .mockImplementationOnce((payload) =>
          createSignJWTInstance(payload, mockToken3)
        );

      mockPrismaUserFindUnique.mockResolvedValue(mockUser);
      mockPrismaSessionCreate.mockResolvedValue({
        id: 'session-456',
        userId: mockUser.id,
        sessionToken: 'mock-token',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      // Create multiple sessions concurrently
      const promises = [
        createSession(mockUser.id),
        createSession(mockUser.id),
        createSession(mockUser.id),
      ];

      const tokens = await Promise.all(promises);

      // All should succeed and create different tokens
      expect(tokens).toHaveLength(3);
      expect(tokens[0]).toBe(mockToken1);
      expect(tokens[1]).toBe(mockToken2);
      expect(tokens[2]).toBe(mockToken3);
    });

    it('should handle database connection failures during session verification', async () => {
      const validToken = 'valid-jwt-token';

      mockCookiesGet.mockReturnValueOnce({ value: validToken });
      mockJwtVerify.mockResolvedValueOnce({ payload: mockUserSession });
      mockPrismaSessionFindUnique.mockRejectedValueOnce(new Error('Database unavailable'));

      const session = await getSession();
      expect(session).toBeNull();
    });

    it('should handle very long passwords', async () => {
      const longPassword = 'a'.repeat(1000);

      const hashedPassword = await hashPassword(longPassword);
      expect(hashedPassword).toBeDefined();

      const isValid = await verifyPassword(longPassword, hashedPassword);
      expect(isValid).toBe(true);
    });

    it('should handle special characters in passwords', async () => {
      const specialPassword = '!@#$%^&*()_+-=[]{}|;:,.<>?/~`';

      const hashedPassword = await hashPassword(specialPassword);
      const isValid = await verifyPassword(specialPassword, hashedPassword);

      expect(isValid).toBe(true);
    });
  });
});
