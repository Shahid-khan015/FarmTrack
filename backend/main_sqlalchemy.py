import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from datetime import datetime, timedelta
from typing import Optional
from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, HTMLResponse
from sqlalchemy.orm import Session
from sqlalchemy import and_

from database import get_db, engine, Base
from models import User, Tractor, Implement, Operation, Telemetry, FuelLog, Alert, OperationStatus
from schemas import (
    LoginInput, RegisterInput, TokenResponse, UserResponse,
    TractorCreate, TractorUpdate, TractorResponse,
    ImplementCreate, ImplementUpdate, ImplementResponse,
    OperationCreate, OperationResponse,
    TelemetryCreate, TelemetryResponse,
    FuelLogCreate, FuelLogResponse,
    AlertCreate, AlertResponse,
    DashboardStats, ReportResponse
)
from auth import (
    get_password_hash, verify_password, create_access_token,
    get_current_user, require_role
)

app = FastAPI(title="Fleet Management API", docs_url="/api/docs", redoc_url="/api/redoc")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def model_to_dict(obj, exclude=None):
    exclude = exclude or []
    result = {}
    for column in obj.__table__.columns:
        key = column.name
        if key in exclude:
            continue
        value = getattr(obj, key)
        camel_key = ''.join(word.capitalize() if i > 0 else word for i, word in enumerate(key.split('_')))
        if hasattr(value, 'value'):
            result[camel_key] = value.value
        elif isinstance(value, datetime):
            result[camel_key] = value.isoformat()
        else:
            result[camel_key] = value
    return result


