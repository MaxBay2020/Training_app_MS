import express from 'express'
import AuthControllers from "../controllers/authControllers";
import {validateUser} from "../middlewares/validateUser";

const authRouters = express.Router()

// login user
authRouters.post('/login', AuthControllers.loginUser)

// query all user roles
authRouters.get('/userRoles', validateUser, AuthControllers.queryAllUserRoles)

// NOTICE!!! This API is temporarily used!
authRouters.post('/register', AuthControllers.registerUser)


export default authRouters
