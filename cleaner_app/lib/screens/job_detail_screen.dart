import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';
import '../services/job_service.dart';
import '../models/job.dart';
import '../utils/app_theme.dart';
import '../widgets/checklist_item_widget.dart';
import '../widgets/job_timer_widget.dart';

class JobDetailScreen extends StatefulWidget {
  const JobDetailScreen({super.key});

  @override
  State<JobDetailScreen> createState() => _JobDetailScreenState();
}

class _JobDetailScreenState extends State<JobDetailScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final _etaController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    _etaController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<JobService>(
      builder: (context, jobService, child) {
        final job = jobService.selectedJob;
        
        if (job == null) {
          return Scaffold(
            appBar: AppBar(
              title: const Text('Job Details'),
            ),
            body: const Center(
              child: Text('No job selected'),
            ),
          );
        }

        return Scaffold(
          appBar: AppBar(
            title: Text('Job #${job.id.substring(0, 8)}'),
            actions: [
              IconButton(
                icon: const Icon(Icons.phone),
                onPressed: () => _makePhoneCall(job),
              ),
            ],
          ),
          body: Column(
            children: [
              // Job Status Bar
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                color: _getStatusColor(job.status).withOpacity(0.1),
                child: Row(
                  children: [
                    Icon(
                      _getStatusIcon(job.status),
                      color: _getStatusColor(job.status),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      job.statusDisplayName,
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: _getStatusColor(job.status),
                      ),
                    ),
                    const Spacer(),
                    if (job.progress != null)
                      Text(
                        '${job.progress!.completionPercentage.round()}% Complete',
                        style: TextStyle(
                          fontSize: 14,
                          color: _getStatusColor(job.status),
                        ),
                      ),
                  ],
                ),
              ),
              
              // Tab Bar
              TabBar(
                controller: _tabController,
                labelColor: AppTheme.primaryColor,
                unselectedLabelColor: AppTheme.gray500,
                indicatorColor: AppTheme.primaryColor,
                tabs: const [
                  Tab(text: 'Details'),
                  Tab(text: 'Checklist'),
                  Tab(text: 'Timer'),
                ],
              ),
              
              // Tab Content
              Expanded(
                child: TabBarView(
                  controller: _tabController,
                  children: [
                    _buildDetailsTab(job),
                    _buildChecklistTab(job),
                    _buildTimerTab(job),
                  ],
                ),
              ),
            ],
          ),
          bottomNavigationBar: _buildBottomActions(job),
        );
      },
    );
  }

  Widget _buildDetailsTab(Job job) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Customer Info Card
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.person, color: AppTheme.primaryColor),
                      const SizedBox(width: 8),
                      const Text(
                        'Customer Information',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  _buildInfoRow('Customer ID', job.customerId.substring(0, 8)),
                  _buildInfoRow('Booking Date', _formatDate(job.bookingDate)),
                  _buildInfoRow('Time Slot', job.timeSlot),
                  if (job.specialInstructions != null)
                    _buildInfoRow('Special Instructions', job.specialInstructions!),
                ],
              ),
            ),
          ),
          
          const SizedBox(height: 16),
          
          // Job Details Card
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.home, color: AppTheme.primaryColor),
                      const SizedBox(width: 8),
                      const Text(
                        'Job Details',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  _buildInfoRow('House Size', job.houseSize),
                  _buildInfoRow('Frequency', _formatFrequency(job.frequency)),
                  _buildInfoRow('Base Price', '\$${job.basePrice.toStringAsFixed(2)}'),
                  if (job.aLaCarteTotal > 0)
                    _buildInfoRow('A La Carte', '\$${job.aLaCarteTotal.toStringAsFixed(2)}'),
                  _buildInfoRow('Total Amount', '\$${job.totalAmount.toStringAsFixed(2)}', 
                      isHighlighted: true),
                ],
              ),
            ),
          ),
          
          const SizedBox(height: 16),
          
          // Services Card
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.cleaning_services, color: AppTheme.primaryColor),
                      const SizedBox(width: 8),
                      const Text(
                        'Services',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  ...job.services.map((service) => Padding(
                        padding: const EdgeInsets.only(bottom: 8),
                        child: Row(
                          children: [
                            const Icon(Icons.check, size: 16, color: AppTheme.successColor),
                            const SizedBox(width: 8),
                            Text('Service ID: ${service.serviceId.substring(0, 8)}'),
                            const Spacer(),
                            Text('Qty: ${service.quantity}'),
                          ],
                        ),
                      )),
                  if (job.aLaCarteServices.isNotEmpty) ...[
                    const SizedBox(height: 8),
                    const Divider(),
                    const SizedBox(height: 8),
                    const Text(
                      'A La Carte Services:',
                      style: TextStyle(fontWeight: FontWeight.w600),
                    ),
                    const SizedBox(height: 8),
                    ...job.aLaCarteServices.map((service) => Padding(
                          padding: const EdgeInsets.only(bottom: 8),
                          child: Row(
                            children: [
                              const Icon(Icons.add, size: 16, color: AppTheme.warningColor),
                              const SizedBox(width: 8),
                              Text('Service ID: ${service.serviceId.substring(0, 8)}'),
                              const Spacer(),
                              Text('Qty: ${service.quantity}'),
                            ],
                          ),
                        )),
                  ],
                ],
              ),
            ),
          ),
          
          const SizedBox(height: 16),
          
          // ETA Update Card
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.schedule, color: AppTheme.primaryColor),
                      const SizedBox(width: 8),
                      const Text(
                        'Update ETA',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _etaController,
                          decoration: const InputDecoration(
                            hintText: 'e.g., Arriving in 15 minutes',
                            border: OutlineInputBorder(),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      ElevatedButton(
                        onPressed: () => _updateETA(job),
                        child: const Text('Update'),
                      ),
                    ],
                  ),
                  if (job.eta != null) ...[
                    const SizedBox(height: 8),
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: AppTheme.successColor.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        'Current ETA: ${job.eta}',
                        style: const TextStyle(
                          color: AppTheme.successColor,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildChecklistTab(Job job) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Progress Card
          if (job.progress != null)
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.trending_up, color: AppTheme.primaryColor),
                        const SizedBox(width: 8),
                        const Text(
                          'Progress',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    LinearProgressIndicator(
                      value: job.progress!.completionPercentage / 100,
                      backgroundColor: AppTheme.gray200,
                      valueColor: const AlwaysStoppedAnimation<Color>(AppTheme.successColor),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          '${job.progress!.completionPercentage.round()}% Complete',
                          style: const TextStyle(fontWeight: FontWeight.w600),
                        ),
                        Text(
                          job.progress!.currentTask,
                          style: const TextStyle(color: AppTheme.gray600),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          
          const SizedBox(height: 16),
          
          // Checklist Items
          const Text(
            'Checklist',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 16),
          
          if (job.checklist != null)
            ...job.checklist!.map((item) => Padding(
                  padding: const EdgeInsets.only(bottom: 16),
                  child: ChecklistItemWidget(
                    item: item,
                    onChanged: (isCompleted) {
                      final jobService = context.read<JobService>();
                      jobService.updateChecklistItem(job.id, item.id, isCompleted);
                    },
                  ),
                ))
          else
            const Card(
              child: Padding(
                padding: EdgeInsets.all(16),
                child: Text('No checklist available for this job.'),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildTimerTab(Job job) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          JobTimerWidget(job: job),
          const SizedBox(height: 24),
          
          // Work Summary Card
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Work Summary',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 16),
                  if (job.clockInTime != null)
                    _buildInfoRow('Clock In', DateFormat('HH:mm').format(job.clockInTime!)),
                  if (job.clockOutTime != null)
                    _buildInfoRow('Clock Out', DateFormat('HH:mm').format(job.clockOutTime!)),
                  if (job.workDuration != null) ...[
                    const Divider(),
                    _buildInfoRow(
                      'Total Work Time',
                      '${job.workDuration!.inHours}h ${job.workDuration!.inMinutes.remainder(60)}m',
                      isHighlighted: true,
                    ),
                  ],
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBottomActions(Job job) {
    final jobService = context.read<JobService>();
    
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: AppTheme.gray300.withOpacity(0.5),
            blurRadius: 10,
            offset: const Offset(0, -5),
          ),
        ],
      ),
      child: Row(
        children: [
          if (job.isPending || job.isConfirmed) ...[
            Expanded(
              child: ElevatedButton(
                onPressed: () => _startJob(job),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.successColor,
                ),
                child: const Text('Start Job'),
              ),
            ),
          ] else if (job.isInProgress) ...[
            Expanded(
              child: OutlinedButton(
                onPressed: () => _pauseJob(job),
                child: const Text('Pause'),
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: ElevatedButton(
                onPressed: () => _completeJob(job),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.successColor,
                ),
                child: const Text('Complete'),
              ),
            ),
          ] else if (job.isCompleted) ...[
            Expanded(
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 12),
                decoration: BoxDecoration(
                  color: AppTheme.successColor.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.check_circle, color: AppTheme.successColor),
                    SizedBox(width: 8),
                    Text(
                      'Job Completed',
                      style: TextStyle(
                        color: AppTheme.successColor,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildInfoRow(String label, String value, {bool isHighlighted = false}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 120,
            child: Text(
              label,
              style: TextStyle(
                fontSize: 14,
                color: AppTheme.gray600,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: TextStyle(
                fontSize: 14,
                fontWeight: isHighlighted ? FontWeight.w600 : FontWeight.normal,
                color: isHighlighted ? AppTheme.primaryColor : AppTheme.gray900,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'pending':
        return AppTheme.warningColor;
      case 'confirmed':
        return AppTheme.primaryColor;
      case 'in_progress':
        return AppTheme.successColor;
      case 'completed':
        return AppTheme.successColor;
      case 'cancelled':
        return AppTheme.errorColor;
      default:
        return AppTheme.gray500;
    }
  }

  IconData _getStatusIcon(String status) {
    switch (status) {
      case 'pending':
        return Icons.schedule;
      case 'confirmed':
        return Icons.check_circle_outline;
      case 'in_progress':
        return Icons.work;
      case 'completed':
        return Icons.check_circle;
      case 'cancelled':
        return Icons.cancel;
      default:
        return Icons.help_outline;
    }
  }

  String _formatDate(String dateStr) {
    final date = DateTime.parse(dateStr);
    return DateFormat('EEEE, MMMM d, y').format(date);
  }

  String _formatFrequency(String frequency) {
    switch (frequency) {
      case 'one_time':
        return 'One Time';
      case 'weekly':
        return 'Weekly';
      case 'bi_weekly':
        return 'Bi-Weekly';
      case 'monthly':
        return 'Monthly';
      case 'every_3_weeks':
        return 'Every 3 Weeks';
      default:
        return frequency.replaceAll('_', ' ').toUpperCase();
    }
  }

  void _startJob(Job job) {
    final jobService = context.read<JobService>();
    jobService.clockIn(job.id);
    
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Job started successfully'),
        backgroundColor: AppTheme.successColor,
      ),
    );
  }

  void _pauseJob(Job job) {
    final jobService = context.read<JobService>();
    jobService.updateJobStatus(job.id, 'confirmed');
    
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Job paused'),
        backgroundColor: AppTheme.warningColor,
      ),
    );
  }

  void _completeJob(Job job) {
    final jobService = context.read<JobService>();
    jobService.clockOut(job.id);
    jobService.updateJobStatus(job.id, 'completed');
    
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Job completed successfully'),
        backgroundColor: AppTheme.successColor,
      ),
    );
  }

  void _updateETA(Job job) {
    if (_etaController.text.isNotEmpty) {
      final jobService = context.read<JobService>();
      jobService.updateETA(job.id, _etaController.text);
      _etaController.clear();
      
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('ETA updated successfully'),
          backgroundColor: AppTheme.successColor,
        ),
      );
    }
  }

  void _makePhoneCall(Job job) async {
    // In a real app, you would get the customer's phone number
    // For demo purposes, we'll show a dialog
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Text('Contact Customer'),
          content: const Text(
            'In a real implementation, this would dial the customer\'s phone number.',
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('OK'),
            ),
          ],
        );
      },
    );
  }
}