import {NextFunction, Request as ExpReq, Response as ExpRes} from "express";
import User from "../entities/User"
import dataSource from "../data-source"
import Error, {Message, StatusCode} from "../enums/Error";

export const validateUser = async (req: ExpReq, res: ExpRes, next: NextFunction) => {

    try {
        const email: string = req.body.email

        if(!email){
            const error = new Error(null, StatusCode.E400, Message.ErrParams)
            res.status(error.statusCode).send({
                info: error.info,
                message: error.message
            })
        }

        const user: User = await dataSource
            .getRepository(User)
            .createQueryBuilder('user')
            .innerJoinAndSelect('user.userRole', 'userRole')
            .where('user.email = :email', { email: email.trim() })
            .select(['userRole.userRoleName as userRole'])
            .getRawOne() as User

        if(!user){
            const error = new Error(null, StatusCode.E404, Message.ErrFind)
            res.status(error.statusCode).send({
                info: error.info,
                message: error.message
            })
        }

        req.body.userRole = user.userRole

        next()
    }catch (e){
        console.log(e.message)
        const error = new Error<{}>(e, StatusCode.E500, Message.ServerError)
        res.status(error.statusCode).send({
            info: error.info,
            message: error.message
        })
    }
}
