import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  // Đăng nhập người dùng
  async loginUserSv(email: string, password: string) {
    const user = await this.userModel
      .findOne({ email })
      .select('-otp -otpExpires -__v')
      .lean();

    if (!user) throw new Error('Email không tồn tại');
    if (!user.isVerified) throw new Error('Tài khoản chưa xác thực OTP');

    const withPwd = await this.userModel.findOne({ email }).select('password').lean();
    if (!withPwd) throw new Error('Email không tồn tại');

    const isMatch = await bcrypt.compare(password, withPwd.password);
    if (!isMatch) throw new Error('Sai mật khẩu');

    // CHỐT TYPE CHO SECRET & EXPIRESIN
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('Missing env JWT_SECRET');

    const expiresIn: jwt.SignOptions['expiresIn'] =
      (process.env.JWT_EXPIRES as jwt.SignOptions['expiresIn']) ?? '1h';

    const token = jwt.sign(
      { userId: String(user._id), email: user.email, role: user.role },
      secret as jwt.Secret,
      { expiresIn } // ✅ options đúng kiểu
    );

    return { token, user };
  }

  // Service thêm user mới bởi ADMIN
  async createUserByAdminSv(payload: CreateUserDto) {
    // Kiểm tra email đã tồn tại
    const exists = await this.userModel.findOne({ email: payload.email }).lean();
    if (exists) {
      throw new Error('Email đã tồn tại trong hệ thống');
    }

    // Hash mật khẩu
    const hashed = await bcrypt.hash(payload.password, 10);

    // Tạo user mới (auto verify)
    const doc = await this.userModel.create({
      email: payload.email,
      password: hashed,
      role: payload.role,
      isVerified: true,
      otp: '',
      otpExpires: null,
      fullname: payload.fullname ?? 'New User',
      avatar:
        payload.avatar ??
        'https://res.cloudinary.com/dglm2f7sr/image/upload/v1761373988/default_awmzq0.jpg',
    });

    // Dọn password trước khi trả
    const obj = doc.toObject();
    delete (obj as any).password;

    return obj;
  }

  // Xoá người dùng (hard delete)
  async deleteUserSv(userId: string): Promise<void> {
    if (!userId || !Types.ObjectId.isValid(userId)) {
      throw new Error('ID người dùng không hợp lệ');
    }
    const deleted = await this.userModel.findByIdAndDelete(userId);
    if (!deleted) {
      throw new Error('Người dùng không tồn tại');
    }
  }

  // Lấy chi tiết thông tin người dùng (chỉ cho phép chính chủ)
  async getInfoUserSv(_id: string, authenticatedUserId: string) {
    if (!Types.ObjectId.isValid(_id) || !Types.ObjectId.isValid(authenticatedUserId)) {
      throw new Error('ID người dùng không hợp lệ');
    }

    if (String(_id) !== String(authenticatedUserId)) {
      throw new Error('Bạn không có quyền truy cập thông tin này');
    }

    const infoUser = await this.userModel
      .findById(_id)
      .select('-otp -otpExpires -isVerified -password -__v')
      .lean();

    if (!infoUser) throw new Error('Người dùng không tồn tại');

    return infoUser;
  }

  // Lấy danh sách người dùng với phân trang và tìm kiếm
  async getUserListSv(page?: number, limit?: number, search?: string) {
    try {
      const query: any = {};

      // Nếu có từ khóa tìm kiếm
      if (search) {
        query.$or = [
          { email: { $regex: search, $options: 'i' } },
          { fullname: { $regex: search, $options: 'i' } },
        ];
      }

      // Không có phân trang ⇒ trả hết
      if (!page || !limit) {
        const users = await this.userModel
          .find(query)
          .select('-password -otp -otpExpires')
          .sort({ createdAt: -1 })
          .lean();

        return {
          users,
          total: users.length,
          page: 1,
          limit: users.length,
          totalPages: 1,
        };
      }

      // Có phân trang
      const skip = (page - 1) * limit;
      const [users, total] = await Promise.all([
        this.userModel
          .find(query)
          .select('-password -otp -otpExpires')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        this.userModel.countDocuments(query),
      ]);

      return {
        users,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error: any) {
      throw new Error(error.message || 'Lỗi lấy danh sách người dùng');
    }
  }
}