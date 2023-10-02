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
        const { servicerMasterId } = req.body

        if(!req.headers.filetype){
            const error = new Error(null, StatusCode.E400, Message.ErrParams)
            return res.status(error.statusCode).send({
                info: error.info,
                message: error.message
            })
        }

        const fileType: number = +req.headers.filetype

        const { sortByFieldName, sortByOrder } = Utils.getSortingMethod(orderBy as string, order as OrderByType)

        // query all trainings from db
        try {
            // const userRole= req.body.userRole
            //
            // if(userRole === UserRoleEnum.SERVICER){
            //     const error = new Error(null, StatusCode.E401, Message.AuthorizationError)
            //     return res.status(200).send({
            //         info: '',
            //         message: error.message
            //     })
            // }
            //
            // // query all trainings grouped by training type and distinct with training name & training type
            // const trainingListQueryBuilder: SelectQueryBuilder<Training> = dataSource
            //     .getRepository(Training)
            //     .createQueryBuilder('training')
            //     .innerJoinAndSelect('training.servicerMaster', 'sm')
            //     .select([
            //         'sm.id AS smId',
            //         'sm.servicerMasterName AS sm_servicerMasterName',
            //         'training.trainingType AS trainingType'
            //     ])
            //     .addSelect('COUNT(DISTINCT training.trainingName, training.trainingType)', 'trainingCount')
            //     .where('training.trainingStatus = :value', { value: TrainingStatusEnum.APPROVED })
            //     .groupBy('sm.id')
            //     .addGroupBy('sm.servicerMasterName')
            //     .addGroupBy('training.trainingType')
            //
            // trainingListQueryBuilder
            //     .orderBy(sortByFieldName, sortByOrder)
            //
            // const trainingList = await trainingListQueryBuilder.getRawMany()
            //
            //
            // const trainingListGroupBySmId = _.groupBy(trainingList, 'smId')
            //
            // const trainingListStatsBySmId = _.map(_.keys(trainingListGroupBySmId), ele => {
            //     return _.reduce(trainingListGroupBySmId[ele], (acc, cur) => {
            //         const trainingType: TrainingTypeEnum = cur.trainingType
            //         return acc[trainingType] += +cur.trainingCount, acc
            //     }, { smId: ele, smName: trainingListGroupBySmId[ele][0].sm_servicerMasterName, ECLASS: 0, LiveTraining: 0, Webinar: 0})
            // })
            //
            //
            // const trainingListStatsBySmIdWithCredits = trainingListStatsBySmId.map( ele => {
            //     const credits =
            //         Utils.getScoreByTrainingType(TrainingTypeEnum.ECLASS, ele[TrainingTypeEnum.ECLASS].toString()) +
            //         Utils.getScoreByTrainingType(TrainingTypeEnum.LiveTraining, ele[TrainingTypeEnum.LiveTraining].toString()) +
            //         Utils.getScoreByTrainingType(TrainingTypeEnum.Webinar, ele[TrainingTypeEnum.Webinar].toString())
            //
            //     const creditsPercentage = new Intl.NumberFormat('default', {
            //         style: 'percent',
            //         minimumFractionDigits: 2,
            //         maximumFractionDigits: 2,
            //     }).format(Math.min(credits, maxCredits));
            //
            //     return {
            //         ...ele,
            //         credits: creditsPercentage,
            //     }
            // })

            // download for Training table
            if(targetTable === targetTableToDownload.trainingTable){
                const email: string = req.body.email
                const userRole= req.body.userRole


                let subQueryWithFilteredTrainingStatus: SelectQueryBuilder<Training> = dataSource.getRepository(Training)
                    .createQueryBuilder('training')



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

                if(userRole === UserRoleEnum.ADMIN || userRole === UserRoleEnum.APPROVER){
                    subQueryWithFilteredTrainingStatus
                        .innerJoinAndSelect('user.servicer', 'sm')
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
                console.log(trainingTable)
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
