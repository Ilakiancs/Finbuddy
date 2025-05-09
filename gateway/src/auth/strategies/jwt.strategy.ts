import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    // The payload has been verified by Passport
    // We can add additional validation logic here
    // The returned object will be attached to the Request object as 'user'
    return { 
      id: payload.sub, 
      email: payload.email,
      roles: payload.roles || [],
      permissions: payload.permissions || []
    };
  }
}