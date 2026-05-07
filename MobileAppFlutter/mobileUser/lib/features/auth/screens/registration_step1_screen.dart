import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/app_button.dart';
import '../../../../core/widgets/app_input.dart';

const _tanzaBarangays = [
  'Amaya', 'Bagtas', 'Balsik', 'Bambang', 'Banaba Cerca', 'Banaba Lejos',
  'Banaba Kanluran', 'Banaba Silangan', 'Biluso', 'Canas', 'Daang Amaya I',
  'Daang Amaya II', 'Daang Amaya III', 'Halang', 'Humbac', 'Ibayo Estacion',
  'Ibayo Tipas', 'Lumampong Balagbag', 'Lumampong Halayhay', 'Mulawin',
  'Paradahan', 'Punta I', 'Punta II', 'Sahud Ulan', 'Sanja Mayor',
  'Santol', 'Tanauan', 'Tatlong Tulo', 'Tres Cruses',
];

const _bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

class RegistrationStep1Screen extends StatefulWidget {
  const RegistrationStep1Screen({super.key});

  @override
  State<RegistrationStep1Screen> createState() => _RegistrationStep1ScreenState();
}

class _RegistrationStep1ScreenState extends State<RegistrationStep1Screen> {
  final _formKey = GlobalKey<FormState>();
  final _nameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  final _confirmCtrl = TextEditingController();
  final _streetCtrl = TextEditingController();
  final _emergencyNameCtrl = TextEditingController();
  final _emergencyNumberCtrl = TextEditingController();
  String _municipality = 'Tanza';
  String? _barangay;
  String? _bloodType;
  DateTime? _dob;
  bool _obscure = true;
  bool _consent = false;

  @override
  void dispose() {
    _nameCtrl.dispose();
    _emailCtrl.dispose();
    _phoneCtrl.dispose();
    _passCtrl.dispose();
    _confirmCtrl.dispose();
    _streetCtrl.dispose();
    _emergencyNameCtrl.dispose();
    _emergencyNumberCtrl.dispose();
    super.dispose();
  }

  int? get _derivedAge {
    if (_dob == null) return null;
    final now = DateTime.now();
    var age = now.year - _dob!.year;
    if (now.month < _dob!.month ||
        (now.month == _dob!.month && now.day < _dob!.day)) {
      age--;
    }
    return age;
  }

