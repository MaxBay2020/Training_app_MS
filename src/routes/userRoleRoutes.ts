import express from 'express'
import {validateUser} from "../middlewares/validateUser";
import userRoleController from "../controllers/userRoleController";
const userRoleRoutes = express.Router()



// get all user roles
userRoleRoutes.get('/', validateUser, userRoleController.queryAllUserRoles)




export default userRoleRoutes
