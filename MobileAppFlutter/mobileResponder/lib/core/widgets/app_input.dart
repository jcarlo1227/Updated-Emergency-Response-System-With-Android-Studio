import 'package:flutter/material.dart';

class AppInput extends StatelessWidget {
  final String label;
  final TextEditingController? controller;
  final bool obscureText;
  final TextInputType keyboardType;
  final String? Function(String?)? validator;
  final Widget? suffix;
  final int maxLines;
  final bool readOnly;
  final VoidCallback? onTap;

  const AppInput({super.key, required this.label, this.controller, this.obscureText = false, this.keyboardType = TextInputType.text, this.validator, this.suffix, this.maxLines = 1, this.readOnly = false, this.onTap});

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      controller: controller,
      obscureText: obscureText,
      keyboardType: keyboardType,
      validator: validator,
      maxLines: maxLines,
      readOnly: readOnly,
      onTap: onTap,
      decoration: InputDecoration(labelText: label, suffixIcon: suffix),
    );
  }
}
