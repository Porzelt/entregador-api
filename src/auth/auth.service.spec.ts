import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  const jwt = { signAsync: jest.fn(async () => 'token-falso') };
  const make = (courier: unknown) =>
    new AuthService({ findByEmail: jest.fn(async () => courier) } as any, jwt as any);

  it('devolve token com credenciais corretas', async () => {
    const passwordHash = await bcrypt.hash('senha-ok', 4);
    const service = make({ id: 'c1', name: 'Demo', online: false, passwordHash });
    const result = await service.login('a@example.com', 'senha-ok');
    expect(result.accessToken).toBe('token-falso');
    expect(result.courier).toEqual({ id: 'c1', name: 'Demo', online: false });
  });

  it('rejeita senha errada e e-mail desconhecido com a mesma mensagem', async () => {
    const passwordHash = await bcrypt.hash('senha-ok', 4);
    const comSenhaErrada = make({ id: 'c1', name: 'Demo', online: false, passwordHash });
    await expect(comSenhaErrada.login('a@example.com', 'x')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    await expect(make(null).login('b@example.com', 'x')).rejects.toThrow(
      'E-mail ou senha inválidos.',
    );
  });
});
