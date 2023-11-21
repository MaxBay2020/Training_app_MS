import {Request as ExpReq, Response as ExpRes} from 'express'
import {fiscalEndDate, TrainingStatusEnum, TrainingTypeEnum, UserRoleEnum} from "../enums/enums";
import dataSource from "../data-source";
import User from "../entities/User";
import Error, {Message, StatusCode} from "../enums/Error";
import {validate} from "class-validator";
import Utils from "../utils/Utils";
import {In, Repository, SelectQueryBuilder} from "typeorm";
import AppDataSource from "../data-source";
import Servicer from "../entities/ServicerMaster";
import {maxCredits, OrderByType, traineeType} from "../utils/consts";
import ServicerMaster from "../entities/ServicerMaster";


class servicerController {
    static queryAllServicers = async (req: ExpReq, res: ExpRes) => {

        // query all servicers from db
        try {
            const email: string = req.body.email
            const userRole= req.body.userRole

            if(userRole !== UserRoleEnum.ADMIN) {
                const error = new Error(null, StatusCode.E401, Message.AuthorizationError)
                return res.status(error.statusCode).send({
                    info: '',
                    message: error.message
                })
            }

           const servicerList: ServicerMaster[] = await dataSource
               .getRepository(ServicerMaster)
               .createQueryBuilder('sm')
               .select(['sm.id', 'sm.servicerMasterName'])
               .getMany() as ServicerMaster[]



            return res.status(StatusCode.E200).send({
                servicerList
            })

        }catch(e){
            console.log(e.message)
            const error = new Error<{}>(e, StatusCode.E500, Message.ServerError)
            return res.status(error.statusCode).send({
                info: error.info,
                message: error.message
            })
        }
    }

}

export default servicerController
