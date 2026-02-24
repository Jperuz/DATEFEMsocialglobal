import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Role, UserStatus } from '@prisma/client';

interface TokenPayload {
  sub: string;
  email: string;
  role: Role;
  comunaId?: string;
}

interface AuthResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: Role;
    avatarUrl?: string;
    comunaId?: string;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  /**
   * Registra un nuevo usuario
   */
  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    const { email, password, firstName, lastName, phone, comunaId } = registerDto;

    // Verifica si el email ya existe
    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('El email ya está registrado');
    }

    // Hashea la contraseña
    const hashedPassword = await this.hashPassword(password);

    // Crea el usuario
    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phone,
        comunaId,
        role: Role.CUSTOMER,
        status: UserStatus.ACTIVE,
        emailVerified: false,
      },
    });

    this.logger.log(`Usuario registrado: ${user.email}`);

    // Genera tokens
    const tokens = await this.generateTokens(user);

    return {
      user: this.sanitizeUser(user),
      tokens,
    };
  }

  /**
   * Inicia sesión de usuario
   */
  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const { email, password } = loginDto;

    // Busca el usuario
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Verifica el estado del usuario
    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Usuario inactivo o suspendido');
    }

    // Verifica la contraseña
    const isPasswordValid = await this.comparePasswords(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Actualiza último login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    this.logger.log(`Usuario logueado: ${user.email}`);

    // Genera tokens
    const tokens = await this.generateTokens(user);

    return {
      user: this.sanitizeUser(user),
      tokens,
    };
  }

  /**
   * Refresca el token de acceso
   */
  async refreshTokens(refreshToken: string): Promise<AuthResponse> {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('jwt.secret'),
      });

      const user = await this.usersService.findById(payload.sub);
      if (!user || user.status !== UserStatus.ACTIVE) {
        throw new UnauthorizedException('Token inválido');
      }

      const tokens = await this.generateTokens(user);

      return {
        user: this.sanitizeUser(user),
        tokens,
      };
    } catch (error) {
      throw new UnauthorizedException('Token de refresco inválido');
    }
  }

  /**
   * Valida usuario para estrategia local
   */
  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (user && await this.comparePasswords(password, user.password)) {
      return this.sanitizeUser(user);
    }
    return null;
  }

  /**
   * Genera tokens JWT
   */
  private async generateTokens(user: any): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }> {
    const payload: TokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      comunaId: user.comunaId,
    };

    const accessToken = this.jwtService.sign(payload);
    
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get('jwt.refreshTokenExpiry'),
    });

    // Calcula tiempo de expiración
    const decoded = this.jwtService.decode(accessToken) as { exp: number };
    const expiresIn = decoded.exp * 1000; // Convierte a milisegundos

    return {
      accessToken,
      refreshToken,
      expiresIn,
    };
  }

  /**
   * Hashea una contraseña
   */
  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * Compara contraseñas
   */
  private async comparePasswords(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  /**
   * Remueve datos sensibles del usuario
   */
  private sanitizeUser(user: any) {
    const { password, verificationToken, ...sanitized } = user;
    return sanitized;
  }

  /**
   * Cambia la contraseña del usuario
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new BadRequestException('Usuario no encontrado');
    }

    const isCurrentValid = await this.comparePasswords(
      currentPassword,
      user.password,
    );
    if (!isCurrentValid) {
      throw new BadRequestException('Contraseña actual incorrecta');
    }

    const hashedPassword = await this.hashPassword(newPassword);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    this.logger.log(`Contraseña cambiada para usuario: ${user.email}`);
  }

  /**
   * Solicita recuperación de contraseña
   */
  async requestPasswordReset(email: string): Promise<void> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      // No revela si el email existe o no (seguridad)
      return;
    }

    // Genera token de recuperación
    const resetToken = this.jwtService.sign(
      { sub: user.id, type: 'password_reset' },
      { expiresIn: '1h' },
    );

    // Aquí se enviaría el email con el token
    // TODO: Implementar servicio de email
    this.logger.log(`Token de recuperación generado para: ${email}`);
  }

  /**
   * Restablece la contraseña con token
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      const payload = this.jwtService.verify(token);
      if (payload.type !== 'password_reset') {
        throw new BadRequestException('Token inválido');
      }

      const hashedPassword = await this.hashPassword(newPassword);
      await this.prisma.user.update({
        where: { id: payload.sub },
        data: { password: hashedPassword },
      });

      this.logger.log(`Contraseña restablecida para usuario: ${payload.sub}`);
    } catch (error) {
      throw new BadRequestException('Token inválido o expirado');
    }
  }
}
