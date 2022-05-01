import { Router } from "express";
import authUtil from "../middlewares/auth";
import { reserveController } from "../controllers/reserveController";

const router = Router();

router.use(authUtil.isAuth);

router
    .route('/')
    .get(reserveController.getReservation)
    .post(reserveController.postReservation);

router.get('/datepicker', reserveController.getReservedDate);

router.post('/:postId', reserveController.deleteReservation);

router.post('/completed/:postId', reserveController.deleteCompletedReservation);

export default router;
