import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

import { auth, signIn } from "@/auth";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Sign in — Sheets Guide",
};

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ callbackUrl?: string }>;
};

export default async function SignInPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { callbackUrl } = await searchParams;
  const session = await auth();

  const localeRoot = `/${locale}`;
  const target = callbackUrl ?? localeRoot;

  if (session?.user) {
    redirect(target);
  }

  const t = await getTranslations("app");
  const tSignIn = await getTranslations("signIn");

  return (
    <main className="grid min-h-screen place-items-center bg-background px-4">
      <div className="w-full max-w-sm rounded-md border bg-card p-8 text-card-foreground shadow-1">
        <h1 className="text-2xl font-semibold tracking-tight">{t("name")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{tSignIn("intro")}</p>

        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: target });
          }}
          className="mt-6"
        >
          <Button type="submit" className="w-full">
            {tSignIn("continueWithGoogle")}
          </Button>
        </form>

        <p className="mt-4 text-xs text-muted-foreground">{tSignIn("scopeNote")}</p>
      </div>
    </main>
  );
}
