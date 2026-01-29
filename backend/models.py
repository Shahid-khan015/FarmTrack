from sqlalchemy import Column, String, Boolean, Text, Float, DateTime, ForeignKey, Enum, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from database import Base

class UserRole(str, enum.Enum):
    owner = "owner"
    operator = "operator"
    farmer = "farmer"

class OperationType(str, enum.Enum):
    tillage = "tillage"
    sowing = "sowing"
    spraying = "spraying"
    weeding = "weeding"
    harvesting = "harvesting"
    threshing = "threshing"
    grading = "grading"

class OperationStatus(str, enum.Enum):
    active = "active"
    completed = "completed"
    cancelled = "cancelled"

class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, server_default=func.gen_random_uuid())
    username = Column(Text, unique=True, nullable=False)
    password = Column(Text, nullable=False)
    full_name = Column(Text, nullable=False)
    role = Column(Enum(UserRole, name="user_role"), nullable=False, default=UserRole.operator)
    phone = Column(Text, nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    
    tractors = relationship("Tractor", back_populates="owner")
    implements = relationship("Implement", back_populates="owner")
    operations = relationship("Operation", back_populates="operator")
    fuel_logs = relationship("FuelLog", back_populates="operator")

class Tractor(Base):
    __tablename__ = "tractors"
    
    id = Column(String, primary_key=True, server_default=func.gen_random_uuid())
    owner_id = Column(String, ForeignKey("users.id"), nullable=False)
    manufacturer_name = Column(Text, nullable=False)
    model = Column(Text, nullable=False)
    registration_number = Column(Text, unique=True, nullable=False)
    specifications = Column(JSON, nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    
    owner = relationship("User", back_populates="tractors")
    operations = relationship("Operation", back_populates="tractor")
    telemetry = relationship("Telemetry", back_populates="tractor")
    fuel_logs = relationship("FuelLog", back_populates="tractor")
    alerts = relationship("Alert", back_populates="tractor")

class Implement(Base):
    __tablename__ = "implements"
    
    id = Column(String, primary_key=True, server_default=func.gen_random_uuid())
    owner_id = Column(String, ForeignKey("users.id"), nullable=False)
    operation_type = Column(Enum(OperationType, name="operation_type"), nullable=False)
    name = Column(Text, nullable=False)
    brand_name = Column(Text, nullable=False)
    specifications = Column(JSON, nullable=True)
    working_width = Column(Float, nullable=False)
    is_active = Column(Boolean, nullable=False, default=True)
    
    owner = relationship("User", back_populates="implements")
    operations = relationship("Operation", back_populates="implement")

class Operation(Base):
    __tablename__ = "operations"
    
    id = Column(String, primary_key=True, server_default=func.gen_random_uuid())
    tractor_id = Column(String, ForeignKey("tractors.id"), nullable=False)
    implement_id = Column(String, ForeignKey("implements.id"), nullable=False)
    operator_id = Column(String, ForeignKey("users.id"), nullable=False)
    operation_type = Column(Enum(OperationType, name="operation_type"), nullable=False)
    status = Column(Enum(OperationStatus, name="operation_status"), nullable=False, default=OperationStatus.active)
    start_time = Column(DateTime, nullable=False, server_default=func.now())
    end_time = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)
    
    tractor = relationship("Tractor", back_populates="operations")
    implement = relationship("Implement", back_populates="operations")
    operator = relationship("User", back_populates="operations")
    telemetry = relationship("Telemetry", back_populates="operation")
    fuel_logs = relationship("FuelLog", back_populates="operation")
    alerts = relationship("Alert", back_populates="operation")

class Telemetry(Base):
    __tablename__ = "telemetry"
    
    id = Column(String, primary_key=True, server_default=func.gen_random_uuid())
    operation_id = Column(String, ForeignKey("operations.id"), nullable=False)
    tractor_id = Column(String, ForeignKey("tractors.id"), nullable=False)
    timestamp = Column(DateTime, nullable=False, server_default=func.now())
    engine_on = Column(Boolean, nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    is_moving = Column(Boolean, nullable=False, default=False)
    pto_on = Column(Boolean, nullable=False, default=False)
    speed = Column(Float, default=0)
    implement_data = Column(JSON, nullable=True)
    
    operation = relationship("Operation", back_populates="telemetry")
    tractor = relationship("Tractor", back_populates="telemetry")

class FuelLog(Base):
    __tablename__ = "fuel_logs"
    
    id = Column(String, primary_key=True, server_default=func.gen_random_uuid())
    tractor_id = Column(String, ForeignKey("tractors.id"), nullable=False)
    operator_id = Column(String, ForeignKey("users.id"), nullable=False)
    operation_id = Column(String, ForeignKey("operations.id"), nullable=True)
    timestamp = Column(DateTime, nullable=False, server_default=func.now())
    quantity = Column(Float, nullable=False)
    notes = Column(Text, nullable=True)
    
    tractor = relationship("Tractor", back_populates="fuel_logs")
    operator = relationship("User", back_populates="fuel_logs")
    operation = relationship("Operation", back_populates="fuel_logs")

class Alert(Base):
    __tablename__ = "alerts"
    
    id = Column(String, primary_key=True, server_default=func.gen_random_uuid())
    tractor_id = Column(String, ForeignKey("tractors.id"), nullable=False)
    operation_id = Column(String, ForeignKey("operations.id"), nullable=True)
    timestamp = Column(DateTime, nullable=False, server_default=func.now())
    alert_type = Column(Text, nullable=False)
    message = Column(Text, nullable=False)
    is_resolved = Column(Boolean, nullable=False, default=False)
    
    tractor = relationship("Tractor", back_populates="alerts")
    operation = relationship("Operation", back_populates="alerts")
