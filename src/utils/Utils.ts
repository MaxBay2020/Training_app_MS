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
}

export default Utils
