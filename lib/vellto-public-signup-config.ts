// Esta funcao afeta somente os CTAs de marketing e a tela de cadastro.
// O backend continua validando autorizacao e cobrancas por conta propria.
export function isPublicSignupAvailable() {
  const url = process.env.VELLTO_PUBLIC_URL || "";
  return process.env.VELLTO_PUBLIC_SIGNUP_ENABLED === "true" &&
    process.env.VELLTO_ONBOARDING_PAYMENTS_ENABLED === "true" &&
    process.env.VELLTO_ONBOARDING_LIVE_ENABLED === "true" &&
    Boolean(process.env.MERCADO_PAGO_ACCESS_TOKEN) &&
    /^https:\/\//.test(url);
}
