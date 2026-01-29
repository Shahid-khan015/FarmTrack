from pydantic import BaseModel, Field
from typing import Optional, Any
from datetime import datetime
from enum import Enum

class UserRole(str, Enum):
    owner = "owner"
    operator = "operator"
    farmer = "farmer"

class OperationType(str, Enum):
    tillage = "tillage"
    sowing = "sowing"
    spraying = "spraying"
    weeding = "weeding"
    harvesting = "harvesting"
    threshing = "threshing"
    grading = "grading"

class OperationStatus(str, Enum):
    active = "active"
    completed = "completed"
    cancelled = "cancelled"

class LoginInput(BaseModel):
    username: str = Field(..., min_length=1)
    password: str = Field(..., min_length=1)

class RegisterInput(BaseModel):
    username: str = Field(..., min_length=3)
    password: str = Field(..., min_length=6)
    fullName: str
    role: Optional[UserRole] = UserRole.operator
    phone: Optional[str] = None

class UserResponse(BaseModel):
    id: str
    username: str
    fullName: str
    role: str
    phone: Optional[str]
    isActive: bool
    
    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    token: str
    user: UserResponse

class TractorCreate(BaseModel):
    manufacturerName: str
    model: str
    registrationNumber: str
    specifications: Optional[dict] = None
    isActive: Optional[bool] = True

class TractorUpdate(BaseModel):
    manufacturerName: Optional[str] = None
    model: Optional[str] = None
    registrationNumber: Optional[str] = None
    specifications: Optional[dict] = None
    isActive: Optional[bool] = None

class TractorResponse(BaseModel):
    id: str
    ownerId: str
    manufacturerName: str
    model: str
    registrationNumber: str
    specifications: Optional[dict]
    isActive: bool
    
    class Config:
        from_attributes = True

class ImplementCreate(BaseModel):
    operationType: OperationType
    name: str
    brandName: str
    workingWidth: float
    specifications: Optional[dict] = None
    isActive: Optional[bool] = True

class ImplementUpdate(BaseModel):
    operationType: Optional[OperationType] = None
    name: Optional[str] = None
    brandName: Optional[str] = None
    workingWidth: Optional[float] = None
    specifications: Optional[dict] = None
    isActive: Optional[bool] = None

class ImplementResponse(BaseModel):
    id: str
    ownerId: str
    operationType: str
    name: str
    brandName: str
    workingWidth: float
    specifications: Optional[dict]
    isActive: bool
    
    class Config:
        from_attributes = True

class OperationCreate(BaseModel):
    tractorId: str
    implementId: str
    operationType: OperationType
    notes: Optional[str] = None

class OperationResponse(BaseModel):
    id: str
    tractorId: str
    implementId: str
    operatorId: str
    operationType: str
    status: str
    startTime: datetime
    endTime: Optional[datetime]
    notes: Optional[str]
    tractor: Optional[TractorResponse] = None
    implement: Optional[ImplementResponse] = None
    operator: Optional[dict] = None
    
    class Config:
        from_attributes = True

class TelemetryCreate(BaseModel):
    operationId: str
    tractorId: str
    engineOn: bool
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    isMoving: Optional[bool] = False
    ptoOn: Optional[bool] = False
    speed: Optional[float] = 0
    implementData: Optional[dict] = None

class TelemetryResponse(BaseModel):
    id: str
    operationId: str
    tractorId: str
    timestamp: datetime
    engineOn: bool
    latitude: Optional[float]
    longitude: Optional[float]
    isMoving: bool
    ptoOn: bool
    speed: Optional[float]
    implementData: Optional[dict]
    
    class Config:
        from_attributes = True

class FuelLogCreate(BaseModel):
    tractorId: str
    operationId: Optional[str] = None
    quantity: float
    notes: Optional[str] = None

class FuelLogResponse(BaseModel):
    id: str
    tractorId: str
    operatorId: str
    operationId: Optional[str]
    timestamp: datetime
    quantity: float
    notes: Optional[str]
    tractor: Optional[TractorResponse] = None
    operator: Optional[dict] = None
    
    class Config:
        from_attributes = True

class AlertCreate(BaseModel):
    tractorId: str
    operationId: Optional[str] = None
    alertType: str
    message: str

class AlertResponse(BaseModel):
    id: str
    tractorId: str
    operationId: Optional[str]
    timestamp: datetime
    alertType: str
    message: str
    isResolved: bool
    tractor: Optional[TractorResponse] = None
    
    class Config:
        from_attributes = True

class DashboardStats(BaseModel):
    tractorsCount: int
    implementsCount: int
    activeOperations: int
    todayFuelUsage: float
    unresolvedAlerts: int
    recentOperations: list

class ReportResponse(BaseModel):
    totalHours: float
    totalArea: float
    fuelUsed: float
    breakdowns: int
    alerts: int
    operations: list
    fuelLogs: list
    alertLogs: list
