#!/usr/bin/env python3

from app import app, db
from app.models import User, Company, Vehicle, Trip
from datetime import datetime, timedelta
import random

def seed_database():
    print("🌱 Seeding database with Kenya-specific data...")
    
    # Clear existing data
    db.drop_all()
    db.create_all()
    
    # Create companies - Using Kenyan companies
    companies = [
        Company(
            name="Safaricom Business",
            address="Safaricom House, Waiyaki Way, Nairobi",
            contact_email="business@safaricom.co.ke",
            contact_phone="+254 722 000000"
        ),
        Company(
            name="Kenya Commercial Bank",
            address="Kencom House, City Hall Way, Nairobi",
            contact_email="info@kcb.co.ke",
            contact_phone="+254 711 012000"
        ),
        Company(
            name="Equity Bank Kenya",
            address="Equity Centre, Upper Hill, Nairobi",
            contact_email="info@equitybank.co.ke",
            contact_phone="+254 763 063000"
        )
    ]
    
    db.session.add_all(companies)
    db.session.commit()
    
    print("✅ Companies seeded")
    
    # Create Cabrix admin users (internal staff)
    cabrix_admin_users = [
        User(
            username="cabrix_admin1",
            email="admin1@cabrix.co.ke",
            first_name="John",
            last_name="Kamau",
            role="admin",
            phone="+254 722 123456"
        ),
        User(
            username="cabrix_admin2",
            email="admin2@cabrix.co.ke",
            first_name="Jane",
            last_name="Wanjiku",
            role="admin",
            phone="+254 733 987654"
        )
    ]
    
    # Set passwords for Cabrix admins
    for admin in cabrix_admin_users:
        admin.password_hash = "password123"
    
    db.session.add_all(cabrix_admin_users)
    db.session.commit()
    
    print("✅ Cabrix admin users seeded")
    
    # Create company admin users
    company_admin_users = [
        User(
            username="admin1",
            email="admin1@safaricom.co.ke",
            first_name="Robert",
            last_name="Omondi",
            role="admin",
            phone="+254 712 345678"
        ),
        User(
            username="admin2",
            email="admin2@kcb.co.ke",
            first_name="Sarah",
            last_name="Njeri",
            role="admin",
            phone="+254 724 567890"
        ),
        User(
            username="admin3",
            email="admin3@equitybank.co.ke",
            first_name="David",
            last_name="Mwangi",
            role="admin",
            phone="+254 735 678901"
        )
    ]
    
    # Set passwords for company admins
    for i, admin in enumerate(company_admin_users):
        admin.password_hash = "password123"
        admin.companies.append(companies[i])
    
    db.session.add_all(company_admin_users)
    db.session.commit()
    
    print("✅ Company admin users seeded")
    
    # Create employee users with Kenyan names
    employee_users = []
    
    kenyan_first_names = [
        "Wangari", "Njeri", "Muthoni", "Wambui", "Akinyi", 
        "Otieno", "Kipchoge", "Mutua", "Kamau", "Ochieng", 
        "Wanjiru", "Mwangi", "Nyambura", "Kimani", "Auma"
    ]
    
    kenyan_last_names = [
        "Kariuki", "Odhiambo", "Wekesa", "Njoroge", "Omondi", 
        "Maina", "Wafula", "Onyango", "Kamau", "Githinji", 
        "Mwangi", "Ndungu", "Kimani", "Korir", "Kinyua"
    ]
    
    for i in range(1, 16):
        company_idx = (i - 1) % 3
        first_name = random.choice(kenyan_first_names)
        last_name = random.choice(kenyan_last_names)
        
        employee = User(
            username=f"employee{i}",
            email=f"employee{i}@{companies[company_idx].name.lower().replace(' ', '')}.co.ke",
            first_name=first_name,
            last_name=last_name,
            role="employee",
            phone=f"+254 7{random.randint(10, 99)} {random.randint(100000, 999999)}"
        )
        employee.password_hash = "password123"
        employee.companies.append(companies[company_idx])
        employee_users.append(employee)
    
    db.session.add_all(employee_users)
    db.session.commit()
    
    print("✅ Employee users seeded")
    
    # Create driver users with Kenyan names
    driver_users = []
    
    for i in range(1, 11):
        first_name = random.choice(kenyan_first_names)
        last_name = random.choice(kenyan_last_names)
        
        driver = User(
            username=f"driver{i}",
            email=f"driver{i}@cabrix.co.ke",
            first_name=first_name,
            last_name=last_name,
            role="driver",
            phone=f"+254 7{random.randint(10, 99)} {random.randint(100000, 999999)}"
        )
        driver.password_hash = "password123"
        driver_users.append(driver)
    
    db.session.add_all(driver_users)
    db.session.commit()
    
    print("✅ Driver users seeded")
    
    # Create vehicles with Kenyan registration numbers
    vehicles = [
        Vehicle(
            registration_number="KDD 123A",
            model="Toyota Prado",
            capacity_type="sedan",
            capacity=4
        ),
        Vehicle(
            registration_number="KCF 456B",
            model="Nissan X-Trail",
            capacity_type="sedan",
            capacity=4
        ),
        Vehicle(
            registration_number="KBZ 789C",
            model="Toyota Corolla",
            capacity_type="sedan",
            capacity=4
        ),
        Vehicle(
            registration_number="KDG 234D",
            model="Toyota Hiace",
            capacity_type="van",
            capacity=7
        ),
        Vehicle(
            registration_number="KCA 567E",
            model="Nissan Urvan",
            capacity_type="van",
            capacity=8
        ),
        Vehicle(
            registration_number="KBJ 890F",
            model="Isuzu NQR",
            capacity_type="bus",
            capacity=15
        ),
        Vehicle(
            registration_number="KDH 345G",
            model="Toyota Coaster",
            capacity_type="bus",
            capacity=12
        )
    ]
    
    db.session.add_all(vehicles)
    db.session.commit()
    
    print("✅ Vehicles seeded")
    
    # Assign drivers to vehicles
    for i, driver in enumerate(driver_users):
        vehicle_idx = i % len(vehicles)
        driver.vehicles.append(vehicles[vehicle_idx])
    
    db.session.commit()
    
    print("✅ Drivers assigned to vehicles")
    
    # Create trips with Kenyan locations
    trips = []
    
    # Kenyan locations
    nairobi_locations = [
        "Westlands, Nairobi", "Kilimani, Nairobi", "Karen, Nairobi", 
        "Lavington, Nairobi", "Upperhill, Nairobi", "CBD, Nairobi",
        "Parklands, Nairobi", "South B, Nairobi", "South C, Nairobi",
        "Eastleigh, Nairobi", "Gigiri, Nairobi", "Kileleshwa, Nairobi"
    ]
    
    other_cities = [
        "Mombasa CBD", "Nyali, Mombasa", "Diani, Kwale", 
        "Kisumu CBD", "Milimani, Kisumu", "Nakuru CBD",
        "Eldoret CBD", "Thika Town", "Machakos Town",
        "Kitengela", "Athi River", "Ongata Rongai"
    ]
    
    # Trip statuses
    statuses = ['pending', 'in_progress', 'completed', 'cancelled']
    
    # Create 30 trips with different statuses
    for i in range(1, 31):
        status = statuses[i % 4]
        
        # Determine dates based on status
        created_at = datetime.utcnow() - timedelta(days=random.randint(1, 30))
        pickup_time = created_at + timedelta(hours=random.randint(1, 24))
        completed_at = None
        
        if status == 'completed':
            completed_at = pickup_time + timedelta(hours=random.randint(1, 3))
        
        # Select random employee, company, and vehicle
        employee_idx = random.randint(0, len(employee_users) - 1)
        company_idx = random.randint(0, len(companies) - 1)
        vehicle_idx = random.randint(0, len(vehicles) - 1)
        
        # Only assign driver for in_progress and completed trips
        driver_id = None
        if status in ['in_progress', 'completed']:
            driver_idx = random.randint(0, len(driver_users) - 1)
            driver_id = driver_users[driver_idx].id
        
        # Select random pickup and dropoff locations
        if random.choice([True, False]):
            pickup_location = random.choice(nairobi_locations)
            dropoff_location = random.choice(nairobi_locations)
            while pickup_location == dropoff_location:
                dropoff_location = random.choice(nairobi_locations)
        else:
            pickup_location = random.choice(nairobi_locations)
            dropoff_location = random.choice(other_cities)
        
        trip = Trip(
            pickup_location=pickup_location,
            dropoff_location=dropoff_location,
            pickup_time=pickup_time,
            status=status,
            created_at=created_at,
            completed_at=completed_at,
            notes=f"Trip notes for trip {i}",
            passenger_id=employee_users[employee_idx].id,
            driver_id=driver_id,
            company_id=companies[company_idx].id,
            vehicle_id=vehicles[vehicle_idx].id if status in ['in_progress', 'completed'] else None
        )
        
        trips.append(trip)
    
    db.session.add_all(trips)
    db.session.commit()
    
    print("✅ Trips seeded")
    
    print("✅ Database seeding completed!")

if __name__ == "__main__":
    with app.app_context():
        seed_database()
