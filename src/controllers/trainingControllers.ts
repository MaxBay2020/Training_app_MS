import {Request as ExpReq, Response as ExpRes} from 'express'
import Training from "../entities/Training";
import {TrainingStatusEnum, TrainingTypeEnum, UserRoleEnum} from "../enums/enums";
import dataSource from "../data-source";
import User from "../entities/User";
import Error, {Message, StatusCode} from "../enums/Error";
import {validate} from "class-validator";
import Utils from "../utils/Utils";
import {In, Repository} from "typeorm";

class TrainingController {

    /**
     * query all training types
     * @param req
     * @param res
     */
    static queryAllTrainingTypes = async (req: ExpReq, res: ExpRes) => {
        const allTrainingTypes = Object.values(TrainingTypeEnum)
        return res.status(200).send(allTrainingTypes)
    }


    /**
     * get all training data
     * @param req
     * @param res
     */
    static queryAllTrainings = async (req: ExpReq, res: ExpRes) => {

        const { searchKeyword, sortBy, page, limit } = req.query

        if(!sortBy || !page || !limit){
            const error = new Error(null, StatusCode.E400, Message.ErrParams)
            return res.status(error.statusCode).send({
                info: error.info,
                message: error.message
            })
        }
        const { sortByFieldName, sortByOrder } = Utils.getSortingMethod(+sortBy)

        const startIndex = (+page - 1) * (+limit)

        // query all trainings from db
        try {
            const email: string = req.body.email
            const userRole= req.body.userRole

            let trainingListQueryBuilder = dataSource.getRepository(Training)
                .createQueryBuilder('training')

            if(userRole === UserRoleEnum.APPROVER){
                trainingListQueryBuilder
                    .where('training.trainingStatus = :value', { value :TrainingStatusEnum.PENDING })
            }


            if(userRole === UserRoleEnum.SERVICER){
                trainingListQueryBuilder
                    .innerJoinAndSelect('training.user', 'user', 'user.email = :email', { email } )
            }

            if(userRole === UserRoleEnum.ADMIN || userRole === UserRoleEnum.APPROVER){
                trainingListQueryBuilder
                    .innerJoinAndSelect('training.user', 'user')
                    .innerJoinAndSelect('user.servicer', 'sm')
            }

            if(searchKeyword){
                if(userRole === UserRoleEnum.SERVICER){
                    trainingListQueryBuilder = Utils.specifyColumnsToSearch(
                        trainingListQueryBuilder,
                        ['training.trainingName', 'training.trainingType', 'training.trainingStatus'],
                        searchKeyword as string)
                }else if(userRole === UserRoleEnum.ADMIN){
                    trainingListQueryBuilder = Utils.specifyColumnsToSearch(
                        trainingListQueryBuilder,
                        [
                            'training.trainingName',
                            'training.trainingType',
                            'training.trainingStatus',
                            'user.firstName',
                            'user.lastName',
                            'user.email',
                            'sm.id',
                            'sm.servicerMasterName'
                        ],
                        searchKeyword as string)
                }else if(userRole === UserRoleEnum.APPROVER){
                    trainingListQueryBuilder = Utils.specifyColumnsToSearch(
                        trainingListQueryBuilder,
                        [
                            'training.trainingName',
                            'training.trainingType',
                            'training.trainingStatus',
                            'user.firstName',
                            'user.lastName',
                            'user.email',
                            'sm.id',
                            'sm.servicerMasterName'
                        ],
                        searchKeyword as string)                }

                console.log(trainingListQueryBuilder.getQuery())
                console.log(await trainingListQueryBuilder.getMany())
            }



            trainingListQueryBuilder
                .orderBy(`training.${sortByFieldName}`, sortByOrder)

            const totalNumber: number = await trainingListQueryBuilder.getCount() as number
            const trainingList: Training[] = await trainingListQueryBuilder
                .skip(startIndex)
                .take(+limit)
                .getMany() as Training[]



            const totalPage = Math.ceil(totalNumber / +limit)

            return res.status(200).send({
                userRole,
                // TODO: need to be optimised
                trainingList: Utils.formattedTrainingList(trainingList, userRole),
                totalPage
            })


        }catch(e){
            console.log(e.message)
            const error = new Error<{}>(e, StatusCode.E500, Message.ServerError)
            return res.status(error.statusCode).send({
                info: error.info,
                message: error.message
            })
        }
    }

