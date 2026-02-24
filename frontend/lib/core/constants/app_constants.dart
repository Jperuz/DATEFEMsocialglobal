/// Constantes generales de la aplicación
class AppConstants {
  AppConstants._();

  // Información de la app
  static const String appName = 'DATEFEM';
  static const String appVersion = '1.0.0';
  static const String appSlogan = 'Reserva tu momento';

  // Almacenamiento local
  static const String tokenKey = 'auth_token';
  static const String refreshTokenKey = 'refresh_token';
  static const String userKey = 'user_data';
  static const String comunaKey = 'selected_comuna';
  static const String onboardingKey = 'onboarding_seen';

  // Paginación
  static const int defaultPageSize = 20;
  static const int maxPageSize = 100;

  // Formatos de fecha
  static const String dateFormat = 'dd/MM/yyyy';
  static const String timeFormat = 'HH:mm';
  static const String dateTimeFormat = 'dd/MM/yyyy HH:mm';
  static const String apiDateFormat = 'yyyy-MM-dd';

  // Moneda
  static const String currencySymbol = '\$';
  static const String currencyCode = 'ARS';

  // Verticales
  static const Map<String, String> verticalNames = {
    'SALUD': 'Salud',
    'BELLEZA': 'Belleza',
    'DATEFIT': 'DateFit',
    'SERVICIOS': 'Servicios',
    'BIENESTAR': 'Bienestar',
  };

  static const Map<String, String> verticalIcons = {
    'SALUD': 'heart-pulse',
    'BELLEZA': 'sparkles',
    'DATEFIT': 'dumbbell',
    'SERVICIOS': 'briefcase',
    'BIENESTAR': 'lotus',
  };

  // Estados de reserva
  static const Map<String, String> bookingStatusNames = {
    'PENDING': 'Pendiente',
    'CONFIRMED': 'Confirmada',
    'IN_PROGRESS': 'En curso',
    'COMPLETED': 'Completada',
    'CANCELLED': 'Cancelada',
    'NO_SHOW': 'No asistió',
  };

  static const Map<String, int> bookingStatusColors = {
    'PENDING': 0xFFFFA726,
    'CONFIRMED': 0xFF66BB6A,
    'IN_PROGRESS': 0xFF42A5F5,
    'COMPLETED': 0xFF9E9E9E,
    'CANCELLED': 0xFFEF5350,
    'NO_SHOW': 0xFF8D6E63,
  };

  // Roles
  static const Map<String, String> roleNames = {
    'SUPER_ADMIN': 'Administrador',
    'COMUNA_ADMIN': 'Admin de Comuna',
    'BUSINESS_OWNER': 'Dueño de Negocio',
    'BUSINESS_STAFF': 'Personal',
    'CUSTOMER': 'Cliente',
  };
}
