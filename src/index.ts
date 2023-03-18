import express, {Express} from 'express'
import bodyParser from 'body-parser'
import trainingRouters from "./routes/trainingRoutes";
import AppDataSource from "./data-source";
import cors from "cors";
import authRouters from "./routes/authRoutes"
import dotenv from 'dotenv'
import creditRouters from "./routes/creditsRoutes";

const startServer = async () => {
    const app: Express = express()

    try {
        await AppDataSource.initialize()
    }catch(e){
        console.log(e.message)
    }

    // parse application/x-www-form-urlencoded
    app.use(bodyParser.urlencoded({ extended: false }))

    // parse application/json
    app.use(bodyParser.json())

    app.use(cors())
    dotenv.config()


    app.use('/training', trainingRouters)
    app.use('/auth', authRouters)
    app.use('/credit', creditRouters)

    // error handler
    app.use('*', (req, res) => {
        return res.status(404).json({
            message: 'NO MATCHED ROUTER'
        })
    })

    const port = Number(process.env.PORT) || 8000
    app.listen(port, () => {
        console.log('SERVER IS RUNNING!')
    })
}

startServer()