@app.post("/api/auth/register", response_model=TokenResponse)
async def register(data: RegisterInput, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.username == data.username).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already exists")

    hashed_password = get_password_hash(data.password)
    user = User(
        username=data.username,
        password=hashed_password,
        full_name=data.fullName,
        role=data.role or "operator",
        phone=data.phone
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({
        "id": user.id,
        "username": user.username,
        "role": user.role.value,
        "fullName": user.full_name
    })

    return {
        "token": token,
        "user": {
            "id": user.id,
            "username": user.username,
            "fullName": user.full_name,
            "role": user.role.value,
            "phone": user.phone,
            "isActive": user.is_active
        }
    }


@app.post("/api/auth/login", response_model=TokenResponse)
async def login(data: LoginInput, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == data.username).first()
    if not user or not verify_password(data.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({
        "id": user.id,
        "username": user.username,
        "role": user.role.value,
        "fullName": user.full_name
    })

    return {
        "token": token,
        "user": {
            "id": user.id,
            "username": user.username,
            "fullName": user.full_name,
            "role": user.role.value,
            "phone": user.phone,
            "isActive": user.is_active
        }
    }


@app.get("/api/dashboard/stats")
async def get_dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    tractors = db.query(Tractor).all()
    implements = db.query(Implement).all()
    operations = db.query(Operation).order_by(Operation.start_time.desc()).all()
    alerts = db.query(Alert).all()

    today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    tomorrow = today + timedelta(days=1)

    today_fuel_logs = db.query(FuelLog).filter(
        and_(FuelLog.timestamp >= today, FuelLog.timestamp < tomorrow)
    ).all()
    today_fuel_usage = sum(log.quantity for log in today_fuel_logs)

    active_operations = [op for op in operations if op.status == OperationStatus.active]
    unresolved_alerts = [a for a in alerts if not a.is_resolved]

    recent_operations = []
    for op in operations[:5]:
        tractor = db.query(Tractor).filter(Tractor.id == op.tractor_id).first()
        operator = db.query(User).filter(User.id == op.operator_id).first()
        recent_operations.append({
            "id": op.id,
            "operationType": op.operation_type.value,
            "tractorName": f"{tractor.manufacturer_name} {tractor.model}" if tractor else "Unknown",
            "operatorName": operator.full_name if operator else "Unknown",
            "status": op.status.value,
            "startTime": op.start_time.isoformat() if op.start_time else None,
        })

    return {
        "tractorsCount": len(tractors),
        "implementsCount": len(implements),
        "activeOperations": len(active_operations),
        "todayFuelUsage": today_fuel_usage,
        "unresolvedAlerts": len(unresolved_alerts),
        "recentOperations": recent_operations,
    }


@app.get("/api/tractors")
async def get_tractors(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    tractors = db.query(Tractor).all()
    return [model_to_dict(t) for t in tractors]


@app.post("/api/tractors")
async def create_tractor(
    data: TractorCreate,
    current_user: User = Depends(require_role("owner", "operator")),
    db: Session = Depends(get_db)
):
    tractor = Tractor(
        owner_id=current_user.id,
        manufacturer_name=data.manufacturerName,
        model=data.model,
        registration_number=data.registrationNumber,
        specifications=data.specifications,
        is_active=data.isActive if data.isActive is not None else True
    )
    db.add(tractor)
    db.commit()
    db.refresh(tractor)
    return model_to_dict(tractor)


@app.patch("/api/tractors/{tractor_id}")
async def update_tractor(
    tractor_id: str,
    data: TractorUpdate,
    current_user: User = Depends(require_role("owner", "operator")),
    db: Session = Depends(get_db)
):
    tractor = db.query(Tractor).filter(Tractor.id == tractor_id).first()
    if not tractor:
        raise HTTPException(status_code=404, detail="Tractor not found")

    if data.manufacturerName is not None:
        tractor.manufacturer_name = data.manufacturerName
    if data.model is not None:
        tractor.model = data.model
    if data.registrationNumber is not None:
        tractor.registration_number = data.registrationNumber
    if data.specifications is not None:
        tractor.specifications = data.specifications
    if data.isActive is not None:
        tractor.is_active = data.isActive

    db.commit()
    db.refresh(tractor)
    return model_to_dict(tractor)


@app.delete("/api/tractors/{tractor_id}")
async def delete_tractor(
    tractor_id: str,
    current_user: User = Depends(require_role("owner")),
    db: Session = Depends(get_db)
):
    tractor = db.query(Tractor).filter(Tractor.id == tractor_id).first()
    if not tractor:
        raise HTTPException(status_code=404, detail="Tractor not found")
    db.delete(tractor)
    db.commit()
    return {"success": True}


@app.get("/api/implements")
async def get_implements(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    implements = db.query(Implement).all()
    return [model_to_dict(i) for i in implements]


@app.post("/api/implements")
async def create_implement(
    data: ImplementCreate,
    current_user: User = Depends(require_role("owner", "operator")),
    db: Session = Depends(get_db)
):
    implement = Implement(
        owner_id=current_user.id,
        operation_type=data.operationType,
        name=data.name,
        brand_name=data.brandName,
        working_width=data.workingWidth,
        specifications=data.specifications,
        is_active=data.isActive if data.isActive is not None else True
    )
    db.add(implement)
    db.commit()
    db.refresh(implement)
    return model_to_dict(implement)


@app.patch("/api/implements/{implement_id}")
async def update_implement(
    implement_id: str,
    data: ImplementUpdate,
    current_user: User = Depends(require_role("owner", "operator")),
    db: Session = Depends(get_db)
):
    implement = db.query(Implement).filter(Implement.id == implement_id).first()
    if not implement:
        raise HTTPException(status_code=404, detail="Implement not found")

    if data.operationType is not None:
        implement.operation_type = data.operationType
    if data.name is not None:
        implement.name = data.name
    if data.brandName is not None:
        implement.brand_name = data.brandName
    if data.workingWidth is not None:
        implement.working_width = data.workingWidth
    if data.specifications is not None:
        implement.specifications = data.specifications
    if data.isActive is not None:
        implement.is_active = data.isActive

    db.commit()
    db.refresh(implement)
    return model_to_dict(implement)


@app.delete("/api/implements/{implement_id}")
async def delete_implement(
    implement_id: str,
    current_user: User = Depends(require_role("owner")),
    db: Session = Depends(get_db)
):
    implement = db.query(Implement).filter(Implement.id == implement_id).first()
    if not implement:
        raise HTTPException(status_code=404, detail="Implement not found")
    db.delete(implement)
    db.commit()
    return {"success": True}


@app.get("/api/operations")
async def get_operations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    operations = db.query(Operation).order_by(Operation.start_time.desc()).all()
    result = []
    for op in operations:
        tractor = db.query(Tractor).filter(Tractor.id == op.tractor_id).first()
        implement = db.query(Implement).filter(Implement.id == op.implement_id).first()
        operator = db.query(User).filter(User.id == op.operator_id).first()

        op_dict = model_to_dict(op)
        op_dict["tractor"] = model_to_dict(tractor) if tractor else None
        op_dict["implement"] = model_to_dict(implement) if implement else None
        op_dict["operator"] = {"fullName": operator.full_name} if operator else None
        result.append(op_dict)
    return result


@app.post("/api/operations")
async def create_operation(
    data: OperationCreate,
    current_user: User = Depends(require_role("owner", "operator")),
    db: Session = Depends(get_db)
):
    operation = Operation(
        tractor_id=data.tractorId,
        implement_id=data.implementId,
        operator_id=current_user.id,
        operation_type=data.operationType,
        status=OperationStatus.active,
        start_time=datetime.now(),
        notes=data.notes
    )
    db.add(operation)
    db.commit()
    db.refresh(operation)

    telemetry_entry = Telemetry(
        operation_id=operation.id,
        tractor_id=operation.tractor_id,
        engine_on=True,
        pto_on=False,
        is_moving=False,
        speed=0,
        timestamp=datetime.now()
    )
    db.add(telemetry_entry)
    db.commit()

    return model_to_dict(operation)


@app.post("/api/operations/{operation_id}/stop")
async def stop_operation(
    operation_id: str,
    current_user: User = Depends(require_role("owner", "operator")),
    db: Session = Depends(get_db)
):
    operation = db.query(Operation).filter(Operation.id == operation_id).first()
    if not operation:
        raise HTTPException(status_code=404, detail="Operation not found")

    operation.status = OperationStatus.completed
    operation.end_time = datetime.now()

    telemetry_entry = Telemetry(
        operation_id=operation.id,
        tractor_id=operation.tractor_id,
        engine_on=False,
        pto_on=False,
        is_moving=False,
        speed=0,
        timestamp=datetime.now()
    )
    db.add(telemetry_entry)
    db.commit()
    db.refresh(operation)

    return model_to_dict(operation)


@app.get("/api/telemetry/{operation_id}")
async def get_telemetry(
    operation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    telemetry_data = db.query(Telemetry).filter(
        Telemetry.operation_id == operation_id
    ).order_by(Telemetry.timestamp.desc()).all()
    return [model_to_dict(t) for t in telemetry_data]


@app.post("/api/telemetry")
async def create_telemetry(
    data: TelemetryCreate,
    current_user: User = Depends(require_role("owner", "operator")),
    db: Session = Depends(get_db)
):
    telemetry_entry = Telemetry(
        operation_id=data.operationId,
        tractor_id=data.tractorId,
        engine_on=data.engineOn,
        latitude=data.latitude,
        longitude=data.longitude,
        is_moving=data.isMoving or False,
        pto_on=data.ptoOn or False,
        speed=data.speed or 0,
        implement_data=data.implementData,
        timestamp=datetime.now()
    )
    db.add(telemetry_entry)
    db.commit()
    db.refresh(telemetry_entry)
    return model_to_dict(telemetry_entry)


@app.get("/api/fuel-logs")
async def get_fuel_logs(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    fuel_logs = db.query(FuelLog).order_by(FuelLog.timestamp.desc()).all()
    result = []
    for log in fuel_logs:
        tractor = db.query(Tractor).filter(Tractor.id == log.tractor_id).first()
        operator = db.query(User).filter(User.id == log.operator_id).first()

        log_dict = model_to_dict(log)
        log_dict["tractor"] = model_to_dict(tractor) if tractor else None
        log_dict["operator"] = {"fullName": operator.full_name} if operator else None
        result.append(log_dict)
    return result


@app.post("/api/fuel-logs")
async def create_fuel_log(
    data: FuelLogCreate,
    current_user: User = Depends(require_role("owner", "operator")),
    db: Session = Depends(get_db)
):
    fuel_log = FuelLog(
        tractor_id=data.tractorId,
        operator_id=current_user.id,
        operation_id=data.operationId,
        quantity=data.quantity,
        notes=data.notes,
        timestamp=datetime.now()
    )
    db.add(fuel_log)
    db.commit()
    db.refresh(fuel_log)
    return model_to_dict(fuel_log)


@app.get("/api/alerts")
async def get_alerts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    alerts = db.query(Alert).order_by(Alert.timestamp.desc()).all()
    result = []
    for alert in alerts:
        tractor = db.query(Tractor).filter(Tractor.id == alert.tractor_id).first()

        alert_dict = model_to_dict(alert)
        alert_dict["tractor"] = model_to_dict(tractor) if tractor else None
        result.append(alert_dict)
    return result


@app.post("/api/alerts")
async def create_alert(
    data: AlertCreate,
    current_user: User = Depends(require_role("owner", "operator")),
    db: Session = Depends(get_db)
):
    alert = Alert(
        tractor_id=data.tractorId,
        operation_id=data.operationId,
        alert_type=data.alertType,
        message=data.message,
        timestamp=datetime.now()
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)
    return model_to_dict(alert)


@app.post("/api/alerts/{alert_id}/resolve")
async def resolve_alert(
    alert_id: str,
    current_user: User = Depends(require_role("owner", "operator")),
    db: Session = Depends(get_db)
):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    alert.is_resolved = True
    db.commit()
    db.refresh(alert)
    return model_to_dict(alert)


@app.get("/api/reports")
async def get_reports(
    filterType: Optional[str] = None,
    date: Optional[str] = None,
    startDate: Optional[str] = None,
    endDate: Optional[str] = None,
    startTime: Optional[str] = None,
    endTime: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    now = datetime.now()

    if filterType == "day" and date:
        start = datetime.fromisoformat(date).replace(hour=0, minute=0, second=0, microsecond=0)
        end = start.replace(hour=23, minute=59, second=59, microsecond=999999)
    elif filterType == "date-range" and startDate and endDate:
        start = datetime.fromisoformat(startDate).replace(hour=0, minute=0, second=0, microsecond=0)
        end = datetime.fromisoformat(endDate).replace(hour=23, minute=59, second=59, microsecond=999999)
    elif filterType == "datetime-range" and startDate and endDate and startTime and endTime:
        start = datetime.fromisoformat(f"{startDate}T{startTime}")
        end = datetime.fromisoformat(f"{endDate}T{endTime}")
    else:
        start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        end = now.replace(hour=23, minute=59, second=59, microsecond=999999)

    operations = db.query(Operation).filter(
        and_(Operation.start_time >= start, Operation.start_time <= end)
    ).order_by(Operation.start_time.desc()).all()

    fuel_logs = db.query(FuelLog).filter(
        and_(FuelLog.timestamp >= start, FuelLog.timestamp <= end)
    ).order_by(FuelLog.timestamp.desc()).all()

    alerts = db.query(Alert).filter(
        and_(Alert.timestamp >= start, Alert.timestamp <= end)
    ).order_by(Alert.timestamp.desc()).all()

    total_hours = 0
    total_area = 0

    operation_details = []
    for op in operations:
        tractor = db.query(Tractor).filter(Tractor.id == op.tractor_id).first()
        implement = db.query(Implement).filter(Implement.id == op.implement_id).first()
        operator = db.query(User).filter(User.id == op.operator_id).first()

        start_time = op.start_time
        end_time = op.end_time or datetime.now()
        duration_hours = (end_time - start_time).total_seconds() / 3600

        working_width = implement.working_width if implement else 2
        avg_speed = 5
        area_covered = (working_width * avg_speed * duration_hours) / 10

        total_hours += duration_hours
        total_area += area_covered

        operation_details.append({
            "id": op.id,
            "operationType": op.operation_type.value,
            "tractorName": f"{tractor.manufacturer_name} {tractor.model}" if tractor else "Unknown",
            "operatorName": operator.full_name if operator else "Unknown",
            "startTime": op.start_time.isoformat() if op.start_time else None,
            "endTime": op.end_time.isoformat() if op.end_time else None,
            "duration": duration_hours,
            "areaCovered": area_covered,
        })

    fuel_total = sum(log.quantity for log in fuel_logs)
    breakdowns = len([a for a in alerts if a.alert_type == "breakdown"])

    fuel_log_details = []
    for log in fuel_logs:
        tractor = db.query(Tractor).filter(Tractor.id == log.tractor_id).first()
        fuel_log_details.append({
            "id": log.id,
            "quantity": log.quantity,
            "tractorName": tractor.registration_number if tractor else "Unknown",
            "timestamp": log.timestamp.isoformat() if log.timestamp else None,
        })

    return {
        "totalHours": total_hours,
        "totalArea": total_area,
        "fuelUsed": fuel_total,
        "breakdowns": breakdowns,
        "alerts": len(alerts),
        "operations": operation_details,
        "fuelLogs": fuel_log_details,
        "alertLogs": [{
            "id": a.id,
            "message": a.message,
            "alertType": a.alert_type,
            "timestamp": a.timestamp.isoformat() if a.timestamp else None,
            "isResolved": a.is_resolved,
        } for a in alerts],
    }


# Serve static files in production
client_build_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "dist", "public")

if os.path.exists(client_build_path):
    # Mount static assets
    assets_path = os.path.join(client_build_path, "assets")
    if os.path.exists(assets_path):
        app.mount("/assets", StaticFiles(directory=assets_path), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(request: Request, full_path: str = ""):
        # Don't serve SPA for API routes
        if full_path.startswith("api"):
            raise HTTPException(status_code=404, detail="Not found")
        
        # Try to serve the file directly
        file_path = os.path.join(client_build_path, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        
        # Serve index.html for SPA routing
        index_path = os.path.join(client_build_path, "index.html")
        if os.path.exists(index_path):
            return FileResponse(index_path)
        
        raise HTTPException(status_code=404, detail="Not found")


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", "5000"))
    print(f"Starting FastAPI server on port {port}...")
    uvicorn.run(app, host="0.0.0.0", port=port)
