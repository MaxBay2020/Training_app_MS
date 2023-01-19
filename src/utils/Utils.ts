import dataSource from '../data-source';
import {ObjectType} from "typeorm";

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
}

export default Utils
