// tests/projects.test.js
import request from 'supertest';
import { jest } from '@jest/globals';
import app from '../src/app.js'; 
import admin from '../src/config/firebase-admin.js';
import User from '../src/models/User.js';
import Project from '../src/models/Project.js'; 

describe('Project API Endpoints', () => {
  let studentUser, professorUser;

  beforeEach(async () => {
    // Clear mocks to ensure a clean slate
    jest.clearAllMocks();

    // Seed the in-memory database with our specific roles
    studentUser = await User.create({ 
        firebaseUid: 'uid-student', 
        role: 'STUDENT', 
        email: 'stu@test.com' 
    });
    
    professorUser = await User.create({ 
        firebaseUid: 'uid-prof', 
        role: 'FACULTY', 
        email: 'prof@test.com' 
    });
  });

  // ---------------------------------------------------------
  // POST /api/projects/add
  // ---------------------------------------------------------
  describe('POST /api/projects/add', () => {
    const validProject = { title: 'AI Research', description: 'Testing the app', domain: 'AI' };
    it('should deny project creation for a Student (403)', async () => {
      admin.auth().verifyIdToken.mockResolvedValue({ uid: 'uid-student' });

      const response = await request(app)
        .post('/api/projects/add')
        .set('Authorization', 'Bearer fake-student-token')
        .send(validProject);

      expect(response.status).toBe(403);
    });

    it('should allow project creation for Faculty (201)', async () => {
      admin.auth().verifyIdToken.mockResolvedValue({ uid: 'uid-prof' });

      const response = await request(app)
        .post('/api/projects/add')
        .set('Authorization', 'Bearer fake-prof-token')
        .send(validProject);

      // Note: If your controller sends res.status(200), change this to 200!
      expect(response.status).toBe(201); 
      
      // Verify it actually saved to the database
      const projectInDb = await Project.findOne({ title: 'AI Research' });
      expect(projectInDb).not.toBeNull();
    });
  });

  // ---------------------------------------------------------
  // DELETE /api/projects/:id
  // ---------------------------------------------------------
  describe('DELETE /api/projects/:id', () => {
    let testProject;

    beforeEach(async () => {
      // Seed a project into the DB to test deletion
      // Included the required professorUid field!
      testProject = await Project.create({ 
          title: 'Delete Me', 
          description: 'Temp',
          professorUid: 'uid-prof' 
      });
    });

    it('should deny deletion for a Student (403)', async () => {
      admin.auth().verifyIdToken.mockResolvedValue({ uid: 'uid-student' });

      const response = await request(app)
        .delete(`/api/projects/${testProject._id}`)
        .set('Authorization', 'Bearer fake-student-token');

      expect(response.status).toBe(403);
    });

    it('should allow deletion for Faculty (200)', async () => {
      admin.auth().verifyIdToken.mockResolvedValue({ uid: 'uid-prof' });

      const response = await request(app)
        .delete(`/api/projects/${testProject._id}`)
        .set('Authorization', 'Bearer fake-prof-token');

      expect(response.status).toBe(200);
      
      // Verify it is completely gone from the database
      const projectInDb = await Project.findById(testProject._id);
      expect(projectInDb).toBeNull();
    });
  });
});