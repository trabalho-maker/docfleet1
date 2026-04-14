import {
  hasExceededMaxLength,
  normalizeEmailInput,
  normalizePlainTextInput,
} from "@/lib/security/input";

export type SignUpInput = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export type SignUpValidationResult =
  | {
      success: true;
      data: {
        name: string;
        email: string;
        password: string;
      };
    }
  | {
      success: false;
      errors: Partial<Record<keyof SignUpInput, string>>;
    };

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_NAME_LENGTH = 120;
const MAX_EMAIL_LENGTH = 254;
const MAX_PASSWORD_LENGTH = 128;

export function validateEmailInput(email: string) {
  return emailPattern.test(normalizeEmailInput(email));
}

export function validatePasswordRules(password: string) {
  if (password.length < 8) {
    return "A senha deve ter pelo menos 8 caracteres.";
  }

  if (password.length > MAX_PASSWORD_LENGTH) {
    return `A senha deve ter no máximo ${MAX_PASSWORD_LENGTH} caracteres.`;
  }

  if (!/[A-Z]/.test(password)) {
    return "A senha deve conter ao menos uma letra maiúscula.";
  }

  if (!/[a-z]/.test(password)) {
    return "A senha deve conter ao menos uma letra minúscula.";
  }

  if (!/\d/.test(password)) {
    return "A senha deve conter ao menos um número.";
  }

  return null;
}

export function validateSignUpInput(
  input: SignUpInput,
): SignUpValidationResult {
  const name = normalizePlainTextInput(input.name);
  const email = normalizeEmailInput(input.email);
  const password = input.password;
  const confirmPassword = input.confirmPassword;
  const errors: Partial<Record<keyof SignUpInput, string>> = {};

  if (name.length < 3) {
    errors.name = "Informe um nome com pelo menos 3 caracteres.";
  } else if (hasExceededMaxLength(name, MAX_NAME_LENGTH)) {
    errors.name = `Informe um nome com no máximo ${MAX_NAME_LENGTH} caracteres.`;
  }

  if (!validateEmailInput(email)) {
    errors.email = "Informe um email válido.";
  } else if (hasExceededMaxLength(email, MAX_EMAIL_LENGTH)) {
    errors.email = `Informe um email com no máximo ${MAX_EMAIL_LENGTH} caracteres.`;
  }

  const passwordError = validatePasswordRules(password);

  if (passwordError) {
    errors.password = passwordError;
  }

  if (confirmPassword !== password) {
    errors.confirmPassword = "A confirmação de senha não confere.";
  }

  if (Object.keys(errors).length > 0) {
    return {
      success: false,
      errors,
    };
  }

  return {
    success: true,
    data: {
      name,
      email,
      password,
    },
  };
}

export function validatePasswordResetInput(password: string, confirmPassword: string) {
  const errors: { password?: string; confirmPassword?: string } = {};
  const passwordError = validatePasswordRules(password);

  if (passwordError) {
    errors.password = passwordError;
  }

  if (confirmPassword !== password) {
    errors.confirmPassword = "A confirmação de senha não confere.";
  }

  return errors;
}
