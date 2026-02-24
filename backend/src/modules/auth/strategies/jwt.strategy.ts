import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';
import { Role } from '@prisma/client';

interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
  comunaId?: string;
  iat: number;
  exp: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('jwt.secret'),
      issuer: configService.get('jwt.issuer'),
      audience: configService.get('jwt.audience'),
    });
  }

  async validate(payload: JwtPayload): Promise<any> {
    // Busca el usuario para verificar que sigue activo
    const user = await this.usersService.findById(payload.sub);
    
    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Usuario inactivo');
    }

    // Retorna los datos que se adjuntarán al request
    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      comunaId: payload.comunaId,
      firstName: user.firstName,
      lastName: user.lastName,
    };
  }
}
