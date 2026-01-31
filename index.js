import { registerRootComponent } from 'expo';
import { I18nManager } from 'react-native';

// اجبار التطبيق على الاتجاه من اليسار إلى اليمين دائمًا (LTR)
I18nManager.allowRTL(false);
I18nManager.forceRTL(false);
I18nManager.swapLeftAndRightInRTL(false);

import App from './App';

registerRootComponent(App);

