import express from 'express'
import TrainingController from "../controllers/trainingControllers";
const trainingRouters = express.Router()

// get all trainings
trainingRouters.get('/', TrainingController.queryAllTrainings)

// create a training
trainingRouters.post('/add', TrainingController.createTraining)

export default trainingRouters
