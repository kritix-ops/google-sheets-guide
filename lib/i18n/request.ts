import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";

import { DEFAULT_LOCALE, routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : DEFAULT_LOCALE;

  const messages = (await import(`../../messages/${locale}.json`)).default;

  return {
    locale,
    messages,
  };
});
