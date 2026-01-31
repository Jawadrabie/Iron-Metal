import { registerRootComponent } from 'expo';
import { I18nManager } from 'react-native';

// اجبار التطبيق على الاتجاه من اليسار إلى اليمين دائمًا (LTR)
I18nManager.allowRTL(false);
I18nManager.forceRTL(false);
I18nManager.swapLeftAndRightInRTL(false);

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
