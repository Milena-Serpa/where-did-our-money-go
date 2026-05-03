const request = require('supertest');
const app = require('../../src/app');
const testDb = require('../helpers/test-db');

beforeAll(async () => await testDb.connect());
afterAll(async () => await testDb.close());
afterEach(async () => await testDb.clear());

async function createAuthUser(email, familyId = null) {
  const payload = {
    name: 'Test User',
    email,
    password: 'password123'
  };
  if (familyId) payload.familyId = familyId;
  
  const res = await request(app).post('/auth/register').send(payload);
  return res.body; // { token, user }
}

describe('Transactions API', () => {
  let auth;

  beforeEach(async () => {
    auth = await createAuthUser('user1@example.com', 'family-1');
  });

  describe('POST /transactions', () => {
    it('should create a valid transaction', async () => {
      const res = await request(app)
        .post('/transactions')
        .set('Authorization', `Bearer ${auth.token}`)
        .send({
          title: 'Supermarket',
          amount: 50.5,
          category: 'alimentação'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.title).toBe('Supermarket');
      expect(res.body.amount).toBe(50.5);
      expect(res.body.category).toBe('alimentação');
      expect(res.body.familyId).toBe('family-1');
    });

    it('should fail without title', async () => {
      const res = await request(app)
        .post('/transactions')
        .set('Authorization', `Bearer ${auth.token}`)
        .send({
          amount: 50.5,
          category: 'alimentação'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('title is required');
    });

    it('should fail with negative amount', async () => {
      const res = await request(app)
        .post('/transactions')
        .set('Authorization', `Bearer ${auth.token}`)
        .send({
          title: 'Refund',
          amount: -10,
          category: 'outros'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('amount must be greater than zero');
    });

    it('should fail with invalid category', async () => {
      const res = await request(app)
        .post('/transactions')
        .set('Authorization', `Bearer ${auth.token}`)
        .send({
          title: 'Gift',
          amount: 100,
          category: 'invalid-category'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('category must be one of');
    });
  });

  describe('GET /transactions', () => {
    it('should list only transactions from the same family', async () => {
      // Create transaction for family-1
      await request(app)
        .post('/transactions')
        .set('Authorization', `Bearer ${auth.token}`)
        .send({ title: 'F1 Trans', amount: 10, category: 'lazer' });

      // Create another user in family-2
      const auth2 = await createAuthUser('user2@example.com', 'family-2');
      await request(app)
        .post('/transactions')
        .set('Authorization', `Bearer ${auth2.token}`)
        .send({ title: 'F2 Trans', amount: 20, category: 'lazer' });

      const res = await request(app)
        .get('/transactions')
        .set('Authorization', `Bearer ${auth.token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].title).toBe('F1 Trans');
    });
  });

  describe('DELETE /transactions/:id', () => {
    it('should delete a transaction successfully', async () => {
      const createRes = await request(app)
        .post('/transactions')
        .set('Authorization', `Bearer ${auth.token}`)
        .send({ title: 'To Delete', amount: 10, category: 'outros' });

      const transactionId = createRes.body.id;

      const deleteRes = await request(app)
        .delete(`/transactions/${transactionId}`)
        .set('Authorization', `Bearer ${auth.token}`);

      expect(deleteRes.statusCode).toBe(204);

      const listRes = await request(app)
        .get('/transactions')
        .set('Authorization', `Bearer ${auth.token}`);
      expect(listRes.body.length).toBe(0);
    });

    it('should not allow deleting a transaction from another family', async () => {
      const createRes = await request(app)
        .post('/transactions')
        .set('Authorization', `Bearer ${auth.token}`)
        .send({ title: 'F1 Trans', amount: 10, category: 'outros' });

      const transactionId = createRes.body.id;

      const auth2 = await createAuthUser('user2@example.com', 'family-2');
      const deleteRes = await request(app)
        .delete(`/transactions/${transactionId}`)
        .set('Authorization', `Bearer ${auth2.token}`);

      expect(deleteRes.statusCode).toBe(404);
    });
  });

  describe('GET /transactions/summary', () => {
    it('should calculate correct totals per category for the family', async () => {
      await request(app)
        .post('/transactions')
        .set('Authorization', `Bearer ${auth.token}`)
        .send({ title: 'Food 1', amount: 100, category: 'alimentação' });
      
      await request(app)
        .post('/transactions')
        .set('Authorization', `Bearer ${auth.token}`)
        .send({ title: 'Food 2', amount: 50, category: 'alimentação' });

      await request(app)
        .post('/transactions')
        .set('Authorization', `Bearer ${auth.token}`)
        .send({ title: 'Fun', amount: 80, category: 'lazer' });

      const res = await request(app)
        .get('/transactions/summary')
        .set('Authorization', `Bearer ${auth.token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body['alimentação']).toBe(150);
      expect(res.body['lazer']).toBe(80);
      expect(res.body['transporte']).toBeUndefined();
    });

    it('should summarize data from multiple users in the same family', async () => {
      // User 1 in family-1
      await request(app)
        .post('/transactions')
        .set('Authorization', `Bearer ${auth.token}`)
        .send({ title: 'U1 Trans', amount: 100, category: 'bebidas' });

      // User 2 in family-1
      const auth2 = await createAuthUser('user2@example.com', 'family-1');
      await request(app)
        .post('/transactions')
        .set('Authorization', `Bearer ${auth2.token}`)
        .send({ title: 'U2 Trans', amount: 200, category: 'bebidas' });

      const res = await request(app)
        .get('/transactions/summary')
        .set('Authorization', `Bearer ${auth.token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body['bebidas']).toBe(300);
    });
  });
});
