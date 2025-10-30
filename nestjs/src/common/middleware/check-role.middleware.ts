// src/common/middleware/check-role.middleware.ts
import { Request, Response, NextFunction } from 'express';

// Nếu bạn đã augment req.user trong auth.middleware.ts thì không cần declare global lại.
// Ở đây chỉ bổ sung type local cho tiện.
type Role = 'USER' | 'ADMIN';

interface AuthedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: Role;
  };
}

// ✅ Middleware dạng factory: truyền allowedRoles và nhận về function (req,res,next)
export const checkRole = (...allowedRoles: Role[]) => {
  return (req: AuthedRequest, res: Response, next: NextFunction) => {
    try {
      const userRole = req.user?.role as Role | undefined;

      if (!userRole) {
        return res.status(400).json({
          status: 400,
          success: false,
          message: 'Không tìm thấy thông tin người dùng',
        });
      }

      if (!allowedRoles.includes(userRole)) {
        return res.status(400).json({
          status: 400,
          success: false,
          message: 'Bạn không có quyền truy cập tài nguyên này',
        });
      }

      next();
    } catch (error) {
      console.error('Check role error:', error);
      return res.status(500).json({
        status: 500,
        success: false,
        message: 'Lỗi kiểm tra quyền truy cập',
      });
    }
  };
};
