import {Request as ExpReq, Response as ExpRes} from 'express'
import Training from "../entities/Training";
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
import EClass from "../entities/EClass";
import {Trainee} from "../utils/dataType";
import moment from "moment";
import UserRole from "../entities/UserRole";
import ServicerMaster from "../entities/ServicerMaster";


class userRoleController {
    static queryAllUserRoles = async (req: ExpReq, res: ExpRes) => {

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

            const userRoleList: UserRole[] = await dataSource
                .getRepository(UserRole)
                .createQueryBuilder('userRole')
                .select(['userRole.id', 'userRole.userRoleName'])
                .getMany() as UserRole[]



            return res.status(StatusCode.E200).send({
                userRoleList
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

export default userRoleController
