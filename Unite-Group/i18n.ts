import { notFound } from 'next/navigation';
import { getRequestConfig } from 'next-intl/server';
import { locales } from './src/i18n';

export default getRequestConfig(async ({ locale }) => {
  // Validate that the incoming locale is supported
  if (!locales.includes(locale as any)) {
    notFound();
  }

  return {
    messages: await import(`./public/locales/${locale}/common.json`).then(
      (module) => module.default
    ),
  };
});
