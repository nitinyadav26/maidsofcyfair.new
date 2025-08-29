import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../services/auth_service.dart';
import '../services/job_service.dart';
import '../models/job.dart';
import '../utils/app_theme.dart';
import '../widgets/job_card.dart';
import '../widgets/stats_card.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  int _selectedIndex = 0;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _loadJobs();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadJobs() async {
    final authService = context.read<AuthService>();
    final jobService = context.read<JobService>();
    
    if (authService.currentCleaner != null) {
      await jobService.loadJobs(authService.currentCleaner!.id);
    }
  }

  Future<void> _logout() async {
    final authService = context.read<AuthService>();
    await authService.logout();
    if (mounted) {
      Navigator.of(context).pushReplacementNamed('/login');
    }
  }

  void _onBottomNavTap(int index) {
    setState(() {
      _selectedIndex = index;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Consumer<AuthService>(
          builder: (context, authService, child) {
            final cleaner = authService.currentCleaner;
            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Hello, ${cleaner?.firstName ?? 'Cleaner'}',
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                Text(
                  DateFormat('EEEE, MMMM d').format(DateTime.now()),
                  style: const TextStyle(
                    fontSize: 14,
                    color: AppTheme.gray500,
                    fontWeight: FontWeight.normal,
                  ),
                ),
              ],
            );
          },
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadJobs,
          ),
          PopupMenuButton<String>(
            onSelected: (value) {
              if (value == 'logout') {
                _logout();
              }
            },
            itemBuilder: (BuildContext context) => [
              const PopupMenuItem<String>(
                value: 'logout',
                child: Row(
                  children: [
                    Icon(Icons.logout, size: 20),
                    SizedBox(width: 8),
                    Text('Logout'),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
      body: IndexedStack(
        index: _selectedIndex,
        children: [
          _buildTodayJobsTab(),
          _buildAllJobsTab(),
          _buildProfileTab(),
        ],
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _selectedIndex,
        onTap: _onBottomNavTap,
        type: BottomNavigationBarType.fixed,
        selectedItemColor: AppTheme.primaryColor,
        unselectedItemColor: AppTheme.gray400,
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.today),
            label: 'Today',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.work),
            label: 'All Jobs',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.person),
            label: 'Profile',
          ),
        ],
      ),
    );
  }

  Widget _buildTodayJobsTab() {
    return Consumer<JobService>(
      builder: (context, jobService, child) {
        if (jobService.isLoading) {
          return const Center(
            child: CircularProgressIndicator(),
          );
        }

        final todaysJobs = jobService.todaysJobs;
        final completedJobs = todaysJobs.where((job) => job.isCompleted).length;
        final totalJobs = todaysJobs.length;

        return RefreshIndicator(
          onRefresh: _loadJobs,
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Stats Cards
                Row(
                  children: [
                    Expanded(
                      child: StatsCard(
                        title: 'Today\'s Jobs',
                        value: totalJobs.toString(),
                        icon: Icons.assignment,
                        color: AppTheme.primaryColor,
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: StatsCard(
                        title: 'Completed',
                        value: completedJobs.toString(),
                        icon: Icons.check_circle,
                        color: AppTheme.successColor,
                      ),
                    ),
                  ],
                ),
                
                const SizedBox(height: 24),
                
                // Section Title
                const Text(
                  'Today\'s Schedule',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: AppTheme.gray900,
                  ),
                ),
                
                const SizedBox(height: 16),
                
                // Today's Jobs List
                if (todaysJobs.isEmpty)
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(24),
                      child: Column(
                        children: [
                          Icon(
                            Icons.beach_access,
                            size: 48,
                            color: AppTheme.gray400,
                          ),
                          const SizedBox(height: 16),
                          Text(
                            'No jobs scheduled for today',
                            style: TextStyle(
                              fontSize: 16,
                              color: AppTheme.gray600,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'Enjoy your day off!',
                            style: TextStyle(
                              fontSize: 14,
                              color: AppTheme.gray500,
                            ),
                          ),
                        ],
                      ),
                    ),
                  )
                else
                  ...todaysJobs.map((job) => Padding(
                        padding: const EdgeInsets.only(bottom: 16),
                        child: JobCard(
                          job: job,
                          onTap: () => _navigateToJobDetail(job),
                        ),
                      )),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildAllJobsTab() {
    return Consumer<JobService>(
      builder: (context, jobService, child) {
        if (jobService.isLoading) {
          return const Center(
            child: CircularProgressIndicator(),
          );
        }

        return DefaultTabController(
          length: 3,
          child: Column(
            children: [
              const TabBar(
                labelColor: AppTheme.primaryColor,
                unselectedLabelColor: AppTheme.gray500,
                indicatorColor: AppTheme.primaryColor,
                tabs: [
                  Tab(text: 'Upcoming'),
                  Tab(text: 'Completed'),
                  Tab(text: 'All'),
                ],
              ),
              Expanded(
                child: TabBarView(
                  children: [
                    _buildJobsList(jobService.upcomingJobs),
                    _buildJobsList(jobService.completedJobs),
                    _buildJobsList(jobService.jobs),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildJobsList(List<Job> jobs) {
    if (jobs.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.work_off,
              size: 48,
              color: AppTheme.gray400,
            ),
            const SizedBox(height: 16),
            Text(
              'No jobs found',
              style: TextStyle(
                fontSize: 16,
                color: AppTheme.gray600,
              ),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadJobs,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: jobs.length,
        itemBuilder: (context, index) {
          final job = jobs[index];
          return Padding(
            padding: const EdgeInsets.only(bottom: 16),
            child: JobCard(
              job: job,
              onTap: () => _navigateToJobDetail(job),
            ),
          );
        },
      ),
    );
  }

  Widget _buildProfileTab() {
    return Consumer<AuthService>(
      builder: (context, authService, child) {
        final cleaner = authService.currentCleaner;
        
        return SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            children: [
              // Profile Card
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    children: [
                      CircleAvatar(
                        radius: 40,
                        backgroundColor: AppTheme.primaryColor,
                        child: Text(
                          cleaner?.firstName.substring(0, 1).toUpperCase() ?? 'C',
                          style: const TextStyle(
                            fontSize: 32,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),
                      Text(
                        cleaner?.fullName ?? 'Cleaner',
                        style: const TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        cleaner?.email ?? '',
                        style: TextStyle(
                          fontSize: 14,
                          color: AppTheme.gray600,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        cleaner?.phone ?? '',
                        style: TextStyle(
                          fontSize: 14,
                          color: AppTheme.gray600,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              
              const SizedBox(height: 24),
              
              // Stats Cards
              Consumer<JobService>(
                builder: (context, jobService, child) {
                  final totalJobs = jobService.jobs.length;
                  final completedJobs = jobService.completedJobs.length;
                  final completionRate = totalJobs > 0 
                      ? (completedJobs / totalJobs * 100).round()
                      : 0;
                  
                  return Column(
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: StatsCard(
                              title: 'Total Jobs',
                              value: totalJobs.toString(),
                              icon: Icons.work,
                              color: AppTheme.primaryColor,
                            ),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: StatsCard(
                              title: 'Completed',
                              value: completedJobs.toString(),
                              icon: Icons.check_circle,
                              color: AppTheme.successColor,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      Row(
                        children: [
                          Expanded(
                            child: StatsCard(
                              title: 'Rating',
                              value: '${cleaner?.rating.toStringAsFixed(1) ?? '0.0'}⭐',
                              icon: Icons.star,
                              color: AppTheme.warningColor,
                            ),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: StatsCard(
                              title: 'Completion Rate',
                              value: '$completionRate%',
                              icon: Icons.trending_up,
                              color: AppTheme.successColor,
                            ),
                          ),
                        ],
                      ),
                    ],
                  );
                },
              ),
              
              const SizedBox(height: 24),
              
              // Action Buttons
              Card(
                child: Column(
                  children: [
                    ListTile(
                      leading: const Icon(Icons.refresh),
                      title: const Text('Refresh Jobs'),
                      onTap: _loadJobs,
                    ),
                    const Divider(height: 1),
                    ListTile(
                      leading: const Icon(Icons.logout, color: AppTheme.errorColor),
                      title: const Text(
                        'Logout',
                        style: TextStyle(color: AppTheme.errorColor),
                      ),
                      onTap: _logout,
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  void _navigateToJobDetail(Job job) {
    final jobService = context.read<JobService>();
    jobService.selectJob(job);
    Navigator.of(context).pushNamed('/job-detail');
  }
}