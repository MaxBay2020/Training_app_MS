import request from 'supertest';
import app from '../index';
import dataSource from '../data-source';
import { StatusCode, Message } from '../enums/Error';
import { UserRoleEnum } from '../enums/enums';
import {Request as ExpReq, Response as ExpRes} from "express";
import TrainingController from "./trainingControllers";
import creditControllers from "./creditControllers";

// mock request and response
const mockReq = {} as ExpReq;
const mockRes = {
    status: jest.fn().mockReturnThis(),
    send: jest.fn(),
} as unknown as ExpRes;

jest.mock('../data-source');

/**
 * test api: '/credits'
 */
describe('GET /credits', () => {
    beforeEach(() => {
        mockReq.body = {};
        mockReq.params = {};
        jest.clearAllMocks();
    })

    // test if request params not provided
    it('should return 400 if missing required query parameters', async () => {
        mockReq.query = {};

        await creditControllers.queryAllCredits(mockReq, mockRes)

        expect(mockRes.status).toHaveBeenCalledWith(StatusCode.E400)
        expect(mockRes.send).toHaveBeenCalledWith({
            info: null,
            message: Message.ErrParams,
        });
    });

    // test if user rile is servicer
    it('should return 401 if user role is SERVICER', async () => {
        // mock query
        mockReq.query = {
            searchKeyword: 'search keyword',
            sortBy: 'credits',
            page: '1',
            limit: '10'
        };
        mockReq.body = {
            userRole: UserRoleEnum.SERVICER,
        }

        await creditControllers.queryAllCredits(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(StatusCode.E401);

        expect(mockRes.send).toHaveBeenCalledWith(
            expect.objectContaining({
                message: Message.AuthorizationError,
            })
        );

    });



    // test if server error
    it('should return 500 if a server error occurs', async () => {

        // mock query
        mockReq.query = {
            searchKeyword: 'search keyword',
            sortBy: 'credits',
            page: '1',
            limit: '10'
        };

        // mock db error
        dataSource.getRepository = jest.fn().mockReturnValue({
            createQueryBuilder: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            getOne: jest.fn().mockRejectedValue(new Error('Database error')),
        });

        await creditControllers.queryAllCredits(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(StatusCode.E500);

        expect(mockRes.send).toHaveBeenCalledWith(
            expect.objectContaining({
                message: Message.ServerError,
                info: expect.any(Error),
            })
        );
    });
});
