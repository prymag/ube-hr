import {
  loginSchema,
  refreshTokenSchema,
  createUserSchema,
  updateUserSchema,
} from '../auth.validator';

describe('loginSchema', () => {
  it('should accept valid email and password', () => {
    const result = loginSchema.safeParse({ email: 'user@example.com', password: 'secret' });
    expect(result.success).toBe(true);
  });

  it('should reject invalid email', () => {
    const result = loginSchema.safeParse({ email: 'not-an-email', password: 'secret' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Invalid email address');
    }
  });

  it('should reject empty password', () => {
    const result = loginSchema.safeParse({ email: 'user@example.com', password: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Password is required');
    }
  });

  it('should reject missing fields', () => {
    const result = loginSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe('refreshTokenSchema', () => {
  it('should accept a valid refresh token', () => {
    const result = refreshTokenSchema.safeParse({ refreshToken: 'some.jwt.token' });
    expect(result.success).toBe(true);
  });

  it('should reject empty refresh token', () => {
    const result = refreshTokenSchema.safeParse({ refreshToken: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Refresh token is required');
    }
  });

  it('should reject missing refreshToken field', () => {
    const result = refreshTokenSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe('createUserSchema', () => {
  const validUser = {
    email: 'newuser@example.com',
    password: 'Password1',
    firstName: 'John',
    lastName: 'Doe',
  };

  it('should accept valid user data with default role', () => {
    const result = createUserSchema.safeParse(validUser);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.role).toBe('USER');
    }
  });

  it('should accept valid user data with explicit role', () => {
    const result = createUserSchema.safeParse({ ...validUser, role: 'ADMIN' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.role).toBe('ADMIN');
    }
  });

  it('should accept SYSTEM_ADMIN role', () => {
    const result = createUserSchema.safeParse({ ...validUser, role: 'SYSTEM_ADMIN' });
    expect(result.success).toBe(true);
  });

  it('should reject invalid role', () => {
    const result = createUserSchema.safeParse({ ...validUser, role: 'SUPERUSER' });
    expect(result.success).toBe(false);
  });

  it('should reject invalid email', () => {
    const result = createUserSchema.safeParse({ ...validUser, email: 'bad-email' });
    expect(result.success).toBe(false);
  });

  it('should reject password shorter than 8 characters', () => {
    const result = createUserSchema.safeParse({ ...validUser, password: 'Ab1' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('at least 8 characters');
    }
  });

  it('should reject password without uppercase letter', () => {
    const result = createUserSchema.safeParse({ ...validUser, password: 'password1' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('uppercase');
    }
  });

  it('should reject password without lowercase letter', () => {
    const result = createUserSchema.safeParse({ ...validUser, password: 'PASSWORD1' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('lowercase');
    }
  });

  it('should reject password without a number', () => {
    const result = createUserSchema.safeParse({ ...validUser, password: 'Passwordd' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('number');
    }
  });

  it('should reject empty firstName', () => {
    const result = createUserSchema.safeParse({ ...validUser, firstName: '' });
    expect(result.success).toBe(false);
  });

  it('should reject empty lastName', () => {
    const result = createUserSchema.safeParse({ ...validUser, lastName: '' });
    expect(result.success).toBe(false);
  });

  it('should reject firstName exceeding 100 characters', () => {
    const result = createUserSchema.safeParse({ ...validUser, firstName: 'A'.repeat(101) });
    expect(result.success).toBe(false);
  });
});

describe('updateUserSchema', () => {
  it('should accept partial update with only email', () => {
    const result = updateUserSchema.safeParse({ email: 'new@example.com' });
    expect(result.success).toBe(true);
  });

  it('should accept partial update with only firstName', () => {
    const result = updateUserSchema.safeParse({ firstName: 'Jane' });
    expect(result.success).toBe(true);
  });

  it('should accept partial update with valid password', () => {
    const result = updateUserSchema.safeParse({ password: 'NewPass1' });
    expect(result.success).toBe(true);
  });

  it('should accept update with multiple fields', () => {
    const result = updateUserSchema.safeParse({
      email: 'updated@example.com',
      firstName: 'Jane',
      lastName: 'Smith',
      role: 'ADMIN',
    });
    expect(result.success).toBe(true);
  });

  it('should reject invalid email in update', () => {
    const result = updateUserSchema.safeParse({ email: 'not-valid' });
    expect(result.success).toBe(false);
  });

  it('should reject weak password in update', () => {
    const result = updateUserSchema.safeParse({ password: 'weak' });
    expect(result.success).toBe(false);
  });

  it('should reject invalid role in update', () => {
    const result = updateUserSchema.safeParse({ role: 'UNKNOWN' });
    expect(result.success).toBe(false);
  });

  it('should reject empty object (no fields)', () => {
    const result = updateUserSchema.safeParse({});
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('At least one field must be provided for update');
    }
  });
});
