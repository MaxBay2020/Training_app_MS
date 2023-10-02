import {Router} from 'express'
import DownloadController from "../controllers/downloadControllers";
import {validateUser} from "../middlewares/validateUser";

const downloadRouters = Router()

downloadRouters.use('/:targetTable', validateUser, DownloadController.downloadTargetTable)


export default downloadRouters
