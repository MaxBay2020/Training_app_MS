import {Request as ExpReq, Response as ExpRes} from 'express'
import Training from "../entities/Training";
import {TrainingStatusEnum} from "../enums/enums";
import dataSource from "../data-source";

class TrainingController {
    /**
     * get all training data
     * @param req
     * @param res
     */
    static queryAllTrainings = async (req: ExpReq, res: ExpRes) => {
        // query all trainings from db
        try {
            const trainingList: Training[] = await dataSource.getRepository(Training)
                .createQueryBuilder('training')
                .where('training.trainingStatus <> :value', { value: TrainingStatusEnum.WITHDRAWN })
                .getMany() as Training[]

            return res.status(200).send(trainingList)
        }catch(e){
            console.log(e.message)
            return
        }
    }

    // /**
    //  * get training by id
    //  * @param req
    //  * @param res
    //  */
    // static queryTrainingById = (req: ExpReq, res: ExpRes) => {
    //     res.send('trainings 1!')
    //     return
    // }
}

export default TrainingController
