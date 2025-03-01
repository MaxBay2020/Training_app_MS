import {Message, StatusCode} from '../enums/Error';
import { TrainingTypeEnum } from '../enums/enums';
import TrainingController from './trainingControllers';
import {Request as ExpReq, Response as ExpRes} from 'express'
import dataSource from '../data-source'

// mock request and response
const mockReq = {} as ExpReq;
const mockRes = {
    status: jest.fn().mockReturnThis(),
    send: jest.fn(),
} as unknown as ExpRes;

jest.mock('../data-source');

/**
 * test api: '/training/trainingCredits'
 */
describe('TrainingController.queryAllTrainingTypes', () => {
    it('should return all training types except ECLASS', async () => {

        await TrainingController.queryAllTrainingTypes(mockReq, mockRes);

        // verify status code
        expect(mockRes.status).toHaveBeenCalledWith(StatusCode.E200);

        // verify data returned
        const allTrainingTypes = Object.values(TrainingTypeEnum).filter(
            (trainingType) => trainingType !== TrainingTypeEnum.ECLASS
        );

        expect(mockRes.send).toHaveBeenCalledWith(allTrainingTypes);
    });
});

/**
 * test api: '/training/:trainingId'
 */
describe('TrainingController.queryTrainingById', () => {

    beforeEach(() => {
        mockReq.body = {};
        mockReq.params = {};
        jest.clearAllMocks();
    })

    /**
     * testing if request params not correct
     */
    it('should return 400 if email or trainingId is missing', async () => {

        mockReq.body = { email: 'test@example.com' };

        // not pass trainingId
        mockReq.params = {};

        await TrainingController.queryTrainingById(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(StatusCode.E400);
        expect(mockRes.send).toHaveBeenCalledWith({
            info: '',
            message: Message.ErrParams,
        });
    });

    /**
     * testing if user not found
     */
    it('should return 404 if user is not found', async () => {

        mockReq.body = { email: 'test@example.com' };
        mockReq.params = { trainingId: '1' };

        // mock user not in the db
        dataSource.getRepository = jest.fn().mockReturnValue({
            createQueryBuilder: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            getOne: jest.fn().mockResolvedValue(null),
        });

        await TrainingController.queryTrainingById(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(StatusCode.E404);
        expect(mockRes.send).toHaveBeenCalledWith({
            info: '',
            message: Message.ErrFind,
        });
    });

    /**
     * testing if training not found
     */
    it('should return 404 if training is not found', async () => {

        mockReq.body = { email: 'test@example.com' };
        mockReq.params = { trainingId: '1' };

        // mock user exists, but no training found
        dataSource.getRepository = jest.fn().mockReturnValue({
            createQueryBuilder: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            getOne: jest.fn().mockResolvedValueOnce({ email: 'test@example.com' })
                .mockResolvedValueOnce(null),
        });

        await TrainingController.queryTrainingById(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(StatusCode.E404);
        expect(mockRes.send).toHaveBeenCalledWith({
            info: '',
            message: Message.ErrFind,
        });
    });



    /**
     * testing if its server error
     */
    it('should return 500 if there is an internal server error', async () => {
        mockReq.body = { email: 'test@example.com' };
        mockReq.params = { trainingId: '1' };

        // mock db error
        dataSource.getRepository = jest.fn().mockReturnValue({
            createQueryBuilder: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            getOne: jest.fn().mockRejectedValue(new Error('Database error')),
        });

        await TrainingController.queryTrainingById(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(StatusCode.E500);

        expect(mockRes.send).toHaveBeenCalledWith(
            expect.objectContaining({
                message: Message.ServerError,
                info: expect.any(Error),
            })
        );
    });

    /**
     * testing if everything is provided correctly and no errors
     */
    it('should return 200 and the training record if training is found', async () => {

        mockReq.body = { email: 'test@example.com' };
        mockReq.params = { trainingId: '1' };

        // mock training
        const mockTraining = { id: '1', name: 'Training A' };

        // mock user and training exist
        dataSource.getRepository = jest.fn().mockReturnValue({
            createQueryBuilder: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            getOne: jest.fn()
                .mockResolvedValueOnce({ email: 'test@example.com' })
                .mockResolvedValueOnce(mockTraining),
        });

        await TrainingController.queryTrainingById(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(StatusCode.E200);
        expect(mockRes.send).toHaveBeenCalledWith(mockTraining);
    });
});
