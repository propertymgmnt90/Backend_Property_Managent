// import express from 'express';
// import { 
//   getAdminStats,
//   getAllAppointments,
//   updateAppointmentStatus 
// } from '../controller/adminController.js';

// const router = express.Router();

// router.get('/stats', getAdminStats);
// router.get('/appointments',getAllAppointments);
// router.put('/appointments/status',updateAppointmentStatus);

// export default router;

import express from 'express';
import { 
  getAdminStats,
  getAllAppointments,
  updateAppointmentStatus,
  getAllUsers // Add the new controller
} from '../controller/adminController.js';

const router = express.Router();

router.get('/stats', getAdminStats);
router.get('/appointments', getAllAppointments);
router.put('/appointments/status', updateAppointmentStatus);
router.get('/users', getAllUsers); // New route to fetch all users

export default router;