  Future<void> _pickDob() async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: _dob ?? DateTime(now.year - 25),
      firstDate: DateTime(now.year - 120),
      lastDate: now,
      helpText: 'Select date of birth',
    );
    if (picked != null) {
      setState(() => _dob = picked);
    }
  }

  void _next() {
    if (!_formKey.currentState!.validate()) return;
    if (_dob == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select your date of birth.')),
      );
      return;
    }
    if (_bloodType == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select your blood type.')),
      );
      return;
    }
    if (!_consent) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please accept consent to location sharing.')),
      );
      return;
    }
    context.push('/register/step2', extra: {
      'name': _nameCtrl.text.trim(),
      'email': _emailCtrl.text.trim().toLowerCase(),
      'phone': _phoneCtrl.text.trim(),
      'password': _passCtrl.text,
      'municipality': _municipality,
      'barangay': _barangay ?? '',
      'streetAddress': _streetCtrl.text.trim(),
      'dateOfBirth': _dob!.toIso8601String(),
      'bloodType': _bloodType!,
      'emergencyContactName': _emergencyNameCtrl.text.trim(),
      'emergencyContactNumber': _emergencyNumberCtrl.text.trim(),
    });
  }

  @override
  Widget build(BuildContext context) {
    final dobLabel = _dob == null
        ? 'Select date of birth'
        : DateFormat.yMMMMd().format(_dob!);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Create Account'),
        leading: const BackButton(),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(4),
          child: LinearProgressIndicator(
            value: 0.5,
            backgroundColor: AppColors.border,
            color: AppColors.alertRed,
          ),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Personal Information',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
              const SizedBox(height: 4),
              const Text('Step 1 of 2 — Personal & contact details',
                  style: TextStyle(fontSize: 14, color: AppColors.textMuted)),
              const SizedBox(height: 24),
              AppInput(
                label: 'Full name',
                controller: _nameCtrl,
                validator: (v) =>
                    v == null || v.trim().isEmpty ? 'Full name is required' : null,
              ),
              const SizedBox(height: 16),
              AppInput(
                label: 'Email address',
                controller: _emailCtrl,
                keyboardType: TextInputType.emailAddress,
                validator: (v) =>
                    v == null || !v.contains('@') ? 'Enter a valid email' : null,
              ),
              const SizedBox(height: 16),
              AppInput(
                label: 'Mobile number',
                controller: _phoneCtrl,
                keyboardType: TextInputType.phone,
                validator: (v) =>
                    v == null || v.trim().length < 7 ? 'Enter a valid phone number' : null,
              ),
              const SizedBox(height: 16),
              AppInput(
                label: 'Password',
                controller: _passCtrl,
                obscureText: _obscure,
                suffix: IconButton(
                  icon: Icon(_obscure ? Icons.visibility_off : Icons.visibility),
                  onPressed: () => setState(() => _obscure = !_obscure),
                ),
                validator: (v) =>
                    v == null || v.length < 8 ? 'Password must be at least 8 characters' : null,
              ),
              const SizedBox(height: 16),
              AppInput(
                label: 'Confirm password',
                controller: _confirmCtrl,
                obscureText: true,
                validator: (v) => v != _passCtrl.text ? 'Passwords do not match' : null,
              ),
              const SizedBox(height: 24),
              const Text('Medical Details',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
              const SizedBox(height: 12),
              InkWell(
                onTap: _pickDob,
                child: InputDecorator(
                  decoration: const InputDecoration(
                    labelText: 'Date of birth',
                    suffixIcon: Icon(Icons.calendar_today, size: 18),
                  ),
                  child: Text(
                    dobLabel,
                    style: TextStyle(
                      fontSize: 15,
                      color: _dob == null ? AppColors.textMuted : null,
                    ),
                  ),
                ),
              ),
              if (_derivedAge != null) ...[
                const SizedBox(height: 6),
                Text('Age: ${_derivedAge!} years',
                    style: const TextStyle(fontSize: 12, color: AppColors.textMuted)),
              ],
              const SizedBox(height: 16),
              DropdownButtonFormField<String>(
                value: _bloodType,
                decoration: const InputDecoration(labelText: 'Blood type'),
                hint: const Text('Select blood type'),
                items: _bloodTypes
                    .map((b) => DropdownMenuItem(value: b, child: Text(b)))
                    .toList(),
                onChanged: (v) => setState(() => _bloodType = v),
                validator: (v) =>
                    v == null || v.isEmpty ? 'Select your blood type' : null,
              ),
              const SizedBox(height: 24),
              const Text('Address',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
              const SizedBox(height: 12),
              AppInput(
                label: 'Street / house no. / subdivision',
                controller: _streetCtrl,
                validator: (v) =>
                    v == null || v.trim().length < 2 ? 'Enter your residential address' : null,
              ),
              const SizedBox(height: 16),
              DropdownButtonFormField<String>(
                value: _municipality,
                decoration: const InputDecoration(labelText: 'Municipality / City'),
                items: const [
                  DropdownMenuItem(value: 'Tanza', child: Text('Tanza (Primary)')),
                  DropdownMenuItem(value: 'Other', child: Text('Other (Outside coverage)')),
                ],
                onChanged: (v) => setState(() => _municipality = v ?? 'Tanza'),
              ),
              const SizedBox(height: 16),
              DropdownButtonFormField<String>(
                value: _barangay,
                decoration: const InputDecoration(labelText: 'Barangay'),
                hint: const Text('Select barangay'),
                items: _tanzaBarangays
                    .map((b) => DropdownMenuItem(value: b, child: Text(b)))
                    .toList(),
                onChanged: (v) => setState(() => _barangay = v),
                validator: (v) =>
                    v == null || v.isEmpty ? 'Select your barangay' : null,
              ),
              const SizedBox(height: 24),
              const Text('Emergency Contact',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
              const SizedBox(height: 12),
              AppInput(
                label: 'Contact person name',
                controller: _emergencyNameCtrl,
                validator: (v) =>
                    v == null || v.trim().length < 2 ? 'Enter contact name' : null,
              ),
              const SizedBox(height: 16),
              AppInput(
                label: 'Contact number',
                controller: _emergencyNumberCtrl,
                keyboardType: TextInputType.phone,
                validator: (v) =>
                    v == null || v.trim().length < 7 ? 'Enter a valid phone number' : null,
              ),
              const SizedBox(height: 24),
              if (_municipality != 'Tanza')
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFEF3C7),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Row(
                    children: [
                      Icon(Icons.warning_amber, color: AppColors.warningAmber),
                      SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          'SafeAlert primarily serves Tanza Municipality. Outside-Tanza requests require admin review.',
                          style: TextStyle(fontSize: 12, color: AppColors.warningAmber),
                        ),
                      ),
                    ],
                  ),
                ),
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Checkbox(
                    value: _consent,
                    onChanged: (v) => setState(() => _consent = v ?? false),
                    activeColor: AppColors.alertRed,
                  ),
                  const Expanded(
                    child: Padding(
                      padding: EdgeInsets.only(top: 12),
                      child: Text(
                        'I consent to emergency location sharing with Tanza MDRRMO during active emergencies.',
                        style: TextStyle(fontSize: 13),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),
              AppButton(label: 'Continue', onPressed: _next),
              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
    );
  }
}