    /**
     * get training by trainingId
     * @param req
     * @param res
     */
    static queryTrainingById = async (req: ExpReq, res: ExpRes) => {
        const { email } = req.body
        const { trainingId } = req.params

        if(!email || !trainingId){
            const error = new Error(null, StatusCode.E400, Message.ErrParams)
            return res.status(error.statusCode).send({
                info: '',
                message: error.message
            })
        }

        // query training by trainingId from db
        try {
            const user: User =  await dataSource.getRepository(User)
                .createQueryBuilder('user')
                .where('user.email = :email', { email })
                .getOne() as User

            if(!user){
                const error = new Error(null, StatusCode.E404, Message.ErrFind)
                return res.status(error.statusCode).send({
                    info: '',
                    message: error.message
                })
            }

            const training: Training =  await dataSource.getRepository(Training)
                .createQueryBuilder('training')
                .where('training.id = :trainingId', { trainingId })
                .getOne() as Training

            if(!training){
                const error = new Error(null, StatusCode.E404, Message.ErrFind)
                return res.status(error.statusCode).send({
                    info: '',
                    message: error.message
                })
            }

            return res.status(200).send(training)
        }catch(e){
            console.log(e.message)
            const error = new Error<{}>(e, StatusCode.E500, Message.ServerError)
            return res.status(error.statusCode).send({
                info: error.info,
                message: error.message
            })
        }
    }

    /**
     * create training
     * @param req
     * @param res
     */
    static createTraining = async (req: ExpReq, res: ExpRes) => {
        const {
            trainingName,
            email,
            trainingType,
            startDate,
            endDate,
            hoursCount,
            trainingURL
        } = req.body

        if(!trainingName || !email || !trainingType || !startDate || !endDate || !hoursCount || startDate > endDate){
            const error = new Error(null, StatusCode.E400, Message.ErrParams)
            return res.status(error.statusCode).send({
                info: error.info,
                message: error.message
            })
        }


        try{
            const user: User =  await dataSource.getRepository(User)
                .createQueryBuilder('user')
                .innerJoinAndSelect('user.userRole', 'userRole')
                .where('user.email = :email', { email })
                .getOne() as User

            if(!user){
                const error = new Error(null, StatusCode.E404, Message.ErrFind)
                return res.status(error.statusCode).send({
                    info: '',
                    message: error.message
                })
            }

            const userRole = user.userRole.userRoleName

            if(userRole !== UserRoleEnum.SERVICER){
                const error = new Error(null, StatusCode.E401, Message.AuthorizationError)
                return res.status(error.statusCode).send({
                    info: '',
                    message: error.message
                })
            }

            const newTraining:Training = Training.create({
                trainingName,
                trainingType,
                startDate,
                endDate,
                hoursCount,
                trainingURL,
                user
            }) as Training

            const errors = await validate(newTraining)
            if(errors.length > 0){
                console.log(errors)
                const error = new Error(null, StatusCode.E400, Message.ErrParams)
                return res.status(error.statusCode).send({
                    info: '',
                    message: error.message
                })
            }

            await newTraining.save()
            return res.status(StatusCode.E200).send({
                info: '',
                message: Message.OK
            })

        }catch (e) {
            console.log(e.message)
            const error = new Error<{}>(e, StatusCode.E500, Message.ServerError)
            return res.status(error.statusCode).send({
                info: error.info,
                message: error.message
            })
        }
    }

