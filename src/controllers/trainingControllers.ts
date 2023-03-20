import {Request as ExpReq, Response as ExpRes} from 'express'
import Training from "../entities/Training";
import {fiscalEndDate, TrainingStatusEnum, TrainingTypeEnum, UserRoleEnum} from "../enums/enums";
import dataSource from "../data-source";
import User from "../entities/User";
import Error, {Message, StatusCode} from "../enums/Error";
import {validate} from "class-validator";
import Utils from "../utils/Utils";
import {In, Repository, SelectQueryBuilder} from "typeorm";
import AppDataSource from "../data-source";
import ServicerMaster from "../entities/ServicerMaster";
import {maxCredits} from "../utils/consts";

class TrainingController {

    static queryAllTrainingCredits = async (req: ExpReq, res: ExpRes) => {
        const { userRole, email, servicerMasterId } = req.body
        if(userRole !== UserRoleEnum.SERVICER){
            const error = new Error(null, StatusCode.E401, Message.AuthorizationError)
            return res.status(200).send({
                info: '',
                message: error.message
            })
        }

        try{
            const { currentFiscalStartTime, currentFiscalEndTime } = Utils.getCurrentFiscalTimeRange(fiscalEndDate.month, fiscalEndDate.date)

            const approvedTrainingCount: number = await AppDataSource
                .getRepository(Training)
                .createQueryBuilder('training')
                .innerJoinAndSelect('training.user', 'user', 'user.email = :email', { email })
                .where('training.trainingStatus = :trainingStatus', { trainingStatus: TrainingStatusEnum.APPROVED })
                .andWhere(':currentFiscalStartTime < training.startDate < :currentFiscalEndTime', {
                    currentFiscalStartTime,
                    currentFiscalEndTime
                })
                .getCount() as number


            // subquery for stats: remove duplicates
            const distinctTrainingByTrainingName :SelectQueryBuilder<Training> = AppDataSource
                .getRepository(Training)
                .createQueryBuilder('training')
                .innerJoin('training.servicerMaster', 'servicerMaster',
                    'servicerMaster.id = :servicerMasterId', {servicerMasterId})
                .select(['DISTINCT training.trainingName, training.trainingType'])
                .where('training.trainingStatus = :trainingStatus', {trainingStatus: TrainingStatusEnum.APPROVED})
                .andWhere(':currentFiscalStartTime < training.startDate AND training.startDate < :currentFiscalEndTime', {
                    currentFiscalStartTime,
                    currentFiscalEndTime
                })

            const approvedTrainingByServicerCount = await AppDataSource
                .createQueryBuilder()
                .select(['COUNT(*) AS total', 'subtable.trainingType AS trainingType'])
                .from(`(${distinctTrainingByTrainingName.getQuery()})`, 'subtable')
                .setParameters(distinctTrainingByTrainingName.getParameters())
                .groupBy('subtable.trainingType')
                .getRawMany()

            const totalApprovedTrainingCount = approvedTrainingByServicerCount.reduce((acc, cur) => {
                return acc + (+cur.total)
            }, 0)


            const totalScores: number = approvedTrainingByServicerCount.reduce((acc, cur) => {
                return acc + Utils.getScoreByTrainingType(cur.trainingType, cur.total)
            }, 0)

            const scorePercentage = new Intl.NumberFormat('default', {
                style: 'percent',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            }).format(Math.min(totalScores, maxCredits));

            return res.status(200).send({
                approvedTrainingCount,
                totalApprovedTrainingCount,
                scorePercentage
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
     * query all training types
     * @param req
     * @param res
     */
    static queryAllTrainingTypes = async (req: ExpReq, res: ExpRes) => {
        const allTrainingTypes = Object.values(TrainingTypeEnum)
        return res.status(200).send(allTrainingTypes)
    }


    /**
     * get all training data with pagination, sorting, and search
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

            let trainingListQueryBuilder: SelectQueryBuilder<Training> = dataSource
                .createQueryBuilder()


            let subQueryWithFilteredTrainingStatus: SelectQueryBuilder<Training> = dataSource.getRepository(Training)
                    .createQueryBuilder('training')

            if(userRole === UserRoleEnum.APPROVER){
                subQueryWithFilteredTrainingStatus
                    .select()
                    .where('training.trainingStatus <> :value', { value :TrainingStatusEnum.WITHDRAWN })
            }else{
                subQueryWithFilteredTrainingStatus
                    .select()
            }

            if(userRole === UserRoleEnum.SERVICER){
                subQueryWithFilteredTrainingStatus
                    .innerJoinAndSelect('training.user', 'user')
                    .where('user.email = :email', { email })
            }



            if(userRole === UserRoleEnum.ADMIN || userRole === UserRoleEnum.APPROVER){
                subQueryWithFilteredTrainingStatus
                    .innerJoinAndSelect('training.user', 'user')
                    .innerJoinAndSelect('user.servicer', 'sm')
            }


            subQueryWithFilteredTrainingStatus
                .orderBy(`training_${sortByFieldName}`, sortByOrder)


            if(searchKeyword){
                if(userRole === UserRoleEnum.SERVICER){
                    subQueryWithFilteredTrainingStatus = Utils.specifyColumnsToSearch(
                        subQueryWithFilteredTrainingStatus,
                        [
                            'training.trainingName',
                            'training.trainingType',
                            'training.trainingStatus'
                        ],
                        searchKeyword as string)

                }else if(userRole === UserRoleEnum.ADMIN){
                    subQueryWithFilteredTrainingStatus = Utils.specifyColumnsToSearch(
                        subQueryWithFilteredTrainingStatus,
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
                    subQueryWithFilteredTrainingStatus = Utils.specifyColumnsToSearch(
                        subQueryWithFilteredTrainingStatus,
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

                }
            }

            const totalNumber: number = await subQueryWithFilteredTrainingStatus.getCount() as number

            const trainingList = await trainingListQueryBuilder
                .select()
                .from(`(${subQueryWithFilteredTrainingStatus.getQuery()})`, 'subtable')
                .setParameters(subQueryWithFilteredTrainingStatus.getParameters())
                .skip(startIndex)
                .take(+limit)
                .getRawMany()

            // take and skip may look like we are using limit and offset, but they aren't.
            // limit and offset may not work as you expect once you have more complicated queries with joins or subqueries.
            // Using take and skip will prevent those issues.
            // const trainingList = await subQueryWithFilteredTrainingStatus
            //     .offset(startIndex)
            //     .limit(+limit)
            //     .getRawMany()


            let trainingListFiltered = trainingList
            if(userRole === UserRoleEnum.APPROVER){
                trainingListFiltered = trainingList.filter(item => item.training_trainingStatus !== TrainingStatusEnum.WITHDRAWN)
            }

            const totalPage = Math.ceil(totalNumber / +limit)

            return res.status(200).send({
                userRole,
                trainingList: Utils.formattedTrainingList(trainingListFiltered, userRole),
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
                .innerJoinAndSelect('user.servicer', 'servicerMaster')
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

            const { servicer: servicerMaster } = user

            const newTraining: Training = Training.create({
                trainingName,
                trainingType,
                startDate,
                endDate,
                hoursCount,
                trainingURL,
                user,
                servicerMaster
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


        if(!trainingName || !email || !trainingType || !startDate || !endDate || !hoursCount || startDate > endDate){
            const error = new Error(null, StatusCode.E400, Message.ErrParams)
            return res.status(error.statusCode).send({
                info: error.info,
                message: error.message
            })
        }

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
