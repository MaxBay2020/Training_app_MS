import {Request as ExpReq, Response as ExpRes} from "express";
import Error, {Message, StatusCode} from "../enums/Error";
import User from "../entities/User";
import AppDataSource from "../data-source"
import jwt from 'jsonwebtoken'
import {access_token_expiresIn} from "../utils/consts";


class AuthControllers {
    static loginUser = async (req: ExpReq, res: ExpRes) => {
        const { email, password } = req.body

        if(!email || !password){
            const error = new Error(null, StatusCode.E400, Message.ErrParams)
            return res.status(error.statusCode).send({
                info: error.info,
                message: error.message
            })
        }

        try {
            const user: User = await AppDataSource.getRepository(User)
                .createQueryBuilder('user')
                .select(['user.email AS email'])
                .where('email = :email', { email })
                .andWhere('password = :password', { password })
                .getRawOne() as User

            if(!user){
                const error = new Error(null, StatusCode.E404, Message.ErrFind)
                return res.status(error.statusCode).send({
                    info: '',
                    message: error.message
                })
            }

            const token = jwt.sign({
                email: user.email,
            }, process.env.JWT_ACCESS_TOKEN_SCRET as string, {
                expiresIn: access_token_expiresIn
            })

            return res.status(200).send({
                accessToken: token
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

export default AuthControllers
