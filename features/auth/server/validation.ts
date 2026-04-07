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

export function validateEmailInput(email: string) {
  return emailPattern.test(email.trim().toLowerCase());
}

export function validatePasswordRules(password: string) {
  if (password.length < 8) {
    return "A senha deve ter pelo menos 8 caracteres.";
  }

  if (!/[A-Z]/.test(password)) {
    return "A senha deve conter ao menos uma letra maiuscula.";
  }

  if (!/[a-z]/.test(password)) {
    return "A senha deve conter ao menos uma letra minuscula.";
  }

  if (!/\d/.test(password)) {
    return "A senha deve conter ao menos um numero.";
  }

  return null;
}

export function validateSignUpInput(
  input: SignUpInput,
): SignUpValidationResult {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const password = input.password;
  const confirmPassword = input.confirmPassword;
  const errors: Partial<Record<keyof SignUpInput, string>> = {};

  if (name.length < 3) {
    errors.name = "Informe um nome com pelo menos 3 caracteres.";
  }

  if (!validateEmailInput(email)) {
    errors.email = "Informe um email valido.";
  }

  const passwordError = validatePasswordRules(password);

  if (passwordError) {
    errors.password = passwordError;
  }

  if (confirmPassword !== password) {
    errors.confirmPassword = "A confirmacao de senha nao confere.";
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
    errors.confirmPassword = "A confirmacao de senha nao confere.";
  }

  return errors;
}
