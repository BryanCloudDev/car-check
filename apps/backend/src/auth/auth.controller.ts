import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from './decorators/current-user.decorator';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import type { AuthenticatedUser } from './jwt.strategy';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthTokenResponse } from './dto/auth-token.response';
import { CurrentUserResponse } from './dto/current-user.response';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar nuevo taller',
    description:
      'Crea un taller y su usuario administrador. Devuelve un token JWT.',
  })
  @ApiResponse({
    status: 201,
    description: 'Taller y administrador creados correctamente.',
    type: AuthTokenResponse,
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos.' })
  @ApiResponse({ status: 409, description: 'El email ya está registrado.' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Iniciar sesión',
    description: 'Autentica un usuario y devuelve un token JWT.',
  })
  @ApiResponse({
    status: 200,
    description: 'Login exitoso.',
    type: AuthTokenResponse,
  })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas.' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Usuario actual',
    description: 'Devuelve los datos del usuario autenticado, incluido su rol.',
  })
  @ApiResponse({
    status: 200,
    description: 'Datos del usuario autenticado.',
    type: CurrentUserResponse,
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado. Token JWT inválido o ausente.',
  })
  me(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.me(user.userId);
  }
}
