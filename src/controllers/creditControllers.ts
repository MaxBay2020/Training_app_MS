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
import ServicerMaster from "../entities/ServicerMaster";
import PDFDocument from 'pdfkit'

class TrainingController {
    /**
     * get all credits data with pagination, sorting, and search
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


            let servicerMasterQueryBuilder: SelectQueryBuilder<ServicerMaster> = dataSource
                .getRepository(ServicerMaster)
                .createQueryBuilder('sm')
                .select([
                    'sm.id',
                    'sm.servicerMasterName'
                ])



            if(searchKeyword){
                servicerMasterQueryBuilder = Utils.specifyColumnsToSearch(
                    servicerMasterQueryBuilder,
                    [
                        'sm.id',
                        'sm.servicerMasterName'
                    ],
                    searchKeyword as string)
            }

            const paginationQueryBuilder: SelectQueryBuilder<ServicerMaster> = servicerMasterQueryBuilder
                .skip(startIndex)
                .take(+limit)

            const [totalNumber, smList] = await Promise.all([
                servicerMasterQueryBuilder.getCount(),
                paginationQueryBuilder.getMany()
            ])


            // get the list of sm ids
            const smIdList = smList.map( sm => sm.id)


            if(smIdList.length === 0){
                return res.status(200).send({
                    userRole,
                    creditsStats: [],
                    totalPage: 0
                })
            }

            // query all trainings grouped by training type and distinct with training name & training type
            const trainingListQueryBuilder: SelectQueryBuilder<Training> = dataSource
                .getRepository(Training)
                .createQueryBuilder('training')
                .innerJoinAndSelect('training.servicerMaster', 'sm')
                .select([
                    'sm.id AS smId',
                    'sm.servicerMasterName AS sm_servicerMasterName',
                    'training.trainingType AS trainingType'
                ])
                .addSelect('COUNT(DISTINCT training.trainingName, training.trainingType)', 'trainingCount')
                .where('training.trainingStatus = :value', { value: TrainingStatusEnum.APPROVED })
                .andWhere('sm.id IN(:smIdList)', { smIdList })
                .groupBy('sm.id')
                .addGroupBy('sm.servicerMasterName')
                .addGroupBy('training.trainingType')

            trainingListQueryBuilder
                .orderBy(`sm_${sortByFieldName}`, sortByOrder)

            const trainingList = await trainingListQueryBuilder.getRawMany()


            const trainingListGroupBySmId = _.groupBy(trainingList, 'smId')

            const trainingListStatsBySmId = _.map(_.keys(trainingListGroupBySmId), ele => {
                return _.reduce(trainingListGroupBySmId[ele], (acc, cur) => {
                    const trainingType: TrainingTypeEnum = cur.trainingType
                    return acc[trainingType] += +cur.trainingCount, acc
                }, { smId: ele, smName: trainingListGroupBySmId[ele][0].sm_servicerMasterName, ECLASS: 0, LiveTraining: 0, Webinar: 0})
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

            const totalPage = Math.ceil(totalNumber / +limit)

            return res.status(200).send({
                userRole,
                creditsStats,
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
     * download all credits ONLY on servicer master base
     * @param req
     * @param res
     */
    static downloadAllCredits = async (req: ExpReq, res: ExpRes) => {

        const { sortBy=3 } = req.query

        if(!sortBy){
            const error = new Error(null, StatusCode.E400, Message.ErrParams)
            return res.status(error.statusCode).send({
                info: error.info,
                message: error.message
            })
        }

        const { sortByFieldName, sortByOrder } = Utils.getSortingMethod(+sortBy)

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
                    'sm.servicerMasterName AS sm_servicerMasterName',
                    'training.trainingType AS trainingType'
                ])
                .addSelect('COUNT(DISTINCT training.trainingName, training.trainingType)', 'trainingCount')
                .where('training.trainingStatus = :value', { value: TrainingStatusEnum.APPROVED })
                .groupBy('sm.id')
                .addGroupBy('sm.servicerMasterName')
                .addGroupBy('training.trainingType')

            trainingListQueryBuilder
                .orderBy(`sm_${sortByFieldName}`, sortByOrder)

            const trainingList = await trainingListQueryBuilder.getRawMany()


            const trainingListGroupBySmId = _.groupBy(trainingList, 'smId')

            const trainingListStatsBySmId = _.map(_.keys(trainingListGroupBySmId), ele => {
                return _.reduce(trainingListGroupBySmId[ele], (acc, cur) => {
                    const trainingType: TrainingTypeEnum = cur.trainingType
                    return acc[trainingType] += +cur.trainingCount, acc
                }, { smId: ele, smName: trainingListGroupBySmId[ele][0].sm_servicerMasterName, ECLASS: 0, LiveTraining: 0, Webinar: 0})
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


            const myDoc: PDFKit.PDFDocument = new PDFDocument({bufferPages: true});
            const buffers:any = []

            myDoc.on('data', buffers.push.bind(buffers))
            myDoc.on('end', () => {
                const pdfData = Buffer.concat(buffers);
                res.writeHead(200, {
                    'Content-Length': Buffer.byteLength(pdfData),
                    'Content-Type': 'application/pdf',
                    'Content-disposition': 'attachment;filename=test.pdf',})
                    .end(pdfData)
            })

            Utils.generatePDFHeader(myDoc)
            Utils.generatePDFTable(myDoc, trainingListStatsBySmIdWithCredits)
            Utils.generatePDFFooter(myDoc)
            myDoc.end();
            return

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
