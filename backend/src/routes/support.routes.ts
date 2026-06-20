import { Router } from 'express';
import { SupportController } from '../controllers/support.controller';
import { authenticateJWT, authorizeRoles } from '../middleware/auth.middleware';

const router = Router();

// Require authentication for all support routes
router.use(authenticateJWT);

// Public (Users, Vendors, Riders, etc.)
router.get('/ticket', SupportController.getOrCreateTicket);
router.get('/ticket/:ticketId/messages', SupportController.getTicketMessages);

// Agent specific
router.get('/agent/tickets', authorizeRoles('super_admin', 'admin', 'customer_service'), SupportController.getAssignedTickets);
router.post('/agent/ticket/:ticketId/resolve', authorizeRoles('super_admin', 'admin', 'customer_service'), SupportController.resolveTicket);

export default router;
