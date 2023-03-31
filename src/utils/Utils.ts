import dataSource from '../data-source';
import {Brackets, ObjectType, SelectQueryBuilder} from "typeorm";
import Training from "../entities/Training";
import {trainingScore, TrainingTypeEnum, UserRoleEnum} from "../enums/enums";
import moment from "moment";
import {eClassModuleCount, logoUrl} from "./consts";
import PDFDocument = PDFKit.PDFDocument;

class Utils {
     static queryAllRecordsInTable<T, Entity>(identifiers: T[], tableName: ObjectType<Entity>, primaryKeyColumnName: string) :Promise<Entity[]> {
        return Promise.all(identifiers.map(async identifier => {
            return dataSource
                .getRepository(tableName)
                .createQueryBuilder()
                .where(`${primaryKeyColumnName} = :identifier`, {identifier})
                .getOne() as Entity
        }))
    }


    /**
     * order by for training table
     * @param sortByNumber
     */
    static getSortingMethod = (sortByNumber = 1): { sortByFieldName: string, sortByOrder: 'ASC' | 'DESC' } => {
        if(sortByNumber === 1){
            return {
                sortByFieldName: 'createdAt',
                sortByOrder: 'DESC'
            }
        }
        else if(sortByNumber === 2){
             return {
                 sortByFieldName: 'trainingName',
                 sortByOrder: 'ASC'
             }
         }
         else if(sortByNumber === 3){
             return {
                 sortByFieldName: 'servicerMasterName',
                 sortByOrder: 'ASC'
             }
         }


         return {
             sortByFieldName: 'createdAt',
             sortByOrder: 'DESC'
         }
    }

    /**
     * which columns should be searched for
     * @param subQuery
     * @param columnNamesToSearch
     * @param searchKeyword
     */
    static specifyColumnsToSearch = (subQuery: SelectQueryBuilder<any>, columnNamesToSearch: string[], searchKeyword: string) :SelectQueryBuilder<any> => {
        subQuery.andWhere(new Brackets(qb => {
            columnNamesToSearch.forEach(columnNameToSearch => {
                qb.orWhere(`${columnNameToSearch} LIKE :value`, { value: `%${searchKeyword}%` })
            })
            return qb
        }))

        return subQuery
    }


    static formattedTrainingList = (originalTrainingList: any[], userRole: string): {} => {
        if(userRole === UserRoleEnum.SERVICER){
            return originalTrainingList.map(item => {
                const {
                    training_id,
                    training_trainingName,
                    training_trainingType,
                    training_trainingStatus,
                    training_hoursCount,
                    training_startDate,
                    training_endDate,
                    training_trainingURL
                } = item
                return {
                    id: training_id,
                    trainingName: training_trainingName,
                    trainingType: training_trainingType,
                    trainingStatus: training_trainingStatus,
                    hoursCount: training_hoursCount,
                    startDate: training_startDate,
                    endDate: training_endDate,
                    trainingURL: training_trainingURL
                }
            })
        }else if(userRole === UserRoleEnum.ADMIN || userRole === UserRoleEnum.APPROVER){
            return originalTrainingList.map(item => {
                const {
                    user_email,
                    user_firstName,
                    user_lastName,

                    sm_id,
                    sm_servicerMasterName,

                    training_id,
                    training_trainingName,
                    training_trainingType,
                    training_trainingStatus,
                    training_hoursCount,
                    training_startDate,
                    training_endDate,
                    training_trainingURL,

                } = item

                return {
                    userEmail: user_email,
                    userFirstName: user_firstName,
                    userLastName: user_lastName,

                    servicerId: sm_id,
                    servicerName: sm_servicerMasterName,

                    id: training_id,
                    trainingName: training_trainingName,
                    trainingType: training_trainingType,
                    trainingStatus: training_trainingStatus,
                    hoursCount: training_hoursCount,
                    startDate: training_startDate,
                    endDate: training_endDate,
                    trainingURL: training_trainingURL

                }
            })
        }else{
            return {}
        }
    }

    /**
     * get valid fiscal year based on current date time
     * @param fiscalEndTimeMonth
     * @param fiscalEndTimeDate
     */
    static getCurrentFiscalTimeRange = (fiscalEndTimeMonth: number, fiscalEndTimeDate: number):
        {
            currentFiscalStartTime: Date,
            currentFiscalEndTime: Date
        } => {
        // 1. compare two date:
        //  a. get full time of end date (YYYY-MM-DD) based on current time YEAR
        //  and parameters passed in
        const currentFiscalEndTime = moment(new Date(`${moment().year()}-${fiscalEndTimeMonth}-${fiscalEndTimeDate}`))

        //  b. the current date
        const currentDate = moment()

        // if a < b => the year of a should be incremented by 1
        // if a > b => do nothing
        if(currentFiscalEndTime < currentDate){
            currentFiscalEndTime.add(1, 'years')
        }

        // 2. get the fiscal start time: minus 1 on the year of fiscal end date, date should be added 1.
        const currentFiscalStartTime = moment(currentFiscalEndTime)
            .subtract(1, 'years').add(1, 'days')

        return {
            currentFiscalStartTime: currentFiscalStartTime.toDate(),
            currentFiscalEndTime: currentFiscalEndTime.toDate()
        }
    }


