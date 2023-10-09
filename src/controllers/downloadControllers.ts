import {Request as ExpReq, Response as ExpRes} from 'express'
import Training from "../entities/Training";
import {fiscalEndDate, targetTableToDownload, TrainingStatusEnum, TrainingTypeEnum, UserRoleEnum} from "../enums/enums";
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

class DownloadController {
    /**
     * download all credits ONLY on servicer master base
     * NOTICE!
     * 1 - download Excel
     * 2 - download PDF
     * @param req
     * @param res
     */
    static downloadTargetTable = async (req: ExpReq, res: ExpRes):Promise<any> => {

        const { targetTable } = req.params
        const { searchKeyword, orderBy, order } = req.query
        const { servicerMasterId, email, userRole } = req.body

        if(!req.headers.filetype){
            const error = new Error(null, StatusCode.E400, Message.ErrParams)
            return res.status(error.statusCode).send({
                info: error.info,
                message: error.message
            })
        }

        const fileType: number = +req.headers.filetype

        // query all trainings from db
        try {
            if(targetTable === targetTableToDownload.creditTable){
                if (userRole === UserRoleEnum.SERVICER || userRole === UserRoleEnum.SERVICER_COORDINATOR) {
                    const error = new Error(null, StatusCode.E401, Message.AuthorizationError)
                    return res.status(200).send({
                        info: '',
                        message: error.message
                    })
                }


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
                    .orderBy(sortByFieldName, sortByOrder)

                const trainingTable = await paginationSearchingSortingQuery.getRawMany()
                if(fileType === 1){
                    // ⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇ Download Excel Start ⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇
                    const formattedTrainingTable = trainingTable.reduce((acc: any, cur) => {
                        const {
                            fiscal_year,
                            sm_id,
                            sm_servicerMasterName,
                            live_trng_cnt,
                            live_trng_score,
                            eclass_trng_cnt,
                            eclass_mand_trng_cnt,
                            eclass_trng_score,
                            webinar_trng_cnt,
                            webinar_trng_score,
                            training_credit,
                        } = cur
                        acc.push({
                            'Fiscal Year': fiscal_year,
                            'Servicer ID': sm_id,
                            'Servicer Name': sm_servicerMasterName,
                            'Appd.LiveTraining': live_trng_cnt,
                            'LiveTraining Credits': live_trng_score,
                            'Appd.EClass': eclass_trng_cnt,
                            'Appd.EClass (Mandatory)': eclass_mand_trng_cnt,
                            'EClass Credits': eclass_trng_score,
                            'Appd.Webinar': webinar_trng_cnt,
                            'Webinar Credits': webinar_trng_score,
                            'Training Credits': Utils.convertToPercentage(training_credit),
                        })
                        return acc
                    }, [])
                    const workbook = XLSX.utils.book_new()
                    const worksheet = XLSX.utils.json_to_sheet(formattedTrainingTable)
                    XLSX.utils.book_append_sheet(workbook, worksheet, "credits")
                    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
                    return res.status(StatusCode.E200).send(excelBuffer)
                    // ⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆ Download Excel End ⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆
                }else if(fileType === 2){
                    // // ⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇ Download PDF Start ⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇
                    // const myDoc: PDFKit.PDFDocument = new PDFDocument({bufferPages: true});
                    // const buffers:any = []
                    //
                    // myDoc.on('data', buffers.push.bind(buffers))
                    // myDoc.on('end', () => {
                    //     const pdfData = Buffer.concat(buffers);
                    //     res
                    //         .writeHead(200, {
                    //             'Content-Length': Buffer.byteLength(pdfData),
                    //             'Content-Type': 'application/pdf',
                    //             'Content-disposition': 'attachment;filename=test.pdf',
                    //         })
                    //         .end(pdfData)
                    // })
                    //
                    // Utils.generatePDFHeader(myDoc)
                    // Utils.generatePDFTable(myDoc, formattedTrainingTable)
                    // Utils.generatePDFFooter(myDoc)
                    // myDoc.end()
                    // return
                    // // ⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆ Download PDF End ⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆
                }else{
                    const error = new Error(null, StatusCode.E400, Message.ErrParams)
                    return res.status(error.statusCode).send({
                        info: error.info,
                        message: error.message
                    })
                }


            }

            // download for Training table
            if(targetTable === targetTableToDownload.trainingTable){

                const { sortByFieldName, sortByOrder } = Utils.getSortingMethod(orderBy as string, order as OrderByType, 'trainingTable')


                let subQueryWithFilteredTrainingStatus: SelectQueryBuilder<Training> = dataSource.getRepository(Training)
                    .createQueryBuilder('training')



                subQueryWithFilteredTrainingStatus
                    .innerJoinAndSelect('training.trainee', 'user')
                    .innerJoinAndSelect('user.servicer', 'sm')

                if(userRole === UserRoleEnum.SERVICER){
                    subQueryWithFilteredTrainingStatus
                        .where('user.email = :email', { email })
                }



                if(userRole === UserRoleEnum.SERVICER_COORDINATOR){
                    subQueryWithFilteredTrainingStatus
                        .where('sm.id = :servicerMasterId', { servicerMasterId })
                }


                subQueryWithFilteredTrainingStatus
                    .orderBy(sortByFieldName, sortByOrder)


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

                if(userRole === UserRoleEnum.APPROVER){
                    subQueryWithFilteredTrainingStatus
                        .select()
                        .where('training.trainingStatus <> :value', { value :TrainingStatusEnum.CANCELED })
                }else{
                    subQueryWithFilteredTrainingStatus
                        .select()
                }

                const trainingTable = await subQueryWithFilteredTrainingStatus.getRawMany()
                if(fileType === 1){
                    // ⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇ Download Excel Start ⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇
                    const formattedTrainingTable = trainingTable.reduce((acc: any, cur) => {
                        const {
                            training_trainingName: trainingName,
                            training_trainingType: trainingType,
                            user_email: traineeEmail,
                            user_firstName: traineeFirstName,
                            user_lastName: traineeLastName,
                            training_startDate: startDate,
                            training_endDate: endDate,
                            training_createdAt: submittedAt,
                            training_hoursCount: hours,
                            training_trainingStatus: trainingStatus,
                            sm_id: servicerId,
                            sm_servicerMasterName: servicerName
                        } = cur
                        acc.push({
                            'Servicer ID': servicerId,
                            'Servicer Name': servicerName,
                            'Training Name': trainingName,
                            'Training Type': trainingType,
                            'Trainee Email': traineeEmail,
                            'Trainee Name': `${traineeFirstName} ${traineeLastName}`,
                            'Start Date': startDate,
                            'End Date': endDate,
                            'Submitted At': submittedAt,
                            'Hours': hours,
                            'Training Status': trainingStatus
                        })
                        return acc
                    }, [])
                    const workbook = XLSX.utils.book_new()
                    const worksheet = XLSX.utils.json_to_sheet(formattedTrainingTable)
                    XLSX.utils.book_append_sheet(workbook, worksheet, "trainings")
                    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
                    return res.status(StatusCode.E200).send(excelBuffer)
                    // ⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆ Download Excel End ⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆
                }else if(fileType === 2){
                    // // ⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇ Download PDF Start ⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇
                    // const myDoc: PDFKit.PDFDocument = new PDFDocument({bufferPages: true});
                    // const buffers:any = []
                    //
                    // myDoc.on('data', buffers.push.bind(buffers))
                    // myDoc.on('end', () => {
                    //     const pdfData = Buffer.concat(buffers);
                    //     res
                    //         .writeHead(200, {
                    //             'Content-Length': Buffer.byteLength(pdfData),
                    //             'Content-Type': 'application/pdf',
                    //             'Content-disposition': 'attachment;filename=test.pdf',
                    //         })
                    //         .end(pdfData)
                    // })
                    //
                    // Utils.generatePDFHeader(myDoc)
                    // Utils.generatePDFTable(myDoc, formattedTrainingTable)
                    // Utils.generatePDFFooter(myDoc)
                    // myDoc.end()
                    // return
                    // // ⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆ Download PDF End ⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆
                }else{
                    const error = new Error(null, StatusCode.E400, Message.ErrParams)
                    return res.status(error.statusCode).send({
                        info: error.info,
                        message: error.message
                    })
                }


            }


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

export default DownloadController
