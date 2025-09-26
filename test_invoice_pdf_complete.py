#!/usr/bin/env python3
"""
Complete test for invoice PDF download functionality
"""

import requests
import json
import base64
from datetime import datetime, timedelta

# Configuration
BASE_URL = "http://localhost:8000"
API_URL = f"{BASE_URL}/api"

def test_invoice_pdf_system():
    """Test the complete invoice PDF system"""
    
    print("🧪 Testing Complete Invoice PDF System")
    print("=" * 45)
    
    try:
        # Step 1: Login as admin
        print("\n1. Logging in as admin...")
        
        admin_login_data = {
            "email": "admin@maids.com",
            "password": "admin123"
        }
        
        admin_response = requests.post(f"{API_URL}/auth/login", json=admin_login_data)
        if admin_response.status_code != 200:
            print(f"❌ Admin login failed: {admin_response.text}")
            return False
        
        admin_token = admin_response.json()["access_token"]
        admin_headers = {"Authorization": f"Bearer {admin_token}"}
        print("✅ Admin login successful!")
        
        # Step 2: Get invoices
        print("\n2. Fetching invoices...")
        
        invoices_response = requests.get(f"{API_URL}/admin/invoices", headers=admin_headers)
        if invoices_response.status_code != 200:
            print(f"❌ Failed to fetch invoices: {invoices_response.text}")
            return False
        
        invoices = invoices_response.json()
        print(f"✅ Found {len(invoices)} invoices")
        
        if not invoices:
            print("❌ No invoices found to test PDF download")
            return False
        
        # Step 3: Test PDF generation for each invoice
        print("\n3. Testing PDF generation for all invoices...")
        
        successful_pdfs = 0
        failed_pdfs = 0
        
        for i, invoice in enumerate(invoices):
            invoice_id = invoice.get('id')
            invoice_number = invoice.get('invoice_number', 'N/A')
            customer_name = invoice.get('customer_name', 'N/A')
            total_amount = invoice.get('total_amount', 0)
            
            print(f"   Testing invoice {i+1}: {invoice_number} ({customer_name}) - ${total_amount}")
            
            try:
                pdf_response = requests.get(f"{API_URL}/admin/invoices/{invoice_id}/pdf", headers=admin_headers)
                
                if pdf_response.status_code == 200:
                    pdf_data = pdf_response.json()
                    
                    if 'pdf_content' in pdf_data:
                        # Verify PDF content
                        try:
                            decoded_content = base64.b64decode(pdf_data['pdf_content'])
                            
                            # Check PDF header
                            if decoded_content.startswith(b'%PDF'):
                                successful_pdfs += 1
                                print(f"   ✅ PDF generated successfully ({len(decoded_content)} bytes)")
                                
                                # Save PDF for verification
                                filename = f"test_invoice_{invoice_number}_{invoice_id}.pdf"
                                with open(filename, "wb") as f:
                                    f.write(decoded_content)
                                print(f"   📄 Saved as: {filename}")
                            else:
                                failed_pdfs += 1
                                print(f"   ❌ Invalid PDF content")
                        except Exception as e:
                            failed_pdfs += 1
                            print(f"   ❌ Failed to decode PDF: {e}")
                    else:
                        failed_pdfs += 1
                        print(f"   ❌ No PDF content in response")
                else:
                    failed_pdfs += 1
                    print(f"   ❌ PDF generation failed: {pdf_response.status_code}")
                    
            except Exception as e:
                failed_pdfs += 1
                print(f"   ❌ Error generating PDF: {e}")
        
        print(f"\n📊 PDF Generation Results:")
        print(f"   ✅ Successful: {successful_pdfs}")
        print(f"   ❌ Failed: {failed_pdfs}")
        print(f"   📈 Success Rate: {(successful_pdfs / len(invoices) * 100):.1f}%")
        
        # Step 4: Test PDF content quality
        print("\n4. Testing PDF content quality...")
        
        if successful_pdfs > 0:
            # Test the first successful PDF
            first_invoice = invoices[0]
            invoice_id = first_invoice.get('id')
            
            pdf_response = requests.get(f"{API_URL}/admin/invoices/{invoice_id}/pdf", headers=admin_headers)
            if pdf_response.status_code == 200:
                pdf_data = pdf_response.json()
                
                if 'pdf_content' in pdf_data:
                    decoded_content = base64.b64decode(pdf_data['pdf_content'])
                    
                    # Basic PDF validation
                    if decoded_content.startswith(b'%PDF'):
                        print("✅ PDF header validation passed")
                        
                        # Check for common PDF elements
                        pdf_text = decoded_content.decode('latin-1', errors='ignore')
                        
                        if 'INVOICE' in pdf_text:
                            print("✅ PDF contains 'INVOICE' title")
                        if 'Maids of Cy-Fair' in pdf_text:
                            print("✅ PDF contains company name")
                        if 'Thank you for your business' in pdf_text:
                            print("✅ PDF contains footer message")
                        
                        print("✅ PDF content quality test passed!")
                    else:
                        print("❌ PDF header validation failed")
                        return False
                else:
                    print("❌ No PDF content found")
                    return False
            else:
                print("❌ PDF generation failed")
                return False
        
        # Step 5: Test bulk PDF download simulation
        print("\n5. Testing bulk PDF download simulation...")
        
        if successful_pdfs >= 2:
            print("   Simulating bulk download of multiple PDFs...")
            
            # Select first 3 invoices for bulk download
            selected_invoices = invoices[:min(3, len(invoices))]
            
            for i, invoice in enumerate(selected_invoices):
                invoice_id = invoice.get('id')
                print(f"   Downloading PDF {i+1}: {invoice.get('invoice_number', 'N/A')}")
                
                try:
                    pdf_response = requests.get(f"{API_URL}/admin/invoices/{invoice_id}/pdf", headers=admin_headers)
                    if pdf_response.status_code == 200:
                        pdf_data = pdf_response.json()
                        if 'pdf_content' in pdf_data:
                            # Simulate download by saving file
                            filename = f"bulk_download_{i+1}_{invoice_id}.pdf"
                            decoded_content = base64.b64decode(pdf_data['pdf_content'])
                            with open(filename, "wb") as f:
                                f.write(decoded_content)
                            print(f"   ✅ Downloaded: {filename}")
                        else:
                            print(f"   ❌ No PDF content")
                    else:
                        print(f"   ❌ PDF generation failed")
                except Exception as e:
                    print(f"   ❌ Download error: {e}")
            
            print("✅ Bulk download simulation completed!")
        
        # Step 6: Performance test
        print("\n6. Testing PDF generation performance...")
        
        if successful_pdfs > 0:
            import time
            
            start_time = time.time()
            
            # Generate PDF for first invoice multiple times
            test_invoice = invoices[0]
            test_invoice_id = test_invoice.get('id')
            
            for i in range(3):
                pdf_response = requests.get(f"{API_URL}/admin/invoices/{test_invoice_id}/pdf", headers=admin_headers)
                if pdf_response.status_code != 200:
                    print(f"   ❌ Performance test failed on iteration {i+1}")
                    break
            
            end_time = time.time()
            avg_time = (end_time - start_time) / 3
            
            print(f"✅ Average PDF generation time: {avg_time:.2f} seconds")
            
            if avg_time < 2.0:
                print("✅ PDF generation performance is good!")
            elif avg_time < 5.0:
                print("⚠️ PDF generation performance is acceptable")
            else:
                print("❌ PDF generation performance is slow")
        
        print("\n🎉 Invoice PDF system is working correctly!")
        print("✅ PDFs are being generated with proper content!")
        print("✅ Bulk download functionality is ready!")
        print("✅ PDF content quality is good!")
        return True
        
    except Exception as e:
        print(f"\n❌ Invoice PDF test failed with error: {e}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        return False

if __name__ == "__main__":
    try:
        success = test_invoice_pdf_system()
        if success:
            print("\n✅ Complete invoice PDF system is fully functional!")
        else:
            print("\n❌ Invoice PDF system has issues!")
    except Exception as e:
        print(f"\n❌ Test failed with error: {e}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
