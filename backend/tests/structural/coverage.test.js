import { jest } from '@jest/globals';

// ─── Middleware: authMiddleware ────────────────────────────────────────────
describe('Structural — authMiddleware', () => {
  let protect, authorizeRoles;
  let mockReq, mockRes, mockNext;

  beforeEach(async () => {
    jest.resetModules();
    process.env.JWT_SECRET = 'jest_test_secret_32_chars_long!!';
    const mod = await import('../../middleware/authMiddleware.js');
    protect       = mod.protect;
    authorizeRoles = mod.authorizeRoles;
    mockRes  = { status: jest.fn().mockReturnThis(), json: jest.fn(), cookie: jest.fn() };
    mockNext = jest.fn();
  });

  test('protect: calls next(ApiError 401) when no token present', async () => {
    mockReq = { cookies: {}, headers: {} };
    await protect(mockReq, mockRes, mockNext);
    expect(mockNext).toHaveBeenCalled();
    const err = mockNext.mock.calls[0][0];
    expect(err.statusCode).toBe(401);
  });

  test('protect: calls next(ApiError 401) for malformed token', async () => {
    mockReq = { cookies: {}, headers: { authorization: 'Bearer not.a.valid.jwt' } };
    await protect(mockReq, mockRes, mockNext);
    expect(mockNext).toHaveBeenCalled();
    expect(mockNext.mock.calls[0][0].statusCode).toBe(401);
  });

  test('authorizeRoles: calls next(403) when role not in allowed list', () => {
    mockReq = { user: { role: 'patient' } };
    const middleware = authorizeRoles('admin', 'staff');
    middleware(mockReq, mockRes, mockNext);
    expect(mockNext).toHaveBeenCalled();
    expect(mockNext.mock.calls[0][0].statusCode).toBe(403);
  });

  test('authorizeRoles: calls next() without error when role is allowed', () => {
    mockReq = { user: { role: 'admin' } };
    const middleware = authorizeRoles('admin', 'staff');
    middleware(mockReq, mockRes, mockNext);
    expect(mockNext).toHaveBeenCalledWith(); // called with no args = success
  });
});

// ─── Utility: ApiError ─────────────────────────────────────────────────────
describe('Structural — ApiError class', () => {
  let ApiError;
  beforeAll(async () => {
    const mod = await import('../../utils/ApiError.js');
    ApiError = mod.default;
  });

  test('extends Error', () => {
    const err = new ApiError(500, 'Internal');
    expect(err).toBeInstanceOf(Error);
  });

  test('has correct statusCode property', () => {
    expect(new ApiError(404, 'Not found').statusCode).toBe(404);
    expect(new ApiError(403, 'Forbidden').statusCode).toBe(403);
  });

  test('isOperational flag is true', () => {
    expect(new ApiError(400, 'Bad request').isOperational).toBe(true);
  });

  test('message is set correctly', () => {
    const err = new ApiError(422, 'Unprocessable');
    expect(err.message).toBe('Unprocessable');
  });
});

// ─── Middleware: errorHandler ──────────────────────────────────────────────
describe('Structural — errorHandler middleware', () => {
  let errorHandler, ApiError;
  let mockReq, mockRes, mockNext;

  beforeAll(async () => {
    const eh = await import('../../middleware/errorHandler.js');
    const ae = await import('../../utils/ApiError.js');
    errorHandler = eh.errorHandler;
    ApiError     = ae.default;
    mockReq  = {};
    mockNext = jest.fn();
    mockRes  = { status: jest.fn().mockReturnThis(), json: jest.fn() };
  });

  test('returns correct status for ApiError', () => {
    const err = new ApiError(404, 'Not found');
    errorHandler(err, mockReq, mockRes, mockNext);
    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ success: false, message: 'Not found' }));
  });

  test('returns 500 for generic Error', () => {
    const err = new Error('Unexpected crash');
    errorHandler(err, mockReq, mockRes, mockNext);
    expect(mockRes.status).toHaveBeenCalledWith(500);
  });
});

// ─── Overlap logic (pure function) ────────────────────────────────────────
describe('Structural — appointment overlap pure logic', () => {
  const toMins  = t => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
  const overlaps = (s1, e1, s2, e2) => toMins(s1) < toMins(e2) && toMins(e1) > toMins(s2);

  test.each([
    ['09:00', '09:30', '09:15', '09:45', true,  'partial front overlap'],
    ['09:00', '09:30', '09:30', '10:00', false, 'back-to-back (no overlap)'],
    ['09:00', '10:00', '09:10', '09:50', true,  'new fully inside existing'],
    ['09:15', '09:45', '09:00', '10:00', true,  'new fully outside existing'],
    ['09:00', '09:30', '10:00', '10:30', false, 'completely separate'],
  ])('%s–%s vs %s–%s → %s (%s)', (s1, e1, s2, e2, expected) => {
    expect(overlaps(s1, e1, s2, e2)).toBe(expected);
  });
});