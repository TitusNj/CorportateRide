from app import db
from datetime import datetime
from flask_bcrypt import generate_password_hash, check_password_hash

# Many-to-many relationship between drivers and vehicles
driver_vehicle = db.Table('driver_vehicle',
    db.Column('driver_id', db.Integer, db.ForeignKey('users.id'), primary_key=True),
    db.Column('vehicle_id', db.Integer, db.ForeignKey('vehicles.id'), primary_key=True)
)

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password_hash = db.Column(db.String(128))
    role = db.Column(db.String(20), nullable=False)  # employee, admin, driver
    company_id = db.Column(db.Integer, db.ForeignKey('companies.id'))
    
    # Relationships
    rides_as_passenger = db.relationship('Ride', backref='passenger', foreign_keys='Ride.user_id')
    rides_as_driver = db.relationship('Ride', backref='driver', foreign_keys='Ride.driver_id')
    assigned_vehicles = db.relationship('Vehicle', secondary=driver_vehicle, backref='drivers')
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password).decode('utf-8')
        
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'role': self.role,
            'company_id': self.company_id
        }

class Company(db.Model):
    __tablename__ = 'companies'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    industry = db.Column(db.String(100))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    users = db.relationship('User', backref='company')
    rides = db.relationship('Ride', backref='company')
    billings = db.relationship('Billing', backref='company')
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'industry': self.industry,
            'created_at': self.created_at.isoformat()
        }

class Vehicle(db.Model):
    __tablename__ = 'vehicles'
    
    id = db.Column(db.Integer, primary_key=True)
    type = db.Column(db.String(50), nullable=False)
    license_plate = db.Column(db.String(20), unique=True, nullable=False)
    capacity = db.Column(db.Integer, nullable=False)
    status = db.Column(db.String(20), default='available')  # available, in-use, maintenance
    
    # Relationships
    rides = db.relationship('Ride', backref='vehicle')
    
    def to_dict(self):
        return {
            'id': self.id,
            'type': self.type,
            'license_plate': self.license_plate,
            'capacity': self.capacity,
            'status': self.status,
            'drivers': [driver.id for driver in self.drivers]
        }

class Ride(db.Model):
    __tablename__ = 'rides'
    
    id = db.Column(db.Integer, primary_key=True)
    pickup_location = db.Column(db.String(200), nullable=False)
    destination = db.Column(db.String(200), nullable=False)
    passenger_count = db.Column(db.Integer, nullable=False)
    status = db.Column(db.String(20), default='scheduled')  # scheduled, in-progress, completed, cancelled
    scheduled_time = db.Column(db.DateTime, nullable=False)
    completed_time = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Foreign keys
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    vehicle_id = db.Column(db.Integer, db.ForeignKey('vehicles.id'), nullable=False)
    company_id = db.Column(db.Integer, db.ForeignKey('companies.id'), nullable=False)
    driver_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    
    # Relationships
    billing = db.relationship('Billing', backref='ride', uselist=False)
    
    def to_dict(self):
        return {
            'id': self.id,
            'pickup_location': self.pickup_location,
            'destination': self.destination,
            'passenger_count': self.passenger_count,
            'status': self.status,
            'scheduled_time': self.scheduled_time.isoformat(),
            'completed_time': self.completed_time.isoformat() if self.completed_time else None,
            'created_at': self.created_at.isoformat(),
            'user_id': self.user_id,
            'vehicle_id': self.vehicle_id,
            'company_id': self.company_id,
            'driver_id': self.driver_id
        }

class Billing(db.Model):
    __tablename__ = 'billings'
    
    id = db.Column(db.Integer, primary_key=True)
    invoice_number = db.Column(db.String(50), unique=True, nullable=False)
    amount = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(20), default='pending')  # pending, paid, overdue
    issue_date = db.Column(db.DateTime, default=datetime.utcnow)
    due_date = db.Column(db.DateTime, nullable=False)
    
    # Foreign keys
    company_id = db.Column(db.Integer, db.ForeignKey('companies.id'), nullable=False)
    ride_id = db.Column(db.Integer, db.ForeignKey('rides.id'), nullable=False)
    
    def to_dict(self):
        return {
            'id': self.id,
            'invoice_number': self.invoice_number,
            'amount': self.amount,
            'status': self.status,
            'issue_date': self.issue_date.isoformat(),
            'due_date': self.due_date.isoformat(),
            'company_id': self.company_id,
            'ride_id': self.ride_id
        }
