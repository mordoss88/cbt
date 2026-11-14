import { requireOptionalNativeModule } from 'expo';

const Native = requireOptionalNativeModule<{ getProps(name: string): string | null }>('WidgetProps');

/* Android only. Returns the widget's stored props as JSON text, or null. */
export function getWidgetPropsJson(name: string): string | null {
  try {
    return Native?.getProps(name) ?? null;
  } catch {
    return null;
  }
}
