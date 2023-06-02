import {DataSource, DataSourceOptions} from "typeorm";
import {SeederOptions} from "typeorm-extension";
import "reflect-metadata"
import { SnakeNamingStrategy } from 'typeorm-naming-strategies'

const config: DataSourceOptions & SeederOptions = {
    type: 'mysql',
    host: 'localhost',
    port: 3306,
    username: 'root',
    password: '123456root',
    database: 'training_app_v2',
    entities: ['src/entities/**/*.ts'],
    synchronize: false,
    seeds: ['src/db/seeds/**/*{.ts,.js}'],
    factories: ['src/db/factories/**/*{.ts,.js}'],
    namingStrategy: new SnakeNamingStrategy(),
}

const AppDataSource = new DataSource(config)

export default AppDataSource
