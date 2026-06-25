import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole } from '../models/User';

export interface AuthRequest extends Request {
  userId?: string;
  companyId?: string;
  role?: UserRole;
  branches?: string[];
}

/**
 * Middleware to protect routes — verifies JWT from Authorization header.
 * Injects userId, companyId, role, and branches into the request.
 * Usage: router.get('/protected', authMiddleware, handler)
 */
export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      message: 'Access denied. No token provided.',
    });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const jwtSecret = process.env.JWT_SECRET || 'fallback_secret';
    const decoded = jwt.verify(token, jwtSecret) as {
      userId: string;
      phoneNumber: string;
      companyId: string | null;
      role: UserRole;
      branches: string[];
    };
    req.userId = decoded.userId;
    req.companyId = decoded.companyId || undefined;
    req.role = decoded.role;
    req.branches = decoded.branches || [];
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token. Please login again.',
    });
  }
}