    /**
     * update training
     * @param req
     * @param res
     */
    static updateTrainingById = async (req: ExpReq, res: ExpRes) => {
        const { email, userRole, trainingName, trainingType, startDate, endDate, hoursCount, trainingURL } = req.body
        const { trainingId } = req.params

        if(userRole === UserRoleEnum.ADMIN){
            const error = new Error(null, StatusCode.E401, Message.AuthorizationError)
            return res.status(error.statusCode).send({
                info: '',
                message: error.message
            })
        }

        if(!trainingId){
            const error = new Error(null, StatusCode.E400, Message.ErrParams)
            return res.status(error.statusCode).send({
                info: '',
                message: error.message
            })
        }

        const updatedTraining = Training.create({trainingName, trainingType, startDate, endDate, hoursCount, trainingURL})
        const errors = await validate(updatedTraining, {
            skipMissingProperties: true
        })
        if(errors.length > 0){
            console.log(errors)
            const error = new Error(null, StatusCode.E400, Message.ErrParams)
            return res.status(error.statusCode).send({
                info: '',
                message: error.message
            })
        }

        try{
            const training: Training =  await dataSource.getRepository(Training)
                .createQueryBuilder('training')
                .innerJoinAndSelect('training.user', 'user')
                .where('training.id = :trainingId', { trainingId })
                .andWhere('user.email = :email', { email })
                .getRawOne() as Training


            if(!training){
                const error = new Error(null, StatusCode.E404, Message.ErrFind)
                return res.status(error.statusCode).send({
                    info: '',
                    message: error.message
                })
            }

            await dataSource
                .createQueryBuilder()
                .update(Training)
                .set({trainingName, trainingType, startDate, endDate, hoursCount, trainingURL})
                .where('id = :trainingId', {trainingId})
                .execute()

            return res.status(StatusCode.E200).send({
                info: '',
                message: Message.OK
            })

        }catch (e) {
            console.log(e.message)
            const error = new Error<{}>(e, StatusCode.E500, Message.ServerError)
            return res.status(error.statusCode).send({
                info: error.info,
                message: error.message
            })
        }
    }

    /**
     * withdraw training by trainingId
     * @param req
     * @param res
     */
    static deleteTrainingById = async (req: ExpReq, res: ExpRes) => {
        const { email, userRole } = req.body
        const { trainingId } = req.params

        if(userRole === UserRoleEnum.ADMIN || userRole === UserRoleEnum.APPROVER ){
            const error = new Error(null, StatusCode.E401, Message.AuthorizationError)
            return res.status(error.statusCode).send({
                info: '',
                message: error.message
            })
        }

        if(!trainingId){
            const error = new Error(null, StatusCode.E400, Message.ErrParams)
            return res.status(error.statusCode).send({
                info: '',
                message: error.message
            })
        }

        try{
            const training: Training =  await dataSource.getRepository(Training)
                .createQueryBuilder('training')
                .innerJoinAndSelect('training.user', 'user')
                .where('training.id = :trainingId', { trainingId })
                .andWhere('user.email = :email', { email })
                .getRawOne() as Training


            if(!training){
                const error = new Error(null, StatusCode.E404, Message.ErrFind)
                return res.status(error.statusCode).send({
                    info: '',
                    message: error.message
                })
            }

            await dataSource
                .createQueryBuilder()
                .update(Training)
                .set({trainingStatus: TrainingStatusEnum.WITHDRAWN})
                .where('id = :trainingId', {trainingId})
                .execute()

            return res.status(StatusCode.E200).send({
                info: '',
                message: Message.OK
            })

        }catch (e) {
            console.log(e.message)
            const error = new Error<{}>(e, StatusCode.E500, Message.ServerError)
            return res.status(error.statusCode).send({
                info: error.info,
                message: error.message
            })
        }
    }

    static updateTrainingStatusByIds = async (req: ExpReq, res: ExpRes) => {
        const { trainingIds, approveOrReject, userRole, email } = req.body
        if(userRole !== UserRoleEnum.APPROVER){
            const error = new Error(null, StatusCode.E401, Message.AuthorizationError)
            return res.status(error.statusCode).send({
                info: '',
                message: error.message
            })
        }

        try {
            const [approverUser, trainingsList]= await Promise.all([
                dataSource.getRepository(User).findOneBy( { email } ),
                dataSource
                    .getRepository(Training)
                    .findBy({ id: In(trainingIds)})
            ])


            if(trainingsList.length !== trainingIds.length || !approverUser){
                const error = new Error(null, StatusCode.E404, Message.ErrFind)
                return res.status(error.statusCode).send({
                    info: '',
                    message: error.message
                })
            }

            trainingsList.forEach( training => {
                training.trainingStatus = approveOrReject
                training.operatedBy = approverUser
            })

            await Promise.all(trainingsList.map(training => training.save()))

            return res.status(StatusCode.E200).send({
                info: '',
                message: Message.OK
            })
        }catch (e) {
            console.log(e.message)
            const error = new Error<{}>(e, StatusCode.E500, Message.ServerError)
            return res.status(error.statusCode).send({
                info: error.info,
                message: error.message
            })
        }

    }
}

export default TrainingController
