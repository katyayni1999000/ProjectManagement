import { Injectable, UnauthorizedException, ConflictException, OnModuleInit } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import { join } from 'path';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
}

@Injectable()
export class AuthService implements OnModuleInit {
  private users: User[] = [];
  private readonly usersFilePath = join(process.cwd(), 'data', 'users.json');

  constructor(private readonly jwtService: JwtService) {}

  async onModuleInit() {
    await this.loadUsers();
  }

  private async loadUsers() {
    try {
      const file = await fs.readFile(this.usersFilePath, 'utf-8');
      const parsed = JSON.parse(file) as User[];
      if (Array.isArray(parsed)) {
        this.users = parsed;
      }
    } catch (error: unknown) {
      if (typeof error === 'object' && error !== null && 'code' in error) {
        const nodeError = error as { code?: string };
        if (nodeError.code === 'ENOENT') {
          await this.ensureUsersFile();
          return;
        }
      }
      throw error;
    }
  }

  private async ensureUsersFile() {
    await fs.mkdir(join(process.cwd(), 'data'), { recursive: true });
    await fs.writeFile(this.usersFilePath, JSON.stringify([], null, 2));
  }

  private async saveUsers() {
    await fs.mkdir(join(process.cwd(), 'data'), { recursive: true });
    await fs.writeFile(this.usersFilePath, JSON.stringify(this.users, null, 2));
  }

  async register(registerDto: RegisterDto) {
    const existing = this.users.find((u) => u.email === registerDto.email);
    if (existing) {
      throw new ConflictException('Email already in use');
    }

    const passwordHash = await bcrypt.hash(registerDto.password, 10);
    const user: User = {
      id: randomUUID(),
      email: registerDto.email,
      passwordHash,
      name: registerDto.name,
    };

    this.users.push(user);
    await this.saveUsers();

    return {
      id: user.id,
      email: user.email,
      name: user.name,
    };
  }

  async validateUser(email: string, password: string): Promise<User> {
    const user = this.users.find((u) => u.email === email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    const payload = { sub: user.id, email: user.email };
    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }
}
