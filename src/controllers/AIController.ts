import {Request as ExpReq, Response as ExpRes} from "express"
import OpenAI from 'openai'
import {aiStyle} from "../enums/enums";
import dataSource from "../data-source";
import User from "../entities/User";
import Training from "../entities/Training";

class AIController{

    /**
     * query message from OpenAI
     * @param req
     * @param res
     */
    static queryAnswer = async (req: ExpReq, res: ExpRes) => {
        const { prompt, email } = req.body

        const allRecords = await dataSource.getRepository(Training)
            .createQueryBuilder('training')
            .innerJoinAndSelect('training.user', 'user')
            .innerJoinAndSelect('training.trainee', 'trainee')
            .innerJoinAndSelect('user.servicer', 'sm')
            .innerJoinAndSelect('user.userRole', 'userRole')
            .where('user.email = :email', { email })
            .select([
                'training.trainingName',
                'training.trainingStatus',
                'training.trainingType',
                'training.startDate',
                'training.endDate',
                'training.hoursCount',
                'training.trainingURL',

                'user.email',
                'user.firstName',
                'user.lastName',

                'userRole.userRoleName',

                'sm.servicerMasterName',

                'trainee.email',
                'trainee.firstName',
                'trainee.lastName',
            ])
            .getMany()


        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        })

        const gptResponse = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                {
                    role: 'system',
                    content: aiStyle.dbRelated
                },
                {
                    role: 'user',
                    content: prompt ?? ''
                },
                {
                    role: 'assistant',
                    content: JSON.stringify(allRecords)
                }
            ]
        })

        return res.send(gptResponse.choices[0].message)

    }
}

export default AIController
