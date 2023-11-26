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


class servicerController {

    static queryServicersList = async (req: ExpReq, res: ExpRes) => {

        // query all trainings from db
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

            const servicerList = await dataSource.getRepository(Servicer)
                .createQueryBuilder('sm')
                .select(['sm.id', 'sm.servicerMasterName'])
                .getMany()

            return res.status(StatusCode.E200).send({
                userRole,
                servicerList,
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

    /**
     * get all servicers with pagination, sorting, and search
     * @param req
     * @param res
     */
    static queryAllServicers = async (req: ExpReq, res: ExpRes) => {

        const { searchKeyword, orderBy, order, page, limit } = req.query

        if(!page || !limit || !orderBy || !order){
            const error = new Error(null, StatusCode.E400, Message.ErrParams)
            return res.status(error.statusCode).send({
                info: error.info,
                message: error.message
            })
        }
        const { sortByFieldName, sortByOrder } = Utils.getSortingMethod(orderBy as string, order as OrderByType, 'servicerTable')
        const startIndex = (+page - 1) * (+limit)

        // query all trainings from db
        try {
            const email: string = req.body.email
            const userRole= req.body.userRole

            let servicerListQueryBuilder: SelectQueryBuilder<Servicer> = dataSource
                .createQueryBuilder()


            let subQueryWithFilteredServicerStatus: SelectQueryBuilder<Servicer> = dataSource.getRepository(Servicer)
                .createQueryBuilder('sm')


            if(userRole !== UserRoleEnum.ADMIN) {
                const error = new Error(null, StatusCode.E401, Message.AuthorizationError)
                return res.status(error.statusCode).send({
                    info: '',
                    message: error.message
                })
            }

            subQueryWithFilteredServicerStatus
                .orderBy(sortByFieldName, sortByOrder)

            subQueryWithFilteredServicerStatus
                .select([
                    'sm.id',
                    'sm.servicerMasterName',
                    'sm.trsiiOptIn',
                    'sm.optOutFlag',
                ])


            if(searchKeyword){
                subQueryWithFilteredServicerStatus = Utils.specifyColumnsToSearch(
                    subQueryWithFilteredServicerStatus,
                    [
                        'sm.id',
                        'sm.servicerMasterName'
                    ],
                    searchKeyword as string)
            }


            const totalNumber: number = await subQueryWithFilteredServicerStatus.getCount() as number

            const servicerList = await servicerListQueryBuilder
                .select()
                .from(`(${subQueryWithFilteredServicerStatus.getQuery()})`, 'subtable')
                .setParameters(subQueryWithFilteredServicerStatus.getParameters())
                .skip(startIndex)
                .take(+limit)
                .getRawMany()

            const totalPage = Math.ceil(totalNumber / +limit)

            return res.status(StatusCode.E200).send({
                userRole,
                servicerList,
                totalPage
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


    /**
     * create servicer
     * @param req
     * @param res
     */
    static createServicer = async (req: ExpReq, res: ExpRes) => {
        const {
            servicerId,
            servicerName,
            servicerOptOutFlag,
            servicerTrsiiOptIn
        } = req.body

        const { email, userRole } = req.body

        if(userRole !== UserRoleEnum.ADMIN){
            const error = new Error(null, StatusCode.E401, Message.AuthorizationError)
            return res.status(error.statusCode).send({
                info: '',
                message: error.message
            })
        }


        if(!servicerId || !servicerName || !servicerOptOutFlag || !servicerTrsiiOptIn){
            const error = new Error(null, StatusCode.E400, Message.ErrParams)
            return res.status(error.statusCode).send({
                info: error.info,
                message: error.message
            })
        }


        try{
            const servicerByServicerId = await dataSource.getRepository(Servicer)
                .createQueryBuilder('sm')
                .where('sm.id = :servicerId', { servicerId })
                .getOne()

            if(servicerByServicerId){
                const error = new Error(null, StatusCode.E406, Message.HasExisted)
                return res.status(error.statusCode).send({
                    info: '',
                    message: error.message,
                })
            }


            const newServicer: Servicer = Servicer.create({
                id: servicerId,
                servicerMasterName: servicerName,
                optOutFlag: JSON.parse(servicerOptOutFlag),
                trsiiOptIn: JSON.parse(servicerTrsiiOptIn),
            }) as Servicer



            const errors = await validate(newServicer)
            if(errors.length > 0){
                console.log(errors)
                const error = new Error(null, StatusCode.E400, Message.ErrParams)
                return res.status(error.statusCode).send({
                    info: '',
                    message: error.message
                })
            }

            await newServicer.save()


            return res.status(StatusCode.E200).send({
                info: '',
                message: Message.OK
            })

        }catch (e) {
            console.log(e.message)
            const error = new Error<{}>(e, StatusCode.E500, Message.ServerError)
            return res.status(error.statusCode).send({
                info: error.info,
                message: error.message
            })
        }
    }

    /**
     * update servicer
     * @param req
     * @param res
     */
    static updateServicerByServicerId = async (req: ExpReq, res: ExpRes) => {
        const {
            servicerId: servicerIdToUpdate,
            servicerName,
            servicerOptOutFlag,
            servicerTrsiiOptIn
        } = req.body

        const { email, userRole } = req.body

        const { servicerId } = req.params

        if(userRole !== UserRoleEnum.ADMIN){
            const error = new Error(null, StatusCode.E401, Message.AuthorizationError)
            return res.status(error.statusCode).send({
                info: '',
                message: error.message
            })
        }

        if(!servicerId || !servicerName || !servicerOptOutFlag || !servicerTrsiiOptIn){
            const error = new Error(null, StatusCode.E400, Message.ErrParams)
            return res.status(error.statusCode).send({
                info: error.info,
                message: error.message
            })
        }



        if(!servicerId){
            const error = new Error(null, StatusCode.E400, Message.ErrParams)
            return res.status(error.statusCode).send({
                info: '',
                message: error.message
            })
        }


        try{
            const [servicerByServicerId, currentServicer] = await Promise.all([
                dataSource.getRepository(Servicer)
                    .createQueryBuilder('sm')
                    .where('sm.id = :servicerIdToUpdate', { servicerIdToUpdate })
                    .getOne(),
                dataSource.getRepository(Servicer)
                    .createQueryBuilder('sm')
                    .where('sm.id = :servicerId', { servicerId })
                    .getOne(),
            ])

            if(!currentServicer){
                const error = new Error(null, StatusCode.E404, Message.ErrFind)
                return res.status(error.statusCode).send({
                    info: '',
                    message: error.message
                })
            }

            // if(servicerByServicerId){
            //     const error = new Error(null, StatusCode.E406, Message.HasExisted)
            //     return res.status(error.statusCode).send({
            //         info: '',
            //         message: error.message,
            //     })
            // }

            const servicerToUpdate: Servicer = Servicer.create({
                id: servicerIdToUpdate,
                servicerMasterName: servicerName,
                optOutFlag: JSON.parse(servicerOptOutFlag),
                trsiiOptIn: JSON.parse(servicerTrsiiOptIn),
            }) as Servicer

            const errors = await validate(servicerToUpdate, {
                skipMissingProperties: true
            })
            if(errors.length > 0){
                console.log(errors)
                const error = new Error(null, StatusCode.E400, Message.ErrParams)
                return res.status(error.statusCode).send({
                    info: '',
                    message: error.message
                })
            }

            await dataSource
                .createQueryBuilder()
                .update(Servicer)
                .set(servicerToUpdate)
                .where('id = :servicerId', { servicerId })
                .execute()

            return res.status(StatusCode.E200).send({
                info: '',
                message: Message.OK
            })

        }catch (e) {
            console.log(e.message)
            const error = new Error<{}>(e, StatusCode.E500, Message.ServerError)
            return res.status(error.statusCode).send({
                info: error.info,
                message: error.message
            })
        }
    }


    /**
     * update user
     * @param req
     * @param res
     */
    static deleteServicerByServicerId = async (req: ExpReq, res: ExpRes) => {
        const { email, userRole } = req.body

        const { userId } = req.params

        if(userRole !== UserRoleEnum.ADMIN){
            const error = new Error(null, StatusCode.E401, Message.AuthorizationError)
            return res.status(error.statusCode).send({
                info: '',
                message: error.message
            })
        }

        if(!userId){
            const error = new Error(null, StatusCode.E400, Message.ErrParams)
            return res.status(error.statusCode).send({
                info: '',
                message: error.message
            })
        }


        try{
            const loggedInUser = await dataSource.getRepository(User)
                .createQueryBuilder('user')
                .where('user.email = :email', { email })
                .getOne()

            if(!loggedInUser){
                const error = new Error(null, StatusCode.E404, Message.ErrFind)
                return res.status(error.statusCode).send({
                    info: '',
                    message: error.message
                })
            }

            await dataSource
                .createQueryBuilder()
                .update(User)
                .set({
                    isDelete: true
                })
                .where('id = :userId', { userId })
                .execute()

            return res.status(StatusCode.E200).send({
                info: '',
                message: Message.OK
            })

        }catch (e) {
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
