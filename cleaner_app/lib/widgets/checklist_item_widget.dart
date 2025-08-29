import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../models/job.dart';
import '../utils/app_theme.dart';

class ChecklistItemWidget extends StatelessWidget {
  final JobChecklistItem item;
  final Function(bool) onChanged;

  const ChecklistItemWidget({
    super.key,
    required this.item,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      color: item.isCompleted 
          ? AppTheme.successColor.withOpacity(0.05)
          : Colors.white,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            // Checkbox
            GestureDetector(
              onTap: () => onChanged(!item.isCompleted),
              child: Container(
                width: 24,
                height: 24,
                decoration: BoxDecoration(
                  color: item.isCompleted 
                      ? AppTheme.successColor 
                      : Colors.transparent,
                  border: Border.all(
                    color: item.isCompleted 
                        ? AppTheme.successColor 
                        : AppTheme.gray300,
                    width: 2,
                  ),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: item.isCompleted
                    ? const Icon(
                        Icons.check,
                        size: 16,
                        color: Colors.white,
                      )
                    : null,
              ),
            ),
            
            const SizedBox(width: 16),
            
            // Content
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          item.title,
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                            color: item.isCompleted 
                                ? AppTheme.gray600
                                : AppTheme.gray900,
                            decoration: item.isCompleted 
                                ? TextDecoration.lineThrough
                                : null,
                          ),
                        ),
                      ),
                      if (item.isRequired)
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 6, 
                            vertical: 2,
                          ),
                          decoration: BoxDecoration(
                            color: AppTheme.errorColor.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: const Text(
                            'Required',
                            style: TextStyle(
                              fontSize: 10,
                              color: AppTheme.errorColor,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                    ],
                  ),
                  
                  const SizedBox(height: 4),
                  
                  Text(
                    item.description,
                    style: TextStyle(
                      fontSize: 14,
                      color: item.isCompleted 
                          ? AppTheme.gray500
                          : AppTheme.gray600,
                      decoration: item.isCompleted 
                          ? TextDecoration.lineThrough
                          : null,
                    ),
                  ),
                  
                  // Completion time
                  if (item.isCompleted && item.completedAt != null) ...[
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Icon(
                          Icons.access_time,
                          size: 14,
                          color: AppTheme.gray500,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          'Completed at ${DateFormat('HH:mm').format(item.completedAt!)}',
                          style: const TextStyle(
                            fontSize: 12,
                            color: AppTheme.gray500,
                          ),
                        ),
                      ],
                    ),
                  ],
                ],
              ),
            ),
            
            // Action Button
            if (!item.isCompleted)
              IconButton(
                onPressed: () => onChanged(true),
                icon: const Icon(
                  Icons.check_circle_outline,
                  color: AppTheme.successColor,
                ),
              )
            else
              IconButton(
                onPressed: () => onChanged(false),
                icon: const Icon(
                  Icons.undo,
                  color: AppTheme.gray400,
                ),
              ),
          ],
        ),
      ),
    );
  }
}