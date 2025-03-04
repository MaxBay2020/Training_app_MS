import express from 'express'
import TrainingController from "../controllers/trainingControllers";
import {validateUser} from "../middlewares/validateUser";
import AIController from "../controllers/AIController";
const aiRouters = express.Router()


// get message from openAI
aiRouters.post('/', validateUser, AIController.queryAnswer)





export default aiRouters
