import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extend the Express Request to include our user payload
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: 'super_admin' | 'admin' | 'regional_coordinator' | 'area_manager' | 'vendor' | 'dispatch_rider' | 'customer' | 'finance' | 'auditor';
  };
}

// 1. Verify the JWT Token
export const authenticateJWT = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Access token missing or invalid' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
    
    // Support both custom JWT and Supabase JWT
    req.user = {
      id: decoded.sub || decoded.id,
      email: decoded.email,
      role: decoded.user_metadata?.role || decoded.app_metadata?.role || decoded.role || 'attendee',
    };
    
    next();
  } catch (error) {
    return res.status(403).json({ success: false, message: 'Invalid or expired token' });
  }
};

// 2. Role-Based Access Control (RBAC) Guard
export const authorizeRoles = (...allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Forbidden: You do not have permission to access this resource' 
      });
    }
    next();
  };
};
