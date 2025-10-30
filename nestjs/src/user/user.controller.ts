import { Body, Controller, HttpCode, Post, Get, Query, Delete, Param, Req } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UserService } from './user.service';
import { LoginDto } from './dto/login.dto';

type AuthedReq = Request & {
  user?: { userId: string; email: string; role: 'USER' | 'ADMIN' };
};

@Controller('user') // => POST /user/login
export class UserController {
  constructor(private readonly userService: UserService) {}

  // Đăng nhập
  @Post('login')
  @HttpCode(200)
  async login(@Body() dto: LoginDto) {
    try {
      const { token, user } = await this.userService.loginUserSv(
        dto.email,
        dto.password,
      );
      return {
        status: 200,
        message: 'Đăng nhập thành công',
        token,
        data: user,
      };
    } catch (err: any) {
      // giữ format cũ
      return { status: 400, message: err?.message || 'Đăng nhập thất bại' };
    }
  }

  // POST /user/create-user  (ADMIN)
  @Post('create-user')
  @HttpCode(200)
  async createUser(@Body() dto: CreateUserDto) {
    try {
      const newUser = await this.userService.createUserByAdminSv(dto);
      return {
        status: 200,
        message: 'Tạo tài khoản thành công',
        data: newUser,
      };
    } catch (err: any) {
      return {
        status: 400,
        message: err?.message || 'Tạo tài khoản thất bại',
      };
    }
  }

  //DELETE /user/delete-user/:_id
  @Delete('delete-user/:_id')
  @HttpCode(200)
  async deleteUser(@Param('_id') _id: string) {
    try {
      await this.userService.deleteUserSv(_id);
      return {
        status: 200,
        message: 'Xóa người dùng thành công',
      };
    } catch (err: any) {
      return {
        status: 400,
        message: err?.message || 'Xóa người dùng thất bại',
      };
    }
  }

  // GET /user/get-info/:_id  (yêu cầu đã đăng nhập)
  @Get('get-user/:_id')
  @HttpCode(200)
  async getInfoUser(@Param('_id') _id: string, @Req() req: AuthedReq) {
    try {
      const authenticatedUserId = req.user!.userId; // đã được gắn bởi AuthMiddleware
      const user = await this.userService.getInfoUserSv(_id, authenticatedUserId);
      return {
        status: 200,
        message: 'Lấy thông tin người dùng thành công',
        data: user,
      };
    } catch (err: any) {
      return {
        status: 400,
        message: err?.message || 'Lỗi lấy thông tin người dùng',
      };
    }
  }

  // Lấy danh sách người dùng với phân trang và tìm kiếm
  @Get('get-user-list')
  async getUserList(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    try {
      const pageNum = page ? parseInt(page) : undefined;
      const limitNum = limit ? parseInt(limit) : undefined;
      const result = await this.userService.getUserListSv(pageNum, limitNum, search);

      return {
        status: 200,
        message: 'Lấy danh sách người dùng thành công',
        data: result,
      };
    } catch (err: any) {
      return {
        status: 400,
        message: err?.message || 'Lỗi lấy danh sách người dùng',
      };
    }
  }
}
