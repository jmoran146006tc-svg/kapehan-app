import { router, type Href } from 'expo-router';

export function goBack(fallbackHref: Href) {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace(fallbackHref);
  }
}
