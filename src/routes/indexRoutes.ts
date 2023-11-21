import {Router} from 'express'
import trainingRouters from "./trainingRoutes";
import authRouters from "./authRoutes";
import downloadRouters from "./downloadRouters";
import creditRouters from "./creditsRoutes";
import adminRouters from "./adminRouters";
import userRoleRoutes from "./userRoleRoutes";
import servicerRoutes from "./servicerRoutes";

const indexRoutes = Router()

indexRoutes.use('/training', trainingRouters)
indexRoutes.use('/auth', authRouters)
indexRoutes.use('/credit', creditRouters)
indexRoutes.use('/download', downloadRouters)
indexRoutes.use('/admin', adminRouters)
indexRoutes.use('/userRole', userRoleRoutes)
indexRoutes.use('/servicer', servicerRoutes)




// error handler
indexRoutes.use('*', (req, res) => {
    return res.status(404).json({
        message: 'NO MATCHED ROUTER'
    })
})

export default indexRoutes
