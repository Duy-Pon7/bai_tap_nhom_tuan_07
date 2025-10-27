import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// 🧩 Middleware chạy cho mọi request (trừ static & API)
export function middleware(request: NextRequest) {
  // 🔐 Lấy token từ cookie
  const token = request.cookies.get("token")?.value;

  // 📍 Các route liên quan tới auth (signin, signup)
  const isAuthPage =
    request.nextUrl.pathname.startsWith("/signin") ||
    request.nextUrl.pathname.startsWith("/signup");

  // 🚫 Nếu chưa có token và không phải đang ở trang đăng nhập/đăng ký → chuyển về /signin
  if (!token && !isAuthPage) {
    const signInUrl = new URL("/signin", request.url);
    return NextResponse.redirect(signInUrl);
  }

  // ✅ Nếu đã có token mà vẫn cố truy cập trang signin/signup → chuyển về trang chủ
  if (token && isAuthPage) {
    const homeUrl = new URL("/", request.url);
    return NextResponse.redirect(homeUrl);
  }

  // ✅ Cho phép truy cập bình thường
  return NextResponse.next();
}

// ⚙️ Cấu hình matcher để middleware bỏ qua static & API
export const config = {
  matcher: [
    // Áp dụng cho tất cả các route trừ `_next`, `api`, `favicon.ico`, và file tĩnh
    "/((?!_next/static|_next/image|favicon.ico|api).*)",
  ],
};
