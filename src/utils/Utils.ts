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

        if(sortByNumber === 3){
            return {
                sortByFieldName: 'trainingStatus',
                sortByOrder: 'ASC'
            }
        }

        if(sortByNumber === 4){
            return {
                sortByFieldName: 'trainingType',
                sortByOrder: 'ASC'
            }
        }

        if(sortByNumber === 5){
            return {
                sortByFieldName: 'startDate',
                sortByOrder: 'DESC'
            }
        }

        if(sortByNumber === 6){
            return {
                sortByFieldName: 'endDate',
                sortByOrder: 'DESC'
            }
        }


         return {
             sortByFieldName: 'createdAt',
             sortByOrder: 'DESC'
         }
    }

    /**
     * which columns should be searched for
     * @param queryBuilder
     * @param columnNames
     * @param searchKeyword
     */
    static specifyColumnsToSearch = (queryBuilder: SelectQueryBuilder<any>, columnNames: string[], searchKeyword: string) :SelectQueryBuilder<any> => {
        queryBuilder.andWhere(new Brackets(qb => {
            columnNames.forEach(columnName => {
                qb.orWhere(`${columnName} LIKE :value`, { value: `%${searchKeyword}%` })
            })
            return qb
        }))

        // columnNames.forEach(columnName => {
        //     queryBuilder.orWhere(`${columnName} LIKE :value`, { value: `%${searchKeyword}%` })
        // })
        return queryBuilder
    }


    static formattedTrainingList = (originalTrainingList: Training[], userRole: string) => {
        if(userRole === UserRoleEnum.SERVICER){
            return originalTrainingList.map(item => {
                const { id, trainingName, trainingType, trainingStatus, hoursCount, startDate, endDate, trainingURL } = item
                return {
                    id,
                    trainingName,
                    trainingType,
                    trainingStatus,
                    hoursCount,
                    startDate,
                    endDate,
                    trainingURL
                }
            })
        }else if(userRole === UserRoleEnum.ADMIN || userRole === UserRoleEnum.APPROVER){
            return originalTrainingList.map(item => {
                const { user, operatedAt, operatedBy, note, createdAt, updatedAt, isDelete, isActive, ...rest } = item
                return {
                    ...rest,

                    userEmail: item.user?.email,
                    userFirstName: item.user?.firstName,
                    userLastName: item.user?.lastName,

                    servicerId: item.user?.servicer.id,
                    servicerName: item.user?.servicer.servicerMasterName,
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
