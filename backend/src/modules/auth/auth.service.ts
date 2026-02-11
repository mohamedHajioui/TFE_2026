import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../users/entity/user.entity';
import { Repository } from 'typeorm';
import { JwtUtil } from '../../common/utils/jwt.util';
import { CryptoUtil } from '../../common/utils/crypto.util';
import { RegisterDto } from './dto/register.dto';
import { AuthResponseDto } from './dto/auth-response.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtUtil: JwtUtil,
  ) {}

  async register(registrDto: RegisterDto): Promise<AuthResponseDto> {
    // Vérifier si l'email existe déjà
    const existingEmail = await this.userRepository.findOne({
      where: { email: registrDto.email },
    });

    if (existingEmail) {
      throw new ConflictException('Cet email est déjà utilisé');
    }

    //Hacher le mot de passe
    const passwordHash = await CryptoUtil.hashPassword(registrDto.password);

    //Créer l'utilisateur
    const newUser = this.userRepository.create({


    })
  }
}