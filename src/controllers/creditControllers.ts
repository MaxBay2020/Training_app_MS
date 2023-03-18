import {Request as ExpReq, Response as ExpRes} from 'express'
import Training from "../entities/Training";
import {fiscalEndDate, TrainingStatusEnum, TrainingTypeEnum, UserRoleEnum} from "../enums/enums";
import dataSource from "../data-source";
import AppDataSource from "../data-source";
import Error, {Message, StatusCode} from "../enums/Error";
import Utils from "../utils/Utils";
import {SelectQueryBuilder} from "typeorm";
import {maxCredits} from "../utils/consts";
import _ from "lodash";

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
     * get all training data
     * @param req
     * @param res
     */
    static queryAllCredits = async (req: ExpReq, res: ExpRes) => {

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
            const userRole= req.body.userRole

            if(userRole === UserRoleEnum.SERVICER){
                const error = new Error(null, StatusCode.E401, Message.AuthorizationError)
                return res.status(200).send({
                    info: '',
                    message: error.message
                })
            }

            // query all trainings grouped by training type and distinct with training name & training type
            const trainingListQueryBuilder: SelectQueryBuilder<Training> = dataSource
                .getRepository(Training)
                .createQueryBuilder('training')
                .innerJoinAndSelect('training.servicerMaster', 'sm')
                .select([
                    'sm.id AS smId',
                    'sm.servicerMasterName AS smName',
                    'training.trainingType AS trainingType'
                ])
                .addSelect('COUNT(DISTINCT training.trainingName, training.trainingType)', 'trainingCount')
                .where('training.trainingStatus = :value', { value: TrainingStatusEnum.APPROVED })
                .groupBy('sm.id')
                .addGroupBy('sm.servicerMasterName')
                .addGroupBy('training.trainingType')

            const trainingList = await trainingListQueryBuilder.getRawMany()

            const trainingListGroupBySmId = _.groupBy(trainingList, 'smId')

            const trainingListStatsBySmId = _.map(_.keys(trainingListGroupBySmId), ele => {
                return _.reduce(trainingListGroupBySmId[ele], (acc, cur) => {
                    // if(cur.trainingType === TrainingTypeEnum.ECLASS){
                    //     return acc.approvedEClass += +cur.trainingCount, acc
                    // }else if(cur.trainingType === TrainingTypeEnum.Webinar){
                    //     return acc.approvedWebinar += +cur.trainingCount, acc
                    // }else if(cur.trainingType === TrainingTypeEnum.LiveTraining){
                    //     return acc.approvedLiveTraining += +cur.trainingCount, acc
                    // }
                    const trainingType: TrainingTypeEnum = cur.trainingType
                    return acc[trainingType] += +cur.trainingCount, acc
                }, { smId: ele, smName: trainingListGroupBySmId[ele][0].smName, ECLASS: 0, LiveTraining: 0, Webinar: 0})
            })


            const trainingListStatsBySmIdWithCredits = trainingListStatsBySmId.map( ele => {
                const credits =
                    Utils.getScoreByTrainingType(TrainingTypeEnum.ECLASS, ele[TrainingTypeEnum.ECLASS].toString()) +
                    Utils.getScoreByTrainingType(TrainingTypeEnum.LiveTraining, ele[TrainingTypeEnum.LiveTraining].toString()) +
                    Utils.getScoreByTrainingType(TrainingTypeEnum.Webinar, ele[TrainingTypeEnum.Webinar].toString())

                const creditsPercentage = new Intl.NumberFormat('default', {
                    style: 'percent',
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                }).format(Math.min(credits, maxCredits));

                return {
                    ...ele,
                    credits: creditsPercentage,
                }
            })


            const userStats = await Promise.all(trainingListStatsBySmIdWithCredits.map(async ele => {
                const { smId } = ele
                const userListQueryBuilder = dataSource
                    .getRepository(Training)
                    .createQueryBuilder('training')
                    .innerJoinAndSelect('training.servicerMaster', 'sm')
                    .innerJoinAndSelect('training.user', 'user')
                    .select([
                        'sm.id AS smId',
                        'training.trainingType AS trainingType',
                        'user.email AS userEmail',
                        `CONCAT_WS(' ', user.firstName, user.lastName) AS userName`
                    ])
                    .addSelect('COUNT(DISTINCT training.trainingName, training.trainingType)', 'trainingCount')
                    .where('sm.id = :smId', { smId })
                    .andWhere('training.trainingStatus = :trainingStatus', { trainingStatus: TrainingStatusEnum.APPROVED })
                    .groupBy('training.trainingType')
                    .addGroupBy('user.email')

                return userListQueryBuilder.getRawMany()
            }))

            const userStatsGroupByUserEmail = _.groupBy(userStats.flat(), 'userEmail')

            const userListMerge = _.map(_.keys(userStatsGroupByUserEmail), ele => {
                return _.reduce(userStatsGroupByUserEmail[ele], (acc, cur) => {
                    console.log(cur)
                    const trainingType: TrainingTypeEnum = cur.trainingType
                    return acc[trainingType] += +cur.trainingCount, acc
                }, { smId: userStatsGroupByUserEmail[ele][0].smId, userName: userStatsGroupByUserEmail[ele][0].userName, userEmail: ele, ECLASS: 0, LiveTraining: 0, Webinar: 0})
            })

            const userListMergeGroupBySmId = _.groupBy(userListMerge, 'smId')

            const creditsStats = trainingListStatsBySmIdWithCredits.map( ele => {
                return {
                    ...ele,
                    users: [...userListMergeGroupBySmId[ele.smId]]
                }
            })


            return res.status(200).send({
                userRole,
                creditsStats,
                totalPage: 5
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

}

export default TrainingController
