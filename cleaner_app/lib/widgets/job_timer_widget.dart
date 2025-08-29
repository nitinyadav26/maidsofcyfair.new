import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../models/job.dart';
import '../services/job_service.dart';
import '../utils/app_theme.dart';

class JobTimerWidget extends StatefulWidget {
  final Job job;

  const JobTimerWidget({
    super.key,
    required this.job,
  });

  @override
  State<JobTimerWidget> createState() => _JobTimerWidgetState();
}

class _JobTimerWidgetState extends State<JobTimerWidget>
    with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  late Animation<double> _pulseAnimation;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: const Duration(seconds: 2),
      vsync: this,
    );
    _pulseAnimation = Tween<double>(
      begin: 1.0,
      end: 1.1,
    ).animate(CurvedAnimation(
      parent: _animationController,
      curve: Curves.easeInOut,
    ));

    if (widget.job.isInProgress && widget.job.clockOutTime == null) {
      _animationController.repeat(reverse: true);
    }
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // Main Timer Card
        Card(
          color: widget.job.isInProgress 
              ? AppTheme.successColor.withOpacity(0.05)
              : Colors.white,
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              children: [
                // Timer Display
                AnimatedBuilder(
                  animation: _animationController,
                  builder: (context, child) {
                    return Transform.scale(
                      scale: widget.job.isInProgress && widget.job.clockOutTime == null
                          ? _pulseAnimation.value
                          : 1.0,
                      child: Container(
                        width: 120,
                        height: 120,
                        decoration: BoxDecoration(
                          color: _getTimerColor(),
                          shape: BoxShape.circle,
                          boxShadow: [
                            BoxShadow(
                              color: _getTimerColor().withOpacity(0.3),
                              blurRadius: 20,
                              offset: const Offset(0, 10),
                            ),
                          ],
                        ),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              _getTimerIcon(),
                              size: 32,
                              color: Colors.white,
                            ),
                            const SizedBox(height: 4),
                            Text(
                              _getCurrentDuration(),
                              style: const TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                                color: Colors.white,
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
                
                const SizedBox(height: 24),
                
                // Status Text
                Text(
                  _getStatusText(),
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w600,
                    color: AppTheme.gray800,
                  ),
                ),
                
                const SizedBox(height: 8),
                
                Text(
                  _getSubStatusText(),
                  style: const TextStyle(
                    fontSize: 14,
                    color: AppTheme.gray600,
                  ),
                  textAlign: TextAlign.center,
                ),
                
                const SizedBox(height: 24),
                
                // Action Buttons
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: [
                    if (widget.job.clockInTime == null) ...[
                      ElevatedButton.icon(
                        onPressed: _clockIn,
                        icon: const Icon(Icons.play_arrow),
                        label: const Text('Clock In'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.successColor,
                        ),
                      ),
                    ] else if (widget.job.clockOutTime == null) ...[
                      OutlinedButton.icon(
                        onPressed: _clockOut,
                        icon: const Icon(Icons.stop),
                        label: const Text('Clock Out'),
                      ),
                    ] else ...[
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 8,
                        ),
                        decoration: BoxDecoration(
                          color: AppTheme.successColor.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              Icons.check_circle,
                              color: AppTheme.successColor,
                              size: 20,
                            ),
                            SizedBox(width: 8),
                            Text(
                              'Time Tracked',
                              style: TextStyle(
                                color: AppTheme.successColor,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ],
                ),
              ],
            ),
          ),
        ),
        
        const SizedBox(height: 16),
        
        // Time Details Card
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Time Details',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 12),
                
                if (widget.job.clockInTime != null)
                  _buildTimeRow(
                    'Clock In Time',
                    DateFormat('HH:mm - MMM d').format(widget.job.clockInTime!),
                    Icons.login,
                  ),
                
                if (widget.job.clockOutTime != null)
                  _buildTimeRow(
                    'Clock Out Time',
                    DateFormat('HH:mm - MMM d').format(widget.job.clockOutTime!),
                    Icons.logout,
                  ),
                
                if (widget.job.workDuration != null) ...[
                  const Divider(),
                  _buildTimeRow(
                    'Total Work Time',
                    _formatDuration(widget.job.workDuration!),
                    Icons.schedule,
                    isHighlighted: true,
                  ),
                ],
                
                // Scheduled time for comparison
                const Divider(),
                _buildTimeRow(
                  'Scheduled Time',
                  widget.job.timeSlot,
                  Icons.event_available,
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildTimeRow(
    String label,
    String value,
    IconData icon, {
    bool isHighlighted = false,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          Icon(
            icon,
            size: 20,
            color: isHighlighted ? AppTheme.primaryColor : AppTheme.gray500,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              label,
              style: TextStyle(
                fontSize: 14,
                color: AppTheme.gray600,
              ),
            ),
          ),
          Text(
            value,
            style: TextStyle(
              fontSize: 14,
              fontWeight: isHighlighted ? FontWeight.w600 : FontWeight.normal,
              color: isHighlighted ? AppTheme.primaryColor : AppTheme.gray900,
            ),
          ),
        ],
      ),
    );
  }

  Color _getTimerColor() {
    if (widget.job.clockInTime == null) {
      return AppTheme.gray400;
    } else if (widget.job.clockOutTime == null) {
      return AppTheme.successColor;
    } else {
      return AppTheme.primaryColor;
    }
  }

  IconData _getTimerIcon() {
    if (widget.job.clockInTime == null) {
      return Icons.play_arrow;
    } else if (widget.job.clockOutTime == null) {
      return Icons.timer;
    } else {
      return Icons.check;
    }
  }

  String _getCurrentDuration() {
    if (widget.job.clockInTime == null) {
      return '00:00';
    } else if (widget.job.clockOutTime == null) {
      final duration = DateTime.now().difference(widget.job.clockInTime!);
      return _formatDuration(duration);
    } else {
      return _formatDuration(widget.job.workDuration!);
    }
  }

  String _getStatusText() {
    if (widget.job.clockInTime == null) {
      return 'Ready to Start';
    } else if (widget.job.clockOutTime == null) {
      return 'Currently Working';
    } else {
      return 'Work Completed';
    }
  }

  String _getSubStatusText() {
    if (widget.job.clockInTime == null) {
      return 'Tap "Clock In" when you arrive and are ready to start working';
    } else if (widget.job.clockOutTime == null) {
      return 'Timer is running. Remember to clock out when you finish the job';
    } else {
      return 'You have successfully completed and tracked time for this job';
    }
  }

  String _formatDuration(Duration duration) {
    final hours = duration.inHours;
    final minutes = duration.inMinutes.remainder(60);
    return '${hours.toString().padLeft(2, '0')}:${minutes.toString().padLeft(2, '0')}';
  }

  void _clockIn() {
    final jobService = context.read<JobService>();
    jobService.clockIn(widget.job.id);
    
    // Start animation
    _animationController.repeat(reverse: true);
    
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Clocked in successfully'),
        backgroundColor: AppTheme.successColor,
      ),
    );
  }

  void _clockOut() {
    final jobService = context.read<JobService>();
    jobService.clockOut(widget.job.id);
    
    // Stop animation
    _animationController.stop();
    _animationController.reset();
    
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Clocked out successfully'),
        backgroundColor: AppTheme.primaryColor,
      ),
    );
  }
}