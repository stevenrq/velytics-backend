import { pwnedPassword } from 'hibp';
import { PasswordPolicyService } from './password-policy.service';
import { BreachedPasswordException } from './exceptions/user.exceptions';

const mockedPwnedPassword = pwnedPassword as jest.Mock;

describe('PasswordPolicyService', () => {
  let service: PasswordPolicyService;

  beforeEach(() => {
    service = new PasswordPolicyService();
    mockedPwnedPassword.mockReset();
  });

  it('throws BreachedPasswordException when the password appears in a breach', async () => {
    mockedPwnedPassword.mockResolvedValue(42);

    await expect(
      service.assertNotBreached('password123'),
    ).rejects.toBeInstanceOf(BreachedPasswordException);
  });

  it('resolves silently when the password is not found in any breach', async () => {
    mockedPwnedPassword.mockResolvedValue(0);

    await expect(
      service.assertNotBreached('a-long-unique-passphrase'),
    ).resolves.toBeUndefined();
  });

  it('fails open (resolves silently) when the HIBP API is unavailable', async () => {
    mockedPwnedPassword.mockRejectedValue(new Error('network timeout'));

    await expect(
      service.assertNotBreached('a-long-unique-passphrase'),
    ).resolves.toBeUndefined();
  });
});
