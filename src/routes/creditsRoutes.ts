import express from 'express'
import creditController from "../controllers/creditControllers";
import {validateUser} from "../middlewares/validateUser";
const creditRouters = express.Router()

// get credits with pagination, sorting, and search
creditRouters.get('/', validateUser, creditController.queryAllCredits)


export default creditRouters
