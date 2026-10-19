import { Suspense } from "react";
import VelltoSignupForm from "../components/VelltoSignupForm";
import { isPublicSignupAvailable } from "@/lib/vellto-public-signup-config";

// Atualiza o estado de cadastro conforme as variaveis reais do ambiente.
export const dynamic = "force-dynamic";

export default function CadastroPage() {
  return <Suspense fallback={<main className="min-h-screen p-8">Carregando cadastro...</main>}>
    <VelltoSignupForm signupAvailable={isPublicSignupAvailable()} />
  </Suspense>;
}
