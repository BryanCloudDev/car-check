import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<{ accessToken: string }> {
    const [existingWorkshop, existingUser] = await Promise.all([
      this.prisma.workshop.findUnique({ where: { email: dto.workshopEmail } }),
      this.prisma.user.findUnique({ where: { email: dto.adminEmail } }),
    ]);

    if (existingWorkshop) {
      throw new ConflictException('Ya existe un taller con ese email');
    }
    if (existingUser) {
      throw new ConflictException('Ya existe un usuario con ese email');
    }

    const passwordHash = await bcrypt.hash(dto.adminPassword, 10);

    const user = await this.prisma.$transaction(async (tx) => {
      const workshop = await tx.workshop.create({
        data: {
          name: dto.workshopName,
          email: dto.workshopEmail,
          phone: dto.workshopPhone,
        },
      });

      return tx.user.create({
        data: {
          name: dto.adminName,
          email: dto.adminEmail,
          passwordHash,
          role: 'ADMIN',
          workshopId: workshop.id,
        },
      });
    });

    const accessToken = this.jwt.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
      workshopId: user.workshopId,
    });

    return { accessToken };
  }

  async login(dto: LoginDto): Promise<{ accessToken: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const passwordMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatch) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const accessToken = this.jwt.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
      workshopId: user.workshopId,
    });

    return { accessToken };
  }
}
