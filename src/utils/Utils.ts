import dataSource from '../data-source';
import {ObjectType, SelectQueryBuilder} from "typeorm";
import Training from "../entities/Training";
import {TrainingStatusEnum, UserRoleEnum} from "../enums/enums";

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
     * @param queryBuilder
     * @param columnNames
     * @param searchKeyword
     */
    static specifyColumnsToSearch = (queryBuilder: SelectQueryBuilder<any>, columnNames: string[], searchKeyword: string) :SelectQueryBuilder<any> => {
        columnNames.forEach(columnName => {
            queryBuilder.orWhere(`${columnName} LIKE :value`, { value: `%${searchKeyword}%` })
        })
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
}

export default Utils
