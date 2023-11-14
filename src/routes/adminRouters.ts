import express from 'express'
import TrainingController from "../controllers/trainingControllers";
import {validateUser} from "../middlewares/validateUser";
import userController from "../controllers/userController";
const adminRouters = express.Router()



// get all users
adminRouters.get('/user', validateUser, userController.queryAllUsers)




export default adminRouters
