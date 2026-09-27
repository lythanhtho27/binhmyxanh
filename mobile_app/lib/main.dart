import 'package:flutter/material.dart';
import 'screens/login_screen.dart';
import 'screens/home_screen.dart';
import 'services/api_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await ApiService.init();
  final savedUser = await ApiService.getSavedUser();
  runApp(BinhMyXanhApp(isLoggedIn: savedUser != null));
}

class BinhMyXanhApp extends StatelessWidget {
  final bool isLoggedIn;

  const BinhMyXanhApp({Key? key, required this.isLoggedIn}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Bình Mỹ Xanh - Nhật Ký Giọng Nói',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        primaryColor: const Color(0xFF2E7D32),
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF2E7D32),
          primary: const Color(0xFF2E7D32),
          secondary: const Color(0xFFF57C00),
          surface: Colors.white,
        ),
        scaffoldBackgroundColor: const Color(0xFFF8FAF7),
        appBarTheme: const AppBarTheme(
          backgroundColor: Color(0xFF2E7D32),
          foregroundColor: Colors.white,
          elevation: 0,
          centerTitle: false,
        ),
        fontFamily: 'Roboto',
      ),
      home: isLoggedIn ? const HomeScreen() : const LoginScreen(),
    );
  }
}
