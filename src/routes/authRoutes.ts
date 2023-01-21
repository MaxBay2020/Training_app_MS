import express from 'express'
import AuthControllers from "../controllers/authControllers";

const authRouters = express.Router()

authRouters.post('/login', AuthControllers.loginUser)


export default authRouters
