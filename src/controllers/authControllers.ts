import {Request as ExpReq, Response as ExpRes} from "express";
import Error, {Message, StatusCode} from "../enums/Error";
import User from "../entities/User";
import AppDataSource from "../data-source"
import jwt from 'jsonwebtoken'
import {access_token_expiresIn, saltRounds} from "../utils/consts";
import {validate} from "class-validator"
import bcrypt from 'bcrypt'


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
                .select(['user.email AS email', 'user.password AS password, user.firstName AS firstName'])
                .where('email = :email', { email })
                .getRawOne() as User

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

            const { firstName } = user
            return res.status(200).send({
                accessToken: token,
                firstName,
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
        const newUser = User.create({ email, password: hash, firstName, lastName })

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
