import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../models/job.dart';
import '../utils/app_theme.dart';

class JobCard extends StatelessWidget {
  final Job job;
  final VoidCallback onTap;

  const JobCard({
    super.key,
    required this.job,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header Row
              Row(
                children: [
                  Expanded(
                    child: Text(
                      'Job #${job.id.substring(0, 8)}',
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                  _buildStatusBadge(job.status),
                ],
              ),
              
              const SizedBox(height: 12),
              
              // Job Info
              Row(
                children: [
                  Icon(
                    Icons.schedule,
                    size: 16,
                    color: AppTheme.gray500,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    _formatDateTime(job.bookingDate, job.timeSlotStart),
                    style: TextStyle(
                      fontSize: 14,
                      color: AppTheme.gray600,
                    ),
                  ),
                ],
              ),
              
              const SizedBox(height: 8),
              
              Row(
                children: [
                  Icon(
                    Icons.home,
                    size: 16,
                    color: AppTheme.gray500,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    '${job.houseSize} • ${_formatFrequency(job.frequency)}',
                    style: TextStyle(
                      fontSize: 14,
                      color: AppTheme.gray600,
                    ),
                  ),
                ],
              ),
              
              const SizedBox(height: 8),
              
              Row(
                children: [
                  Icon(
                    Icons.attach_money,
                    size: 16,
                    color: AppTheme.gray500,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    '\$${job.totalAmount.toStringAsFixed(2)}',
                    style: TextStyle(
                      fontSize: 14,
                      color: AppTheme.gray600,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
              
              // Progress Bar (if job is in progress)
              if (job.isInProgress && job.progress != null) ...[
                const SizedBox(height: 12),
                LinearProgressIndicator(
                  value: job.progress!.completionPercentage / 100,
                  backgroundColor: AppTheme.gray200,
                  valueColor: const AlwaysStoppedAnimation<Color>(AppTheme.successColor),
                ),
                const SizedBox(height: 4),
                Text(
                  '${job.progress!.completionPercentage.round()}% Complete',
                  style: const TextStyle(
                    fontSize: 12,
                    color: AppTheme.gray500,
                  ),
                ),
              ],
              
              // Special Instructions Preview
              if (job.specialInstructions != null && job.specialInstructions!.isNotEmpty) ...[
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: AppTheme.gray50,
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        Icons.note,
                        size: 16,
                        color: AppTheme.gray500,
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          job.specialInstructions!,
                          style: TextStyle(
                            fontSize: 12,
                            color: AppTheme.gray600,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
              
              // ETA Display
              if (job.eta != null) ...[
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppTheme.primaryColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        Icons.access_time,
                        size: 14,
                        color: AppTheme.primaryColor,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        'ETA: ${job.eta}',
                        style: const TextStyle(
                          fontSize: 12,
                          color: AppTheme.primaryColor,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatusBadge(String status) {
    Color backgroundColor;
    Color textColor;
    String displayText;

    switch (status) {
      case 'pending':
        backgroundColor = AppTheme.warningColor.withOpacity(0.1);
        textColor = AppTheme.warningColor;
        displayText = 'Pending';
        break;
      case 'confirmed':
        backgroundColor = AppTheme.primaryColor.withOpacity(0.1);
        textColor = AppTheme.primaryColor;
        displayText = 'Confirmed';
        break;
      case 'in_progress':
        backgroundColor = AppTheme.successColor.withOpacity(0.1);
        textColor = AppTheme.successColor;
        displayText = 'In Progress';
        break;
      case 'completed':
        backgroundColor = AppTheme.successColor.withOpacity(0.1);
        textColor = AppTheme.successColor;
        displayText = 'Completed';
        break;
      case 'cancelled':
        backgroundColor = AppTheme.errorColor.withOpacity(0.1);
        textColor = AppTheme.errorColor;
        displayText = 'Cancelled';
        break;
      default:
        backgroundColor = AppTheme.gray100;
        textColor = AppTheme.gray600;
        displayText = status.toUpperCase();
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        displayText,
        style: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w600,
          color: textColor,
        ),
      ),
    );
  }

  String _formatDateTime(String dateStr, String timeStr) {
    try {
      final date = DateTime.parse(dateStr);
      final dateFormat = DateFormat('MMM d');
      final timeFormat = timeStr;
      
      final today = DateTime.now();
      final tomorrow = today.add(const Duration(days: 1));
      
      if (date.year == today.year && 
          date.month == today.month && 
          date.day == today.day) {
        return 'Today at $timeFormat';
      } else if (date.year == tomorrow.year && 
                 date.month == tomorrow.month && 
                 date.day == tomorrow.day) {
        return 'Tomorrow at $timeFormat';
      } else {
        return '${dateFormat.format(date)} at $timeFormat';
      }
    } catch (e) {
      return '$dateStr at $timeStr';
    }
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
}