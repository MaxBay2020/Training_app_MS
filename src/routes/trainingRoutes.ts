import express from 'express'
import TrainingController from "../controllers/trainingControllers";
import {validateUser} from "../middlewares/validateUser";
const trainingRouters = express.Router()

// get all trainings
trainingRouters.get('/', validateUser, TrainingController.queryAllTrainings)

// get all training type
trainingRouters.get('/trainingTypes', validateUser, TrainingController.queryAllTrainingTypes)


// get training by trainingId
trainingRouters.get('/:trainingId', validateUser, TrainingController.queryTrainingById)

// create a training
trainingRouters.post('/add', validateUser, TrainingController.createTraining)

// update a training
trainingRouters.put('/:trainingId', validateUser, TrainingController.updateTrainingById)

// withdraw a training
trainingRouters.delete('/:trainingId', validateUser, TrainingController.deleteTrainingById)


export default trainingRouters
