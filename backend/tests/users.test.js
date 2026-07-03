// tests/users.test.js
import request from 'supertest';
import { jest } from '@jest/globals';
import app from '../src/app.js'; 
import admin from '../src/config/firebase-admin.js';
import User from '../src/models/User.js';

describe('User API Endpoints', () => {
  let standardUser, professorUser;

  beforeEach(async () => {
    jest.clearAllMocks();

    standardUser = await User.create({ 
        firebaseUid: 'uid-student', 
        role: 'STUDENT', 
        email: 'student@test.com',
        name: 'Test Student'
    });
    
    professorUser = await User.create({ 
        firebaseUid: 'uid-prof', 
        role: 'FACULTY', 
        email: 'prof@test.com',
        name: 'Test Prof'
    });
  });

  // ---------------------------------------------------------
  // GET /api/users/profile
  // ---------------------------------------------------------
  describe('GET /api/users/profile', () => {
    it('should deny access if no token is provided (401)', async () => {
      const response = await request(app).get('/api/users/profile');
      expect(response.status).toBe(401);
    });

    it('should return the logged-in user profile (200)', async () => {
      admin.auth().verifyIdToken.mockResolvedValue({ uid: 'uid-student' });

      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', 'Bearer fake-student-token');

      expect(response.status).toBe(200);
      expect(response.body.email).toBe('student@test.com');
      expect(response.body.role).toBe('STUDENT');
    });
  });

  // ---------------------------------------------------------
  // GET /api/users/faculties
  // ---------------------------------------------------------
  describe('GET /api/users/faculties', () => {
    it('should deny a Student from fetching faculties (403)', async () => {
      admin.auth().verifyIdToken.mockResolvedValue({ uid: 'uid-student' });

      const response = await request(app)
        .get('/api/users/faculties')
        .set('Authorization', 'Bearer fake-student-token');

      expect(response.status).toBe(403);
    });

    it('should allow Faculty to fetch faculties (200)', async () => {
      admin.auth().verifyIdToken.mockResolvedValue({ uid: 'uid-prof' });

      const response = await request(app)
        .get('/api/users/faculties')
        .set('Authorization', 'Bearer fake-prof-token');

      expect(response.status).toBe(200);
    });
  });
});