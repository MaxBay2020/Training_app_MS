import AuthControllers from '../controllers/authControllers';
import { StatusCode } from '../enums/Error';
import { Message } from '../enums/Error';
import { Request as ExpReq, Response as ExpRes } from 'express';
import AppDataSource from '../data-source';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

jest.mock('bcrypt');
jest.mock('jsonwebtoken');

const mockReq = {} as ExpReq;
const mockRes = {
    status: jest.fn().mockReturnThis(),
    send: jest.fn(),
} as unknown as ExpRes;

/**
 * test api: '/login'
 */
describe('AuthControllers.loginUser', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockReq.body = {};
    });

    /**
     * test if email or password not provided
     */
    it('should return 400 if email or password is missing', async () => {
        await AuthControllers.loginUser(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(StatusCode.E400);
        expect(mockRes.send).toHaveBeenCalledWith({
            info: null,
            message: Message.ErrParams,
        });
    });

    /**
     * test if user not found
     */
    it('should return 404 if user does not exist', async () => {
        mockReq.body = { email: 'test@example.com', password: 'password123' };

        AppDataSource.getRepository = jest.fn().mockReturnValue({
            createQueryBuilder: jest.fn().mockReturnThis(),
            leftJoin: jest.fn().mockReturnThis(),
            innerJoinAndSelect: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            getRawOne: jest.fn().mockResolvedValue(null), // 模拟用户不存在
        });

        await AuthControllers.loginUser(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(StatusCode.E404);
        expect(mockRes.send).toHaveBeenCalledWith({
            info: '',
            message: Message.ErrFind,
        });
    });

    /**
     * test if password not correct
     */
    it('should return 403 if password is incorrect', async () => {
        mockReq.body = { email: 'test@example.com', password: 'wrongpassword' };

        AppDataSource.getRepository = jest.fn().mockReturnValue({
            createQueryBuilder: jest.fn().mockReturnThis(),
            leftJoin: jest.fn().mockReturnThis(),
            innerJoinAndSelect: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            getRawOne: jest.fn().mockResolvedValue({
                email: 'test@example.com',
                password: 'hashedpassword',
            }),
        });

        (bcrypt.compare as jest.Mock).mockResolvedValue(false);

        await AuthControllers.loginUser(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(StatusCode.E403);
        expect(mockRes.send).toHaveBeenCalledWith({
            info: null,
            message: Message.EmailOrPasswordError,
        });
    });

    /**
     * test successful login
     */
    it('should return 200 with accessToken if login is successful', async () => {
        mockReq.body = { email: 'test@example.com', password: 'correctpassword' };

        AppDataSource.getRepository = jest.fn().mockReturnValue({
            createQueryBuilder: jest.fn().mockReturnThis(),
            leftJoin: jest.fn().mockReturnThis(),
            innerJoinAndSelect: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            getRawOne: jest.fn().mockResolvedValue({
                email: 'test@example.com',
                password: 'hashedpassword',
                userName: 'Test User',
                userRole: 'Admin',
                servicerId: '123',
                servicerMasterName: 'Service Master',
            }),
        });

        (bcrypt.compare as jest.Mock).mockResolvedValue(true);
        (jwt.sign as jest.Mock).mockReturnValue('mockedAccessToken');

        await AuthControllers.loginUser(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(StatusCode.E200);
        expect(mockRes.send).toHaveBeenCalledWith({
            accessToken: 'mockedAccessToken',
            userName: 'Test User',
            userEmail: 'test@example.com',
            userRole: 'Admin',
            servicerId: '123',
            servicerMasterName: 'Service Master',
        });
    });

    /**
     * test if server error
     */
    it('should return 500 if there is a database error', async () => {
        mockReq.body = { email: 'test@example.com', password: 'password123' };

        AppDataSource.getRepository = jest.fn().mockReturnValue({
            createQueryBuilder: jest.fn().mockReturnThis(),
            leftJoin: jest.fn().mockReturnThis(),
            innerJoinAndSelect: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            getRawOne: jest.fn().mockRejectedValue(new Error('Database error')),
        });

        await AuthControllers.loginUser(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(StatusCode.E500);
        expect(mockRes.send).toHaveBeenCalledWith({
            info: new Error('Database error'),
            message: Message.ServerError,
        });
    });
});
