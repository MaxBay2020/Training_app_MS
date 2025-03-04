import {Router} from 'express'
import trainingRouters from "./trainingRoutes";
import authRouters from "./authRoutes";
import downloadRouters from "./downloadRouters";
import creditRouters from "./creditsRoutes";
import aiRouters from "./aiRoutes";

const indexRoutes = Router()

indexRoutes.use('/training', trainingRouters)
indexRoutes.use('/auth', authRouters)
indexRoutes.use('/credit', creditRouters)
indexRoutes.use('/download', downloadRouters)
indexRoutes.use('/assistant', aiRouters)




// error handler
indexRoutes.use('*', (req, res) => {
    return res.status(404).json({
        message: 'NO MATCHED ROUTER'
    })
})

export default indexRoutes
