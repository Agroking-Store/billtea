import { Response, NextFunction } from 'express';
import { AuthRequest } from './authMiddleware';
import { UserRole } from '../models/User';

/**
 * Middleware to restrict access based on user role.
 * Must be used AFTER authMiddleware.
 *
 * Usage:
 *   router.post('/create', authMiddleware, requireRole('owner'), handler)
 *   router.get('/data', authMiddleware, requireRole('owner', 'manager'), handler)
 */
export function requireRole(...allowedRoles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.role) {
      res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
      return;
    }

    if (!allowedRoles.includes(req.role)) {
      res.status(403).json({
        success: false,
        message: 'You do not have permission to perform this action.',
      });
      return;
    }

    next();
  };
}
