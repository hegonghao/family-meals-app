import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserRole } from '../common/enums/user-role.enum';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET', 'family-meals-secret'),
    });
  }

  async validate(payload: { sub: string; username: string; displayName: string; role: UserRole }) {
    return {
      userId: payload.sub,
      username: payload.username,
      displayName: payload.displayName,
      role: payload.role
    };
  }
}
