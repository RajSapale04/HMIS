import chai from 'chai';
import sinon from 'sinon';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { connect, closeDatabase, clearDatabase } from '../helpers/testDb.js';
import User from '../../models/User.js';

const { expect } = chai;

describe('Unit — Auth utilities', () => {
  before(async () => { await connect(); process.env.JWT_SECRET = 'test_secret_key_32chars_long!!!'; });
  after(async  () => { await closeDatabase(); });
  beforeEach(async () => { await clearDatabase(); });

  describe('User model — password hashing', () => {
    it('should hash the password on save', async () => {
      const user = await User.create({ name: 'Hash Test', email: 'hash@test.com', password: 'Plain@1234', role: 'patient' });
      expect(user.password).to.not.equal('Plain@1234');
      expect(user.password).to.match(/^\$2[ab]\$\d+\$/); // bcrypt pattern
    });

    it('matchPassword should return true for correct password', async () => {
      const user = await User.create({ name: 'Match', email: 'match@test.com', password: 'Correct@1', role: 'patient' });
      const result = await user.matchPassword('Correct@1');
      expect(result).to.be.true;
    });

    it('matchPassword should return false for wrong password', async () => {
      const user = await User.create({ name: 'Wrong', email: 'wrong@test.com', password: 'Right@1234', role: 'patient' });
      const result = await user.matchPassword('Wrong@1234');
      expect(result).to.be.false;
    });

    it('toJSON should strip password field', () => {
      const user = new User({ name: 'Safe', email: 's@t.com', password: 'hashedValue', role: 'patient' });
      const json = user.toJSON();
      expect(json).to.not.have.property('password');
    });

    it('should not re-hash if password is not modified', async () => {
      const user = await User.create({ name: 'NoRehash', email: 'nr@test.com', password: 'Hash@1234', role: 'patient' });
      const originalHash = user.password;
      user.name = 'Updated Name';
      await user.save();
      expect(user.password).to.equal(originalHash);
    });
  });

  describe('JWT token generation', () => {
    it('generateToken should produce a valid signed token', async () => {
      const { generateToken } = await import('../../utils/generateToken.js');
      const mockRes = { cookie: sinon.stub() };
      const token = generateToken(mockRes, 'someUserId');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      expect(decoded.id).to.equal('someUserId');
    });

    it('should set cookie on the response object', async () => {
      const { generateToken } = await import('../../utils/generateToken.js');
      const mockRes = { cookie: sinon.stub() };
      generateToken(mockRes, 'uid123');
      expect(mockRes.cookie.calledOnce).to.be.true;
      expect(mockRes.cookie.firstCall.args[0]).to.equal('token');
    });
  });

  describe('ApiError', () => {
    it('should create an error with correct statusCode', async () => {
      const { default: ApiError } = await import('../../utils/ApiError.js');
      const err = new ApiError(404, 'Not found');
      expect(err.statusCode).to.equal(404);
      expect(err.message).to.equal('Not found');
      expect(err.isOperational).to.be.true;
    });
  });
});