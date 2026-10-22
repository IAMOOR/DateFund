export const calculatePasswordStrength = (password: string) => {
  if (!password) return 0;
  let strength = 0;
  if (password.length >= 8) strength += 1;
  if (/[A-Z]/.test(password)) strength += 1;
  if (/[a-z]/.test(password)) strength += 1;
  if (/[0-9]/.test(password)) strength += 1;
  if (/[^A-Za-z0-9]/.test(password)) strength += 1;
  return strength;
};

export const getStrengthColor = (score: number) => {
  if (score <= 2) return "bg-error";
  if (score <= 4) return "bg-secondary";
  return "bg-primary";
};

export const getStrengthLabel = (password: string, score: number) => {
  if (!password) return "";
  if (score <= 2) return "Weak";
  if (score <= 4) return "Fair";
  return "Strong";
};
