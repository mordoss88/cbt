package expo.modules.widgetprops

import android.content.Context
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * Reads a widget's current props on Android. expo-widgets keeps them in its own shared preferences
 * after a button press in the widget, but has no JS getter on Android (iOS has getTimeline()).
 * The app needs them to pick up ratings made on the widget while the app was closed.
 */
class WidgetPropsModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("WidgetProps")

    Function("getProps") { name: String ->
      val context = appContext.reactContext?.applicationContext ?: return@Function null
      context
        .getSharedPreferences("expo.modules.widgets", Context.MODE_PRIVATE)
        .getString("__expo_widgets_${name}_props", null)
    }
  }
}
