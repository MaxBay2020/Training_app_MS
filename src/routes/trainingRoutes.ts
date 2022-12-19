import express from 'express'
import TrainingController from "../controllers/trainingControllers";
const trainingRouters = express.Router()

// /trainings
trainingRouters.get('/', TrainingController.queryAllTrainings)

// trainingRouters.get('/1', Training.queryTrainingById)

export default trainingRouters
