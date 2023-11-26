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


class userController {
    /**
     * get all users with pagination, sorting, and search
     * @param req
     * @param res
     */
    static queryAllUsers = async (req: ExpReq, res: ExpRes) => {

        const { searchKeyword, orderBy, order, page, limit } = req.query

        if(!page || !limit || !orderBy || !order){
            const error = new Error(null, StatusCode.E400, Message.ErrParams)
            return res.status(error.statusCode).send({
                info: error.info,
                message: error.message
            })
        }
        const { sortByFieldName, sortByOrder } = Utils.getSortingMethod(orderBy as string, order as OrderByType, 'userTable')

        const startIndex = (+page - 1) * (+limit)

        // query all trainings from db
        try {
            const email: string = req.body.email
            const userRole= req.body.userRole

            let userListQueryBuilder: SelectQueryBuilder<User> = dataSource
                .createQueryBuilder()


            let subQueryWithFilteredUserStatus: SelectQueryBuilder<User> = dataSource.getRepository(User)
                    .createQueryBuilder('user')


            subQueryWithFilteredUserStatus
                .innerJoinAndSelect('user.userRole', 'userRole')
                .leftJoinAndSelect('user.servicer', 'sm')

            if(userRole !== UserRoleEnum.ADMIN) {
                const error = new Error(null, StatusCode.E401, Message.AuthorizationError)
                return res.status(error.statusCode).send({
                    info: '',
                    message: error.message
                })
            }

            subQueryWithFilteredUserStatus
                .orderBy(sortByFieldName, sortByOrder)

            subQueryWithFilteredUserStatus
                .select([
                    'user.id',
                    'user.firstName',
                    'user.lastName',
                    'user.createdAt',
                    'user.updatedAt',
                    'user.email',
                    'user.isDelete',
                    'userRole.id',
                    'userRole.userRoleName',
                    'sm.id',
                    'sm.servicerMasterName',
                ])


            if(searchKeyword){
                subQueryWithFilteredUserStatus = Utils.specifyColumnsToSearch(
                    subQueryWithFilteredUserStatus,
                    [
                        'user.firstName',
                        'user.lastName',
                        'user.email',
                        'userRole.userRoleName',
                        'sm.id',
                        'sm.servicerMasterName'
                    ],
                    searchKeyword as string)
            }


            const totalNumber: number = await subQueryWithFilteredUserStatus.getCount() as number

            const userList = await userListQueryBuilder
                .select()
                .from(`(${subQueryWithFilteredUserStatus.getQuery()})`, 'subtable')
                .setParameters(subQueryWithFilteredUserStatus.getParameters())
                .skip(startIndex)
                .take(+limit)
                .getRawMany()

            const totalPage = Math.ceil(totalNumber / +limit)

            return res.status(StatusCode.E200).send({
                userRole,
                userList,
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
     * create user
     * @param req
     * @param res
     */
    static createUser = async (req: ExpReq, res: ExpRes) => {
        const {
            firstName,
            lastName,
            newUserEmail,
            userRoleId,
            servicerId
        } = req.body

        const { email, userRole } = req.body

        if(userRole !== UserRoleEnum.ADMIN){
            const error = new Error(null, StatusCode.E401, Message.AuthorizationError)
            return res.status(error.statusCode).send({
                info: '',
                message: error.message
            })
        }


        if(!firstName || !lastName || !newUserEmail || !userRoleId || !servicerId){
            const error = new Error(null, StatusCode.E400, Message.ErrParams)
            return res.status(error.statusCode).send({
                info: error.info,
                message: error.message
            })
        }


        try{
            const [userRole, servicer, user, loggedInUser] = await Promise.all([
                dataSource.getRepository(UserRole)
                    .createQueryBuilder('userRole')
                    .where('userRole.id = :userRoleId', { userRoleId })
                    .getOne(),
                dataSource.getRepository(ServicerMaster)
                    .createQueryBuilder('sm')
                    .where('sm.id = :servicerId', { servicerId })
                    .getOne(),
                dataSource.getRepository(User)
                    .createQueryBuilder('user')
                    .where('user.email = :newUserEmail', { newUserEmail })
                    .getOne(),
                dataSource.getRepository(User)
                    .createQueryBuilder('user')
                    .where('user.email = :email', { email })
                    .getOne(),
            ])

            if(!userRole || !servicer || !loggedInUser){
                const error = new Error(null, StatusCode.E404, Message.ErrFind)
                return res.status(error.statusCode).send({
                    info: '',
                    message: error.message
                })
            }

            if(user){
                const error = new Error(null, StatusCode.E406, Message.HasExisted)
                return res.status(error.statusCode).send({
                    info: '',
                    message: error.message,
                })
            }


            const newUser: User = User.create({
                firstName,
                lastName,
                email: newUserEmail,
                userRole,
                servicer,
                createdBy: loggedInUser,
                updatedBy: loggedInUser
            }) as User



            const errors = await validate(newUser)
            if(errors.length > 0){
                console.log(errors)
                const error = new Error(null, StatusCode.E400, Message.ErrParams)
                return res.status(error.statusCode).send({
                    info: '',
                    message: error.message
                })
            }

            await newUser.save()


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
    static updateUserByUserId = async (req: ExpReq, res: ExpRes) => {
        const {
            firstName,
            lastName,
            updateUserEmail,
            userRoleId,
            servicerId
        } = req.body

        const { email, userRole } = req.body

        const { userId } = req.params

        if(userRole !== UserRoleEnum.ADMIN){
            const error = new Error(null, StatusCode.E401, Message.AuthorizationError)
            return res.status(error.statusCode).send({
                info: '',
                message: error.message
            })
        }

        if(!firstName || !lastName || !updateUserEmail || !userRoleId || !servicerId){
            const error = new Error(null, StatusCode.E400, Message.ErrParams)
            return res.status(error.statusCode).send({
                info: error.info,
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
            const [userRole, servicer, userByEmail, userByUserId, loggedInUser] = await Promise.all([
                dataSource.getRepository(UserRole)
                    .createQueryBuilder('userRole')
                    .where('userRole.id = :userRoleId', { userRoleId })
                    .getOne(),
                dataSource.getRepository(ServicerMaster)
                    .createQueryBuilder('sm')
                    .where('sm.id = :servicerId', { servicerId })
                    .getOne(),
                dataSource.getRepository(User)
                    .createQueryBuilder('user')
                    .where('user.email = :updateUserEmail', { updateUserEmail })
                    .getOne(),
                dataSource.getRepository(User)
                    .createQueryBuilder('user')
                    .where('user.id = :userId', { userId })
                    .getOne(),
                dataSource.getRepository(User)
                    .createQueryBuilder('user')
                    .where('user.email = :email', { email })
                    .getOne(),
            ])

            if(!userRole || !servicer || !loggedInUser || !userByUserId){
                const error = new Error(null, StatusCode.E404, Message.ErrFind)
                return res.status(error.statusCode).send({
                    info: '',
                    message: error.message
                })
            }

            if(userByEmail?.id !== userByUserId.id){
                const error = new Error(null, StatusCode.E406, Message.HasExisted)
                return res.status(error.statusCode).send({
                    info: '',
                    message: error.message,
                })
            }

            // if(userByEmail){
            //     const error = new Error(null, StatusCode.E406, Message.HasExisted)
            //     return res.status(error.statusCode).send({
            //         info: '',
            //         message: error.message,
            //     })
            // }

            const userToUpdate: User = User.create({
                firstName,
                lastName,
                email: updateUserEmail,
                userRole,
                servicer,
                updatedBy: loggedInUser
            }) as User

            const errors = await validate(userToUpdate, {
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
                .update(User)
                .set(userToUpdate)
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


    /**
     * update user
     * @param req
     * @param res
     */
    static deleteUserByUserId = async (req: ExpReq, res: ExpRes) => {
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

export default userController
