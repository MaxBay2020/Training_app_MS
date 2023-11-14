import {Request as ExpReq, Response as ExpRes} from 'express'
import Training from "../entities/Training";
import {fiscalEndDate, TrainingStatusEnum, TrainingTypeEnum, UserRoleEnum} from "../enums/enums";
import dataSource from "../data-source";
import AppDataSource from "../data-source";
import Error, {Message, StatusCode} from "../enums/Error";
import Utils from "../utils/Utils";
import {SelectQueryBuilder} from "typeorm";
import {maxCredits, OrderByType} from "../utils/consts";
import _ from "lodash";
import Servicer from "../entities/ServicerMaster";
import PDFDocument from 'pdfkit'
import * as XLSX from 'xlsx'
import ServicerMaster from "../entities/ServicerMaster";

class TrainingController {
    /**
     * get all credits data with pagination, sorting, and search
     * @param req
     * @param res
     */
    static queryAllCredits = async (req: ExpReq, res: ExpRes) => {

        const {searchKeyword, orderBy, order, page, limit} = req.query

        const userRole = req.body.userRole

        if (userRole === UserRoleEnum.SERVICER || userRole === UserRoleEnum.SERVICER_COORDINATOR) {
            const error = new Error(null, StatusCode.E401, Message.AuthorizationError)
            return res.status(error.statusCode).send({
                info: '',
                message: error.message
            })
        }


        if (!page || !limit || !orderBy || !order) {
            const error = new Error(null, StatusCode.E400, Message.ErrParams)
            return res.status(error.statusCode).send({
                info: error.info,
                message: error.message
            })
        }

        try {
            const innerQuery: SelectQueryBuilder<Training> = AppDataSource
                .getRepository(Training)
                .createQueryBuilder('training')
                .select([
                    `(CASE WHEN MONTH(training.endDate) > 9 THEN YEAR(training.endDate) + 1 ELSE YEAR(training.endDate) END) AS fiscal_year`,
                    `sm.id AS sm_id`,
                    `sm.servicerMasterName AS sm_name`,
                    `training.trainingType AS trainingType`,
                    `(CASE WHEN training.trainingType = :live THEN 1 WHEN training.trainingType = :eclass THEN 2 WHEN training.trainingType = :webinar THEN 3 ELSE 0 END) AS trng_typ_id`,
                    `SUM(training.hoursCount) AS total_trng_credit_hrs`,
                    `COUNT(0) AS number_of_trng`,
                    `(CASE WHEN (training.trainingType = :live AND SUM(training.hoursCount) > 0) THEN 0.50 WHEN (training.trainingType = :eclass AND SUM(training.hoursCount) > 0) THEN 0.50 WHEN (training.trainingType = :webinar AND SUM(training.hoursCount) > 0) THEN 0.20 END) AS trng_score`,
                    `(CASE WHEN training.trainingName = 'Module #1 Servicing of FHA-Insured Mortgages and Default Servicing Requirements' THEN 1 ELSE 0 END) AS eclass_mandatroy_trng`,
                ])
                .innerJoin('training.servicerMaster', 'sm')
                .where(`Training.trainingStatus = :trainingStatus`, {trainingStatus: TrainingStatusEnum.APPROVED})
                .setParameter('live', TrainingTypeEnum.LiveTraining)
                .setParameter('eclass', TrainingTypeEnum.ECLASS)
                .setParameter('webinar', TrainingTypeEnum.Webinar)
                .groupBy('fiscal_year')
                .addGroupBy('sm_id')
                .addGroupBy('sm_name')
                .addGroupBy('trainingType')
                .addGroupBy('training.trainingName')
                .orderBy('fiscal_year')
                .addOrderBy('sm_id')

            const outerQuery = AppDataSource
                .createQueryBuilder()
                .select([
                    `summary.fiscal_year AS fiscal_year`,
                    `summary.sm_id AS sm_id`,
                    `summary.sm_name AS sm_servicerMasterName`,
                    `SUM(CASE WHEN (summary.trng_typ_id = 1 AND summary.number_of_trng > 0) THEN summary.number_of_trng ELSE 0 END) AS live_trng_cnt`,
                    `SUM(CASE WHEN (summary.trng_typ_id = 1 AND summary.trng_score > 0) THEN (summary.trng_score * summary.number_of_trng) ELSE 0 END) AS live_trng_score`,
                    `SUM(CASE WHEN (summary.trng_typ_id = 2 AND summary.number_of_trng > 0) THEN summary.number_of_trng ELSE 0 END) AS eclass_trng_cnt`,
                    `SUM(CASE WHEN (summary.trng_typ_id = 2 AND summary.eclass_mandatroy_trng > 0) THEN summary.eclass_mandatroy_trng ELSE 0 END) AS eclass_mand_trng_cnt`,
                    `(CASE WHEN SUM(CASE WHEN (summary.trng_typ_id = 2 AND summary.eclass_mandatroy_trng > 0) THEN summary.eclass_mandatroy_trng ELSE 0 END) > 0 THEN 0.5 ELSE 0 END) AS eclass_trng_score`,
                    `SUM(CASE WHEN (summary.trng_typ_id = 3 AND summary.number_of_trng > 0) THEN summary.number_of_trng ELSE 0 END) AS webinar_trng_cnt`,
                    `SUM(CASE WHEN (summary.trng_typ_id = 3 AND summary.trng_score > 0) THEN (summary.trng_score * summary.number_of_trng) ELSE 0 END) AS webinar_trng_score`,
                    '((case when (((sum((case when ((`summary`.`trng_typ_id` = 1) and (`summary`.`trng_score` > 0)) then (`summary`.`trng_score` * `summary`.`number_of_trng`) else 0 end)) + (case when (sum((case when ((`summary`.`trng_typ_id` = 2) and (`summary`.`eclass_mandatroy_trng` > 0)) then `summary`.`eclass_mandatroy_trng` else 0 end)) > 0) then 0.5 else 0 end)) + sum((case when ((`summary`.`trng_typ_id` = 3) and (`summary`.`trng_score` > 0)) then (`summary`.`trng_score` * `summary`.`number_of_trng`) else 0 end))) > 1) then 1 else ((sum((case when ((`summary`.`trng_typ_id` = 1) and (`summary`.`trng_score` > 0)) then (`summary`.`trng_score` * `summary`.`number_of_trng`) else 0 end)) + (case when (sum((case when ((`summary`.`trng_typ_id` = 2) and (`summary`.`eclass_mandatroy_trng` > 0)) then `summary`.`eclass_mandatroy_trng` else 0 end)) > 0) then 0.5 else 0 end)) + sum((case when ((`summary`.`trng_typ_id` = 3) and (`summary`.`trng_score` > 0)) then (`summary`.`trng_score` * `summary`.`number_of_trng`) else 0 end))) end) / 100) AS `training_credit`'
                ])
                .from(`(${innerQuery.getQuery()})`, 'summary')
                .setParameters(innerQuery.getParameters())
                .groupBy('summary.fiscal_year')
                .addGroupBy('summary.sm_id')
                .addGroupBy('summary.sm_name')
                .orderBy('summary.fiscal_year')
                .addOrderBy('summary.sm_id')
                .addOrderBy('summary.sm_name')


            const {
                sortByFieldName,
                sortByOrder
            } = Utils.getSortingMethod(orderBy as string, order as OrderByType, 'creditTable')

            const startIndex = (+page - 1) * (+limit)


            let paginationSearchingSortingQuery = dataSource
                .createQueryBuilder()
                .select([
                    `outerQuery.fiscal_year`,
                    `outerQuery.sm_id`,
                    `outerQuery.sm_servicerMasterName`,
                    `outerQuery.live_trng_cnt`,
                    `outerQuery.live_trng_score`,
                    `outerQuery.eclass_trng_cnt`,
                    `outerQuery.eclass_mand_trng_cnt`,
                    `outerQuery.eclass_trng_score`,
                    `outerQuery.webinar_trng_cnt`,
                    `outerQuery.webinar_trng_score`,
                    `outerQuery.training_credit`,
                ])
                .from(`(${outerQuery.getQuery()})`, 'outerQuery')
                .setParameters(outerQuery.getParameters())


            if (searchKeyword) {
                paginationSearchingSortingQuery = Utils.specifyColumnsToSearch(
                    paginationSearchingSortingQuery,
                    [
                        'fiscal_year',
                        'sm_id',
                        'sm_servicerMasterName',
                        'live_trng_cnt',
                        'live_trng_score',
                        'eclass_trng_cnt',
                        'eclass_mand_trng_cnt',
                        'eclass_trng_score',
                        'webinar_trng_cnt',
                        'webinar_trng_score',
                        'training_credit',
                    ],
                    searchKeyword as string)
            }


            paginationSearchingSortingQuery
                .skip(startIndex)
                .take(+limit)


            paginationSearchingSortingQuery
                .orderBy(sortByFieldName, sortByOrder)

            const [totalNumber, creditsStats] = await Promise.all([
                dataSource
                    .createQueryBuilder()
                    .select(['COUNT(*) AS count'])
                    .from(`(${outerQuery.getQuery()})`, 'outerQuery')
                    .setParameters(outerQuery.getParameters())
                    .getRawOne(),
                paginationSearchingSortingQuery.getRawMany()
            ])


            const totalPage = Math.ceil(totalNumber.count / +limit)

            return res.status(200).send({
                userRole,
                creditsStats,
                totalPage
            })


        } catch (e) {
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
