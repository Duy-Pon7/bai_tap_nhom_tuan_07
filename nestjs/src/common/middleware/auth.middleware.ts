// src/common/middleware/auth.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';

// ✅ Augment ngay trong file (giống bản Express)
declare global {
  namespace Express {
    interface Request {
      user?: { userId: string; email: string; role: string };
    }
  }
}
// đảm bảo file là module
export {};

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    try {
      const authHeader = req.headers['authorization'];
      if (!authHeader) {
        return res.status(400).json({ status: 400, success: false, message: 'Vui lòng đăng nhập để tiếp tục' });
      }
      if (!authHeader.startsWith('Bearer ')) {
        return res.status(400).json({ status: 400, success: false, message: 'Token không đúng định dạng' });
      }
      const token = authHeader.split(' ')[1];
      if (!token?.trim()) {
        return res.status(400).json({ status: 400, success: false, message: 'Token không tồn tại' });
      }

      const secret = process.env.JWT_SECRET;
      if (!secret) throw new Error('JWT_SECRET không được cấu hình');

      const decoded = jwt.verify(token, secret) as { userId: string; email: string; role: string };
      if (!decoded.userId || !decoded.email || !decoded.role) {
        return res.status(400).json({ status: 400, success: false, message: 'Token không hợp lệ' });
      }

      req.user = { userId: decoded.userId, email: decoded.email, role: decoded.role };
      next();
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return res.status(400).json({ status: 400, success: false, message: 'Token đã hết hạn, vui lòng đăng nhập lại' });
      }
      if (error instanceof jwt.JsonWebTokenError) {
        return res.status(400).json({ status: 400, success: false, message: 'Token không hợp lệ' });
      }
      if (error instanceof jwt.NotBeforeError) {
        return res.status(400).json({ status: 400, success: false, message: 'Token chưa có hiệu lực' });
      }
      console.error('Auth middleware error:', error);
      return res.status(500).json({ status: 500, success: false, message: 'Lỗi xác thực người dùng' });
    }
  }
}
