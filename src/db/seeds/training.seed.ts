import {Seeder, SeederFactoryManager} from "typeorm-extension";
import {DataSource} from "typeorm";
import Training from "../../entities/Training";

// insert fake records
class TrainingSeed implements Seeder {
    async run(dataSource: DataSource, factoryManager: SeederFactoryManager): Promise<any> {

        const trainingFactory = await factoryManager.get(Training)

        await trainingFactory.saveMany(10)
    }
}

export default TrainingSeed
