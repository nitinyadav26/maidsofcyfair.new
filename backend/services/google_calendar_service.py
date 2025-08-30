import json
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from google.oauth2 import service_account
import os

class GoogleCalendarService:
    """Service to interact with Google Calendar API for cleaner scheduling"""
    
    def __init__(self):
        self.scopes = ['https://www.googleapis.com/auth/calendar.readonly']
        
    def create_service_from_credentials_dict(self, credentials_dict: dict):
        """Create calendar service from credentials dictionary"""
        try:
            credentials = Credentials.from_authorized_user_info(
                credentials_dict, 
                self.scopes
            )
            
            # Refresh token if needed
            if credentials.expired and credentials.refresh_token:
                credentials.refresh(Request())
            
            service = build('calendar', 'v3', credentials=credentials)
            return service
        except Exception as e:
            print(f"Error creating calendar service: {e}")
            return None
    
    def create_service_from_api_key(self, api_key: str):
        """Create calendar service from API key (limited functionality)"""
        try:
            # Note: API key only works for public calendars
            service = build('calendar', 'v3', developerKey=api_key)
            return service
        except Exception as e:
            print(f"Error creating calendar service with API key: {e}")
            return None
    
    def get_calendar_events(self, service, calendar_id='primary', days_ahead=30):
        """Get calendar events for the specified period"""
        try:
            # Time range
            now = datetime.utcnow()
            time_min = now.isoformat() + 'Z'
            time_max = (now + timedelta(days=days_ahead)).isoformat() + 'Z'
            
            # Call the Calendar API
            events_result = service.events().list(
                calendarId=calendar_id,
                timeMin=time_min,
                timeMax=time_max,
                singleEvents=True,
                orderBy='startTime'
            ).execute()
            
            events = events_result.get('items', [])
            return self._format_events(events)
            
        except Exception as e:
            print(f"Error getting calendar events: {e}")
            return []
    
    def get_busy_times(self, service, calendar_id='primary', date=None):
        """Get busy time slots for a specific date"""
        try:
            if date is None:
                date = datetime.now().date()
            
            # Start and end of the day
            start_time = datetime.combine(date, datetime.min.time())
            end_time = datetime.combine(date, datetime.max.time())
            
            time_min = start_time.isoformat() + 'Z'
            time_max = end_time.isoformat() + 'Z'
            
            # Get events for the day
            events_result = service.events().list(
                calendarId=calendar_id,
                timeMin=time_min,
                timeMax=time_max,
                singleEvents=True,
                orderBy='startTime'
            ).execute()
            
            events = events_result.get('items', [])
            busy_times = []
            
            for event in events:
                start = event['start'].get('dateTime', event['start'].get('date'))
                end = event['end'].get('dateTime', event['end'].get('date'))
                
                if start and end:
                    busy_times.append({
                        'start': start,
                        'end': end,
                        'summary': event.get('summary', 'Busy'),
                        'id': event.get('id')
                    })
            
            return busy_times
            
        except Exception as e:
            print(f"Error getting busy times: {e}")
            return []
    
    def check_availability(self, service, calendar_id='primary', start_time=None, end_time=None):
        """Check if cleaner is available during specified time"""
        try:
            if not start_time or not end_time:
                return True
            
            # Format times for API
            time_min = start_time.isoformat() + 'Z'
            time_max = end_time.isoformat() + 'Z'
            
            # Check for conflicting events
            events_result = service.events().list(
                calendarId=calendar_id,
                timeMin=time_min,
                timeMax=time_max,
                singleEvents=True,
                orderBy='startTime'
            ).execute()
            
            events = events_result.get('items', [])
            
            # If no events found, cleaner is available
            return len(events) == 0
            
        except Exception as e:
            print(f"Error checking availability: {e}")
            return True  # Default to available if error
    
    def create_job_event(self, service, calendar_id='primary', job_data=None):
        """Create a calendar event for a scheduled job"""
        try:
            if not job_data:
                return None
            
            event = {
                'summary': f"Cleaning Job - {job_data.get('customer_name', 'Customer')}",
                'description': f"""
                Job ID: {job_data.get('job_id', 'N/A')}
                Customer: {job_data.get('customer_name', 'N/A')}
                Address: {job_data.get('address', 'N/A')}
                Services: {job_data.get('services', 'Standard Cleaning')}
                Amount: ${job_data.get('amount', '0')}
                Special Instructions: {job_data.get('instructions', 'None')}
                """.strip(),
                'start': {
                    'dateTime': job_data.get('start_time'),
                    'timeZone': 'America/Chicago',  # Adjust timezone as needed
                },
                'end': {
                    'dateTime': job_data.get('end_time'),
                    'timeZone': 'America/Chicago',
                },
                'reminders': {
                    'useDefault': False,
                    'overrides': [
                        {'method': 'popup', 'minutes': 30},
                        {'method': 'popup', 'minutes': 10},
                    ],
                },
            }
            
            # Create the event
            created_event = service.events().insert(
                calendarId=calendar_id, 
                body=event
            ).execute()
            
            return created_event.get('id')
            
        except Exception as e:
            print(f"Error creating job event: {e}")
            return None
    
    def update_job_event(self, service, calendar_id='primary', event_id=None, job_data=None):
        """Update an existing calendar event"""
        try:
            if not event_id or not job_data:
                return False
            
            # Get existing event
            event = service.events().get(
                calendarId=calendar_id, 
                eventId=event_id
            ).execute()
            
            # Update event details
            event['summary'] = f"Cleaning Job - {job_data.get('customer_name', 'Customer')}"
            event['description'] = f"""
            Job ID: {job_data.get('job_id', 'N/A')}
            Status: {job_data.get('status', 'Scheduled')}
            Customer: {job_data.get('customer_name', 'N/A')}
            Address: {job_data.get('address', 'N/A')}
            Services: {job_data.get('services', 'Standard Cleaning')}
            Amount: ${job_data.get('amount', '0')}
            """.strip()
            
            if job_data.get('start_time'):
                event['start']['dateTime'] = job_data.get('start_time')
            if job_data.get('end_time'):
                event['end']['dateTime'] = job_data.get('end_time')
            
            # Update the event
            updated_event = service.events().update(
                calendarId=calendar_id,
                eventId=event_id,
                body=event
            ).execute()
            
            return True
            
        except Exception as e:
            print(f"Error updating job event: {e}")
            return False
    
    def delete_job_event(self, service, calendar_id='primary', event_id=None):
        """Delete a calendar event"""
        try:
            if not event_id:
                return False
            
            service.events().delete(
                calendarId=calendar_id,
                eventId=event_id
            ).execute()
            
            return True
            
        except Exception as e:
            print(f"Error deleting job event: {e}")
            return False
    
    def get_free_time_slots(self, service, calendar_id='primary', date=None, work_hours=None):
        """Get available time slots for a specific date"""
        try:
            if date is None:
                date = datetime.now().date()
            
            if work_hours is None:
                work_hours = {'start': 8, 'end': 18}  # 8 AM to 6 PM
            
            # Get busy times for the date
            busy_times = self.get_busy_times(service, calendar_id, date)
            
            # Generate all possible 2-hour slots during work hours
            all_slots = []
            current_hour = work_hours['start']
            
            while current_hour <= work_hours['end'] - 2:  # Ensure 2-hour slots
                slot_start = datetime.combine(date, datetime.min.time().replace(hour=current_hour))
                slot_end = slot_start + timedelta(hours=2)
                
                all_slots.append({
                    'start': slot_start,
                    'end': slot_end,
                    'start_time': f"{current_hour:02d}:00",
                    'end_time': f"{current_hour + 2:02d}:00"
                })
                
                current_hour += 2
            
            # Filter out busy slots
            free_slots = []
            for slot in all_slots:
                is_free = True
                
                for busy in busy_times:
                    busy_start = datetime.fromisoformat(busy['start'].replace('Z', '+00:00'))
                    busy_end = datetime.fromisoformat(busy['end'].replace('Z', '+00:00'))
                    
                    # Check for overlap
                    if (slot['start'] < busy_end and slot['end'] > busy_start):
                        is_free = False
                        break
                
                if is_free:
                    free_slots.append(slot)
            
            return free_slots
            
        except Exception as e:
            print(f"Error getting free time slots: {e}")
            return []
    
    def _format_events(self, events):
        """Format calendar events for consistent output"""
        formatted_events = []
        
        for event in events:
            start = event['start'].get('dateTime', event['start'].get('date'))
            end = event['end'].get('dateTime', event['end'].get('date'))
            
            formatted_events.append({
                'id': event.get('id'),
                'summary': event.get('summary', 'No Title'),
                'description': event.get('description', ''),
                'start': start,
                'end': end,
                'status': event.get('status', 'confirmed'),
                'created': event.get('created'),
                'updated': event.get('updated')
            })
        
        return formatted_events
    
    def validate_credentials(self, credentials_dict):
        """Validate Google Calendar credentials"""
        try:
            service = self.create_service_from_credentials_dict(credentials_dict)
            if service:
                # Try to make a simple API call to validate
                calendar_list = service.calendarList().list().execute()
                return True
            return False
        except Exception as e:
            print(f"Error validating credentials: {e}")
            return False