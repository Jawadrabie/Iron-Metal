// تعريفات الأنواع المشتركة للتطبيق

export interface User {
  id: string;
  email: string;
  name?: string;
}

export interface NavigationProps {
  navigation: any;
  route: any;
}

