import {DataSource, DataSourceOptions} from "typeorm";
import {SeederOptions} from "typeorm-extension";
import "reflect-metadata"

const config: DataSourceOptions & SeederOptions = {
    // 指定使用哪种数据库
    type: 'mysql',
    // 数据库的url地址
    host: 'localhost',
    // 指定该数据库的port
    port: 3306,
    // 输入用户名和密码
    username: 'root',
    password: '123456root',
    // 要使用的数据库名字
    database: 'training_app',
    // 指定使用的entity有哪些，即src/entities文件夹下的所有ts文件
    // 注意！这里必须写成src/开头，不能写成./！否则不起作用！
    entities: ['src/entities/**/*.ts'],
    // synchronize设置为true，表示将entity同步到数据库
    // 我们将synchronize设置成false
    // 因为如果是true，那么我们在写代码的时候就会自动同步到数据库，这样做很危险
    // 因此同步数据库的工作我们手动输入命令来完成即可
    synchronize: false,
    seeds: ['src/db/seeds/**/*{.ts,.js}'],
    factories: ['src/db/factories/**/*{.ts,.js}']
}

const AppDataSource = new DataSource(config)

export default AppDataSource
