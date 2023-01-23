import dataSource from '../data-source';
import {EntityTarget, ObjectType, SelectQueryBuilder} from "typeorm";

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
}

export default Utils
