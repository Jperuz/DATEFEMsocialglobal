/// Constantes para la API
class ApiConstants {
  ApiConstants._();

  // URLs
  static const String baseUrl = 'https://api.datefem.com';
  static const String apiVersion = '/api/v1';
  static const String baseApiUrl = '$baseUrl$apiVersion';

  // Endpoints de Auth
  static const String login = '/auth/login';
  static const String register = '/auth/register';
  static const String refreshToken = '/auth/refresh';
  static const String logout = '/auth/logout';
  static const String me = '/auth/me';
  static const String changePassword = '/auth/change-password';
  static const String forgotPassword = '/auth/forgot-password';
  static const String resetPassword = '/auth/reset-password';

  // Endpoints de Usuarios
  static const String users = '/users';

  // Endpoints de Comunas
  static const String comunas = '/comunas';

  // Endpoints de Comercios
  static const String businesses = '/businesses';
  static const String myBusinesses = '/businesses/my-businesses';

  // Endpoints de Servicios
  static const String services = '/services';

  // Endpoints de Promociones
  static const String promotions = '/promotions';

  // Endpoints de Reservas
  static const String bookings = '/bookings';
  static const String availableSlots = '/bookings/available-slots';
  static const String validateQR = '/bookings/validate-qr';

  // Endpoints de Pagos
  static const String payments = '/payments';
  static const String mercadoPagoWebhook = '/payments/webhook/mercadopago';

  // Endpoints de Reseñas
  static const String reviews = '/reviews';

  // Endpoints de Notificaciones
  static const String notifications = '/notifications';

  // Endpoints de Verticales
  static const String verticals = '/verticals';

  // Endpoints de Categorías
  static const String categories = '/categories';

  // Timeouts
  static const int connectTimeout = 30000;
  static const int receiveTimeout = 30000;
  static const int sendTimeout = 30000;

  // Headers
  static const String authorizationHeader = 'Authorization';
  static const String bearerPrefix = 'Bearer';
  static const String contentTypeHeader = 'Content-Type';
  static const String applicationJson = 'application/json';
  static const String comunaIdHeader = 'X-Comuna-Id';
}