    /**
     * calculate scores by training type
     * @param trainingType
     * @param count
     */
    static getScoreByTrainingType = (trainingType: TrainingTypeEnum, count: string): number => {
        if(trainingType === TrainingTypeEnum.LiveTraining){
            if(+count === 0){
                return 0
            }
            return parseFloat(trainingScore.LiveTraining) / 100
        }else if(trainingType === TrainingTypeEnum.ECLASS){
            if(+count !== eClassModuleCount){
                return 0
            }
            return parseFloat(trainingScore.EClass) / 100
        }else if(trainingType === TrainingTypeEnum.Webinar){
            return parseFloat(trainingScore.Webinar) * +count / 100
        }
        return -1
    }

    /**
     * generate header for pdf file
     * @param doc
     */
    static generatePDFHeader = (doc: PDFDocument) => {
        doc.image(logoUrl, 50, 45, { width: 100 })
            .fillColor('#444444')
            .fontSize(14)
            .text('Credit Report', 50, 65)
            // .fontSize(10)
            // .text('123 Main Street', 200, 65, { align: 'right' })
            // .text('New York, NY, 10025', 200, 80, { align: 'right' })
            .moveDown();
    }

    /**
     * generate footer for pdf file
     * @param doc
     */
    static generatePDFFooter = (doc: PDFDocument) => {
        doc.fontSize(
            10,
        ).text(
            'Thank you. If you have any questions, please contact luna@yongesolutions.com',
            50,
            780,
            { align: 'center', width: 500 },
        );
    }

    /**
     * generate table row of pdf file
     * @param doc
     * @param y
     * @param trainingListStats
     * @param originalPositionX
     * @param cellGap
     * @param minimumCellWidth
     * @param maximumCellWidth
     */
    static generateTableRow = (doc: PDFDocument, y: number, trainingListStats: any, originalPositionX: number, cellGap: number, minimumCellWidth: number, maximumCellWidth: number) => {
        const temp = doc.font('Helvetica').fontSize(6)
        Object.keys(trainingListStats).forEach((ele, index) => {
            const cellWidth = ele === 'smName' || ele === 'LiveTraining' ? maximumCellWidth : minimumCellWidth
            temp.text(trainingListStats[ele], originalPositionX + index * cellGap, y, { width: cellWidth , align: 'center' })
            // generate horizontal line
            Utils.generateHr(doc, '#bbbbbb', 1 , originalPositionX + 13, originalPositionX + Object.keys(trainingListStats).length * cellGap - 43, y + 13)
        })
    }

    /**
     * generate table of pdf file
     * @param doc
     * @param trainingListStats
     */
    static generatePDFTable = (doc: PDFDocument, trainingListStats: any) => {
        const tableTop: number = 240
        const cellGap: number = 100
        const originalPositionX: number = 10
        const minimumCellWidth = 70
        const maximumCellWidth = 70
        let i = 0

        // generate table head
        // Servicer ID	Servicer Name	#Appd.EClass	#Appd.Webinar	#Appd.LiveTraining	Credits
        const tableHeaders = ['Servicer ID', 'Servicer Name','# Appd.EClass', '# Appd.Webinar', '# Appd.LiveTraining', '# Credits']
        doc
            .font('Helvetica-Bold')
            .fontSize(6)
        tableHeaders.forEach( ele => {
            const cellWidth = ele === 'Servicer Name' || ele === 'LiveTraining' ? maximumCellWidth : minimumCellWidth
            doc.text(ele, originalPositionX + i++ * cellGap, tableTop, { width: cellWidth, align: "center" })
        })

        // generate horizontal line
        Utils.generateHr(doc, '#aaaaaa', 1 , originalPositionX + 13, originalPositionX + i * cellGap - 43, tableTop + 15)

        // generate table body
        trainingListStats.forEach((ele: any, index: number) => {
            const y = tableTop + (index + 1) * 20;
            Utils.generateTableRow(doc, y, ele, originalPositionX, cellGap, minimumCellWidth, maximumCellWidth)
        })

    }

    /**
     * generate horizontal line
     * @param doc
     * @param color
     * @param lineWidth
     * @param startX
     * @param endX
     * @param y
     */
    static generateHr = (doc: PDFDocument, color: string, lineWidth: number, startX: number, endX: number, y: number) => {
        doc
            .strokeColor(color)
            .lineWidth(lineWidth)
            .moveTo(startX, y)
            .lineTo(endX, y)
            .stroke();
    }
}

export default Utils
