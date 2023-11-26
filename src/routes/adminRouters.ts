import express from 'express'
import TrainingController from "../controllers/trainingControllers";
import {validateUser} from "../middlewares/validateUser";
import userController from "../controllers/userController";
import servicerController from "../controllers/servicerController";
const adminRouters = express.Router()



// get all users
adminRouters.get('/user', validateUser, userController.queryAllUsers)

// create new user
adminRouters.post('/user', validateUser, userController.createUser)

// update user by user id
adminRouters.put('/user/:userId', validateUser, userController.updateUserByUserId)

// delete user by user id
adminRouters.delete('/user/:userId', validateUser, userController.deleteUserByUserId)


// get all servicers
adminRouters.get('/servicer', validateUser, servicerController.queryAllServicers)

// create new servicerId
adminRouters.post('/servicer', validateUser, servicerController.createServicer)

// update servicer by servicer id
adminRouters.put('/servicer/:servicerId', validateUser, servicerController.updateServicerByServicerId)

// delete servicer by servicer id
adminRouters.delete('/servicer/:servicerId', validateUser, servicerController.deleteServicerByServicerId)





export default adminRouters
