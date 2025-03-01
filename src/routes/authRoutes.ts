import express from 'express'
import AuthControllers from "../controllers/authControllers";

const authRouters = express.Router()

// user login
authRouters.post('/login', AuthControllers.loginUser)

// NOTICE!!! This API is temporarily used!
authRouters.post('/register', AuthControllers.registerUser)


export default authRouters
