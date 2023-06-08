import {Request as ExpReq, Response as ExpRes} from "express";
import Error, {Message, StatusCode} from "../enums/Error";
import User from "../entities/User";
import AppDataSource from "../data-source"
import jwt from 'jsonwebtoken'
import {access_token_expiresIn, saltRounds} from "../utils/consts";
import {validate} from "class-validator"
import bcrypt from 'bcrypt'
import dataSource from "../data-source";
import {UserWithDetails} from "../utils/dataType";


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

            const user = await AppDataSource
                .getRepository(User)
                .createQueryBuilder('user')
                .leftJoin('user.servicer', 'sm')
                .innerJoinAndSelect('user.role', 'role')
                .select([
                    'user.user_email_id AS email',
                    'user.user_pwd AS password',
                    'CONCAT_WS(" ", user.user_first_nm, user.user_last_nm) AS userName',
                    'sm.servicer_id AS servicerId',
                    'sm.servicer_nm AS servicerName',
                    'role.role_nm AS userRole'
                ])
                .where('user.user_email_id = :email', { email })
                .getRawOne()


            if(!user){
                const error = new Error(null, StatusCode.E404, Message.ErrFind)
                return res.status(error.statusCode).send({
                    info: '',
                    message: error.message
                })
            }



            const hash = user.password
            const isCorrect = await bcrypt.compare(password, hash)

            if(!isCorrect){
                const error = new Error(null, StatusCode.E403, Message.EmailOrPasswordError)
                return res.status(error.statusCode).send({
                    info: error.info,
                    message: error.message
                })
            }

            const token = jwt.sign({
                email: user.email,
            }, process.env.JWT_ACCESS_TOKEN_SCRET as string, {
                expiresIn: access_token_expiresIn
            })


            const { userName, userRole, servicerId, servicerName } = user
            return res.status(StatusCode.E200).send({
                accessToken: token,
                userName,
                userEmail: email,
                userRole,
                servicerId,
                servicerMasterName: servicerName
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
     * NOTICE!!! This API is temporarily used!
     * @param req
     * @param res
     */
    static registerUser = async (req: ExpReq, res: ExpRes) => {
        const { email, password, firstName, lastName } = req.body

        // hash password
        const salt = await bcrypt.genSalt(saltRounds)
        const hash = await bcrypt.hash(password, salt)
        const newUser = User.create({
            user_email_id: email,
            user_pwd: hash,
            user_first_nm: firstName,
            user_last_nm: lastName
        })

        const errors = await validate(newUser)
        if(errors.length > 0){
            return res.send({
                message: 'validate errors'
            })
        }

        await newUser.save()
        return res.send({
            message: 'new user saved!'
        })
    }
}

export default AuthControllers
