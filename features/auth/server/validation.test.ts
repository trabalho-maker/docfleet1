import {
  validatePasswordRules,
  validateSignUpInput,
} from "@/features/auth/server/validation";

describe("auth validation", () => {
  it("sanitizes signup name and email", () => {
    const result = validateSignUpInput({
      name: "  Maria \n da\tSilva  ",
      email: "  MARIA@DocFleet.Local \n",
      password: "Senha123",
      confirmPassword: "Senha123",
    });

    expect(result).toEqual({
      success: true,
      data: {
        name: "Maria da Silva",
        email: "maria@docfleet.local",
        password: "Senha123",
      },
    });
  });

  it("rejects signup names above the maximum allowed length", () => {
    const result = validateSignUpInput({
      name: "A".repeat(121),
      email: "maria@docfleet.local",
      password: "Senha123",
      confirmPassword: "Senha123",
    });

    expect(result.success).toBe(false);
    expect(result).toMatchObject({
      errors: {
        name: "Informe um nome com no maximo 120 caracteres.",
      },
    });
  });

  it("rejects passwords above the maximum allowed length", () => {
    expect(validatePasswordRules(`Senha${"1".repeat(124)}`)).toBe(
      "A senha deve ter no maximo 128 caracteres.",
    );
  });
});
