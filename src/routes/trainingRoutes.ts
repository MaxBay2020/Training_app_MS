import express from 'express'
import TrainingController from "../controllers/trainingControllers";
const trainingRouters = express.Router()

// get all trainings
trainingRouters.get('/', TrainingController.queryAllTrainings)

// get training by trainingId
trainingRouters.get('/:trainingId', TrainingController.queryTrainingById)

// create a training
trainingRouters.post('/add', TrainingController.createTraining)

// update a training
trainingRouters.put('/:trainingId', TrainingController.updateTrainingById)

// delete a training
trainingRouters.delete('/:trainingId', TrainingController.deleteTrainingById)

export default trainingRouters
