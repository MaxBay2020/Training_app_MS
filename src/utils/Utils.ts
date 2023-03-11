import dataSource from '../data-source';
import {Brackets, ObjectType, SelectQueryBuilder} from "typeorm";
import Training from "../entities/Training";
import {trainingScore, TrainingTypeEnum, UserRoleEnum} from "../enums/enums";
import moment from "moment";

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
         if(sortByNumber === 2){
             return {
                 sortByFieldName: 'trainingName',
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
        const outQuery: SelectQueryBuilder<any> = dataSource
            .createQueryBuilder()
            .select()

        outQuery.andWhere(new Brackets(qb => {
            columnNamesToSearch.forEach(columnNameToSearch => {
                qb.orWhere(`subQuery.${columnNameToSearch} LIKE :value`, { value: `%${searchKeyword}%` })
            })
            return qb
        }))

        outQuery.from(`(${subQuery.getQuery()})`, 'subQuery')

        // console.log(outQuery.getQuery())

        // columnNames.forEach(columnName => {
        //     queryBuilder.orWhere(`${columnName} LIKE :value`, { value: `%${searchKeyword}%` })
        // })
        return outQuery
    }


    static formattedTrainingList = (originalTrainingList: any[], userRole: string) => {
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
            return []
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
            return parseFloat(trainingScore.LiveTraining) / 100
        }else if(trainingType === TrainingTypeEnum.ECLASS){
            return parseFloat(trainingScore.EClass) / 100
        }else if(trainingType === TrainingTypeEnum.Webinar){
            return parseFloat(trainingScore.Webinar) * +count / 100
        }
        return -1
    }
}

export default Utils
