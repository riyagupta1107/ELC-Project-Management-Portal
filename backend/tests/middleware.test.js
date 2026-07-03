// tests/middleware.test.js
import { requireUser } from '../src/middleware/authMiddleware.js'; // Adjust if this file is named differently
import { requireRole } from '../src/middleware/requireRole.js';
import admin from '../src/config/firebase-admin.js';
import User from '../src/models/User.js';
import { jest } from '@jest/globals';

describe('Auth & RBAC Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    // Create fake Express request and response objects
    req = { headers: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  describe('requireUser', () => {
    it('should return 401 if no Authorization header is present', async () => {
      await requireUser(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: "Unauthorized: No token provided" });
    });

    it('should attach user to request and call next() on success', async () => {
      req.headers.authorization = 'Bearer valid-token';
      
      // Mock Firebase passing
      admin.auth().verifyIdToken.mockResolvedValue({ uid: 'firebase-123' });
      
      // Save a fake user to the in-memory DB
      const fakeUser = new User({ firebaseUid: 'firebase-123', role: 'STUDENT', email: 'test@test.com' });
      await fakeUser.save();

      await requireUser(req, res, next);

      expect(req.user.firebaseUid).toBe('firebase-123');
      expect(next).toHaveBeenCalledTimes(1);
    });
  });

  describe('requireRole', () => {
    it('should return 403 if user role does not match required role', () => {
      req.user = { role: 'STUDENT' };
      const middleware = requireRole('PROFESSOR');
      
      middleware(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: "Forbidden" });
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next() if user role matches exactly', () => {
      req.user = { role: 'ADMIN' };
      const middleware = requireRole('ADMIN');
      
      middleware(req, res, next);
      
      expect(next).toHaveBeenCalledTimes(1);
    });
  });
});