import {Router} from 'express'
import trainingRouters from "./trainingRoutes";
import authRouters from "./authRoutes";
import downloadRouters from "./downloadRouters";

const indexRoutes = Router()

indexRoutes.use('/training', trainingRouters)
indexRoutes.use('/auth', authRouters)
// app.use('/credit', creditRouters)
indexRoutes.use('/download', downloadRouters)




// error handler
indexRoutes.use('*', (req, res) => {
    return res.status(404).json({
        message: 'NO MATCHED ROUTER'
    })
})

export default indexRoutes
