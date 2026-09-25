import { router, type Href } from 'expo-router';

export function blurActiveElement() {
  if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }
}

export function goBack(fallbackHref: Href) {
  blurActiveElement();
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace(fallbackHref);
  }
}
