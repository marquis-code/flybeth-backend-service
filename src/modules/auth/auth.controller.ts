// src/modules/auth/auth.controller.ts
import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Res,
  Req,
} from "@nestjs/common";
import { Response, Request } from "express";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import {
  RegisterDto,
  LoginDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  VerifyOtpDto,
  RefreshTokenDto,
  ResendOtpDto,
  SocialLoginDto,
} from "./dto/auth.dto";
import { Public } from "../../common/decorators/public.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { AuthGuard } from "@nestjs/passport";
import { ConfigService } from "@nestjs/config";

@ApiTags("Authentication")
@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  private setTokenCookies(
    res: Response,
    tokens: { accessToken: string; refreshToken: string },
  ) {
    const isProd = this.configService.get("NODE_ENV") === "production";

    // Cookie options for both tokens
    const cookieOptions = {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? ("strict" as const) : ("lax" as const),
      path: "/",
    };

    res.cookie("accessToken", tokens.accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000, // 15 mins
    });

    res.cookie("refreshToken", tokens.refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }

  private clearTokenCookies(res: Response) {
    res.clearCookie("accessToken", { path: "/" });
    res.clearCookie("refreshToken", { path: "/" });
  }

  @Public()
  @Post("register")
  @ApiOperation({ summary: "Register a new user" })
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Public()
  @Post("login")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Login with email and password" })
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Public()
  @Post("social-login")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Login with social provider (Firebase)" })
  async socialLogin(
    @Body() socialLoginDto: SocialLoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.socialLogin(socialLoginDto);
    if (result.accessToken && result.refreshToken) {
      this.setTokenCookies(res, {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      });
    }
    return result;
  }

  @Public()
  @Post("refresh")
  @UseGuards(AuthGuard("jwt-refresh"))
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Refresh access token" })
  async refreshToken(
    @CurrentUser("_id") userId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokens = await this.authService.refreshToken(userId);
    this.setTokenCookies(res, tokens);
    return { message: "Token refreshed successfully" };
  }

  @Public()
  @Post("forgot-password")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Request password reset" })
  forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Public()
  @Post("reset-password")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Reset password with token" })
  resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @Public()
  @Post("verify-otp")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Verify email with OTP" })
  async verifyOtp(
    @Body() verifyOtpDto: VerifyOtpDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.verifyOtp(verifyOtpDto);
    if (result.accessToken && result.refreshToken) {
      this.setTokenCookies(res, {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      });

      // Tokens are preserved in response body to support explicit Bearer headers
      // delete (result as any).accessToken;
      // delete (result as any).refreshToken;
    }
    return result;
  }

  @Public()
  @Post("resend-otp")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Resend verification OTP" })
  resendOtp(@Body() resendOtpDto: ResendOtpDto) {
    return this.authService.resendOtp(resendOtpDto);
  }

  @Post("logout")
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Logout current user" })
  async logout(
    @CurrentUser("_id") userId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    this.clearTokenCookies(res);
    return this.authService.logout(userId);
  }
}
