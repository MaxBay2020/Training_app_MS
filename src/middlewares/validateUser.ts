import {NextFunction, Request as ExpReq, Response as ExpRes} from "express";
import User from "../entities/User"
import dataSource from "../data-source"
import Error, {Message, StatusCode} from "../enums/Error";
import jwt from "jsonwebtoken"

export const validateUser = async (req: ExpReq, res: ExpRes, next: NextFunction) => {

    try {
        const authHeader = req.headers.authorization

        if(!authHeader){
            const error = new Error(null, StatusCode.E400, Message.ErrParams)
            return res.status(error.statusCode).send({
                info: error.info,
                message: error.message
            })
        }

        const accessToken: string = authHeader.split(' ')[1]

        jwt.verify(accessToken, process.env.JWT_ACCESS_TOKEN_SCRET as string, async (err, user) => {
            if(err){
                const error = new Error(null, StatusCode.E402, Message.NoAuth)
                return res.status(error.statusCode).send({
                    info: '',
                    message: error.message
                })
            }

            const email = JSON.parse(JSON.stringify(user)).email.trim()

            const userFound = await dataSource
                .getRepository(User)
                .createQueryBuilder('user')
                .innerJoinAndSelect('user.role', 'userRole')
                .leftJoinAndSelect('user.servicer', 'sm')
                .where('user.user_email_id = :email', { email })
                .select(['userRole.role_nm AS userRole', 'sm.servicer_id AS servicerId'])
                .getRawOne()

            if (!userFound) {
                const error = new Error(null, StatusCode.E404, Message.ErrFind)
                return res.status(error.statusCode).send({
                    info: error.info,
                    message: error.message
                })
            }

            req.body.userRole = userFound.userRole
            req.body.email = email
            req.body.servicerMasterId = userFound.servicerId

            next()
            return
        })
        return
    }catch (e){
        console.log(e.message)
        const error = new Error<{}>(e, StatusCode.E500, Message.ServerError)
        return res.status(error.statusCode).send({
            info: error.info,
            message: error.message
        })
    }
}
