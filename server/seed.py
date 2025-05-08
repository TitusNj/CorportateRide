from app import create_app, db
from app.models import User, Company, Vehicle, Ride, Billing
from datetime import datetime, timedelta
import uuid
import random

def seed_database():
    app = create_app()
    
    with app.app_context():
        # Clear existing data
        db.drop_all()
        db.create_all()
        
        print("Creating companies...")
        # Create companies
        companies = [
            Company(name="Acme Inc", industry="Technology"),
            Company(name="Globex Corporation", industry="Manufacturing"),
            Company(name="Initech", industry="Finance")
        ]
        
        db.session.add_all(companies)
        db.session.commit()
        
        print("Creating admin users...")
        # Create admin users for each company
        admin_users = []
        for i, company in enumerate(companies):
            admin = User(
                name=f"Admin {i+1}",
                email=f"admin{i+1}@example.com",
                role="admin",
                company_id=company.id
            )
            admin.set_password("password")
            admin_users.append(admin)
        
        db.session.add_all(admin_users)
        db.session.commit()
        
        print("Creating employees...")
        # Create employees for each company
        employees = []
        for i, company in enumerate(companies):
            for j in range(3):  # 3 employees per company
                employee = User(
                    name=f"Employee {i+1}-{j+1}",
                    email=f"employee{i+1}{j+1}@example.com",
                    role="employee",
                    company_id=company.id
                )
                employee.set_password("password")
                employees.append(employee)
        
        db.session.add_all(employees)
        db.session.commit()
        
        print("Creating drivers...")
        # Create drivers for each company
        drivers = []
        for i, company in enumerate(companies):
            for j in range(2):  # 2 drivers per company
                driver = User(
                    name=f"Driver {i+1}-{j+1}",
                    email=f"driver{i+1}{j+1}@example.com",
                    role="driver",
                    company_id=company.id
                )
                driver.set_password("password")
                drivers.append(driver)
        
        db.session.add_all(drivers)
        db.session.commit()
        
        print("Creating vehicles...")
        # Create vehicles
        vehicles = [
            Vehicle(type="Sedan", license_plate="ABC123", capacity=4),
            Vehicle(type="SUV", license_plate="DEF456", capacity=6),
            Vehicle(type="Van", license_plate="GHI789", capacity=8),
            Vehicle(type="Compact", license_plate="JKL012", capacity=3),
            Vehicle(type="Luxury", license_plate="MNO345", capacity=4)
        ]
        
        db.session.add_all(vehicles)
        db.session.commit()
        
        print("Assigning drivers to vehicles...")
        # Assign drivers to vehicles (many-to-many)
        for i, driver in enumerate(drivers):
            # Each driver is assigned to 1-2 vehicles
            num_vehicles = random.randint(1, 2)
            for j in range(num_vehicles):
                vehicle_index = (i + j) % len(vehicles)
                driver.assigned_vehicles.append(vehicles[vehicle_index])
        
        db.session.commit()
        
        print("Creating rides...")
        # Create rides for each company
        rides = []
        for i, company in enumerate(companies):
            company_employees = [e for e in employees if e.company_id == company.id]
            company_drivers = [d for d in drivers if d.company_id == company.id]
            
            for j in range(5):  # 5 rides per company
                employee = random.choice(company_employees)
                driver = random.choice(company_drivers)
                vehicle = random.choice(driver.assigned_vehicles)
                
                # Random status
                status = random.choice(['scheduled', 'in-progress', 'completed', 'cancelled'])
                
                # Random dates
                now = datetime.utcnow()
                scheduled_time = now + timedelta(days=random.randint(-5, 10))
                completed_time = scheduled_time + timedelta(hours=1) if status == 'completed' else None
                
                ride = Ride(
                    pickup_location=f"Pickup Location {i+1}-{j+1}",
                    destination=f"Destination {i+1}-{j+1}",
                    passenger_count=random.randint(1, vehicle.capacity),
                    status=status,
                    scheduled_time=scheduled_time,
                    completed_time=completed_time,
                    user_id=employee.id,
                    vehicle_id=vehicle.id,
                    company_id=company.id,
                    driver_id=driver.id
                )
                rides.append(ride)
        
        db.session.add_all(rides)
        db.session.commit()
        
        print("Creating billing records...")
        # Create billing records for each ride
        billings = []
        for ride in rides:
            # Random amount between $20 and $100
            amount = round(random.uniform(20, 100), 2)
            
            # Random status
            status = random.choice(['pending', 'paid', 'overdue'])
            
            # Random dates
            issue_date = ride.created_at
            due_date = issue_date + timedelta(days=30)
            
            billing = Billing(
                invoice_number=f"INV-{uuid.uuid4().hex[:8].upper()}",
                amount=amount,
                status=status,
                issue_date=issue_date,
                due_date=due_date,
                company_id=ride.company_id,
                ride_id=ride.id
            )
            billings.append(billing)
        
        db.session.add_all(billings)
        db.session.commit()
        
        print("Database seeded successfully!")

if __name__ == "__main__":
    seed_database()
