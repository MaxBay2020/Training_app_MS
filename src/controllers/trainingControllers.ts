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
import EClass from "../entities/EClass";
import {Trainee} from "../utils/dataType";


class TrainingController {

    static queryAllTrainingCredits = async (req: ExpReq, res: ExpRes) => {
        const { userRoles, email, servicerMasterId } = req.body
        if(!userRoles.includes(UserRoleEnum.SERVICER)){
            const error = new Error(null, StatusCode.E401, Message.AuthorizationError)
            return res.status(StatusCode.E200).send({
                info: '',
                message: error.message
            })
        }

        try{
            const { currentFiscalStartTime, currentFiscalEndTime } = Utils.getCurrentFiscalTimeRange(fiscalEndDate.month, fiscalEndDate.date)

            const approvedTrainingCount: number = await AppDataSource
                .getRepository(Training)
                .createQueryBuilder('training')
                .innerJoinAndSelect('training.trainee', 'user', 'user.email = :email', { email })
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

            return res.status(StatusCode.E200).send({
                approvedTrainingCount,
                totalApprovedTrainingCount,
                // scorePercentage
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
        const allTrainingTypes = Object.values(TrainingTypeEnum).filter(trainingType => trainingType !== TrainingTypeEnum.ECLASS)
        return res.status(StatusCode.E200).send(allTrainingTypes)
    }


    /**
     * get all training data with pagination, sorting, and search
     * @param req
     * @param res
     */
    static queryAllTrainings = async (req: ExpReq, res: ExpRes) => {

        const { searchKeyword, sortBy, page, limit } = req.query

        const { servicerMasterId } = req.body

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
            const userRoles = req.body.userRoles

            let trainingListQueryBuilder: SelectQueryBuilder<Training> = dataSource
                .createQueryBuilder()


            let subQueryWithFilteredTrainingStatus: SelectQueryBuilder<Training> = dataSource.getRepository(Training)
                    .createQueryBuilder('training')

            if(userRoles.includes(UserRoleEnum.APPROVER)){
                subQueryWithFilteredTrainingStatus
                    .select()
                    .where('training.trainingStatus <> :value', { value :TrainingStatusEnum.CANCELED })
            }else{
                subQueryWithFilteredTrainingStatus
                    .select()
            }

            subQueryWithFilteredTrainingStatus
                .innerJoinAndSelect('training.trainee', 'user')

            if(userRole === UserRoleEnum.SERVICER){
                subQueryWithFilteredTrainingStatus
                    .where('user.email = :email', { email })
            }

            if(userRole === UserRoleEnum.SERVICER_COORDINATOR){
                subQueryWithFilteredTrainingStatus
                    .innerJoinAndSelect('user.servicer', 'sm')
                    .where('sm.id = :servicerMasterId', { servicerMasterId })
            }

            if(userRoles.includes(UserRoleEnum.ADMIN) || userRoles.includes(UserRoleEnum.APPROVER)){
                subQueryWithFilteredTrainingStatus
                    .innerJoinAndSelect('user.servicer', 'sm')
            }


            subQueryWithFilteredTrainingStatus
                .orderBy(`training_${sortByFieldName}`, sortByOrder)


            if(searchKeyword){
                if(userRoles.includes(UserRoleEnum.SERVICER)){
                    subQueryWithFilteredTrainingStatus = Utils.specifyColumnsToSearch(
                        subQueryWithFilteredTrainingStatus,
                        [
                            'training.trainingName',
                            'training.trainingType',
                            'training.trainingStatus'
                        ],
                        searchKeyword as string)

                }else if(userRole === UserRoleEnum.SERVICER_COORDINATOR){
                    subQueryWithFilteredTrainingStatus = Utils.specifyColumnsToSearch(
                        subQueryWithFilteredTrainingStatus,
                        [
                            'training.trainingName',
                            'training.trainingType',
                            'training.trainingStatus',
                            'user.firstName',
                            'user.lastName',
                            'user.email',
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
                }else if(userRoles.includes(UserRoleEnum.APPROVER)){
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
            if(userRoles.includes(UserRoleEnum.APPROVER)){
                trainingListFiltered = trainingList.filter(item => item.training_trainingStatus !== TrainingStatusEnum.CANCELED)
            }

            const totalPage = Math.ceil(totalNumber / +limit)

            return res.status(StatusCode.E200).send({
                userRoles,
                trainingList: Utils.formattedTrainingList(trainingListFiltered, userRoles),
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

            return res.status(StatusCode.E200).send(training)
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
            userRole,
            trainingType,
            startDate,
            endDate,
            hoursCount,
            trainingURL,
            traineeList
        } = req.body

        if(!trainingName || !email || !trainingType || !startDate || !endDate || !hoursCount || startDate > endDate || endDate > new Date()){
            const error = new Error(null, StatusCode.E400, Message.ErrParams)
            return res.status(error.statusCode).send({
                info: error.info,
                message: error.message
            })
        }


        try{
            const user: User =  await dataSource.getRepository(User)
                .createQueryBuilder('user')
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


            if(userRole !== UserRoleEnum.SERVICER && userRole !== UserRoleEnum.SERVICER_COORDINATOR){
                const error = new Error(null, StatusCode.E401, Message.AuthorizationError)
                return res.status(error.statusCode).send({
                    info: '',
                    message: error.message
                })
            }

            const { servicer: servicerMaster } = user

            const trainingStatus =
                trainingType === TrainingTypeEnum.LiveTraining || trainingType === TrainingTypeEnum.ECLASS ?
                    TrainingStatusEnum.APPROVED : TrainingStatusEnum.SUBMITTED

            if(userRole === UserRoleEnum.SERVICER){
                const newTraining: Training = Training.create({
                    trainingName,
                    trainingType,
                    startDate,
                    endDate,
                    hoursCount,
                    trainingURL,
                    user,
                    trainingStatus,
                    servicerMaster,
                    updatedBy: user,
                    trainee: user
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
            }

            if(userRole === UserRoleEnum.SERVICER_COORDINATOR){
                let userList: User[] = await Promise.all(traineeList.map((item: Trainee) => {
                    const { traineeEmail } = item

                    return dataSource
                        .getRepository(User)
                        .createQueryBuilder('user')
                        .innerJoinAndSelect('user.servicer', 'sm')
                        .where('user.email = :traineeEmail', { traineeEmail })
                        .andWhere('sm.id = :servicerId', { servicerId: user.servicer.id })
                        .getOne()
                }))

                userList = userList.filter((user: User) => user)

                if(userList.length !== traineeList.length){
                    // if there are some users NOT exist in db
                    const userEmailList = userList.map((trainee: User) => trainee.email)
                    const traineeListToBeSaved = traineeList.filter((trainee: Trainee) => !userEmailList.includes(trainee.traineeEmail))
                    const userToBeRegistered: User[] = []
                    const validateErrors = await Promise.all(traineeListToBeSaved.map((traineeToBeSaved: Trainee) => {
                        const { traineeEmail, traineeFirstName, traineeLastName } = traineeToBeSaved
                        const traineeUser: User = User.create({
                            email: traineeEmail,
                            firstName: traineeFirstName,
                            lastName: traineeLastName,
                            servicer: user.servicer
                        })
                        userToBeRegistered.push(traineeUser)
                        return validate(traineeUser)
                    }))

                    if(validateErrors.flat().length > 0){
                        console.log(validateErrors)
                        const error = new Error(null, StatusCode.E400, Message.ErrParams)
                        return res.status(error.statusCode).send({
                            info: '',
                            message: error.message
                        })
                    }
                    userList.push(...userToBeRegistered)

                    // save users in db
                    await dataSource
                        .createQueryBuilder()
                        .insert()
                        .into(User)
                        .values(userToBeRegistered)
                        .execute()
                }

                // TODO: save trainings for these trainees
                await Promise.all(userList.map(async (trainee: User) => {
                    const newTraining: Training = Training.create({
                        trainingName,
                        trainingType,
                        startDate,
                        endDate,
                        hoursCount,
                        trainingURL,
                        user,
                        trainingStatus,
                        servicerMaster,
                        updatedBy: user,
                        trainee
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

                    return newTraining.save()
                }))
            }


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
        const { email, trainingName, trainingType, startDate, endDate, hoursCount, trainingURL, userRoles } = req.body
        const { trainingId } = req.params


        if(!trainingName || !email || !trainingType || !startDate || !endDate || !hoursCount || startDate > endDate){
            const error = new Error(null, StatusCode.E400, Message.ErrParams)
            return res.status(error.statusCode).send({
                info: error.info,
                message: error.message
            })
        }

        if(userRoles.includes(UserRoleEnum.ADMIN)){
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
            const [training, updatedBy] = await Promise.all([
                dataSource.getRepository(Training)
                    .createQueryBuilder('training')
                    .innerJoinAndSelect('training.trainee', 'user')
                    .where('training.id = :trainingId', { trainingId })
                    // .andWhere('user.email = :email', { email })
                    .getRawOne(),
                dataSource.getRepository(User).findOneBy( { email } )
            ])


            if(!training){
                const error = new Error(null, StatusCode.E404, Message.ErrFind)
                return res.status(error.statusCode).send({
                    info: '',
                    message: error.message
                })
            }

            if(training.training_trainingStatus !== TrainingStatusEnum.SUBMITTED){
                const error = new Error(null, StatusCode.E405, Message.RefreshPage)
                return res.status(error.statusCode).send({
                    info: '',
                    message: error.message
                })
            }

            await dataSource
                .createQueryBuilder()
                .update(Training)
                .set({trainingName, trainingType, startDate, endDate, hoursCount, trainingURL, updatedBy})
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
     * cancel training by trainingId
     * @param req
     * @param res
     */
    static deleteTrainingById = async (req: ExpReq, res: ExpRes) => {
        const { email, userRoles } = req.body
        const { trainingId } = req.params


        if(userRoles.includes(UserRoleEnum.ADMIN) || userRoles.includes(UserRoleEnum.APPROVER)){
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
            const [training, updatedBy] = await Promise.all([
                dataSource.getRepository(Training)
                    .createQueryBuilder('training')
                    .innerJoinAndSelect('training.trainee', 'user')
                    .where('training.id = :trainingId', { trainingId })
                    // .andWhere('user.email = :email', { email })
                    .getRawOne(),
                dataSource.getRepository(User).findOneBy( { email } )
            ])


            if(!training){
                const error = new Error(null, StatusCode.E404, Message.ErrFind)
                return res.status(error.statusCode).send({
                    info: '',
                    message: error.message
                })
            }

            if(training.training_trainingStatus !== TrainingStatusEnum.SUBMITTED){
                const error = new Error(null, StatusCode.E405, Message.RefreshPage)
                return res.status(error.statusCode).send({
                    info: '',
                    message: error.message
                })
            }

            await dataSource
                .createQueryBuilder()
                .update(Training)
                .set({trainingStatus: TrainingStatusEnum.CANCELED, updatedBy})
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
        const { trainingIds, approveOrReject, userRoles, email } = req.body
        if(!userRoles.includes(UserRoleEnum.APPROVER)){
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

    /**
     * query all data from eClass table
     * @param req
     * @param res
     */
    static queryAllEClassName = async (req: ExpReq, res: ExpRes) => {
        try{
            const eClassNameList = await dataSource
                .getRepository(EClass)
                .createQueryBuilder('eClass')
                .select(['eClass.eClassName'])
                .getMany()

            return res.status(StatusCode.E200).send({
                eClassNameList: eClassNameList.map(eClassName => eClassName.eClassName)
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
