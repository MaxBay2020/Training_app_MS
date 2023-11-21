import express from 'express'
import {validateUser} from "../middlewares/validateUser";
import servicerController from "../controllers/servicerController";
const servicerRoutes = express.Router()



// get all user roles
servicerRoutes.get('/', validateUser, servicerController.queryAllServicers)




export default servicerRoutes
