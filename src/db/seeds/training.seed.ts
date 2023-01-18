import {Seeder, SeederFactoryManager} from "typeorm-extension";
import {DataSource} from "typeorm";
import Training from "../../entities/Training";

// 创建ProductSeed类，必须实现Seeder接口
class TrainingSeed implements Seeder {
    async run(dataSource: DataSource, factoryManager: SeederFactoryManager): Promise<any> {
        // 插入假数据
        // 创建product我们使用工厂模式来创建很多的product
        // 因此就不用像user.seed.ts文件中那样手动创建数据了
        // 而是借助factory文件创建很多假数据
        const trainingFactory = await factoryManager.get(Training)
        // 创建10个product
        await trainingFactory.saveMany(10)
    }
}

export default TrainingSeed
