from app import db, bcrypt
from sqlalchemy.ext.associationproxy import association_proxy
from sqlalchemy_serializer import SerializerMixin
from datetime import datetime

# Association tables for many-to-many relationships
user_company = db.Table('user_company',
    db.Column('user_id', db.Integer, db.ForeignKey('users.id'), primary_key=True),
    db.Column('company_id', db.Integer, db.ForeignKey('companies.id'), primary_key=True)
)

driver_vehicle = db.Table('driver_vehicle',
    db.Column('user_id', db.Integer, db.ForeignKey('users.id'), primary_key=True),
    db.Column('vehicle_id', db.Integer, db.ForeignKey('vehicles.id'), primary_key=True)
)

class User(db.Model, SerializerMixin):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    _password_hash = db.Column(db.String(128), nullable=False)
    first_name = db.Column(db.String(50), nullable=False)
    last_name = db.Column(db.String(50), nullable=False)
    role = db.Column(db.String(20), nullable=False)  # 'employee', 'driver', 'admin'
    phone = db.Column(db.String(20))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    companies = db.relationship('Company', secondary=user_company, back_populates='users')
    vehicles = db.relationship('Vehicle', secondary=driver_vehicle, back_populates='drivers')
    trips_as_passenger = db.relationship('Trip', foreign_keys='Trip.passenger_id', back_populates='passenger')
    trips_as_driver = db.relationship('Trip', foreign_keys='Trip.driver_id', back_populates='driver')
    
    # Serialization configuration
    serialize_rules = ('-_password_hash', '-companies.users', '-vehicles.drivers', 
                  '-trips_as_passenger.passenger', '-trips_as_driver.driver',
                  '-trips_as_passenger.company', '-trips_as_passenger.vehicle',
                  '-trips_as_driver.company', '-trips_as_driver.vehicle')
    
    @property
    def password_hash(self):
        raise AttributeError('Password hashes may not be viewed.')
    
    @password_hash.setter
    def password_hash(self, password):
        self._password_hash = bcrypt.generate_password_hash(password).decode('utf-8')
    
    def authenticate(self, password):
        return bcrypt.check_password_hash(self._password_hash, password)
    
    def __repr__(self):
        return f'<User {self.username}>'

class Company(db.Model, SerializerMixin):
    __tablename__ = 'companies'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    address = db.Column(db.String(200), nullable=False)
    contact_email = db.Column(db.String(100), nullable=False)
    contact_phone = db.Column(db.String(20), nullable=False)
    registration_date = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    users = db.relationship('User', secondary=user_company, back_populates='companies')
    trips = db.relationship('Trip', back_populates='company')
    
    # Serialization configuration
    serialize_rules = ('-users.companies', '-trips.company', '-trips.passenger',
                  '-trips.driver', '-trips.vehicle', '-users.trips_as_passenger',
                  '-users.trips_as_driver', '-users.vehicles')
    
    def __repr__(self):
        return f'<Company {self.name}>'

class Vehicle(db.Model, SerializerMixin):
    __tablename__ = 'vehicles'
    
    id = db.Column(db.Integer, primary_key=True)
    registration_number = db.Column(db.String(20), unique=True, nullable=False)
    model = db.Column(db.String(50), nullable=False)
    capacity_type = db.Column(db.String(20), nullable=False)  # 'sedan', 'van', 'bus'
    capacity = db.Column(db.Integer, nullable=False)
    status = db.Column(db.String(20), default='available')  # 'available', 'in_use', 'maintenance'
    
    # Relationships
    drivers = db.relationship('User', secondary=driver_vehicle, back_populates='vehicles')
    trips = db.relationship('Trip', back_populates='vehicle')
    
    # Serialization configuration
    serialize_rules = ('-drivers.vehicles', '-trips.vehicle', '-trips.passenger',
                  '-trips.driver', '-trips.company', '-drivers.trips_as_passenger',
                  '-drivers.trips_as_driver', '-drivers.companies')
    
    def __repr__(self):
        return f'<Vehicle {self.registration_number}>'

class Trip(db.Model, SerializerMixin):
    __tablename__ = 'trips'
    
    id = db.Column(db.Integer, primary_key=True)
    pickup_location = db.Column(db.String(200), nullable=False)
    dropoff_location = db.Column(db.String(200), nullable=False)
    pickup_time = db.Column(db.DateTime, nullable=False)
    status = db.Column(db.String(20), default='pending')  # 'pending', 'in_progress', 'completed', 'cancelled'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    completed_at = db.Column(db.DateTime)
    notes = db.Column(db.Text)
    
    # Foreign keys
    passenger_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    driver_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    company_id = db.Column(db.Integer, db.ForeignKey('companies.id'), nullable=False)
    vehicle_id = db.Column(db.Integer, db.ForeignKey('vehicles.id'))
    
    # Relationships
    passenger = db.relationship('User', foreign_keys=[passenger_id], back_populates='trips_as_passenger')
    driver = db.relationship('User', foreign_keys=[driver_id], back_populates='trips_as_driver')
    company = db.relationship('Company', back_populates='trips')
    vehicle = db.relationship('Vehicle', back_populates='trips')
    
    # Serialization configuration
    serialize_rules = ('-passenger.trips_as_passenger', '-driver.trips_as_driver', 
                  '-company.trips', '-vehicle.trips', '-passenger.companies',
                  '-passenger.vehicles', '-driver.companies', '-driver.vehicles',
                  '-company.users', '-vehicle.drivers')
    
    def __repr__(self):
        return f'<Trip {self.id}>'
